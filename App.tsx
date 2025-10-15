import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { SettingsPanel } from './components/SettingsPanel';
import { MoodDashboard } from './components/MoodDashboard';
import { Affirmation } from './components/Affirmation';
import { BreathingExercise } from './components/BreathingExercise';
import { Message, VoiceSettings } from './types';
import { analyzeMood, getAudio, generateSummary } from './services/geminiService';
import { playAudio } from './utils/helpers';
import { systemInstruction } from './data/prompts';
import { GoogleGenAI, Chat } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isBreathingExerciseOpen, setIsBreathingExerciseOpen] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({ voice: 'Kore', rate: 1.0 });
  
  const chatRef = useRef<Chat | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    chatRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
        },
    });

    setMessages([{
      id: 'init-1',
      text: "Hello! I'm MindEase, your personal AI assistant for mental well-being. How are you feeling today?",
      sender: 'assistant',
      timestamp: Date.now()
    }]);

  }, []);

  const handleSendMessage = async (text: string) => {
    setIsSending(true);

    const userMessageId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMessageId,
      text: text,
      sender: 'user',
      timestamp: Date.now(),
    };
    
    const assistantMessagePlaceholderId = `assistant-${Date.now()}`;
    const assistantMessagePlaceholder: Message = {
      id: assistantMessagePlaceholderId,
      text: '',
      sender: 'assistant',
      timestamp: Date.now() + 1,
      isLoading: true,
    };

    // Show user message and assistant placeholder immediately for better responsiveness.
    setMessages(prev => [...prev, userMessage, assistantMessagePlaceholder]);

    // Analyze mood in the background without blocking the chat response.
    analyzeMood(text).then(moodScore => {
        if (moodScore !== null) {
            setMessages(prev => prev.map(m => m.id === userMessageId ? { ...m, moodScore } : m));
        }
    });

    try {
        if (!chatRef.current) {
            throw new Error("Chat session not initialized.");
        }
        
        if (text.toLowerCase().includes('breathing exercise')) {
            setIsBreathingExerciseOpen(true);
            const breathingResponse = "Of course. Let's do a short breathing exercise to help you relax. Just follow the on-screen guide.";
            setMessages(prev => prev.map(m => m.id === assistantMessagePlaceholderId ? { ...m, text: breathingResponse, isLoading: false } : m));
            setIsSending(false);
            return;
        }

        const stream = await chatRef.current.sendMessageStream({ message: text });
        
        let responseText = "";
        let firstChunk = true;
        for await (const chunk of stream) {
            responseText += chunk.text;
             if (firstChunk) {
                setMessages(prev => prev.map(m => 
                    m.id === assistantMessagePlaceholderId 
                    ? { ...m, text: responseText, isLoading: false, isStreaming: true }
                    : m
                ));
                firstChunk = false;
            } else {
                setMessages(prev => prev.map(m => 
                    m.id === assistantMessagePlaceholderId 
                    ? { ...m, text: responseText }
                    : m
                ));
            }
        }

        const finalAssistantMessage: Message = {
            ...assistantMessagePlaceholder,
            id: assistantMessagePlaceholderId,
            text: responseText,
            isStreaming: false,
            isLoading: false,
        };

        const newCount = userMessageCount + 1;
        const shouldSummarize = newCount >= 5;

        // Finalize the assistant's message and handle summary logic.
        setMessages(currentMessages => {
            let updatedMessages = currentMessages.map(m => 
                m.id === assistantMessagePlaceholderId ? finalAssistantMessage : m
            );

            if (shouldSummarize) {
                const summaryPlaceholderId = `summary-${Date.now()}`;
                const summaryPlaceholder: Message = {
                    id: summaryPlaceholderId,
                    sender: 'assistant',
                    text: '',
                    isLoading: true,
                    type: 'summary',
                    timestamp: Date.now(),
                };

                // Generate summary asynchronously based on the latest conversation context.
                generateSummary(updatedMessages).then(summaryText => {
                    setMessages(latestMessages => latestMessages.map(m => 
                        m.id === summaryPlaceholderId 
                        ? { ...m, text: summaryText || "Could not generate summary.", isLoading: false }
                        : m
                    ));
                });
                
                return [...updatedMessages, summaryPlaceholder];
            }
            
            return updatedMessages;
        });
        
        if (shouldSummarize) {
            setUserMessageCount(0);
        } else {
            setUserMessageCount(newCount);
        }
        
        // Generate and play audio asynchronously as soon as the text is finalized.
        if (audioContextRef.current && responseText) {
             getAudio(responseText, voiceSettings).then(audioData => {
                if (audioData && audioContextRef.current) {
                    playAudio(audioData, audioContextRef.current, voiceSettings.rate)
                        .catch(err => console.error("Error playing audio:", err));
                }
            }).catch(err => console.error("Error fetching audio:", err));
        }

    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        ...assistantMessagePlaceholder,
        id: assistantMessagePlaceholderId,
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        isLoading: false,
      };
      setMessages(prev => prev.map(m => m.id === assistantMessagePlaceholderId ? errorMessage : m));
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