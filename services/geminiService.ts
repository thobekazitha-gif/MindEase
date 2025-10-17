import { GoogleGenAI, Type, Modality, Chat, GenerateContentResponse } from "@google/genai";
import { VoiceSettings } from "../types";
import { systemInstruction, studyBuddySchema } from '../data/prompts';

// Lazy-initialize to prevent app crash on load if API key is missing.
let ai: GoogleGenAI | null = null;

// 🧠 Initialize Gemini
export const getAi = (): GoogleGenAI => {
  if (!ai) {
    // FIX: The API key must be sourced from environment variables.
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

// 🧠 Mood Analysis
export const analyzeMood = async (text: string): Promise<number | null> => {
    try {
        const moodSchema = {
            type: Type.OBJECT,
            properties: {
                moodScore: {
                    type: Type.NUMBER,
                    description: "A score from 1 (very negative) to 10 (very positive) representing the user's mood based on their text. Be objective."
                }
            },
            required: ["moodScore"]
        };
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the mood of this text and just return the JSON: "${text}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: moodSchema,
            }
        });

        const json = JSON.parse(response.text);
        if (json.moodScore && typeof json.moodScore === 'number') {
            return Math.round(json.moodScore);
        }
        return null;
    } catch (error) {
        console.error("Error analyzing mood:", error);
        return null; // Don't block chat on mood failure
    }
};

// 💬 Main Chat Stream
export const getChatStream = (history: { role: string; parts: { text: string }[] }[]): Chat => {
    const chat: Chat = getAi().chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: studyBuddySchema,
        },
        history,
    });
    return chat;
};


// 🔊 Gemini TTS
export const getAudio = async (text: string, voiceSettings: VoiceSettings): Promise<string | null> => {
  try {
    const response = await getAi().models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceSettings.voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Error getting audio:", error);
    throw new Error(`TTS API call failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// 🖼️ Gemini Image Generation
export const generateImage = async (prompt: string): Promise<string | null> => {
  try {
    const result = await getAi().models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { responseModalities: [Modality.IMAGE] },
    });

    for (const part of result.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:image/png;base64,${base64ImageBytes}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error(`Image generation API call failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};
