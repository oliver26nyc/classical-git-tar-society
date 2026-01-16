# Done: Quiz Bowl Reset System & UI Improvements

**Date**: January 16, 2026

## Summary

Implemented a version-based quiz reset system that allows all users to retake the quiz when the question bank is updated. Also made UI improvements to the leaderboard and quiz sections.

## Features Implemented

### 1. Quiz Version Reset System (Backend)

**New Account: `QuizConfig`**
- Stores admin pubkey and current quiz version number
- PDA: `[b"quiz_config"]`
- One global instance per program

**Modified Account: `QuizState`**
- Added `quiz_version` field to track which version the user completed
- PDA now seeded by: `[b"quiz_state", user_pubkey, quiz_version_bytes]`
- Allows same user to have multiple quiz states (one per version)

**New Instructions:**
- `initialize_quiz_config` - One-time admin setup (sets admin and version=1)
- `reset_quiz_version` - Admin-only, increments version number

**Modified Instruction: `complete_quiz`**
- Now requires `quiz_config` account
- Stores current version in `quiz_state`
- Users can retake quiz when version changes

### 2. Admin Script (`backend/scripts/quiz-admin.ts`)

Commands:
```bash
yarn run quiz-admin init     # Initialize quiz config (one-time)
yarn run quiz-admin reset    # Reset version (allows retakes)
yarn run quiz-admin status   # Check current config
```

### 3. Frontend Updates (`QuizBowl.tsx`)

- Fetches quiz config to get current version
- Derives version-aware PDA for quiz state check
- Passes `quizConfig` account to `completeQuiz` call
- Displays version number in "Quiz Completed" screen
- Shows message: "When a new question bank is released, you'll be able to retake the quiz!"

### 4. UI Improvements

**Leaderboard Table** (`App.css`):
- Reduced column widths for better fit in 320px container
- Added `box-sizing: border-box` to prevent overflow
- Smaller font sizes and padding
- Column adjustments: rank (30px), label (45px), score (45px), status (65px)

**Quiz Stats Section**:
- Removed cyan border from `.quiz-stats` for cleaner look

## Files Changed

### Backend
- `programs/guitar_contest/src/lib.rs` - Added QuizConfig, modified QuizState, new instructions
- `scripts/quiz-admin.ts` - New admin script
- `package.json` - Added `quiz-admin` script

### Frontend
- `src/components/QuizBowl.tsx` - Version-aware quiz logic
- `src/App.css` - Leaderboard and quiz styling improvements
- `src/idl/guitar_contest.json` - Updated IDL
- `src/types/guitar_contest.ts` - Updated types

### Documentation
- `README.md` - Added Phase 7, Quiz Admin section, updated structures

## Workflow for Releasing New Questions

```bash
# 1. Generate new questions
cd frontend
npm run generate-quiz

# 2. Reset quiz version (allows everyone to retake)
cd ../backend
yarn run quiz-admin reset
```

## On-Chain Status

- Program deployed to devnet
- Quiz Config initialized: Version 1
- Admin: `CE9eEMGxEqR2zA5iDn1xgbksGYM8eoGbgGHssvPjnU44`

## Notes

- Leaderboard shows ALL quiz completions across all versions (historical record preserved)
- Each version reset creates new PDA slots for quiz states
- Old quiz states remain on-chain but are not shown as "taken" for new versions
