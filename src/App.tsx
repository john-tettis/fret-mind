import React, { useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Fretboard } from './components/Fretboard';
import { ProgressionTimeline } from './components/ProgressionTimeline';
import { AiAnalysisSection } from './components/AiAnalysisSection';
import { InstructionsView } from './components/InstructionsView';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AiChatDrawer } from './components/AiChatDrawer';
import { useStore } from './store/useStore';
import { audioEngine } from './services/audioEngine';

const MainApp: React.FC = () => {
  const { runAiAnalysis, progression, activeView, chatDockPosition } = useStore();

  useEffect(() => {
    // Only run analysis if there are actual chords in progression (no preset loaded at first)
    if (progression.length > 0) {
      runAiAnalysis();
    }

    const handleFirstGesture = () => {
      audioEngine.initAudio().catch(() => {});
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d10] text-[#ededf0] flex flex-col font-sans select-none relative overflow-x-hidden">
      {/* Background Studio Ambient Lighting */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_75%_50%_at_50%_-15%,rgba(245,158,11,0.06),transparent_70%)] z-0" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_50%_40%_at_100%_20%,rgba(139,92,246,0.03),transparent_60%)] z-0" />

      {/* Top Studio Navbar */}
      <Navbar />

      {activeView === 'instructions' ? (
        <main className="flex-1 w-full pb-20 relative z-10">
          <InstructionsView />
        </main>
      ) : (
        <>
          {/* Sticky Guitar Fretboard Neck */}
          <div className="sticky top-0 z-40 bg-[#101014]/90 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] px-2 sm:px-4 py-2 transition-all">
            <div className="max-w-[1700px] w-full mx-auto">
              <Fretboard />
            </div>
          </div>

          {/* Main Studio Area: Progression (Left) and AI Harmonic Recommendations (Right) */}
          <main
            className={`flex-1 max-w-[1700px] w-full mx-auto px-2 sm:px-4 pt-3 ${
              chatDockPosition === 'bottom' ? 'pb-28' : 'pb-12'
            } relative z-10`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              {/* Left Block: Chord Progression Timeline & Tape Transport */}
              <section aria-label="Chord Progression Timeline" className="@container/timeline">
                <ProgressionTimeline />
              </section>

              {/* Right Block: Harmonic Analysis & Next Chord Suggestions */}
              <section aria-label="AI Harmonic Analysis" className="@container/analysis">
                <AiAnalysisSection />
              </section>
            </div>
          </main>

          {/* AI Harmonic Producer & Theory Chat Drawer (when docked at bottom) */}
          {chatDockPosition === 'bottom' && <AiChatDrawer />}
        </>
      )}

      {/* BYOK API Key Modal */}
      <ApiKeyModal />
    </div>
  );
};

export default function App() {
  return <MainApp />;
}
