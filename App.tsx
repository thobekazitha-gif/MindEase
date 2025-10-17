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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      text: "Hello! I'm MindEase, your personal AI companion for reflection and support. I'm here to listen without judgment. To start, how are you feeling today?",
      sender: 'assistant',
      timestamp: Date.now(),
    }
  ]);
  const [isSending, setIsSending] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isBreathingExerciseOpen, setIsBreathingExerciseOpen] = useState(false);
  const [isTechInfoOpen, setIsTechInfoOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    voice: 'Kore',
    rate: 1.0,
  });

  const chatRef = useRef<Chat | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);

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
      setNotification("Audio generation failed. You can continue chatting.");
    }
  };
  
  // Initialize AudioContext and speak welcome message
  useEffect(() => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        
        // Speak the initial message once audio context is ready.
        // Note: This may be blocked by browser autoplay policies until a user interaction.
        const initialMessage = messages[0];
        if (initialMessage && initialMessage.sender === 'assistant') {
            speak(initialMessage.text);
        }
    }
  }, []); // This should run only once on mount.

  // Effect to clear notifications after a delay
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000); // clear after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [notification]);

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
  
  const handleSendMessage = async (text: string) => {
    // Resume AudioContext if it's suspended, as user interaction has occurred.
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(e => console.error("Error resuming AudioContext:", e));
    }

    setIsSending(true);

    let moodScoreResult: number | undefined;
    try {
        moodScoreResult = (await analyzeMood(text)) ?? undefined;
    } catch (error) {
        console.error("Mood analysis failed, continuing without it:", error);
        // This is a non-critical background task, so we don't notify the user.
    }

    const userMessage: Message = {
      id: generateId(),
      text,
      sender: 'user',
      timestamp: Date.now(),
      moodScore: moodScoreResult,
    };

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

    try {
        if (!chatRef.current) {
            throw new Error("Chat not initialized");
        }
        
        const stream = await chatRef.current.sendMessageStream({ message: text });

        let fullResponse = "";

        for await (const chunk of stream) {
            const chunkText = chunk.text;
            fullResponse += chunkText;

            // Stream to UI
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === assistantMessageId ? { ...msg, text: fullResponse, isLoading: false } : msg
                )
            );
        }
        
        // Speak the response sentence by sentence to reduce perceived lag
        if (fullResponse.trim()) {
            const sentences = fullResponse.trim().match(/[^.!?]+[.!?]?/g) || [];
            for (const sentence of sentences) {
                if(sentence.trim()) {
                    speak(sentence.trim());
                }
            }
        }

        // Finalize assistant message
        setMessages((prev) =>
            prev.map((msg) =>
                msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
            )
        );

        // Breathing exercise suggestion logic
        if (text.toLowerCase().includes('breathing') || (userMessage.moodScore && userMessage.moodScore <= 3)) {
            const suggestionMessage: Message = {
                id: generateId(),
                text: "It seems like a moment of calm could be helpful. Would you like to try a guided breathing exercise?",
                sender: 'assistant',
                timestamp: Date.now(),
                type: 'breathing_suggestion',
            };
            setMessages(prev => [...prev, suggestionMessage]);
        }

        // Summary generation logic (every 5 user messages) with graceful failure
        const userMessageCount = messages.filter(m => m.sender === 'user').length + 1;
        if (userMessageCount % 5 === 0) {
           try {
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
                 // Speak the summary using the unified audio system
                 const sentences = summaryText.trim().match(/[^.!?]+[.!?]?/g) || [];
                 for (const sentence of sentences) {
                   if (sentence.trim()) {
                     speak(sentence.trim());
                   }
                 }
               }
           } catch(error) {
               console.error("Summary generation failed, continuing without it:", error);
               // This is a non-critical background task, no user notification needed.
           }
        }

    } catch (error) {
      console.error('Error sending message:', error);
      // Provide more specific, actionable error messages in the chat.
      const errorMessage = (error instanceof Error && error.message.toLowerCase().includes('api key'))
        ? "I can't connect due to a configuration issue. Please inform the administrator."
        : "I'm having trouble connecting. Please check your internet connection and try again in a moment.";
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, text: errorMessage, isLoading: false, isStreaming: false }
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
          <ChatWindow messages={messages} onStartBreathingExercise={() => setIsBreathingExerciseOpen(true)} />
          <div className="px-4">
              <Affirmation />
          </div>
          <ChatInput onSendMessage={handleSendMessage} isSending={isSending} />
        </main>
      )}

      {/* Notification Toast for non-critical errors */}
      {notification && (
          <div className="fixed bottom-24 sm:bottom-6 right-6 bg-red-600 text-white p-3 rounded-lg shadow-lg z-50 transition-opacity duration-300">
              <p className="font-bold text-sm">A small hiccup!</p>
              <p className="text-xs">{notification}</p>
          </div>
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