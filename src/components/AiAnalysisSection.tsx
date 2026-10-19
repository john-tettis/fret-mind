import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { audioEngine } from '../services/audioEngine';
import { MiniFretboard } from './MiniFretboard';
import { parseFretPositions } from '../utils/guitarTheory';
import type { NextChordSuggestion } from '../types';
import {
  Sparkles,
  RefreshCw,
  Plus,
  Play,
  Volume2,
} from 'lucide-react';

export const AiAnalysisSection: React.FC = () => {
  const {
    progression,
    apiKey,
    aiAnalysis,
    isAnalyzing,
    harmonicStyle,
    setHarmonicStyle,
    runAiAnalysis,
    addChordToProgression,
    applyVoicingToFretboard,
  } = useStore();

  const [highlightedChord, setHighlightedChord] = useState<string | null>(null);

  const handleOverviewChordClick = (chordName: string) => {
    setHighlightedChord(chordName);
    const foundSuggestion = aiAnalysis?.nextChordSuggestions.find(
      (s) =>
        s.chordName.toLowerCase().includes(chordName.toLowerCase()) ||
        chordName.toLowerCase().includes(s.chordName.toLowerCase())
    );

    if (foundSuggestion && foundSuggestion.voicingOptions[0]) {
      audioEngine.playStrum(foundSuggestion.voicingOptions[0].notes);
    }
  };

  const renderOverviewWithInteractiveChords = (text: string) => {
    if (!text) return null;

    const chordRegex =
      /\b([A-G][#b]?(?:maj7|maj9|maj|m7b5|m7|m9|min|m|dim|aug|7|9|11|13)?(?:\/[A-G][#b]?)?(?:\s+(?:Major|Minor|Dominant|Augmented|Diminished))?)\b/g;

    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = chordRegex.exec(text)) !== null) {
      const matchStart = match.index;
      const matchedText = match[0];

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
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded font-mono text-[11px] font-semibold transition-colors ${
            isMatchHighlighted
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-[#222227] text-amber-300 hover:bg-[#2b2b32]'
          }`}
          title={`Click to listen to ${matchedText}`}
        >
          <Volume2 className="w-2.5 h-2.5 opacity-60" />
          <span>{matchedText}</span>
        </button>
      );

      lastIndex = chordRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className="bg-[#18181b] border border-[#27272c] rounded-xl p-4 flex flex-col shadow-lg">
      {/* 1. CLEAN HEADER */}
      <div className="pb-3 border-b border-[#242429] flex flex-wrap items-center justify-between gap-3">
        {/* Title */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-[#f2f2f4] m-0">
            Recommendations
          </h2>
          <span className="text-[11px] text-[#71717a] font-mono">
            {aiAnalysis?.modelUsed || (apiKey ? 'Gemini AI' : 'Theory Engine')}
          </span>
        </div>

        {/* Controls: Harmonic Style Dropdown & Re-Analyze */}
        <div className="flex items-center gap-2">
          <select
            value={harmonicStyle}
            onChange={(e) => {
              setHarmonicStyle(e.target.value as any);
              if (progression.length > 0) {
                runAiAnalysis();
              }
            }}
            className="bg-[#202025] border border-[#2b2b32] rounded-lg px-2 py-1 text-xs text-[#cfcfd6] focus:outline-none cursor-pointer"
          >
            <option value="auto">Auto Style</option>
            <option value="modal">Modal / Borrowing</option>
            <option value="jazz">Neo-Soul / Jazz</option>
            <option value="rock">Rock / Blues</option>
            <option value="diatonic">Diatonic Only</option>
          </select>

          <button
            onClick={() => runAiAnalysis()}
            disabled={isAnalyzing || progression.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#202025] hover:bg-[#28282e] text-[#cfcfd6] border border-[#2b2b32] text-xs transition-colors disabled:opacity-30"
            title="Refresh recommendations"
          >
            <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. CONTENT AREA */}
      <div className="pt-3">
        {progression.length === 0 ? (
          /* Clean empty standby state */
          <div className="w-full text-center py-6 px-4 rounded-xl border border-dashed border-[#2b2b32] bg-[#141417]/50">
            <p className="text-xs text-[#8e8e96] m-0">
              Add chords to your timeline to get intelligent harmonic recommendations and next chord suggestions.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Harmonic Narrative Overview */}
            {aiAnalysis?.overviewExplanation && (
              <div className="p-3 rounded-lg bg-[#141417] border border-[#242428] text-xs text-[#c8c8cf] leading-relaxed">
                {renderOverviewWithInteractiveChords(aiAnalysis.overviewExplanation)}
              </div>
            )}

            {/* Next Chord Suggestion Cards */}
            {aiAnalysis && aiAnalysis.nextChordSuggestions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {aiAnalysis.nextChordSuggestions.map((suggestion: NextChordSuggestion, idx: number) => {
                  const voicing = suggestion.voicingOptions[0];
                  const isHighlighted =
                    highlightedChord &&
                    (suggestion.chordName.toLowerCase().includes(highlightedChord.toLowerCase()) ||
                      highlightedChord.toLowerCase().includes(suggestion.chordName.toLowerCase()));

                  return (
                    <div
                      key={`sugg-${suggestion.chordName}-${idx}`}
                      className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                        isHighlighted
                          ? 'bg-[#222228] border-amber-500 shadow-md ring-1 ring-amber-500/30'
                          : 'bg-[#1b1b1f] border-[#292930] hover:border-[#383842]'
                      }`}
                    >
                      {/* Top: Chord Title & Fit Score */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-bold text-[#f2f2f4] m-0">
                            {suggestion.chordName}
                          </h3>
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#222227] text-amber-300">
                            {suggestion.fitScore}% fit
                          </span>
                        </div>

                        {/* Explanation */}
                        <p className="text-[11px] text-[#8e8e96] leading-relaxed mb-2 line-clamp-2">
                          {suggestion.theoreticalFunction}
                        </p>
                      </div>

                      {/* Mini Fretboard Preview & Actions */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#242429]">
                        {voicing && (
                          <div
                            onClick={() => applyVoicingToFretboard(voicing.fretPositions)}
                            className="cursor-pointer bg-[#141417] px-2 py-1 rounded border border-[#242428] hover:border-[#35353d]"
                            title="Click to load onto guitar neck"
                          >
                            <MiniFretboard
                              fretPositions={voicing.fretPositions}
                              size="sm"
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-1.5">
                          {voicing && (
                            <button
                              onClick={() => audioEngine.playStrum(voicing.notes)}
                              className="p-1.5 rounded-lg bg-[#222227] hover:bg-[#2b2b32] text-[#d1d1d8] hover:text-[#f2f2f4] transition-colors"
                              title="Listen"
                            >
                              <Play className="w-3 h-3 text-emerald-400" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (voicing) {
                                addChordToProgression(
                                  suggestion.chordName,
                                  parseFretPositions(voicing.fretPositions)
                                );
                              }
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
