import React from 'react';
import { Message } from '../types';
import { CloseIcon, ChartBarIcon } from './icons';
import { MoodChart } from './MoodChart';

interface MoodDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
}

const MoodInsight: React.FC<{ average: number }> = ({ average }) => {
    if (isNaN(average)) return null;

    let insightText = "Tracking your mood is a great step in understanding your emotional well-being.";
    let emoji = "😊";

    if (average >= 7.5) {
        insightText = "You've been feeling quite positive lately! Keep embracing what brings you joy.";
        emoji = "✨";
    } else if (average >= 5) {
        insightText = "You're navigating through a mix of feelings. Remember that every emotion is valid.";
        emoji = "😌";
    } else {
        insightText = "It looks like things have been challenging recently. Be extra kind to yourself.";
        emoji = "❤️";
    }

    return (
        <p className="text-center text-sm text-slate-400 mt-4">
            {emoji} {insightText}
        </p>
    );
};


export const MoodDashboard: React.FC<MoodDashboardProps> = ({ isOpen, onClose, messages }) => {
  const moodData = messages
    .filter(msg => msg.sender === 'user' && typeof msg.moodScore === 'number')
    .map(msg => ({
      timestamp: msg.timestamp,
      score: msg.moodScore!,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
    
  const averageMoodValue = moodData.length > 0
    ? (moodData.reduce((sum, data) => sum + data.score, 0) / moodData.length)
    : NaN;
    
  const averageMood = !isNaN(averageMoodValue) ? averageMoodValue.toFixed(1) : 'N/A';

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
      onClick={onClose}
    >
      <div 
        className={`bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-2xl m-4 relative transition-transform duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
          <CloseIcon />
        </button>
        <div className="flex items-center gap-3 mb-6">
           <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-pink-500 text-white">
                <ChartBarIcon />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-100">Mood Analytics</h2>
                <p className="text-sm text-slate-400">Your mood trends over time.</p>
            </div>
        </div>
        
        {moodData.length > 1 ? (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-slate-700 to-slate-600 rounded-lg text-center shadow-inner">
                <p className="text-sm text-slate-300">Average Mood Score</p>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-500">{averageMood}</p>
            </div>
            <div className="w-full h-64 bg-slate-700/50 p-2 rounded-lg">
               <MoodChart data={moodData} />
            </div>
            <MoodInsight average={averageMoodValue} />
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-400">Not enough data to display a chart.</p>
            <p className="text-sm text-slate-500">Have a few more conversations to see your mood trends.</p>
          </div>
        )}
      </div>
    </div>
  );
};