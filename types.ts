// FIX: Define shared TypeScript types for the application.
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: number;
  moodScore?: number;
  isLoading?: boolean;
}

export interface VoiceSettings {
  voice: string;
  rate: number;
}
