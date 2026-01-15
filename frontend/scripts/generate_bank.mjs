/**
 * Quiz Question Bank Generator
 * 
 * Generates classical guitar quiz questions using the Gemini API.
 * Run: npm run generate:questions
 * 
 * Prerequisites:
 *   Add VITE_GEMINI_API_KEY=your_key to frontend/.env
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_PATH = join(__dirname, "../src/data/question_bank.json");

// Configuration
const QUESTIONS_PER_CATEGORY = 10;
const MODEL_NAME = "gemini-2.5-flash"; // Pro for higher quality questions

// Rate limit helper for Gemini Pro (2 RPM limit)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const RATE_LIMIT_DELAY = 35000; // 35 seconds between requests

// Category definitions with prompts
const CATEGORIES = [
  {
    id: "composers_works",
    name: "Composers & Masterpieces",
    prompt: `Generate ${QUESTIONS_PER_CATEGORY} multiple-choice quiz questions about classical guitar composers and their famous works.
    
Focus on:
- Identifying famous works and their composers (Bach, Villa-Lobos, Tárrega, Sor, Barrios, Giuliani, Albéniz, Rodrigo)
- Matching pieces to composers (e.g., "Recuerdos de la Alhambra", "Asturias", "Concierto de Aranjuez", "Chaconne")
- Historical context of compositions
- Opus numbers and suite names

Example question style:
"Who composed 'Recuerdos de la Alhambra'?"
Options: ["Isaac Albéniz", "Francisco Tárrega", "Fernando Sor", "Heitor Villa-Lobos"]
Correct: 1 (Francisco Tárrega)`
  },
  {
    id: "technique_terminology",
    name: "Technique & Terminology",
    prompt: `Generate ${QUESTIONS_PER_CATEGORY} multiple-choice quiz questions about classical guitar technique and musical terminology.
    
Focus on:
- Right-hand techniques: apoyando (rest stroke), tirando (free stroke), tremolo, rasgueado, picado, alzapúa
- Left-hand techniques: slurs (hammer-ons/pull-offs), barré, vibrato, harmonics
- Finger notation: p-i-m-a for right hand, 1-2-3-4 for left hand
- Musical terms specific to guitar: campanella, tambora, golpe
- Dynamics, tempo markings, and articulation

Example question style:
"What is the term for plucking a string where the finger rests on the adjacent string after striking?"
Options: ["Tirando", "Apoyando", "Picado", "Rasgueado"]
Correct: 1 (Apoyando)`
  },
  {
    id: "history_luthiers",
    name: "Guitar History & Luthiers",
    prompt: `Generate ${QUESTIONS_PER_CATEGORY} multiple-choice quiz questions about classical guitar history and famous luthiers.
    
Focus on:
- Evolution of the instrument from vihuela and baroque guitar to modern classical guitar
- Famous luthiers: Antonio de Torres, Hermann Hauser, José Ramírez, Ignacio Fleta, Robert Bouchet
- Historical milestones in guitar development
- Guitar construction innovations and standardization
- The "Torres revolution" in guitar making

Example question style:
"Which luthier is credited with establishing the design of the modern classical guitar in the 19th century?"
Options: ["Hermann Hauser", "Antonio de Torres", "José Ramírez", "Ignacio Fleta"]
Correct: 1 (Antonio de Torres)`
  },
  {
    id: "anatomy_tuning",
    name: "Anatomy & Tuning",
    prompt: `Generate ${QUESTIONS_PER_CATEGORY} multiple-choice quiz questions about classical guitar anatomy, construction, and tuning.
    
Focus on:
- Parts of the guitar: headstock, tuning pegs, nut, frets, neck, body, soundhole, rosette, bridge, saddle
- Tonewoods: spruce, cedar (tops), rosewood, mahogany, maple (back/sides)
- String materials: nylon, fluorocarbon, wound bass strings
- Standard tuning (E-A-D-G-B-E), intervals between strings
- Alternative tunings: drop D, DADGAD
- Fret spacing and scale length

Example question style:
"What is the interval relationship between the 2nd (B) and 3rd (G) strings in standard tuning?"
Options: ["Minor third", "Major third", "Perfect fourth", "Perfect fifth"]
Correct: 1 (Major third)`
  },
  {
    id: "famous_interpreters",
    name: "Famous Interpreters",
    prompt: `Generate ${QUESTIONS_PER_CATEGORY} multiple-choice quiz questions about legendary classical guitarists and performers.
    
Focus on:
- Pioneer performers: Andrés Segovia, Julian Bream, John Williams, Narciso Yepes
- Modern virtuosos: David Russell, Manuel Barrueco, Ana Vidovic, Miloš Karadaglić, Marcin Dylla
- Historical performers: Francisco Tárrega, Miguel Llobet, Emilio Pujol
- Famous recordings, collaborations, and premieres
- Teaching lineages and guitar schools

Example question style:
"Which guitarist is famous for their collaboration with composer Benjamin Britten on 'Nocturnal after John Dowland'?"
Options: ["Andrés Segovia", "Julian Bream", "John Williams", "Narciso Yepes"]
Correct: 1 (Julian Bream)`
  }
];

// System instruction for consistent JSON output
const SYSTEM_INSTRUCTION = `You are a classical guitar expert creating quiz questions.
Return ONLY a valid JSON array with no additional text, markdown, or explanation.
Each question object must have exactly this structure:
{
  "question": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0
}

Rules:
- Exactly 4 options per question
- correctIndex must be 0, 1, 2, or 3
- Questions should be factually accurate
- Vary difficulty from beginner to advanced
- No duplicate questions`;

/**
 * Sanitize and parse Gemini response
 */
