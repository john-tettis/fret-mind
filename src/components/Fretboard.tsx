import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { audioEngine } from '../services/audioEngine';
import {
  GUITAR_STRINGS,
  TOTAL_FRETS,
  FRET_MARKERS,
  DOUBLE_DOT_FRETS,
  getNoteForStringAndFret,
  TUNING_PRESETS,
  PRESET_CHORDS,
  type PresetChord,
} from '../utils/guitarTheory';
import {
  Play,
  Plus,
  Trash2,
  Bookmark,
  Check,
  ChevronDown,
  Sliders,
} from 'lucide-react';

export const Fretboard: React.FC = () => {
  const {
    currentFretboard,
    detectedChord,
    setFret,
    toggleStringOpenMute,
    clearFretboard,
    setFretboardVoicing,
    addCurrentToProgression,
    tuningName,
    tuningNotes,
    setTuning,
    neckStringHeight,
    setNeckStringHeight,
  } = useStore();

  const [hoveredCell, setHoveredCell] = useState<{ stringIdx: number; fret: number } | null>(null);
  const [zoomRange, setZoomRange] = useState<'full' | 'open' | 'mid'>('mid');
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isTuningOpen, setIsTuningOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef(0);
  const startHeightRef = useRef(32);

  // Strings: High E (index 5) down to Low E (index 0)
  const displayStrings = [...GUITAR_STRINGS].reverse();

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [zoomRange]);

  const visibleFrets =
    zoomRange === 'open'
      ? Array.from({ length: 8 }, (_, i) => i) // 0 to 7
      : zoomRange === 'mid'
        ? Array.from({ length: 14 }, (_, i) => i) // 0 to 13
        : Array.from({ length: TOTAL_FRETS + 1 }, (_, i) => i); // 0 to 22

  const getFretWeight = (fret: number) => {
    if (fret === 0) return 0;
    return Math.round(1000 * Math.pow(0.968, fret));
  };

  const getFretStyle = (fret: number): React.CSSProperties => {
    if (fret === 0) {
      return {
        flex: '0 0 42px',
        width: '42px',
        minWidth: '42px',
        maxWidth: '42px',
      };
    }
    const weight = getFretWeight(fret);
    const minWidth = Math.max(26, Math.round(28 * (zoomRange === 'open' ? 1.4 : zoomRange === 'mid' ? 1.1 : 0.85)));
    return {
      flex: `${weight} ${weight} 0%`,
      minWidth: `${minWidth}px`,
    };
  };

  const handleStrum = () => {
    if (detectedChord && detectedChord.notes.length > 0) {
      audioEngine.playStrum(detectedChord.notes);
    }
  };

  const handleAddProgression = () => {
    if (!detectedChord || detectedChord.notes.length === 0) return;
    addCurrentToProgression();
    setIsAddedFeedback(true);
    setTimeout(() => setIsAddedFeedback(false), 1000);
  };

  const handleSelectPreset = (preset: PresetChord) => {
    setFretboardVoicing([...preset.frets]);
    const notes: string[] = [];
    preset.frets.forEach((fret, stringIdx) => {
      if (fret !== null) {
        const n = getNoteForStringAndFret(stringIdx, fret, tuningNotes);
        if (n) notes.push(n);
      }
    });
    audioEngine.playStrum(notes);
    setIsPresetsOpen(false);
  };

  // Subtle vertical resize drag handler
  const handlePointerDownVerticalResize = (e: React.PointerEvent) => {
    e.preventDefault();
    dragStartYRef.current = e.clientY;
    startHeightRef.current = neckStringHeight;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - dragStartYRef.current;
      const newHeight = startHeightRef.current + deltaY * 0.4;
      setNeckStringHeight(newHeight);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const dotSize = Math.max(18, Math.min(34, Math.round(neckStringHeight * 0.65)));
  const dotFontSize = Math.max(9, Math.min(12, Math.round(neckStringHeight * 0.3)));

  return (
    <div className="w-full bg-[#18181b] border border-[#27272c] rounded-xl shadow-lg flex flex-col select-none overflow-hidden">
      {/* 1. GUITAR FRETBOARD NECK */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto select-none bg-[#111113] border-b border-[#242429] px-2 py-1.5"
      >
        <div className="relative px-1 w-full min-w-full">
          {/* Fret Numbers on Top */}
          <div className="flex items-center w-full mb-1">
            <div className="w-20 shrink-0 flex items-center justify-end pr-3">
              <span className="text-[10px] font-mono text-[#62626a]">
                Fret
              </span>
            </div>

            <div className="flex items-center flex-1 min-w-0">
              {visibleFrets.map((fret) => (
                <div
                  key={`num-top-${fret}`}
                  style={getFretStyle(fret)}
                  className="text-center text-[10px] font-mono font-medium text-[#71717a] select-none"
                >
                  {fret === 0 ? 'NUT' : fret}
                </div>
              ))}
            </div>
          </div>

          {/* Wooden Fretboard Body with Inlays & 6 Strings */}
          <div className="relative rounded-lg fretboard-wood border border-[#2e2a27] overflow-hidden flex">
            <div className="flex-1 min-w-0 flex flex-col relative">
              {/* Pearl Inlays */}
              <div className="absolute inset-0 pointer-events-none flex w-full">
                <div className="w-20 shrink-0" />
                <div className="flex items-center flex-1 min-w-0 h-full">
                  {visibleFrets.map((fret) => {
                    const isDouble = DOUBLE_DOT_FRETS.includes(fret);
                    const isSingle = FRET_MARKERS.includes(fret) && !isDouble;

                    return (
                      <div
                        key={`inlay-${fret}`}
                        style={getFretStyle(fret)}
                        className="h-full flex flex-col items-center justify-center relative"
                      >
                        {isSingle && (
                          <div className="w-2.5 h-2.5 rounded-full pearl-inlay" />
                        )}
                        {isDouble && (
                          <div className="h-full flex flex-col justify-around py-3">
                            <div className="w-2 h-2 rounded-full pearl-inlay" />
                            <div className="w-2 h-2 rounded-full pearl-inlay" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6 Guitar Strings */}
              {displayStrings.map((stringItem) => {
                const stringIdx = stringItem.index;
                const activeFret = currentFretboard[stringIdx];
                const stringTuning = tuningNotes[stringIdx] || stringItem.name;
                const isOpen = activeFret === 0;
                const isMuted = activeFret === null;

                // String gauge styling
                const stringThickness = Math.max(1, Math.min(4, Math.round(1 + (5 - stringIdx) * 0.5)));
                const stringColor = stringIdx <= 2 ? '#b8860b' : '#9ca3af';

                return (
                  <div
                    key={`string-row-${stringIdx}`}
                    style={{ height: `${neckStringHeight}px` }}
                    className="flex items-center w-full relative z-10 group"
                  >
                    {/* Left String Header: Clean String Name & Open/Mute Indicator */}
                    <div className="w-20 shrink-0 h-full flex items-center justify-between px-2 bg-[#161514] border-r border-[#2d2925] z-20">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-[#f0ede6]">
                          {stringTuning}
                        </span>
                      </div>

                      {/* Clickable Open/Mute Badge */}
                      <button
                        onClick={() => toggleStringOpenMute(stringIdx)}
                        className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold transition-colors ${
                          isOpen
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : isMuted
                              ? 'bg-[#211f1e] text-[#6b6762] hover:text-[#9e978e]'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                        title={isOpen ? 'Open string' : isMuted ? 'Muted (click to activate)' : 'Fretted'}
                      >
                        {isOpen ? '○' : isMuted ? '✕' : `${activeFret}`}
                      </button>
                    </div>

                    {/* Fret Cells Across Width */}
                    <div className="flex items-center flex-1 min-w-0 h-full relative">
                      {/* Physical String Wire */}
                      <div
                        className="absolute left-0 right-0 pointer-events-none z-10 opacity-80"
                        style={{
                          height: `${stringThickness}px`,
                          backgroundColor: stringColor,
                        }}
                      />

                      {/* Fret Cells: 0 (Nut) to visibleFrets.length */}
                      {visibleFrets.map((fret) => {
                        const isNut = fret === 0;
                        const isFretted = activeFret === fret;
                        const noteName = getNoteForStringAndFret(stringIdx, fret, tuningNotes);
                        const isHovered =
                          hoveredCell?.stringIdx === stringIdx && hoveredCell?.fret === fret;

                        return (
                          <div
                            key={`cell-${stringIdx}-${fret}`}
                            style={getFretStyle(fret)}
                            onClick={() => setFret(stringIdx, fret)}
                            onMouseEnter={() => setHoveredCell({ stringIdx, fret })}
                            onMouseLeave={() => setHoveredCell(null)}
                            className={`h-full relative flex items-center justify-center cursor-pointer transition-colors ${
                              isNut
                                ? 'fret-nut hover:bg-amber-500/10'
                                : 'fret-wire hover:bg-white/[0.04]'
                            }`}
                          >
                            {/* Fretted Note Dot */}
                            {isFretted && (
                              <div
                                style={{
                                  width: `${dotSize}px`,
                                  height: `${dotSize}px`,
                                  fontSize: `${dotFontSize}px`,
                                }}
                                className={`rounded-full flex items-center justify-center font-bold text-slate-950 z-20 active-fret-dot transition-transform scale-100 ${
                                  isNut ? 'bg-amber-400' : ''
                                }`}
                              >
                                {noteName ? noteName.replace(/[0-9]/g, '') : fret}
                              </div>
                            )}

                            {/* Ghost Hover Note */}
                            {isHovered && !isFretted && (
                              <div
                                style={{
                                  width: `${dotSize - 2}px`,
                                  height: `${dotSize - 2}px`,
                                  fontSize: `${dotFontSize}px`,
                                }}
                                className="rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[#d4d4d8] font-bold z-20 pointer-events-none"
                              >
                                {noteName ? noteName.replace(/[0-9]/g, '') : fret}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Resize Handle (no loud text banner) */}
      <div
        onPointerDown={handlePointerDownVerticalResize}
        onDoubleClick={() => setNeckStringHeight(32)}
        className="h-2 bg-[#141417] hover:bg-amber-500/30 cursor-row-resize flex items-center justify-center transition-colors border-b border-[#242429]"
        title="Drag to resize string height • Double-click to reset"
      >
        <div className="w-8 h-0.5 rounded-full bg-[#3b3b44]" />
      </div>

      {/* 2. CALM CONTROLS BAR */}
      <div className="px-4 py-2.5 bg-[#18181b] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Clean Detected Chord Name & Notes */}
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-sm sm:text-base font-bold text-[#f2f2f4]">
              {detectedChord?.name || 'Empty Neck'}
            </span>
            {detectedChord?.intervals && detectedChord.intervals.length > 0 && (
              <span className="text-xs font-mono text-[#8a8a93]">
                {detectedChord.intervals.join(' ')}
              </span>
            )}
          </div>

          {detectedChord && detectedChord.notes.length > 0 && (
            <div className="hidden sm:flex items-center gap-1">
              {detectedChord.notes.map((note, idx) => (
                <button
                  key={`n-${note}-${idx}`}
                  onClick={() => audioEngine.playNote(note)}
                  className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#222227] text-[#c8c8cf] hover:text-amber-300 transition-colors"
                  title="Click to audition note"
                >
                  {note}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Balanced, uncluttered action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Fret Range Minimal Pill Toggle */}
          <div className="flex items-center bg-[#141417] p-0.5 rounded-lg border border-[#2b2b32] text-xs">
            {(['open', 'mid', 'full'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setZoomRange(r)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  zoomRange === r
                    ? 'bg-[#27272e] text-[#f2f2f4] shadow-sm'
                    : 'text-[#7e7e88] hover:text-[#d1d1d8]'
                }`}
              >
                {r === 'open' ? '0–7' : r === 'mid' ? '0–13' : 'All'}
              </button>
            ))}
          </div>

          {/* Tuning Preset Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsTuningOpen(!isTuningOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#202025] hover:bg-[#28282e] text-[#cfcfd6] border border-[#2b2b32] text-xs transition-colors"
            >
              <Sliders className="w-3 h-3 opacity-70" />
              <span>{tuningName}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {isTuningOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-[#1e1e22] border border-[#303038] rounded-xl shadow-xl py-1.5 z-50 max-h-64 overflow-y-auto">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-[#7a7a85] border-b border-[#2b2b32]">
                  Guitar Tunings
                </div>
                {TUNING_PRESETS.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => {
                      setTuning(t.name, t.notes);
                      setIsTuningOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex flex-col hover:bg-white/[0.06] transition-colors ${
                      tuningName === t.name ? 'bg-amber-500/10 text-amber-300 font-semibold' : 'text-[#c0c0c8]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{t.name}</span>
                      <span className="text-[10px] font-mono text-[#7a7a85]">{t.notes.join(' ')}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Voicings Preset Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsPresetsOpen(!isPresetsOpen)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#202025] hover:bg-[#28282e] text-[#cfcfd6] border border-[#2b2b32] text-xs transition-colors"
            >
              <Bookmark className="w-3 h-3 opacity-70" />
              <span>Voicings</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {isPresetsOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#1e1e22] border border-[#303038] rounded-xl shadow-xl py-1.5 z-50 max-h-56 overflow-y-auto">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-[#7a7a85] border-b border-[#2b2b32]">
                  Chord Shapes
                </div>
                {PRESET_CHORDS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => handleSelectPreset(p)}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#c0c0c8] hover:text-[#f2f2f4] hover:bg-white/[0.06] flex items-center justify-between"
                  >
                    <span>{p.name}</span>
                    <span className="text-[10px] text-[#7a7a85]">{p.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Strum Button */}
          <button
            onClick={handleStrum}
            disabled={!detectedChord || detectedChord.notes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#202025] hover:bg-[#28282e] text-[#f2f2f4] border border-[#2b2b32] text-xs font-medium transition-colors disabled:opacity-30"
          >
            <Play className="w-3 h-3 text-emerald-400" />
            <span>Strum</span>
          </button>

          {/* Clear Neck */}
          <button
            onClick={clearFretboard}
            className="p-1.5 rounded-lg bg-[#202025] hover:bg-red-950/30 text-[#858590] hover:text-red-400 border border-[#2b2b32] transition-colors"
            title="Clear fretboard"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Primary Action: Add to Progression */}
          <button
            onClick={handleAddProgression}
            disabled={!detectedChord || detectedChord.notes.length === 0}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              isAddedFeedback
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-30'
            }`}
          >
            {isAddedFeedback ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Progression</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
