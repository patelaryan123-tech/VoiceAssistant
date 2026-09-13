import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles, Flame, Shield, X, CheckCircle2 } from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';

const PERSONAS = [
  {
    id: 'aria',
    name: 'A.R.I.A. (Core Sci-Fi AI)',
    accent: 'Calm & Analytical',
    color: '#00d4ff',
    jarvisMode: false,
    description: 'Advanced Reasoning & Intelligence Assistant. Professional, precise, and equipped with holographic HUD visualizers.',
    promptPreview: 'You are A.R.I.A., a futuristic AI assistant. Respond analytically and concisely.',
  },
  {
    id: 'jarvis',
    name: 'J.A.R.V.I.S. (Stark Tactical AI)',
    accent: 'Witty & Tactical',
    color: '#ff4757',
    jarvisMode: true,
    description: 'Stark Industries Tactical Assistant. Witty tone, red HUD protocol interface, and hardware control specialization.',
    promptPreview: 'You are J.A.R.V.I.S., a witty Stark Industries AI. Address the user with formal tactical precision.',
  },
  {
    id: 'friday',
    name: 'F.R.I.D.A.Y. (Engineering Specialist)',
    accent: 'Irish / Direct Technical',
    color: '#00ff88',
    jarvisMode: false,
    description: 'Fast Replacement Intelligent Digital Assistant Youth. Technical specialist focused on code execution and data parsing.',
    promptPreview: 'You are F.R.I.D.A.Y., a direct technical AI specialist. Prioritize code efficiency and system telemetry.',
  },
  {
    id: 'hal9000',
    name: 'H.A.L. 9000 (Space Protocol AI)',
    accent: 'Monotone & Precise',
    color: '#fbbf24',
    jarvisMode: false,
    description: 'Deep Space Heuristically Programmed Algorithmic AI. Monotone, calm voice protocol for specialized space telemetry.',
    promptPreview: 'You are H.A.L. 9000. Speak with extreme calm, absolute logical accuracy, and space protocol alignment.',
  },
];

const PersonaSelector = ({ activePersona, onSelectPersona, onClose, jarvisMode }) => {
  const mainColor = jarvisMode ? '#ff4757' : '#00d4ff';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[250] flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(1, 8, 16, 0.88)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-xl border overflow-hidden shadow-2xl"
        style={{
          backgroundColor: '#020d1a',
          borderColor: jarvisMode ? 'rgba(255,71,87,0.35)' : 'rgba(0,212,255,0.35)',
          boxShadow: jarvisMode ? '0 0 50px rgba(255,71,87,0.3)' : '0 0 50px rgba(0,212,255,0.3)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{
            borderColor: jarvisMode ? 'rgba(255,71,87,0.2)' : 'rgba(0,212,255,0.2)',
            background: 'linear-gradient(180deg, rgba(0,212,255,0.06) 0%, transparent 100%)'
          }}
        >
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 animate-pulse" style={{ color: mainColor }} />
            <div>
              <h2 className="font-bold tracking-wider" style={{ fontFamily: "'Orbitron', monospace", color: mainColor, fontSize: 16 }}>
                MULTI-AI PERSONA STUDIO
              </h2>
              <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>
                SELECT ACTIVE AI VOICE PERSONALITY & PROMPT PROTOCOL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: mainColor }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Personas Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          {PERSONAS.map(p => {
            const isSelected = activePersona === p.id;
            return (
              <div
                key={p.id}
                onClick={() => {
                  audioSynth.playClick();
                  onSelectPersona(p.id, p.jarvisMode);
                }}
                className="p-5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.01]"
                style={{
                  backgroundColor: isSelected ? 'rgba(0, 212, 255, 0.08)' : 'rgba(0, 20, 40, 0.4)',
                  borderColor: isSelected ? p.color : 'rgba(255,255,255,0.1)',
                  boxShadow: isSelected ? `0 0 20px ${p.color}40` : 'none',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg border" style={{ backgroundColor: `${p.color}15`, borderColor: `${p.color}40`, color: p.color }}>
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-white" style={{ fontFamily: "'Orbitron', monospace" }}>
                          {p.name}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {p.accent}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: `${p.color}20`, color: p.color }}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300/85 mb-4 leading-relaxed" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                    {p.description}
                  </p>

                  <div className="p-2.5 rounded bg-black/40 border border-white/5 text-[11px] text-slate-400 font-mono italic">
                    "{p.promptPreview}"
                  </div>
                </div>

                <button
                  className="mt-4 w-full py-2 rounded-lg text-xs font-semibold tracking-wider transition-all"
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    backgroundColor: isSelected ? p.color : 'rgba(255,255,255,0.05)',
                    color: isSelected ? '#000' : p.color,
                    border: `1px solid ${p.color}60`,
                  }}
                >
                  {isSelected ? 'CURRENTLY ACTIVE' : `ACTIVATE ${p.id.toUpperCase()}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'rgba(255,255,255,0.08)', fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.5)' }}>
          <span>PERSONAS LOADED: 4 | PROMPT ENGINES READY</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors"
          >
            DONE
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PersonaSelector;
