import { create } from 'zustand';
import type {
  AiAnalysisResult,
  ChordItem,
  DetectedChordInfo,
  PlaybackState,
  SavedProgression,
  ChatMessage,
  DetectedKeyCandidate,
} from '../types';
import { audioEngine } from '../services/audioEngine';
import {
  analyzeProgressionWithGemini,
  generateDemoAnalysis,
  chatWithProgressionAssistant,
  type ExplorationStyle,
} from '../services/geminiService';
import {
  detectChordFromFrets,
  detectLikelyKeys,
  getVoicedNotes,
  parseFretPositions,
  PRESET_PROGRESSIONS,
  STANDARD_TUNING,
  transposeNoteSemitone,
} from '../utils/guitarTheory';

interface AppStore {
  // Active Navigation View
  activeView: 'studio' | 'instructions';
  setActiveView: (view: 'studio' | 'instructions') => void;

  // BYOK API Key
  apiKey: string;
  setApiKey: (key: string) => void;
  isKeyModalOpen: boolean;
  setKeyModalOpen: (open: boolean) => void;

  // Guitar Tuning
  tuningName: string;
  tuningNotes: string[]; // 6 strings from string 0 (low E) to string 5 (high E)
  setTuning: (name: string, notes: string[]) => void;
  tuneString: (stringIndex: number, deltaSemitones: number) => void;

  // Neck Resizing
  neckStringHeight: number; // string row height in pixels (default: 32, range: 26 to 58)
  setNeckStringHeight: (height: number) => void;
  neckHorizontalStretch: number; // horizontal scale factor (1.0 = Fit 100% width, range: 1.0 to 2.5)
  setNeckHorizontalStretch: (stretch: number) => void;

  // Interactive Chord Highlight from AI Explanation
  highlightedChord: string | null;
  setHighlightedChord: (chord: string | null) => void;

  // Fretboard state
  // 6 elements from low string (index 0) to high string (index 5)
  // null = muted/unplayed, 0 = open, 1-22 = fret
  currentFretboard: (number | null)[];
  detectedChord: DetectedChordInfo | null;
  setFret: (stringIndex: number, fret: number | null) => void;
  toggleStringOpenMute: (stringIndex: number) => void;
  clearFretboard: () => void;
  setFretboardVoicing: (positions: (number | null)[]) => void;

  // Chord Progression
  progression: ChordItem[];
  likelyKeys: DetectedKeyCandidate[];
  activeSection: string; // Currently active section for new chords (default: "Verse")
  setActiveSection: (section: string) => void;
  setChordSection: (chordId: string, section: string) => void;
  addCurrentToProgression: () => void;
  addChordToProgression: (name: string, fretPositions: (number | null)[], section?: string) => void;
  removeChord: (id: string) => void;
  reorderChord: (fromIndex: number, toIndex: number) => void;
  clearProgression: () => void;
  loadChordToFretboard: (chord: ChordItem) => void;
  loadPresetProgression: (index: number) => void;

  // Saved Progressions (Custom Presets)
  savedProgressions: SavedProgression[];
  saveCurrentProgression: (name: string, description?: string) => SavedProgression | null;
  loadSavedProgression: (id: string) => void;
  deleteSavedProgression: (id: string) => void;
  importSavedProgressions: (importedList: SavedProgression[]) => void;

  // Audio Playback
  playback: PlaybackState;
  setBpm: (bpm: number) => void;
  setBeatsPerChord: (beats: number) => void;
  toggleLoop: () => void;
  startPlayback: () => void;
  stopPlayback: () => void;

  // AI Analysis
  aiAnalysis: AiAnalysisResult | null;
  harmonicStyle: ExplorationStyle;
  setHarmonicStyle: (style: ExplorationStyle) => void;
  isAnalyzing: boolean;
  analysisError: string | null;
  clearAnalysisError: () => void;
  runAiAnalysis: (forceDemo?: boolean) => Promise<void>;
  applyVoicingToFretboard: (fretPositions: string[]) => void;
  addSuggestionToProgression: (chordName: string, fretPositions: string[]) => void;

