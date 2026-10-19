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
    <header className="border-b border-[#232328] bg-[#141417] px-4 lg:px-6 py-2 relative z-20 select-none">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Clean Brand & View Switcher */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Guitar className="w-4 h-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-[#f0f0f3]">
              FretMind
            </span>
          </div>

          {/* Clean Segmented Tabs */}
          <nav className="flex items-center bg-[#1c1c20] p-0.5 rounded-lg border border-[#2b2b32]">
            <button
              onClick={() => setActiveView('studio')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeView === 'studio'
                  ? 'bg-[#27272e] text-[#f2f2f4] shadow-sm'
                  : 'text-[#8e8e96] hover:text-[#d1d1d8]'
              }`}
            >
              <span>Studio</span>
            </button>
            <button
              onClick={() => setActiveView('instructions')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeView === 'instructions'
                  ? 'bg-[#27272e] text-[#f2f2f4] shadow-sm'
                  : 'text-[#8e8e96] hover:text-[#d1d1d8]'
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
          <div className="hidden sm:flex items-center bg-[#1c1c20] rounded-lg border border-[#2b2b32] p-0.5 text-xs">
            {(['clean', 'warm', 'overdrive'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => handleToneChange(mode)}
                className={`px-2 py-0.5 rounded capitalize text-[11px] transition-colors ${
                  toneMode === mode
                    ? 'bg-[#27272e] text-amber-300 font-semibold shadow-sm'
                    : 'text-[#84848e] hover:text-[#d0d0d6]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Mute button */}
          <button
            onClick={toggleMute}
            className={`p-1.5 rounded-lg border transition-colors ${
              isMuted
                ? 'bg-red-950/30 border-red-800/40 text-red-400'
                : 'bg-[#1c1c20] border-[#2b2b32] text-[#8e8e96] hover:text-[#f0f0f3]'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Clean BYOK Key Status */}
          <button
            onClick={() => setKeyModalOpen(true)}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
              apiKey
                ? 'bg-[#152219] border-emerald-900/40 text-emerald-300 hover:bg-[#1a2d20]'
                : 'bg-[#1c1c20] border-[#2b2b32] text-[#a4a4b0] hover:text-[#f0f0f3] hover:border-[#383842]'
            }`}
          >
            <Key className="w-3.5 h-3.5 opacity-75" />
            <span className="hidden sm:inline">
              {apiKey ? 'Gemini Key' : 'Connect Key'}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                apiKey ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};
