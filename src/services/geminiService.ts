import { GoogleGenAI } from '@google/genai';
import type { AiAnalysisResult, ChordItem } from '../types';
import { beautifyChordSymbol } from '../utils/guitarTheory';
import { Note } from '@tonaljs/tonal';

// Prioritized list of active Gemini models (2026)
export const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash-001',
];

let cachedWorkingModel: string | null = null;

export type ExplorationStyle = 'auto' | 'modal' | 'jazz' | 'rock' | 'diatonic';

/**
 * Discovers available models for the given API key via ModelService.ListModels
 */
export async function discoverAvailableModels(ai: GoogleGenAI): Promise<string[]> {
  try {
    const pager = await ai.models.list();
    const available: string[] = [];

    for await (const model of pager) {
      const methods = (model as any).supportedGenerationMethods || [];
      if (methods.includes('generateContent') || methods.length === 0) {
        const cleanName = model.name ? model.name.replace(/^models\//, '') : '';
        if (cleanName) {
          available.push(cleanName);
        }
      }
    }

    if (available.length > 0) {
      available.sort((a, b) => {
        const aFlash = a.includes('flash') ? 1 : 0;
        const bFlash = b.includes('flash') ? 1 : 0;
        if (aFlash !== bFlash) return bFlash - aFlash;
        const a25 = a.includes('2.5') ? 2 : a.includes('2.0') ? 1 : 0;
        const b25 = b.includes('2.5') ? 2 : b.includes('2.0') ? 1 : 0;
        return b25 - a25;
      });
      return available;
    }
  } catch (err) {
    console.warn('ai.models.list() call skipped or not permitted:', err);
  }
  return [...CANDIDATE_MODELS];
}

/**
 * Tests connection with Google AI Studio using the user's API key
 */
export async function testGeminiConnection(
  apiKey: string
): Promise<{ success: boolean; model: string; message: string }> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Please enter an API key.');
  }

  const cleanKey = apiKey.trim();
  const ai = new GoogleGenAI({ apiKey: cleanKey });

  const discovered = await discoverAvailableModels(ai);
  const modelsToTry = [
    ...(cachedWorkingModel ? [cachedWorkingModel] : []),
    ...discovered,
    ...CANDIDATE_MODELS,
  ];
  const uniqueModels = [...new Set(modelsToTry)];

  let lastError: any = null;

  for (const modelName of uniqueModels) {
    try {
      const resp = await ai.models.generateContent({
        model: modelName,
        contents: 'Ping: Respond with "OK"',
      });

      if (resp.text) {
        cachedWorkingModel = modelName;
        return {
          success: true,
          model: modelName,
          message: `Connected successfully using model: ${modelName}`,
        };
      }
    } catch (err: any) {
      lastError = err;
      if (
        err?.status === 404 ||
        err?.message?.includes('not found') ||
        err?.message?.includes('is not supported')
      ) {
        continue;
      }
      if (
        err?.status === 401 ||
        err?.status === 403 ||
        err?.message?.includes('API key not valid')
      ) {
        throw new Error(
          'API key is invalid or unauthorized. Please verify the key from Google AI Studio.'
        );
      }
    }
  }

  throw new Error(
    lastError?.message || 'Could not connect to Gemini models. Please check your API key.'
  );
}

/**
 * Analyzes chord progression using Gemini with rich modal/voice-leading instructions
 */
