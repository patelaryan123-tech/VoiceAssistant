import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Cpu, Eye, Shield, Zap, Radio, Layers, Bot, X, Search, CheckCircle2, Rocket, Sliders, Activity, Bell, FileText, Terminal, Command, Network, Fingerprint, Lock } from 'lucide-react';

const ADVANCED_FEATURES_DATA = [
  // Active Core Features
  {
    id: 'biometric-lock',
    title: 'Biometric 3D PIN Lock Screen',
    category: 'Security',
    status: 'Active',
    tier: 'Core',
    badgeColor: '#00ff88',
    icon: Shield,
    cmd: '',
    description: '3D Arc Reactor glowing security lock screen with brute-force protection, failed attempt lockout, and customizable SHA-256 PIN authentication (PIN: 3012).',
  },
  {
    id: 'yolo-vision',
    title: 'Real-Time YOLOv8 Vision Engine',
    category: 'AI & Vision',
    status: 'Active',
    tier: 'Advanced',
    badgeColor: '#00ff88',
    icon: Eye,
    cmd: 'start vision',
    description: 'Live computer vision object detection powered by YOLOv8n. Detects objects, webcam feed processing, and spatial bounding boxes.',
  },
  {
    id: 'jarvis-mode',
    title: 'J.A.R.V.I.S. Red Tactical Theme Mode',
    category: 'UI / UX',
    status: 'Active',
    tier: 'Core',
    badgeColor: '#00ff88',
    icon: Sparkles,
    cmd: '',
    description: 'Instant UI transformation into Stark Industries J.A.R.V.I.S. Red HUD, customized sound effects, and upgraded voice personality.',
  },
  {
    id: 'process-guard',
    title: 'Process Guard & System Watchdog',
    category: 'Automation',
    status: 'Active',
    tier: 'Core',
    badgeColor: '#00ff88',
    icon: Activity,
    cmd: 'system dashboard',
    description: 'Monitors background processes, alerts on critical app terminations, and provides real-time system performance diagnostic feeds.',
  },
  {
    id: 'rag-knowledge',
    title: 'Local RAG Knowledge Engine',
    category: 'AI & Vision',
    status: 'Active',
    tier: 'Advanced',
    badgeColor: '#00ff88',
    icon: Layers,
    cmd: 'search for AI tools',
    description: 'Document indexing and retrieval-augmented generation. Queries local vector databases and notes without internet connectivity.',
  },
  {
    id: 'macro-automation',
    title: 'Custom Voice Macro Store',
    category: 'Automation',
    status: 'Active',
    tier: 'Advanced',
    badgeColor: '#00ff88',
    icon: Terminal,
    cmd: 'show macros',
    description: 'Create multi-step macro sequences triggered by custom voice commands or key phrases for desktop automation.',
  },
  {
    id: 'reminders-timers',
    title: 'Smart Reminders & Timers',
    category: 'Utility',
    status: 'Active',
    tier: 'Core',
    badgeColor: '#00ff88',
    icon: Bell,
    cmd: 'show reminders',
    description: 'Set contextual voice reminders, background countdown timers, and recurring notifications with sound alerts.',
  },

  // Next-Gen Advanced Features
  {
    id: 'neuromorphic-rag',
    title: 'Neuromorphic 3D Memory Graph',
    category: 'AI & Vision',
    status: 'Next-Gen',
    tier: 'Ultra Advanced',
    badgeColor: '#c084fc',
    icon: Network,
    cmd: 'search for AI tools',
    description: 'Visual 3D node-network mapping assistant long-term memory, indexed RAG documents, user habits, and semantic relationships.',
  },
  {
    id: 'autonomous-agent',
    title: 'Autonomous Desktop Robotic Agent',
    category: 'Automation',
    status: 'Next-Gen',
    tier: 'Ultra Advanced',
    badgeColor: '#c084fc',
    icon: Bot,
    cmd: 'take a screenshot',
    description: 'Automates complex GUI interactions, auto-fills web forms, controls applications, and manages files via natural language instructions.',
  },
  {
    id: 'telemetry-stream',
    title: 'Hardware Telemetry & VRAM Monitor',
    category: 'System Telemetry',
    status: 'Next-Gen',
    tier: 'Advanced',
    badgeColor: '#00d4ff',
    icon: Cpu,
    cmd: 'system dashboard',
    description: 'Real-time WebSocket telemetry stream tracking GPU VRAM usage, CPU per-core load, fan speed metrics, and network I/O throughput.',
  },
  {
    id: 'face-emotion',
    title: 'Biometric Face & Emotion Recognition',
    category: 'AI & Vision',
    status: 'Next-Gen',
    tier: 'Ultra Advanced',
    badgeColor: '#c084fc',
    icon: Fingerprint,
    cmd: 'start vision',
    description: 'Facial recognition & micro-expression emotion analysis using webcam video feed to adapt AI response tone to user mood.',
  },
  {
    id: 'zero-trust-crypto',
    title: 'Zero-Trust AES-256 Chat Vault',
    category: 'Security',
    status: 'Next-Gen',
    tier: 'Advanced',
    badgeColor: '#00d4ff',
    icon: Lock,
    cmd: '',
    description: 'End-to-end client-side AES-256 encryption for saved chat history, voice transcripts, and API credentials.',
  },
  {
    id: 'cyber-sfx',
    title: 'Cybernetic SFX Sound Matrix',
    category: 'UI / UX',
    status: 'Next-Gen',
    tier: 'Advanced',
    badgeColor: '#00d4ff',
    icon: Radio,
    cmd: 'morning briefing',
    description: 'Immersive spatial audio matrix featuring sci-fi interface feedback, synthesized voice pitch modulation, and audio cues.',
  },
  {
    id: 'screen-ocr',
    title: 'Multimodal Screen OCR & Document Reader',
    category: 'AI & Vision',
    status: 'Next-Gen',
    tier: 'Advanced',
    badgeColor: '#00d4ff',
    icon: FileText,
    cmd: 'read my clipboard',
    description: 'Capture active desktop windows, scan screen text with optical character recognition, and auto-summarize articles.',
  },
];

