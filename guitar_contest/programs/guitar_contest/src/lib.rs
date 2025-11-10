use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("2Hg6qeZGBsMPDDM1RY65Ucwk5JbLrF3D3P9qdYbEfmSU");

#[program]
pub mod guitar_contest {
    use super::*;

    /*
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
    */

    /// Instruction 1: Creates a new SubmissionAccount to host a video
    pub fn create_submission(
        ctx: Context<CreateSubmission>,
        title: String,
        youtube_id: String,
    ) -> Result<()> {
        // We get the account to create from our context
        let submission = &mut ctx.accounts.submission;

        // Set the data on the new account
        submission.contestant = ctx.accounts.user.key(); // The user who submitted it
        submission.title = title;
        submission.youtube_id = youtube_id;
        submission.vote_count = 0; // Start with 0 votes

        msg!("New submission created by: {}", ctx.accounts.user.key());
        msg!("Title: {}", submission.title);
        msg!("YouTube ID: {}", submission.youtube_id);
        Ok(())
    }

    /// Instruction 2: Allows a user to vote for a submission.
    /// This instruction uses a PDA (VoteReceipt) to prevent double voting.
    /// Now also awards 3 PEG tokens to the performer (minted from the PEG token)
    pub fn vote(ctx: Context<Vote>) -> Result<()> {
        // We get the submission account from the context and increment its vote count
        let submission = &mut ctx.accounts.submission;
        let user_profile = &mut ctx.accounts.user_profile;
        let performer_profile = &mut ctx.accounts.performer_profile;

        // If this is the first time the user is interacting,
        // their authority will be the default (all zeros). Let's set it.
        if user_profile.authority == Pubkey::default() {
            user_profile.authority = ctx.accounts.user.key();
        }
 
        // The `VoteReceipt` account is created by the `#[account(init...)]`
        // macro in the Vote context below.
        // If the user tries to vote again, the program will fail trying
        // to create this account because it already exists (PDA collision).
        submission.vote_count = submission.vote_count.checked_add(1).unwrap();
        
        // If this is the first time the PERFORMER is receiving PEG,
        // their authority will be the default (all zeros). Let's set it.
        // We get the contestant's Pubkey from the submission account.
        if performer_profile.authority == Pubkey::default() {
            performer_profile.authority = submission.contestant;
        }

        // Reward the performer with 3 PEG tokens (increment counter)
        performer_profile.peg_balance += 3;

        // Mint 3 actual PEG tokens to the performer's token account
        let peg_amount = 3 * 10u64.pow(ctx.accounts.peg_mint.decimals as u32); // Account for decimals
        
        // Create the seeds for the mint authority PDA
        let seeds = &[
            b"mint_authority".as_ref(),
            &[ctx.bumps.mint_authority],
        ];
        let signer_seeds = &[&seeds[..]];

        // Mint tokens using CPI to the SPL Token program
        let cpi_accounts = MintTo {
            mint: ctx.accounts.peg_mint.to_account_info(),
            to: ctx.accounts.performer_token_account.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        
        token::mint_to(cpi_ctx, peg_amount)?;

        msg!("Vote successful for submission: {}", submission.key());
        msg!("Total votes: {}", submission.vote_count);
        msg!("Performer {} now has {} PEG.", performer_profile.authority, performer_profile.peg_balance);
        msg!("Minted {} PEG tokens to performer's token account", peg_amount);

        Ok(())
    }

    //// --- ADD NEW FUNCTIONS FOR SUBMISSION UPDATE  ---
    pub fn update_submission(
        ctx: Context<UpdateSubmission>,
        new_title: String,
        new_youtube_id: String
    ) -> Result<()> {
        // The context already checked that the signer is the original contestant
        // so we can now safely update the data.
        let submission = &mut ctx.accounts.submission;
        submission.title = new_title;
        submission.youtube_id = new_youtube_id;

        msg!("Submission updated!");
        msg!("New Title: {}", submission.title);
        msg!("New YouTube ID: {}", submission.youtube_id);
        Ok(())
    }

    /// Instruction 3: Transfer mint authority to the program's PDA
    /// This allows the program to mint PEG tokens as rewards
    pub fn transfer_mint_authority(ctx: Context<TransferMintAuthority>) -> Result<()> {
        // Transfer the mint authority from the current authority (signer)
        // to the program's mint_authority PDA
        let cpi_accounts = token::SetAuthority {
            account_or_mint: ctx.accounts.peg_mint.to_account_info(),
            current_authority: ctx.accounts.current_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::set_authority(
            cpi_ctx,
            anchor_spl::token::spl_token::instruction::AuthorityType::MintTokens,
            Some(ctx.accounts.mint_authority.key()),
        )?;

        msg!("Mint authority transferred to program PDA: {}", ctx.accounts.mint_authority.key());
        Ok(())
    }

    /// Instruction 4: Backfill tokens for a submission based on existing votes
    /// This is useful for rewarding performers who received votes before token minting was implemented
    pub fn backfill_tokens(ctx: Context<BackfillTokens>) -> Result<()> {
        let submission = &ctx.accounts.submission;
        let performer_profile = &mut ctx.accounts.performer_profile;

        // Initialize performer profile if needed
        if performer_profile.authority == Pubkey::default() {
            performer_profile.authority = submission.contestant;
        }

        // Calculate how many tokens to mint based on vote count
        let votes = submission.vote_count;
        let peg_amount = (votes * 3) * 10u64.pow(ctx.accounts.peg_mint.decimals as u32);

        // Update the profile balance
        performer_profile.peg_balance = performer_profile.peg_balance
            .checked_add(votes * 3)
            .ok_or(ErrorCode::Overflow)?;

        // Create the seeds for the mint authority PDA
        let seeds = &[
            b"mint_authority".as_ref(),
            &[ctx.bumps.mint_authority],
        ];
        let signer_seeds = &[&seeds[..]];

        // Mint tokens using CPI to the SPL Token program
        let cpi_accounts = MintTo {
            mint: ctx.accounts.peg_mint.to_account_info(),
            to: ctx.accounts.performer_token_account.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        
        token::mint_to(cpi_ctx, peg_amount)?;

        msg!("Backfilled {} PEG tokens for {} votes", peg_amount, votes);
        msg!("Performer {} now has {} PEG balance", performer_profile.authority, performer_profile.peg_balance);

        Ok(())
    }
}

// -----------------------------------------------------------------
// 1. ACCOUNTS & CONTEXTS FOR 'create_submission'
// -----------------------------------------------------------------
#[derive(Accounts)]
pub struct CreateSubmission<'info> {
    // This creates (initializes) a new account.
    // We are defining its space: 8 bytes for the "discriminator"
    // + 32 for the contestant's Pubkey
    // + (4 + 50) for the title string (max 50 chars)
    // + (4 + 20) for the YouTube ID string (max 20 chars)
    // + 8 for the vote_count (u64)
    #[account(
        init,
        payer = user,
        space = 8 + 32 + (4 + 50) + (4 + 20) + 8 
    )]
    pub submission: Account<'info, SubmissionAccount>,

