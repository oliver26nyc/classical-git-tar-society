# Requirement: Quiz Bowl Tab

## Overview
Create a new tab in the application labeled "Quiz Bowl" that allows users to answer guitar-related questions and earn TAR tokens for correct answers. This feature must follow the architectural pattern of the existing Guitar Contest (Solana program, Anchor, SPL Token integration).

## Functional Requirements
1.  **Navigation**:
    *   Add "Quiz Bowl" to the main navigation (already present in UI).
    *   Ensure proper routing/rendering of the `QuizBowl` component.

2.  **Quiz Mechanics (On-Chain)**:
    *   Users connect their wallet to participate.
    *   **Answer Submission**: Users submit answers via a Solana transaction.
    *   **Verification**: The Solana program verifies the answer (e.g., matching a hash or index).
    *   **Rewards**: 
        *   Correct answers trigger a TAR token mint.
        *   The program must use a PDA (Program Derived Address) as the mint authority (similar to the Contest's `vote` instruction).
        *   Token Balance should update in the UI immediately.

3.  **Data Structure (Solana)**:
    *   Store user progress/stats on-chain (e.g., `QuizState` account).
    *   Prevent replay attacks (cannot answer the same question twice for rewards).

## Technical Requirements (Pattern Matching)
*   **Framework**: Use Anchor for the Solana program (`guitar_contest` crate or a new module).
*   **Token Integration**: Interact with the existing TAR Token Mint.
*   **Frontend**: 
    *   Create `src/components/QuizBowl.tsx`.
    *   Use `@solana/wallet-adapter-react` for wallet connection.
    *   Use `@coral-xyz/anchor` for program interaction.
    *   Replicate the `useConnection`, `useWallet`, `Program<T>` pattern used in `Contest.tsx`.

## Non-Functional Requirements
*   Smooth transaction feedback (Loading states, Success/Error notifications).
*   Consistent UI styling with `App.css`.

## Questions/Notes
*   Should the questions be stored on-chain or off-chain? (Assumption: Questions off-chain/hardcoded for now, Answers validated on-chain).
