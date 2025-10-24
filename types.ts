// FIX: Define shared TypeScript types for the application.
import { Blob } from "@google/genai";

export type ChatMode = 'standard' | 'fast' | 'deep' | 'search';

export interface Visual {
  description: string;
  type: string;
  source: string;
}

export interface PracticeQuestion {
  question: string;
  answer: string;
}

export interface Flashcard extends PracticeQuestion {
  id: string;
}

export interface GroundingSource {
    uri: string;
    title: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: number;
  isLoading?: boolean;
  isStreaming?: boolean; // Indicates the AI is "thinking"
  visuals?: Visual[];
  references?: string[];
  practiceQuestions?: PracticeQuestion[];
  groundingSources?: GroundingSource[];
  type?: 'visual_aid_offer' | 'generated_image' | 'summary';
  imagePrompt?: string;
  imageDataUrl?: string;
  error?: string;
  // FIX: Add optional moodScore to support mood tracking feature.
  moodScore?: number;
}

export interface VoiceSettings {
  voice: string;
  rate: number;
  chatMode: ChatMode;
}

export { Blob };

// FIX: Add webkitAudioContext to Window interface to fix TypeScript error in App.tsx.
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}
