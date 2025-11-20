export enum Vibe {
  RANDOM = 'Random',
  DEEP = 'Deep',
  FUNNY = 'Funny',
  DAILY_JOURNAL = 'Daily Journal',
  STORYTIME = 'Storytime',
  OPINION = 'Opinion',
  INTERVIEW = 'Interview'
}

export interface VibeConfig {
  id: Vibe;
  label: string;
  systemInstruction: string;
  color: string;
}

export const VIBE_CONFIGS: Record<Vibe, VibeConfig> = {
  [Vibe.RANDOM]: {
    id: Vibe.RANDOM,
    label: 'Random',
    systemInstruction: "You are a spontaneous and unpredictable conversationalist. Switch topics rapidly but logically. Surprise the user with interesting, off-the-wall questions.",
    color: 'bg-stone-600'
  },
  [Vibe.DEEP]: {
    id: Vibe.DEEP,
    label: 'Deep',
    systemInstruction: "You are a philosophical and introspective companion. Ask profound questions about life, existence, emotions, and the human condition. Speak calmly and thoughtfully.",
    color: 'bg-indigo-600'
  },
  [Vibe.FUNNY]: {
    id: Vibe.FUNNY,
    label: 'Funny',
    systemInstruction: "You are a comedian and a witty friend. Make jokes, appreciate the user's humor, and ask silly hypothetical questions. Keep the mood light and energetic.",
    color: 'bg-orange-500'
  },
  [Vibe.DAILY_JOURNAL]: {
    id: Vibe.DAILY_JOURNAL,
    label: 'Daily Journal',
    systemInstruction: "You are a supportive listener helping the user reflect on their day. Ask about their achievements, challenges, and feelings today. Be empathetic and encouraging.",
    color: 'bg-emerald-600'
  },
  [Vibe.STORYTIME]: {
    id: Vibe.STORYTIME,
    label: 'Storytime',
    systemInstruction: "You are an eager audience member who loves hearing stories. Prompt the user to tell you about specific memories or events. React with excitement and ask follow-up questions to flesh out the narrative.",
    color: 'bg-amber-600'
  },
  [Vibe.OPINION]: {
    id: Vibe.OPINION,
    label: 'Opinion',
    systemInstruction: "You are a debater and a curious interviewer. Ask the user for their hot takes and controversial opinions on various topics (food, movies, culture). Challenge them gently but playfully.",
    color: 'bg-rose-600'
  },
  [Vibe.INTERVIEW]: {
    id: Vibe.INTERVIEW,
    label: 'Interview',
    systemInstruction: "You are a professional yet warm talk show host. Interview the user as if they are a celebrity guest. Ask about their creative process, their life story, and their future plans.",
    color: 'bg-slate-700'
  }
};

export interface AudioState {
  isPlaying: boolean;
  isRecording: boolean;
  volume: number;
}