    // The 'user' is the person paying for the account's rent
    #[account(mut)]
    pub user: Signer<'info>,
    
    // The System Program is required by Solana to create new accounts
    pub system_program: Program<'info, System>,
}

// This is the data structure for our SubmissionAccount
#[account]
pub struct SubmissionAccount {
    pub contestant: Pubkey,
    pub title: String,
    pub youtube_id: String,
    pub vote_count: u64,
}

// -----------------------------------------------------------------
// 2. ACCOUNTS & CONTEXTS FOR 'vote'
// -----------------------------------------------------------------
#[derive(Accounts)]
#[instruction()]
pub struct Vote<'info> {
    // We mark the submission as 'mut' because we are changing its `vote_count`
    #[account(mut)]
    pub submission: Account<'info, SubmissionAccount>,

    // This is our "vote-once" PDA receipt.
    // It's an empty account that we create.
    // Its unique address (PDA) is "derived" from two "seeds":
    // 1. The user's public key
    // 2. The submission's public key
    // This means a specific user can only create this account ONCE
    // for a specific submission.
    //
    #[account(
        init,
        payer = user,
        space = 8, // 8 bytes for the discriminator
        seeds = [user.key().as_ref(), submission.key().as_ref()],
        bump
    )]
    pub vote_receipt: Account<'info, VoteReceipt>,

    // The voter's profile (for tracking purposes)
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 32 + 8,
        seeds = [b"profile", user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    /// The performer (contestant) - must match submission.contestant
    /// CHECK: Verified via constraint
    #[account(constraint = performer.key() == submission.contestant)]
    pub performer: AccountInfo<'info>,

    // The profile account for the PERFORMER
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 32 + 8,
        seeds = [b"profile", performer.key().as_ref()],
        bump
    )]
    pub performer_profile: Account<'info, UserProfile>,

    // The PEG token mint account
    #[account(mut)]
    pub peg_mint: Account<'info, Mint>,

    // The performer's associated token account for PEG tokens
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = peg_mint,
        associated_token::authority = performer,
    )]
    pub performer_token_account: Account<'info, TokenAccount>,

    // The mint authority PDA that can mint PEG tokens
    /// CHECK: This is a PDA used as the mint authority
    #[account(
        seeds = [b"mint_authority"],
        bump
    )]
    pub mint_authority: AccountInfo<'info>,

    // The 'user' is the voter
    #[account(mut)]
    pub user: Signer<'info>,

    // Required programs
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

