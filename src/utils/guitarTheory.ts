import { Chord, Note, Key } from '@tonaljs/tonal';
import type { DetectedChordInfo, DetectedKeyCandidate, VoicingOption, ChordItem } from '../types';

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

/**
 * Normalizes chromatic pitch class to standard 12-TET sharps
 */
function normalizePitchClass(pc: string): string {
  const enharmonics: Record<string, string> = {
    Db: 'C#',
    Eb: 'D#',
    Gb: 'F#',
    Ab: 'G#',
    Bb: 'A#',
  };
  return enharmonics[pc] || pc;
}

/**
 * Returns lowest fret on a guitar string for a given pitch class
 */
export function getFretForNoteOnString(stringIdx: number, pitchClass: string): number | null {
  const stringRoots = ['E', 'A', 'D', 'G', 'B', 'E'];
  const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const target = normalizePitchClass(pitchClass);
  const sRoot = normalizePitchClass(stringRoots[stringIdx] || 'E');
  const targetIdx = chromatic.indexOf(target);
  const sIdx = chromatic.indexOf(sRoot);
  if (targetIdx === -1 || sIdx === -1) return null;
  return (targetIdx - sIdx + 12) % 12;
}

/**
 * Intelligent Dynamic Key Detector:
 * Evaluates chord progressions against diatonic major, natural minor, harmonic minor,
 * and modal scales to determine most likely musical keys with confidence scores.
 */
export function detectLikelyKeys(
  chordItemsOrNames: (ChordItem | string)[]
): DetectedKeyCandidate[] {
  if (!chordItemsOrNames || chordItemsOrNames.length === 0) return [];

  const rawNames = chordItemsOrNames.map((item) =>
    typeof item === 'string' ? item : item.name
  );

  const cleanChords = rawNames
    .map((c) =>
      c
        .replace(/\/.*$/, '')
        .replace(/\(.*\)/, '')
        .replace(/major/i, '')
        .replace(/minor/i, 'm')
        .replace(/maj/i, 'M')
        .trim()
    )
    .filter(Boolean);

  if (cleanChords.length === 0) return [];

  const tonics = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
  const candidates: DetectedKeyCandidate[] = [];

  for (const t of tonics) {
    // 1. Evaluate Major Key (Ionian)
    const maj = Key.majorKey(t);
    let majScore = 0;
    const majTriads = maj.triads;
    const majChords = maj.chords;

    cleanChords.forEach((c, idx) => {
      const isTriad = majTriads.some((triad) => c === triad || c.startsWith(triad));
      const is7th = majChords.some((ch) => c === ch);
      if (isTriad || is7th) {
        majScore += 26;
      } else if (maj.scale.some((note) => c.startsWith(note))) {
        majScore += 6;
      } else {
        majScore -= 12;
      }

      // First or last chord tonic bonus
      if ((idx === 0 || idx === cleanChords.length - 1) && (c === t || c.startsWith(t))) {
        majScore += 16;
      }
    });

    const majConfidence = Math.max(
      15,
      Math.min(99, Math.round((majScore / (cleanChords.length * 28)) * 82 + 15))
    );

    candidates.push({
      key: `${t} Major`,
      confidence: majConfidence,
      scaleType: 'major',
      modeName: 'Ionian',
      reason: `Matches ${t} Major scale notes (${maj.scale.join(', ')})`,
    });

    // 2. Evaluate Minor Key (Aeolian / Harmonic)
    const min = Key.minorKey(t);
    let minScore = 0;
    const minTriads = min.natural.triads;
    const minHarmonicTriads = min.harmonic.triads;

    cleanChords.forEach((c, idx) => {
      const isNatTriad = minTriads.some((triad) => c === triad || c.startsWith(triad));
      const isHarmTriad = minHarmonicTriads.some((triad) => c === triad || c.startsWith(triad));

      if (isNatTriad || isHarmTriad) {
        minScore += 26;
      } else if (min.natural.scale.some((note) => c.startsWith(note))) {
        minScore += 6;
      } else {
        minScore -= 12;
      }

      if ((idx === 0 || idx === cleanChords.length - 1) && (c.startsWith(`${t}m`) || c === `${t}m`)) {
        minScore += 16;
      }
    });

    const minConfidence = Math.max(
      15,
      Math.min(99, Math.round((minScore / (cleanChords.length * 28)) * 82 + 15))
    );

    candidates.push({
      key: `${t} Minor`,
      confidence: minConfidence,
      scaleType: 'minor',
      modeName: 'Aeolian',
      reason: `Matches ${t} Natural Minor scale notes (${min.natural.scale.join(', ')})`,
    });
  }

  // Sort descending by confidence
  candidates.sort((a, b) => b.confidence - a.confidence);

  // Return top unique 3
  const seen = new Set<string>();
  const topCandidates: DetectedKeyCandidate[] = [];
  for (const cand of candidates) {
    if (!seen.has(cand.key)) {
      seen.add(cand.key);
      topCandidates.push(cand);
      if (topCandidates.length >= 3) break;
    }
  }

  return topCandidates;
}

