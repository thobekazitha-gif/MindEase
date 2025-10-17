import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { CloseIcon, DocumentTextIcon } from './icons';
import { apiAnalysisMarkdown } from '../data/apiAnalysis';
import { architectureMarkdown } from '../data/architecture';

interface TechnicalInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'analysis' | 'architecture';

export const TechnicalInfoPanel: React.FC<TechnicalInfoPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('analysis');

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
      onClick={onClose}
    >
      <div 
        className={`bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl m-4 relative transition-transform duration-300 flex flex-col ${isOpen ? 'scale-100' : 'scale-95'}`} 
        style={{ height: 'calc(100vh - 4rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-700 flex items-center gap-3 flex-shrink-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-pink-500 text-white">
            <DocumentTextIcon />
          </div>
          <div className="flex-grow">
            <h2 className="text-xl font-bold text-slate-100">Technical Information</h2>
            <p className="text-sm text-slate-400">System architecture and API analysis documents.</p>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
            <CloseIcon />
          </button>
        </header>

        <nav className="p-2 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'analysis' ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
            >
              API Trade-Off Analysis
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'architecture' ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
            >
              System Architecture & Data Flow
            </button>
          </div>
        </nav>

        <div className="p-6 overflow-y-auto flex-grow">
          <article id="markdown-content" className="prose prose-sm prose-invert max-w-none prose-headings:text-violet-400 prose-code:text-pink-400 prose-code:bg-slate-700 prose-code:p-1 prose-code:rounded prose-pre:bg-slate-900 prose-pre:p-4 prose-pre:rounded-lg prose-th:text-slate-200">
            <ReactMarkdown>
                {activeTab === 'analysis' ? apiAnalysisMarkdown : architectureMarkdown}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
};