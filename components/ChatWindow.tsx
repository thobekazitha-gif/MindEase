import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import { BotIcon, LoadingSpinner } from './icons';
import ReactMarkdown from 'react-markdown';

interface ChatWindowProps {
  messages: Message[];
}

// FIX: Implement the ChatWindow component.
export const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const MessageBubble = ({ msg }: { msg: Message }) => {
    const isUser = msg.sender === 'user';
    return (
      <div className={`flex items-end gap-2 my-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-pink-500 text-white">
            <BotIcon className="w-5 h-5" />
          </div>
        )}
        <div 
          className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${isUser ? 'bg-violet-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}
        >
          {msg.isLoading ? (
            <div className="flex items-center justify-center p-2">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="prose prose-sm prose-invert">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-grow p-4 overflow-y-auto bg-slate-900/50">
      <div className="max-w-4xl mx-auto">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};
