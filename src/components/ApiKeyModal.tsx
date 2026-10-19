import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { testGeminiConnection } from '../services/geminiService';
import {
  Key,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
} from 'lucide-react';

export const ApiKeyModal: React.FC = () => {
  const { apiKey, setApiKey, isKeyModalOpen, setKeyModalOpen, runAiAnalysis } = useStore();
  const [inputVal, setInputVal] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');

  if (!isKeyModalOpen) return null;

  const handleSave = () => {
    setApiKey(inputVal);
    setKeyModalOpen(false);
    if (inputVal.trim()) {
      runAiAnalysis();
    }
  };

  const handleTestConnection = async () => {
    const keyToTest = inputVal.trim();
    if (!keyToTest) {
      setTestStatus('error');
      setTestMessage('Please enter an API key first.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Testing connection and discovering active Gemini models...');

    try {
      const res = await testGeminiConnection(keyToTest);
      setTestStatus('success');
      setTestMessage(res.message);
    } catch (err: any) {
      console.error('Test error:', err);
      setTestStatus('error');
      setTestMessage(
        err?.message || 'Verification failed. Please check the API key and try again.'
      );
    }
  };

  const handleClear = () => {
    setInputVal('');
    setApiKey('');
    setTestStatus('idle');
    setTestMessage('');
  };

  const isAqFormat = inputVal.trim().startsWith('AQ');
  const isAizaFormat = inputVal.trim().startsWith('AIza');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-[#18181b] border border-[#27272c] rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-[#edeef0] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setKeyModalOpen(false)}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[#8a7c6e] hover:text-white hover:bg-[#241e18] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-[#241d17] border border-[#3d3126] text-amber-400">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#f5ede0] font-serif flex items-center gap-2">
              Gemini API Key Settings
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#18261b] text-emerald-300 font-mono border border-emerald-700/50">
                BYOK
              </span>
            </h2>
            <p className="text-xs text-[#a69787] m-0">
              Bring Your Own Key for AI harmonic analysis & recommendations
            </p>
          </div>
        </div>

        {/* Input Field */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[#b8a998] font-mono">
              Google Gemini API Key
            </label>
            {isAqFormat && (
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                ✓ Google AI Studio Auth Key (AQ format)
              </span>
            )}
            {isAizaFormat && (
              <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                ✓ Standard Key (AIza format)
              </span>
            )}
          </div>
          <div className="relative flex items-center">
            <input
              type={showKey ? 'text' : 'password'}
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                setTestStatus('idle');
              }}
              placeholder="AQ... or AIzaSy..."
              className="w-full bg-[#0d0b09] border border-[#382d22] rounded-xl px-4 py-3 pr-20 text-sm font-mono text-white placeholder-[#6b5f52] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
            <div className="absolute right-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 text-[#8a7c6e] hover:text-white rounded-md"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-[#8a7c6e]">
            Supports both modern Google AI Studio keys (starting with <code className="text-amber-300 font-mono">AQ.</code>) and legacy keys (starting with <code className="text-[#d1c6b8] font-mono">AIza</code>).
          </p>
        </div>

        {/* Test Connection Banner */}
        {testStatus !== 'idle' && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 border ${
              testStatus === 'testing'
                ? 'bg-blue-950/40 border-blue-800 text-blue-300'
                : testStatus === 'success'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-red-950/40 border-red-800 text-red-300'
            }`}
          >
            {testStatus === 'testing' && <Zap className="w-4 h-4 animate-spin text-blue-400" />}
            {testStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
            {testStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
            <span className="leading-relaxed">{testMessage}</span>
          </div>
        )}

        {/* Step-by-Step Onboarding Guide */}
        <div className="bg-[#0c0e14] border border-slate-800/80 rounded-xl p-4 mb-4 text-xs space-y-3">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            How to get your free Gemini API key:
          </div>

          <ol className="list-decimal list-inside space-y-2 text-slate-300 pl-1 leading-relaxed">
            <li>
              Go to Google AI Studio:{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 underline inline-flex items-center gap-0.5 hover:text-amber-300 font-mono"
              >
                https://aistudio.google.com/app/apikey
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </li>
            <li>
              Sign in with your Google account.
            </li>
            <li>
              Click <span className="text-white font-medium bg-slate-800 px-1.5 py-0.5 rounded">Create API key</span>.
            </li>
            <li>
              Select <span className="text-white font-medium bg-slate-800 px-1.5 py-0.5 rounded">Create key in new project</span>.
            </li>
            <li>
              Copy the key (starts with <code className="text-amber-300 bg-black/40 px-1 rounded">AQ...</code> or <code className="text-slate-300 bg-black/40 px-1 rounded">AIza...</code>) and paste it into the field above.
            </li>
          </ol>

          <div className="pt-2 border-t border-slate-800/80 flex items-start gap-2 text-slate-400">
            <span className="text-emerald-400 font-bold">✓ Free Tier:</span>
            <span>
              Google AI Studio includes a generous free tier of up to <strong>15 requests per minute</strong> and <strong>1,500 requests per day</strong> at no cost, without requiring a credit card.
            </span>
          </div>
        </div>

        {/* Security & Privacy Disclaimer */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 mb-6">
          <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
          <p>
            <strong>Security Guarantee:</strong> Your API key is persisted strictly in your browser’s local storage (<code className="text-slate-300 font-mono">fretmind_gemini_key</code>). It communicates directly from your browser to Google AI Studio and is never transmitted to an external intermediary server.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {apiKey ? (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors border border-transparent hover:border-red-900/50"
            >
              Remove Key
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testStatus === 'testing' || !inputVal.trim()}
              className="px-3.5 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
            >
              Test Connection
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/20 transition-all font-medium"
            >
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
