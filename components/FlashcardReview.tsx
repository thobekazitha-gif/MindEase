import React, { useState, useEffect } from 'react';
import { Flashcard } from '../types';
import { CloseIcon } from './icons';

interface FlashcardReviewProps {
  cards: Flashcard[];
  onClose: () => void;
}

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({ cards, onClose }) => {
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  useEffect(() => {
    // Shuffle cards on component mount
    setShuffledCards([...cards].sort(() => Math.random() - 0.5));
  }, [cards]);

  const handleNext = () => {
    if (currentIndex < shuffledCards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      // End of review session
      onClose();
    }
  };

  const currentCard = shuffledCards[currentIndex];

  if (!currentCard) {
    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-95 z-50 flex flex-col justify-center items-center text-white">
            <p>No cards to review.</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-violet-600 rounded-lg">Go Back</button>
        </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-95 z-50 flex flex-col justify-center items-center p-4">
      <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
        <CloseIcon />
      </button>
      
      <div className="w-full max-w-xl text-center">
        <p className="text-slate-400 mb-2">Card {currentIndex + 1} of {shuffledCards.length}</p>

        {/* Flashcard */}
        <div 
          className="w-full h-64 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center p-6 cursor-pointer relative"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="transition-opacity duration-300">
            <h2 className="text-2xl font-bold text-white">
              {isFlipped ? currentCard.answer : currentCard.question}
            </h2>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6">
            {isFlipped ? (
                <button
                    onClick={handleNext}
                    className="w-full px-6 py-3 bg-violet-600 text-white font-bold rounded-lg hover:bg-violet-700 transition-colors text-lg"
                >
                    {currentIndex === shuffledCards.length - 1 ? 'Finish' : 'Next Card'}
                </button>
            ) : (
                <button
                    onClick={() => setIsFlipped(true)}
                    className="w-full px-6 py-3 bg-slate-700 text-slate-200 font-bold rounded-lg hover:bg-slate-600 transition-colors text-lg"
                >
                    Flip Card
                </button>
            )}
        </div>
      </div>
    </div>
  );
};
