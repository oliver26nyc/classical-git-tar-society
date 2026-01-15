# Implementation Plan: Quiz Bowl Question Bank

**Date:** 2026-01-15  
**Related Requirement:** [req-quiz-bowl-question-bank.md](../../req/2026-01-15/req-quiz-bowl-question-bank.md)

---

## Architecture Overview

**Split-Stack Architecture:**

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Offline (Build-time)** | Node.js Script | Calls Gemini API, validates responses, saves to static JSON |
| **Online (Runtime)** | React Frontend | Imports static JSON, randomly selects questions for each session |

This approach eliminates runtime API latency and prevents API key exposure in the browser.

---

## Data Schema

**File:** `frontend/src/data/question_bank.json`

```json
{
  "version": "1.0",
  "generatedAt": "2026-01-15T12:00:00Z",
  "categories": ["composers_works", "technique_terminology", "history_luthiers", "anatomy_tuning", "famous_interpreters"],
  "questions": [
    {
      "id": 1,
      "category": "composers_works",
      "question": "Who composed 'Recuerdos de la Alhambra'?",
      "options": ["Isaac Albéniz", "Francisco Tárrega", "Fernando Sor", "Heitor Villa-Lobos"],
      "correctIndex": 1
    }
  ]
}
```

---

## Implementation Phases

### Phase 1: Setup & Dependencies

- [ ] **1.1** Install Google Generative AI SDK in frontend
  - `npm install @google/generative-ai`

- [ ] **1.2** Create `.env` file in frontend directory
  - Add `VITE_GEMINI_API_KEY=your_api_key_here`
  - Ensure `.env` is in `.gitignore`

- [ ] **1.3** Create data directory structure
  - `frontend/src/data/` folder for question bank JSON

---

### Phase 2: Question Generator Script

- [ ] **2.1** Create generator script at `frontend/scripts/generate-questions.ts`
  - Import `GoogleGenerativeAI` from SDK
  - Configure Gemini model (gemini-1.5-flash or gemini-pro)

- [ ] **2.2** Implement prompt engineering
  - System instruction: "Return ONLY a raw JSON array"
  - Define question structure in prompt
  - Request questions for all 5 categories

- [ ] **2.3** Implement response sanitization
  - Strip Markdown code blocks (` ```json `) before parsing
  - Validate JSON structure
  - Assign sequential IDs (1, 2, 3...)

- [ ] **2.4** Implement file output
  - Write validated questions to `frontend/src/data/question_bank.json`
  - Add metadata (version, generatedAt timestamp)

- [ ] **2.5** Add npm script to run generator
  - Add to `package.json`: `"generate:questions": "npx tsx scripts/generate-questions.ts"`

---

### Phase 3: Frontend Integration

- [ ] **3.1** Create Question type interface
  - `frontend/src/types/quiz.ts` with `Question` and `QuestionBank` types

- [ ] **3.2** Create question loading utility
  - `frontend/src/utils/questionLoader.ts`
  - Function to import and shuffle questions
  - Function to select random subset per session

- [ ] **3.3** Update `QuizBowl.tsx`
  - Remove hardcoded `QUESTIONS` array
  - Import questions from `question_bank.json`
  - Add `useState<Question[]>([])` for questions
  - Add `loadingQuestions` state for UI feedback

- [ ] **3.4** Add loading UI
  - Display spinner/message while questions load
  - Handle empty question bank gracefully

---

### Phase 4: Error Handling & Fallback

- [ ] **4.1** Create fallback questions file
  - `frontend/src/data/fallback_questions.json` with sample questions
  - Used if primary question bank fails to load

- [ ] **4.2** Implement error boundaries
  - Graceful degradation if JSON import fails
  - User-friendly error messages

---

### Phase 5: Testing & Validation

- [ ] **5.1** Run generator script and verify output
  - Check all 5 categories have questions
  - Validate JSON structure

- [ ] **5.2** Test QuizBowl component
  - Verify questions load correctly
  - Test answer selection and scoring
  - Confirm TAR token rewards still function

- [ ] **5.3** Test edge cases
  - Empty question bank
  - Malformed JSON
  - Missing categories

---

## File Changes Summary

| Action | File |
|--------|------|
| Create | `frontend/.env` |
| Create | `frontend/src/data/question_bank.json` |
| Create | `frontend/src/data/fallback_questions.json` |
| Create | `frontend/src/types/quiz.ts` |
| Create | `frontend/src/utils/questionLoader.ts` |
| Create | `frontend/scripts/generate-questions.ts` |
| Modify | `frontend/package.json` (add dependency + script) |
| Modify | `frontend/src/components/QuizBowl.tsx` |
| Modify | `frontend/.gitignore` (add .env) |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@google/generative-ai` | latest | Gemini API SDK |
| `tsx` | latest (devDep) | Run TypeScript scripts directly |

---

## Estimated Effort

| Phase | Time |
|-------|------|
| Phase 1: Setup | 15 min |
| Phase 2: Generator Script | 45 min |
| Phase 3: Frontend Integration | 30 min |
| Phase 4: Error Handling | 15 min |
| Phase 5: Testing | 20 min |
| **Total** | **~2 hours** |
