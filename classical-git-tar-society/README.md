# The Classical Git'TAR Society

A decentralized platform for classical guitar performers built on Solana blockchain, featuring video submissions, community voting, and token-based rewards.

## 🎯 Project Overview

The Classical Git'Tar Society is a Web3 application that enables classical guitar performers to submit videos, receive votes from the community, and earn TAR tokens as rewards. The platform combines a React-based frontend with a Solana smart contract (Anchor program) to create a transparent, on-chain competition system featuring six main sections: Competition, Composer Studio, Sheet Music Exchange, Lesson Hub, Discussion Forum, and Quiz Bowl.

## 🏗️ Architecture

### Frontend (guitar_app)
- **Framework**: React + TypeScript + Vite
- **Wallet Integration**: Solana Wallet Adapter
- **Network**: Solana Devnet
- **Key Features**:
  - Multi-page navigation with sidebar (6 main sections)
  - Real-time wallet connection
  - Token balance display
  - Video submission and voting interface
  - YouTube video embedding
  - Placeholder pages for future features

### Backend (guitar_contest)
- **Framework**: Anchor v0.32.1
- **Language**: Rust
- **Network**: Solana Devnet
- **Program ID**: `2Hg6qeZGBsMPDDM1RY65Ucwk5JbLrF3D3P9qdYbEfmSU`
- **Token Integration**: SPL Token (anchor-spl)

## 🪙 TAR Token Economics

**TAR Token Mint Address**: `FD2ZQ6SJxQTFo4FfvXEy6Jiw9MA3KkXXdo39THCEe6iH`

### Token Reward Structure
- **Competition**: 1 vote = 3 TAR tokens (to performer)
- **Composer Studio**: 1 published composition = 3 TAR (planned)
- **Sheet Music Exchange**: 1 sheet = 1 TAR (planned)
- **Lesson Hub**: 1 booked lesson = 3 TAR (planned)
- **Discussion Forum**: Active participation rewards (planned)
- **Quiz Bowl**: Correct answers earn TAR tokens (planned)

### Token Features
- Decimals: 9
- Automatically minted to performers upon receiving votes
- Displayed in real-time in user's wallet balance
- Tracked both on-chain (actual SPL tokens) and in UserProfile PDA (counter)

## 🎭 Platform Features

### 1. Competition (Active)
- Submit classical guitar performance videos via YouTube
- Community voting system with double-vote prevention
- Real-time vote counting
- Earn 3 TAR tokens per vote received
- Video embedding and display
- Performer profile tracking

### 2. Composer Studio (Placeholder)
- *Coming Soon*: Platform for sharing original compositions
- Planned reward: 3 TAR tokens per published composition
- Will feature composition upload and community feedback

### 3. Sheet Music Exchange (Placeholder)
- *Coming Soon*: Marketplace for sharing and exchanging sheet music
- Planned reward: 1 TAR token per sheet shared
- Will enable PDF uploads and browsing

### 4. Lesson Hub (Placeholder)
- *Coming Soon*: Book lessons with experienced guitarists
- Planned reward: 3 TAR tokens per booked lesson
- Will feature instructor profiles and scheduling

### 5. Discussion Forum (Placeholder)
- *Coming Soon*: Community discussion and knowledge sharing
- Planned reward: TAR tokens for active participation
- Will include topics, threads, and reputation system

### 6. Quiz Bowl (Placeholder)
- *Coming Soon*: Classical guitar trivia and knowledge tests
- Planned reward: TAR tokens for correct answers
- Will feature timed quizzes and leaderboards

## 🚀 Development Journey

### Phase 1: Core Competition System
1. **Initial Setup** (Anchor project initialization)
   - Created basic Solana program structure
   - Set up submission accounts with YouTube video support
   - Implemented contestant tracking

2. **Voting Mechanism**
   - Implemented vote counting system
   - Created VoteReceipt PDA to prevent double-voting
   - Used PDA seeds: `[user.key(), submission.key()]` for uniqueness

3. **Profile System**
   - Added UserProfile accounts to track user activity
   - Implemented `init_if_needed` for automatic profile creation
   - PDA seeds: `[b"profile", user.key()]`

### Phase 2: Frontend Development
1. **Basic UI Implementation**
   - React setup with Solana wallet adapter
   - Contest page with submission form
   - Video display using YouTube embeds
   - Voting interface

