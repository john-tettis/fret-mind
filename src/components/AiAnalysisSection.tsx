import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { audioEngine } from '../services/audioEngine';
import { MiniFretboard } from './MiniFretboard';
import type { NextChordSuggestion } from '../types';
import {
  Sparkles,
  RefreshCw,
  Compass,
  Plus,
  Play,
  Key,
  AlertCircle,
  Sliders,
  ArrowDown,
  X,
  Volume2,
} from 'lucide-react';

export const AiAnalysisSection: React.FC = () => {
  const {
    progression,
    apiKey,
    aiAnalysis,
    harmonicStyle,
    setHarmonicStyle,
    isAnalyzing,
    analysisError,
    clearAnalysisError,
    runAiAnalysis,
    applyVoicingToFretboard,
    addSuggestionToProgression,
    setKeyModalOpen,
    highlightedChord,
    setHighlightedChord,
  } = useStore();

  const [selectedVoicings, setSelectedVoicings] = useState<Record<number, number>>({});

  const handleVoicingSelect = (suggestionIdx: number, voicingIdx: number) => {
    setSelectedVoicings((prev) => ({ ...prev, [suggestionIdx]: voicingIdx }));
  };

  const handleListenSuggestion = (notes: string[]) => {
    if (notes && notes.length > 0) {
      audioEngine.playStrum(notes);
    }
  };

  const handleOverviewChordClick = (chordName: string) => {
    setHighlightedChord(chordName);

    // Find if this chord exists in recommendations
    if (aiAnalysis?.nextChordSuggestions) {
      const idx = aiAnalysis.nextChordSuggestions.findIndex(
        (s) =>
          s.chordName.toLowerCase().includes(chordName.toLowerCase()) ||
          chordName.toLowerCase().includes(s.chordName.toLowerCase())
      );

      if (idx !== -1) {
        const suggestion = aiAnalysis.nextChordSuggestions[idx];
        const notes = suggestion.voicingOptions[0]?.notes || [];
        if (notes.length > 0) {
          audioEngine.playStrum(notes);
        }

        const el = document.getElementById(`suggestion-card-${idx}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return;
      }
    }

    // Fallback: check in progression
    const progChord = progression.find(
      (c) =>
        c.name.toLowerCase().includes(chordName.toLowerCase()) ||
        chordName.toLowerCase().includes(c.name.toLowerCase())
    );
    if (progChord && progChord.notes.length > 0) {
      audioEngine.playStrum(progChord.notes);
    }
  };

  const renderInteractiveExplanation = (
    text: string,
    _suggestions?: NextChordSuggestion[]
  ) => {
    if (!text) return null;

    // Regex matching chords like "A Major", "A7", "C#dim", "Em/B", "G/B", "B7", etc.
    const chordRegex =
      /\b([A-G][#b]?(?:maj7|maj9|maj|m7b5|m7|m9|min|m|dim|aug|7|9|11|13)?(?:\/[A-G][#b]?)?(?:\s+(?:Major|Minor|Dominant|Augmented|Diminished))?)\b/g;

    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = chordRegex.exec(text)) !== null) {
      const matchStart = match.index;
      const matchEnd = chordRegex.lastIndex;
      const matchedText = match[0];

      // Add preceding plain text
      if (matchStart > lastIndex) {
        parts.push(text.substring(lastIndex, matchStart));
      }

      const isMatchHighlighted =
        highlightedChord &&
        (matchedText.toLowerCase().includes(highlightedChord.toLowerCase()) ||
          highlightedChord.toLowerCase().includes(matchedText.toLowerCase()));

      parts.push(
        <button
          key={`chord-pill-${matchStart}`}
          onClick={() => handleOverviewChordClick(matchedText)}
          onMouseEnter={() => setHighlightedChord(matchedText)}
          onMouseLeave={() => setHighlightedChord(null)}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded font-mono font-bold text-[11px] transition-all cursor-pointer ${
            isMatchHighlighted
              ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-md shadow-amber-500/40'
              : 'bg-[#2b2118] text-amber-300 border border-amber-600/40 hover:bg-[#3d3023] hover:text-white'
          }`}
          title={`Click to listen and highlight ${matchedText} in cards below`}
        >
          <Volume2 className="w-2.5 h-2.5 opacity-70" />
          <span>{matchedText}</span>
        </button>
      );

      lastIndex = matchEnd;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className="bg-[#14110e] border border-[#2e261f] rounded-2xl p-4 sm:p-5 flex flex-col shadow-2xl">
      {/* Top Header: Title, Model Badge & Action Buttons */}
      <div className="pb-3.5 border-b border-[#28211a] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#261f18] text-amber-400 border border-[#3d3126]">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#f5ede0] uppercase tracking-wider m-0 flex items-center gap-2 font-mono">
                Harmonic Recommendations
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#241d17] text-[#d4af37] border border-[#3b3023]">
                  {aiAnalysis?.modelUsed || (apiKey ? 'Gemini AI' : 'Local Theory Engine')}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!apiKey && (
              <button
                onClick={() => setKeyModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#241d17] hover:bg-[#30261e] text-amber-300 border border-amber-600/30 text-xs font-semibold transition-all"
              >
                <Key className="w-3 h-3" />
                <span>API Key</span>
              </button>
            )}

            <button
              onClick={() => runAiAnalysis()}
              disabled={isAnalyzing || progression.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#f59e0b] hover:to-[#d97706] text-[#0f0e0c] text-xs font-black shadow-md shadow-amber-950/40 disabled:opacity-30 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analyzing...' : 'Re-Analyze'}</span>
            </button>
          </div>
        </div>

        {/* Harmonic Style Selector Strip with AUTO mode */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 bg-[#0e0c0a] p-1.5 rounded-xl border border-[#261f18] text-xs">
          <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[#8a7c6e] font-semibold px-1">
            <Sliders className="w-3 h-3 text-amber-500" />
            <span>Style:</span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {[
              {
                id: 'auto',
                label: '✨ Auto (AI Choice)',
                desc: 'Gemini intelligently evaluates chord context to choose between modal, jazz, rock, or diatonic',
              },
              {
                id: 'modal',
                label: '🌌 Modal & Chromatic',
                desc: 'Dorian/Lydian, chromatic line clichés, borrowed chords',
              },
              {
                id: 'jazz',
                label: '🎷 Neo-Soul & Jazz',
                desc: 'Extended 9/11/13, tritone subs, altered 7ths',
              },
              {
                id: 'rock',
                label: '⚡ Rock & Alternative',
                desc: 'Mixolydian bVII, bVI shifts, modal power',
              },
              {
                id: 'diatonic',
                label: '🎼 Classical & Diatonic',
                desc: 'Functional circle of fifths & cadence',
              },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setHarmonicStyle(mode.id as any)}
                className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                  harmonicStyle === mode.id
                    ? 'bg-[#d97706] text-[#0f0e0c] font-bold shadow-sm'
                    : 'bg-[#181410] text-[#a69787] hover:text-[#ede5d8] hover:bg-[#241e18]'
                }`}
                title={mode.desc}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Candidate Keys Mini Bar */}
        {aiAnalysis && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
            <span className="text-[#8a7c6e] font-semibold flex items-center gap-1 font-mono text-[10px] uppercase">
              <Compass className="w-3 h-3 text-emerald-400" />
              Potential Keys:
            </span>
            {aiAnalysis.potentialKeys?.map((k, i) => (
              <span
                key={`k-${i}`}
                className="px-2 py-0.5 rounded-md bg-[#132016] border border-emerald-800/50 text-emerald-300 font-mono font-bold"
              >
                {k}
              </span>
            ))}

            {/* In Auto Mode, show detected style badge */}
            {harmonicStyle === 'auto' && aiAnalysis.detectedStyle && (
              <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#241d17] border border-[#3d3126] text-amber-300 flex items-center gap-1 shadow-sm font-mono">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Detected: <strong className="text-white">{aiAnalysis.detectedStyle}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="pt-3.5">
        {/* Dismissible Error Warning */}
        {analysisError && (
          <div className="bg-[#2b1b14] border border-amber-600/40 rounded-xl p-2.5 text-xs text-amber-200 flex items-center justify-between gap-2 mb-3 shadow-md animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="leading-tight text-[11px] m-0">{analysisError}</p>
            </div>
            <button
              onClick={clearAnalysisError}
              className="p-1 rounded hover:bg-amber-500/20 text-[#8a7c6e] hover:text-white transition-colors"
              title="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {isAnalyzing && (
          <div className="p-10 text-center space-y-3 bg-[#0e0c0a]/80 rounded-2xl border border-[#2e261f]">
            <Sparkles className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-amber-300">
              Evaluating voice leading lines and modal interchange with Gemini...
            </p>
          </div>
        )}

        {/* Empty Standby State */}
        {!isAnalyzing && (!aiAnalysis || progression.length === 0) && (
          <div className="border border-dashed border-[#382d22] rounded-2xl p-7 sm:p-9 text-center bg-[#0e0c0a]/90 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#241d17] border border-[#3d3126] text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Compass className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#f5ede0] font-serif m-0">
                Harmonic Co-Pilot on Standby
              </h3>
              <p className="text-xs text-[#a69787] max-w-md mx-auto leading-relaxed m-0">
                Add 1 or more chords to your progression timeline on the left. Gemini will
                automatically analyze voice-leading transitions, suggest substitutions, and rank next chords.
              </p>
            </div>

            <div className="p-3 bg-[#14100c] rounded-xl border border-[#282119] max-w-md mx-auto text-left space-y-1.5 text-xs text-[#8a7c6e]">
              <span className="font-mono text-[10px] uppercase font-bold text-amber-400 block">
                Active Discovery Modes:
              </span>
              <p className="m-0 text-[11px] text-[#bdafa0]">
                • <strong className="text-white">Auto Mode:</strong> Context-aware classification of rock, neo-soul, or modal progressions.
              </p>
              <p className="m-0 text-[11px] text-[#bdafa0]">
                • <strong className="text-white">Voice Leading:</strong> Minimal finger movement transitions across all 6 strings.
              </p>
            </div>
          </div>
        )}

        {/* AI Harmonic Overview & Narrative Analysis with Interactive Chords */}
        {!isAnalyzing && aiAnalysis?.overviewExplanation && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-b from-[#1c1813] to-[#14110e] border border-[#423528] shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 font-mono uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>AI Harmonic Overview</span>
              </div>
              {aiAnalysis.detectedStyle && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#241d17] text-[#d4af37] border border-[#3d3126]">
                  {aiAnalysis.detectedStyle}
                </span>
              )}
            </div>

            <div className="text-xs text-[#ede5d8] leading-relaxed font-normal">
              {renderInteractiveExplanation(
                aiAnalysis.overviewExplanation,
                aiAnalysis.nextChordSuggestions || []
              )}
            </div>

            <p className="text-[10px] text-[#8a7c6e] mt-2 italic flex items-center gap-1 font-mono">
              <span>💡 Click any highlighted chord pill to strum and jump to its voicing below.</span>
            </p>
          </div>
        )}

        {/* Recommendations Grid */}
        {!isAnalyzing && aiAnalysis && aiAnalysis.nextChordSuggestions && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {aiAnalysis.nextChordSuggestions.map((suggestion, sIdx) => {
              const currentVoicingIdx = selectedVoicings[sIdx] || 0;
              const activeVoicing =
                suggestion.voicingOptions && suggestion.voicingOptions[currentVoicingIdx]
                  ? suggestion.voicingOptions[currentVoicingIdx]
                  : {
                      fretPositions: ['X', '0', '2', '2', '2', '0'],
                      notes: ['A2', 'E3', 'A3', 'C#4', 'E4'],
                    };

              const isHighlighted =
                highlightedChord &&
                (suggestion.chordName.toLowerCase().includes(highlightedChord.toLowerCase()) ||
                  highlightedChord.toLowerCase().includes(suggestion.chordName.toLowerCase()));

              return (
                <div
                  id={`suggestion-card-${sIdx}`}
                  key={`rec-${sIdx}`}
                  className={`rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between ${
                    isHighlighted
                      ? 'border-amber-400 bg-[#211a14] shadow-2xl shadow-amber-950/70 ring-2 ring-amber-400/80 scale-[1.01]'
                      : 'border-[#2e261f] bg-[#181410] hover:border-[#4a3d30] hover:bg-[#1d1914]'
                  }`}
                >
                  {/* Card Header: Chord Title & Fit Score */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl sm:text-2xl font-black text-[#f5ede0] font-serif tracking-tight leading-tight m-0">
                        {suggestion.chordName}
                      </h3>
                      {/* Fit Score Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-black font-mono border flex items-center gap-1 ${
                          suggestion.fitScore >= 90
                            ? 'bg-[#152317] border-emerald-700/50 text-emerald-300 shadow-sm'
                            : 'bg-[#291f16] border-amber-600/40 text-amber-300'
                        }`}
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        {suggestion.fitScore}% Fit
                      </span>
                    </div>

                    {/* Theoretical Explanation */}
                    <p className="text-xs text-[#d6c7b6] bg-[#0e0c0a] p-2.5 rounded-xl border border-[#241e18] leading-snug my-2 font-medium">
                      {suggestion.theoreticalFunction}
                    </p>

                    {/* Voicing Toggle if multiple */}
                    {suggestion.voicingOptions && suggestion.voicingOptions.length > 1 && (
                      <div className="flex items-center gap-1 my-1.5">
                        <span className="text-[10px] text-[#8a7c6e] font-semibold font-mono">Voicing:</span>
                        {suggestion.voicingOptions.map((_, vIdx) => (
                          <button
                            key={`v-${vIdx}`}
                            onClick={() => handleVoicingSelect(sIdx, vIdx)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                              currentVoicingIdx === vIdx
                                ? 'bg-[#d97706] text-[#0f0e0c] font-black'
                                : 'bg-[#1c1713] text-[#8a7c6e] hover:text-white border border-[#2e261f]'
                            }`}
                          >
                            #{vIdx + 1}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Mini Fretboard Chart */}
                    <div className="flex justify-center my-2">
                      <MiniFretboard fretPositions={activeVoicing.fretPositions} size="md" />
                    </div>

                    {/* Notes tag */}
                    <div className="text-[11px] font-mono text-amber-300/90 text-center my-1.5 font-bold bg-[#0e0c0a] py-1 px-2 rounded-lg border border-[#241e18] truncate">
                      {activeVoicing.notes.join(' • ')}
                    </div>
                  </div>

                  {/* Action Buttons: Add, Preview, Listen */}
                  <div className="space-y-1.5 pt-2 border-t border-[#261f18] mt-1">
                    <button
                      onClick={() =>
                        addSuggestionToProgression(
                          suggestion.chordName,
                          activeVoicing.fretPositions
                        )
                      }
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#f59e0b] hover:to-[#d97706] text-[#0f0e0c] font-black text-xs shadow-md shadow-amber-950/40 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Progression</span>
                    </button>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleListenSuggestion(activeVoicing.notes)}
                        className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#1c1713] hover:bg-[#28211a] text-[#ede5d8] border border-[#2e261f] text-xs font-semibold"
                        title="Hear this chord"
                      >
                        <Play className="w-3 h-3 fill-current text-emerald-400" />
                        <span>Listen</span>
                      </button>
                      <button
                        onClick={() => applyVoicingToFretboard(activeVoicing.fretPositions)}
                        className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#241d17] hover:bg-[#30261e] text-amber-300 border border-amber-600/30 text-xs font-semibold"
                        title="Load onto top neck"
                      >
                        <ArrowDown className="w-3 h-3" />
                        <span>To Neck</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
