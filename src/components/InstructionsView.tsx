import React from 'react';
import { useStore } from '../store/useStore';
import {
  Compass,
  ArrowRight,
  Guitar,
  Play,
  Sparkles,
  Bookmark,
  ShieldCheck,
} from 'lucide-react';

export const InstructionsView: React.FC = () => {
  const { setActiveView, setKeyModalOpen, apiKey } = useStore();

  const sections = [
    {
      num: '01',
      icon: Guitar,
      title: 'Fretboard',
      items: [
        'Click any fret cell to fret or un-fret a note.',
        'Click the Nut or string badge to toggle Open and Muted.',
        'Choose alternate tunings from the tuning menu.',
        'Audition the chord with Strum or tap individual note chips.',
      ],
    },
    {
      num: '02',
      icon: Play,
      title: 'Timeline',
      items: [
        'Add the current voicing to the timeline with Add to Progression.',
        'Assign chords to song sections to track modal shifts.',
        'Play in rhythm, set tempo, and toggle loop.',
        'Reorder chords with arrows, or click To Neck to reload any chord.',
      ],
    },
    {
      num: '03',
      icon: Sparkles,
      title: 'Harmonic AI',
      items: [
        'Automatic key detection and chord movement breakdown.',
        'Filter suggestions by style, borrowing, or jazz substitutions.',
        'Flip through alternate fretboard shapes for any suggestion.',
        'Use Ask AI Producer for soloing scales and transitions.',
      ],
    },
    {
      num: '04',
      icon: Bookmark,
      title: 'Presets & Privacy',
      items: [
        'Save progressions locally or browse the preset library.',
        'Backup and restore chord sequences via JSON export/import.',
        'Gemini API key is stored strictly in your browser local storage.',
      ],
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-200 select-none">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-medium mb-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>Studio Reference</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#f2f2f5] font-display tracking-tight m-0">
            FretMind Guide
          </h1>
        </div>

        <button
          onClick={() => setActiveView('studio')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all active:scale-95 shadow-sm"
        >
          <span>Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Streamlined Linear Workflow (Minimal, Direct) */}
      <div className="space-y-6">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <div
              key={sec.num}
              className="flex items-start gap-4 pb-6 border-b border-white/[0.05] last:border-b-0"
            >
              <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-xs font-mono font-bold text-amber-400 shrink-0 mt-0.5">
                {sec.num}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-amber-400/80" />
                  <h2 className="text-sm font-bold text-[#f2f2f5] font-display m-0 tracking-tight">
                    {sec.title}
                  </h2>
                </div>

                <ul className="space-y-1.5 m-0 p-0 list-none">
                  {sec.items.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-[#a4a4b0] flex items-baseline gap-2 leading-relaxed"
                    >
                      <span className="w-1 h-1 rounded-full bg-amber-400/60 shrink-0 translate-y-[-2px]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Minimal Status Strip */}
      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-[#8e8e98]">
            Gemini AI:{' '}
            <strong className="text-[#f2f2f5] font-medium">
              {apiKey ? 'Connected' : 'Offline Engine'}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!apiKey && (
            <button
              onClick={() => setKeyModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 font-semibold underline text-xs"
            >
              Connect Key
            </button>
          )}
          <button
            onClick={() => setActiveView('studio')}
            className="text-[#a4a4b0] hover:text-[#f2f2f5] transition-colors text-xs font-medium"
          >
            Back to Studio →
          </button>
        </div>
      </div>
    </div>
  );
};