2. **Layout Enhancements**
   - Fixed CSS layout issues (header width vs content width)
   - Implemented 3-column grid for submission cards
   - Made submission form sticky for better UX
   - Adjusted form width to prevent header overflow

3. **Navigation System**
   - Added left sidebar navigation
   - Created 6 main tabs: Competition, Composer Studio, Sheet Music Exchange, Lesson Hub, Discussion Forum, Quiz Bowl
   - Implemented routing logic to switch between active components
   - Implemented UnderConstruction component for future pages

### Phase 3: SPL Token Integration
1. **Token Reward Planning**
   - Decided on TAR token as reward mechanism
   - Created token mint on Solana devnet
   - Defined reward structure (3 TAR per vote)

2. **Smart Contract Updates**
   - Added `anchor-spl` dependency to Cargo.toml
   - Enabled `init-if-needed` feature for automatic account creation
   - Imported SPL Token modules: `Mint`, `Token`, `TokenAccount`, `MintTo`

3. **Vote Instruction Enhancement**
   - Modified `vote()` function to mint TAR tokens
   - Added performer account validation (must match submission.contestant)
   - Implemented mint authority PDA with seed: `b"mint_authority"`
   - Added Associated Token Account creation for performers
   - Implemented CPI (Cross-Program Invocation) to SPL Token program
   - Calculated token amounts with decimal precision: `3 * 10^decimals`

4. **Mint Authority Transfer**
   - Created `transfer_mint_authority()` instruction
   - Transferred mint control from wallet to program PDA
   - This enables automated token minting without manual signatures

5. **Backfill System**
   - Created `backfill_tokens()` instruction for retroactive rewards
   - Fetches all submissions and calculates owed tokens
   - Prevents double-crediting by checking existing balances
   - Creates performer profiles and token accounts as needed

### Phase 4: Administrative Scripts
1. **transfer-mint-authority.ts**
   - One-time script to transfer mint authority to program
   - Derives mint authority PDA
   - Calls `transferMintAuthority()` instruction
   - Must be run before tokens can be minted by program

2. **backfill-tokens.ts**
   - Fetches all submissions from blockchain
   - Iterates through submissions with votes
   - Checks if tokens already credited
   - Mints tokens retroactively for existing votes
   - Added to Anchor.toml for easy execution: `anchor run backfill-tokens`

### Phase 5: Token Balance Display
1. **TokenBalance Component**
   - Created WalletBalance.tsx component
   - Derives Associated Token Account address using PDA derivation
   - Fetches account data and parses token balance (bytes 64-72)
   - Converts raw amount using decimals (divide by 10^9)
   - Auto-refreshes every 10 seconds
   - Displays balance next to wallet button: "🪙 X.XX TAR"

2. **UI Integration**
   - Added token rewards boxes to all pages
   - Shows reward rules prominently
   - Styled with cyan borders and dark backgrounds
   - Integrated balance display in header

### Phase 6: Debugging and Fixes
1. **Build Errors**
   - Fixed `init_if_needed` feature not enabled
   - Resolved PDA derivation issues with `submission.contestant` references
   - Added manual `performer` AccountInfo with constraint checking

2. **IDL Account Size Issue**
   - Old IDL account too small (1156 bytes) for updated interface (1420 bytes)
   - Closed old IDL: `anchor idl close`
   - Initialized new IDL: `anchor idl init`
   - Successfully redeployed program

3. **SOL Balance Issues**
   - Needed SOL for deployment (2.5 SOL required, had 2.3)
   - Used Solana devnet faucet to obtain additional SOL
   - Deployment successful after balance increase

4. **Script Configuration**
   - Added TypeScript scripts to Anchor.toml
   - Used `yarn run ts-node` instead of direct ts-node path
   - Updated placeholder mint addresses with actual TAR mint address

5. **Backfill Account Initialization**
   - Fixed `performer_profile` to use `init_if_needed` instead of just `mut`
   - Fixed `performer_token_account` to use `init_if_needed`
   - Both fixes necessary for performers who never interacted with app before
   - Successfully backfilled 3 TAR for 1 existing vote

## 📁 Project Structure

