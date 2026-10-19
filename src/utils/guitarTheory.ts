import { Chord, Note } from '@tonaljs/tonal';
import type { DetectedChordInfo } from '../types';

export interface GuitarStringConfig {
  index: number; // 0 to 5 (0 = 6th string low E, 5 = 1st string high E)
  name: string; // e.g. "E2"
  pitchName: string; // "E"
  octave: number; // 2
  baseMidi: number; // 40
  gauge: number; // string visual thickness in pixels
  isWound: boolean;
}

// 6 strings from low E (String 6) to high E (String 1)
export const GUITAR_STRINGS: GuitarStringConfig[] = [
  { index: 0, name: 'E2', pitchName: 'E', octave: 2, baseMidi: 40, gauge: 3.8, isWound: true },
  { index: 1, name: 'A2', pitchName: 'A', octave: 2, baseMidi: 45, gauge: 3.2, isWound: true },
  { index: 2, name: 'D3', pitchName: 'D', octave: 3, baseMidi: 50, gauge: 2.6, isWound: true },
  { index: 3, name: 'G3', pitchName: 'G', octave: 3, baseMidi: 55, gauge: 2.0, isWound: false },
  { index: 4, name: 'B3', pitchName: 'B', octave: 3, baseMidi: 59, gauge: 1.5, isWound: false },
  { index: 5, name: 'E4', pitchName: 'E', octave: 4, baseMidi: 64, gauge: 1.1, isWound: false },
];

export const STANDARD_TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];

export const TUNING_PRESETS = [
  {
    name: 'Standard',
    notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    description: 'E A D G B E (Universal standard)',
  },
  {
    name: 'Drop D',
    notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    description: 'D A D G B E (Heavy rock, drop low power chords)',
  },
  {
    name: 'DADGAD',
    notes: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'],
    description: 'D A D G A D (Modal Celtic, lush open resonance)',
  },
  {
    name: 'Open D',
    notes: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'],
    description: 'D A D F# A D (Open D major triad, slide guitar)',
  },
  {
    name: 'Open G',
    notes: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'],
    description: 'D G D G B D (Open G major triad, Keith Richards / Blues)',
  },
  {
    name: 'Open E',
    notes: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'],
    description: 'E B E G# B E (Open E major triad, blues slide)',
  },
  {
    name: 'Half Step Down (Eb)',
    notes: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'],
    description: 'Eb Ab Db Gb Bb Eb (Hendrix, SRV, warm acoustic resonance)',
  },
  {
    name: 'Full Step Down (D)',
    notes: ['D2', 'G2', 'C3', 'F3', 'A3', 'D4'],
    description: 'D G C F A D (Deep low tone, Elliott Smith)',
  },
  {
    name: 'Drop C',
    notes: ['C2', 'G2', 'C3', 'F3', 'A3', 'D4'],
    description: 'C G C F A D (Modern metal, aggressive low C power)',
  },
];

export const TOTAL_FRETS = 22;

export const FRET_MARKERS: number[] = [3, 5, 7, 9, 12, 15, 17, 19, 21];
export const DOUBLE_DOT_FRETS: number[] = [12];

/**
 * Gets base MIDI pitch for string using custom tuning or standard fallback
 */
export function getBaseMidiForString(stringIndex: number, tuningNotes?: string[]): number {
  if (tuningNotes && tuningNotes[stringIndex]) {
    const midi = Note.midi(tuningNotes[stringIndex]);
    if (midi !== null && midi !== undefined) return midi;
  }
  return GUITAR_STRINGS[stringIndex]?.baseMidi ?? 40;
}

/**
 * Transpose a note by semitones (e.g. "E2" + 1 -> "F2", "E2" - 1 -> "Eb2")
 */
export function transposeNoteSemitone(noteStr: string, semitones: number): string {
  const midi = Note.midi(noteStr);
  if (midi === null || midi === undefined) return noteStr;
  const newMidi = Math.max(24, Math.min(84, midi + semitones));
  return Note.fromMidi(newMidi) || noteStr;
}

/**
 * Calculates the exact scientific pitch note (e.g. "C3") for a given string and fret.
 */
export function getNoteForStringAndFret(
  stringIndex: number,
  fret: number | null,
  tuningNotes?: string[]
): string | null {
  if (fret === null || fret < 0 || fret > TOTAL_FRETS) return null;
  const baseMidi = getBaseMidiForString(stringIndex, tuningNotes);
  const midiPitch = baseMidi + fret;
  return Note.fromMidi(midiPitch);
}

/**
 * Given fretPositions array [fret0, fret1, fret2, fret3, fret4, fret5],
 * returns the array of active voiced notes from lowest to highest string.
 */
export function getVoicedNotes(
  fretPositions: (number | null)[],
  tuningNotes?: string[]
): string[] {
  const notes: string[] = [];
  for (let i = 0; i < fretPositions.length; i++) {
    const fret = fretPositions[i];
    if (fret !== null) {
      const note = getNoteForStringAndFret(i, fret, tuningNotes);
      if (note) notes.push(note);
    }
  }
  return notes;
}

