import React from 'react';
import { SettingsIcon, DocumentTextIcon, CollectionIcon, ChartBarIcon, WaveformIcon } from './icons';

interface HeaderProps {
  onSettingsClick: () => void;
  onTechInfoClick: () => void;
  onFlashcardsClick: () => void;
  onMoodClick: () => void;
  onLiveClick: () => void;
  onSummaryClick: () => void;
}

const HeaderButton: React.FC<{onClick: () => void, label: string, children: React.ReactNode}> = ({ onClick, label, children }) => (
    <div className="relative group">
        <button
          onClick={onClick}
          className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-violet-400 transition-colors"
          aria-label={label}
        >
          {children}
        </button>
        <div className="absolute top-full mt-2 -translate-x-1/2 left-1/2 bg-slate-700 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {label}
        </div>
    </div>
);


export const Header: React.FC<HeaderProps> = ({ 
    onSettingsClick, 
    onTechInfoClick,
    onFlashcardsClick,
    onMoodClick,
    onLiveClick,
    onSummaryClick,
}) => {
  return (
    <header className="relative bg-slate-800/80 backdrop-blur-lg shadow-sm p-4 border-b border-slate-700 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-500">
          🧠 MindEase
        </h1>
        <p className="text-sm text-slate-400 hidden sm:block">Your AI Study Buddy</p>
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
        <HeaderButton onClick={onFlashcardsClick} label="Open flashcards">
          <CollectionIcon />
        </HeaderButton>
        <HeaderButton onClick={onMoodClick} label="Open mood analytics">
          <ChartBarIcon />
        </HeaderButton>
        <HeaderButton onClick={onLiveClick} label="Start live conversation">
          <WaveformIcon />
        </HeaderButton>
        <HeaderButton onClick={onSummaryClick} label="Get session summary">
            <DocumentTextIcon className="w-6 h-6" />
        </HeaderButton>
         <div className="w-px h-6 bg-slate-600 mx-1"></div>
        <HeaderButton onClick={onSettingsClick} label="Open settings">
          <SettingsIcon />
        </HeaderButton>
        <HeaderButton onClick={onTechInfoClick} label="Open technical info">
          <DocumentTextIcon />
        </HeaderButton>
      </div>
    </header>
  );
};