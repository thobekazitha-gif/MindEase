import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { SettingsPanel } from './components/SettingsPanel';
import { MoodDashboard } from './components/MoodDashboard';
import { Affirmation } from './components/Affirmation';
import { TechnicalInfoPanel } from './components/TechnicalInfoPanel';
import { Message, VoiceSettings, Visual } from './types';
import { generateId, decode, decodeAudioData } from './utils/helpers';
import { getAudio, getAi, generateImage } from './services/geminiService';
import { systemInstruction, studyBuddySchema } from './data/prompts';
// FIX: Import GenerateContentResponse to explicitly type the API response.
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      text: "Hi! I'm your AI Study Buddy. Let's explore a topic together. What would you like to learn about today? I can provide explanations, visual aids, and references to help you out!",
      sender: 'assistant',
      timestamp: Date.now(),
      visuals: [
          {
              description: "A friendly robot tutor waving hello, surrounded by books and lightbulbs.",
              type: "illustration",
              source: "https://google.com/images" 
          }
      ],
      references: ["https://en.wikipedia.org/wiki/Pedagogy"]
    }
  ]);
  const [isSending, setIsSending] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTechInfoOpen, setIsTechInfoOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    voice: 'Kore',
    rate: 1.0,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isProcessorActiveRef = useRef(false);
  const aiRef = useRef<GoogleGenAI | null>(null);

  // A more robust, async queue processor for audio playback.
  const processAudioQueue = async () => {
    if (isProcessorActiveRef.current || audioQueueRef.current.length === 0 || !audioContextRef.current || audioContextRef.current.state !== 'running') {
      return;
    }
    isProcessorActiveRef.current = true;

    while (audioQueueRef.current.length > 0) {
      const audioBuffer = audioQueueRef.current.shift();
      if (audioBuffer) {
        try {
          await new Promise<void>((resolve, reject) => {
            if (!audioContextRef.current) {
              reject(new Error("AudioContext is not available."));
              return;
            }
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.playbackRate.value = voiceSettings.rate;
            source.connect(audioContextRef.current.destination);
            source.onended = () => resolve();
            source.start();
          });
        } catch (error) {
            console.error("Error playing audio from queue:", error);
        }
      }
    }
    isProcessorActiveRef.current = false;
  };

  // Initialize AudioContext and speak welcome message
  useEffect(() => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        const initialMessage = messages[0];
        if (initialMessage && initialMessage.sender === 'assistant' && initialMessage.text) {
          const speakWelcomeMessage = async () => {
            if (!audioContextRef.current) return;
            try {
                const base64Audio = await getAudio(initialMessage.text, voiceSettings);
                if (base64Audio) {
                    const audioBytes = decode(base64Audio);
                    const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
                    audioQueueRef.current.push(audioBuffer);
                    processAudioQueue();
                }
            } catch (error) {
                console.error('Error playing welcome message audio:', error);
                setNotification("Audio generation failed for the welcome message.");
            }
          };
          speakWelcomeMessage();
        }
    }
  }, []);

  // Effect to clear notifications after a delay
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleGenerateImage = async (prompt: string) => {
    const imageMessageId = generateId();
    const imageMessage: Message = {
      id: imageMessageId,
      text: '',
      sender: 'assistant',
      timestamp: Date.now(),
      type: 'generated_image',
      isLoading: true,
    };
    setMessages((prev) => [...prev, imageMessage]);

    try {
      const imageDataUrl = await generateImage(prompt);
      if (!imageDataUrl) {
        throw new Error("The model did not return an image.");
      }
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === imageMessageId
            ? { ...msg, isLoading: false, imageDataUrl }
            : msg
        )
      );
    } catch (error) {
      console.error("Error generating image:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === imageMessageId
            ? { ...msg, isLoading: false, error: `Failed to generate image: ${errorMessage}` }
            : msg
        )
      );
    }
  };

  const handleSendMessage = async (text: string) => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().then(() => {
          processAudioQueue();
      }).catch(e => console.error("Error resuming AudioContext:", e));
    }

    setIsSending(true);

    const userMessage: Message = {
      id: generateId(),
      text,
      sender: 'user',
      timestamp: Date.now(),
    };

    const assistantMessageId = generateId();
    const assistantMessage: Message = {
        id: assistantMessageId,
        text: '',
        sender: 'assistant',
        timestamp: Date.now(),
        isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    try {
        if (!aiRef.current) {
          aiRef.current = getAi();
        }
        
        // FIX: Using `aiRef.current` directly in an async call can be unsafe for TypeScript's
        // type inference, as it can't guarantee the ref's value won't change before the `await`
        // resolves. Assigning it to a local constant `ai` provides a stable reference, which
        // resolves the issue where `response.text` was being inferred as type `never`.
        const ai = aiRef.current;
        if (!ai) {
          throw new Error("AI client not initialized.");
        }
        
        const conversationHistory = messages
            .filter(m => !m.isLoading)
            .map(m => `${m.sender}: ${m.text}`)
            .join('\n');
        
        const fullPrompt = `${conversationHistory}\nuser: ${text}\nassistant:`;

        // FIX: Add explicit type annotation to resolve TypeScript inference issue.
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: studyBuddySchema,
                temperature: 0.7
            }
        });

        const jsonText = response.text.trim();
        if (!jsonText) {
            throw new Error("Received an empty response from the AI.");
        }
        
        let parsedResponse: { text: string; visuals: Visual[]; references: string[] };

        try {
            parsedResponse = JSON.parse(jsonText);
        } catch (parseError) {
            console.error("Failed to parse JSON response:", jsonText);
            throw new Error("The AI returned a response in an unexpected format.");
        }
        
        let assistantText = parsedResponse.text || "I'm not sure how to respond to that.";
        const offerMatch = assistantText.match(/\[GENERATE_VISUAL:(.+?)\]/);
        let offerMessage: Message | null = null;
        
        if (offerMatch && offerMatch[1]) {
            assistantText = assistantText.replace(offerMatch[0], '').trim();
            offerMessage = {
                id: generateId(),
                sender: 'assistant',
                timestamp: Date.now() + 1, // ensure it appears after the text
                text: '',
                type: 'visual_aid_offer',
                imagePrompt: offerMatch[1].trim(),
            };
        }

        const finalAssistantMessage: Message = {
            id: assistantMessageId,
            text: assistantText,
            sender: 'assistant',
            timestamp: Date.now(),
            isLoading: false,
            visuals: parsedResponse.visuals,
            references: parsedResponse.references
        };
        
        setMessages(prev => prev.map(msg => msg.id === assistantMessageId ? finalAssistantMessage : msg));

        if (offerMessage) {
            setMessages(prev => [...prev, offerMessage]);
        }
        
        if (assistantText) {
          const sentences = (assistantText.trim().match(/[^.!?]+[.!?]?/g) || []).filter(s => s.trim());

          // Fire off all TTS requests concurrently to reduce latency.
          const audioPromises = sentences.map(sentence => getAudio(sentence, voiceSettings));

          // Process the results in order as they complete to maintain correct playback sequence.
          for (let i = 0; i < audioPromises.length; i++) {
              try {
                  const base64Audio = await audioPromises[i];
                  if (base64Audio && audioContextRef.current) {
                      const audioBytes = decode(base64Audio);
                      const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
                      audioQueueRef.current.push(audioBuffer);
                      processAudioQueue(); // Trigger the queue processor
                  }
              } catch (error) {
                  // Log the error for the specific sentence but continue processing the rest.
                  console.error(`Audio generation/processing failed for sentence: "${sentences[i]}"`, error);
              }
          }
        }
        
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, text: `Sorry, I ran into a problem: ${errorMessage}`, isLoading: false }
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
        onTechInfoClick={() => setIsTechInfoOpen(true)}
      />
        <main className="flex-1 flex flex-col min-h-0 relative">
          <ChatWindow messages={messages} onGenerateImage={handleGenerateImage} />
          <div className="px-4">
              <Affirmation />
          </div>
          <ChatInput onSendMessage={handleSendMessage} isSending={isSending} />
        </main>

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
      <TechnicalInfoPanel 
        isOpen={isTechInfoOpen}
        onClose={() => setIsTechInfoOpen(false)}
      />
    </div>
  );
};

export default App;
