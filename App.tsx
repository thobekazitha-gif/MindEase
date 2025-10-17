import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { SettingsPanel } from './components/SettingsPanel';
import { TechnicalInfoPanel } from './components/TechnicalInfoPanel';
import { MoodDashboard } from './components/MoodDashboard';
import { Affirmation } from './components/Affirmation';
import { BreathingExercise } from './components/BreathingExercise';
import { Message, VoiceSettings } from './types';
import { generateId, decode, decodeAudioData } from './utils/helpers';
import { getAudio, analyzeMood, getChatStream, generateImage } from './services/geminiService';
import { journalPrompts } from './data/journalPrompts';
import { Chat } from '@google/genai';

const App: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({ voice: 'Kore', rate: 1.0 });

    // UI State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isTechInfoOpen, setIsTechInfoOpen] = useState(false);
    const [isMoodDashboardOpen, setIsMoodDashboardOpen] = useState(false);
    const [isBreathingExerciseOpen, setIsBreathingExerciseOpen] = useState(false);

    // Audio playback queue
    const audioQueue = useRef<AudioBuffer[]>([]);
    const isPlayingAudio = useRef(false);
    const audioContext = useRef<AudioContext | null>(null);

    // Chat instance
    const chatRef = useRef<Chat | null>(null);
    
    const playAudio = async (text: string) => {
        if (!text || !audioContext.current) return;
        try {
            const base64Audio = await getAudio(text, voiceSettings);
            if (base64Audio) {
                const audioBytes = decode(base64Audio);
                const audioBuffer = await decodeAudioData(audioBytes, audioContext.current, 24000, 1);
                audioQueue.current = [...audioQueue.current, audioBuffer];
                // Trigger queue processing
                if (!isPlayingAudio.current) {
                    const event = new Event('audioQueueUpdated');
                    window.dispatchEvent(event);
                }
            }
        } catch (error) {
            console.error("Error playing audio:", error);
        }
    };


    // Welcome message on first load
    useEffect(() => {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        const randomJournalPrompt = journalPrompts[Math.floor(Math.random() * journalPrompts.length)];
        const welcomeText = `Hello! I'm MindEase, your AI study buddy. To get started, you can ask me to explain a concept, or we can reflect on your day. \n\nHere's a thought to get us started: **${randomJournalPrompt}**`;
        setMessages([
            {
                id: generateId(),
                text: welcomeText,
                sender: 'assistant',
                timestamp: Date.now()
            }
        ]);

        // Generate audio for the welcome message
        const textToSpeak = `Hello! I'm MindEase, your AI study buddy. To get started, you can ask me to explain a concept, or we can reflect on your day. Here's a thought to get us started: ${randomJournalPrompt}`;
        const sentences = textToSpeak.match(/[^.!?]+[.!?]+\s*|.+/g) || [];
        for (const sentence of sentences) {
            if (sentence.trim()) {
                playAudio(sentence.trim());
            }
        }

    }, []);
    
    // Process audio queue
    useEffect(() => {
        const playNextInQueue = () => {
            if (audioQueue.current.length > 0 && !isPlayingAudio.current && audioContext.current && audioContext.current.state === 'running') {
                isPlayingAudio.current = true;
                const audioBuffer = audioQueue.current.shift();
                if (!audioBuffer) return;
                
                const source = audioContext.current.createBufferSource();
                source.buffer = audioBuffer;
                
                source.playbackRate.value = voiceSettings.rate;
                source.connect(audioContext.current.destination);
                
                source.onended = () => {
                    isPlayingAudio.current = false;
                    playNextInQueue();
                };
                source.start();
            }
        };

        window.addEventListener('audioQueueUpdated', playNextInQueue);
      
        // Also check when rate changes
        playNextInQueue();

        return () => {
            window.removeEventListener('audioQueueUpdated', playNextInQueue);
        }

    }, [voiceSettings.rate]);


    const handleGenerateImage = async (prompt: string) => {
        const imageMessageId = generateId();
        const newImageMessage: Message = {
            id: imageMessageId,
            sender: 'assistant',
            timestamp: Date.now(),
            type: 'generated_image',
            isLoading: true,
            text: `Generating image for: "${prompt}"`,
        };
        setMessages(prev => [...prev, newImageMessage]);
        
        try {
            const imageDataUrl = await generateImage(prompt);
            if (imageDataUrl) {
                setMessages(prev => prev.map(msg => msg.id === imageMessageId ? { ...msg, isLoading: false, imageDataUrl } : msg));
            } else {
                throw new Error("No image data returned.");
            }
        } catch (error) {
            console.error("Image generation failed:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setMessages(prev => prev.map(msg => msg.id === imageMessageId ? { ...msg, isLoading: false, error: errorMessage } : msg));
        }
    };


    const handleSendMessage = async (userInput: string) => {
        // Resume audio context on the first user interaction to allow autoplay.
        if (audioContext.current && audioContext.current.state === 'suspended') {
            await audioContext.current.resume();
            // After resuming, trigger the queue to play the welcome message.
            const event = new Event('audioQueueUpdated');
            window.dispatchEvent(event);
        }

        if (!userInput.trim()) return;

        if (userInput.toLowerCase().includes("breathing exercise")) {
            setIsBreathingExerciseOpen(true);
            return;
        }

        setIsSending(true);
        const userMessageId = generateId();
        
        const moodPromise = analyzeMood(userInput);

        const newUserMessage: Message = {
            id: userMessageId,
            text: userInput,
            sender: 'user',
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, newUserMessage]);
        
        const assistantMessageId = generateId();
        const assistantMessage: Message = {
            id: assistantMessageId,
            text: '',
            sender: 'assistant',
            timestamp: Date.now(),
            isLoading: true,
        };
        setMessages(prev => [...prev, assistantMessage]);

        moodPromise.then(moodScore => {
            if (moodScore !== null) {
                setMessages(prev => prev.map(msg => msg.id === userMessageId ? { ...msg, moodScore } : msg));
            }
        });
        
        try {
            if (!chatRef.current) {
                const initialHistory = messages
                    .filter(m => (m.sender === 'user' || m.sender === 'assistant') && m.text)
                    .map(msg => ({
                        role: msg.sender === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.text }]
                    }));
                chatRef.current = getChatStream(initialHistory);
            }

            const stream = await chatRef.current.sendMessageStream({ message: userInput });

            let fullResponseText = '';
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                if (chunkText) {
                    fullResponseText += chunkText;
                    setMessages(prev => prev.map(msg => 
                        msg.id === assistantMessageId ? { ...msg, isLoading: true, isStreaming: true } : msg
                    ));
                }
            }

            let parsedResponse;
            try {
                // Ensure we have a complete JSON object before parsing
                const lastBrace = fullResponseText.lastIndexOf('}');
                const firstBrace = fullResponseText.indexOf('{');
                if (lastBrace > firstBrace) {
                    fullResponseText = fullResponseText.substring(firstBrace, lastBrace + 1);
                }
                parsedResponse = JSON.parse(fullResponseText);
            } catch (e) {
                console.error("Failed to parse JSON from stream:", e, "Response was:", fullResponseText);
                setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId ? { ...msg, text: "Sorry, I received an invalid response.", isLoading: false, isStreaming: false, error: "Response format was invalid." } : msg
                ));
                setIsSending(false);
                return;
            }
            
            // This is the text the AI voice will read. It comes ONLY from the 'text' field.
            const textToSpeak = parsedResponse.text;
            if (textToSpeak && typeof textToSpeak === 'string') {
                const sentences = textToSpeak.match(/[^.!?]+[.!?]+\s*|.+/g) || [];
                for (const sentence of sentences) {
                    if (sentence.trim()) {
                        playAudio(sentence.trim());
                    }
                }
            }

            const imageGenRegex = /\[GENERATE_VISUAL:\s*(.*?)\]/;
            const match = parsedResponse.text.match(imageGenRegex);
            let finalMessageText = parsedResponse.text;
            let imagePrompt: string | undefined = undefined;

            if (match && match[1]) {
                finalMessageText = finalMessageText.replace(imageGenRegex, '').trim();
                imagePrompt = match[1];
            }

            setMessages(prev => prev.map(msg => 
                msg.id === assistantMessageId ? { 
                    ...msg, 
                    text: finalMessageText,
                    visuals: parsedResponse.visuals,
                    references: parsedResponse.references,
                    isLoading: false,
                    isStreaming: false,
                } : msg
            ));

            if (imagePrompt) {
                const offerMessage: Message = {
                    id: generateId(),
                    text: '',
                    sender: 'assistant',
                    timestamp: Date.now(),
                    type: 'visual_aid_offer',
                    imagePrompt: imagePrompt,
                };
                setMessages(prev => [...prev, offerMessage]);
            }

        } catch (error) {
            console.error("Error during chat stream:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setMessages(prev => prev.map(msg => msg.id === assistantMessageId ? { ...msg, text: '', isLoading: false, error: errorMessage } : msg));
        } finally {
            setIsSending(false);
        }
    };


    return (
        <div className="flex flex-col h-screen bg-slate-900 text-white font-sans">
            <Header 
                onSettingsClick={() => setIsSettingsOpen(true)}
                onTechInfoClick={() => setIsTechInfoOpen(true)}
            />
            <div className="flex-1 flex flex-col min-h-0 relative">
                <Affirmation />
                <ChatWindow messages={messages} onGenerateImage={handleGenerateImage} />
                <div className="flex items-center justify-center gap-4 px-4 pb-2">
                    <button onClick={() => setIsMoodDashboardOpen(true)} className="text-xs text-slate-400 hover:text-violet-400 transition-colors">Mood Analytics</button>
                    <button onClick={() => setIsBreathingExerciseOpen(true)} className="text-xs text-slate-400 hover:text-violet-400 transition-colors">Breathing Exercise</button>
                </div>
                <ChatInput onSendMessage={handleSendMessage} isSending={isSending} />
            </div>

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
            <MoodDashboard
                isOpen={isMoodDashboardOpen}
                onClose={() => setIsMoodDashboardOpen(false)}
                messages={messages}
            />
            {isBreathingExerciseOpen && <BreathingExercise onClose={() => setIsBreathingExerciseOpen(false)} />}
        </div>
    );
}

export default App;
