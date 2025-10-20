import React, { useState } from 'react';
import { Flashcard, PracticeQuestion } from '../types';
import { CloseIcon, CollectionIcon } from './icons';

interface FlashcardPanelProps {
  isOpen: boolean;
  onClose: () => void;
  flashcards: Flashcard[];
  onAddFlashcard: (card: PracticeQuestion) => void;
  onDeleteFlashcard: (id: string) => void;
  onStartReview: () => void;
}

const FlashcardItem: React.FC<{ card: Flashcard; onDelete: () => void }> = ({ card, onDelete }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    return (
        <div className="bg-slate-700 rounded-lg p-3 flex justify-between items-start gap-2">
            <div className="flex-1 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                <p className="text-sm text-slate-400 font-semibold">{isFlipped ? 'Answer' : 'Question'}</p>
                <p className="text-slate-200">{isFlipped ? card.answer : card.question}</p>
            </div>
            <button onClick={onDelete} className="text-slate-500 hover:text-red-400 transition-colors text-xs p-1">
                Delete
            </button>
        </div>
    );
};

export const FlashcardPanel: React.FC<FlashcardPanelProps> = ({ isOpen, onClose, flashcards, onAddFlashcard, onDeleteFlashcard, onStartReview }) => {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (front.trim() && back.trim()) {
        onAddFlashcard({ question: front, answer: back });
        setFront('');
        setBack('');
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
      onClick={onClose}
    >
      <div 
        className={`bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl m-4 relative transition-transform duration-300 flex flex-col ${isOpen ? 'scale-100' : 'scale-95'}`} 
        style={{ height: 'calc(100vh - 4rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-pink-500 text-white">
                    <CollectionIcon />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-100">My Flashcards ({flashcards.length})</h2>
                    <p className="text-sm text-slate-400">Create and review your study cards.</p>
                </div>
            </div>
            <button
                onClick={onStartReview}
                disabled={flashcards.length === 0}
                className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
            >
                Start Review
            </button>
        </header>
        
        <div className="p-4 border-b border-slate-700 flex-shrink-0">
            <form onSubmit={handleAddCard} className="space-y-2">
                <h3 className="text-sm font-medium text-slate-300">Create New Card</h3>
                <div className="flex items-center gap-2">
                    <input type="text" value={front} onChange={e => setFront(e.target.value)} placeholder="Question / Term" className="flex-1 p-2 bg-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none transition" />
                    <input type="text" value={back} onChange={e => setBack(e.target.value)} placeholder="Answer / Definition" className="flex-1 p-2 bg-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none transition" />
                    <button type="submit" className="px-3 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-500 transition-colors">Add</button>
                </div>
            </form>
        </div>

        <div className="p-4 overflow-y-auto flex-grow">
            {flashcards.length > 0 ? (
                <div className="space-y-2">
                    {flashcards.map(card => (
                        <FlashcardItem key={card.id} card={card} onDelete={() => onDeleteFlashcard(card.id)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-slate-400">Your flashcard deck is empty.</p>
                    <p className="text-sm text-slate-500">Create a card above or ask the assistant to generate some for you!</p>
                </div>
            )}
        </div>

        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
          <CloseIcon />
        </button>
      </div>
    </div>
  );
};
