// FIX: Define shared TypeScript types for the application.

export interface Visual {
  description: string;
  type: string;
  source: string;
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
  // FIX: Add optional moodScore to support mood tracking feature.
  moodScore?: number;
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
