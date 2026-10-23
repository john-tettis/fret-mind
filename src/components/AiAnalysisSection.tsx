import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { audioEngine } from '../services/audioEngine';
import { MiniFretboard } from './MiniFretboard';
import { parseFretPositions, generateVoicingOptions } from '../utils/guitarTheory';
import { AiChatView } from './AiChatView';
import type { NextChordSuggestion } from '../types';
import {
  Sparkles,
  RefreshCw,
  Plus,
  Play,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Bot,
  ArrowDownToLine,
  MessageSquare,
} from 'lucide-react';

export const AiAnalysisSection: React.FC = () => {
  const {
    progression,
    apiKey,
    aiAnalysis,
    isAnalyzing,
    analysisError,
    harmonicStyle,
    setHarmonicStyle,
    runAiAnalysis,
    addChordToProgression,
    applyVoicingToFretboard,
    detectedChord,
    addCurrentToProgression,
    chatDockPosition,
    setChatDockPosition,
    setIsChatOpen,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'suggestions' | 'chat'>('suggestions');
  const [highlightedChord, setHighlightedChord] = useState<string | null>(null);
  const [selectedVoicingIndices, setSelectedVoicingIndices] = useState<Record<number, number>>({});

  const prevDockRef = useRef(chatDockPosition);
  useEffect(() => {
    if (prevDockRef.current === 'bottom' && chatDockPosition === 'panel') {
      setActiveTab('chat');
    } else if (prevDockRef.current === 'panel' && chatDockPosition === 'bottom') {
      setActiveTab('suggestions');
    }
    prevDockRef.current = chatDockPosition;
  }, [chatDockPosition]);

  const getVoicingsForSuggestion = (suggestion: NextChordSuggestion) => {
    if (suggestion.voicingOptions && suggestion.voicingOptions.length > 1) {
      return suggestion.voicingOptions;
    }
    const generated = generateVoicingOptions(suggestion.chordName);
    if (generated.length > 0) {
      const existing = suggestion.voicingOptions?.[0];
      if (existing) {
        const filtered = generated.filter(
          (g) => g.fretPositions.join('') !== existing.fretPositions.join('')
        );
        return [
          {
            ...existing,
            shapeName: existing.shapeName || 'Voicing 1',
          },
          ...filtered,
        ];
      }
      return generated;
    }
    return suggestion.voicingOptions || [];
  };

  const handlePrevVoicing = (suggestionIdx: number, totalVoicings: number) => {
    setSelectedVoicingIndices((prev) => {
      const current = prev[suggestionIdx] || 0;
      return {
        ...prev,
        [suggestionIdx]: current > 0 ? current - 1 : totalVoicings - 1,
      };
    });
  };

  const handleNextVoicing = (suggestionIdx: number, totalVoicings: number) => {
    setSelectedVoicingIndices((prev) => {
      const current = prev[suggestionIdx] || 0;
      return {
        ...prev,
        [suggestionIdx]: current < totalVoicings - 1 ? current + 1 : 0,
      };
    });
  };

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
      <div className="bg-[#131317]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col shadow-2xl @container transition-all">
        {/* 1. CLEAN HEADER WITH TABS */}
        <div className="pb-3 border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-2.5">
          {/* Segmented Control Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#181820] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setActiveTab('suggestions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'suggestions'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-[#a4a4b0] hover:text-[#f2f2f5]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommendations</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (chatDockPosition === 'bottom') {
                  setChatDockPosition('panel');
                }
                setActiveTab('chat');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-[#a4a4b0] hover:text-[#f2f2f5]'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Producer Chat</span>
              {chatDockPosition === 'bottom' && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.1] text-amber-300">
                  Bottom
                </span>
              )}
            </button>
          </div>

          {/* Right Controls Area */}
          {activeTab === 'suggestions' ? (
            <div className="flex items-center gap-2">
              <span className="hidden xl:inline text-[10px] text-[#a4a4b0] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.07]">
                {aiAnalysis?.modelUsed || (apiKey ? 'Gemini 2.5 Flash' : 'Theory Engine')}
              </span>

              <select
                value={harmonicStyle}
                onChange={(e) => {
                  setHarmonicStyle(e.target.value as any);
                  if (progression.length > 0) {
                    runAiAnalysis();
                  }
                }}
                className="bg-[#1a1a20] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-[#cfcfd6] focus:outline-none cursor-pointer hover:border-white/[0.15] transition-colors"
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
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1a1a20] hover:bg-[#25252d] text-[#cfcfd6] hover:text-[#f2f2f5] border border-white/[0.08] hover:border-white/[0.15] text-xs transition-all disabled:opacity-30 active:scale-95 cursor-pointer"
                title="Refresh recommendations"
              >
                <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin text-amber-400' : ''}`} />
                <span className="hidden sm:inline font-medium">Refresh</span>
              </button>

              {chatDockPosition === 'panel' ? (
                <button
                  type="button"
                  onClick={() => setChatDockPosition('bottom')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1a1a20] hover:bg-amber-500/15 text-[#a4a4b0] hover:text-amber-200 border border-white/[0.08] hover:border-amber-500/30 text-xs transition-all cursor-pointer"
                  title="Pop AI chat out to bottom dock"
                >
                  <ArrowDownToLine className="w-3 h-3 text-amber-400" />
                  <span className="hidden md:inline text-[11px]">Pop Chat</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsChatOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs transition-all cursor-pointer"
                  title="Open AI chat at bottom"
                >
                  <MessageSquare className="w-3 h-3 text-amber-400" />
                  <span className="hidden md:inline text-[11px]">Chat Open</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setChatDockPosition('bottom')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1a22] hover:bg-amber-500/15 text-amber-300 hover:text-amber-200 border border-white/[0.08] hover:border-amber-500/30 text-xs font-medium transition-all cursor-pointer"
                title="Pop chat away to bottom dock"
              >
                <ArrowDownToLine className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">Pop to Bottom</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. TAB CONTENT AREA */}
        {activeTab === 'chat' ? (
          <div className="pt-2 h-[520px] flex flex-col">
            <AiChatView dockPosition="panel" />
          </div>
        ) : (
          <div className="pt-3.5">
          {progression.length === 0 ? (
            /* Clean empty standby state with quick-add helper */
            <div className="w-full text-center py-8 px-4 rounded-xl border border-dashed border-white/[0.1] bg-[#16161c]/50 space-y-3">
              <p className="text-xs text-[#8e8e98] m-0">
                Add chords to your timeline to get intelligent harmonic recommendations and next chord suggestions.
              </p>
              {detectedChord && detectedChord.notes.length > 0 && (
                <div className="pt-1">
                  <button
                    onClick={addCurrentToProgression}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold shadow-[0_0_15px_-2px_rgba(245,158,11,0.4)] transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Analyze current chord: {detectedChord.name}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Active Analysis Loading Spinner */}
              {isAnalyzing && (
                <div className="flex items-center justify-center gap-2.5 py-4 text-xs text-[#a4a4b0] bg-[#16161d] rounded-xl border border-white/[0.08] animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span className="font-medium">Analyzing harmonic voice leading and modal connections...</span>
                </div>
              )}

              {/* Error Notice with Fallback Option */}
              {analysisError && !isAnalyzing && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center justify-between gap-2 shadow-sm">
                  <span className="truncate">{analysisError}</span>
                  <button
                    onClick={() => runAiAnalysis(true)}
                    className="px-2.5 py-1 rounded-md bg-amber-500/25 hover:bg-amber-500/35 text-amber-300 font-semibold text-[11px] shrink-0 transition-colors"
                  >
                    Use Theory Engine
                  </button>
                </div>
              )}

              {/* Harmonic Narrative Overview */}
              {aiAnalysis?.overviewExplanation && (
                <div className="p-3.5 rounded-xl bg-[#16161d]/90 border border-white/[0.07] text-xs text-[#c8c8cf] leading-relaxed shadow-sm">
                  {renderOverviewWithInteractiveChords(aiAnalysis.overviewExplanation)}
                </div>
              )}

              {/* Next Chord Suggestion Cards in Container Query Grid */}
              {aiAnalysis && aiAnalysis.nextChordSuggestions.length > 0 ? (
                <div className="grid grid-cols-1 @md:grid-cols-2 gap-3">
                  {aiAnalysis.nextChordSuggestions.map((suggestion: NextChordSuggestion, idx: number) => {
                    const voicings = getVoicingsForSuggestion(suggestion);
                    const currentVoicingIdx = selectedVoicingIndices[idx] || 0;
                    const safeVoicingIdx = Math.min(
                      currentVoicingIdx,
                      Math.max(0, voicings.length - 1)
                    );
                    const voicing = voicings[safeVoicingIdx] || voicings[0];

                    const isHighlighted =
                      highlightedChord &&
                      (suggestion.chordName.toLowerCase().includes(highlightedChord.toLowerCase()) ||
                        highlightedChord.toLowerCase().includes(suggestion.chordName.toLowerCase()));

                    return (
                      <div
                        key={`sugg-${suggestion.chordName}-${idx}`}
                        className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                          isHighlighted
                            ? 'bg-[#211e29] border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)] ring-2 ring-amber-400/50 -translate-y-1'
                            : 'bg-[#181820] border-white/[0.08] hover:border-white/[0.2] hover:-translate-y-0.5 hover:shadow-lg'
                        }`}
                      >
                        {/* Top: Chord Title & Fit Score */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <h3 className="text-sm font-bold text-[#f2f2f5] font-display m-0">
                              {suggestion.chordName}
                            </h3>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_8px_-2px_rgba(245,158,11,0.3)]">
                              {suggestion.fitScore}% fit
                            </span>
                          </div>

                          {/* Explanation */}
                          <p className="text-[11px] text-[#8e8e98] leading-relaxed mb-2.5 line-clamp-2">
                            {suggestion.theoreticalFunction}
                          </p>
                        </div>

                        {/* Voicing Flipper Controls */}
                        {voicings.length > 1 && (
                          <div className="flex items-center justify-between text-[11px] bg-[#121217] px-2.5 py-1 rounded-lg border border-white/[0.07] mb-2.5">
                            <div className="flex items-center gap-1.5 truncate mr-1">
                              <span className="text-[10px] text-[#71717a] uppercase font-bold tracking-wider">
                                Shape:
                              </span>
                              <span className="font-mono text-amber-300 font-semibold truncate text-[11px]">
                                {voicing?.shapeName || `Shape ${safeVoicingIdx + 1}`}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handlePrevVoicing(idx, voicings.length)}
                                className="p-0.5 rounded hover:bg-white/[0.1] text-[#8e8e98] hover:text-[#f2f2f5] transition-colors"
                                title="Previous voicing shape"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-mono text-[10px] text-[#8e8e98]">
                                {safeVoicingIdx + 1}/{voicings.length}
                              </span>
                              <button
                                onClick={() => handleNextVoicing(idx, voicings.length)}
                                className="p-0.5 rounded hover:bg-white/[0.1] text-[#8e8e98] hover:text-[#f2f2f5] transition-colors"
                                title="Next voicing shape"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Mini Fretboard Preview & Actions */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.07]">
                          {voicing && (
                            <div
                              onClick={() => applyVoicingToFretboard(voicing.fretPositions)}
                              className="cursor-pointer bg-[#101014] px-1.5 py-1 rounded-lg border border-white/[0.06] hover:border-amber-500/30 transition-colors"
                              title="Click to load this voicing onto guitar neck"
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
                                className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[#d1d1d8] hover:text-[#f2f2f5] transition-all active:scale-95"
                                title="Audition this voicing"
                              >
                                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
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
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold shadow-[0_0_12px_-2px_rgba(245,158,11,0.4)] transition-all active:scale-95"
                              title="Add this specific voicing to timeline"
                            >
                              <Plus className="w-3.5 h-3.5" />
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
      )}
    </div>
  );
};
