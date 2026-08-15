import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon, Volume2, VolumeX, Sliders, Download, Info, Settings, Terminal } from 'lucide-react';

const COMMANDS = [
  { category: '🌐 WEB & INFO', items: ['weather in Mumbai', 'who is Elon Musk', 'calculate 25 times 4', 'convert 100 USD to INR', 'set timer for 5 minutes', 'news', 'search for Python tutorials'] },
  { category: '💹 STOCKS & CRYPTO', items: ['bitcoin price', 'apple stock', 'tesla price', 'nifty stock', 'ethereum crypto', 'gold price', 'nvidia stock'] },
  { category: '🌐 TRANSLATION', items: ['translate hello to Hindi', 'translate good morning to French', 'translate my clipboard to Spanish'] },
  { category: '🤖 AI (OLLAMA)', items: ['ask AI what is quantum computing', 'ask aria write a poem about Mumbai', 'hey ai explain blockchain', 'gemini what is dark matter'] },
  { category: '☀️ BRIEFING & SMART', items: ['good morning', 'morning briefing', 'brief me', "what's today", 'daily briefing'] },
  { category: '🖥️ SYSTEM', items: ['volume up', 'volume down', 'mute', 'take a screenshot', 'battery level', 'shutdown', 'restart', 'lock screen', 'open notepad', 'open chrome'] },
  { category: '📁 FILES', items: ['list files in downloads', 'find all pdf files', 'create file notes.txt in desktop', 'delete file old.txt from desktop'] },
  { category: '🔁 MACROS & REMINDERS', items: ['start macro recording morning', 'stop recording', 'run macro morning', 'remind me to call mom at 6 PM', 'show reminders'] },
  { category: '💬 GENERAL', items: ['dark mode', 'light mode', 'export chat', 'clear chat', "what's the time", 'help', 'show analytics', 'show system stats'] },
];

const TABS = [
  { id: 'settings', label: 'SETTINGS', icon: Settings },
  { id: 'commands', label: 'COMMANDS', icon: Terminal },
];

