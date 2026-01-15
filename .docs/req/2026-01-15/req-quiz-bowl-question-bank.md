# Requirements: Quiz Bowl Question Bank

**Date:** 2026-01-15  
**Status:** Draft  
**Component:** Frontend - QuizBowl

---

## Overview

Replace the hardcoded questions in the Quiz Bowl component with a dynamically generated question bank fetched from the Gemini API (Google Generative AI SDK). Questions should be preloaded at build time and bundled as a static JSON file for production use.

---

## Functional Requirements

### FR-1: Question Categories

The question bank must include questions from the following classical guitar categories:

| Category | Focus | Example Question |
|----------|-------|------------------|
| **Composers & Works** | Identifying famous works and their composers (Bach, Villa-Lobos, Tárrega, Sor) | "Who composed 'Recuerdos de la Alhambra'?" |
| **Technique & Terminology** | Technical terms for playing mechanisms and musical notation specific to the guitar | "What is the term for plucking a string where the finger rests on the adjacent string after striking?" |
| **Guitar History & Luthiers** | Evolution of the instrument, famous guitar makers (Torres, Hauser), historical milestones | "Which luthier is credited with establishing the design of the modern classical guitar in the 19th century?" |
| **Anatomy & Tuning** | Physical construction of the guitar (woods, parts) and string relationships | "What is the interval relationship between the 2nd (B) and 3rd (G) strings in standard tuning?" |
| **Famous Interpreters** | Legendary performers who popularized the instrument (Segovia, Bream, Williams) and modern virtuosos | "Which guitarist is famous for their collaboration with composer Benjamin Britten on 'Nocturnal after John Dowland'?" |

### FR-2: Question Format

Each question must include:
- Unique identifier
- Question text
- Category label
- Multiple choice options (4 options)
- Correct answer indicator

### FR-3: Question Generation

- Questions should be generated using the Gemini API via the Google Generative AI SDK
- Questions should be fetched client-side when the QuizBowl component mounts
- The system must handle API failures gracefully with appropriate error messaging

### FR-4: Question Bank Size

- Minimum of 10-20 questions per category
- Total question bank: 50-100 questions

---

## Non-Functional Requirements

### NFR-1: Performance

- Questions should load within 3 seconds of component mount
- Loading state must be displayed while fetching questions

### NFR-2: Reliability

- Fallback to cached/static questions if API call fails
- Retry mechanism for transient failures

### NFR-3: Security

- API key must be stored securely in environment variables
- API key must not be exposed in client-side bundle (consider proxy or build-time generation)

---

## Out of Scope

- Backend (Solana smart contract) modifications - smart contracts cannot make HTTP calls
- Real-time multiplayer question synchronization
- User-submitted questions

---

## Acceptance Criteria

1. [ ] QuizBowl component loads questions from Gemini API instead of hardcoded array
2. [ ] All 5 question categories are represented in the question bank
3. [ ] Loading indicator displays while questions are being fetched
4. [ ] Error handling displays user-friendly message on API failure
5. [ ] Questions are properly formatted with IDs compatible with existing answer tracking logic
6. [ ] API key is stored in `.env` file and not committed to version control
