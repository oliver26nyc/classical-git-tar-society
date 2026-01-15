/**
 * List available Gemini models for your API key
 * Run: node --env-file=.env scripts/list_models.mjs
 */

const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("❌ Error: GEMINI_API_KEY not set");
  process.exit(1);
}

async function listModels() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );
    const data = await response.json();

    if (data.error) {
      console.error("❌ API Error:", data.error.message);
      return;
    }

    console.log("------------------------------------------------");
    console.log("AVAILABLE GEMINI MODELS FOR YOUR KEY:");
    console.log("------------------------------------------------");
    
    data.models
      .filter(m => m.name.includes("gemini"))
      .forEach(m => {
        console.log(`\n📌 ${m.name.replace("models/", "")}`);
        console.log(`    Methods: ${m.supportedGenerationMethods.join(", ")}`);
      });
      
    console.log("\n------------------------------------------------");
  } catch (e) {
    console.error("Error listing models:", e);
  }
}

listModels();
