import React from 'react';
import { useStore } from '../store/useStore';
import {
  Compass,
  ArrowRight,
  GripHorizontal,
  GripVertical,
  Sparkles,
  Guitar,
} from 'lucide-react';

export const InstructionsView: React.FC = () => {
  const { setActiveView, setKeyModalOpen, apiKey } = useStore();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="border border-[#27272c] bg-[#18181b] rounded-xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#222227] text-amber-300 text-xs font-mono font-medium">
              <Compass className="w-3.5 h-3.5" />
              <span>Studio Guide</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#f2f2f4] tracking-tight m-0">
              FretMind Studio Guide
            </h2>
            <p className="text-sm text-[#b8a998] max-w-2xl leading-relaxed m-0">
              An interactive visual environment for guitarists, songwriters, and producers to explore
              unconventional voice-leading, modal borrowing, and AI-assisted harmonic movement.
            </p>
          </div>

          <button
            onClick={() => setActiveView('studio')}
            className="self-start sm:self-center inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#f59e0b] hover:to-[#d97706] text-[#0f0e0c] font-black text-xs tracking-wider uppercase shadow-xl shadow-amber-950/40 transition-all group shrink-0"
          >
            <span>Open Studio</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Guide Grid: 6 Modular Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: The Fretboard */}
        <div className="border border-[#2e2720] bg-[#161310] rounded-2xl p-6 space-y-4 shadow-xl hover:border-[#473b30] transition-colors flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#26201a] border border-[#3d3227] text-amber-400 flex items-center justify-center font-black">
                1
              </div>
              <h3 className="text-lg font-bold text-[#ede5d8] font-serif m-0">
                The Interactive Fretboard
              </h3>
            </div>
            <p className="text-xs text-[#a89b8c] leading-relaxed m-0">
              Finger voicings intuitively across standard and alternate tunings with realistic acoustic geometry:
            </p>
            <ul className="space-y-2 text-xs text-[#d1c6b8]">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Placing Notes:</strong> Click any fret cell to fretted pitch. Click again to remove.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Open / Mute:</strong> Click the Nut (fret 0) or the string badge on the left to toggle between Open (<code className="text-amber-300">○</code>) and Muted (<code className="text-amber-300">✕</code>).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Custom Tunings:</strong> Choose from 9 presets (Drop D, DADGAD, Open G, Half-Step Down) or use the <code className="text-amber-300">▲</code> / <code className="text-amber-300">▼</code> buttons on any string header to adjust micro-pitch by semitones.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Card 2: Neck Resizing */}
        <div className="border border-[#2e2720] bg-[#161310] rounded-2xl p-6 space-y-4 shadow-xl hover:border-[#473b30] transition-colors flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#26201a] border border-[#3d3227] text-amber-400 flex items-center justify-center font-black">
                2
              </div>
              <h3 className="text-lg font-bold text-[#ede5d8] font-serif m-0">
                Tactile Sizing & Span
              </h3>
            </div>
            <p className="text-xs text-[#a89b8c] leading-relaxed m-0">
              Customize the physical scale of the guitar neck to suit your screen and posture:
            </p>
            <ul className="space-y-2 text-xs text-[#d1c6b8]">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Vertical String Height:</strong> Grab the tactile bar at the bottom with <GripHorizontal className="w-3 h-3 inline text-amber-400" /> and drag down to expand string spacing (26px to 58px). Double-click to reset.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Full Left-to-Right Span:</strong> When selecting <code className="text-amber-300">0–13</code> or <code className="text-amber-300">0–7</code>, frets automatically stretch to take up 100% of your screen width.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Horizontal Stretching:</strong> Drag the vertical handle on the right edge with <GripVertical className="w-3 h-3 inline text-amber-400" />, or select <code className="text-amber-300">Wide</code> / <code className="text-amber-300">Ultra</code> to expand horizontally with smooth scrolling.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Card 3: Progression Timeline */}
        <div className="border border-[#2e2720] bg-[#161310] rounded-2xl p-6 space-y-4 shadow-xl hover:border-[#473b30] transition-colors flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#26201a] border border-[#3d3227] text-amber-400 flex items-center justify-center font-black">
                3
              </div>
              <h3 className="text-lg font-bold text-[#ede5d8] font-serif m-0">
                Building & Playing Progressions
              </h3>
            </div>
            <p className="text-xs text-[#a89b8c] leading-relaxed m-0">
              Assemble your chord sequence step-by-step with synchronized audio playback:
            </p>
            <ul className="space-y-2 text-xs text-[#d1c6b8]">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Add to Progression:</strong> Map any chord and click "Add to Progression" to append it to your timeline.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Polyphonic Transport:</strong> Hit <code className="text-emerald-400">Play</code> to strum the sequence in real time using sampled guitar tones. Adjust tempo (40–240 BPM) and beats per chord (1 to 4).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Reorder & Audition:</strong> Use the <code className="text-amber-300">‹</code> and <code className="text-amber-300">›</code> arrows on each chord card to test different cadence orders. Click "To Neck" to load the chord back to the main fretboard.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Card 4: AI Harmonic Producer */}
        <div className="border border-[#2e2720] bg-[#161310] rounded-2xl p-6 space-y-4 shadow-xl hover:border-[#473b30] transition-colors flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#26201a] border border-[#3d3227] text-amber-400 flex items-center justify-center font-black">
                4
              </div>
              <h3 className="text-lg font-bold text-[#ede5d8] font-serif m-0">
                AI Harmonic Analysis & Recommendations
              </h3>
            </div>
            <p className="text-xs text-[#a89b8c] leading-relaxed m-0">
              Powered by Google Gemini 2.5 Flash / Pro via Bring-Your-Own-Key (BYOK):
            </p>
            <ul className="space-y-2 text-xs text-[#d1c6b8]">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Auto Mode:</strong> Gemini examines your chord intervals and voice leading to automatically classify the harmonic style (e.g., Modal Interchange, Neo-Soul 7ths, Chromatic Rock, or Diatonic).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Interactive Narrative Overview:</strong> Read a producer's harmonic breakdown. Click any highlighted chord in the text to hear it strummed and see its voicing immediately.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Suggested Next Chords:</strong> Ranked suggestions with theoretical functions (secondary dominants, modal borrow, tritone subs) that you can strum or add directly to your progression.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Card 5: Presets & Custom Library */}
        <div className="border border-[#2e2720] bg-[#161310] rounded-2xl p-6 space-y-4 shadow-xl hover:border-[#473b30] transition-colors flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#26201a] border border-[#3d3227] text-amber-400 flex items-center justify-center font-black">
                5
              </div>
              <h3 className="text-lg font-bold text-[#ede5d8] font-serif m-0">
                Saving Presets & Library
              </h3>
            </div>
            <p className="text-xs text-[#a89b8c] leading-relaxed m-0">
              Never lose a songwriting idea:
            </p>
            <ul className="space-y-2 text-xs text-[#d1c6b8]">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Save as Preset:</strong> Click "Save Preset" in the progression timeline to store your active progression with custom title and notes.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Live Audio Preview:</strong> Listen to any saved preset with the automated preview strum before deciding to load it.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Export / Import JSON:</strong> Download your entire preset collection as a backup file or paste JSON from a collaborator.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Card 6: BYOK Security */}
        <div className="border border-[#2e2720] bg-[#161310] rounded-2xl p-6 space-y-4 shadow-xl hover:border-[#473b30] transition-colors flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#26201a] border border-[#3d3227] text-amber-400 flex items-center justify-center font-black">
                6
              </div>
              <h3 className="text-lg font-bold text-[#ede5d8] font-serif m-0">
                Privacy & Google Gemini BYOK
              </h3>
            </div>
            <p className="text-xs text-[#a89b8c] leading-relaxed m-0">
              Zero backend proxies. Your key and creative data stay under your direct ownership:
            </p>
            <ul className="space-y-2 text-xs text-[#d1c6b8]">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Local Storage Only:</strong> Your Google AI Studio API key is kept in your browser's private local storage and never transmitted to any third-party server.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Offline Fallback:</strong> If you don't have a Gemini API key connected, FretMind seamlessly falls back to our deterministic music theory engine.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Status:</strong> {apiKey ? (
                    <span className="text-emerald-400 font-bold">API Key Connected</span>
                  ) : (
                    <button
                      onClick={() => setKeyModalOpen(true)}
                      className="text-amber-400 hover:text-amber-300 underline font-semibold"
                    >
                      Connect your Gemini Key
                    </button>
                  )}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Pro Tips Section */}
      <div className="border border-[#3d3328] bg-[#181512] rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-[#f2e9dc] uppercase tracking-wider font-mono flex items-center gap-2 m-0">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Songwriter Control Room Tips</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#c2b5a5]">
          <div className="p-3.5 rounded-xl bg-[#12100d] border border-[#2b241e]">
            <h4 className="font-bold text-amber-300 mb-1">Dorian Line Cliché</h4>
            <p className="m-0 leading-relaxed text-[#9e9081]">
              Try moving from a minor triad through augmented and major inversions over a pedal bass (e.g. <code className="text-amber-300">Em/B → Baug → G/B → A</code>) to recreate the classic Pink Floyd or James Bond sound.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#12100d] border border-[#2b241e]">
            <h4 className="font-bold text-amber-300 mb-1">Modal Interchange</h4>
            <p className="m-0 leading-relaxed text-[#9e9081]">
              Borrowing the minor subdominant (<code className="text-amber-300">iv</code>) in a major key (e.g., <code className="text-amber-300">Fm</code> in C Major) creates an unforgettable emotional pull back to tonic.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#12100d] border border-[#2b241e]">
            <h4 className="font-bold text-amber-300 mb-1">Alternate Tunings</h4>
            <p className="m-0 leading-relaxed text-[#9e9081]">
              Switch to <strong className="text-[#f5ede0]">DADGAD</strong> or <strong className="text-[#f5ede0]">Drop D</strong> in the Tuning menu. Open strings become resonant drone anchors while you finger melodic movements.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-center">
          <button
            onClick={() => setActiveView('studio')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#f59e0b] hover:to-[#d97706] text-[#0f0e0c] font-black text-xs tracking-wider uppercase shadow-xl shadow-amber-950/40 transition-all"
          >
            <Guitar className="w-4 h-4" />
            <span>Launch Guitar Studio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