```
hw/
├── guitar_app/                    # React frontend
│   ├── src/
│   │   ├── App.tsx               # Main app with routing
│   │   ├── App.css               # Styles including sidebar
│   │   ├── components/
│   │   │   ├── Contest.tsx       # Competition page
│   │   │   ├── UnderConstruction.tsx  # Placeholder pages
│   │   │   └── WalletBalance.tsx # TAR token balance display
│   │   └── idl/
│   │       └── guitar_contest.json   # Generated IDL
│   └── package.json
│
├── guitar_contest/               # Anchor/Solana program
│   ├── programs/guitar_contest/
│   │   └── src/
│   │       └── lib.rs           # Smart contract code
│   ├── scripts/
│   │   ├── transfer-mint-authority.ts  # Mint authority setup
│   │   └── backfill-tokens.ts   # Retroactive token minting
│   ├── Anchor.toml              # Anchor configuration
│   └── Cargo.toml               # Rust dependencies
│
└── .gitignore                    # Git ignore patterns
```

## 🔧 Technical Implementation Details

### Smart Contract Instructions

#### 1. create_submission
```rust
pub fn create_submission(ctx: Context<CreateSubmission>, title: String, youtube_id: String)
```
- Creates new submission account
- Stores contestant pubkey, title, YouTube ID
- Initializes vote_count to 0
- Account size: 8 + 32 + (4+50) + (4+20) + 8 = 126 bytes

#### 2. vote
```rust
pub fn vote(ctx: Context<Vote>)
```
- Validates performer matches submission.contestant
- Creates VoteReceipt PDA (prevents double voting)
- Increments submission.vote_count
- Updates/creates voter and performer UserProfile
- Mints 3 TAR tokens to performer's Associated Token Account
- Uses PDA signer seeds for mint authority

#### 3. update_submission
```rust
pub fn update_submission(ctx: Context<UpdateSubmission>, new_title: String, new_youtube_id: String)
```
- Only original contestant can update
- Modifies title and YouTube ID
- Uses constraint: `submission.contestant == user.key()`

#### 4. transfer_mint_authority
```rust
pub fn transfer_mint_authority(ctx: Context<TransferMintAuthority>)
```
- One-time setup function
- Transfers mint authority from wallet to program PDA
- Authority type: `MintTokens`
- PDA seeds: `[b"mint_authority"]`

#### 5. backfill_tokens
```rust
pub fn backfill_tokens(ctx: Context<BackfillTokens>)
```
- Mints tokens based on existing vote_count
- Creates performer profile if needed
- Creates performer token account if needed
- Updates performer_profile.tar_balance
- Formula: `tar_amount = votes * 3 * 10^decimals`

### Account Structures

#### SubmissionAccount
```rust
pub struct SubmissionAccount {
    pub contestant: Pubkey,    // 32 bytes
    pub title: String,         // 4 + 50 bytes
    pub youtube_id: String,    // 4 + 20 bytes
    pub vote_count: u64,       // 8 bytes
}
```

#### UserProfile
```rust
pub struct UserProfile {
    pub authority: Pubkey,     // 32 bytes
    pub tar_balance: u64,      // 8 bytes (counter, not actual balance)
}
```

#### VoteReceipt
```rust
pub struct VoteReceipt {}  // Empty marker account
```

### PDA Derivation Patterns

1. **VoteReceipt**: `[user_pubkey, submission_pubkey]` → Prevents double voting
2. **UserProfile**: `[b"profile", user_pubkey]` → User activity tracking
3. **Mint Authority**: `[b"mint_authority"]` → Program can mint tokens
4. **Associated Token Account**: `[owner_pubkey, token_program_id, mint_pubkey]` → Standard ATA derivation

### Frontend Integration

#### Wallet Connection
```typescript
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
const { connection } = useConnection();
const wallet = useWallet();
```

#### Program Interaction
```typescript
const program = new Program<GuitarContest>(IDL as any, provider);
const tx = await program.methods
  .vote()
  .accounts({ submission: submissionPubkey, user: wallet.publicKey })
  .rpc();
```

#### Token Balance Fetching
```typescript
const [tokenAccountAddress] = await PublicKey.findProgramAddress(
  [publicKey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), TAR_MINT_ADDRESS.toBuffer()],
  ASSOCIATED_TOKEN_PROGRAM_ID
);
const accountInfo = await connection.getAccountInfo(tokenAccountAddress);
const balance = accountInfo.data.slice(64, 72).readBigUInt64LE(0) / 1e9;
```

