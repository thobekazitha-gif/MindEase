// FIX: Define shared TypeScript types for the application.
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: number;
  moodScore?: number;
  isLoading?: boolean;
  isStreaming?: boolean;
  type?: 'summary' | 'breathing_suggestion' | 'visual_aid_offer' | 'generated_image';
  imageGenerationPrompt?: string;
  imageData?: string;
}

export interface VoiceSettings {
  voice: string;
  rate: number;
}

// FIX: Add webkitAudioContext to Window interface to fix TypeScript error in App.tsx.
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}