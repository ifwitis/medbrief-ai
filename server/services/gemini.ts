import { GoogleGenAI, Type } from "@google/genai";
import type { DocumentResult, TranslationConfig } from "../../src/types";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in the .env file");
}

const ai = new GoogleGenAI({ apiKey });

function buildMedicalDocumentPrompt(options: TranslationConfig): string {
  return `
You are processing a medical document for accessibility and communication support.

Your task:
Extract and organize only information explicitly present in the uploaded document.

Strict rules:
- Do NOT diagnose.
- Do NOT infer diseases unless explicitly stated.
- Do NOT invent medications, appointments, or recommendations.
- Preserve uncertainty where the document is unclear.
- Keep wording faithful to the source.
- Return JSON only.

Output language requirements:
- Summary language: ${options.language}
- Audience difficulty: ${options.difficulty}
- Detail level: ${options.detailLevel}

Return a JSON object with the following fields:

1. summary
A concise summary of the document in ${options.language}, written for a ${options.difficulty} audience, with ${options.detailLevel} detail.

2. originalLanguage
Best guess of the original document language.

3. priorityItems
Array of the most important explicit findings, abnormalities, measurements, recommendations, or notable observations.
Each item must include:
- id
- title
- description
- source
- rank (0 = highest priority)
- clarity ("High" | "Medium" | "Low")
- category

4. vagueDetails
Array of unclear, ambiguous, or weakly-supported statements that may need clarification from a doctor or caregiver.
Each item must include:
- id
- text
- source
- clarity

5. caregiverSummary
An object with:
- medications: array of { name, dosage, frequency, purpose }
- lifestyle: array of strings
- appointments: array of { provider, purpose, date }

Only include items explicitly present or strongly directly stated by the document.

6. translations
Array of translated document versions.
Include at least one translation for ${options.language}.
Each item:
- language
- content

7. actions
Communication-oriented follow-up items grounded in the document.
These are not diagnoses and not invented treatment plans.
Each item must include:
- id
- title
- description
- source
- urgency
- approved (always false)

Return empty arrays when there is no data.
Sort priorityItems by rank ascending.
`.trim();
}

export async function processMedicalDocument(
  fileBuffer: Buffer,
  mimeType: string,
  options: TranslationConfig
): Promise<DocumentResult> {
  const base64Data = fileBuffer.toString("base64");
  const prompt = buildMedicalDocumentPrompt(options);

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType,
          },
        },
        { text: prompt },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          originalLanguage: { type: Type.STRING },
          priorityItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                source: { type: Type.STRING },
                rank: { type: Type.NUMBER },
                clarity: { type: Type.STRING },
                category: { type: Type.STRING },
              },
              required: ["id", "title", "description", "source", "rank", "clarity"],
            },
          },
          vagueDetails: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                text: { type: Type.STRING },
                source: { type: Type.STRING },
                clarity: { type: Type.STRING },
              },
              required: ["id", "text", "source", "clarity"],
            },
          },
          caregiverSummary: {
            type: Type.OBJECT,
            properties: {
              medications: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    dosage: { type: Type.STRING },
                    frequency: { type: Type.STRING },
                    purpose: { type: Type.STRING },
                  },
                  required: ["name", "dosage", "frequency", "purpose"],
                },
              },
              lifestyle: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              appointments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    provider: { type: Type.STRING },
                    purpose: { type: Type.STRING },
                    date: { type: Type.STRING },
                  },
                  required: ["provider", "purpose", "date"],
                },
              },
            },
            required: ["medications", "lifestyle", "appointments"],
          },
          translations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                language: { type: Type.STRING },
                content: { type: Type.STRING },
              },
              required: ["language", "content"],
            },
          },
          actions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                source: { type: Type.STRING },
                urgency: { type: Type.STRING },
                approved: { type: Type.BOOLEAN },
              },
              required: ["id", "title", "description", "source", "urgency", "approved"],
            },
          },
        },
        required: [
          "summary",
          "priorityItems",
          "vagueDetails",
          "caregiverSummary",
          "translations",
          "actions",
        ],
      },
    },
  });

  if (!response.text) {
    throw new Error("No text returned from Gemini");
  }

  const parsed = JSON.parse(response.text) as DocumentResult;
  parsed.priorityItems = [...parsed.priorityItems].sort((a, b) => a.rank - b.rank);
  parsed.processedAt = new Date().toISOString();
  return parsed;
}
