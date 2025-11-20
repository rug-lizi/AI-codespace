import React, { useEffect, useRef } from 'react';

interface LiveOverlayProps {
  aiText: string;
  userText: string;
  isListening: boolean;
  isAiSpeaking: boolean;
  vibeLabel: string;
}

export const LiveOverlay: React.FC<LiveOverlayProps> = ({ aiText, userText, isListening, isAiSpeaking, vibeLabel }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 p-6">
      {/* Main Glass Box */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-3xl bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-lg border border-white/20 rounded-3xl p-8 shadow-2xl overflow-hidden transition-all duration-500"
      >
        {/* Badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/80 text-white text-xs font-bold tracking-wider shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75 ${isAiSpeaking ? 'duration-500' : 'duration-1000'}`}></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            LIVE {vibeLabel.toUpperCase()}
        </div>

        {/* Content Area */}
        <div className="mt-8 flex flex-col gap-6 text-center min-h-[120px] justify-center">
            
            {/* AI Text */}
            <div className={`transition-opacity duration-500 ${aiText ? 'opacity-100' : 'opacity-0'}`}>
               <p className="text-2xl md:text-3xl font-serif leading-relaxed text-white drop-shadow-md">
                 "{aiText || "Listening..."}"
               </p>
            </div>

            {/* User Transcript (Subtitle style) */}
            {userText && (
               <div className="absolute bottom-4 left-0 right-0 px-8 animate-in slide-in-from-bottom-2">
                 <p className="text-white/70 text-lg font-medium bg-black/20 inline-block px-4 py-1 rounded-xl backdrop-blur-sm">
                   {userText}
                 </p>
               </div>
            )}
        </div>
      </div>
    </div>
  );
};