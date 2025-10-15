import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { SettingsPanel } from './components/SettingsPanel';
import { MoodDashboard } from './components/MoodDashboard';
import { Affirmation } from './components/Affirmation';
import { BreathingExercise } from './components/BreathingExercise';
import { Message, VoiceSettings } from './types';
import { analyzeMood, getAudio } from './services/geminiService';
import { playAudio } from './utils/helpers';
import { systemInstruction } from './data/prompts';
import { GoogleGenAI, Chat } from '@google/genai';

// FIX: Initialize the Gemini AI client.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isBreathingExerciseOpen, setIsBreathingExerciseOpen] = useState(false);
  
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({ voice: 'Kore', rate: 1.0 });
  
  const chatRef = useRef<Chat | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext on user interaction (or mount)
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Initialize chat session
    chatRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
        },
    });

    // Initial message from assistant
    setMessages([{
      id: 'init-1',
      text: "Hello! I'm MindEase, your personal AI assistant for mental well-being. How are you feeling today?",
      sender: 'assistant',
      timestamp: Date.now()
    }]);

  }, []);

  const handleSendMessage = async (text: string) => {
    setIsSending(true);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: text,
      sender: 'user',
      timestamp: Date.now(),
    };

    // Analyze mood and add to message
    const moodScore = await analyzeMood(text);
    if (moodScore !== null) {
      userMessage.moodScore = moodScore;
    }
    
    const assistantMessagePlaceholder: Message = {
      id: `assistant-${Date.now()}`,
      text: '',
      sender: 'assistant',
      timestamp: Date.now() + 1,
      isLoading: true,
    };
    
    setMessages(prev => [...prev, userMessage, assistantMessagePlaceholder]);

    try {
        if (!chatRef.current) {
            throw new Error("Chat session not initialized.");
        }
        
        // Trigger breathing exercise if user says so
        if (text.toLowerCase().includes('breathing exercise')) {
            setIsBreathingExerciseOpen(true);
            const breathingResponse = "Of course. Let's do a short breathing exercise to help you relax. Just follow the on-screen guide.";
            setMessages(prev => prev.map(m => m.id === assistantMessagePlaceholder.id ? { ...m, text: breathingResponse, isLoading: false } : m));
            setIsSending(false);
            return;
        }

        const result = await chatRef.current.sendMessage({ message: text });
        const responseText = result.text;
        
        const assistantMessage: Message = {
            ...assistantMessagePlaceholder,
            text: responseText,
            isLoading: false,
        };
        
        setMessages(prev => prev.map(m => m.id === assistantMessagePlaceholder.id ? assistantMessage : m));
        
        // Generate and play audio
        if (audioContextRef.current) {
            const audioData = await getAudio(responseText, voiceSettings);
            if (audioData) {
                await playAudio(audioData, audioContextRef.current, voiceSettings.rate);
            }
        }

    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        ...assistantMessagePlaceholder,
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        isLoading: false,
      };
      setMessages(prev => prev.map(m => m.id === assistantMessagePlaceholder.id ? errorMessage : m));
    } finally {
      setIsSending(false);
    }
  };


  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white font-sans">
      <Header 
        onSettingsClick={() => setIsSettingsOpen(true)}
        onDashboardClick={() => setIsDashboardOpen(true)}
      />
      <div className="relative flex-grow flex flex-col">
        <ChatWindow messages={messages} />
        <Affirmation />
      </div>
      <ChatInput onSendMessage={handleSendMessage} isSending={isSending} />
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={voiceSettings}
        onSettingsChange={setVoiceSettings}
      />
      <MoodDashboard
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        messages={messages}
      />
      {isBreathingExerciseOpen && <BreathingExercise onClose={() => setIsBreathingExerciseOpen(false)} />}
    </div>
  );
}

export default App;
