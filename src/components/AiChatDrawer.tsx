import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { AiChatView } from './AiChatView';
import {
  ChevronUp,
  Send,
  MessageSquare,
  PanelRight,
  RefreshCw,
} from 'lucide-react';

export const AiChatDrawer: React.FC = () => {
  const {
    isChatOpen,
    setIsChatOpen,
    chatDockPosition,
    setChatDockPosition,
    isSendingChat,
    sendChatMessage,
  } = useStore();

  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  if (chatDockPosition !== 'bottom') {
    return null;
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || isSendingChat) return;
    const text = inputVal.trim();
    setInputVal('');
    if (!isChatOpen) setIsChatOpen(true);
    sendChatMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#121217]/95 backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-10px_40px_rgba(0,0,0,0.6)] transition-all duration-300 ease-in-out">
      {/* 1. COLLAPSIBLE DRAWER BODY (When open) */}
      {isChatOpen && (
        <div className="max-w-[1700px] mx-auto px-2 sm:px-4 h-[410px] max-h-[55vh] flex flex-col">
          <AiChatView dockPosition="bottom" onClose={() => setIsChatOpen(false)} />
        </div>
      )}

      {/* 2. DOCKED BOTTOM BAR (When minimized/closed) */}
      {!isChatOpen && (
        <div className="max-w-[1700px] mx-auto px-2 sm:px-4 py-2 flex items-center justify-between gap-3">
          {/* Left: Chat Toggle Button */}
          <button
            onClick={() => {
              setIsChatOpen(true);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1a1a22] hover:bg-[#252530] border border-white/[0.08] hover:border-white/[0.15] text-xs font-semibold text-[#f2f2f5] transition-all shrink-0 shadow-sm cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-display">Ask AI Producer</span>
            <span className="sm:hidden font-display">Chat</span>
            <ChevronUp className="w-3.5 h-3.5 opacity-60 ml-0.5" />
          </button>

          {/* Center: Input Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your progression, soloing scales, transitions, or voicings..."
                className="w-full bg-[#0e0e12] border border-white/[0.08] focus:border-amber-400 rounded-xl px-3.5 py-1.5 text-xs text-[#f2f2f5] placeholder-[#62626a] focus:outline-none transition-all shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={!inputVal.trim() || isSendingChat}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-[0_0_12px_-2px_rgba(245,158,11,0.4)] transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 active:scale-95 cursor-pointer"
            >
              {isSendingChat ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span className="hidden md:inline font-semibold">Ask</span>
            </button>
          </form>

          {/* Right: Dock back to side panel button */}
          <button
            type="button"
            onClick={() => setChatDockPosition('panel')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a1a22] hover:bg-amber-500/15 border border-white/[0.08] hover:border-amber-500/30 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-all shrink-0 cursor-pointer shadow-sm"
            title="Dock chat back to the side panel"
          >
            <PanelRight className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Dock to Panel</span>
          </button>
        </div>
      )}
    </div>
  );
};
