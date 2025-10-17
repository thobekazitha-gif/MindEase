import React, { useState, useEffect, useRef } from 'react';
import { Chat } from '@google/genai';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { SettingsPanel } from './components/SettingsPanel';
import { MoodDashboard } from './components/MoodDashboard';
import { BreathingExercise } from './components/BreathingExercise';
import { Affirmation } from './components/Affirmation';
import { TechnicalInfoPanel } from './components/TechnicalInfoPanel';
import { Message, VoiceSettings } from './types';
import { generateId, decode, decodeAudioData } from './utils/helpers';
import { analyzeMood, getAudio, generateSummary, getAi } from './services/geminiService';
import { systemInstruction } from './data/prompts';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isBreathingExerciseOpen, setIsBreathingExerciseOpen] = useState(false);
  const [isTechInfoOpen, setIsTechInfoOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    voice: 'Kore',
    rate: 1.0,
  });

  const chatRef = useRef<Chat | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);

  // Initialize AudioContext
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
  }, []);

  // Initialize Gemini Chat
  useEffect(() => {
    const initChat = () => {
      try {
        const ai = getAi();
        chatRef.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          },
        });
      } catch (e) {
        console.error("Error initializing Gemini Chat:", e);
        setError("An error occurred while initializing the AI assistant. Please try refreshing the page.");
      }
    };
    initChat();
  }, []);

  const playNextInQueue = () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }
    isPlayingRef.current = true;
    const audioBuffer = audioQueueRef.current.shift();

    if (audioBuffer && audioContextRef.current) {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = voiceSettings.rate;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        isPlayingRef.current = false;
        playNextInQueue();
      };
      source.start();
    } else {
      isPlayingRef.current = false;
    }
  };

  const speak = async (text: string) => {
    if (!text || !audioContextRef.current) return;
    try {
      const base64Audio = await getAudio(text, voiceSettings);
      if (base64Audio) {
        const audioBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
        audioQueueRef.current.push(audioBuffer);
        playNextInQueue();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };
  
  const handleSendMessage = async (text: string) => {
    setIsSending(true);

    const userMessage: Message = {
      id: generateId(),
      text,
      sender: 'user',
      timestamp: Date.now(),
    };

    // Analyze mood and add to user message
    const moodScore = await analyzeMood(text);
    userMessage.moodScore = moodScore ?? undefined;

    const assistantMessageId = generateId();
    const assistantMessage: Message = {
        id: assistantMessageId,
        text: '',
        sender: 'assistant',
        timestamp: Date.now(),
        isLoading: true,
        isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    // Breathing exercise suggestion logic
    if (text.toLowerCase().includes('breathing') || (moodScore && moodScore <= 3)) {
        setTimeout(() => setIsBreathingExerciseOpen(true), 1500);
    }

    try {
        if (!chatRef.current) {
            throw new Error("Chat not initialized");
        }
        
        const stream = await chatRef.current.sendMessageStream({ message: text });

        let fullResponse = "";
        let spokenResponse = "";
        let sentenceEndRegex = /[.!?]/;

        for await (const chunk of stream) {
            const chunkText = chunk.text;
            fullResponse += chunkText;
            spokenResponse += chunkText;

            // Stream to UI
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === assistantMessageId ? { ...msg, text: fullResponse, isLoading: false } : msg
                )
            );

            // Check for sentence end to speak
            if (sentenceEndRegex.test(spokenResponse)) {
                const sentences = spokenResponse.split(sentenceEndRegex);
                const completeSentence = sentences.slice(0, -1).join('. ') + '.';
                if (completeSentence.trim()) {
                    speak(completeSentence);
                    spokenResponse = sentences.slice(-1)[0] || ""; // Keep the remainder
                }
            }
        }
        
        // Speak any remaining part of the response
        if (spokenResponse.trim()) {
            speak(spokenResponse.trim());
        }

        // Finalize assistant message
        setMessages((prev) =>
            prev.map((msg) =>
                msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
            )
        );

        // Summary generation logic (every 5 user messages)
        const userMessageCount = messages.filter(m => m.sender === 'user').length + 1;
        if (userMessageCount % 5 === 0) {
           const summaryText = await generateSummary([...messages, userMessage, { ...assistantMessage, text: fullResponse }]);
           if(summaryText) {
             const summaryMessage: Message = {
                id: generateId(),
                text: summaryText,
                sender: 'assistant',
                timestamp: Date.now(),
                type: 'summary',
             };
             setMessages(prev => [...prev, summaryMessage]);
             speak("Here's a little reflection on our chat so far.");
             speak(summaryText);
           }
        }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, text: "I'm having trouble connecting right now. Please try again in a moment.", isLoading: false, isStreaming: false }
            : msg
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 font-sans">
      <Header
        onSettingsClick={() => setIsSettingsOpen(true)}
        onDashboardClick={() => setIsDashboardOpen(true)}
        onTechInfoClick={() => setIsTechInfoOpen(true)}
      />
      {error ? (
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-red-500/50 p-6 rounded-lg max-w-md text-center shadow-lg">
            <h2 className="text-xl font-bold text-red-400 mb-2">Application Error</h2>
            <p className="text-slate-300">{error}</p>
          </div>
        </main>
      ) : (
        <main className="flex-1 flex flex-col min-h-0 relative">
          <ChatWindow messages={messages} />
          <div className="px-4">
              <Affirmation />
          </div>
          <ChatInput onSendMessage={handleSendMessage} isSending={isSending} />
        </main>
      )}
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
      <TechnicalInfoPanel 
        isOpen={isTechInfoOpen}
        onClose={() => setIsTechInfoOpen(false)}
      />
      {isBreathingExerciseOpen && (
          <BreathingExercise onClose={() => setIsBreathingExerciseOpen(false)} />
      )}
    </div>
  );
};

export default App;
