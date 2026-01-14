# Implementation Plan: Quiz Bowl Tab

## Phase 1: Solana Program (Backend)
- [x] **Define Data Structures**:
    - [x] Create `QuizState` struct in `lib.rs` (or a new module) to track user progress (e.g., questions answered, total score).
    - [x] Define `SubmitAnswer` context with necessary accounts (`quiz_state`, `user`, `tar_mint`, `token_account`, `mint_authority`, etc.).
- [x] **Implement Instructions**:
    - [x] `submit_answer`:
        - [x] Verify the answer (compare input against a hash or expected value).
        - [x] Update `QuizState` (mark question as answered).
        - [x] Mint TAR tokens to the user if correct (using PDA signer).
- [ ] **Tests**:
    - [ ] Write tests in `tests/guitar_contest.ts` to verify `submit_answer` logic, token minting, and error handling (e.g., wrong answer, double submission).
- [ ] **Deployment**:
    - [x] Build and deploy the updated program to Devnet.
    - [ ] Update the `IDL` file in the frontend `src/idl/`.
    - [ ] Update the `guitar_contest.ts` type definition in `src/types/`.

## Phase 2: Frontend Implementation
- [x] **Component Structure**:
    - [x] Create `src/components/QuizBowl.tsx`.
    - [x] Scaffold the component with `useConnection`, `useWallet`, and `Program` setup (copying pattern from `Contest.tsx`).
- [x] **UI Development**:
    - [x] Design the Quiz Interface:
        - [x] Display question text/media.
        - [x] Input field or multiple-choice buttons for answers.
        - [x] "Submit Answer" button.
    - [x] Display user stats (current score, tokens earned this session).
- [x] **Integration**:
    - [x] Implement `submitAnswer` function in `QuizBowl.tsx` calling the program instruction.
    - [x] Handle transaction lifecycle (signing, sending, confirming).
    - [x] Update UI based on success/failure (toast notifications, score update).
- [x] **App Navigation**:
    - [x] Update `App.tsx` (already done basically) to import and render `QuizBowl` component instead of `UnderConstruction`.

## Phase 3: Polish & Verification
- [ ] **Testing**:
    - [ ] Test the full flow on Devnet with a real wallet.
    - [ ] Verify token balance updates in `WalletBalance.tsx`.
- [x] **Styling**:
    - [x] Ensure CSS matches existing `App.css` and `Contest.tsx` styles.
