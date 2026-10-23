import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { MiniFretboard } from './MiniFretboard';
import { PRESET_PROGRESSIONS, detectLikelyKeys } from '../utils/guitarTheory';
import { SavedProgressionsModal } from './SavedProgressionsModal';
import type { ChordItem } from '../types';
import {
  Play,
  Square,
  Repeat,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BookmarkPlus,
  Compass,
  Sparkles,
  Layers,
  Plus,
} from 'lucide-react';

interface SectionGroup {
  section: string;
  items: { chord: ChordItem; globalIndex: number }[];
}

export const ProgressionTimeline: React.FC = () => {
  const {
    progression,
    likelyKeys,
    activeSection,
    setActiveSection,
    setChordSection,
    playback,
    setBpm,
    toggleLoop,
    startPlayback,
    stopPlayback,
    removeChord,
    reorderChord,
    clearProgression,
    loadChordToFretboard,
    loadPresetProgression,
    savedProgressions,
    loadSavedProgression,
    aiAnalysis,
  } = useStore();

  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [modalInitialMode, setModalInitialMode] = useState<'save' | 'library'>('library');

  const handleTogglePlay = () => {
    if (playback.isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  // Group consecutive chords by section
  const sectionGroups: SectionGroup[] = [];
  progression.forEach((chord, globalIndex) => {
    const sec = chord.section || 'Verse';
    const lastGroup = sectionGroups[sectionGroups.length - 1];
    if (lastGroup && lastGroup.section === sec) {
      lastGroup.items.push({ chord, globalIndex });
    } else {
      sectionGroups.push({ section: sec, items: [{ chord, globalIndex }] });
    }
  });

  const getSectionTheme = (section: string) => {
    const s = section.toLowerCase();
    if (s.includes('chorus')) {
      return {
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_-2px_rgba(245,158,11,0.2)]',
        blockBg: 'bg-[#191613]/90 border-amber-500/25',
        dotColor: 'bg-amber-400',
      };
    }
    if (s.includes('bridge')) {
      return {
        badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_10px_-2px_rgba(168,85,247,0.2)]',
        blockBg: 'bg-[#18141e]/90 border-purple-500/25',
        dotColor: 'bg-purple-400',
      };
    }
    if (s.includes('intro') || s.includes('outro')) {
      return {
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_-2px_rgba(16,185,129,0.2)]',
        blockBg: 'bg-[#131915]/90 border-emerald-500/25',
        dotColor: 'bg-emerald-400',
      };
    }
    // Default / Verse
    return {
      badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-[0_0_10px_-2px_rgba(14,165,233,0.2)]',
      blockBg: 'bg-[#13161d]/90 border-sky-500/25',
      dotColor: 'bg-sky-400',
    };
  };

  return (
    <div className="bg-[#131317]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col shadow-2xl space-y-3.5 @container transition-all">
      {/* 1. CLEAN PLAYBACK & TRANSPORT HEADER */}
      <div className="pb-3 border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Title & Count */}
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-bold text-[#f2f2f5] m-0 font-display tracking-tight flex items-center gap-1.5">
            Timeline
          </h2>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[#a4a4b0] font-mono">
            {progression.length} {progression.length === 1 ? 'chord' : 'chords'}
          </span>
        </div>

        {/* Center / Right: Transport & Preset Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Play / Stop Primary Button */}
          <button
            onClick={handleTogglePlay}
            disabled={progression.length === 0}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-lg text-xs font-semibold transition-all shadow-md active:scale-95 ${
              playback.isPlaying
                ? 'bg-amber-400 text-slate-950 shadow-[0_0_16px_rgba(245,158,11,0.5)] ring-2 ring-amber-400/50'
                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 hover:bg-emerald-500/25 hover:border-emerald-500/50 disabled:opacity-30'
            }`}
          >
            {playback.isPlaying ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Play</span>
              </>
            )}
          </button>

          {/* Minimal BPM Stepper */}
          <div className="flex items-center bg-[#18181e] px-2.5 py-0.5 rounded-lg border border-white/[0.08] text-xs gap-1.5 shadow-inner">
            <span className="text-[10px] text-[#71717a] font-mono font-medium">BPM</span>
            <input
              type="number"
              min="40"
              max="240"
              value={playback.bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-10 bg-transparent text-center font-mono text-xs font-bold text-[#f2f2f5] focus:outline-none"
            />
          </div>

          {/* Loop Toggle */}
          <button
            onClick={toggleLoop}
            className={`p-1.5 rounded-lg border text-xs transition-all duration-150 ${
              playback.loop
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_10px_-2px_rgba(245,158,11,0.3)]'
                : 'bg-[#18181e] border-white/[0.08] text-[#71717a] hover:text-[#d4d4d8] hover:border-white/[0.15]'
            }`}
            title="Toggle loop"
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          {/* Preset / Library Dropdown */}
          <select
            onChange={(e) => {
              const val = e.target.value;
              if (!val) return;
              if (val === '__manage__') {
                setModalInitialMode('library');
                setIsPresetsModalOpen(true);
              } else if (val.startsWith('saved:')) {
                const id = val.replace('saved:', '');
                loadSavedProgression(id);
              } else if (val.startsWith('factory:')) {
                const idx = parseInt(val.replace('factory:', ''), 10);
                loadPresetProgression(idx);
              }
              e.target.value = '';
            }}
            defaultValue=""
            className="bg-[#1a1a20] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-[#cfcfd6] focus:outline-none cursor-pointer max-w-[140px] truncate hover:border-white/[0.15] transition-colors"
          >
            <option value="" disabled>
              Presets...
            </option>
            {savedProgressions.length > 0 && (
              <optgroup label="Saved">
                {savedProgressions.map((p) => (
                  <option key={p.id} value={`saved:${p.id}`}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Built-in">
              {PRESET_PROGRESSIONS.map((preset, idx) => (
                <option key={preset.title} value={`factory:${idx}`}>
                  {preset.title}
                </option>
              ))}
            </optgroup>
            <option value="__manage__">Manage Library...</option>
          </select>

          {/* Save Preset Icon */}
          <button
            onClick={() => {
              setModalInitialMode('save');
              setIsPresetsModalOpen(true);
            }}
            disabled={progression.length === 0}
            className="p-1.5 rounded-lg bg-[#1a1a20] hover:bg-[#25252d] text-[#a4a4b0] hover:text-[#f2f2f5] border border-white/[0.08] disabled:opacity-30 transition-all"
            title="Save as preset"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
          </button>

          {/* Clear Progression */}
          <button
            onClick={clearProgression}
            disabled={progression.length === 0}
            className="p-1.5 rounded-lg bg-[#1a1a20] hover:bg-rose-950/40 text-[#71717a] hover:text-rose-300 border border-white/[0.08] disabled:opacity-30 transition-all"
            title="Clear timeline"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC LIKELY KEYS & SECTION CONTROLS BAR */}
      <div className="py-2 px-3 rounded-xl bg-[#17171d]/90 border border-white/[0.07] flex flex-wrap items-center justify-between gap-2.5 shadow-inner">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#f2f2f5] font-display">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Likely Keys:</span>
          </div>

          {likelyKeys && likelyKeys.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {likelyKeys.map((k, idx) => (
                <div
                  key={`key-${k.key}-${idx}`}
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono border transition-all ${
                    idx === 0
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 font-bold shadow-[0_0_12px_-2px_rgba(245,158,11,0.3)]'
                      : 'bg-white/[0.05] text-[#b0b0bc] border-white/[0.08] hover:border-white/[0.15]'
                  }`}
                  title={k.reason}
                >
                  <span>{k.key}</span>
                  <span className="text-[10px] opacity-75 font-sans font-normal">
                    {k.confidence}%
                  </span>
                  {idx === 0 && (
                    <span className="text-[9px] uppercase tracking-wider px-1 py-0.2 rounded bg-amber-400/25 text-amber-200 font-bold">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-xs text-[#71717a] italic font-sans">
              Add chords to timeline to compute key
            </span>
          )}
        </div>

        {/* Section Target Pill */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] text-[#8e8e98] flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 opacity-70 text-amber-400" />
            <span>Active Section:</span>
          </span>
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value)}
            className="bg-[#1c1c24] border border-white/[0.1] rounded-lg px-2.5 py-0.5 text-xs text-amber-300 font-medium focus:outline-none cursor-pointer hover:border-white/[0.2] transition-colors"
          >
            <option value="Verse">Verse</option>
            <option value="Chorus">Chorus</option>
            <option value="Bridge">Bridge</option>
            <option value="Intro">Intro</option>
            <option value="Outro">Outro</option>
            <option value="Pre-Chorus">Pre-Chorus</option>
          </select>
        </div>
      </div>

      {/* 3. SECTION GROUPED TIMELINE CARDS */}
      <div className="min-h-[170px]">
        {progression.length === 0 ? (
          /* Empty Standby State */
          <div className="w-full text-center py-8 px-4 rounded-xl border border-dashed border-white/[0.1] bg-[#16161c]/50">
            <p className="text-xs text-[#8e8e98] mb-3">
              Your chord timeline is empty. Fretted notes on the neck can be added here, or start with an idea:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {PRESET_PROGRESSIONS.slice(0, 3).map((p, idx) => (
                <button
                  key={p.title}
                  onClick={() => loadPresetProgression(idx)}
                  className="px-3 py-1 rounded-lg bg-[#1c1c24] hover:bg-[#252530] border border-white/[0.08] hover:border-amber-500/30 text-xs text-[#d1d1d8] hover:text-[#f2f2f5] transition-all"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {sectionGroups.map((group, groupIdx) => {
              const theme = getSectionTheme(group.section);
              const sectionChords = group.items.map((i) => i.chord);
              const sectionLikelyKeys = detectLikelyKeys(sectionChords);
              const sectionKey = sectionLikelyKeys[0]?.key;

              // Check if there is an AI modal transition commentary between previous group and this group
              const previousGroup = groupIdx > 0 ? sectionGroups[groupIdx - 1] : null;
              const modalTransition = previousGroup
                ? aiAnalysis?.sectionAnalysis?.find(
                    (sa) =>
                      sa.fromSection.toLowerCase() === previousGroup.section.toLowerCase() &&
                      sa.toSection.toLowerCase() === group.section.toLowerCase()
                  )
                : null;

              return (
                <div key={`section-group-${group.section}-${groupIdx}`} className="space-y-2">
                  {/* Modal Switch Connector Banner between sections */}
                  {modalTransition && (
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-transparent border border-amber-500/30 text-xs text-amber-200 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-amber-300">
                          {modalTransition.fromSection} → {modalTransition.toSection}:
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-[10px] font-mono font-bold text-amber-200">
                          {modalTransition.modalShift}
                        </span>
                        <span className="text-[#c8c8cf] text-[11px] leading-tight">
                          {modalTransition.explanation}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Section Container Card */}
                  <div className={`p-3.5 rounded-xl border ${theme.blockBg} space-y-2.5 backdrop-blur-md shadow-lg`}>
                    {/* Section Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${theme.badgeBg}`}
                        >
                          {group.section}
                        </span>
                        <span className="text-xs text-[#8e8e98] font-mono">
                          {group.items.length} {group.items.length === 1 ? 'chord' : 'chords'}
                        </span>
                        {sectionKey && (
                          <span className="text-[11px] font-mono text-[#a4a4b2] hidden sm:inline">
                            Key: <strong className="text-[#f2f2f5]">{sectionKey}</strong>
                          </span>
                        )}
                      </div>

                      {/* Quick Add Section Button */}
                      <button
                        onClick={() => {
                          const nextSec =
                            group.section === 'Verse'
                              ? 'Chorus'
                              : group.section === 'Chorus'
                                ? 'Bridge'
                                : 'Verse';
                          setActiveSection(nextSec);
                        }}
                        className="text-[11px] text-[#71717a] hover:text-[#d1d1d8] flex items-center gap-1 transition-colors"
                        title="Set active section for incoming chords"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Next section</span>
                      </button>
                    </div>

                    {/* Horizontal Chord Cards */}
                    <div className="flex items-stretch gap-3 overflow-x-auto pb-1.5 pt-0.5">
                      {group.items.map(({ chord, globalIndex }) => {
                        const isCurrent = playback.currentChordIndex === globalIndex;

                        return (
                          <div
                            key={chord.id}
                            className={`w-38 shrink-0 rounded-xl p-3 flex flex-col justify-between border transition-all duration-200 group relative ${
                              isCurrent
                                ? 'bg-[#211e29] border-amber-400 shadow-[0_0_22px_rgba(245,158,11,0.4)] ring-2 ring-amber-400/50 -translate-y-1'
                                : 'bg-[#181820] border-white/[0.08] hover:border-white/[0.18] hover:-translate-y-0.5 hover:shadow-lg'
                            }`}
                          >
                            {/* Card Top: Order & Section Changer & Reorder */}
                            <div className="flex items-center justify-between text-[#71717a] mb-1.5">
                              <span className="text-[10px] font-mono text-[#8e8e98] font-semibold">
                                #{globalIndex + 1}
                              </span>

                              {/* Section Dropdown Changer */}
                              <select
                                value={chord.section || group.section}
                                onChange={(e) => setChordSection(chord.id, e.target.value)}
                                className="text-[9px] bg-[#121217] text-[#a4a4b2] hover:text-[#f2f2f5] rounded px-1.5 py-0.2 border border-white/[0.08] focus:outline-none cursor-pointer max-w-[70px] truncate"
                                title="Change chord section"
                              >
                                <option value="Verse">Verse</option>
                                <option value="Chorus">Chorus</option>
                                <option value="Bridge">Bridge</option>
                                <option value="Intro">Intro</option>
                                <option value="Outro">Outro</option>
                                <option value="Pre-Chorus">Pre-Ch</option>
                              </select>

                              {/* Reorder and Delete */}
                              <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => reorderChord(globalIndex, globalIndex - 1)}
                                  disabled={globalIndex === 0}
                                  className="p-0.5 hover:text-[#f2f2f5] disabled:opacity-20"
                                  title="Move left"
                                >
                                  <ChevronLeft className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => reorderChord(globalIndex, globalIndex + 1)}
                                  disabled={globalIndex === progression.length - 1}
                                  className="p-0.5 hover:text-[#f2f2f5] disabled:opacity-20"
                                  title="Move right"
                                >
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => removeChord(chord.id)}
                                  className="p-0.5 hover:text-rose-400 ml-0.5"
                                  title="Remove chord"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Chord Name & Notes */}
                            <div
                              onClick={() => loadChordToFretboard(chord)}
                              className="cursor-pointer mb-2"
                              title="Click to load onto guitar neck"
                            >
                              <h3 className="text-sm font-bold text-[#f2f2f5] font-display truncate m-0">
                                {chord.name}
                              </h3>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] text-amber-300/80 truncate font-mono">
                                  {chord.notes.join(' ')}
                                </span>
                              </div>
                            </div>

                            {/* Mini Fretboard Preview */}
                            <div
                              onClick={() => loadChordToFretboard(chord)}
                              className="cursor-pointer bg-[#101014] p-1 rounded-lg border border-white/[0.06] flex justify-center hover:border-amber-500/30 transition-colors"
                              title="Click to load onto neck"
                            >
                              <MiniFretboard
                                fretPositions={chord.fretPositions}
                                size="sm"
                              />
                            </div>

                            {/* Bottom Load Button */}
                            <button
                              onClick={() => loadChordToFretboard(chord)}
                              className="mt-2 w-full py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-[10px] text-[#cfcfd6] hover:text-[#f2f2f5] font-medium transition-all"
                            >
                              To Neck
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preset Modal */}
      <SavedProgressionsModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        initialMode={modalInitialMode}
      />
    </div>
  );
};
