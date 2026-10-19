import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { audioEngine } from '../services/audioEngine';
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
  Volume2,
  Music,
  Plus,
  ArrowDown,
  Bookmark,
  BookmarkPlus,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export const ProgressionTimeline: React.FC = () => {
  const {
    progression,
    playback,
    setBpm,
    setBeatsPerChord,
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
    setActiveView,
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
    <div className="bg-[#14110e] border border-[#2e261f] rounded-2xl p-4 sm:p-5 flex flex-col shadow-2xl">
      {/* Top Header: Title & Playback Bar */}
      <div className="pb-3.5 border-b border-[#28211a] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#261f18] text-amber-400 border border-[#3d3126]">
              <Music className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-[#f5ede0] uppercase tracking-wider m-0 flex items-center gap-2 font-mono">
              Progression
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#241d17] text-[#d4af37] border border-[#3b3023] font-mono">
                {progression.length}
              </span>
            </h2>
          </div>

          {/* Preset & Save Controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Save Current as Preset Button */}
            <button
              onClick={() => {
                setModalInitialMode('save');
                setIsPresetsModalOpen(true);
              }}
              disabled={progression.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2b2118] hover:bg-[#382b1f] text-amber-300 border border-amber-600/40 text-xs font-bold transition-all disabled:opacity-30 shadow-sm"
              title="Save current progression as a preset"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save Preset</span>
              <span className="sm:hidden">Save</span>
            </button>

            {/* Quick Load Dropdown */}
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
              className="bg-[#0e0c0a] border border-[#332a21] rounded-lg px-2.5 py-1 text-xs text-[#ded5c8] font-medium focus:outline-none cursor-pointer max-w-[170px] sm:max-w-[210px] truncate"
            >
              <option value="" disabled>
                Load Preset / Library...
              </option>
              {savedProgressions.length > 0 && (
                <optgroup label={`★ My Saved Presets (${savedProgressions.length})`}>
                  {savedProgressions.map((p) => (
                    <option key={p.id} value={`saved:${p.id}`}>
                      {p.name} ({p.chords.length} chords)
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="🎸 Built-In Presets">
                {PRESET_PROGRESSIONS.map((preset, idx) => (
                  <option key={preset.title} value={`factory:${idx}`}>
                    {preset.title.split('(')[0].trim()}
                  </option>
                ))}
              </optgroup>
              <option value="__manage__">📁 Manage Presets Library...</option>
            </select>

            {/* Full Library Manager Modal Button */}
            <button
              onClick={() => {
                setModalInitialMode('library');
                setIsPresetsModalOpen(true);
              }}
              className="p-1.5 rounded-lg bg-[#1c1713] hover:bg-[#29221a] text-[#c2b4a3] border border-[#332a21] hover:border-[#4a3d30] transition-colors"
              title="Open Presets Library & Saved Progressions"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-500" />
            </button>

            {/* Clear Progression */}
            <button
              onClick={clearProgression}
              disabled={progression.length === 0}
              className="p-1 rounded-lg bg-[#1c1713] hover:bg-red-950/40 text-[#8a7c6e] hover:text-red-400 border border-[#332a21] transition-colors disabled:opacity-30"
              title="Clear all chords"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Playback Controls Strip: Vintage Reel-to-Reel Tape Transport */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#0e0c0a] p-2.5 rounded-xl border border-[#261f18]">
          <button
            onClick={handleTogglePlay}
            disabled={progression.length === 0}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all shadow-md ${
              playback.isPlaying
                ? 'bg-[#b91c1c] hover:bg-red-600 text-white shadow-red-950/40'
                : 'bg-[#10b981] hover:bg-[#059669] text-[#052e16] shadow-emerald-950/40 disabled:opacity-40'
            }`}
          >
            {playback.isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play</span>
              </>
            )}
          </button>

          {/* BPM Slider */}
          <div className="flex items-center gap-2 text-xs text-[#a69787]">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider">BPM</span>
            <input
              type="range"
              min="40"
              max="240"
              value={playback.bpm}
              onChange={(e) => setBpm(parseInt(e.target.value, 10))}
              className="w-16 accent-amber-500 cursor-pointer bg-[#241e18]"
            />
            <span className="font-mono text-xs font-bold text-amber-400 w-7 text-right">
              {playback.bpm}
            </span>
          </div>

          {/* Beats Per Chord */}
          <div className="flex items-center gap-1 text-[11px] text-[#a69787]">
            <span className="font-mono text-[10px] uppercase font-semibold">Beats:</span>
            {[1, 2, 3, 4].map((b) => (
              <button
                key={b}
                onClick={() => setBeatsPerChord(b)}
                className={`px-1.5 py-0.5 rounded text-xs font-semibold transition-all ${
                  playback.beatsPerChord === b
                    ? 'bg-[#d97706] text-[#0f0e0c] font-black shadow-sm'
                    : 'bg-[#1c1713] text-[#8a7c6e] hover:text-white border border-[#2e261f]'
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Loop toggle */}
          <button
            onClick={toggleLoop}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              playback.loop
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-[#1c1713] border-[#2e261f] text-[#8a7c6e]'
            }`}
            title="Toggle Loop"
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Chord Cards Grid */}
      <div className="pt-3.5">
        {progression.length === 0 ? (
          <div className="border border-dashed border-[#382d22] rounded-2xl p-7 sm:p-9 text-center bg-[#0e0c0a]/90 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#241d17] border border-[#3d3126] text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#f5ede0] font-serif m-0">
                Your Songwriting Timeline is Clean
              </h3>
              <p className="text-xs text-[#a69787] max-w-md mx-auto leading-relaxed m-0">
                Touch any fret on the guitar neck above to map a chord voicing, then click{' '}
                <strong className="text-amber-300">"+ Add to Progression"</strong>. Or spark instant ideas from our library:
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                onClick={() => loadPresetProgression(4)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#f59e0b] hover:to-[#d97706] text-[#0f0e0c] font-black text-xs shadow-md transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Load Pink Floyd Modal Cliché</span>
              </button>

              <button
                onClick={() => loadPresetProgression(1)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1713] hover:bg-[#28211a] text-[#ded5c8] border border-[#332a21] font-bold text-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-amber-500" />
                <span>Load Neo-Soul 7ths</span>
              </button>

              <button
                onClick={() => setActiveView('instructions')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1713] hover:bg-[#28211a] text-amber-300 border border-amber-600/30 font-bold text-xs transition-all"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Read Field Guide</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {progression.map((chord, index) => {
              const isPlayingThis = playback.isPlaying && playback.currentChordIndex === index;

              return (
                <div
                  key={chord.id}
                  className={`rounded-2xl p-4 border transition-all duration-150 flex flex-col justify-between relative group bg-[#181410] ${
                    isPlayingThis
                      ? 'border-amber-400 shadow-2xl shadow-amber-950/70 bg-[#211a14] ring-2 ring-amber-400/80'
                      : 'border-[#2e261f] hover:border-[#4a3d30] hover:bg-[#1d1914]'
                  }`}
                >
                  {/* Playing Pulse Badge */}
                  {isPlayingThis && (
                    <div className="absolute -top-2 left-4 px-2.5 py-0.5 rounded-full bg-[#d97706] text-[#0f0e0c] font-black text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0f0e0c] animate-ping" />
                      Playing
                    </div>
                  )}

                  {/* Header: Step Number, Reorder Controls & Delete */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#241d17] border border-[#3d3125] font-mono text-xs font-bold text-amber-400 flex items-center justify-center">
                        {index + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => reorderChord(index, index - 1)}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-[#28211a] text-[#8a7c6e] hover:text-[#ede5d8] disabled:opacity-20"
                        title="Move left"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => reorderChord(index, index + 1)}
                        disabled={index === progression.length - 1}
                        className="p-1 rounded hover:bg-[#28211a] text-[#8a7c6e] hover:text-[#ede5d8] disabled:opacity-20"
                        title="Move right"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeChord(chord.id)}
                        className="p-1 rounded hover:bg-red-950/40 text-[#8a7c6e] hover:text-red-400"
                        title="Delete chord"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Large, Bold Chord Title */}
                  <div className="mb-2">
                    <h3 className="text-xl sm:text-2xl font-black text-[#f5ede0] font-serif tracking-tight leading-tight m-0">
                      {chord.name}
                    </h3>
                  </div>

                  {/* High Contrast Mini Fretboard Chart */}
                  <div className="flex justify-center my-2">
                    <MiniFretboard fretPositions={chord.fretPositions} size="md" />
                  </div>

                  {/* Voiced notes list */}
                  <div className="text-[11px] font-mono text-amber-300/90 text-center my-1.5 font-bold bg-[#0e0c0a] py-1 px-2 rounded-lg border border-[#241e18] truncate">
                    {chord.notes.join(' • ')}
                  </div>

                  {/* Action Buttons: Play & Load to Neck */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#261f18] mt-1">
                    <button
                      onClick={() => audioEngine.playStrum(chord.notes)}
                      className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#1c1713] hover:bg-[#28211a] text-[#ede5d8] border border-[#2e261f] text-xs font-semibold transition-colors"
                      title="Play this chord"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Play</span>
                    </button>
                    <button
                      onClick={() => loadChordToFretboard(chord)}
                      className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#241d17] hover:bg-[#30261e] text-amber-300 border border-amber-600/30 text-xs font-semibold transition-colors"
                      title="Load to bottom neck"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                      <span>To Neck</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Presets & Saved Progressions Library Modal */}
      <SavedProgressionsModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        initialMode={modalInitialMode}
      />
    </div>
  );
};