export async function analyzeProgressionWithGemini(
  progression: ChordItem[],
  apiKey: string,
  style: ExplorationStyle = 'modal'
): Promise<AiAnalysisResult> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Please enter your Gemini API Key in Settings to run AI analysis.');
  }

  if (!progression || progression.length === 0) {
    throw new Error('Add at least one chord to the progression to analyze.');
  }

  const cleanKey = apiKey.trim();
  const ai = new GoogleGenAI({ apiKey: cleanKey });

  // Format progression payload including both chord names and exact voiced notes
  const formattedProgression = progression
    .map((chord, idx) => {
      const voicingStr = chord.fretPositions
        .map((f) => (f === null ? 'X' : f.toString()))
        .join('-');
      const notesStr = chord.notes.join('-');
      return `Chord ${idx + 1}: ${chord.name} [Voicing: ${voicingStr}, Notes: ${notesStr}]`;
    })
    .join('\n');

  // Specific style prompt instructions
  let styleGuidance = '';
  if (style === 'auto') {
    styleGuidance = `
CREATIVE FOCUS - AUTO-DETECT HARMONIC INTENT (INTELLIGENT CHOICE):
- Carefully analyze the voice leading, intervals, and harmonic context across all chords.
- If chromatic voice leading, inner-voice clichés (e.g. E -> D# -> D -> C#), or non-diatonic modal shifts are present, identify as "Modal & Chromatic Voice Leading" and recommend modal interchange chords (like Dorian IV, borrowed bVI, bVII).
- If extended chords (maj7, 9, 11, 13, m7b5) or secondary dominants exist, identify as "Neo-Soul & Jazz Harmony" and recommend rich jazz voicings.
- If power chords or rock Borrowed chords (bVII, bVI, bIII), identify as "Modern Rock Harmony".
- Otherwise, identify as "Diatonic & Pop Harmony".
- Set the "detectedStyle" field to this identified category.
- In "overviewExplanation", write a clear 2-3 sentence overview explaining what the chords are doing harmonically, and recommend the best next steps. Mention specific chords by name (e.g., "try A Major to capture the Dorian IV lift" or "resolve to C Major").`;
  } else if (style === 'modal') {
    styleGuidance = `
CREATIVE FOCUS - MODAL INTERCHANGE & CHROMATIC VOICE LEADING (RECOMMENDED):
- Prioritize bold, tasteful modal ideas that break outside rigid diatonic boundaries!
- CRITICAL: Trace horizontal voice leading across chord voices. Check if an inner or outer voice forms a chromatic line cliché (e.g. E -> Eb/D# -> D natural -> C#)! If so, actively recommend chords that continue this voice leading line (such as Major IV / A Major in an E minor context, A7, A/C#, or C#dim).
- Explore borrowed chords: Major IV in minor (Dorian IV), subtonic bVII (Mixolydian), Neapolitan bII (Phrygian), chromatic mediants, and parallel mode shifts.
- In "overviewExplanation", provide a 2-3 sentence overview of this modal voice leading, mentioning specific chord names.`;
  } else if (style === 'jazz') {
    styleGuidance = `
CREATIVE FOCUS - NEO-SOUL & JAZZ HARMONY:
- Prioritize upper extensions (9ths, 11ths, 13ths, maj7#11), tritone substitutions, secondary dominants, and chromatic approach chords.
- Provide smooth voice leading with close fretboard positioning.
- In "overviewExplanation", explain the upper extension movement, mentioning chords by name.`;
  } else if (style === 'rock') {
    styleGuidance = `
CREATIVE FOCUS - ROCK & MODAL ALTERNATIVE:
- Prioritize powerful modal rock shifts: subtonic bVII, bVI to bVII to I cadences, parallel minor/major interchanges, and heavy suspended chords.
- In "overviewExplanation", explain the rock modal shifts, mentioning chords by name.`;
  } else {
    styleGuidance = `
CREATIVE FOCUS - DIATONIC & CLASSICAL HARMONY:
- Prioritize functional circle-of-fifths resolutions, clear tonicization, and authentic cadences.
- In "overviewExplanation", explain the diatonic harmonic resolutions, mentioning chords by name.`;
  }

  const promptContent = `You are analyzing this guitar chord progression:
${formattedProgression}

${styleGuidance}

VOICING & GUITAR REQUIREMENTS:
1. Candidate Keys: List candidate keys or modal centers (e.g., "E Dorian / E Minor", "A Major").
2. Deciding Chords: List chords that clarify tonal/modal direction.
3. Next Chord Recommendations: Provide 4-6 ranked chords with fitScore (1-100).
   - Each recommendation MUST have realistic, ergonomic guitar fretPositions (6 strings from low E to high E, e.g. ["X", "0", "2", "2", "2", "0"] or ["5", "7", "7", "6", "5", "5"]) and corresponding scientific pitch notes.
   - Voicings must maintain close voice leading and finger economy relative to the final chord of the progression.
   - In "theoreticalFunction", clearly explain the modal or harmonic mechanism (e.g., "Dorian IV (Modal Interchange) continuing the descending chromatic voice line E -> D# -> D -> C#").

Return your response strictly as a JSON object matching this schema:
{
  "potentialKeys": ["Key1", "Key2"],
  "decidingChords": [
    { "chordName": "...", "resolvesToKey": "...", "explanation": "..." }
  ],
  "nextChordSuggestions": [
    {
      "chordName": "...",
      "fitScore": 95,
      "theoreticalFunction": "...",
      "voicingOptions": [
        { "fretPositions": ["X", "0", "2", "2", "2", "0"], "notes": ["A2", "E3", "A3", "Db4", "E4"] }
      ]
    }
  ]
}`;

  const systemInstruction =
    "You are a master music theorist, composer, and virtuoso guitarist. You specialize in modern harmony, modal interchange, chromatic line clichés, and ergonomic fretboard voice leading. Never limit yourself to basic diatonic chords unless requested. Return strictly valid JSON.";

  const schemaConfig = {
    type: 'OBJECT',
    properties: {
      potentialKeys: {
        type: 'ARRAY',
        items: { type: 'STRING' },
        description: 'Candidate musical keys matching the progression.',
      },
      decidingChords: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            chordName: { type: 'STRING' },
            resolvesToKey: { type: 'STRING' },
            explanation: { type: 'STRING' },
          },
          required: ['chordName', 'resolvesToKey', 'explanation'],
        },
        description: 'Chords that would resolve tonal ambiguity between competing keys.',
      },
      nextChordSuggestions: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            chordName: { type: 'STRING' },
            fitScore: { type: 'NUMBER', description: 'Fit score from 1 to 100' },
            theoreticalFunction: { type: 'STRING' },
            voicingOptions: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  fretPositions: {
                    type: 'ARRAY',
                    items: { type: 'STRING' },
                    description:
                      '6-element array string from low E to high E (e.g., ["X", "3", "2", "0", "1", "0"])',
                  },
                  notes: {
                    type: 'ARRAY',
                    items: { type: 'STRING' },
                  },
                },
                required: ['fretPositions', 'notes'],
              },
            },
          },
          required: ['chordName', 'fitScore', 'theoreticalFunction', 'voicingOptions'],
        },
      },
      overviewExplanation: {
        type: 'STRING',
        description:
          'A clear 2-3 sentence overview explaining the harmonic context, voice leading, and recommendations. Explicitly mention specific chord names like A Major, Em/B, G/B, etc.',
      },
      detectedStyle: {
        type: 'STRING',
        description: 'The detected or active exploration style (e.g. Modal & Chromatic Voice Leading, Neo-Soul & Jazz, Modern Rock, Diatonic).',
      },
    },
    required: ['potentialKeys', 'decidingChords', 'nextChordSuggestions'],
  };

  const modelsToTry = [
    ...(cachedWorkingModel ? [cachedWorkingModel] : []),
    ...CANDIDATE_MODELS,
  ];
  const uniqueModels = [...new Set(modelsToTry)];

  let lastError: any = null;

  for (const model of uniqueModels) {
    try {
      let responseText = '';
      let workingModelUsed = model;

      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: promptContent,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: schemaConfig,
          },
        });
        responseText = response.text || '';
      } catch (schemaErr: any) {
        if (
          schemaErr?.status === 404 ||
          schemaErr?.message?.includes('not found') ||
          schemaErr?.message?.includes('is not supported')
        ) {
          throw schemaErr;
        }

        const fallbackResponse = await ai.models.generateContent({
          model: model,
          contents: promptContent,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: 'application/json',
          },
        });
        responseText = fallbackResponse.text || '';
      }

      if (!responseText) {
        continue;
      }

      let cleanedJson = responseText.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanedJson) as AiAnalysisResult;
      cachedWorkingModel = workingModelUsed;

      parsed.analyzedAt = new Date().toLocaleTimeString();
      parsed.source = 'gemini';
      parsed.modelUsed = workingModelUsed;
      parsed.explorationStyle = style;

      if (parsed.nextChordSuggestions) {
        parsed.nextChordSuggestions.forEach((s) => {
          s.chordName = beautifyChordSymbol(s.chordName);
        });
        parsed.nextChordSuggestions.sort((a, b) => b.fitScore - a.fitScore);
      }

      return parsed;
    } catch (err: any) {
      lastError = err;
      if (
        err?.status === 404 ||
        err?.message?.includes('not found') ||
        err?.message?.includes('is not supported')
      ) {
        continue;
      }
      if (
        err?.status === 401 ||
        err?.status === 403 ||
        err?.message?.includes('API key not valid')
      ) {
        throw new Error(
          'API key is invalid. Please check your key from Google AI Studio (starts with AQ. or AIza).'
        );
      }
    }
  }

  let userFriendlyMsg = 'Could not reach Gemini models with your API key. Showing intelligent music theory analysis.';
  if (lastError?.message) {
    if (lastError.message.includes('API key not valid') || lastError.message.includes('401') || lastError.message.includes('403')) {
      userFriendlyMsg = 'Invalid Gemini API key. Please check your key from Google AI Studio (starts with AQ. or AIza).';
    } else if (lastError.message.includes('404') || lastError.message.includes('not found')) {
      userFriendlyMsg = 'Gemini models were not accessible with this key. Showing intelligent music theory analysis.';
    } else if (lastError.message.includes('429') || lastError.message.includes('RESOURCE_EXHAUSTED')) {
      userFriendlyMsg = 'Gemini rate limit reached. Showing intelligent music theory analysis.';
    }
  }

  throw new Error(userFriendlyMsg);
}

