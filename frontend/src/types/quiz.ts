/**
 * Quiz Bowl Type Definitions
 */

// Single quiz question from the question bank
export interface Question {
  id: string;                    // e.g., "q_1" or "composers_works_1"
  category: string;              // e.g., "composers_works"
  categoryName: string;          // e.g., "Composers & Masterpieces"
  question: string;              // The question text
  options: [string, string, string, string]; // Exactly 4 options
  correctIndex: 0 | 1 | 2 | 3;   // Index of correct answer
}

// The question bank is a flat array of questions
export type QuestionBank = Question[];

// Category definition (for display purposes)
export interface Category {
  id: string;
  name: string;
}

// All available categories
export const CATEGORIES: Category[] = [
  { id: "composers_works", name: "Composers & Masterpieces" },
  { id: "technique_terminology", name: "Technique & Terminology" },
  { id: "history_luthiers", name: "Guitar History & Luthiers" },
  { id: "anatomy_tuning", name: "Anatomy & Tuning" },
  { id: "famous_interpreters", name: "Famous Interpreters" },
];
