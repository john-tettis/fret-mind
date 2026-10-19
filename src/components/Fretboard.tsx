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
  GripHorizontal,
  GripVertical,
  Maximize2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

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
    tuneString,
    neckStringHeight,
    setNeckStringHeight,
    neckHorizontalStretch,
    setNeckHorizontalStretch,
  } = useStore();

  const [hoveredCell, setHoveredCell] = useState<{ stringIdx: number; fret: number } | null>(null);
  const [zoomRange, setZoomRange] = useState<'full' | 'open' | 'mid'>('full');
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isTuningOpen, setIsTuningOpen] = useState(false);
  const [isDraggingVerticalResize, setIsDraggingVerticalResize] = useState(false);
  const [isDraggingHorizontalResize, setIsDraggingHorizontalResize] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef(0);
  const startHeightRef = useRef(32);
  const dragStartXRef = useRef(0);
  const startStretchRef = useRef(1.0);

  // Strings: High E (index 5) down to Low E (index 0) for standard neck/tab orientation
  const displayStrings = [...GUITAR_STRINGS].reverse();

  // Reset horizontal scroll when switching zoom ranges so the nut is always visible
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

  // Acoustic fret tapering weight based on 12-TET geometry (~0.968 factor)
  const getFretWeight = (fret: number) => {
    if (fret === 0) return 0;
    return Math.round(1000 * Math.pow(0.968, fret));
  };

  // Dynamic flex style ensuring all visible frets stretch to fill 100% of available width
  const getFretStyle = (fret: number): React.CSSProperties => {
    if (fret === 0) {
      // Bone Nut has fixed width
      return {
        flex: '0 0 44px',
        width: '44px',
        minWidth: '44px',
        maxWidth: '44px',
      };
    }
    const weight = getFretWeight(fret);
    // Minimum width per fret to ensure dots and frets remain legible even on smaller viewports
    const minWidth = Math.max(26, Math.round(28 * (zoomRange === 'open' ? 1.4 : zoomRange === 'mid' ? 1.15 : 0.85)));
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
    setTimeout(() => setIsAddedFeedback(false), 1200);

    confetti({
      particleCount: 20,
      spread: 40,
      origin: { y: 0.8 },
      colors: ['#d97706', '#10b981', '#f59e0b'],
    });
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

  // Vertical Resizing Pointer Drag Handler (Neck String Height)
  const handlePointerDownVerticalResize = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingVerticalResize(true);
    dragStartYRef.current = e.clientY;
    startHeightRef.current = neckStringHeight;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - dragStartYRef.current;
      const newHeight = startHeightRef.current + deltaY * 0.4;
      setNeckStringHeight(newHeight);
    };

    const handlePointerUp = () => {
      setIsDraggingVerticalResize(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Horizontal Resizing Pointer Drag Handler (Neck Width Stretch)
  const handlePointerDownHorizontalResize = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingHorizontalResize(true);
    dragStartXRef.current = e.clientX;
    startStretchRef.current = neckHorizontalStretch;

    const containerWidth = scrollContainerRef.current?.clientWidth || 1000;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - dragStartXRef.current;
      const newStretch = startStretchRef.current + deltaX / (containerWidth * 0.7);
      setNeckHorizontalStretch(newStretch);
    };

    const handlePointerUp = () => {
      setIsDraggingHorizontalResize(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Dot dimensions scaled proportionally with string height
  const dotSize = Math.max(18, Math.min(36, Math.round(neckStringHeight * 0.65)));
  const dotFontSize = Math.max(9, Math.min(13, Math.round(neckStringHeight * 0.32)));

  return (
    <div className="w-full bg-[#14110e] border border-[#2e261f] rounded-2xl shadow-2xl flex flex-col select-none overflow-hidden">
      {/* 1. GUITAR FRETBOARD NECK */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto select-none bg-[#0e0c0a] border-b border-[#241e18] px-2 py-2"
      >
        <div
          className="relative px-1 transition-[width] duration-75"
          style={{
            width: neckHorizontalStretch > 1.0 ? `${Math.round(neckHorizontalStretch * 100)}%` : '100%',
            minWidth: '100%',
          }}
        >
          {/* Fret Numbers on Top: Spans full width, matching fret cells below */}
          <div className="flex items-center w-full mb-1">
            {/* Left spacer matching 112px (w-28) string header */}
            <div className="w-28 shrink-0 flex items-center justify-end pr-3">
              <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-[#8a7c6e]">
                Fret:
              </span>
            </div>

            {/* Fret numbers spanning 100% width */}
            <div className="flex items-center flex-1 min-w-0">
              {visibleFrets.map((fret) => (
                <div
                  key={`num-top-${fret}`}
                  style={getFretStyle(fret)}
                  className="text-center text-[10px] font-mono font-bold text-[#8a7c6e] select-none"
                >
                  {fret === 0 ? 'NUT' : fret}
                </div>
              ))}
            </div>

            {/* Right spacer matching the 16px (w-4) horizontal drag handle */}
            <div className="w-4 shrink-0" />
          </div>

          {/* Wooden Fretboard Body with Inlays & 6 Strings + Right Resize Handle */}
          <div className="relative rounded-xl fretboard-wood border border-[#3d2e20] overflow-hidden shadow-2xl flex">
            {/* Neck fretboard area */}
            <div className="flex-1 min-w-0 flex flex-col relative">
              {/* Mother-of-Pearl Inlays: Single dots at 3,5,7,9,15,17,19,21; Double dots at 12 */}
              <div className="absolute inset-0 pointer-events-none flex w-full">
                <div className="w-28 shrink-0" />
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
                          <div className="w-3 h-3 rounded-full pearl-inlay" />
                        )}
                        {isDouble && (
                          <div className="h-full flex flex-col justify-around py-3">
                            <div className="w-2.5 h-2.5 rounded-full pearl-inlay" />
                            <div className="w-2.5 h-2.5 rounded-full pearl-inlay" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6 Horizontal Strings with Dynamic Height */}
              {displayStrings.map((stringConfig) => {
                const stringIdx = stringConfig.index;
                const currentFret = currentFretboard[stringIdx];
                const isMuted = currentFret === null;
                const isOpen = currentFret === 0;
                const tunedPitch = tuningNotes[stringIdx] || stringConfig.name;

                return (
                  <div
                    key={`str-row-${stringIdx}`}
                    style={{ height: `${neckStringHeight}px` }}
                    className="flex items-center relative group/row hover:bg-white/[0.015] transition-colors w-full"
                  >
                    {/* String Header on Left: Shows tuned note & ▲ / ▼ tuning adjustments */}
                    <div className="w-28 shrink-0 flex items-center justify-between pr-2 pl-2 z-20 bg-[#16120e]/95 border-r border-[#2d241c]">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleStringOpenMute(stringIdx)}
                          className="font-mono text-xs font-bold text-[#ede5d8] hover:text-amber-400 transition-colors w-7 text-left"
                          title={`String ${stringIdx + 1} (${tunedPitch}). Click to toggle Open/Mute`}
                        >
                          {tunedPitch}
                        </button>

                        {/* Micro Tuning Pitch Adjusters (▲ / ▼) */}
                        <div className="flex flex-col gap-0.5 opacity-60 group-hover/row:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              tuneString(stringIdx, 1);
                            }}
                            className="w-3.5 h-2.5 flex items-center justify-center rounded bg-[#241e18] hover:bg-[#d97706] hover:text-black text-[#8a7c6e] text-[8px] font-bold leading-none"
                            title="Tune string UP by 1 semitone"
                          >
                            ▲
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              tuneString(stringIdx, -1);
                            }}
                            className="w-3.5 h-2.5 flex items-center justify-center rounded bg-[#241e18] hover:bg-[#d97706] hover:text-black text-[#8a7c6e] text-[8px] font-bold leading-none"
                            title="Tune string DOWN by 1 semitone"
                          >
                            ▼
                          </button>
                        </div>
                      </div>

                      {/* Mute/Open pill */}
                      <button
                        onClick={() => toggleStringOpenMute(stringIdx)}
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded transition-all ${
                          isMuted
                            ? 'bg-[#2b1614] text-red-400 border border-red-900/40'
                            : isOpen
                              ? 'bg-[#17261a] text-emerald-300 border border-emerald-800/40'
                              : 'bg-[#2d2218] text-amber-300 border border-amber-600/40'
                        }`}
                        title="Toggle Mute / Open"
                      >
                        {isMuted ? '✕' : isOpen ? '○' : `fr${currentFret}`}
                      </button>
                    </div>

                    {/* Fret Cells for this string */}
                    <div className="flex items-center flex-1 min-w-0 relative h-full">
                      {/* Guitar String Line */}
                      <div
                        className={`absolute left-0 right-0 pointer-events-none ${
                          isMuted ? 'opacity-25' : 'opacity-95'
                        }`}
                        style={{
                          height: `${Math.max(1, stringConfig.gauge * 0.75)}px`,
                          background: stringConfig.isWound
                            ? 'repeating-linear-gradient(90deg, #b8860b 0px, #8b5a2b 1px, #cd853f 2px)'
                            : 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 45%, #64748b 100%)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.85)',
                        }}
                      />

                      {/* Fret Cells */}
                      {visibleFrets.map((fret) => {
                        const isFretted = currentFret === fret;
                        const isNut = fret === 0;
                        const calculatedNote = getNoteForStringAndFret(stringIdx, fret, tuningNotes);
                        const isHovered =
                          hoveredCell?.stringIdx === stringIdx && hoveredCell?.fret === fret;

                        return (
                          <div
                            key={`cell-${stringIdx}-${fret}`}
                            style={getFretStyle(fret)}
                            onClick={() => {
                              if (isNut) {
                                toggleStringOpenMute(stringIdx);
                              } else {
                                setFret(stringIdx, fret);
                              }
                              if (calculatedNote) {
                                audioEngine.playNote(calculatedNote, '4n');
                              }
                            }}
                            onMouseEnter={() => setHoveredCell({ stringIdx, fret })}
                            onMouseLeave={() => setHoveredCell(null)}
                            className={`h-full relative flex items-center justify-center cursor-pointer ${
                              isNut
                                ? 'fret-nut'
                                : 'fret-wire hover:bg-amber-500/5'
                            }`}
                          >
                            {/* Active Finger Marker: Tortoiseshell/Brass Disc with Specular Ring */}
                            {isFretted && (
                              <div className="relative z-30 flex items-center justify-center">
                                <div
                                  style={{
                                    width: `${dotSize}px`,
                                    height: `${dotSize}px`,
                                    fontSize: `${dotFontSize}px`,
                                  }}
                                  className="rounded-full bg-gradient-to-tr from-[#b45309] to-[#fbbf24] text-[#0f0e0c] font-black font-mono flex items-center justify-center shadow-lg shadow-amber-950/80 border border-[#fffdfa] ring-2 ring-[#d97706] glow-active-fret"
                                >
                                  {isNut ? 'O' : calculatedNote}
                                </div>
                              </div>
                            )}

                            {/* Hover Ghost Dot */}
                            {!isFretted && isHovered && (
                              <div className="relative z-20 flex items-center justify-center opacity-70">
                                <div
                                  style={{
                                    width: `${Math.round(dotSize * 0.85)}px`,
                                    height: `${Math.round(dotSize * 0.85)}px`,
                                    fontSize: `${Math.max(8, dotFontSize - 1)}px`,
                                  }}
                                  className="rounded-full bg-[#2b221a] text-amber-300 font-mono flex items-center justify-center border border-amber-500/40"
                                >
                                  {isNut ? '0' : calculatedNote}
                                </div>
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

            {/* Right: Tactile Vertical Drag Handle to Stretch Horizontally */}
            <div
              onPointerDown={handlePointerDownHorizontalResize}
              onDoubleClick={() => setNeckHorizontalStretch(1.0)}
              className={`w-4 shrink-0 bg-[#16120e] hover:bg-[#2b221a] border-l border-[#2e261f] flex items-center justify-center cursor-col-resize select-none transition-colors group/colres z-30 ${
                isDraggingHorizontalResize ? 'bg-[#3b2d1e] border-amber-500' : ''
              }`}
              title="Click and drag right to stretch guitar neck horizontally • Double-click to reset (Fit 100%)"
            >
              <GripVertical className="w-3.5 h-3.5 text-[#6b5d50] group-hover/colres:text-amber-400 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONTROLS & DETECTION TOOLBAR (BELOW the neck) */}
      <div className="px-3.5 py-2.5 bg-[#120f0d] flex flex-wrap items-center justify-between gap-3 text-xs border-t border-[#241e18]">
        {/* Left: Real-time Detected Chord & Notes */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9c8e7e] font-medium">Mapped Chord:</span>
            <span className="text-base sm:text-lg font-black text-[#f5ede0] font-serif tracking-tight bg-[#1a1612] px-3 py-0.5 rounded-lg border border-[#382d22]">
              {detectedChord ? detectedChord.name : 'None (Touch fretboard)'}
            </span>
            {detectedChord?.type && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1c1814] text-[#b8a998] border border-[#2f271f] hidden sm:inline">
                {detectedChord.type}
              </span>
            )}
          </div>

          {/* Voiced Notes pills */}
          {detectedChord && detectedChord.notes.length > 0 && (
            <div className="hidden md:flex items-center gap-1">
              {detectedChord.notes.map((note, idx) => (
                <button
                  key={`n-${note}-${idx}`}
                  onClick={() => audioEngine.playNote(note)}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1c1713] text-amber-300 border border-[#2f251c] hover:border-amber-500/50"
                  title="Click to play note"
                >
                  {note}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center / Right: Tuning Selector, Strum, Add to Progression, Presets, Clear, Zoom & Stretch */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tuning Preset Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsTuningOpen(!isTuningOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1a1612] hover:bg-[#261f18] text-[#d6c7b6] border border-[#2f251c] text-xs font-semibold"
              title="Change guitar tuning preset"
            >
              <Sliders className="w-3 h-3 text-amber-500" />
              <span>Tuning: <strong className="text-amber-300 font-mono">{tuningName}</strong></span>
              <ChevronDown className="w-3 h-3 text-[#7d7063]" />
            </button>

            {isTuningOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-[#16120e] border border-[#3d3124] rounded-xl shadow-2xl py-1 z-50 max-h-64 overflow-y-auto">
                <div className="px-3 py-1 text-[9px] uppercase font-bold text-[#8a7c6e] border-b border-[#241e18]">
                  Select Guitar Tuning
                </div>
                {TUNING_PRESETS.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => {
                      setTuning(t.name, t.notes);
                      setIsTuningOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex flex-col hover:bg-amber-500/10 transition-colors ${
                      tuningName === t.name ? 'bg-amber-500/15 text-amber-300 font-bold' : 'text-[#c7baa8]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{t.name}</span>
                      <span className="text-[10px] font-mono text-[#8a7c6e]">{t.notes.join(' ')}</span>
                    </div>
                    {t.description && (
                      <span className="text-[9px] text-[#786c5e] mt-0.5">{t.description}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Strum Voicing Button */}
          <button
            onClick={handleStrum}
            disabled={!detectedChord || detectedChord.notes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1612] hover:bg-[#261f18] text-[#ede5d8] border border-[#2f251c] text-xs font-semibold transition-all disabled:opacity-40"
          >
            <Play className="w-3 h-3 fill-current text-emerald-400" />
            <span>Strum</span>
          </button>

          {/* Add to Progression Button */}
          <button
            onClick={handleAddProgression}
            disabled={!detectedChord || detectedChord.notes.length === 0}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
              isAddedFeedback
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                : 'bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#f59e0b] hover:to-[#d97706] text-[#0f0e0c] shadow-amber-950/40 disabled:opacity-40'
            }`}
          >
            {isAddedFeedback ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added!</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Progression</span>
              </>
            )}
          </button>

          {/* Presets Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsPresetsOpen(!isPresetsOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1a1612] hover:bg-[#261f18] text-[#d6c7b6] border border-[#2f251c] text-xs font-semibold"
            >
              <Bookmark className="w-3 h-3 text-amber-500" />
              <span>Voicings</span>
              <ChevronDown className="w-3 h-3 text-[#7d7063]" />
            </button>

            {isPresetsOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#16120e] border border-[#3d3124] rounded-xl shadow-2xl py-1 z-50 max-h-56 overflow-y-auto">
                <div className="px-3 py-1 text-[9px] uppercase font-bold text-[#8a7c6e]">
                  Select Voicing Preset
                </div>
                {PRESET_CHORDS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => handleSelectPreset(p)}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#c7baa8] hover:text-white hover:bg-amber-500/15 flex items-center justify-between"
                  >
                    <span>{p.name}</span>
                    <span className="text-[9px] text-[#786c5e]">{p.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear Neck */}
          <button
            onClick={clearFretboard}
            className="p-1.5 rounded-lg bg-[#1a1612] hover:bg-red-950/40 text-[#8a7c6e] hover:text-red-400 border border-[#2f251c]"
            title="Clear fretboard"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Fret Zoom & Horizontal Stretch Span Controls */}
          <div className="flex items-center gap-1.5">
            {/* Fret Range Filter (0-7, 0-13, 0-22) */}
            <div className="flex items-center bg-[#0d0b09] p-0.5 rounded-lg border border-[#261f19] text-[10px]">
              <span className="text-[9px] font-mono text-[#6e6255] px-1.5 hidden md:inline">Frets:</span>
              <button
                onClick={() => setZoomRange('open')}
                className={`px-2 py-0.5 rounded transition-all ${
                  zoomRange === 'open' ? 'bg-[#d97706] text-[#0f0e0c] font-bold shadow-sm' : 'text-[#8a7c6e] hover:text-white'
                }`}
                title="Frets 0 to 7 (Spans 100% width)"
              >
                0–7
              </button>
              <button
                onClick={() => setZoomRange('mid')}
                className={`px-2 py-0.5 rounded transition-all ${
                  zoomRange === 'mid' ? 'bg-[#d97706] text-[#0f0e0c] font-bold shadow-sm' : 'text-[#8a7c6e] hover:text-white'
                }`}
                title="Frets 0 to 13 (Spans 100% width)"
              >
                0–13
              </button>
              <button
                onClick={() => setZoomRange('full')}
                className={`px-2 py-0.5 rounded transition-all ${
                  zoomRange === 'full' ? 'bg-[#d97706] text-[#0f0e0c] font-bold shadow-sm' : 'text-[#8a7c6e] hover:text-white'
                }`}
                title="Frets 0 to 22 (Spans 100% width)"
              >
                0–22
              </button>
            </div>

            {/* Horizontal Stretch Span Presets */}
            <div className="flex items-center bg-[#0d0b09] p-0.5 rounded-lg border border-[#261f19] text-[10px] gap-1">
              <span className="text-[9px] font-mono text-[#6e6255] pl-1.5 pr-0.5 hidden xl:inline flex items-center gap-1">
                <Maximize2 className="w-2.5 h-2.5 text-amber-500" />
                <span>Span:</span>
              </span>
              <button
                onClick={() => setNeckHorizontalStretch(1.0)}
                className={`px-2 py-0.5 rounded transition-all ${
                  neckHorizontalStretch <= 1.05
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                    : 'text-[#8a7c6e] hover:text-white'
                }`}
                title="Fit 100% width (Takes up the whole left-to-right span)"
              >
                Fit (100%)
              </button>
              <button
                onClick={() => setNeckHorizontalStretch(1.35)}
                className={`px-2 py-0.5 rounded transition-all ${
                  neckHorizontalStretch > 1.15 && neckHorizontalStretch <= 1.5
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                    : 'text-[#8a7c6e] hover:text-white'
                }`}
                title="Stretch wide (135% width)"
              >
                Wide
              </button>
              <button
                onClick={() => setNeckHorizontalStretch(1.75)}
                className={`px-2 py-0.5 rounded transition-all ${
                  neckHorizontalStretch > 1.5
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                    : 'text-[#8a7c6e] hover:text-white'
                }`}
                title="Stretch ultra wide (175% width)"
              >
                Ultra
              </button>

              {/* Slider for fine tuning */}
              <div className="hidden lg:flex items-center gap-1 pl-1 pr-1 border-l border-[#241e18]">
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.05"
                  value={neckHorizontalStretch}
                  onChange={(e) => setNeckHorizontalStretch(parseFloat(e.target.value))}
                  className="w-14 h-1 accent-amber-500 cursor-pointer bg-[#241e18] rounded"
                  title={`Stretch width: ${Math.round(neckHorizontalStretch * 100)}%`}
                />
                <span className="text-[9px] font-mono text-amber-300/80 w-7 text-right">
                  {Math.round(neckHorizontalStretch * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TACTILE RESIZE HANDLE BAR: Drag down to make guitar neck bigger */}
      <div
        onPointerDown={handlePointerDownVerticalResize}
        onDoubleClick={() => setNeckStringHeight(32)}
        className={`w-full py-1 bg-[#0e0c0a] hover:bg-[#1a1612] border-t border-[#241e18] flex items-center justify-center cursor-row-resize transition-all group select-none ${
          isDraggingVerticalResize ? 'bg-[#2b221a] border-amber-500/60' : ''
        }`}
        title="Click and drag down to enlarge guitar neck • Double-click to reset"
      >
        <div className="flex items-center gap-2 text-[10px] text-[#736556] group-hover:text-amber-400 font-medium font-mono">
          <GripHorizontal className="w-4 h-4 text-[#736556] group-hover:text-amber-400 transition-colors" />
          <span className="opacity-70 group-hover:opacity-100 transition-opacity">
            Drag down to resize height ({neckStringHeight}px) • Right-edge handle to stretch width ({Math.round(neckHorizontalStretch * 100)}%)
          </span>
        </div>
      </div>
    </div>
  );
};
