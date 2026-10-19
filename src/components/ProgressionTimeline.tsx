import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { MiniFretboard } from './MiniFretboard';
import { PRESET_PROGRESSIONS } from '../utils/guitarTheory';
import { SavedProgressionsModal } from './SavedProgressionsModal';
import {
  Play,
  Square,
  Repeat,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BookmarkPlus,
} from 'lucide-react';

export const ProgressionTimeline: React.FC = () => {
  const {
    progression,
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

  return (
    <div className="bg-[#18181b] border border-[#27272c] rounded-xl p-4 flex flex-col shadow-lg">
      {/* 1. CLEAN PLAYBACK & TRANSPORT HEADER */}
      <div className="pb-3 border-b border-[#242429] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Title & Count */}
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-[#f2f2f4] m-0">
            Timeline
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#222227] text-[#a4a4b0] font-mono">
            {progression.length} {progression.length === 1 ? 'chord' : 'chords'}
          </span>
        </div>

        {/* Center / Right: Transport & Preset Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Play / Stop Primary Button */}
          <button
            onClick={handleTogglePlay}
            disabled={progression.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all shadow-sm ${
              playback.isPlaying
                ? 'bg-amber-500 text-slate-950'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-30'
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
          <div className="flex items-center bg-[#141417] px-2 py-0.5 rounded-lg border border-[#2b2b32] text-xs gap-1.5">
            <span className="text-[10px] text-[#71717a] font-mono">BPM</span>
            <input
              type="number"
              min="40"
              max="240"
              value={playback.bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-10 bg-transparent text-center font-mono text-xs font-bold text-[#f2f2f4] focus:outline-none"
            />
          </div>

          {/* Loop Toggle */}
          <button
            onClick={toggleLoop}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              playback.loop
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-[#141417] border-[#2b2b32] text-[#71717a] hover:text-[#d4d4d8]'
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
            className="bg-[#202025] border border-[#2b2b32] rounded-lg px-2 py-1 text-xs text-[#cfcfd6] focus:outline-none cursor-pointer max-w-[140px] truncate"
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
            className="p-1.5 rounded-lg bg-[#202025] hover:bg-[#28282e] text-[#a4a4b0] hover:text-[#f2f2f4] border border-[#2b2b32] disabled:opacity-30 transition-colors"
            title="Save as preset"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
          </button>

          {/* Clear Progression */}
          <button
            onClick={clearProgression}
            disabled={progression.length === 0}
            className="p-1.5 rounded-lg bg-[#202025] hover:bg-red-950/30 text-[#71717a] hover:text-red-400 border border-[#2b2b32] disabled:opacity-30 transition-colors"
            title="Clear timeline"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. CHORD CARDS LIST OR CALM EMPTY STATE */}
      <div className="pt-3 min-h-[170px] flex items-center">
        {progression.length === 0 ? (
          /* Clean, gentle empty state */
          <div className="w-full text-center py-6 px-4 rounded-xl border border-dashed border-[#2b2b32] bg-[#141417]/50">
            <p className="text-xs text-[#8e8e96] mb-3">
              Your chord timeline is empty. Fretted notes on the neck can be added here, or start with an idea:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {PRESET_PROGRESSIONS.slice(0, 3).map((p, idx) => (
                <button
                  key={p.title}
                  onClick={() => loadPresetProgression(idx)}
                  className="px-2.5 py-1 rounded-lg bg-[#202025] hover:bg-[#27272e] border border-[#2b2b32] text-xs text-[#d1d1d8] transition-colors"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Horizontal Scrolling Chord Cards */
          <div className="w-full flex items-stretch gap-3 overflow-x-auto pb-2 pt-1">
            {progression.map((chord, idx) => {
              const isCurrent = playback.currentChordIndex === idx;

              return (
                <div
                  key={chord.id}
                  className={`w-36 shrink-0 rounded-xl p-3 flex flex-col justify-between border transition-all group relative ${
                    isCurrent
                      ? 'bg-[#222228] border-amber-500 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-[#1b1b1f] border-[#292930] hover:border-[#383842]'
                  }`}
                >
                  {/* Card Header: Reorder & Delete Controls */}
                  <div className="flex items-center justify-between text-[#71717a] mb-1">
                    <span className="text-[10px] font-mono text-[#8e8e96]">
                      #{idx + 1}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => reorderChord(idx, idx - 1)}
                        disabled={idx === 0}
                        className="p-0.5 hover:text-[#f2f2f4] disabled:opacity-20"
                        title="Move left"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => reorderChord(idx, idx + 1)}
                        disabled={idx === progression.length - 1}
                        className="p-0.5 hover:text-[#f2f2f4] disabled:opacity-20"
                        title="Move right"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeChord(chord.id)}
                        className="p-0.5 hover:text-red-400 ml-1"
                        title="Remove chord"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Chord Name & Function */}
                  <div
                    onClick={() => loadChordToFretboard(chord)}
                    className="cursor-pointer mb-2"
                    title="Click to load onto guitar neck"
                  >
                    <h3 className="text-base font-bold text-[#f2f2f4] truncate m-0">
                      {chord.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-[#71717a] truncate font-mono">
                        {chord.notes.join(' ')}
                      </span>
                    </div>
                  </div>

                  {/* Mini Fretboard Preview */}
                  <div
                    onClick={() => loadChordToFretboard(chord)}
                    className="cursor-pointer bg-[#141417] p-1.5 rounded-lg border border-[#242428] flex justify-center"
                    title="Click to load onto neck"
                  >
                    <MiniFretboard
                      fretPositions={chord.fretPositions}
                      size="sm"
                    />
                  </div>

                  {/* Bottom Quick Load Button */}
                  <button
                    onClick={() => loadChordToFretboard(chord)}
                    className="mt-2 w-full py-1 rounded bg-[#242429] hover:bg-[#2c2c33] text-[11px] text-[#cfcfd6] font-medium transition-colors"
                  >
                    To Neck
                  </button>
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
