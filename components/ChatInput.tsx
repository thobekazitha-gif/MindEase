import React, { useState, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { SendIcon, MicrophoneIcon, StopIcon } from './icons';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isSending: boolean;
}

// FIX: Implement the ChatInput component.
export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isSending }) => {
  const [input, setInput] = useState('');
  const { isListening, transcript, startListening, stopListening, setTranscript } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isSending) {
      onSendMessage(input.trim());
      setInput('');
      setTranscript('');
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      setInput(''); // Clear input when starting to listen
      startListening();
    }
  };

  return (
    <div className="p-4 bg-slate-800/80 backdrop-blur-lg border-t border-slate-700">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleListening}
          className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-violet-400'}`}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? <StopIcon /> : <MicrophoneIcon />}
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? "Listening..." : "How are you feeling?"}
          className="flex-grow p-3 bg-slate-700 rounded-full text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 border border-transparent focus:border-violet-500"
          disabled={isSending || isListening}
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="p-3 bg-violet-600 rounded-full text-white hover:bg-violet-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
};