/**
 * Detects if a progression contains a chromatic line cliché (e.g. E -> D# -> D -> C#)
 */
function detectChromaticLineCliche(progression: ChordItem[]) {
  if (progression.length < 2) return null;

  // Check middle and top voiced pitches across chords
  const midNotes = progression.map((c) => {
    const midIdx = Math.floor(c.notes.length / 2);
    return c.notes[midIdx] ? Note.midi(c.notes[midIdx]) : null;
  });

  const valid = midNotes.filter((m): m is number => m !== null);
  if (valid.length >= 3) {
    const diff1 = valid[1] - valid[0];
    const diff2 = valid[2] - valid[1];
    // Descending chromatic line (e.g. 52 -> 51 -> 50)
    if (diff1 === -1 && diff2 === -1) {
      const nextMidi = valid[2] - 1;
      const targetNote = Note.fromMidi(nextMidi);
      return {
        direction: 'descending',
        lastMidi: valid[2],
        nextTargetMidi: nextMidi,
        nextTargetNote: targetNote, // e.g. "C#3"
        rootKey: progression[0].name.replace(/\/.*$/, ''),
      };
    }
  }

  // Also check based on chord names: Em -> Baug (or Em(maj7)) -> G/B (or Bm#5 / Em7)
  const names = progression.map((c) => c.name.toUpperCase());
  const hasEm = names.some((n) => n.startsWith('EM') || n.includes('EM/'));
  const hasAug = names.some((n) => n.includes('AUG') || n.includes('MAJ7'));
  const hasSeventhOrG = names.some(
    (n) => n.includes('M#5') || n.includes('G/B') || n.includes('EM7')
  );

  if (hasEm && (hasAug || hasSeventhOrG)) {
    return {
      direction: 'descending',
      lastMidi: 50,
      nextTargetMidi: 49,
      nextTargetNote: 'C#3',
      rootKey: 'Em',
    };
  }

  return null;
}