/**
 * Standard open chord library for immediate familiar acoustic voicings
 */
const KNOWN_OPEN_VOICINGS: Record<string, { frets: (number | null)[]; shapeName: string }[]> = {
  C: [{ frets: [null, 3, 2, 0, 1, 0], shapeName: 'Open Position' }],
  Cmaj: [{ frets: [null, 3, 2, 0, 1, 0], shapeName: 'Open Position' }],
  Cmaj7: [{ frets: [null, 3, 2, 0, 0, 0], shapeName: 'Open Position' }],
  C7: [{ frets: [null, 3, 2, 3, 1, 0], shapeName: 'Open Position' }],
  Cadd9: [{ frets: [null, 3, 2, 0, 3, 0], shapeName: 'Open Position (Acoustic)' }],
  Csus4: [{ frets: [null, 3, 3, 0, 1, 1], shapeName: 'Open Position' }],
  Cm: [{ frets: [null, 3, 5, 5, 4, 3], shapeName: 'Root-5 Barre' }],
  Cm7: [{ frets: [null, 3, 5, 3, 4, 3], shapeName: 'Root-5 Barre' }],

  G: [{ frets: [3, 2, 0, 0, 0, 3], shapeName: 'Open Position' }],
  Gmaj: [{ frets: [3, 2, 0, 0, 0, 3], shapeName: 'Open Position' }],
  G7: [{ frets: [3, 2, 0, 0, 0, 1], shapeName: 'Open Position' }],
  Gmaj7: [{ frets: [3, 2, 0, 0, 0, 2], shapeName: 'Open Position' }],
  Gm: [{ frets: [3, 5, 5, 3, 3, 3], shapeName: 'Root-6 Barre' }],
  Gm7: [{ frets: [3, 5, 3, 3, 3, 3], shapeName: 'Root-6 Barre' }],

  D: [{ frets: [null, null, 0, 2, 3, 2], shapeName: 'Open Position' }],
  Dmaj: [{ frets: [null, null, 0, 2, 3, 2], shapeName: 'Open Position' }],
  Dm: [{ frets: [null, null, 0, 2, 3, 1], shapeName: 'Open Position' }],
  D7: [{ frets: [null, null, 0, 2, 1, 2], shapeName: 'Open Position' }],
  Dmaj7: [{ frets: [null, null, 0, 2, 2, 2], shapeName: 'Open Position' }],
  Dm7: [{ frets: [null, null, 0, 2, 1, 1], shapeName: 'Open Position' }],
  Dsus4: [{ frets: [null, null, 0, 2, 3, 3], shapeName: 'Open Position' }],

  A: [{ frets: [null, 0, 2, 2, 2, 0], shapeName: 'Open Position' }],
  Amaj: [{ frets: [null, 0, 2, 2, 2, 0], shapeName: 'Open Position' }],
  Am: [{ frets: [null, 0, 2, 2, 1, 0], shapeName: 'Open Position' }],
  A7: [{ frets: [null, 0, 2, 0, 2, 0], shapeName: 'Open Position' }],
  Am7: [{ frets: [null, 0, 2, 0, 1, 0], shapeName: 'Open Position' }],
  Amaj7: [{ frets: [null, 0, 2, 1, 2, 0], shapeName: 'Open Position' }],
  Asus4: [{ frets: [null, 0, 2, 2, 3, 0], shapeName: 'Open Position' }],

  E: [{ frets: [0, 2, 2, 1, 0, 0], shapeName: 'Open Position' }],
  Emaj: [{ frets: [0, 2, 2, 1, 0, 0], shapeName: 'Open Position' }],
  Em: [{ frets: [0, 2, 2, 0, 0, 0], shapeName: 'Open Position' }],
  E7: [{ frets: [0, 2, 0, 1, 0, 0], shapeName: 'Open Position' }],
  Em7: [{ frets: [0, 2, 2, 0, 3, 0], shapeName: 'Open Position' }],
  Emaj7: [{ frets: [0, 2, 1, 1, 0, 0], shapeName: 'Open Position' }],
  Esus4: [{ frets: [0, 2, 2, 2, 0, 0], shapeName: 'Open Position' }],

  F: [{ frets: [1, 3, 3, 2, 1, 1], shapeName: 'Root-6 Barre' }, { frets: [null, null, 3, 2, 1, 1], shapeName: 'Small Barre' }],
  Fmaj7: [{ frets: [null, null, 3, 2, 1, 0], shapeName: 'Open Top Shape' }, { frets: [1, null, 2, 2, 1, null], shapeName: 'Root-6 Jazzy' }],
  Fm: [{ frets: [1, 3, 3, 1, 1, 1], shapeName: 'Root-6 Barre' }],
  Fm7: [{ frets: [1, 3, 1, 1, 1, 1], shapeName: 'Root-6 Barre' }],

  B: [{ frets: [null, 2, 4, 4, 4, 2], shapeName: 'Root-5 Barre' }],
  Bm: [{ frets: [null, 2, 4, 4, 3, 2], shapeName: 'Root-5 Barre' }],
  B7: [{ frets: [null, 2, 1, 2, 0, 2], shapeName: 'Open Position' }],
  Bm7: [{ frets: [null, 2, 4, 2, 3, 2], shapeName: 'Root-5 Barre' }],
  Bm7b5: [{ frets: [null, 2, 3, 2, 3, null], shapeName: 'Half-Diminished 5th-string' }],

  Bb: [{ frets: [null, 1, 3, 3, 3, 1], shapeName: 'Root-5 Barre' }],
  Bbm: [{ frets: [null, 1, 3, 3, 2, 1], shapeName: 'Root-5 Barre' }],
};

