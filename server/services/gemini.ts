import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini API client
// The API key is automatically injected by the AI Studio environment
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in the .env file");
}

const ai = new GoogleGenAI({ apiKey: apiKey });
/**
 * Processes a medical document using Gemini AI.
 * 
 * @param fileBuffer - The uploaded file buffer
 * @param mimeType - The MIME type of the file (e.g., 'application/pdf', 'image/jpeg')
 * @param options - Translation and summarization options
 * @returns Structured data containing priority items and vague details
 */
export async function processMedicalDocument(
  fileBuffer: Buffer, 
  mimeType: string,
  options: { language: string; difficulty: string; detailLevel: string }
) {
  try {
    // 1. Convert the file buffer to a base64 string
    const base64Data = fileBuffer.toString("base64");

    // 2. Construct the prompt based on user options
    const prompt = `
      Analyze this medical document.
      Translate the findings to: ${options.language}.
      Use terminology suitable for a: ${options.difficulty} (layman or medical professional).
      Provide a ${options.detailLevel} level of detail.
      
      Extract the most critical, factual findings as "priorityItems".
      Extract any unclear, subjective, or vague statements as "vagueDetails".
    `;

    // 3. Call the Gemini model
    // Using gemini-3-flash-preview for general text/document tasks
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        // Enforce a structured JSON response
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priorityItems: {
              type: Type.ARRAY,
              description: "Clear, factual, and high-priority medical findings.",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.NUMBER },
                  text: { type: Type.STRING, description: "The finding text" },
                  clarity: { type: Type.STRING, description: "High, Medium, or Low" }
                },
                required: ["id", "text", "clarity"]
              }
            },
            vagueDetails: {
              type: Type.ARRAY,
              description: "Subjective, unclear, or low-priority details.",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.NUMBER },
                  text: { type: Type.STRING, description: "The detail text" },
                  clarity: { type: Type.STRING, description: "Always Low for vague details" }
                },
                required: ["id", "text", "clarity"]
              }
            }
          },
          required: ["priorityItems", "vagueDetails"]
        }
      }
    });

    // 4. Parse and return the structured JSON response
    if (response.text) {
      return JSON.parse(response.text);
    }
    
    throw new Error("No text returned from Gemini");
  } catch (error) {
    console.error("Error processing document with Gemini:", error);
    throw error;
  }
}
