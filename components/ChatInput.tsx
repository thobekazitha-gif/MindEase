import React, { useState, useEffect, useRef } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { SendIcon, MicrophoneIcon, StopIcon, BotIcon } from './icons';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isSending: boolean;
}

const MAX_CHARS = 2000;

const TypingIndicator = () => (
    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2 px-1 animate-pulse">
        <BotIcon className="w-5 h-5 flex-shrink-0" />
        <span className="italic">MindEase is thinking...</span>
    </div>
);

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isSending }) => {
  const [inputValue, setInputValue] = useState('');
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isListening) {
      setInputValue(transcript);
    }
  }, [transcript, isListening]);
  
  // Update input with final transcript when listening stops
  useEffect(() => {
    if (!isListening && transcript) {
        setInputValue(transcript);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);


  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [inputValue]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isSending && inputValue.length <= MAX_CHARS) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      if (isListening) {
        stopListening();
      }
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const charCount = inputValue.length;
  const charCountColor = charCount > MAX_CHARS 
    ? 'text-red-400' 
    : charCount > MAX_CHARS * 0.9 
    ? 'text-yellow-400' 
    : 'text-slate-400';

  return (
    <div className="p-4 bg-slate-800/80 backdrop-blur-lg border-t border-slate-700">
      {isSending && <TypingIndicator />}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={isListening ? 'Listening...' : 'Ask me anything about your studies...'}
              rows={1}
              className="w-full p-2 pr-16 bg-slate-700 text-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-violet-500 focus:outline-none transition max-h-32"
              disabled={isSending}
              maxLength={MAX_CHARS}
            />
            <div className={`absolute bottom-2 right-3 text-xs pointer-events-none ${charCountColor}`}>
                {charCount}/{MAX_CHARS}
            </div>
        </div>

        {browserSupportsSpeechRecognition && (
          <button
            type="button"
            onClick={toggleListening}
            className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isListening ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
            disabled={isSending}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? <StopIcon /> : <MicrophoneIcon />}
          </button>
        )}
        <button
          type="submit"
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-violet-600 text-white rounded-full hover:bg-violet-700 disabled:bg-slate-500 transition-colors"
          disabled={isSending || !inputValue.trim() || charCount > MAX_CHARS}
          aria-label="Send message"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};