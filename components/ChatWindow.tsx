import React, { useRef, useEffect } from 'react';
import { Message, Visual } from '../types';
import { BotIcon, LoadingSpinner, ClipboardIcon, PhotographIcon, TableIcon, LinkIcon, LightbulbIcon } from './icons';

interface ChatWindowProps {
  messages: Message[];
}

const VisualIcon: React.FC<{type: string}> = ({ type }) => {
    switch(type.toLowerCase()) {
        case 'table':
            return <TableIcon className="w-5 h-5 text-cyan-400" />;
        case 'diagram':
        case 'illustration':
        case 'chart':
            return <PhotographIcon className="w-5 h-5 text-cyan-400" />;
        default:
            // FIX: LightbulbIcon was used without being imported, causing an error.
            return <LightbulbIcon className="w-5 h-5 text-cyan-400" />;
    }
}

const VisualsDisplay: React.FC<{ visuals: Visual[] }> = ({ visuals }) => (
    <div className="mt-4 pt-3 border-t border-slate-600/50">
        <h4 className="text-sm font-bold text-slate-300 mb-2">Visual Aids Suggested</h4>
        <ul className="space-y-3">
            {visuals.map((visual, index) => (
                <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                        <VisualIcon type={visual.type} />
                    </div>
                    <div>
                        <p className="text-slate-300 text-sm leading-snug">{visual.description}</p>
                        <a href={visual.source} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-violet-400 transition-colors inline-flex items-center gap-1">
                            Based on source
                            <LinkIcon className="w-3 h-3" />
                        </a>
                    </div>
                </li>
            ))}
        </ul>
    </div>
);

const ReferencesDisplay: React.FC<{ references: string[] }> = ({ references }) => (
    <div className="mt-4 pt-3 border-t border-slate-600/50">
        <h4 className="text-sm font-bold text-slate-300 mb-2">References</h4>
        <ul className="space-y-1">
            {references.map((ref, index) => {
                const domain = new URL(ref).hostname;
                return (
                    <li key={index}>
                        <a href={ref} target="_blank" rel="noopener noreferrer" className="text-sm text-violet-400 hover:underline flex items-center gap-2 group">
                           <LinkIcon className="w-4 h-4 text-slate-400 group-hover:text-violet-400 transition-colors" />
                           <span className="truncate">{domain}</span>
                        </a>
                    </li>
                );
            })}
        </ul>
    </div>
);


const MessageItem: React.FC<{ message: Message; }> = ({ message }) => {
  const isAssistant = message.sender === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
  };

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
          <div className="prose prose-sm prose-invert prose-p:my-2">
            <p className="whitespace-pre-wrap">{message.text}</p>
            {message.visuals && message.visuals.length > 0 && <VisualsDisplay visuals={message.visuals} />}
            {message.references && message.references.length > 0 && <ReferencesDisplay references={message.references} />}
          </div>
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

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 relative">
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
    </div>
  );
};
