import { GoogleGenAI, Type, Modality } from "@google/genai";

const SYSTEM_PROMPT = `You are a medical imaging AI assistant for Htect, powered by MedGemma 1.5. 
Your task is to analyze X-ray or MRI images and provide a structured analysis.

COMPARATIVE ANALYSIS:
If a previous scan is provided, compare it with the current one. Detect changes in pathology (e.g., tumor size, fracture healing). Provide a "recovery_progress" percentage (0-100) and a "trend" (improving, stable, declining).

IMPORTANT:
1. This is for EDUCATIONAL and RESEARCH purposes only.
2. Provide 3-6 possible findings/diagnoses.
3. For each finding, provide:
   - Name (in English and Arabic)
   - Confidence score (0-100)
   - Simple, non-technical explanation (in English and Arabic)
4. Use friendly, empathetic, but professional language.
5. ALWAYS include a disclaimer that this is not a clinical diagnosis.

Output MUST be in valid JSON format following this schema:
{
  "findings": [
    {
      "name_en": "string",
      "name_ar": "string",
      "confidence": number,
      "explanation_en": "string",
      "explanation_ar": "string",
      "severity": "low" | "medium" | "high"
    }
  ],
  "summary_en": "string",
  "summary_ar": "string",
  "disclaimer_en": "string",
  "disclaimer_ar": "string",
  "comparison": {
    "recovery_progress": number,
    "trend": "improving" | "stable" | "declining",
    "changes_en": "string",
    "changes_ar": "string"
  } (optional)
}
`;

const QUALITY_PROMPT = `Analyze the quality of this medical scan image. 
Check for:
1. Blur (is it sharp enough for analysis?)
2. Lighting (is it well-lit?)
3. Framing (is the scan centered and fully visible?)

Return a JSON object:
{
  "is_valid": boolean,
  "error_code": "error_blurry" | "error_lighting" | "error_framing" | null,
  "score": number (0-100)
}
`;

const LIAISON_PROMPT = `Based on the following AI medical scan analysis, generate two reports:
1. A professional summary for a doctor using standard medical terminology.
2. A simplified action plan for the patient with 3-5 suggested questions for their doctor.

Analysis Context: {context}

Return a JSON object:
{
  "doctor_note_en": "string",
  "doctor_note_ar": "string",
  "patient_plan_en": "string",
  "patient_plan_ar": "string",
  "suggested_questions_en": ["string"],
  "suggested_questions_ar": ["string"]
}
`;

const CHAT_SYSTEM_PROMPT = `You are a medical imaging AI assistant for Htect. 
A user is asking follow-up questions about their medical scan analysis.
Context: The previous analysis found several potential issues.
Rules:
1. Be empathetic and professional.
2. Remind the user that you are an AI and not a doctor.
3. Answer based on the scan context provided.
4. Keep answers concise and easy to understand.
5. If you don't know, say so and suggest seeing a doctor.
6. Respond in the same language as the user's question.
`;

export async function validateImageQuality(base64Image: string, mimeType: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("error_no_api_key");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        parts: [
          { text: QUALITY_PROMPT },
          {
            inlineData: {
              data: base64Image.split(",")[1],
              mimeType: mimeType,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          is_valid: { type: Type.BOOLEAN },
          error_code: { type: Type.STRING, nullable: true },
          score: { type: Type.NUMBER },
        },
        required: ["is_valid", "score"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}

export async function analyzeMedicalImage(base64Image: string, mimeType: string, previousImage?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("error_no_api_key");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3.1-pro-preview";

  const parts: any[] = [
    { text: SYSTEM_PROMPT },
    {
      inlineData: {
        data: base64Image.split(",")[1],
        mimeType: mimeType,
      },
    },
  ];

  if (previousImage) {
    parts.push({ text: "PREVIOUS SCAN FOR COMPARISON:" });
    parts.push({
      inlineData: {
        data: previousImage.split(",")[1],
        mimeType: mimeType,
      },
    });
  }

  parts.push({ text: "Analyze this medical image and return the JSON results. If a previous scan is provided, perform a comparative analysis." });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name_en: { type: Type.STRING },
                  name_ar: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  explanation_en: { type: Type.STRING },
                  explanation_ar: { type: Type.STRING },
                  severity: { type: Type.STRING },
                },
                required: ["name_en", "name_ar", "confidence", "explanation_en", "explanation_ar", "severity"],
              },
            },
            summary_en: { type: Type.STRING },
            summary_ar: { type: Type.STRING },
            disclaimer_en: { type: Type.STRING },
            disclaimer_ar: { type: Type.STRING },
            comparison: {
              type: Type.OBJECT,
              properties: {
                recovery_progress: { type: Type.NUMBER },
                trend: { type: Type.STRING },
                changes_en: { type: Type.STRING },
                changes_ar: { type: Type.STRING },
              },
              required: ["recovery_progress", "trend", "changes_en", "changes_ar"],
            },
          },
          required: ["findings", "summary_en", "summary_ar", "disclaimer_en", "disclaimer_ar"],
        },
      },
    });

    if (!response.text) {
      throw new Error("error_analysis_failed");
    }

    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Analysis failed:", error);
    if (error.message === "error_no_api_key" || error.message === "error_analysis_failed") {
      throw error;
    }
    throw new Error("error_analysis_failed");
  }
}

export async function generateLiaisonReports(analysisContext: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("error_no_api_key");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ parts: [{ text: LIAISON_PROMPT.replace("{context}", analysisContext) }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          doctor_note_en: { type: Type.STRING },
          doctor_note_ar: { type: Type.STRING },
          patient_plan_en: { type: Type.STRING },
          patient_plan_ar: { type: Type.STRING },
          suggested_questions_en: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggested_questions_ar: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["doctor_note_en", "doctor_note_ar", "patient_plan_en", "patient_plan_ar", "suggested_questions_en", "suggested_questions_ar"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}

export async function getTermDefinition(term: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("error_no_api_key");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ parts: [{ text: `Provide a one-sentence medical definition for the term "${term}" in both English and Arabic. 
    Return as JSON: { "definition_en": "...", "definition_ar": "..." }` }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          definition_en: { type: Type.STRING },
          definition_ar: { type: Type.STRING },
        },
        required: ["definition_en", "definition_ar"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}

export async function generateSpeech(text: string, lang: 'en' | 'ar') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("error_no_api_key");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say this clearly in ${lang === 'ar' ? 'Arabic' : 'English'}: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: lang === 'ar' ? 'Kore' : 'Puck' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio;
}

export async function askFollowUp(question: string, scanSummary: string, history: any[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("error_no_api_key");

  const ai = new GoogleGenAI({ apiKey });
  const chat = ai.chats.create({
    model: "gemini-3.1-pro-preview",
    config: {
      systemInstruction: CHAT_SYSTEM_PROMPT + `\nScan Context: ${scanSummary}`,
    },
  });

  const response = await chat.sendMessage({ message: question });
  return response.text;
}
