import { GoogleGenAI, Type, Modality } from "@google/genai";
import { VoiceSettings, Message } from "../types";

// Lazy-initialize to prevent app crash on load if API key is missing.
let ai: GoogleGenAI | null = null;

// 🧠 Initialize Gemini
// FIX: Use process.env.API_KEY instead of a hardcoded key for security, as per guidelines.
export const getAi = (): GoogleGenAI => {
  if (!ai) {
    if (!process.env.API_KEY) {
      throw new Error("Configuration Error: Google API key not set.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
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
  } catch (error)
  {
    console.error("Error getting audio:", error);
    throw new Error(`TTS API call failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// 🖼️ Gemini Image Generation
export const generateImage = async (prompt: string): Promise<string | null> => {
  try {
    const result = await getAi().models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: prompt }],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
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
