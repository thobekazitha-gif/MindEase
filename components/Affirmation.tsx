import React, { useState, useEffect } from 'react';
import { affirmations } from '../data/affirmations';

export const Affirmation: React.FC = () => {
  const [currentAffirmation, setCurrentAffirmation] = useState('');

  useEffect(() => {
    // Pick a random affirmation on mount
    const randomIndex = Math.floor(Math.random() * affirmations.length);
    setCurrentAffirmation(affirmations[randomIndex]);
  }, []);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 pointer-events-none">
        <div className="bg-slate-800/80 backdrop-blur-lg p-3 text-center rounded-xl border border-slate-700 shadow-lg">
          <p className="text-sm text-slate-300 italic">
            ✨ <span className="font-medium text-violet-400">{currentAffirmation}</span>
          </p>
        </div>
    </div>
  );
};