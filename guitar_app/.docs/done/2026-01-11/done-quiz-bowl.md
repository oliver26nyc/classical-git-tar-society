# Done: Quiz Bowl Tab

## Summary
Implemented a fully functional Quiz Bowl tab that allows users to answer classical guitar trivia questions and earn TAR tokens for correct answers. The feature follows the existing Guitar Contest architectural pattern (Solana/Anchor + React).

## Changes Made

### Solana Program (`guitar_contest/programs/guitar_contest/src/lib.rs`)
- **New Data Structures**:
  - `QuizState`: Tracks user quiz progress (questions answered, correct answers, last question ID)
  - `QuizAnswerReceipt`: PDA-based receipt to prevent double-answering the same question
- **New Instruction**:
  - `submit_quiz_answer(question_id, answer_hash)`: Verifies the answer and mints 2 TAR tokens for correct answers using the existing mint authority PDA

### Frontend (`guitar_app/`)

#### New Files
- `src/components/QuizBowl.tsx`: Main quiz component with:
  - 5 sample classical guitar trivia questions
  - Multiple-choice answer selection
  - On-chain answer submission
  - Real-time stats display (questions answered, correct answers, TAR earned)
  - Graceful fallback for local-only mode when program not deployed

#### Modified Files
- `src/App.tsx`: Added import and routing for `QuizBowl` component
- `src/App.css`: Added comprehensive Quiz Bowl styling (~150 lines)

## Token Rewards
- Correct answer: **2 TAR tokens** (minted via PDA signer)

## Architecture Pattern
Followed the existing `Contest.tsx` pattern:
- `useConnection` + `useWallet` hooks
- `Program<GuitarContest>` via Anchor
- PDA derivation for user state
- Transaction lifecycle handling with loading states and error feedback

## Remaining Steps
1. Deploy updated program to Devnet: `anchor deploy --provider.cluster devnet`
2. Copy IDL/types to frontend:
   ```bash
   cp target/idl/guitar_contest.json ../guitar_app/src/idl/
   cp target/types/guitar_contest.ts ../guitar_app/src/types/
   ```
3. End-to-end testing with connected wallet