const FeaturesHubModal = ({ onClose, onCommand, jarvisMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const filteredFeatures = ADVANCED_FEATURES_DATA.filter(f => {
    const matchesTab = 
      activeTab === 'All' ||
      (activeTab === 'Active' && f.status === 'Active') ||
      (activeTab === 'Next-Gen' && f.status === 'Next-Gen') ||
      (activeTab === f.category);
    
    const matchesSearch = 
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.tier.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTab && matchesSearch;
  });

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
        className="w-full max-w-5xl max-h-[88vh] flex flex-col rounded-xl border overflow-hidden shadow-2xl"
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
            <Sparkles className="w-5 h-5 animate-pulse" style={{ color: mainColor }} />
            <div>
              <h2 className="font-bold tracking-wider" style={{ fontFamily: "'Orbitron', monospace", color: mainColor, fontSize: 17 }}>
                A.R.I.A. // ADVANCED FEATURES & ROADMAP HUB
              </h2>
              <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px' }}>
                EXPLORE ACTIVE CORE MODULES & NEXT-GEN CUTTING EDGE CAPABILITIES
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

        {/* Filters and Search Bar */}
        <div className="px-6 py-3 border-b flex flex-wrap items-center justify-between gap-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {['All', 'Active', 'Next-Gen', 'AI & Vision', 'Automation', 'Security'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold tracking-wider transition-all"
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  background: activeTab === tab ? (jarvisMode ? 'rgba(255,71,87,0.25)' : 'rgba(0,212,255,0.25)') : 'transparent',
                  color: activeTab === tab ? mainColor : 'rgba(255,255,255,0.6)',
                  border: `1px solid ${activeTab === tab ? mainColor : 'rgba(255,255,255,0.12)'}`,
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(0,212,255,0.5)' }} />
            <input
              type="text"
              placeholder="Search advanced features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-md text-xs outline-none bg-black/40 border border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
            />
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFeatures.map(feature => {
            const FeatureIcon = feature.icon;
            const isActive = feature.status === 'Active';
            return (
              <div
                key={feature.id}
                className="p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 hover:border-cyan-500/50 group"
                style={{
                  backgroundColor: 'rgba(0, 20, 40, 0.4)',
                  borderColor: 'rgba(0, 212, 255, 0.15)',
                  boxShadow: 'inset 0 0 20px rgba(0, 212, 255, 0.02)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        <FeatureIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-white group-hover:text-cyan-300 transition-colors" style={{ fontFamily: "'Orbitron', monospace" }}>
                          {feature.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] uppercase tracking-wider text-cyan-400/60" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                            {feature.category}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded text-purple-300 bg-purple-900/40 border border-purple-500/30" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                            {feature.tier}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase flex items-center gap-1"
                      style={{
                        backgroundColor: isActive ? 'rgba(0, 255, 136, 0.15)' : 'rgba(192, 132, 252, 0.15)',
                        color: feature.badgeColor,
                        border: `1px solid ${feature.badgeColor}40`,
                      }}
                    >
                      {isActive ? <CheckCircle2 className="w-3 h-3" /> : <Rocket className="w-3 h-3" />}
                      {feature.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300/85 leading-relaxed mb-4" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                    {feature.description}
                  </p>
                </div>

                {feature.cmd && (
                  <button
                    onClick={() => {
                      onCommand(feature.cmd);
                      onClose();
                    }}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold tracking-wider flex items-center justify-center gap-2 transition-all hover:bg-cyan-500/20"
                    style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      backgroundColor: 'rgba(0, 212, 255, 0.1)',
                      color: '#00d4ff',
                      border: '1px solid rgba(0, 212, 255, 0.25)',
                    }}
                  >
                    <Command className="w-3.5 h-3.5" />
                    TRIGGER COMMAND: "{feature.cmd}"
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'rgba(255,255,255,0.08)', fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.5)' }}>
          <span>ADVANCED MODULES LOADED: {ADVANCED_FEATURES_DATA.length} | ACTIVE: {ADVANCED_FEATURES_DATA.filter(f => f.status === 'Active').length} | NEXT-GEN: {ADVANCED_FEATURES_DATA.filter(f => f.status === 'Next-Gen').length}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors"
          >
            CLOSE HUB
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FeaturesHubModal;
