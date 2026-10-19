import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { audioEngine } from '../services/audioEngine';
import { PRESET_PROGRESSIONS, getVoicedNotes } from '../utils/guitarTheory';
import {
  Bookmark,
  BookmarkPlus,
  Trash2,
  Play,
  Square,
  Music,
  Check,
  X,
  Clock,
  Sparkles,
  Download,
  Upload,
  FileText,
  Search,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SavedProgressionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'save' | 'library';
}

export const SavedProgressionsModal: React.FC<SavedProgressionsModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'library',
}) => {
  const {
    progression,
    playback,
    tuningNotes,
    savedProgressions,
    saveCurrentProgression,
    loadSavedProgression,
    deleteSavedProgression,
    importSavedProgressions,
    loadPresetProgression,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'save' | 'my-presets' | 'factory'>(
    initialMode === 'save' ? 'save' : 'my-presets'
  );

  // Save form fields
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Audio preview state
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const previewTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Import modal toggle
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // Reset or initialize default name when opening in 'save' mode
  useEffect(() => {
    if (isOpen) {
      if (initialMode === 'save') {
        setActiveTab('save');
        const defaultTitle =
          progression.length > 0
            ? progression.map((c) => c.name.split(' ')[0]).join(' - ')
            : 'My Progression';
        setSaveName(defaultTitle);
        setSaveDescription('');
      } else {
        setActiveTab(savedProgressions.length > 0 ? 'my-presets' : 'factory');
      }
      setSavedSuccessMessage(null);
    }
    stopPreview();
  }, [isOpen, initialMode, progression]);

  const stopPreview = () => {
    previewTimeoutsRef.current.forEach((t) => clearTimeout(t));
    previewTimeoutsRef.current = [];
    setPreviewingId(null);
  };

  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, []);

  if (!isOpen) return null;

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (progression.length === 0) return;

    const res = saveCurrentProgression(saveName, saveDescription);
    if (res) {
      setSavedSuccessMessage(`Saved "${res.name}" to your preset library!`);
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6'],
      });
      setTimeout(() => {
        setSavedSuccessMessage(null);
        setActiveTab('my-presets');
      }, 900);
    }
  };

  // Preview an array of chord notes sequentially
  const handlePreviewProgression = (id: string, chords: { notes: string[] }[]) => {
    if (previewingId === id) {
      stopPreview();
      return;
    }

    stopPreview();
    setPreviewingId(id);

    const stepMs = 650;
    chords.forEach((chord, idx) => {
      const t = setTimeout(() => {
        audioEngine.playStrum(chord.notes);
        if (idx === chords.length - 1) {
          const finishTimeout = setTimeout(() => {
            setPreviewingId(null);
          }, stepMs);
          previewTimeoutsRef.current.push(finishTimeout);
        }
      }, idx * stepMs);
      previewTimeoutsRef.current.push(t);
    });
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedProgressions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `fretmind_progressions_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportSubmit = () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('Imported data must be an array of progressions.');
      }
      importSavedProgressions(parsed);
      setIsImportOpen(false);
      setImportJsonText('');
      setActiveTab('my-presets');
    } catch (err: any) {
      setImportError(err.message || 'Invalid JSON format.');
    }
  };

  const filteredSaved = savedProgressions.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      p.chords.some((c) => c.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#14110e] border border-[#2e261f] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#28211a] flex items-center justify-between bg-[#100d0a]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#261f18] text-amber-400 border border-[#3d3126]">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#f5ede0] font-serif tracking-tight m-0">
                Progression Presets & Library
              </h3>
              <p className="text-xs text-[#a69787] m-0">
                Save your chord progressions, load factory presets, and manage custom voicings
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopPreview();
              onClose();
            }}
            className="p-1.5 rounded-lg text-[#8a7c6e] hover:text-white hover:bg-[#241e18] transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-4 pt-3 bg-[#0e0c0a] border-b border-[#241e18] text-xs font-semibold">
          <button
            onClick={() => {
              stopPreview();
              setActiveTab('save');
            }}
            disabled={progression.length === 0}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all disabled:opacity-30 ${
              activeTab === 'save'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-[#8a7c6e] hover:text-[#d1c6b8]'
            }`}
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Save Current ({progression.length})</span>
          </button>

          <button
            onClick={() => {
              stopPreview();
              setActiveTab('my-presets');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all ${
              activeTab === 'my-presets'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-[#8a7c6e] hover:text-[#d1c6b8]'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>My Presets ({savedProgressions.length})</span>
          </button>

          <button
            onClick={() => {
              stopPreview();
              setActiveTab('factory');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all ${
              activeTab === 'factory'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Factory Library ({PRESET_PROGRESSIONS.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-scrollbar">
          {/* TAB 1: SAVE CURRENT PROGRESSION */}
          {activeTab === 'save' && (
            <form onSubmit={handleSaveSubmit} className="space-y-4">
              {savedSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{savedSuccessMessage}</span>
                </div>
              )}

              {/* Chords to be saved preview */}
              <div className="p-3 rounded-xl bg-[#0a0c13] border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                  Chords In Current Progression ({progression.length}):
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {progression.map((c, i) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-xs font-mono font-bold text-amber-300 shadow-sm"
                    >
                      <span className="text-[10px] text-slate-500 font-sans font-semibold">#{i + 1}</span>
                      <span>{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Preset Name *</span>
                  <span className="text-[10px] text-slate-500 font-normal">e.g. Neo-Soul Groove, Chorus Hook</span>
                </label>
                <input
                  type="text"
                  required
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Enter preset title..."
                  className="w-full bg-[#0a0c13] border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Notes / Description (Optional)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Tuning, feel, mood, tempo</span>
                </label>
                <textarea
                  rows={2}
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Add notes about musical style, feel, or key..."
                  className="w-full bg-[#0a0c13] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              {/* Playback Tempo info */}
              <div className="flex items-center gap-4 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500 font-medium">Saved BPM: </span>
                  <strong className="text-slate-200 font-mono">{playback.bpm}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Beats per chord: </span>
                  <strong className="text-slate-200 font-mono">{playback.beatsPerChord}</strong>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('my-presets')}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
                >
                  <Bookmark className="w-3.5 h-3.5 fill-current" />
                  <span>Save Progression</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MY SAVED PRESETS */}
          {activeTab === 'my-presets' && (
            <div className="space-y-3">
              {/* Header Bar with Search & Import/Export */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search saved progressions..."
                    className="w-full bg-[#0a0c13] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    onClick={handleExportJson}
                    disabled={savedProgressions.length === 0}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium disabled:opacity-40"
                    title="Export presets as JSON backup"
                  >
                    <Download className="w-3 h-3 text-amber-400" />
                    <span>Export</span>
                  </button>
                  <button
                    onClick={() => setIsImportOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                    title="Import presets from JSON"
                  >
                    <Upload className="w-3 h-3 text-emerald-400" />
                    <span>Import</span>
                  </button>
                </div>
              </div>

              {/* Empty State */}
              {savedProgressions.length === 0 ? (
                <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center bg-[#0a0c13]/50">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-300 font-bold text-sm mb-1">No Saved Progressions Yet</p>
                  <p className="text-slate-500 text-xs mb-4 max-w-sm mx-auto">
                    Create a chord sequence on the guitar neck and click "Save Current" to keep your ideas organized for future sessions!
                  </p>
                  {progression.length > 0 && (
                    <button
                      onClick={() => setActiveTab('save')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>Save Current Progression ({progression.length} chords)</span>
                    </button>
                  )}
                </div>
              ) : filteredSaved.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No saved progressions match "{searchQuery}".
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredSaved.map((item) => {
                    const isPreviewing = previewingId === item.id;
                    const dateFormatted = new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-[#0a0c13] border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white tracking-tight m-0">
                              {item.name}
                            </h4>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {item.chords.length} chords
                            </span>
                            {item.bpm && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/60 text-emerald-400 border border-slate-800">
                                {item.bpm} BPM
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {dateFormatted}
                            </span>
                          </div>

                          {/* Chords preview strip */}
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            {item.chords.map((c, idx) => (
                              <span
                                key={`c-${c.name}-${idx}`}
                                className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#131724] text-amber-300/90 border border-slate-800"
                              >
                                {c.name}
                              </span>
                            ))}
                          </div>

                          {item.description && (
                            <p className="text-[11px] text-slate-400 italic m-0 pt-0.5 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Play Preview */}
                          <button
                            onClick={() => handlePreviewProgression(item.id, item.chords)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isPreviewing
                                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                            title={isPreviewing ? 'Stop preview' : 'Preview audio sequence'}
                          >
                            {isPreviewing ? (
                              <>
                                <Square className="w-3 h-3 fill-current" />
                                <span>Stop</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 fill-current text-emerald-400" />
                                <span>Preview</span>
                              </>
                            )}
                          </button>

                          {/* Load button */}
                          <button
                            onClick={() => {
                              stopPreview();
                              loadSavedProgression(item.id);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all"
                            title="Load this progression into timeline"
                          >
                            <span>Load</span>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (confirm(`Delete preset "${item.name}"?`)) {
                                deleteSavedProgression(item.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                            title="Delete preset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FACTORY LIBRARY */}
          {activeTab === 'factory' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 mb-2">
                Handcrafted iconic chord progressions across rock, jazz, pop, and modal genres.
              </div>

              <div className="space-y-2.5">
                {PRESET_PROGRESSIONS.map((preset, idx) => {
                  const isPreviewing = previewingId === `factory-${idx}`;

                  return (
                    <div
                      key={preset.title}
                      className="p-3 rounded-xl bg-[#0a0c13] border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white tracking-tight m-0">
                            {preset.title}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                            {preset.genre}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 m-0 line-clamp-2">
                          {preset.description}
                        </p>

                        {/* Chord pills */}
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {preset.chords.map((c, cIdx) => (
                            <span
                              key={`fact-${c.name}-${cIdx}`}
                              className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#131724] text-amber-300/90 border border-slate-800"
                            >
                              {c.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Preview */}
                        <button
                          onClick={() => {
                            const previewChords = preset.chords.map((c) => ({
                              notes: getVoicedNotes(c.frets, tuningNotes),
                            }));
                            handlePreviewProgression(`factory-${idx}`, previewChords);
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isPreviewing
                              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                          title={isPreviewing ? 'Stop preview' : 'Preview audio sequence'}
                        >
                          {isPreviewing ? (
                            <>
                              <Square className="w-3 h-3 fill-current" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current text-emerald-400" />
                              <span>Preview</span>
                            </>
                          )}
                        </button>

                        {/* Load button */}
                        <button
                          onClick={() => {
                            stopPreview();
                            loadPresetProgression(idx);
                            onClose();
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all"
                        >
                          <span>Load Preset</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#0b0e17] border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>All saved progressions are automatically persisted locally in your browser.</span>
          <button
            onClick={() => {
              stopPreview();
              onClose();
            }}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
          >
            Close
          </button>
        </div>
      </div>

      {/* SUB-MODAL: IMPORT JSON */}
      {isImportOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#121624] border border-slate-700 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Import Progressions JSON</span>
              </h4>
              <button
                onClick={() => setIsImportOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Paste a JSON array of exported FretMind progressions to merge them into your library:
            </p>

            <textarea
              rows={6}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Paste JSON here..."
              className="w-full bg-[#0a0c13] border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
            />

            {importError && (
              <div className="text-xs text-red-400 font-medium">{importError}</div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setIsImportOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                disabled={!importJsonText.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs disabled:opacity-40"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
