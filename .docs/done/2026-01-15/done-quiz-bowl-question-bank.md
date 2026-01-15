# Done: Quiz Bowl Question Bank

**Date:** 2026-01-15  
**Related Requirement:** [req-quiz-bowl-question-bank.md](../../req/2026-01-15/req-quiz-bowl-question-bank.md)  
**Related Plan:** [plan-quiz-bowl-question-bank.md](../../plan/2026-01-15/plan-quiz-bowl-question-bank.md)

---

## Summary

Implemented a dynamic question generation system for the Quiz Bowl component using the Gemini API. Questions are generated at build time and bundled as a static JSON file, with frontend randomization for each quiz session.

---

## What Was Implemented

### 1. Question Generator Script

**File:** `frontend/scripts/generate_bank.mjs`

- Calls Gemini API (`gemini-2.5-flash`) to generate quiz questions
- Loops through 5 classical guitar categories with detailed prompts
- Validates responses (4 options, correctIndex 0-3)
- Sanitizes JSON output (strips markdown code blocks)
- **Accumulates questions** - never overwrites, only adds new unique questions
- Deduplicates by question text (case-insensitive)
- Outputs to `frontend/src/data/question_bank.json`

### 2. Question Categories

| Category | Focus |
|----------|-------|
| Composers & Masterpieces | Bach, Villa-Lobos, Tárrega, Sor, Rodrigo |
| Technique & Terminology | Apoyando, tremolo, rasgueado, p-i-m-a notation |
| Guitar History & Luthiers | Torres, Hauser, instrument evolution |
| Anatomy & Tuning | Tonewoods, string materials, intervals |
| Famous Interpreters | Segovia, Bream, Williams, modern virtuosos |

### 3. Frontend Integration

**File:** `frontend/src/components/QuizBowl.tsx`

- Removed hardcoded `QUESTIONS` array
- Imports questions from `question_bank.json`
- Fisher-Yates shuffle algorithm for randomization
- Selects 5 random questions per quiz session via `useEffect`
- Questions randomized on component mount

### 4. Type Definitions

**File:** `frontend/src/types/quiz.ts`

```typescript
interface Question {
  id: string;
  category: string;
  categoryName: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
}
```

### 5. Environment Configuration

- API key stored in `frontend/.env` as `VITE_GEMINI_API_KEY`
- Script reads `.env` via Node's `--env-file` flag
- `.env.example` template provided

### 6. Utility Script

**File:** `frontend/scripts/list_models.mjs`

- Lists available Gemini models for the API key
- Useful for debugging model availability issues

---

## Files Created/Modified

| Action | File |
|--------|------|
| Created | `frontend/scripts/generate_bank.mjs` |
| Created | `frontend/scripts/list_models.mjs` |
| Created | `frontend/src/types/quiz.ts` |
| Created | `frontend/src/data/question_bank.json` |
| Created | `frontend/.env` |
| Created | `frontend/.env.example` |
| Modified | `frontend/src/components/QuizBowl.tsx` |
| Modified | `frontend/package.json` (added scripts + dependency) |

---

## Usage

### Generate Questions
```bash
cd frontend
npm run generate:questions
```

### Check Available Models
```bash
node --env-file=.env scripts/list_models.mjs
```

### Run Frontend
```bash
npm run dev
```

---

## Dependencies Added

| Package | Purpose |
|---------|---------|
| `@google/generative-ai` | Gemini API SDK |

---

## Notes

- Questions accumulate over multiple runs (no data loss)
- Duplicate questions are automatically filtered
- Rate limiting: 35s delay between API calls for Pro models
- Total runtime for 5 categories: ~3 minutes
