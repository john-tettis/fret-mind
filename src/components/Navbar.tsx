import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { audioEngine } from '../services/audioEngine';
import {
  Key,
  Volume2,
  VolumeX,
  BookOpen,
  Guitar,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { apiKey, setKeyModalOpen, activeView, setActiveView } = useStore();
  const [isMuted, setIsMuted] = useState(false);
  const [toneMode, setToneMode] = useState<'clean' | 'warm' | 'overdrive'>('clean');

  const toggleMute = () => {
    if (isMuted) {
      audioEngine.setVolume(0);
      setIsMuted(false);
    } else {
      audioEngine.setVolume(-100);
      setIsMuted(true);
    }
  };

  const handleToneChange = (mode: 'clean' | 'warm' | 'overdrive') => {
    setToneMode(mode);
    audioEngine.setToneMode(mode);
  };

  return (
    <header className="border-b border-white/[0.07] bg-[#121216]/90 backdrop-blur-xl px-4 lg:px-6 py-2.5 relative z-20 select-none transition-all">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Clean Brand & View Switcher */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2.5 group cursor-default">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)] transition-transform group-hover:scale-105 duration-200">
              <Guitar className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-[#f2f2f5] font-display flex items-center gap-1.5">
                FretMind
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium">v4</span>
              </span>
            </div>
          </div>

          {/* Clean Segmented Tabs */}
          <nav className="flex items-center bg-[#19191e] p-0.5 rounded-lg border border-white/[0.08] shadow-inner">
            <button
              onClick={() => setActiveView('studio')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 active:scale-95 cursor-pointer ${
                activeView === 'studio'
                  ? 'bg-[#272730] text-[#f2f2f5] shadow-sm font-semibold border border-white/[0.05]'
                  : 'text-[#8e8e98] hover:text-[#e0e0e6]'
              }`}
            >
              <span>Studio</span>
            </button>
            <button
              onClick={() => setActiveView('instructions')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 active:scale-95 cursor-pointer ${
                activeView === 'instructions'
                  ? 'bg-[#272730] text-[#f2f2f5] shadow-sm font-semibold border border-white/[0.05]'
                  : 'text-[#8e8e98] hover:text-[#e0e0e6]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 opacity-70" />
              <span>Guide</span>
            </button>
          </nav>
        </div>

        {/* Right Controls: Amp Tone, Audio Mute & BYOK Key */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Subtle Amp Tone Selector */}
          <div className="hidden sm:flex items-center bg-[#19191e] rounded-lg border border-white/[0.08] p-0.5 text-xs shadow-inner">
            {(['clean', 'warm', 'overdrive'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => handleToneChange(mode)}
                className={`px-2.5 py-0.5 rounded capitalize text-[11px] transition-all duration-150 ${
                  toneMode === mode
                    ? 'bg-[#272730] text-amber-300 font-semibold shadow-sm border border-amber-500/20'
                    : 'text-[#84848e] hover:text-[#d0d0d8]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Mute button */}
          <button
            onClick={toggleMute}
            className={`p-1.5 rounded-lg border transition-all duration-150 ${
              isMuted
                ? 'bg-rose-950/40 border-rose-800/50 text-rose-300 shadow-[0_0_10px_-2px_rgba(244,63,94,0.3)]'
                : 'bg-[#19191e] border-white/[0.08] text-[#8e8e98] hover:text-[#f0f0f5] hover:border-white/[0.15]'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Clean BYOK Key Status */}
          <button
            onClick={() => setKeyModalOpen(true)}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs transition-all duration-150 ${
              apiKey
                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300 hover:bg-emerald-900/30 hover:border-emerald-700/50'
                : 'bg-[#19191e] border-white/[0.08] text-[#a4a4b0] hover:text-[#f0f0f5] hover:border-white/[0.15]'
            }`}
          >
            <Key className="w-3.5 h-3.5 opacity-75" />
            <span className="hidden sm:inline font-medium">
              {apiKey ? 'Gemini Active' : 'Connect Key'}
            </span>
            <span
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                apiKey
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};
