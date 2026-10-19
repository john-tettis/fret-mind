export interface ChordItem {
  id: string;
  name: string;
  notes: string[]; // e.g., ["E2", "B2", "E3", "G3", "B3", "E4"]
  fretPositions: (number | null)[]; // length 6, low E to high E (0=open, null=muted/unplayed, 1-22=fret)
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

export interface AiAnalysisResult {
  potentialKeys: string[];
  decidingChords: DecidingChord[];
  nextChordSuggestions: NextChordSuggestion[];
  overviewExplanation?: string; // Narrative overview and analysis of the harmonic voice leading
  detectedStyle?: string; // In auto mode, the style chosen by the AI (e.g. "Modal & Chromatic")
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
