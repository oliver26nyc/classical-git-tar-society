# Copilot Instructions for Classical Git'TAR Society

This project is a Solana-based decentralized application for classical guitarists. It consists of a React frontend and an Anchor-based Solana program.

## 🏗️ Architecture & Project Structure

*   **Monorepo Structure**:
    *   `guitar_app/`: Frontend application (React + Vite + TypeScript).
    *   `guitar_contest/`: Backend smart contract (Solana Anchor Framework + Rust).
    *   `scripts/`: Admin and utility scripts (TypeScript).

*   **Frontend (`guitar_app`)**:
    *   **Stack**: React, TypeScript, Vite, `@solana/wallet-adapter-react`, `@coral-xyz/anchor`.
    *   **Styling**: Standard CSS (avoid Tailwind unless explicitly requested).
    *   **State Management**: React `useState`/`useEffect` + Wallet Adapter Context.
    *   **Navigation**: Custom sidebar navigation switching between components (Competition, Composer Studio, Sheet Music Exchange, Lesson Hub, Discussion Forum, Quiz Bowl).

*   **Backend (`guitar_contest`)**:
    *   **Stack**: Anchor v0.32.1 on Solana.
    *   **Token**: TAR Token (SPL Token).
    *   **Program ID**: `2Hg6qeZGBsMPDDM1RY65Ucwk5JbLrF3D3P9qdYbEfmSU` (Devnet).
    *   **Mint Address**: `FD2ZQ6SJxQTFo4FfvXEy6Jiw9MA3KkXXdo39THCEe6iH` (Devnet).

## 🔄 Critical Workflows & Integration

### IDL Synchronization
When updating the Anchor program:
1.  Run `anchor build` in `guitar_contest/`.
2.  **CRITICAL**: Copy generated artifacts to frontend to keep them in sync.
    *   `cp guitar_contest/target/idl/guitar_contest.json guitar_app/src/idl/guitar_contest.json`
    *   `cp guitar_contest/target/types/guitar_contest.ts guitar_app/src/types/guitar_contest.ts`
3.  Frontend components import IDL from local `src/idl/` and types from `src/types/`.

### Development
*   **Frontend**: `cd guitar_app && npm run dev` (Runs on port 5173).
*   **Backend**: `cd guitar_contest && anchor build`.
*   **Deployment**: `cd guitar_contest && anchor deploy`.

## 🧩 Key Patterns & Conventions

### Solana & Anchor Patterns
*   **PDA Seeds**:
    *   `VoteReceipt`: `[user.key(), submission.key()]` (Prevents double voting).
    *   `UserProfile`: `[b"profile", user.key()]` (User activity/balance tracking).
    *   `MintAuthority`: `[b"mint_authority"]` (PDA controlling token minting).
*   **Account Initialization**: Use `init_if_needed` for UserProfile accounts to auto-create profiles for new users during interactions.
*   **Token Minting**: Done via Cross-Program Invocation (CPI) to SPL Token program within instructions like `vote`.

### Frontend Patterns
*   **Wallet Connection**: Use `useWallet()` from `@solana/wallet-adapter-react`.
*   **Program Access**: Instantiate program using `new Program<GuitarContest>(IDL, provider)`.
*   **Balance Display**: `TokenBalance` component fetches ATA data directly (offset 64-72) for real-time updates. Avoid generic `getParsedAccountInfo` where raw data parsing is faster/simpler for this specific use case.

## ⚠️ Gotchas & Specifics
*   **Token Name**: The token is **TAR**. (Formerly PEG, ensure no regressions to PEG naming).
*   **Decimals**: TAR token has 9 decimals. Always calculate amounts as `amount * 10^9`.
*   **Environment**: Currently configured for **Solana Devnet**.
*   **Dependencies**: Ensure `anchor-spl` features (`metadata`, etc.) match `Cargo.toml`.
