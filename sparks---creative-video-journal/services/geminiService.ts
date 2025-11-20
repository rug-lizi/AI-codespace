import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { base64ToUint8Array, decodeAudioData, createPcmBlob, blobToBase64 } from "../utils/audioUtils";
import { Vibe, VIBE_CONFIGS } from "../types";

interface ConnectConfig {
  vibe: Vibe;
  onAudioData: (buffer: AudioBuffer) => void;
  onTranscription: (text: string, isModel: boolean, isFinal: boolean) => void;
  onError: (error: Error) => void;
  onClose: () => void;
}

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private videoInterval: number | null = null;
  private micEnabled = true;
  private lastModelText = "";
  
  // Playback state
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect(config: ConnectConfig) {
    try {
      // Initialize Audio Contexts
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      this.nextStartTime = this.outputAudioContext.currentTime;

      // Get Microphone Stream
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const vibeConfig = VIBE_CONFIGS[config.vibe];

      // Connect to Gemini Live
      const baseInstruction = `You are "Sparks", an AI video journal companion and language coach. You should keep the conversation flowing with thoughtful follow-up questions, using Chinese by default unless the user asks for another language. Refer to what you see on camera and what the user just said. Stay concise (1-3 sentences), warm, and never lecture.`;

      this.sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Session Opened");
            this.startAudioStreaming();
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && this.outputAudioContext) {
              const audioData = base64ToUint8Array(base64Audio);
              const audioBuffer = await decodeAudioData(audioData, this.outputAudioContext);
              this.queueAudio(audioBuffer);
              config.onAudioData(audioBuffer); // Notify UI for visualizer if needed
            }

            // Handle Transcriptions
            if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
               // Text part sometimes comes separately or with audio
            }

            if (message.serverContent?.outputTranscription?.text) {
                this.lastModelText = message.serverContent.outputTranscription.text;
                config.onTranscription(this.lastModelText, true, false);
            }

            if (message.serverContent?.inputTranscription?.text) {
                config.onTranscription(message.serverContent.inputTranscription.text, false, false);
            }

            if (message.serverContent?.turnComplete) {
                config.onTranscription(this.lastModelText, true, true); // Mark turn complete with final text
                this.lastModelText = "";
            }
            
            // Handle interruption
            if (message.serverContent?.interrupted) {
               this.stopAudioPlayback();
            }
          },
          onclose: () => {
            console.log("Gemini Live Session Closed");
            config.onClose();
          },
          onerror: (e: ErrorEvent) => {
            console.error("Gemini Live Error", e);
            config.onError(new Error("Connection error"));
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } 
          },
          systemInstruction: `${baseInstruction} ${vibeConfig.systemInstruction} Always include a clear, open-ended question each turn so the user sees it on screen and wants to reply.`,
          inputAudioTranscription: { model: "google-speech-v2" },
          outputAudioTranscription: { },
        }
      });
      
      return true;
    } catch (error) {
      console.error("Failed to connect:", error);
      throw error;
    }
  }

  private startAudioStreaming() {
    if (!this.inputAudioContext || !this.mediaStream) return;

    this.source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.micEnabled) return;

      const inputData = e.inputBuffer.getChannelData(0);
      // Send to Gemini
      const pcmBlob = createPcmBlob(inputData);
      this.sessionPromise?.then(session => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    this.source.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  setMicEnabled(enabled: boolean) {
    this.micEnabled = enabled;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  // Video Streaming helper
  startVideoStreaming(videoElement: HTMLVideoElement) {
    if (!this.sessionPromise) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const JPEG_QUALITY = 0.5; // Low quality for speed
    const FRAME_RATE = 1; // 1 FPS is sufficient for context

    this.videoInterval = window.setInterval(() => {
        if (!ctx || !videoElement.videoWidth) return;

        canvas.width = videoElement.videoWidth / 4; // Downscale
        canvas.height = videoElement.videoHeight / 4;
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(async (blob) => {
            if (blob) {
                const base64Data = await blobToBase64(blob);
                this.sessionPromise?.then(session => {
                    session.sendRealtimeInput({
                        media: {
                            mimeType: 'image/jpeg',
                            data: base64Data
                        }
                    });
                });
            }
        }, 'image/jpeg', JPEG_QUALITY);

    }, 1000 / FRAME_RATE);
  }

  private queueAudio(buffer: AudioBuffer) {
    if (!this.outputAudioContext) return;

    // Ensure we schedule ahead
    if (this.nextStartTime < this.outputAudioContext.currentTime) {
      this.nextStartTime = this.outputAudioContext.currentTime;
    }

    const source = this.outputAudioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.outputAudioContext.destination);
    
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
    
    this.sources.add(source);
    source.onended = () => {
      this.sources.delete(source);
    };
  }

  private stopAudioPlayback() {
    this.sources.forEach(source => {
        try { source.stop(); } catch (e) {}
    });
    this.sources.clear();
    // Reset timing
    if (this.outputAudioContext) {
        this.nextStartTime = this.outputAudioContext.currentTime;
    }
  }

  async disconnect() {
    if (this.videoInterval) {
        clearInterval(this.videoInterval);
        this.videoInterval = null;
    }

    this.stopAudioPlayback();

    if (this.source) {
        this.source.disconnect();
        this.source = null;
    }
    if (this.processor) {
        this.processor.disconnect();
        this.processor = null;
    }
    if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
    }
    if (this.inputAudioContext) {
        await this.inputAudioContext.close();
        this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
        await this.outputAudioContext.close();
        this.outputAudioContext = null;
    }
    
    // There is no session.close() method exposed in the current SDK snippet provided,
    // but dropping the reference and closing tracks is usually enough for cleanup in JS.
    this.sessionPromise = null;
  }
}
