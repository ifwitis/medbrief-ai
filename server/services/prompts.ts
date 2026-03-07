import type { TranslationConfig } from "../../src/types";

export function buildMedicalDocumentPrompt(options: TranslationConfig): string {
  return `
You are processing a medical report for accessibility and communication support.

Your job is to extract and organize only the information explicitly present in the uploaded document.
Do NOT diagnose.
Do NOT infer diseases beyond what is written.
Do NOT invent missing values.
Do NOT give treatment advice unless it is explicitly present in the document.
Preserve uncertainty when the document is unclear.

Target output requirements:
- Language for summary and translated content: ${options.language}
- Audience difficulty: ${options.difficulty}
- Detail level: ${options.detailLevel}

Return JSON only.

Produce the following fields:

1. summary
- A concise overall summary of the document
- Written for a ${options.difficulty} audience
- In ${options.language}
- Use ${options.detailLevel} detail

2. originalLanguage
- Best guess of the original document language

3. priorityItems
- Ordered from highest priority to lowest priority
- Include only important factual findings, observations, measurements, recommendations, or flagged abnormalities explicitly written in the document
- Each item must contain:
  - id
  - title
  - description
  - source (exact or near-exact supporting text from the document)
  - rank (0 is highest priority)
  - clarity ("High", "Medium", or "Low")

Clarity guidance:
- High: directly and clearly stated
- Medium: somewhat technical or indirectly phrased but still reasonably clear
- Low: ambiguous, incomplete, or difficult to interpret

4. translations
- Include a full translated rendering of the document in ${options.language}
- If the original is already in ${options.language}, still include one translation entry with the original-equivalent text

5. actions
- Extract communication-oriented follow-up items grounded in the document text
- These are not diagnoses
- These are not invented treatment plans
- These can include things like follow-up appointment, doctor clarification needed, repeat lab requested, medication review mentioned, imaging follow-up mentioned
- Each action must contain:
  - id
  - title
  - description
  - source
  - urgency ("High", "Medium", or "Low")
  - approved (always false)

Rules:
- Sort priorityItems by rank ascending
- Keep wording faithful to the source
- Return empty arrays instead of omitting fields
- Return valid JSON only
`.trim();
}