/**
 * Intelligent Guitar Voicing Generator:
 * Given any chord name, returns 2 to 4 distinct, playable guitar voicings across the neck
 * (Open position, Root-6 barre, Root-5 barre, Upper triad / Inversion).
 */
export function generateVoicingOptions(
  chordName: string,
  tuningNotes?: string[]
): VoicingOption[] {
  const options: VoicingOption[] = [];
  const seenFretStrings = new Set<string>();

  const cleanName = chordName.replace(/\/.*$/, '').trim();
  const tonicMatch = cleanName.match(/^([A-G][#b]?)/);
  if (!tonicMatch) return [];
  const tonic = tonicMatch[1];
  const quality = cleanName.substring(tonic.length).toLowerCase();

  // Helper to add voicing
  const addVoicing = (frets: (number | null)[], shapeName: string) => {
    // Check fret validity (0-16 frets, playable span <= 4)
    const fretted = frets.filter((f): f is number => f !== null && f > 0);
    if (fretted.length > 0) {
      const minFret = Math.min(...fretted);
      const maxFret = Math.max(...fretted);
      if (maxFret > 16 || maxFret - minFret > 4) return;
    }

    const fretStr = frets.map((f) => (f === null ? 'X' : String(f)));
    const key = fretStr.join('-');
    if (seenFretStrings.has(key)) return;
    seenFretStrings.add(key);

    const notes = getVoicedNotes(frets, tuningNotes);
    if (notes.length >= 2) {
      options.push({
        fretPositions: fretStr,
        notes,
        shapeName,
      });
    }
  };

  // 1. Check known open shapes
  const normalizedKey = cleanName.replace(/\s+/g, '');
  if (KNOWN_OPEN_VOICINGS[normalizedKey]) {
    for (const v of KNOWN_OPEN_VOICINGS[normalizedKey]) {
      addVoicing(v.frets, v.shapeName);
    }
  }

  // 2. Movable Root-6 (E-shape) Barre
  const root6Fret = getFretForNoteOnString(0, tonic);
  if (root6Fret !== null) {
    const r = root6Fret;
    if (quality.includes('m7b5') || quality.includes('dim')) {
      addVoicing([r, null, r - 1 < 0 ? r + 11 : r - 1, r, r - 1 < 0 ? r + 11 : r - 1, null], 'Root-6 Diminished');
    } else if (quality.includes('maj7') || quality.includes('m7+')) {
      addVoicing([r, null, r + 1, r + 1, r, null], 'Root-6 Maj7 (Jazz)');
    } else if (quality.includes('m7') || quality.includes('min7')) {
      addVoicing([r, r + 2, r, r, r, r], 'Root-6 Min7');
    } else if (quality.includes('7')) {
      addVoicing([r, r + 2, r, r + 1, r, r], 'Root-6 Dominant 7');
    } else if (quality.includes('m') || quality.includes('min')) {
      addVoicing([r, r + 2, r + 2, r, r, r], 'Root-6 Barre (Minor)');
    } else if (quality.includes('sus4')) {
      addVoicing([r, r + 2, r + 2, r + 2, r, r], 'Root-6 Sus4');
    } else {
      addVoicing([r, r + 2, r + 2, r + 1, r, r], 'Root-6 Barre (Major)');
    }
  }

  // 3. Movable Root-5 (A-shape) Barre
  const root5Fret = getFretForNoteOnString(1, tonic);
  if (root5Fret !== null) {
    const r = root5Fret;
    if (quality.includes('m7b5')) {
      addVoicing([null, r, r + 1, r, r + 1, null], 'Root-5 Half-Diminished');
    } else if (quality.includes('maj7')) {
      addVoicing([null, r, r + 2, r + 1, r + 2, r], 'Root-5 Maj7');
    } else if (quality.includes('m7') || quality.includes('min7')) {
      addVoicing([null, r, r + 2, r, r + 1, r], 'Root-5 Min7');
    } else if (quality.includes('7')) {
      addVoicing([null, r, r + 2, r, r + 2, r], 'Root-5 Dominant 7');
    } else if (quality.includes('m') || quality.includes('min')) {
      addVoicing([null, r, r + 2, r + 2, r + 1, r], 'Root-5 Barre (Minor)');
    } else if (quality.includes('sus4')) {
      addVoicing([null, r, r + 2, r + 2, r + 3, r], 'Root-5 Sus4');
    } else if (quality.includes('add9')) {
      addVoicing([null, r, r + 2, r + 4, r + 2, null], 'Root-5 Add9');
    } else {
      addVoicing([null, r, r + 2, r + 2, r + 2, null], 'Root-5 Barre (Major)');
    }
  }

  // 4. Movable Root-4 (D-shape / Upper Triads)
  const root4Fret = getFretForNoteOnString(2, tonic);
  if (root4Fret !== null && root4Fret <= 12) {
    const r = root4Fret;
    if (quality.includes('m') || quality.includes('min')) {
      addVoicing([null, null, r, r + 2, r + 3, r + 1], 'Upper Triad (D-shape minor)');
    } else if (quality.includes('7')) {
      addVoicing([null, null, r, r + 2, r + 1, r + 2], 'Upper 7th (D-shape)');
    } else {
      addVoicing([null, null, r, r + 2, r + 3, r + 2], 'Upper Triad (D-shape major)');
    }
  }

  return options.slice(0, 4);
}