## 🛠️ Setup and Deployment

### Prerequisites
- Node.js v18+
- Rust 1.70+
- Solana CLI 1.18+
- Anchor CLI 0.32.1
- Phantom or Solflare wallet

### Installation

```bash
# Clone repository
git clone https://github.com/oliver26nyc/classical-git-tar-society.git
cd classical-git-tar-society

# Install frontend dependencies
cd guitar_app
npm install

# Install contract dependencies
cd ../guitar_contest
yarn install

# Build Anchor program
anchor build
```

### Deployment

```bash
# Deploy to devnet
anchor deploy

# Transfer mint authority (one-time)
anchor run transfer-mint-authority

# Backfill existing votes (if needed)
anchor run backfill-tokens
```

### Running Frontend

```bash
cd guitar_app
npm run dev
```

## 🌐 Network Information

- **Network**: Solana Devnet
- **Cluster URL**: https://api.devnet.solana.com
- **Program ID**: 2Hg6qeZGBsMPDDM1RY65Ucwk5JbLrF3D3P9qdYbEfmSU
- **TAR Token Mint**: FD2ZQ6SJxQTFo4FfvXEy6Jiw9MA3KkXXdo39THCEe6iH
- **SPL Token Program**: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
- **Associated Token Program**: ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL

## 📊 Current Status

### Completed Features ✅
- [x] Video submission system
- [x] Community voting with double-vote prevention
- [x] SPL token minting on votes
- [x] Token balance display
- [x] Sidebar navigation with 6 tabs
- [x] Placeholder pages for future features
- [x] Mint authority transfer
- [x] Retroactive token rewards (backfill)
- [x] UserProfile tracking
- [x] Associated Token Account creation
- [x] Program deployment to devnet

### In Progress 🚧
- [ ] Frontend vote integration with new accounts (performer, tar_mint, etc.)
- [ ] Testing token minting with new votes

### Planned Features 📋
- [ ] Composer Studio: Composition upload and sharing
- [ ] Sheet Music Exchange: PDF marketplace with search
- [ ] Lesson Hub: Instructor profiles and booking calendar
- [ ] Discussion Forum: Threading, replies, and moderation
- [ ] Quiz Bowl: Trivia engine and scoring system
- [ ] Profile pages for performers
- [ ] Leaderboard system
- [ ] NFT badges for achievements
- [ ] Mainnet deployment

## 🐛 Known Issues and Solutions

### Issue 1: IDL Account Too Small
**Problem**: Updated program interface exceeded old IDL account size
**Solution**: Close old IDL and initialize new one
```bash
anchor idl close --program-id <PROGRAM_ID>
anchor idl init --filepath target/idl/guitar_contest.json <PROGRAM_ID>
```

### Issue 2: init_if_needed Not Working
**Problem**: Anchor feature not enabled
**Solution**: Add to Cargo.toml
```toml
anchor-lang = { version = "0.32.1", features = ["init-if-needed"] }
```

### Issue 3: Account Not Initialized in Backfill
**Problem**: Performer accounts didn't exist for first-time users
**Solution**: Changed from `#[account(mut)]` to `#[account(init_if_needed)]`

## 🔐 Security Considerations

1. **Double Voting Prevention**: VoteReceipt PDA ensures one vote per user per submission
2. **Authority Validation**: Only original contestant can update submissions
3. **Mint Authority Control**: Program controls minting, not individual users
4. **Constraint Checking**: Performer must match submission.contestant
5. **Overflow Protection**: Uses checked_add for balance updates

## 📚 Learning Resources

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [SPL Token Documentation](https://spl.solana.com/token)
- [Solana Cookbook](https://solanacookbook.com/)

## 🤝 Contributing

This is a personal learning project. Suggestions and feedback are welcome!

## 📝 License

MIT

## 👥 Authors

**hw053168**
- GitHub: [@hw053168](https://github.com/hw053168)

**oliver26nyc**
- GitHub: [@oliver26nyc](https://github.com/oliver26nyc)

- Repository: [classical-git-tar-society](https://github.com/oliver26nyc/classical-git-tar-society)

---

**Built with ❤️ using Solana and Anchor**
