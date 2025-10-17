import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import { BotIcon, LoadingSpinner, ClipboardIcon } from './icons';

interface ChatWindowProps {
  messages: Message[];
  onStartBreathingExercise: () => void;
}

// FIX: Implement the MessageItem component to render individual chat bubbles.
const MessageItem: React.FC<{ message: Message; onStartBreathingExercise: () => void; }> = ({ message, onStartBreathingExercise }) => {
  const isAssistant = message.sender === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
  };

  if (message.type === 'breathing_suggestion') {
    return (
      <div className="my-4 p-4 bg-slate-700/50 border-l-4 border-teal-500 rounded-r-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-slate-300">{message.text}</p>
        <button
            onClick={onStartBreathingExercise}
            className="px-5 py-2 bg-teal-600 text-white font-semibold rounded-full hover:bg-teal-700 transition-colors flex-shrink-0 self-start sm:self-center"
        >
            Start Breathing Exercise
        </button>
      </div>
    );
  }

  if (message.type === 'summary') {
    return (
      <div className="my-4 p-4 bg-slate-700/50 border-l-4 border-violet-500 rounded-r-lg">
        <h3 className="font-bold text-violet-400 mb-2">Session Reflection</h3>
        <p className="text-slate-300 whitespace-pre-wrap">{message.text}</p>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 my-4 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-pink-500 text-white">
          <BotIcon className="w-5 h-5" />
        </div>
      )}
      <div className={`group relative px-4 py-3 rounded-2xl max-w-sm md:max-w-md lg:max-w-lg ${isAssistant ? 'bg-slate-700 text-slate-200 rounded-tl-none' : 'bg-violet-600 text-white rounded-tr-none'}`}>
        {message.isLoading ? (
          <div className="flex items-center justify-center p-2">
            <LoadingSpinner />
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{message.text}</p>
        )}
        {isAssistant && !message.isLoading && (
          <button
            onClick={handleCopy}
            className="absolute -top-2 -right-2 p-1.5 bg-slate-600 rounded-full text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Copy message"
          >
            <ClipboardIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// FIX: Implement the ChatWindow component.
export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onStartBreathingExercise }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 relative">
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} onStartBreathingExercise={onStartBreathingExercise} />
      ))}
       {messages.length === 0 && (
         <div className="text-center text-slate-500 mt-10">
           <p>Start a conversation with MindEase.</p>
           <p className="text-sm">How are you feeling today?</p>
         </div>
       )}
    </div>
  );
};