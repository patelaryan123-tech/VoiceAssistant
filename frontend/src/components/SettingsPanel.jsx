import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon, Volume2, VolumeX, Sliders, Download, Info } from 'lucide-react';

const COMMANDS = [
  { category: "🌐 Web & Info", items: ["weather in Mumbai", "who is Elon Musk", "calculate 25 times 4", "convert 100 USD to INR", "set timer for 5 minutes", "news", "search for Python tutorials"] },
  { category: "💹 Stocks & Crypto", items: ["bitcoin price", "apple stock", "tesla price", "nifty stock", "ethereum crypto", "gold price", "nvidia stock"] },
  { category: "🌐 Translation", items: ["translate hello to Hindi", "translate good morning to French", "translate my clipboard to Spanish", "translate to German"] },
  { category: "🤖 AI (Gemini)", items: ["ask AI what is quantum computing", "ask aria write a poem about Mumbai", "hey ai explain blockchain", "gemini what is dark matter"] },
  { category: "☀️ Briefing & Smart", items: ["good morning", "morning briefing", "brief me", "what's today", "daily briefing"] },
  { category: "🖥️ System", items: ["volume up", "volume down", "mute", "take a screenshot", "battery level", "shutdown", "restart", "lock screen", "open notepad", "open chrome", "close chrome"] },
  { category: "📁 Files", items: ["list files in downloads", "find all pdf files", "create file notes.txt in desktop", "delete file old.txt from desktop"] },
  { category: "🔁 Macros & Reminders", items: ["start macro recording morning", "stop recording", "run macro morning", "remind me to call mom at 6 PM", "remind me weather in Mumbai at 9 AM", "show reminders"] },
  { category: "💬 General", items: ["dark mode", "light mode", "export chat", "clear chat", "what's the time", "help", "show analytics", "show system stats"] },
];

const SettingsPanel = ({ settings, onUpdateSetting, onExportChat, onClose }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[560px] max-h-[75vh] overflow-hidden rounded-2xl shadow-2xl z-50 flex flex-col"
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-accent)',
          boxShadow: '0 25px 60px var(--shadow-color)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4" style={{ color: 'var(--color-accent1)' }} />
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Settings & Commands</span>
          </div>
          <button onClick={onClose} className="icon-btn no-drag">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Settings Section */}
          <div className="px-5 py-4 space-y-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Preferences</p>

            {/* Theme */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.theme === 'dark' ? <Moon className="w-4 h-4" style={{ color: 'var(--text-dim)' }} /> : <Sun className="w-4 h-4" style={{ color: 'var(--color-accent2)' }} />}
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Theme</span>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-input)' }}>
                <button
                  onClick={() => onUpdateSetting('theme', 'dark')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${settings.theme === 'dark' ? 'bg-gradient-to-r from-accent1 to-accent2 text-white shadow' : ''}`}
                  style={settings.theme !== 'dark' ? { color: 'var(--text-muted)' } : {}}
                >🌙 Dark</button>
                <button
                  onClick={() => onUpdateSetting('theme', 'light')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${settings.theme === 'light' ? 'bg-gradient-to-r from-accent1 to-accent2 text-white shadow' : ''}`}
                  style={settings.theme !== 'light' ? { color: 'var(--text-muted)' } : {}}
                >☀️ Light</button>
              </div>
            </div>

            {/* TTS Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.tts_enabled ? <Volume2 className="w-4 h-4" style={{ color: 'var(--color-success)' }} /> : <VolumeX className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Text-to-Speech</span>
              </div>
              <button
                onClick={() => onUpdateSetting('tts_enabled', !settings.tts_enabled)}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${settings.tts_enabled ? 'bg-gradient-to-r from-accent1 to-accent2' : ''}`}
                style={!settings.tts_enabled ? { background: 'var(--bg-input)' } : {}}
              >
                <motion.div
                  animate={{ x: settings.tts_enabled ? 24 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                />
              </button>
          </div>

          {/* ── Wake Word ── */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 14 }}>🎙️</span>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Wake Word</span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', marginLeft: 22 }}>Say "Hey Aria" to activate</p>
            </div>
            <button
              onClick={() => onUpdateSetting('wake_word_enabled', !settings.wake_word_enabled)}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${settings.wake_word_enabled ? 'bg-gradient-to-r from-accent1 to-accent2' : ''}`}
              style={!settings.wake_word_enabled ? { background: 'var(--bg-input)' } : {}}
            >
              <motion.div
                animate={{ x: settings.wake_word_enabled ? 24 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
              />
            </button>
          </div>

          {/* ── Ollama Model ── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 14 }}>🤖</span>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>AI Model (Ollama)</span>
              </div>
              <span
                className="text-xs font-mono px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
              >
                ● LOCAL
              </span>
            </div>
            <select
              value={settings.ollama_model || 'llama3'}
              onChange={(e) => onUpdateSetting('ollama_model', e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs font-mono outline-none appearance-none cursor-pointer"
              style={{ background: 'var(--bg-input)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}
            >
              <option value="llama3">llama3 (installed ✔)</option>
              <option value="llama3:8b">llama3:8b</option>
              <option value="llama3.2">llama3.2</option>
              <option value="mistral">mistral</option>
              <option value="gemma2">gemma2</option>
              <option value="phi3">phi3</option>
              <option value="codellama">codellama</option>
              <option value="deepseek-r1">deepseek-r1</option>
            </select>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              🔒 100% offline · no API key · runs on your PC
            </p>
          </div>

          {/* ── Briefing City ── */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 14 }}>☀️</span>
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Briefing City</span>
            </div>
            <input
              type="text"
              placeholder="e.g. Mumbai, New Delhi, London..."
              value={settings.briefing_city || 'New Delhi'}
              onChange={(e) => onUpdateSetting('briefing_city', e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs font-mono outline-none"
              style={{ background: 'var(--bg-input)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}
            />
          </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Voice Speed</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-input)', color: 'var(--text-dim)' }}>{settings.voice_speed} wpm</span>
              </div>
              <input
                type="range" min="80" max="280" step="10"
                value={settings.voice_speed}
                onChange={(e) => onUpdateSetting('voice_speed', parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, var(--color-accent1) 0%, var(--color-accent2) ${((settings.voice_speed - 80) / 200) * 100}%, var(--bg-input) ${((settings.voice_speed - 80) / 200) * 100}%)` }}
              />
            </div>
          </div>

          {/* Export Chat */}
          <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <button
              onClick={onExportChat}
              className="no-drag w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, var(--color-accent1), var(--color-accent2))', color: 'white' }}
            >
              <Download className="w-4 h-4" />
              Export Chat History
            </button>
          </div>

          {/* Commands Reference */}
          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Command Reference</p>
            </div>
            {COMMANDS.map((section) => (
              <div key={section.category}>
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-dim)' }}>{section.category}</p>
                <div className="flex flex-wrap gap-1.5">
                  {section.items.map((cmd) => (
                    <span
                      key={cmd}
                      className="text-xs px-2 py-1 rounded-md font-mono"
                      style={{ background: 'var(--bg-input)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}
                    >
                      {cmd}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SettingsPanel;
