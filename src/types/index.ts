export interface ChordItem {
  id: string;
  name: string;
  notes: string[]; // e.g., ["E2", "B2", "E3", "G3", "B3", "E4"]
  fretPositions: (number | null)[]; // length 6, low E to high E (0=open, null=muted/unplayed, 1-22=fret)
  section?: string; // e.g. "Verse", "Chorus", "Bridge", "Intro", "Outro"
}

export interface SavedProgression {
  id: string;
  name: string;
  createdAt: string; // ISO date string
  chords: ChordItem[];
  bpm?: number;
  beatsPerChord?: number;
  description?: string;
}

export interface DecidingChord {
  chordName: string;
  resolvesToKey: string;
  explanation: string;
}

export interface VoicingOption {
  fretPositions: string[]; // 6-element string array (e.g. ["X", "3", "2", "0", "1", "0"])
  notes: string[];
  shapeName?: string; // e.g. "Open Position", "Root-6 Barre", "Root-5 Barre", "Triad Inversion"
}

export interface NextChordSuggestion {
  chordName: string;
  fitScore: number; // 1-100
  theoreticalFunction: string;
  voicingOptions: VoicingOption[];
}

export interface TuningPreset {
  name: string;
  notes: string[]; // 6 strings from low to high (e.g. ["E2", "A2", "D3", "G3", "B3", "E4"])
  description?: string;
}

export interface SectionModalAnalysis {
  fromSection: string;
  toSection: string;
  modalShift: string; // e.g. "Relative Major Modulation", "Parallel Borrowing", "Dorian Shift"
  explanation: string;
}

export interface DetectedKeyCandidate {
  key: string;
  confidence: number; // 1-100
  scaleType: 'major' | 'minor' | 'modal';
  modeName?: string; // "Ionian", "Aeolian", "Dorian", "Mixolydian"
  reason?: string;
}

export interface AiAnalysisResult {
  potentialKeys: string[];
  likelyKeys?: DetectedKeyCandidate[];
  decidingChords: DecidingChord[];
  nextChordSuggestions: NextChordSuggestion[];
  overviewExplanation?: string; // Narrative overview and analysis of the harmonic voice leading
  detectedStyle?: string; // In auto mode, the style chosen by the AI (e.g. "Modal & Chromatic")
  sectionAnalysis?: SectionModalAnalysis[]; // Analysis of modal switches & relationships between sections
  analyzedAt?: string;
  source?: 'gemini' | 'demo';
  modelUsed?: string;
  explorationStyle?: 'auto' | 'modal' | 'jazz' | 'rock' | 'diatonic';
}

export interface PlaybackState {
  isPlaying: boolean;
  bpm: number; // 40-240
  beatsPerChord: number; // 1, 2, 3, 4
  currentChordIndex: number | null;
  loop: boolean;
}

export interface DetectedChordInfo {
  name: string;
  tonic: string;
  type: string;
  notes: string[];
  bass?: string;
  intervals?: string[];
  aliases?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
