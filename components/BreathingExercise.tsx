import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons';

interface BreathingExerciseProps {
  onClose: () => void;
}

// Implement the BreathingExercise component.
export const BreathingExercise: React.FC<BreathingExerciseProps> = ({ onClose }) => {
  const [instruction, setInstruction] = useState('Get ready...');
  const [phase, setPhase] = useState('ready'); // ready, in, hold, out

  useEffect(() => {
    const sequence = [
      { phase: 'in', instruction: 'Breathe in...', duration: 4000 },
      { phase: 'hold', instruction: 'Hold...', duration: 7000 },
      { phase: 'out', instruction: 'Breathe out...', duration: 8000 },
    ];
    const totalCycles = 3;
    let cycleCount = 0;
    let sequenceIndex = -1;
    // Changed NodeJS.Timeout to ReturnType<typeof setTimeout> for browser compatibility.
    let timer: ReturnType<typeof setTimeout>;

    const runSequence = () => {
      sequenceIndex++;
      
      if (sequenceIndex >= sequence.length) {
        sequenceIndex = 0;
        cycleCount++;
      }

      if (cycleCount >= totalCycles) {
        setInstruction('Complete.');
        setPhase('ready');
        setTimeout(onClose, 2000); // Close after 2 seconds
        return;
      }

      const current = sequence[sequenceIndex];
      setPhase(current.phase);
      setInstruction(current.instruction);
      timer = setTimeout(runSequence, current.duration);
    };

    const readyTimer = setTimeout(runSequence, 2000); // Start after 2s

    return () => {
      clearTimeout(readyTimer);
      clearTimeout(timer);
    };
  }, [onClose]);

  const getAnimationClasses = () => {
    switch (phase) {
      case 'in':
        return 'scale-110';
      case 'out':
        return 'scale-75';
      case 'hold':
      case 'ready':
      default:
        return 'scale-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-90 z-50 flex flex-col justify-center items-center">
      <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
        <CloseIcon />
      </button>
      <div className="text-center">
        <div
          className={`w-48 h-48 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center transition-transform duration-[3000ms] ease-in-out ${getAnimationClasses()}`}
        >
          <div className="w-44 h-44 rounded-full bg-slate-900 flex items-center justify-center">
             <p className="text-xl font-medium text-white">{instruction}</p>
          </div>
        </div>
        <p className="text-slate-400 mt-8 text-lg">Follow the rhythm to calm your mind.</p>
      </div>
    </div>
  );
};