/**
 * Normalize and beautify chord symbols:
 * CM -> C, CM7 -> Cmaj7, CM/G -> C/G
 */
export function beautifyChordSymbol(symbol: string): string {
  if (!symbol) return '';
  return symbol
    .replace(/^([A-G][#b]?)M7(\/.*)?$/, '$1maj7$2')
    .replace(/^([A-G][#b]?)M(\/.*)?$/, '$1$2');
}

function rankChordCandidate(name: string): number {
  let score = 0;
  // Penalize awkward m#5 and M#5 names when cleaner slash chords exist (e.g. GM/B instead of Bm#5)
  if (name.includes('m#5')) score -= 50;
  if (name.includes('M#5')) score -= 40;
  // Reward standard major and minor slash chords
  if (name.includes('M/')) score += 25;
  if (name.includes('m/')) score += 20;
  if (/^[A-G][#b]?(m|M|7|maj7|m7)?(\/[A-G][#b]?)?$/.test(name)) score += 15;
  return score;
}

/**
 * Detects chord from fret positions using Tonal.js
 */
export function detectChordFromFrets(
  fretPositions: (number | null)[],
  tuningNotes?: string[]
): DetectedChordInfo | null {
  const notes = getVoicedNotes(fretPositions, tuningNotes);
  if (notes.length === 0) return null;

  // Single note check
  if (notes.length === 1) {
    const singleNote = notes[0];
    const pitchOnly = Note.pitchClass(singleNote);
    return {
      name: `${pitchOnly} (Single Note)`,
      tonic: pitchOnly,
      type: 'single',
      notes: notes,
      bass: singleNote,
    };
  }

  // Detect using Tonal
  const detected = Chord.detect(notes);

  if (!detected || detected.length === 0) {
    // Check if dyad (2 notes) or partial power chord
    if (notes.length === 2) {
      const pc1 = Note.pitchClass(notes[0]);
      const pc2 = Note.pitchClass(notes[1]);
      return {
        name: `${pc1}-${pc2} Dyad`,
        tonic: pc1,
        type: 'dyad',
        notes: notes,
        bass: notes[0],
      };
    }
    return {
      name: 'Custom Voicing',
      tonic: Note.pitchClass(notes[0]),
      type: 'custom',
      notes: notes,
      bass: notes[0],
    };
  }

  // Sort candidates so standard triads/slash chords (e.g. G/B) rank higher than awkward names (Bm#5)
  const rankedCandidates = [...detected].sort((a, b) => rankChordCandidate(b) - rankChordCandidate(a));
  const primaryRaw = rankedCandidates[0];
  const formattedName = beautifyChordSymbol(primaryRaw);

  let baseSymbol = primaryRaw;
  let bassNote: string | undefined;

  if (primaryRaw.includes('/')) {
    const parts = primaryRaw.split('/');
    baseSymbol = parts[0];
    bassNote = parts[1];
  }

  const chordData = Chord.get(baseSymbol);

  return {
    name: formattedName,
    tonic: chordData.tonic || Note.pitchClass(notes[0]),
    type: chordData.name || chordData.type || 'Chord',
    notes: notes,
    bass: bassNote || Note.pitchClass(notes[0]),
    intervals: chordData.intervals,
    aliases: chordData.aliases,
  };
}

/**
 * Convert string array or representation like ["X", "3", "2", "0", "1", "0"] into (number | null)[]
 */
export function parseFretPositions(input: (string | number | null)[]): (number | null)[] {
  const result: (number | null)[] = [null, null, null, null, null, null];
  for (let i = 0; i < 6; i++) {
    const val = input[i];
    if (val === undefined || val === null) {
      result[i] = null;
    } else if (typeof val === 'number') {
      result[i] = isNaN(val) ? null : val;
    } else if (typeof val === 'string') {
      const trimmed = val.trim().toUpperCase();
      if (trimmed === 'X' || trimmed === '-' || trimmed === '') {
        result[i] = null;
      } else {
        const num = parseInt(trimmed, 10);
        result[i] = isNaN(num) ? null : num;
      }
    }
  }
  return result;
}

export interface PresetChord {
  name: string;
  category: 'Major' | 'Minor' | '7th' | 'Extended' | 'Barre';
  frets: (number | null)[];
}

export const PRESET_CHORDS: PresetChord[] = [
  // Open Major
  { name: 'C Major', category: 'Major', frets: [null, 3, 2, 0, 1, 0] },
  { name: 'G Major', category: 'Major', frets: [3, 2, 0, 0, 0, 3] },
  { name: 'D Major', category: 'Major', frets: [null, null, 0, 2, 3, 2] },
  { name: 'A Major', category: 'Major', frets: [null, 0, 2, 2, 2, 0] },
  { name: 'E Major', category: 'Major', frets: [0, 2, 2, 1, 0, 0] },

  // Open Minor
  { name: 'E Minor', category: 'Minor', frets: [0, 2, 2, 0, 0, 0] },
  { name: 'A Minor', category: 'Minor', frets: [null, 0, 2, 2, 1, 0] },
  { name: 'D Minor', category: 'Minor', frets: [null, null, 0, 2, 3, 1] },

  // Barre Chords
  { name: 'F Major (Barre)', category: 'Barre', frets: [1, 3, 3, 2, 1, 1] },
  { name: 'B Minor (Barre)', category: 'Barre', frets: [null, 2, 4, 4, 3, 2] },
  { name: 'F# Minor', category: 'Barre', frets: [2, 4, 4, 2, 2, 2] },
  { name: 'Bb Major', category: 'Barre', frets: [null, 1, 3, 3, 3, 1] },

  // 7th & Extended
  { name: 'Cmaj7', category: '7th', frets: [null, 3, 2, 0, 0, 0] },
  { name: 'G7', category: '7th', frets: [3, 2, 0, 0, 0, 1] },
  { name: 'Am7', category: '7th', frets: [null, 0, 2, 0, 1, 0] },
  { name: 'Em7', category: '7th', frets: [0, 2, 2, 0, 3, 0] },
  { name: 'D7', category: '7th', frets: [null, null, 0, 2, 1, 2] },
  { name: 'Dm7', category: '7th', frets: [null, null, 0, 2, 1, 1] },
  { name: 'Cadd9', category: 'Extended', frets: [null, 3, 2, 0, 3, 0] },
  { name: 'Asus4', category: 'Extended', frets: [null, 0, 2, 2, 3, 0] },
  { name: 'E7#9 (Hendrix)', category: 'Extended', frets: [0, 7, 6, 7, 8, null] },
];

export interface PresetProgression {
  title: string;
  genre: string;
  description: string;
  chords: { name: string; frets: (number | null)[] }[];
}

export const PRESET_PROGRESSIONS: PresetProgression[] = [
  {
    title: 'Pop / Acoustic Anthem (I - V - vi - IV)',
    genre: 'Pop / Rock',
    description: 'The most iconic chord progression in modern music (Axis of Awesome progression).',
    chords: [
      { name: 'C Major', frets: [null, 3, 2, 0, 1, 0] },
      { name: 'G Major', frets: [3, 2, 0, 0, 0, 3] },
      { name: 'A Minor', frets: [null, 0, 2, 2, 1, 0] },
      { name: 'F Major', frets: [1, 3, 3, 2, 1, 1] },
    ],
  },
  {
    title: 'Neo-Soul / Jazz Cadence (ii7 - V7 - Imaj7 - vi7)',
    genre: 'R&B / Jazz',
    description: 'Smooth harmonic turnaround with rich 7th chords and voice leading.',
    chords: [
      { name: 'Dm7', frets: [null, null, 0, 2, 1, 1] },
      { name: 'G7', frets: [3, 2, 0, 0, 0, 1] },
      { name: 'Cmaj7', frets: [null, 3, 2, 0, 0, 0] },
      { name: 'Am7', frets: [null, 0, 2, 0, 1, 0] },
    ],
  },
  {
    title: 'Spanish Cadence / Andalusian (i - VII - VI - V)',
    genre: 'Flamenco / Rock',
    description: 'Dramatic descending stepwise bassline resolving to dominant E Major.',
    chords: [
      { name: 'A Minor', frets: [null, 0, 2, 2, 1, 0] },
      { name: 'G Major', frets: [3, 2, 0, 0, 0, 3] },
      { name: 'F Major', frets: [1, 3, 3, 2, 1, 1] },
      { name: 'E Major', frets: [0, 2, 2, 1, 0, 0] },
    ],
  },
  {
    title: 'Moody Grunge / Ballad (vi - IV - I - V)',
    genre: 'Alternative',
    description: 'Atmospheric minor progression with emotional harmonic depth.',
    chords: [
      { name: 'Em7', frets: [0, 2, 2, 0, 3, 0] },
      { name: 'Cadd9', frets: [null, 3, 2, 0, 3, 0] },
      { name: 'G Major', frets: [3, 2, 0, 0, 3, 3] },
      { name: 'D Major', frets: [null, null, 0, 2, 3, 2] },
    ],
  },
  {
    title: 'Chromatic Line Cliché / Modal Dorian (Em/B - Baug - G/B - A)',
    genre: 'Cinematic / Progressive Rock',
    description: 'Descending chromatic voice line (E -> D# -> D -> C#) resolving into the bright Dorian IV chord (A Major), famously used in Pink Floyd, James Bond, and classic rock.',
    chords: [
      { name: 'Em/B', frets: [null, 2, 2, 0, null, null] },
      { name: 'Baug', frets: [null, 2, 1, 0, null, null] },
      { name: 'G/B', frets: [null, 2, 0, 0, null, null] },
      { name: 'A Major', frets: [5, 7, 7, 6, 5, 5] },
    ],
  },
];
