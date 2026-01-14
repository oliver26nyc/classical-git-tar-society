import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { GuitarContest } from "../target/types/guitar_contest";

// !! REPLACE THIS WITH YOUR ACTUAL TAR TOKEN MINT ADDRESS !!
const TAR_MINT_ADDRESS = new PublicKey("FD2ZQ6SJxQTFo4FfvXEy6Jiw9MA3KkXXdo39THCEe6iH");

const PROGRAM_ID = new PublicKey("2Hg6qeZGBsMPDDM1RY65Ucwk5JbLrF3D3P9qdYbEfmSU");
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

async function backfillTokens() {
  // Set up the provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Load the program
  const program = anchor.workspace.GuitarContest as Program<GuitarContest>;

  console.log("Program ID:", program.programId.toString());
  console.log("Your wallet:", provider.wallet.publicKey.toString());
  console.log("TAR Mint:", TAR_MINT_ADDRESS.toString());

  // Derive the mint authority PDA
  const [mintAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint_authority")],
    program.programId
  );

  console.log("\nFetching all submissions...");

  // Fetch all submission accounts
  const submissions = await program.account.submissionAccount.all();

  console.log(`Found ${submissions.length} submission(s)\n`);

  if (submissions.length === 0) {
    console.log("No submissions to backfill.");
    return;
  }

  // Process each submission
  for (const submission of submissions) {
    const voteCount = submission.account.voteCount.toNumber();
    const performer = submission.account.contestant;

    console.log(`\n--- Processing Submission ---`);
    console.log(`Address: ${submission.publicKey.toString()}`);
    console.log(`Title: ${submission.account.title}`);
    console.log(`Performer: ${performer.toString()}`);
    console.log(`Votes: ${voteCount}`);

    if (voteCount === 0) {
      console.log("⏭️  Skipping (no votes)");
      continue;
    }

    // Derive performer's profile PDA
    const [performerProfile] = PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), performer.toBuffer()],
      program.programId
    );

    // Derive performer's associated token account
    const [performerTokenAccount] = PublicKey.findProgramAddressSync(
      [
        performer.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        TAR_MINT_ADDRESS.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    console.log(`Performer profile PDA: ${performerProfile.toString()}`);
    console.log(`Performer token account: ${performerTokenAccount.toString()}`);

    // Check if performer profile already exists and has been credited
    try {
      const profileAccount = await program.account.userProfile.fetch(performerProfile);
      const currentBalance = profileAccount.tarBalance.toNumber();
      
      if (currentBalance >= voteCount * 3) {
        console.log(`⏭️  Already backfilled (balance: ${currentBalance} TAR)`);
        continue;
      }
    } catch (err) {
      // Profile doesn't exist yet, that's fine
      console.log("Profile not found, will be created");
    }

    try {
      console.log(`🪙 Backfilling ${voteCount * 3} TAR tokens...`);

      const tx = await program.methods
        .backfillTokens()
        .accounts({
          submission: submission.publicKey,
          performer: performer,
          tarMint: TAR_MINT_ADDRESS,
          payer: provider.wallet.publicKey,
        })
        .rpc();

      console.log(`✅ Success! Transaction: ${tx}`);
      console.log(`   View: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    } catch (error: any) {
      console.error(`❌ Error backfilling:`, error.message || error);
      console.log("Continuing with next submission...");
    }
  }

  console.log("\n🎉 Backfill process complete!");
}

backfillTokens()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
