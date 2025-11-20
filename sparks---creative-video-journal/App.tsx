import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Video, Mic, MicOff, Sparkles, LogOut, Camera } from 'lucide-react';
import { VibeSelector } from './components/VibeSelector';
import { LiveOverlay } from './components/LiveOverlay';
import { GeminiLiveService } from './services/geminiService';
import { Vibe, VIBE_CONFIGS } from './types';

const App: React.FC = () => {
  // State
  const [isActive, setIsActive] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState<Vibe | null>(null);
  const [aiText, setAiText] = useState<string>("");
  const [userText, setUserText] = useState<string>("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const geminiService = useRef<GeminiLiveService | null>(null);

  // Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false // Audio handled by GeminiService separately to avoid feedback loops
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
        setError("Could not access camera. Please allow permissions.");
      }
    };
    startCamera();

    return () => {
      // Cleanup video tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle Session Start
  const startSession = useCallback(async (vibe: Vibe) => {
    setSelectedVibe(vibe);
    setError(null);
    
    geminiService.current = new GeminiLiveService();
    
    try {
      await geminiService.current.connect({
        vibe: vibe,
        onAudioData: (buffer) => {
          // Optional: Audio visualization logic here
        },
        onTranscription: (text, isModel, isFinal) => {
          if (isModel) {
            setAiText(prev => {
                // Simple logic to reset if it's a new turn
                if (isFinal) return prev; // Keep showing full text
                return prev.length > 100 ? text : prev + text; 
            });
            // If receiving chunks, replace text for smoother display if implementation sends partials
             // Actually for Gemini Live, often sends accumulated chunks or new parts.
             // Let's assume for this demo we overwrite or append based on context.
             // The service implementation logic passed accumulated text or chunks.
             // Let's simplify: Just show the latest large chunk or accumulating buffer.
             setAiText(text);
             setIsAiSpeaking(true);
             
             if (isFinal) {
                setTimeout(() => setIsAiSpeaking(false), 1000);
             }
          } else {
            setUserText(text);
            setIsAiSpeaking(false);
          }
        },
        onClose: () => {
          setIsActive(false);
          setSelectedVibe(null);
        },
        onError: (err) => {
          setError(err.message);
          setIsActive(false);
        }
      });

      setIsActive(true);
      // Start video streaming to Gemini
      if (videoRef.current) {
        geminiService.current.startVideoStreaming(videoRef.current);
      }
      
      // Trigger initial greeting (handled by model via system instruction usually, 
      // but we can rely on the "You are..." prompt to kickstart it when we send first empty/video frame)
      
    } catch (e) {
      setError("Failed to start AI session.");
    }
  }, []);

  // Handle Session End
  const endSession = useCallback(async () => {
    if (geminiService.current) {
      await geminiService.current.disconnect();
      geminiService.current = null;
    }
    setIsActive(false);
    setSelectedVibe(null);
    setAiText("");
    setUserText("");
  }, []);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-sans">
      {/* Background/Video Layer */}
      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        muted 
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
      />
      
      {/* Gradient Overlay for aesthetics */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

      {/* Top Header */}
      <header className="absolute top-0 left-0 right-0 p-6 z-30 flex justify-between items-center">
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
          <div className="bg-gradient-to-tr from-rose-400 to-orange-400 p-2 rounded-xl">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none font-serif">Sparks</h1>
            <p className="text-white/60 text-xs font-medium tracking-widest uppercase">Creative Video Journal</p>
          </div>
        </div>

        {isActive && (
          <button 
            onClick={endSession}
            className="group flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-100 rounded-full border border-red-500/30 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">End Session</span>
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="relative h-full w-full flex flex-col items-center justify-center">
        
        {/* State: Initial Vibe Selection */}
        {!isActive && !error && (
          <VibeSelector onSelect={startSession} />
        )}

        {/* State: Error */}
        {error && (
            <div className="z-50 bg-red-900/80 backdrop-blur-md text-white p-6 rounded-2xl border border-red-500 max-w-md text-center">
                <p className="mb-4">{error}</p>
                <button onClick={() => window.location.reload()} className="bg-white text-red-900 px-4 py-2 rounded-lg font-bold">Reload</button>
            </div>
        )}

        {/* State: Active Session Overlay */}
        {isActive && selectedVibe && (
          <LiveOverlay 
            aiText={aiText} 
            userText={userText} 
            isListening={!isAiSpeaking} 
            isAiSpeaking={isAiSpeaking}
            vibeLabel={VIBE_CONFIGS[selectedVibe].label}
          />
        )}
      </main>

      {/* Bottom Controls (Always visible if Active) */}
      {isActive && (
        <div className="absolute bottom-8 left-0 right-0 z-30 flex items-center justify-center gap-6 animate-in slide-in-from-bottom-4">
          
          <button 
            onClick={() => setIsMicOn(!isMicOn)}
            className={`p-4 rounded-full backdrop-blur-md border transition-all duration-200 ${
              isMicOn 
                ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                : 'bg-red-500/20 border-red-500/50 text-red-200'
            }`}
          >
            {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          {/* Main Active Indicator */}
          <div className="relative">
             <div className={`absolute inset-0 rounded-full bg-rose-500 blur-lg transition-all duration-500 ${isAiSpeaking ? 'opacity-50 scale-150' : 'opacity-0 scale-100'}`}></div>
             <div className="relative w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center backdrop-blur-sm bg-white/5 shadow-2xl">
                 <div className={`w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 transition-all duration-300 ${isAiSpeaking ? 'scale-90' : 'scale-100 pulse-ring'}`}>
                    {/* Inner visualization could go here */}
                 </div>
             </div>
          </div>

          <button className="p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all">
            <Camera className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;