/**
 * Intelligent client-side harmonic analysis generator with full modal interchange and line cliché recognition
 */
export function generateDemoAnalysis(
  progression: ChordItem[],
  style: ExplorationStyle = 'modal'
): AiAnalysisResult {
  if (!progression || progression.length === 0) {
    return {
      potentialKeys: ['C Major (Ionian)', 'A Minor (Aeolian)'],
      decidingChords: [
        {
          chordName: 'G7',
          resolvesToKey: 'C Major',
          explanation: 'Dominant 7th tritone resolves cleanly into C Major tonic.',
        },
      ],
      nextChordSuggestions: [
        {
          chordName: 'C Major',
          fitScore: 95,
          theoreticalFunction: 'Tonic I home resolution',
          voicingOptions: [
            {
              fretPositions: ['X', '3', '2', '0', '1', '0'],
              notes: ['C3', 'E3', 'G3', 'C4', 'E4'],
            },
          ],
        },
      ],
      source: 'demo',
      analyzedAt: new Date().toLocaleTimeString(),
      modelUsed: 'Harmonic Engine (Modal & Chromatic)',
      explorationStyle: style,
    };
  }

  // Check for Chromatic Line Cliché (e.g. Em/B -> Baug -> Bm#5/G -> A)
  const lineCliche = detectChromaticLineCliche(progression);
  if (lineCliche && lineCliche.rootKey.includes('E')) {
    return {
      overviewExplanation:
        'This progression establishes an iconic descending chromatic inner voice (E → D# → D). Recommending A Major (Dorian IV) or A7 to resolve this voice cleanly into C#, or B7 for a dominant turnaround.',
      detectedStyle: 'Modal & Chromatic Voice Leading',
      potentialKeys: [
        'E Dorian (Modal Interchange)',
        'E Minor (Line Cliché Descent)',
        'A Major (Secondary Tonal Shift)',
      ],
      decidingChords: [
        {
          chordName: 'A Major (IV)',
          resolvesToKey: 'E Dorian',
          explanation:
            'Introduces C# to complete the descending chromatic line cliché (E -> D# -> D -> C#), giving that signature Pink Floyd / James Bond modal lift.',
        },
        {
          chordName: 'B7 (V7)',
          resolvesToKey: 'E Minor',
          explanation:
            'Dominant turnaround providing authentic cadential closure back to the tonic Em.',
        },
      ],
      nextChordSuggestions: [
        {
          chordName: 'A Major',
          fitScore: 98,
          theoreticalFunction:
            'Dorian IV (Modal Interchange) — Completes the iconic descending chromatic line (E -> D# -> D -> C#) with rich Pink Floyd / classic rock voice leading!',
          voicingOptions: [
            {
              fretPositions: ['5', '7', '7', '6', '5', '5'],
              notes: ['A2', 'E3', 'A3', 'C#4', 'E4', 'A4'],
            },
            {
              fretPositions: ['X', '0', '2', '2', '2', '0'],
              notes: ['A2', 'E3', 'A3', 'C#4', 'E4'],
            },
            {
              fretPositions: ['X', '4', '2', '2', '2', 'X'],
              notes: ['C#3', 'E3', 'A3', 'C#4'],
            },
          ],
        },
        {
          chordName: 'A7',
          fitScore: 95,
          theoreticalFunction:
            'Dorian IV7 — Adds the bluesy G natural over the C# guide tone for soulful turnaround tension.',
          voicingOptions: [
            {
              fretPositions: ['X', '0', '2', '0', '2', '0'],
              notes: ['A2', 'E3', 'G3', 'C#4', 'E4'],
            },
            {
              fretPositions: ['5', '7', '5', '6', '5', '5'],
              notes: ['A2', 'E3', 'G3', 'C#4', 'E4', 'A4'],
            },
          ],
        },
        {
          chordName: 'C Major',
          fitScore: 92,
          theoreticalFunction:
            'Submediant bVI (Aeolian) — Continues the chromatic motion down to C natural before resolving to tonic or dominant B7.',
          voicingOptions: [
            {
              fretPositions: ['X', '3', '2', '0', '1', '0'],
              notes: ['C3', 'E3', 'G3', 'C4', 'E4'],
            },
          ],
        },
        {
          chordName: 'C#dim',
          fitScore: 89,
          theoreticalFunction:
            'Leading-Tone Diminished (vii°/V) — Accentuates the target C# voice leading note with dark cinematic mystery.',
          voicingOptions: [
            {
              fretPositions: ['X', '4', '5', '3', '5', 'X'],
              notes: ['C#3', 'G3', 'Bb3', 'E4'],
            },
          ],
        },
        {
          chordName: 'B7',
          fitScore: 87,
          theoreticalFunction:
            'Dominant V7 — Authentic cadential resolution completing the line and pulling back home to Em.',
          voicingOptions: [
            {
              fretPositions: ['X', '2', '1', '2', '0', '2'],
              notes: ['B2', 'D#3', 'A3', 'B3', 'F#4'],
            },
          ],
        },
      ],
      source: 'demo',
      analyzedAt: new Date().toLocaleTimeString(),
      modelUsed: 'Modal Voice-Leading Engine',
      explorationStyle: style,
    };
  }

  // General chord progression analysis
  const chordNames = progression.map((c) => c.name);
  const firstChord = chordNames[0] || 'C';
  const rootMatch = firstChord.match(/^([A-G][#b]?)/);
  const root = rootMatch ? rootMatch[1] : 'C';
  const isMinor = firstChord.includes('m') && !firstChord.includes('maj');

  let potentialKeys: string[] = [];
  let decidingChords: { chordName: string; resolvesToKey: string; explanation: string }[] = [];
  let nextChordSuggestions: any[] = [];

  if (isMinor) {
    potentialKeys = [
      `${root} Dorian (Modal Interchange)`,
      `${root} Minor (Natural Aeolian)`,
      `Relative Major`,
    ];
    decidingChords = [
      {
        chordName: 'A Major / IV',
        resolvesToKey: `${root} Dorian`,
        explanation: 'Major IV chord injects the raised 6th (Dorian mode), providing bright modal lift.',
      },
      {
        chordName: 'B7 (V7)',
        resolvesToKey: `${root} Minor`,
        explanation: 'Dominant 7th pulls strongly to resolve minor tension.',
      },
    ];
    nextChordSuggestions = [
      {
        chordName: 'A Major',
        fitScore: 97,
        theoreticalFunction:
          'Dorian IV (Modal Interchange) — Breaks out of diatonic minor with the bright raised 6th (Pink Floyd / Santana vibe).',
        voicingOptions: [
          {
            fretPositions: ['X', '0', '2', '2', '2', '0'],
            notes: ['A2', 'E3', 'A3', 'C#4', 'E4'],
          },
          {
            fretPositions: ['5', '7', '7', '6', '5', '5'],
            notes: ['A2', 'E3', 'A3', 'C#4', 'E4', 'A4'],
          },
        ],
      },
      {
        chordName: 'C Major',
        fitScore: 93,
        theoreticalFunction: 'Relative Major (bIII) — Provides emotional lift and vocal resonance.',
        voicingOptions: [
          {
            fretPositions: ['X', '3', '2', '0', '1', '0'],
            notes: ['C3', 'E3', 'G3', 'C4', 'E4'],
          },
        ],
      },
      {
        chordName: 'D Major',
        fitScore: 90,
        theoreticalFunction: 'Subtonic bVII (Mixolydian borrowing) — Classic rock and modal turnaround.',
        voicingOptions: [
          {
            fretPositions: ['X', 'X', '0', '2', '3', '2'],
            notes: ['D3', 'A3', 'D4', 'F#4'],
          },
        ],
      },
      {
        chordName: 'F#7',
        fitScore: 86,
        theoreticalFunction: 'Secondary Dominant (V7/V) — Injects tension leading into dominant B7.',
        voicingOptions: [
          {
            fretPositions: ['2', '4', '2', '3', '2', '2'],
            notes: ['F#2', 'C#3', 'E3', 'A#3', 'C#4', 'F#4'],
          },
        ],
      },
    ];
  } else {
    potentialKeys = [
      `${root} Major (Ionian)`,
      `${root} Mixolydian (Blues/Rock Modal)`,
      `${root} Lydian (Cinematic)`,
    ];
    decidingChords = [
      {
        chordName: 'Bb Major (bVII)',
        resolvesToKey: `${root} Mixolydian`,
        explanation: 'Subtonic flat-7 chord confirms modal rock tonality.',
      },
      {
        chordName: 'F Minor (iv)',
        resolvesToKey: `${root} Major (Minor Plagal)`,
        explanation: 'Minor iv borrowing provides the iconic Beatles/Radiohead melancholy cadence.',
      },
    ];
    nextChordSuggestions = [
      {
        chordName: 'F Major',
        fitScore: 96,
        theoreticalFunction: 'Subdominant (IV) — Classic open resonance with natural voice leading.',
        voicingOptions: [
          {
            fretPositions: ['1', '3', '3', '2', '1', '1'],
            notes: ['F2', 'C3', 'F3', 'A3', 'C4', 'F4'],
          },
        ],
      },
      {
        chordName: 'F Minor',
        fitScore: 93,
        theoreticalFunction:
          'Minor Plagal Cadence (iv) — Modal interchange from parallel minor (The Beatles / Radiohead effect).',
        voicingOptions: [
          {
            fretPositions: ['1', '3', '3', '1', '1', '1'],
            notes: ['F2', 'C3', 'F3', 'Ab3', 'C4', 'F4'],
          },
        ],
      },
      {
        chordName: 'Bb Major',
        fitScore: 90,
        theoreticalFunction:
          'Mixolydian bVII — Modal borrowing delivering energetic rock and blues power.',
        voicingOptions: [
          {
            fretPositions: ['X', '1', '3', '3', '3', '1'],
            notes: ['Bb2', 'F3', 'Bb3', 'D4', 'F4'],
          },
        ],
      },
      {
        chordName: 'A Minor',
        fitScore: 88,
        theoreticalFunction: 'Relative Minor (vi) — Emotional deceptive turnaround.',
        voicingOptions: [
          {
            fretPositions: ['X', '0', '2', '2', '1', '0'],
            notes: ['A2', 'E3', 'A3', 'C4', 'E4'],
          },
        ],
      },
    ];
  }

  const detectedGenre =
    style === 'auto'
      ? (isMinor ? 'Natural Minor & Modal Harmony' : 'Diatonic & Modal Borrowing')
      : (style === 'modal' ? 'Modal Interchange & Chromatic' : style === 'jazz' ? 'Neo-Soul & Jazz Harmony' : style === 'rock' ? 'Modern Rock Harmony' : 'Diatonic Harmony');

  const overview =
    isMinor
      ? `A minor-keyed progression centered around ${root} Minor. Try ${nextChordSuggestions[0]?.chordName} for immediate resolution or ${nextChordSuggestions[1]?.chordName} for modal tension.`
      : `Harmonic progression centered around ${root} Major. Try ${nextChordSuggestions[0]?.chordName} for natural voice leading or ${nextChordSuggestions[1]?.chordName} for subtle modal borrowing.`;

  return {
    potentialKeys,
    decidingChords,
    nextChordSuggestions,
    overviewExplanation: overview,
    detectedStyle: detectedGenre,
    source: 'demo',
    analyzedAt: new Date().toLocaleTimeString(),
    modelUsed: 'Harmonic Theory Engine',
    explorationStyle: style,
  };
}
