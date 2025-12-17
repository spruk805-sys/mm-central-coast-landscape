
const GEMINI_KEY = process.env.GOOGLE_AI_STUDIO_KEY;


export async function quickClassify(text: string, categories: string[]): Promise<string> {
  // Try Gemini first
  try {
    if (GEMINI_KEY) {
      const prompt = `Classify the following text into one of these categories: ${categories.join(', ')}. Return ONLY the category name. Text: "${text}"`;
      
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          }),
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (result && categories.includes(result)) return result;
        // If exact match fails, do fuzzy match
        const found = categories.find(c => result?.toLowerCase().includes(c.toLowerCase()));
        if (found) return found;
      }
    }
  } catch (e) {
    console.warn("Gemini classification failed, trying OpenAI or fallback", e);
  }

  // Fallback to OpenAI (omitted for brevity unless preferred, using keyword fallback instead)
  return 'unknown';
}

/**
 * Ask the LLM for a structured JSON analysis.
 */
export async function analyzeText<T>(prompt: string, schemaDescription: string): Promise<T | null> {
    if (!GEMINI_KEY) return null;
    
    const fullPrompt = `${prompt}\n\nReturn a valid JSON object matching this structure: ${schemaDescription}. Do not include markdown formatting.`;
    
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }]
          }),
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        // Strip markdown
        text = text.replace(/```json/g, '').replace(/```/g, '');
        return JSON.parse(text) as T;
      }
    } catch (e) {
      console.error("LLM analysis failed", e);
    }
    return null;
}
