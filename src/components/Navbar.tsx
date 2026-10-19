import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { audioEngine } from '../services/audioEngine';
import {
  Key,
  Volume2,
  VolumeX,
  Sliders,
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
    <header className="border-b border-[#28221c] bg-[#120f0d] px-4 lg:px-8 py-2.5 relative z-20 select-none shadow-md">
      <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        {/* Left: Brand & View Navigation Tabs */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Brand Logo with Warm Luthier Pick Emblem */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#d97706] to-[#78350f] p-0.5 flex items-center justify-center shadow-lg shadow-amber-950/40 text-[#14110e]">
              <div className="w-full h-full bg-[#17130f] rounded-[10px] flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-5 h-5 fill-[#d4af37]">
                  <path d="M50 8 C72 8 92 28 82 66 C75 90 54 96 50 96 C46 96 25 90 18 66 C8 28 28 8 50 8 Z" />
                  <circle cx="50" cy="46" r="14" fill="#0f0d0a" />
                  <circle cx="50" cy="46" r="7" fill="#f59e0b" />
                </svg>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#f5ede0] m-0 font-serif">
                  FretMind
                </h1>
                <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#2b221a] text-[#d4af37] border border-[#423528]">
                  Studio
                </span>
              </div>
              <p className="text-[10px] text-[#9c8e7e] hidden sm:block tracking-wide font-mono">
                Interactive Fretboard • Sampled Guitar • Gemini Harmonic AI
              </p>
            </div>
          </div>

          {/* Primary View Switcher: Studio vs. Instructions */}
          <nav className="flex items-center bg-[#0d0b09] p-0.5 rounded-xl border border-[#2e261f]">
            <button
              onClick={() => setActiveView('studio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'studio'
                  ? 'bg-[#29221a] text-[#f5ede0] shadow-sm border border-[#473a2c]'
                  : 'text-[#8c7e70] hover:text-[#d1c6b8]'
              }`}
            >
              <Guitar className="w-3.5 h-3.5 text-amber-400" />
              <span>Studio</span>
            </button>
            <button
              onClick={() => setActiveView('instructions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'instructions'
                  ? 'bg-[#29221a] text-[#f5ede0] shadow-sm border border-[#473a2c]'
                  : 'text-[#8c7e70] hover:text-[#d1c6b8]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Field Guide</span>
            </button>
          </nav>
        </div>

        {/* Center Tone Selector: Vintage Outboard Preamp / Amp Modeling */}
        <div className="hidden md:flex items-center gap-1 bg-[#0d0b09] p-1 rounded-xl border border-[#2b231c] text-xs">
          <span className="text-[9px] uppercase font-mono tracking-wider text-[#8a7c6e] px-2 flex items-center gap-1.5">
            <Sliders className="w-3 h-3 text-amber-500" />
            Amp Tone:
          </span>
          {(['clean', 'warm', 'overdrive'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleToneChange(mode)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all flex items-center gap-1.5 ${
                toneMode === mode
                  ? 'bg-[#2b221a] text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-[#7d7063] hover:text-[#c4b7a7] hover:bg-[#1a1612]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  toneMode === mode ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : 'bg-[#3b3229]'
                }`}
              />
              <span>{mode}</span>
            </button>
          ))}
        </div>

        {/* Right Action Controls: Audio Mute & BYOK Key */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mute toggle */}
          <button
            onClick={toggleMute}
            className={`p-2 rounded-xl border transition-colors ${
              isMuted
                ? 'bg-[#2b1614] border-red-900/50 text-red-400'
                : 'bg-[#181410] border-[#2e261f] text-[#a69888] hover:text-white hover:border-[#473b30]'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* BYOK Key Status Button */}
          <button
            onClick={() => setKeyModalOpen(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              apiKey
                ? 'bg-[#162319] border-emerald-800/50 text-emerald-300 hover:bg-[#1c2d20]'
                : 'bg-[#261f18] border-amber-600/40 text-amber-300 hover:bg-[#33291f]'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {apiKey ? 'Gemini Key Connected' : 'Connect Gemini Key'}
            </span>
            <span className="sm:hidden">{apiKey ? 'Connected' : 'BYOK'}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                apiKey ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-amber-400 animate-pulse'
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};