//// --- ADD NEW STRUCT FOR SUBMISSION UPDATE  ---
// -----------------------------------------------------------------
// 3. ACCOUNTS & CONTEXTS FOR 'update_submission'
// -----------------------------------------------------------------
#[derive(Accounts)]
pub struct UpdateSubmission<'info> {
    // We must check that the person signing this transaction
    // is the *same person* who created the submission.
    // We use a constraint to check the 'contestant' field on the
    // submission account against the 'user' (signer).
    // [cite: 5859-5867, 5905-5907, 5973-5976]
    #[account(
        mut,
        constraint = submission.contestant == user.key() @ ErrorCode::NotContestant
    )]
    pub submission: Account<'info, SubmissionAccount>,

    #[account(mut)]
    pub user: Signer<'info>,
}

//// --- NEW STRUCTS AND CONTEXTS ---
// -----------------------------------------------------------------
// 4. ACCOUNTS FOR PEG TOKENS 
// -----------------------------------------------------------------

// This is the new account that holds a user's PEG balance
#[account]
pub struct UserProfile {
    pub authority: Pubkey,
    pub peg_balance: u64,
}

// This is a generic context for any function that just needs to
// create or modify a user's PEG balance.
#[derive(Accounts)]
pub struct ManagePegs<'info> {
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 32 + 8, // 8(disc) + 32(authority) + 8(peg_balance)
        seeds = [b"profile", user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
// --- END NEW ---


//// --- ADD THIS NEW ERROR CODE ---
#[error_code]
pub enum ErrorCode {
    #[msg("Only the original contestant can update this submission.")]
    NotContestant,
    #[msg("Arithmetic overflow occurred.")]
    Overflow,
}

// -----------------------------------------------------------------
// 5. ACCOUNTS & CONTEXTS FOR 'transfer_mint_authority'
// -----------------------------------------------------------------
#[derive(Accounts)]
pub struct TransferMintAuthority<'info> {
    // The PEG token mint account
    #[account(mut)]
    pub peg_mint: Account<'info, Mint>,

    // The current mint authority (must sign this transaction)
    pub current_authority: Signer<'info>,

    // The mint authority PDA that will become the new mint authority
    /// CHECK: This is a PDA that will become the mint authority
    #[account(
        seeds = [b"mint_authority"],
        bump
    )]
    pub mint_authority: AccountInfo<'info>,

    // The Token program
    pub token_program: Program<'info, Token>,
}

// -----------------------------------------------------------------
// 6. ACCOUNTS & CONTEXTS FOR 'backfill_tokens'
// -----------------------------------------------------------------
#[derive(Accounts)]
pub struct BackfillTokens<'info> {
    // The submission account (read-only to get vote count)
    pub submission: Account<'info, SubmissionAccount>,

    /// The performer (contestant) - must match submission.contestant
    /// CHECK: Verified via constraint
    #[account(constraint = performer.key() == submission.contestant)]
    pub performer: AccountInfo<'info>,

    // The performer's profile
    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + 32 + 8,
        seeds = [b"profile", performer.key().as_ref()],
        bump
    )]
    pub performer_profile: Account<'info, UserProfile>,

    // The PEG token mint account
    #[account(mut)]
    pub peg_mint: Account<'info, Mint>,

    // The performer's associated token account for PEG tokens
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = peg_mint,
        associated_token::authority = performer,
    )]
    pub performer_token_account: Account<'info, TokenAccount>,

    // The mint authority PDA
    /// CHECK: This is a PDA used as the mint authority
    #[account(
        seeds = [b"mint_authority"],
        bump
    )]
    pub mint_authority: AccountInfo<'info>,

    // The payer (you, the admin)
    #[account(mut)]
    pub payer: Signer<'info>,

    // Required programs
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}



// This is the data structure for our receipt (it's empty)
#[account]
pub struct VoteReceipt {}

/*
#[derive(Accounts)]
pub struct Initialize {}
*/
