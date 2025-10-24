import React, { useRef, useEffect, useState } from 'react';
import { Message, Visual, PracticeQuestion, GroundingSource } from '../types';
import { BotIcon, LoadingSpinner, ClipboardIcon, PhotographIcon, TableIcon, LinkIcon, LightbulbIcon, CollectionIcon } from './icons';

interface ChatWindowProps {
  messages: Message[];
  onGenerateImage?: (prompt: string) => void;
  onAddFlashcard: (question: PracticeQuestion) => void;
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

const GroundingSourcesDisplay: React.FC<{ sources: GroundingSource[] }> = ({ sources }) => (
    <div className="mt-4 pt-3 border-t border-slate-600/50">
        <h4 className="text-sm font-bold text-slate-300 mb-2">Sources</h4>
        <ul className="space-y-1">
            {sources.map((source, index) => (
                 <li key={index}>
                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-violet-400 hover:underline flex items-start gap-2 group">
                       <LinkIcon className="w-4 h-4 text-slate-400 group-hover:text-violet-400 transition-colors flex-shrink-0 mt-1" />
                       <span className="truncate">{source.title || new URL(source.uri).hostname}</span>
                    </a>
                </li>
            ))}
        </ul>
    </div>
);

const PracticeQuestionsDisplay: React.FC<{ questions: PracticeQuestion[], onAddFlashcard: (question: PracticeQuestion) => void; }> = ({ questions, onAddFlashcard }) => {
    const [addedIds, setAddedIds] = useState<number[]>([]);

    const handleAddClick = (question: PracticeQuestion, index: number) => {
        onAddFlashcard(question);
        setAddedIds(prev => [...prev, index]);
    };

    return (
        <div className="mt-4 pt-3 border-t border-slate-600/50">
            <h4 className="text-sm font-bold text-slate-300 mb-2">Practice Questions</h4>
            <ul className="space-y-2">
                {questions.map((q, index) => (
                    <li key={index} className="flex items-start justify-between gap-3 p-2 bg-slate-800/50 rounded-lg">
                        <p className="text-slate-300 text-sm leading-snug flex-1"><strong>Q:</strong> {q.question}</p>
                        <button
                            onClick={() => handleAddClick(q, index)}
                            disabled={addedIds.includes(index)}
                            className="flex-shrink-0 text-xs px-2 py-1 rounded-md bg-violet-600 hover:bg-violet-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors text-white font-semibold"
                        >
                            {addedIds.includes(index) ? 'Added!' : 'Add'}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};


const MessageItem: React.FC<{ message: Message; onGenerateImage?: (prompt: string) => void; onAddFlashcard: (question: PracticeQuestion) => void; }> = ({ message, onGenerateImage, onAddFlashcard }) => {
  const isAssistant = message.sender === 'assistant';
  const [isOfferClicked, setIsOfferClicked] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
  };

  const handleCreateDiagramClick = () => {
    if (onGenerateImage && message.imagePrompt && !isOfferClicked) {
        onGenerateImage(message.imagePrompt);
        setIsOfferClicked(true);
    }
  };

  const renderContent = () => {
    if (message.type === 'visual_aid_offer') {
        return (
            <button
                onClick={handleCreateDiagramClick}
                disabled={isOfferClicked}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
            >
                <PhotographIcon className="w-5 h-5" />
                <span>{isOfferClicked ? 'Generating...' : 'Create Diagram'}</span>
            </button>
        );
    }

    if (message.type === 'generated_image') {
        return (
            <div className="p-2 bg-slate-800 rounded-lg">
                {message.isLoading && (
                    <div className="w-64 h-64 flex items-center justify-center">
                        <LoadingSpinner />
                    </div>
                )}
                {message.error && (
                    <div className="w-64 p-2 text-center text-red-400 text-sm">
                        <p className="font-bold">Image Failed</p>
                        <p>{message.error}</p>
                    </div>
                )}
                {message.imageDataUrl && (
                    <img src={message.imageDataUrl} alt="Generated visual aid" className="max-w-xs rounded-md" />
                )}
            </div>
        );
    }

    return (
        <div className="prose prose-sm prose-invert prose-p:my-2">
            <p className="whitespace-pre-wrap">{message.text}</p>
            {message.visuals && message.visuals.length > 0 && <VisualsDisplay visuals={message.visuals} />}
            {message.references && message.references.length > 0 && <ReferencesDisplay references={message.references} />}
            {message.groundingSources && message.groundingSources.length > 0 && <GroundingSourcesDisplay sources={message.groundingSources} />}
            {message.practiceQuestions && message.practiceQuestions.length > 0 && <PracticeQuestionsDisplay questions={message.practiceQuestions} onAddFlashcard={onAddFlashcard} />}
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
        {message.isLoading && message.type !== 'generated_image' ? (
          <div className="flex items-center justify-center p-2">
            <LoadingSpinner />
          </div>
        ) : (
          renderContent()
        )}
        {isAssistant && !message.isLoading && message.text && (
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

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onGenerateImage, onAddFlashcard }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 relative">
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} onGenerateImage={onGenerateImage} onAddFlashcard={onAddFlashcard} />
      ))}
    </div>
  );
};
