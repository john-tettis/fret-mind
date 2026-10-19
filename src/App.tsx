import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Fretboard } from './components/Fretboard';
import { ProgressionTimeline } from './components/ProgressionTimeline';
import { AiAnalysisSection } from './components/AiAnalysisSection';
import { InstructionsView } from './components/InstructionsView';
import { ApiKeyModal } from './components/ApiKeyModal';
import { useStore } from './store/useStore';
import { audioEngine } from './services/audioEngine';

const MainApp: React.FC = () => {
  const { runAiAnalysis, progression, activeView } = useStore();

  useEffect(() => {
    // Only run analysis if there are actual chords in progression (no preset loaded at first)
    if (progression.length > 0) {
      runAiAnalysis();
    }

    const handleFirstClick = () => {
      audioEngine.initAudio();
      window.removeEventListener('click', handleFirstClick);
    };
    window.addEventListener('click', handleFirstClick);

    return () => {
      window.removeEventListener('click', handleFirstClick);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0c0a08] text-[#ede5d8] flex flex-col font-sans select-none">
      {/* Top Studio Navbar */}
      <Navbar />

      {activeView === 'instructions' ? (
        <main className="flex-1 w-full pb-20">
          <InstructionsView />
        </main>
      ) : (
        <>
          {/* Sticky Guitar Fretboard Neck */}
          <div className="sticky top-0 z-30 bg-[#0c0a08]/95 backdrop-blur-md border-b border-[#28221c] shadow-2xl px-2 sm:px-4 py-2">
            <div className="max-w-[1700px] w-full mx-auto">
              <Fretboard />
            </div>
          </div>

          {/* Main Studio Area: Progression (Left) and AI Harmonic Recommendations (Right) */}
          <main className="flex-1 max-w-[1700px] w-full mx-auto px-2 sm:px-4 pt-3 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
              {/* Left Block: Chord Progression Timeline & Tape Transport */}
              <section aria-label="Chord Progression Timeline">
                <ProgressionTimeline />
              </section>

              {/* Right Block: Harmonic Analysis & Next Chord Suggestions */}
              <section aria-label="AI Harmonic Analysis">
                <AiAnalysisSection />
              </section>
            </div>
          </main>
        </>
      )}

      {/* BYOK API Key Modal */}
      <ApiKeyModal />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter basename="/fretmind">
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
