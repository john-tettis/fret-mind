import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { audioEngine } from '../services/audioEngine';
import { generateVoicingOptions, parseFretPositions } from '../utils/guitarTheory';
import {
  Sparkles,
  ChevronDown,
  Send,
  Trash2,
  Bot,
  Volume2,
  Plus,
  RefreshCw,
  ArrowDownToLine,
  PanelRight,
} from 'lucide-react';

interface AiChatViewProps {
  dockPosition: 'panel' | 'bottom';
  onClose?: () => void;
  className?: string;
}

export const AiChatView: React.FC<AiChatViewProps> = ({
  dockPosition,
  onClose,
  className = '',
}) => {
  const {
    chatMessages,
    isSendingChat,
    sendChatMessage,
    clearChat,
    progression,
    likelyKeys,
    tuningName,
    apiKey,
    addChordToProgression,
    setChatDockPosition,
  } = useStore();

  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isSendingChat]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || isSendingChat) return;
    const text = inputVal.trim();
    setInputVal('');
    sendChatMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    if (isSendingChat) return;
    sendChatMessage(promptText);
  };

  const handleAuditionChord = (chordName: string) => {
    const voicings = generateVoicingOptions(chordName);
    if (voicings.length > 0 && voicings[0].notes.length > 0) {
      audioEngine.playStrum(voicings[0].notes);
    }
  };

  const handleAddChordFromChat = (chordName: string) => {
    const voicings = generateVoicingOptions(chordName);
    if (voicings.length > 0) {
      const parsed = parseFretPositions(voicings[0].fretPositions);
      addChordToProgression(chordName, parsed);
    }
  };

  const renderMessageContent = (content: string) => {
    const chordRegex =
      /\b([A-G][#b]?(?:maj7|maj9|maj|m7b5|m7|m9|min|m|dim|aug|7|9|11|13|sus4|add9)?(?:\/[A-G][#b]?)?)\b/g;

    const lines = content.split('\n');

    return (
      <div className="space-y-1.5 text-xs text-[#d1d1d8] leading-relaxed">
        {lines.map((line, lineIdx) => {
          if (!line.trim()) {
            return <div key={`empty-${lineIdx}`} className="h-1" />;
          }

          if (line.startsWith('### ')) {
            return (
              <h4 key={`h4-${lineIdx}`} className="text-xs font-bold text-amber-300 mt-2 mb-1">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={`h3-${lineIdx}`} className="text-sm font-bold text-[#f2f2f4] mt-2.5 mb-1">
                {line.replace('## ', '')}
              </h3>
            );
          }

          const parts: (string | React.ReactNode)[] = [];
          let lastIndex = 0;
          let match: RegExpExecArray | null;

          while ((match = chordRegex.exec(line)) !== null) {
            const matchStart = match.index;
            const matchedChord = match[0];

            if (
              matchedChord === 'I' ||
              (matchedChord === 'A' &&
                line.substring(matchStart - 2, matchStart + 3).includes(' a '))
            ) {
              continue;
            }

            if (matchStart > lastIndex) {
              parts.push(line.substring(lastIndex, matchStart));
            }

            parts.push(
              <span
                key={`chat-chord-${lineIdx}-${matchStart}`}
                className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded-md bg-[#222228] border border-[#353540] text-amber-300 font-mono text-[11px] font-semibold align-middle"
              >
                <button
                  type="button"
                  onClick={() => handleAuditionChord(matchedChord)}
                  className="hover:text-amber-200 transition-colors flex items-center gap-0.5 cursor-pointer"
                  title={`Listen to ${matchedChord}`}
                >
                  <Volume2 className="w-2.5 h-2.5 opacity-70" />
                  <span>{matchedChord}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddChordFromChat(matchedChord)}
                  className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 p-0.5 rounded transition-colors cursor-pointer"
                  title={`Add ${matchedChord} to timeline`}
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </span>
            );

            lastIndex = chordRegex.lastIndex;
          }

          if (lastIndex < line.length) {
            parts.push(line.substring(lastIndex));
          }

          return (
            <p key={`p-${lineIdx}`} className="m-0">
              {parts.length > 0 ? parts : line}
            </p>
          );
        })}
      </div>
    );
  };

  const primaryKey = likelyKeys && likelyKeys[0]?.key ? likelyKeys[0].key : 'Undetermined';
  const quickPrompts = [
    'What scales should I solo with?',
    'How do I transition Verse → Chorus?',
    'Suggest a moody bridge idea',
    'What are chord substitutions for my progression?',
  ];

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header bar */}
      <div className="py-2.5 px-1 border-b border-white/[0.06] flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0 shadow-sm">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#f2f2f5] font-display truncate">
                AI Producer & Harmony Chat
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/[0.05] text-amber-300 border border-white/[0.08]">
                {apiKey ? 'Gemini' : 'Theory Engine'}
              </span>
            </div>
            <div className="text-[10px] text-[#8e8e98] font-mono truncate">
              {progression.length} chords • Key: {primaryKey} • {tuningName}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Dock / Popaway Toggle Button */}
          {dockPosition === 'panel' ? (
            <button
              onClick={() => setChatDockPosition('bottom')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1a22] hover:bg-amber-500/15 text-amber-300 hover:text-amber-200 border border-white/[0.08] hover:border-amber-500/30 transition-all text-[11px] font-medium cursor-pointer shadow-sm"
              title="Pop away chat to bottom drawer"
            >
              <ArrowDownToLine className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Pop to Bottom</span>
              <span className="sm:hidden">Pop</span>
            </button>
          ) : (
            <button
              onClick={() => setChatDockPosition('panel')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1a22] hover:bg-amber-500/15 text-amber-300 hover:text-amber-200 border border-white/[0.08] hover:border-amber-500/30 transition-all text-[11px] font-medium cursor-pointer shadow-sm"
              title="Dock chat back into the side panel"
            >
              <PanelRight className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Dock to Panel</span>
              <span className="sm:hidden">Dock</span>
            </button>
          )}

          {/* Clear Chat */}
          <button
            onClick={clearChat}
            className="p-1.5 rounded-lg bg-[#1a1a22] hover:bg-rose-950/40 text-[#71717a] hover:text-rose-300 border border-white/[0.08] transition-all cursor-pointer"
            title="Clear conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Close drawer (only in bottom drawer mode) */}
          {dockPosition === 'bottom' && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#1a1a22] hover:bg-[#252530] text-[#a4a4b0] hover:text-[#f2f2f5] border border-white/[0.08] transition-all cursor-pointer"
              title="Minimize chat drawer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Message Thread Scroll Area */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 min-h-0">
        {chatMessages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}
            >
              {!isUser && (
                <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0 mt-0.5 shadow-sm">
                  <Sparkles className="w-3 h-3" />
                </div>
              )}

              <div
                className={`max-w-[90%] sm:max-w-[80%] rounded-2xl px-3.5 py-2 text-xs shadow-md transition-all ${
                  isUser
                    ? 'bg-amber-400 text-slate-950 font-medium ml-auto shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]'
                    : 'bg-[#181822]/90 border border-white/[0.08] text-[#d1d1d8]'
                }`}
              >
                {isUser ? (
                  <p className="m-0 leading-relaxed font-sans">{msg.content}</p>
                ) : (
                  renderMessageContent(msg.content)
                )}
                <div
                  className={`text-[9px] font-mono mt-1 ${
                    isUser ? 'text-slate-900/70 text-right' : 'text-[#62626c]'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isSendingChat && (
          <div className="flex justify-start gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
              <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
            </div>
            <div className="bg-[#181822] border border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs text-[#a4a4b2] animate-pulse">
              Analyzing progression and drafting harmonic advice...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Row */}
      <div className="py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 border-t border-white/[0.06]">
        <span className="text-[10px] text-[#71717a] shrink-0 font-medium">Quick ask:</span>
        {quickPrompts.map((p, idx) => (
          <button
            key={`qp-${idx}`}
            onClick={() => handleQuickPrompt(p)}
            disabled={isSendingChat}
            className="px-2.5 py-0.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-[#c0c0cb] hover:text-[#f2f2f5] border border-white/[0.08] hover:border-amber-500/30 text-[10px] whitespace-nowrap transition-all disabled:opacity-30 cursor-pointer"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="pt-2 shrink-0 border-t border-white/[0.06]">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about soloing scales, transitions, substitutions, voicings..."
              className="w-full bg-[#0e0e12] border border-white/[0.08] focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-[#f2f2f5] placeholder-[#62626a] focus:outline-none transition-all shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={!inputVal.trim() || isSendingChat}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-[0_0_12px_-2px_rgba(245,158,11,0.4)] transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 active:scale-95 cursor-pointer"
          >
            {isSendingChat ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline font-semibold">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