function parseGeminiResponse(text) {
  // Remove markdown code blocks if present
  let cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();
  
  // Try to find JSON array in the response
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    cleaned = arrayMatch[0];
  }
  
  return JSON.parse(cleaned);
}

/**
 * Validate question structure
 */
function validateQuestion(q, index) {
  const errors = [];
  
  if (typeof q.question !== "string" || q.question.length < 10) {
    errors.push(`Question ${index}: Invalid question text`);
  }
  
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    errors.push(`Question ${index}: Must have exactly 4 options`);
  }
  
  if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex > 3) {
    errors.push(`Question ${index}: correctIndex must be 0-3`);
  }
  
  return errors;
}

/**
 * Generate questions for a single category
 */
async function generateCategoryQuestions(model, category) {
  console.log(`\n📚 Generating: ${category.name}...`);
  
  const prompt = `${category.prompt}

Return exactly ${QUESTIONS_PER_CATEGORY} questions as a JSON array.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const questions = parseGeminiResponse(text);
    
    // Validate and assign IDs
    const validQuestions = [];
    questions.forEach((q, index) => {
      const errors = validateQuestion(q, index + 1);
      if (errors.length === 0) {
        validQuestions.push({
          id: `${category.id}_${index + 1}`,
          category: category.id,
          categoryName: category.name,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex
        });
      } else {
        console.warn(`  ⚠️ Skipping invalid question: ${errors.join(", ")}`);
      }
    });
    
    console.log(`  ✅ Generated ${validQuestions.length}/${QUESTIONS_PER_CATEGORY} valid questions`);
    return validQuestions;
    
  } catch (error) {
    console.error(`  ❌ Error generating ${category.name}:`, error.message);
    return [];
  }
}

/**
 * Main generator function
 */
async function main() {
  console.log("🎸 Classical Guitar Quiz Question Generator");
  console.log("============================================\n");
  
  // Check for API key (supports both VITE_ prefixed and plain)
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ Error: GEMINI_API_KEY environment variable not set");
    console.error("   Add VITE_GEMINI_API_KEY=your_key to .env file");
    process.exit(1);
  }
  
  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: SYSTEM_INSTRUCTION
  });
  
  console.log(`Using model: ${MODEL_NAME}`);
  console.log(`Target: ${QUESTIONS_PER_CATEGORY} questions × ${CATEGORIES.length} categories = ${QUESTIONS_PER_CATEGORY * CATEGORIES.length} total\n`);
  
  // Generate questions for each category
  const allQuestions = [];
  
  for (let i = 0; i < CATEGORIES.length; i++) {
    const category = CATEGORIES[i];
    const questions = await generateCategoryQuestions(model, category);
    allQuestions.push(...questions);
    
    // Rate limit: Wait 35 seconds between requests (except after last category)
    if (i < CATEGORIES.length - 1) {
      console.log(`⏳ Pausing ${RATE_LIMIT_DELAY / 1000}s to respect Gemini Pro rate limits...`);
      await sleep(RATE_LIMIT_DELAY);
    }
  }
  
  // Load existing questions (if any) to accumulate
  let existingQuestions = [];
  if (existsSync(OUTPUT_PATH)) {
    try {
      const existingData = JSON.parse(readFileSync(OUTPUT_PATH, "utf-8"));
      existingQuestions = Array.isArray(existingData) ? existingData : [];
      console.log(`\n📂 Found ${existingQuestions.length} existing questions`);
    } catch (e) {
      console.warn("⚠️ Could not parse existing question bank, starting fresh");
    }
  }
  
  // Deduplicate by question text (case-insensitive)
  const existingTexts = new Set(existingQuestions.map(q => q.question.toLowerCase().trim()));
  const newUniqueQuestions = allQuestions.filter(q => !existingTexts.has(q.question.toLowerCase().trim()));
  
  console.log(`\n🆕 New unique questions: ${newUniqueQuestions.length}`);
  console.log(`🔄 Duplicates skipped: ${allQuestions.length - newUniqueQuestions.length}`);
  
  // Merge: existing + new unique
  const mergedQuestions = [...existingQuestions, ...newUniqueQuestions];
  
  // Re-assign sequential IDs for the entire bank
  const finalBank = mergedQuestions.map((q, index) => ({
    ...q,
    id: `q_${index + 1}`
  }));
  
  // Ensure output directory exists
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  
  // Write to file
  writeFileSync(OUTPUT_PATH, JSON.stringify(finalBank, null, 2));
  
  console.log("\n============================================");
  console.log(`✅ Success! Total questions in bank: ${finalBank.length}`);
  console.log(`   (Added ${newUniqueQuestions.length} new questions)`);
  console.log(`📁 Output: ${OUTPUT_PATH}`);
  
  // Summary by category
  console.log("\n📊 Summary by category:");
  CATEGORIES.forEach(cat => {
    const count = allQuestions.filter(q => q.category === cat.id).length;
    console.log(`   ${cat.name}: ${count} questions`);
  });
}

// Run the generator
main().catch(console.error);
