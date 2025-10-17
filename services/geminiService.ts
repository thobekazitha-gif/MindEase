import { GoogleGenAI, Type, Modality } from "@google/genai";
import { VoiceSettings, Message } from "../types";
import { moodAnalysisSchema } from "../data/prompts";

// Lazy-initialize to prevent app crash on load if API key is missing.
let ai: GoogleGenAI | null = null;

// 🔑 API Keys
const GOOGLE_API_KEY = "AIzaSyAGoou-oftiIIEkX1-n_zryPfdZrBXPRr8";
const ELEVENLABS_API_KEY = "sk_f4740f565c5d93a0a27da7bed04d7fe28ff74f099be9ee09";

// 🧠 Initialize Gemini
export const getAi = (): GoogleGenAI => {
  if (!ai) {
    if (!GOOGLE_API_KEY) {
      throw new Error("Configuration Error: Google API key not set.");
    }
    ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
  }
  return ai;
};

// 🗣️ ElevenLabs Speech Function (awaits audio before resolving)
export async function speakText(text: string): Promise<void> {
  try {
    // Split text into sentences for smoother sync
    const chunks = text.match(/[^.!?]+[.!?]?/g) || [text];
    for (const chunk of chunks) {
      const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: chunk.trim(),
          voice: "Rachel", // or your preferred voice
          model_id: "eleven_monolingual_v1",
        }),
      });

      if (!response.ok) {
        console.error("Failed to generate speech:", response.statusText);
        continue;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.play();
      });
    }
  } catch (error) {
    console.error("Error in speakText:", error);
  }
}

// 🎭 Mood Analysis
export const analyzeMood = async (message: string): Promise<number | null> => {
  try {
    const response = await getAi().models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the mood of the following text on a scale from 1 to 10 (1=very negative, 10=very positive) and return only the score. Text: "${message}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: moodAnalysisSchema,
      },
    });

    const jsonText = response.text?.trim();
    if (!jsonText) return null;

    const result = JSON.parse(jsonText);
    if (result && typeof result.moodScore === "number") {
      return Math.round(Math.max(1, Math.min(10, result.moodScore)));
    }
    return null;
  } catch (error) {
    console.error("Error analyzing mood:", error);
    throw new Error(`Mood analysis API call failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// 🔊 Gemini TTS (alternative to ElevenLabs)
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

// 🧩 Generate Summary + Speak It (synchronized)
export const generateSummary = async (conversationHistory: Message[]): Promise<string | null> => {
  try {
    const formattedHistory = conversationHistory
      .filter((msg) => msg.type !== "summary" && !msg.isLoading && msg.text)
      .slice(-10)
      .map((msg) => `${msg.sender === "user" ? "User" : "Assistant"}: ${msg.text}`)
      .join("\n");

    if (!formattedHistory) return null;

    const prompt = `Based on the following conversation, provide a concise summary (2-3 sentences) highlighting the key themes and one positive insight for the user. Present it as a helpful reflection, speaking directly to the user in the second person (e.g., "It seems you've been exploring..."). Conversation:\n\n${formattedHistory}`;

    const response = await getAi().models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { temperature: 0.5 },
    });

    const summaryText = response.text?.trim();
    if (summaryText) {
      // 🎤 Play audio first, then resolve so UI can display after
      await speakText(summaryText);
      return summaryText;
    }
    return null;
  } catch (error) {
    console.error("Error generating summary:", error);
    throw new Error(`Summary generation API call failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};
