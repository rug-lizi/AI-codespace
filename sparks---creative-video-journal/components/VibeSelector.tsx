import React from 'react';
import { Vibe, VIBE_CONFIGS } from '../types';
import { Sparkles } from 'lucide-react';

interface VibeSelectorProps {
  onSelect: (vibe: Vibe) => void;
}

export const VibeSelector: React.FC<VibeSelectorProps> = ({ onSelect }) => {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all duration-500">
      <div className="bg-stone-900/80 backdrop-blur-md border border-white/10 p-8 rounded-3xl max-w-2xl w-full shadow-2xl text-center animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-center gap-2 mb-6 text-white">
          <Sparkles className="w-6 h-6 text-rose-400" />
          <h2 className="text-2xl font-serif tracking-wide">Choose a vibe to start</h2>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3">
          {Object.values(VIBE_CONFIGS).map((config) => (
            <button
              key={config.id}
              onClick={() => onSelect(config.id)}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 
                bg-white/5 hover:bg-white/20 text-white border border-white/10 hover:scale-105 hover:shadow-lg hover:border-white/30
                focus:outline-none focus:ring-2 focus:ring-rose-400/50`}
            >
              {config.label}
            </button>
          ))}
        </div>
        
        <p className="mt-8 text-white/40 text-sm">
          Sparks will adapt its personality to match your mood.
        </p>
      </div>
    </div>
  );
};