const SettingsPanel = ({ settings, onUpdateSetting, onExportChat, onClose, onCommand }) => {
  const [activeTab, setActiveTab] = useState('settings');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="fixed bottom-28 left-1/2 -translate-x-1/2 w-[590px] max-h-[70vh] overflow-hidden z-50 flex flex-col"
        style={{
          background: 'linear-gradient(180deg, rgba(0,18,36,0.99) 0%, rgba(0,10,22,0.99) 100%)',
          border: '1px solid rgba(0,212,255,0.4)',
          borderRadius: '4px',
          boxShadow: '0 0 40px rgba(0,212,255,0.15), 0 30px 60px rgba(0,0,0,0.7), inset 0 0 40px rgba(0,212,255,0.02)',
        }}
      >
        {/* Corner decorations */}
        <div className="corner-tl" />
        <div className="corner-tr" />
        <div className="corner-bl" />
        <div className="corner-br" />

        {/* Scan line */}
        <div className="scan-line" />

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: '1px solid rgba(0,212,255,0.15)', background: 'rgba(0,12,28,0.6)' }}
        >
          <div className="flex items-center gap-2">
            <Sliders style={{ width: 13, height: 13, color: '#00d4ff' }} />
            <span
              className="font-bold tracking-widest text-xs"
              style={{ fontFamily: "'Orbitron', monospace", color: '#00d4ff', textShadow: '0 0 8px rgba(0,212,255,0.6)', letterSpacing: '2px' }}
            >
              ARIA // CONFIG
            </span>
          </div>
          <button onClick={onClose} className="icon-btn no-drag" style={{ width: 28, height: 28, padding: 0 }}>
            <X style={{ width: 12, height: 12 }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-5 pt-2 gap-0 shrink-0" style={{ borderBottom: '1px solid rgba(0,212,255,0.12)' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="settings-tab-btn"
                style={{ color: isActive ? '#00d4ff' : 'var(--text-muted)', fontWeight: isActive ? 700 : 400 }}
              >
                <Icon style={{ width: 11, height: 11 }} />
                {tab.label}
                {isActive && <motion.div layoutId="tab-underline" className="settings-tab-underline" />}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'settings' ? (
              <motion.div
                key="settings-tab"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
              >
                <div className="px-5 py-4 space-y-5" style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
                  {/* Section label */}
                  <p
                    className="text-xs font-bold tracking-widest"
                    style={{ fontFamily: "'Share Tech Mono', monospace", color: '#00d4ff', fontSize: '9px', letterSpacing: '2.5px', textShadow: '0 0 6px rgba(0,212,255,0.5)' }}
                  >
                    ── PREFERENCES ──
                  </p>

                  {/* Theme */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {settings.theme === 'dark'
                        ? <Moon style={{ width: 13, height: 13, color: 'var(--text-dim)' }} />
                        : <Sun style={{ width: 13, height: 13, color: '#ff9f43' }} />
                      }
                      <span className="text-xs" style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-primary)', letterSpacing: '0.5px' }}>DISPLAY MODE</span>
                    </div>
                    <div className="flex items-center gap-1 p-1" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '3px' }}>
                      {['dark', 'light'].map(t => (
                        <button
                          key={t}
                          onClick={() => onUpdateSetting('theme', t)}
                          className="px-3 py-1.5 text-xs font-bold transition-all"
                          style={{
                            fontFamily: "'Share Tech Mono', monospace",
                            letterSpacing: '1px',
                            borderRadius: '2px',
                            background: settings.theme === t ? 'rgba(0,212,255,0.2)' : 'transparent',
                            color: settings.theme === t ? '#00d4ff' : 'var(--text-muted)',
                            border: settings.theme === t ? '1px solid rgba(0,212,255,0.4)' : '1px solid transparent',
                            boxShadow: settings.theme === t ? '0 0 8px rgba(0,212,255,0.3)' : 'none',
                          }}
                        >
                          {t === 'dark' ? '🌙 NIGHT' : '☀️ DAY'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* TTS */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {settings.tts_enabled
                        ? <Volume2 style={{ width: 13, height: 13, color: '#00ff88' }} />
                        : <VolumeX style={{ width: 13, height: 13, color: 'var(--text-muted)' }} />
                      }
                      <span className="text-xs" style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-primary)', letterSpacing: '0.5px' }}>VOICE OUTPUT</span>
                    </div>
                    <button
                      onClick={() => onUpdateSetting('tts_enabled', !settings.tts_enabled)}
                      className="relative"
                      style={{ width: 48, height: 24, borderRadius: '2px', background: settings.tts_enabled ? 'rgba(0,255,136,0.15)' : 'rgba(0,212,255,0.06)', border: `1px solid ${settings.tts_enabled ? 'rgba(0,255,136,0.4)' : 'rgba(0,212,255,0.15)'}`, boxShadow: settings.tts_enabled ? '0 0 8px rgba(0,255,136,0.2)' : 'none', transition: 'all 0.3s' }}
                    >
                      <motion.div
                        animate={{ x: settings.tts_enabled ? 24 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        style={{ position: 'absolute', top: 2, width: 18, height: 18, background: settings.tts_enabled ? '#00ff88' : 'rgba(0,212,255,0.4)', borderRadius: '1px', boxShadow: settings.tts_enabled ? '0 0 6px rgba(0,255,136,0.5)' : 'none' }}
                      />
                    </button>
                  </div>

                  {/* Wake Word */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 13 }}>🎙️</span>
                        <span className="text-xs" style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-primary)', letterSpacing: '0.5px' }}>WAKE WORD</span>
                      </div>
                      <p className="text-xs mt-0.5 ml-5" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>SAY "HEY ARIA" TO ACTIVATE</p>
                    </div>
                    <button
                      onClick={() => onUpdateSetting('wake_word_enabled', !settings.wake_word_enabled)}
                      className="relative"
                      style={{ width: 48, height: 24, borderRadius: '2px', background: settings.wake_word_enabled ? 'rgba(0,255,136,0.15)' : 'rgba(0,212,255,0.06)', border: `1px solid ${settings.wake_word_enabled ? 'rgba(0,255,136,0.4)' : 'rgba(0,212,255,0.15)'}`, boxShadow: settings.wake_word_enabled ? '0 0 8px rgba(0,255,136,0.2)' : 'none', transition: 'all 0.3s' }}
                    >
                      <motion.div
                        animate={{ x: settings.wake_word_enabled ? 24 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        style={{ position: 'absolute', top: 2, width: 18, height: 18, background: settings.wake_word_enabled ? '#00ff88' : 'rgba(0,212,255,0.4)', borderRadius: '1px', boxShadow: settings.wake_word_enabled ? '0 0 6px rgba(0,255,136,0.5)' : 'none' }}
                      />
                    </button>
                  </div>

                  {/* Ollama Model */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 13 }}>🤖</span>
                        <span className="text-xs" style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-primary)', letterSpacing: '0.5px' }}>AI MODEL</span>
                      </div>
                      <span
                        className="text-xs px-2 py-0.5"
                        style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.25)', borderRadius: '2px', letterSpacing: '1px', textShadow: '0 0 6px rgba(0,255,136,0.4)' }}
                      >
                        ● LOCAL
                      </span>
                    </div>
                    <select
                      value={settings.ollama_model || 'llama3'}
                      onChange={(e) => onUpdateSetting('ollama_model', e.target.value)}
                      className="w-full px-3 py-2 outline-none appearance-none cursor-pointer"
                      style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, letterSpacing: '0.5px', background: 'rgba(0,212,255,0.05)', color: 'var(--text-dim)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '3px' }}
                    >
                      <option value="llama3">llama3 (installed ✔)</option>
                      <option value="llama3:latest">llama3:latest</option>
                      <option value="llama3:8b">llama3:8b</option>
                      <option value="mistral">mistral</option>
                      <option value="gemma2">gemma2</option>
                      <option value="phi3">phi3</option>
                      <option value="codellama">codellama</option>
                      <option value="deepseek-r1">deepseek-r1</option>
                    </select>
                    <p className="text-xs" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                      🔒 100% OFFLINE · NO API KEY · RUNS LOCALLY
                    </p>
                  </div>

                  {/* Briefing City */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 13 }}>📍</span>
                      <span className="text-xs" style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-primary)', letterSpacing: '0.5px' }}>BRIEFING CITY</span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai, New Delhi..."
                      value={settings.briefing_city || 'New Delhi'}
                      onChange={(e) => onUpdateSetting('briefing_city', e.target.value)}
                      className="w-full px-3 py-2 outline-none"
                      style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, letterSpacing: '0.5px', background: 'rgba(0,212,255,0.05)', color: 'var(--text-dim)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '3px' }}
                    />
                  </div>

                  {/* Voice Speed */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-primary)', letterSpacing: '0.5px' }}>VOICE SPEED</span>
                      <span
                        className="text-xs px-2 py-0.5"
                        style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, background: 'rgba(0,212,255,0.08)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '2px' }}
                      >
                        {settings.voice_speed} WPM
                      </span>
                    </div>
                    <div className="relative h-1" style={{ background: 'rgba(0,212,255,0.08)' }}>
                      <div
                        style={{
                          position: 'absolute', left: 0, top: 0, height: '100%',
                          width: `${((settings.voice_speed - 80) / 200) * 100}%`,
                          background: 'linear-gradient(90deg, #00d4ff, #00ff88)',
                          boxShadow: '0 0 6px rgba(0,212,255,0.5)',
                        }}
                      />
                      <input
                        type="range" min="80" max="280" step="10"
                        value={settings.voice_speed}
                        onChange={(e) => onUpdateSetting('voice_speed', parseInt(e.target.value))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        style={{ height: '100%' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Export */}
                <div className="px-5 py-3">
                  <button
                    onClick={onExportChat}
                    className="no-drag w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-all"
                    style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      letterSpacing: '1.5px',
                      background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,153,204,0.08))',
                      border: '1px solid rgba(0,212,255,0.35)',
                      color: '#00d4ff',
                      borderRadius: '3px',
                      boxShadow: '0 0 12px rgba(0,212,255,0.1)',
                    }}
                  >
                    <Download style={{ width: 13, height: 13 }} />
                    EXPORT CHAT HISTORY
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="commands-tab"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.15 }}
                className="px-5 py-4 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Info style={{ width: 11, height: 11, color: 'rgba(0,212,255,0.5)' }} />
                  <p
                    className="text-xs tracking-widest"
                    style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-muted)', fontSize: '9px', letterSpacing: '2px' }}
                  >
                    CLICK TO EXECUTE COMMAND
                  </p>
                </div>
                {COMMANDS.map(section => (
                  <div key={section.category}>
                    <p
                      className="text-xs font-bold mb-2"
                      style={{ fontFamily: "'Share Tech Mono', monospace", color: '#00d4ff', fontSize: '9px', letterSpacing: '2px', textShadow: '0 0 6px rgba(0,212,255,0.4)' }}
                    >
                      {section.category}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {section.items.map(cmd => (
                        <button
                          key={cmd}
                          onClick={() => { onCommand && onCommand(cmd); onClose(); }}
                          className="cmd-chip no-drag"
                          title={`Run: ${cmd}`}
                        >
                          {cmd}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SettingsPanel;
