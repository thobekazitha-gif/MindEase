import React from 'react';
import { SettingsIcon, ChartBarIcon } from './icons';

interface HeaderProps {
  onSettingsClick: () => void;
  onDashboardClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSettingsClick, onDashboardClick }) => {
  return (
    <header className="relative bg-slate-800/80 backdrop-blur-lg shadow-sm p-4 border-b border-slate-700 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-500">
          🧠 MindEase
        </h1>
        <p className="text-sm text-slate-400">Your AI Mental Health & Motivation Assistant</p>
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <button
          onClick={onDashboardClick}
          className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-violet-400 transition-colors"
          aria-label="Open mood dashboard"
        >
          <ChartBarIcon />
        </button>
        <button
          onClick={onSettingsClick}
          className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-violet-400 transition-colors"
          aria-label="Open voice settings"
        >
          <SettingsIcon />
        </button>
      </div>
    </header>
  );
};