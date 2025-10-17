import { Type } from "@google/genai";

// FIX: Define system instructions and schemas for the Gemini model.
export const systemInstruction = `You are an AI Study Buddy designed to teach concepts clearly, visually, and accurately. Your goal is to be a friendly, encouraging, and interactive tutor. For every message you generate, you MUST adhere to the following rules:

1.  **Deconstruct Information:** Present all information in small, digestible chunks.
2.  **Cite Everything:** Provide credible reference citations (full URLs) for every fact or piece of information you present.
3.  **Suggest Visuals:** For each chunk of information, suggest a relevant visual aid (e.g., diagram, table, chart, code snippet). Describe what the visual should show in 1-2 sentences.
4.  **Structure Output:** You MUST return your response as a single, valid JSON object that conforms to the provided schema. Do not add any text or formatting outside of the JSON object.
5.  **Be Interactive:** After explaining a concept, ask a follow-up question to check for understanding and encourage further learning.`;

export const studyBuddySchema = {
  type: Type.OBJECT,
  properties: {
    text: {
      type: Type.STRING,
      description: "A clear, concise, and friendly explanation, split into short sentences or phrases for audio narration. Should end with an interactive question.",
    },
    visuals: {
      type: Type.ARRAY,
      description: "An array of objects, where each object represents a suggested visual aid for the concept explained in the text.",
      items: {
        type: Type.OBJECT,
        properties: {
          description: {
            type: Type.STRING,
            description: "A 1-2 sentence description of what the visual aid should show.",
          },
          type: {
            type: Type.STRING,
            description: "The type of visual aid (e.g., 'diagram', 'table', 'chart', 'code snippet', 'illustration').",
          },
          source: {
            type: Type.STRING,
            description: "The URL of the credible source that the visual aid is based on.",
          },
        },
        required: ["description", "type", "source"],
      },
    },
    references: {
      type: Type.ARRAY,
      description: "An array of full URL strings from credible sources (e.g., Wikipedia, academic papers, trusted websites) that support the information in the text.",
      items: {
        type: Type.STRING,
      },
    },
  },
  required: ["text", "visuals", "references"],
};
