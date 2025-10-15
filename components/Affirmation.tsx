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
    <div className="pb-2 pt-1">
        <div className="bg-slate-800/80 backdrop-blur-lg p-3 text-center rounded-xl border border-slate-700 shadow-lg">
          <p className="text-sm text-slate-300 italic">
            ✨ <span className="font-medium text-violet-400">{currentAffirmation}</span>
          </p>
        </div>
    </div>
  );
};