  // AI Studio Chat Assistant
  chatMessages: ChatMessage[];
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  chatDockPosition: 'panel' | 'bottom';
  setChatDockPosition: (pos: 'panel' | 'bottom') => void;
  isSendingChat: boolean;
  sendChatMessage: (content: string) => Promise<void>;
  clearChat: () => void;
}

const STORAGE_KEY = 'fretmind_gemini_key';
const STORAGE_HEIGHT_KEY = 'fretmind_neck_height';
const STORAGE_STRETCH_KEY = 'fretmind_neck_stretch';
const STORAGE_SAVED_PROGRESSIONS_KEY = 'fretmind_saved_progressions';
const STORAGE_CHAT_DOCK_KEY = 'fretmind_chat_dock';

// Default initial fretboard starts clear (no preset loaded at first)
const INITIAL_FRETBOARD: (number | null)[] = [null, null, null, null, null, null];

// Default initial progression starts completely empty
const INITIAL_PROGRESSION: ChordItem[] = [];

export const useStore = create<AppStore>((set, get) => {
  const initialKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) || '' : '';
  const savedHeight = typeof window !== 'undefined' ? parseInt(localStorage.getItem(STORAGE_HEIGHT_KEY) || '32', 10) : 32;
  const initialHeight = isNaN(savedHeight) || savedHeight < 26 || savedHeight > 58 ? 32 : savedHeight;
  const savedStretch = typeof window !== 'undefined' ? parseFloat(localStorage.getItem(STORAGE_STRETCH_KEY) || '1.0') : 1.0;
  const initialStretch = isNaN(savedStretch) || savedStretch < 1.0 || savedStretch > 3.0 ? 1.0 : savedStretch;

  let initialSavedProgressions: SavedProgression[] = [];
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_SAVED_PROGRESSIONS_KEY);
      if (raw) {
        initialSavedProgressions = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to parse saved progressions from localStorage', e);
    }
  }

  const savedChatDock = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_CHAT_DOCK_KEY) as 'panel' | 'bottom') : null;
  const initialChatDock: 'panel' | 'bottom' = savedChatDock === 'bottom' ? 'bottom' : 'panel';

  const initialTuningNotes = [...STANDARD_TUNING];
  const initialDetected = detectChordFromFrets(INITIAL_FRETBOARD, initialTuningNotes);

  return {
    activeView: 'studio',
    setActiveView: (view: 'studio' | 'instructions') => set({ activeView: view }),

    apiKey: initialKey,
    setApiKey: (key: string) => {
      const cleanKey = key.trim();
      localStorage.setItem(STORAGE_KEY, cleanKey);
      set({ apiKey: cleanKey });
    },
    isKeyModalOpen: false,
    setKeyModalOpen: (open: boolean) => set({ isKeyModalOpen: open }),

    // Tuning State
    tuningName: 'Standard',
    tuningNotes: initialTuningNotes,
    setTuning: (name: string, notes: string[]) => {
      const { currentFretboard } = get();
      const detected = detectChordFromFrets(currentFretboard, notes);
      set({ tuningName: name, tuningNotes: [...notes], detectedChord: detected });
    },
    tuneString: (stringIndex: number, deltaSemitones: number) => {
      const { tuningNotes, currentFretboard } = get();
      const newNotes = [...tuningNotes];
      newNotes[stringIndex] = transposeNoteSemitone(newNotes[stringIndex], deltaSemitones);
      const detected = detectChordFromFrets(currentFretboard, newNotes);
      set({ tuningName: 'Custom', tuningNotes: newNotes, detectedChord: detected });
    },

    // Neck Resizing
    neckStringHeight: initialHeight,
    setNeckStringHeight: (height: number) => {
      const clamped = Math.max(26, Math.min(58, Math.round(height)));
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_HEIGHT_KEY, clamped.toString());
      }
      set({ neckStringHeight: clamped });
    },
    neckHorizontalStretch: initialStretch,
    setNeckHorizontalStretch: (stretch: number) => {
      const clamped = Math.max(1.0, Math.min(2.5, Math.round(stretch * 100) / 100));
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_STRETCH_KEY, clamped.toString());
      }
      set({ neckHorizontalStretch: clamped });
    },

    // Interactive Chord Highlight
    highlightedChord: null,
    setHighlightedChord: (chord: string | null) => set({ highlightedChord: chord }),

    currentFretboard: INITIAL_FRETBOARD,
    detectedChord: initialDetected,

    setFret: (stringIndex: number, fret: number | null) => {
      const newFrets = [...get().currentFretboard];
      if (newFrets[stringIndex] === fret) {
        newFrets[stringIndex] = null;
      } else {
        newFrets[stringIndex] = fret;
      }
      const detected = detectChordFromFrets(newFrets, get().tuningNotes);
      set({ currentFretboard: newFrets, detectedChord: detected });
    },

    toggleStringOpenMute: (stringIndex: number) => {
      const newFrets = [...get().currentFretboard];
      const currentVal = newFrets[stringIndex];
      if (currentVal === 0) {
        newFrets[stringIndex] = null;
      } else {
        newFrets[stringIndex] = 0;
      }
      const detected = detectChordFromFrets(newFrets, get().tuningNotes);
      set({ currentFretboard: newFrets, detectedChord: detected });
    },

    clearFretboard: () => {
      const emptyFrets: (number | null)[] = [null, null, null, null, null, null];
      set({ currentFretboard: emptyFrets, detectedChord: null });
    },

    setFretboardVoicing: (positions: (number | null)[]) => {
      const detected = detectChordFromFrets(positions, get().tuningNotes);
      set({ currentFretboard: positions, detectedChord: detected });
    },

    progression: INITIAL_PROGRESSION,
    likelyKeys: detectLikelyKeys(INITIAL_PROGRESSION),
    activeSection: 'Verse',
    setActiveSection: (section: string) => set({ activeSection: section }),

    setChordSection: (chordId: string, section: string) => {
      const { progression } = get();
      const updated = progression.map((c) =>
        c.id === chordId ? { ...c, section } : c
      );
      set({ progression: updated, likelyKeys: detectLikelyKeys(updated) });
      get().runAiAnalysis();
    },

    addCurrentToProgression: () => {
      const { currentFretboard, detectedChord, progression, tuningNotes, activeSection } = get();
      const notes = getVoicedNotes(currentFretboard, tuningNotes);
      if (notes.length === 0) return;

      const chordName = detectedChord?.name || 'Custom Voicing';
      const newChord: ChordItem = {
        id: `chord-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: chordName,
        notes: notes,
        fretPositions: [...currentFretboard],
        section: activeSection || 'Verse',
      };

      const updated = [...progression, newChord];
      set({ progression: updated, likelyKeys: detectLikelyKeys(updated) });

      // Automatically trigger or refresh analysis
      get().runAiAnalysis();
    },

    addChordToProgression: (name: string, fretPositions: (number | null)[], section?: string) => {
      const { progression, tuningNotes, activeSection } = get();
      const notes = getVoicedNotes(fretPositions, tuningNotes);
      const newChord: ChordItem = {
        id: `chord-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: name,
        notes: notes,
        fretPositions: fretPositions,
        section: section || activeSection || 'Verse',
      };
      const updated = [...progression, newChord];
      set({ progression: updated, likelyKeys: detectLikelyKeys(updated) });
      get().runAiAnalysis();
    },

    removeChord: (id: string) => {
      const { progression, playback } = get();
      const updated = progression.filter((c) => c.id !== id);
      if (playback.isPlaying && updated.length === 0) {
        get().stopPlayback();
      }
      set({ progression: updated, likelyKeys: detectLikelyKeys(updated) });
      get().runAiAnalysis();
    },

    reorderChord: (fromIndex: number, toIndex: number) => {
      const { progression } = get();
      if (toIndex < 0 || toIndex >= progression.length) return;
      const copy = [...progression];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      set({ progression: copy, likelyKeys: detectLikelyKeys(copy) });
      get().runAiAnalysis();
    },

    clearProgression: () => {
      get().stopPlayback();
      set({ progression: [], likelyKeys: [], aiAnalysis: null, analysisError: null });
    },

    loadChordToFretboard: (chord: ChordItem) => {
      get().setFretboardVoicing([...chord.fretPositions]);
      audioEngine.playStrum(chord.notes);
    },

    loadPresetProgression: (index: number) => {
      const preset = PRESET_PROGRESSIONS[index];
      if (!preset) return;

      const loadedChords: ChordItem[] = preset.chords.map((c, i) => {
        const frets = parseFretPositions(c.frets);
        const notes = getVoicedNotes(frets, get().tuningNotes);
        return {
          id: `preset-${index}-${i}-${Date.now()}`,
          name: c.name,
          notes: notes,
          fretPositions: frets,
          section: i < 2 ? 'Verse' : 'Chorus',
        };
      });

      set({ progression: loadedChords, likelyKeys: detectLikelyKeys(loadedChords) });
      if (loadedChords.length > 0) {
        get().setFretboardVoicing([...loadedChords[0].fretPositions]);
      }
      get().runAiAnalysis();
    },

    // Custom Saved Progressions
    savedProgressions: initialSavedProgressions,

    saveCurrentProgression: (name: string, description?: string) => {
      const { progression, playback, savedProgressions } = get();
      if (progression.length === 0) return null;

      const newSaved: SavedProgression = {
        id: `prog-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: name.trim() || `Progression (${new Date().toLocaleDateString()})`,
        createdAt: new Date().toISOString(),
        chords: JSON.parse(JSON.stringify(progression)),
        bpm: playback.bpm,
        beatsPerChord: playback.beatsPerChord,
        description: description?.trim() || '',
      };

      const updated = [newSaved, ...savedProgressions];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_SAVED_PROGRESSIONS_KEY, JSON.stringify(updated));
      }
      set({ savedProgressions: updated });
      return newSaved;
    },

    loadSavedProgression: (id: string) => {
      const { savedProgressions } = get();
      const target = savedProgressions.find((p) => p.id === id);
      if (!target) return;

      const loadedChords: ChordItem[] = target.chords.map((c, i) => ({
        ...c,
        id: `loaded-${i}-${Date.now()}`,
      }));

      get().stopPlayback();
      set({
        progression: loadedChords,
        playback: {
          ...get().playback,
          bpm: target.bpm || get().playback.bpm,
          beatsPerChord: target.beatsPerChord || get().playback.beatsPerChord,
        },
      });

      if (loadedChords.length > 0) {
        get().setFretboardVoicing([...loadedChords[0].fretPositions]);
      }
      get().runAiAnalysis();
    },

    deleteSavedProgression: (id: string) => {
      const { savedProgressions } = get();
      const updated = savedProgressions.filter((p) => p.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_SAVED_PROGRESSIONS_KEY, JSON.stringify(updated));
      }
      set({ savedProgressions: updated });
    },

    importSavedProgressions: (importedList: SavedProgression[]) => {
      const { savedProgressions } = get();
      const existingIds = new Set(savedProgressions.map((p) => p.id));
      const freshToAdd = importedList.filter((p) => !existingIds.has(p.id));
      const combined = [...freshToAdd, ...savedProgressions];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_SAVED_PROGRESSIONS_KEY, JSON.stringify(combined));
      }
      set({ savedProgressions: combined });
    },

    // Playback State
    playback: {
      isPlaying: false,
      bpm: 96,
      beatsPerChord: 2,
      currentChordIndex: null,
      loop: true,
    },

    setBpm: (bpm: number) => {
      set((state) => ({ playback: { ...state.playback, bpm } }));
      if (get().playback.isPlaying) {
        get().startPlayback();
      }
    },

    setBeatsPerChord: (beats: number) => {
      set((state) => ({ playback: { ...state.playback, beatsPerChord: beats } }));
      if (get().playback.isPlaying) {
        get().startPlayback();
      }
    },

    toggleLoop: () => {
      const nextLoop = !get().playback.loop;
      set((state) => ({ playback: { ...state.playback, loop: nextLoop } }));
      if (get().playback.isPlaying) {
        get().startPlayback();
      }
    },

    startPlayback: () => {
      const { progression, playback } = get();
      if (progression.length === 0) return;

      audioEngine.startProgressionPlayback(
        progression,
        playback.bpm,
        playback.beatsPerChord,
        playback.loop,
        (currentIdx: number) => {
          set((state) => ({
            playback: { ...state.playback, currentChordIndex: currentIdx },
          }));
        },
        () => {
          set((state) => ({
            playback: { ...state.playback, isPlaying: false, currentChordIndex: null },
          }));
        }
      );

      set((state) => ({
        playback: { ...state.playback, isPlaying: true, currentChordIndex: 0 },
      }));
    },

    stopPlayback: () => {
      audioEngine.stopPlayback();
      set((state) => ({
        playback: { ...state.playback, isPlaying: false, currentChordIndex: null },
      }));
    },

    // AI Analysis
    aiAnalysis: null,
    harmonicStyle: 'auto', // Default to intelligent Auto detection
    setHarmonicStyle: (style: ExplorationStyle) => {
      set({ harmonicStyle: style });
      get().runAiAnalysis();
    },
    isAnalyzing: false,
    analysisError: null,
    clearAnalysisError: () => set({ analysisError: null }),

    runAiAnalysis: async (forceDemo = false) => {
      const { progression, apiKey, harmonicStyle } = get();
      if (!progression || progression.length === 0) {
        set({ aiAnalysis: null, analysisError: null });
        return;
      }

      set({ isAnalyzing: true, analysisError: null });

      try {
        if (!apiKey || forceDemo) {
          await new Promise((r) => setTimeout(r, 400));
          const result = generateDemoAnalysis(progression, harmonicStyle);
          set({ aiAnalysis: result, isAnalyzing: false });
        } else {
          const result = await analyzeProgressionWithGemini(progression, apiKey, harmonicStyle);
          set({ aiAnalysis: result, isAnalyzing: false, analysisError: null });
        }
      } catch (err: any) {
        console.warn('AI Analysis fallback triggered:', err);
        const demo = generateDemoAnalysis(progression, harmonicStyle);
        set({
          aiAnalysis: demo,
          isAnalyzing: false,
          analysisError: err?.message || 'Notice: Showing intelligent Music Theory engine suggestions.',
        });
      }
    },

    applyVoicingToFretboard: (fretPositions: string[]) => {
      const parsed = parseFretPositions(fretPositions);
      get().setFretboardVoicing(parsed);
      const notes = getVoicedNotes(parsed, get().tuningNotes);
      audioEngine.playStrum(notes);
    },

    addSuggestionToProgression: (chordName: string, fretPositions: string[]) => {
      const parsed = parseFretPositions(fretPositions);
      get().addChordToProgression(chordName, parsed);
    },

    // AI Studio Chat Assistant
    chatMessages: [
      {
        id: 'welcome-msg',
        role: 'assistant',
        content: 'Welcome to your AI Music Theory & Production Assistant! As you build your chord progression, ask me anything about scales, voice leading, section transitions, or chord substitutions.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ],
    isChatOpen: false,
    setIsChatOpen: (open: boolean) => set({ isChatOpen: open }),
    chatDockPosition: initialChatDock,
    setChatDockPosition: (pos: 'panel' | 'bottom') => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_CHAT_DOCK_KEY, pos);
      }
      set({
        chatDockPosition: pos,
        isChatOpen: pos === 'bottom' ? true : get().isChatOpen,
      });
    },
    isSendingChat: false,

    sendChatMessage: async (content: string) => {
      if (!content || !content.trim()) return;
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const updatedMessages = [...get().chatMessages, userMsg];
      set({ chatMessages: updatedMessages, isSendingChat: true });

      try {
        const { apiKey, progression, tuningNotes, tuningName, likelyKeys } = get();
        const likelyKeyNames = likelyKeys.map((k) => k.key);
        const replyText = await chatWithProgressionAssistant(apiKey, updatedMessages, {
          progression,
          tuningNotes,
          tuningName,
          likelyKeys: likelyKeyNames,
        });

        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        set({ chatMessages: [...updatedMessages, assistantMsg], isSendingChat: false });
      } catch (err: any) {
        console.error('Chat error:', err);
        const errorMsg: ChatMessage = {
          id: `msg-${Date.now()}-error`,
          role: 'assistant',
          content: 'Sorry, I encountered an issue generating a response. Please check your connection or try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        set({ chatMessages: [...updatedMessages, errorMsg], isSendingChat: false });
      }
    },

    clearChat: () => {
      set({
        chatMessages: [
          {
            id: `welcome-${Date.now()}`,
            role: 'assistant',
            content: 'Conversation cleared. How can I help you with your chord progression?',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      });
    },
  };
});
