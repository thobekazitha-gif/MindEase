import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { getAi } from '../services/geminiService';
import { createBlob, decode, decodeAudioData } from '../utils/helpers';
import { CloseIcon, WaveformIcon, BotIcon, MicrophoneIcon } from './icons';

interface LiveConversationProps {
  isOpen: boolean;
  onClose: () => void;
}

type Transcript = {
    id: number;
    speaker: 'user' | 'model';
    text: string;
    isFinal: boolean;
};

type Session = Awaited<ReturnType<GoogleGenAI['live']['connect']>>;

export const LiveConversation: React.FC<LiveConversationProps> = ({ isOpen, onClose }) => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Press Start to Begin');
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    
    const sessionPromise = useRef<Promise<Session> | null>(null);
    const inputAudioContext = useRef<AudioContext | null>(null);
    const outputAudioContext = useRef<AudioContext | null>(null);
    const micStream = useRef<MediaStream | null>(null);
    const scriptProcessor = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSource = useRef<MediaStreamAudioSourceNode | null>(null);

    // Refs for audio playback queue
    const nextStartTime = useRef(0);
    const audioSources = useRef(new Set<AudioBufferSourceNode>());
    
    // Refs for accumulating transcription text
    const currentInputId = useRef<number | null>(null);
    const currentModelId = useRef<number | null>(null);
    const transcriptIdCounter = useRef(0);
    
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcripts]);
    
    const cleanup = () => {
        console.log('Cleaning up resources...');
        if (sessionPromise.current) {
            sessionPromise.current.then(session => session.close());
            sessionPromise.current = null;
        }
        if (scriptProcessor.current) {
            scriptProcessor.current.disconnect();
            scriptProcessor.current = null;
        }
        if (mediaStreamSource.current) {
            mediaStreamSource.current.disconnect();
            mediaStreamSource.current = null;
        }
        micStream.current?.getTracks().forEach(track => track.stop());
        micStream.current = null;
        
        inputAudioContext.current?.close();
        outputAudioContext.current?.close();
        
        setIsSessionActive(false);
        setStatusMessage('Press Start to Begin');
        setTranscripts([]);
    };

    const stopSession = () => {
        cleanup();
    };

    const startSession = async () => {
        setIsSessionActive(true);
        setStatusMessage('Initializing...');
        setTranscripts([]);
        transcriptIdCounter.current = 0;

        try {
            micStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            inputAudioContext.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContext.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });

            sessionPromise.current = getAi().live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        console.log('Session opened.');
                        setStatusMessage('Listening...');
                        if (!micStream.current || !inputAudioContext.current) return;
                        mediaStreamSource.current = inputAudioContext.current.createMediaStreamSource(micStream.current);
                        scriptProcessor.current = inputAudioContext.current.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessor.current.onaudioprocess = (event) => {
                            const inputData = event.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.current?.then(session => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        
                        mediaStreamSource.current.connect(scriptProcessor.current);
                        scriptProcessor.current.connect(inputAudioContext.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                         // --- Transcription Handling ---
                         if (message.serverContent?.inputTranscription) {
                            const { text, isFinal } = message.serverContent.inputTranscription;
                            if (currentInputId.current === null) {
                                transcriptIdCounter.current++;
                                currentInputId.current = transcriptIdCounter.current;
                                setTranscripts(prev => [...prev, { id: currentInputId.current!, speaker: 'user', text: text, isFinal: false }]);
                            } else {
                                setTranscripts(prev => prev.map(t => t.id === currentInputId.current! ? { ...t, text: t.text + text, isFinal } : t));
                            }
                        } else if (message.serverContent?.outputTranscription) {
                            const { text, isFinal } = message.serverContent.outputTranscription;
                            if (currentModelId.current === null) {
                                transcriptIdCounter.current++;
                                currentModelId.current = transcriptIdCounter.current;
                                setTranscripts(prev => [...prev, { id: currentModelId.current!, speaker: 'model', text: text, isFinal: false }]);
                            } else {
                                setTranscripts(prev => prev.map(t => t.id === currentModelId.current! ? { ...t, text: t.text + text, isFinal } : t));
                            }
                        }

                        if (message.serverContent?.turnComplete) {
                            currentInputId.current = null;
                            currentModelId.current = null;
                        }

                        // --- Audio Playback Handling ---
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContext.current) {
                            setStatusMessage('Speaking...');
                            nextStartTime.current = Math.max(nextStartTime.current, outputAudioContext.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext.current, 24000, 1);
                            const source = outputAudioContext.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContext.current.destination);
                            
                            source.addEventListener('ended', () => {
                                audioSources.current.delete(source);
                                if (audioSources.current.size === 0) {
                                    setStatusMessage('Listening...');
                                }
                            });
                            
                            source.start(nextStartTime.current);
                            nextStartTime.current += audioBuffer.duration;
                            audioSources.current.add(source);
                        }

                        if (message.serverContent?.interrupted) {
                            for (const source of audioSources.current.values()) {
                                source.stop();
                            }
                            audioSources.current.clear();
                            nextStartTime.current = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setStatusMessage('An error occurred. Please restart.');
                        cleanup();
                    },
                    onclose: () => {
                        console.log('Session closed.');
                        if (isSessionActive) { // Prevent cleanup on intentional close
                            cleanup();
                        }
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                    },
                    systemInstruction: 'You are a friendly and helpful AI study buddy.',
                    inputAudioTranscription: {},
                    outputAudioTranscription: {}
                }
            });
        } catch (error) {
            console.error('Failed to start session:', error);
            setStatusMessage('Failed to access microphone.');
            cleanup();
        }
    };
    
    // Main effect to handle component open/close
    useEffect(() => {
        if (isOpen) {
            // Component is opened, do nothing until user clicks start
        } else {
            stopSession();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    return (
        <div className={`fixed inset-0 bg-slate-900 bg-opacity-95 z-50 flex flex-col justify-center items-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
                <CloseIcon />
            </button>

            <div className="w-full max-w-2xl h-full flex flex-col">
                {/* Header */}
                <header className="text-center p-4 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                        <WaveformIcon />
                        Live Conversation
                    </h2>
                    <p className="text-slate-400">{statusMessage}</p>
                </header>

                {/* Transcript Window */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-800/50 rounded-lg">
                    {transcripts.map((t) => (
                        <div key={t.id} className={`flex items-start gap-3 ${t.speaker === 'model' ? '' : 'flex-row-reverse'}`}>
                            {t.speaker === 'model' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-pink-500 text-white">
                                    <BotIcon className="w-5 h-5" />
                                </div>
                            )}
                            {t.speaker === 'user' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-600 text-white">
                                    <MicrophoneIcon className="w-5 h-5" />
                                </div>
                            )}
                            <div className={`px-4 py-3 rounded-2xl max-w-sm md:max-w-md lg:max-w-lg ${t.speaker === 'model' ? 'bg-slate-700 text-slate-200 rounded-tl-none' : 'bg-violet-600 text-white rounded-tr-none'}`}>
                                <p className="whitespace-pre-wrap">{t.text}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Controls */}
                <footer className="p-4 flex-shrink-0">
                    <button
                        onClick={isSessionActive ? stopSession : startSession}
                        className={`w-full px-6 py-4 text-white font-bold rounded-lg transition-colors text-lg ${isSessionActive ? 'bg-red-600 hover:bg-red-700' : 'bg-violet-600 hover:bg-violet-700'}`}
                    >
                        {isSessionActive ? 'Stop Session' : 'Start Session'}
                    </button>
                </footer>
            </div>
        </div>
    );
};
