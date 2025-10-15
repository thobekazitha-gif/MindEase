import { GoogleGenAI, Type, Modality } from "@google/genai";
import { VoiceSettings } from "../types";
import { moodAnalysisSchema } from "../data/prompts";

// FIX: Implement Gemini API service functions.
// API key is expected to be set in the environment variables.
// The '!' asserts that process.env.API_KEY is not undefined.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const analyzeMood = async (message: string): Promise<number | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the mood of this text on a scale from 1 (very negative) to 10 (very positive), providing only a JSON object with a "moodScore" key: "${message}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: moodAnalysisSchema,
        temperature: 0.2,
      },
    });
    
    const jsonText = response.text.trim();
    if (!jsonText) return null;

    const result = JSON.parse(jsonText);

    if (result && typeof result.moodScore === 'number') {
      return Math.round(Math.max(1, Math.min(10, result.moodScore)));
    }
    return null;
  } catch (error) {
    console.error("Error analyzing mood:", error);
    return null;
  }
};

export const getAudio = async (text: string, voiceSettings: VoiceSettings): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
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
    if (base64Audio) {
      return base64Audio;
    }
    return null;
  } catch (error) {
    console.error("Error getting audio:", error);
    return null;
  }
};
