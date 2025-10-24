import React from 'react';
import { VoiceSettings, ChatMode } from '../types';
import { CloseIcon } from './icons';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  onSettingsChange: (newSettings: VoiceSettings) => void;
}

const availableVoices = [
  { id: 'Kore', name: 'Kore (Female, Calm)' },
  { id: 'Zephyr', name: 'Zephyr (Male, Friendly)' },
  { id: 'Puck', name: 'Puck (Male, Energetic)' },
  { id: 'Charon', name: 'Charon (Male, Deep)' },
  { id: 'Fenrir', name: 'Fenrir (Female, Mature)' },
];

const chatModes: { id: ChatMode; name: string, description: string }[] = [
    { id: 'standard', name: 'Standard', description: 'Balanced speed and capability.' },
    { id: 'fast', name: 'Fast', description: 'Optimized for low-latency responses.' },
    { id: 'deep', name: 'Deep Thought', description: 'For complex, multi-step problems.' },
    { id: 'search', name: 'Web Search', description: 'For up-to-date, real-world info.' },
]

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingsChange({ ...settings, voice: e.target.value });
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, rate: parseFloat(e.target.value) });
  };
  
  const handleModeChange = (mode: ChatMode) => {
    onSettingsChange({ ...settings, chatMode: mode });
  }

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
      onClick={onClose}
    >
      <div 
        className={`bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-md m-4 relative transition-transform duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
          <CloseIcon />
        </button>
        <h2 className="text-xl font-bold text-slate-100 mb-6">Settings</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-3 border-b border-slate-700 pb-2">Chat</h3>
             <label className="block text-sm font-medium text-slate-300 mb-2">
              Chat Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {chatModes.map(mode => (
                    <button 
                        key={mode.id}
                        onClick={() => handleModeChange(mode.id)}
                        className={`text-left p-3 rounded-lg border-2 transition-colors ${settings.chatMode === mode.id ? 'bg-violet-600 border-violet-500' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`}
                    >
                        <p className="font-semibold text-white text-sm">{mode.name}</p>
                        <p className="text-xs text-slate-300">{mode.description}</p>
                    </button>
                ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-3 border-b border-slate-700 pb-2">Voice</h3>
             <div>
                <label htmlFor="voice-select" className="block text-sm font-medium text-slate-300 mb-2">
                  Assistant's Voice
                </label>
                <select
                  id="voice-select"
                  value={settings.voice}
                  onChange={handleVoiceChange}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                >
                  {availableVoices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <label htmlFor="rate-slider" className="block text-sm font-medium text-slate-300 mb-2">
                  Speech Rate ({settings.rate.toFixed(1)}x)
                </label>
                <input
                  id="rate-slider"
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.rate}
                  onChange={handleRateChange}
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Slower</span>
                  <span>Normal</span>
                  <span>Faster</span>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};