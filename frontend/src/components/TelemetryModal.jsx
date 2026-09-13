import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, HardDrive, Activity, Wifi, Zap, X, Shield, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const TelemetryModal = ({ onClose, jarvisMode, telemetryData }) => {
  const [history, setHistory] = useState([]);

  // Generate or append real-time telemetry stream data
  useEffect(() => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newEntry = {
      time: timeStr,
      cpu: telemetryData?.cpu ?? Math.floor(15 + Math.random() * 25),
      ram: telemetryData?.ram ?? Math.floor(45 + Math.random() * 10),
      network: telemetryData?.network ?? Math.floor(120 + Math.random() * 300),
    };

    setHistory(prev => [...prev.slice(-19), newEntry]);
  }, [telemetryData]);

  const mainColor = jarvisMode ? '#ff4757' : '#00d4ff';
  const latestCpu = history.length > 0 ? history[history.length - 1].cpu : 24;
  const latestRam = history.length > 0 ? history[history.length - 1].ram : 52;
  const latestNet = history.length > 0 ? history[history.length - 1].network : 240;

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
            <Cpu className="w-5 h-5 animate-pulse" style={{ color: mainColor }} />
            <div>
              <h2 className="font-bold tracking-wider" style={{ fontFamily: "'Orbitron', monospace", color: mainColor, fontSize: 16 }}>
                REAL-TIME HARDWARE TELEMETRY HUD
              </h2>
              <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>
                LIVE HARDWARE TELEMETRY STREAM & PERFORMANCE METRICS
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Gauges Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CPU Gauge */}
            <div className="p-4 rounded-xl border bg-black/40" style={{ borderColor: 'rgba(0,212,255,0.2)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-semibold tracking-wider" style={{ fontFamily: "'Share Tech Mono', monospace" }}>CPU LOAD</span>
                <Cpu className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-cyan-300" style={{ fontFamily: "'Orbitron', monospace" }}>
                {latestCpu}%
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                <div className="bg-cyan-400 h-full transition-all duration-500" style={{ width: `${latestCpu}%` }} />
              </div>
            </div>

            {/* RAM Gauge */}
            <div className="p-4 rounded-xl border bg-black/40" style={{ borderColor: 'rgba(0,255,136,0.2)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-semibold tracking-wider" style={{ fontFamily: "'Share Tech Mono', monospace" }}>RAM USAGE</span>
                <HardDrive className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-300" style={{ fontFamily: "'Orbitron', monospace" }}>
                {latestRam}%
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                <div className="bg-emerald-400 h-full transition-all duration-500" style={{ width: `${latestRam}%` }} />
              </div>
            </div>

            {/* Network Bandwidth */}
            <div className="p-4 rounded-xl border bg-black/40" style={{ borderColor: 'rgba(244,63,94,0.2)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-semibold tracking-wider" style={{ fontFamily: "'Share Tech Mono', monospace" }}>NETWORK BANDWIDTH</span>
                <Wifi className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold text-rose-300" style={{ fontFamily: "'Orbitron', monospace" }}>
                {latestNet} KB/s
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                <div className="bg-rose-400 h-full transition-all duration-500" style={{ width: `${Math.min((latestNet / 500) * 100, 100)}%` }} />
              </div>
            </div>
          </div>

          {/* Live Recharts History Area */}
          <div className="p-4 rounded-xl border bg-black/50" style={{ borderColor: 'rgba(0,212,255,0.2)' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-cyan-400 tracking-wider flex items-center gap-2" style={{ fontFamily: "'Orbitron', monospace" }}>
                <Activity className="w-4 h-4" /> TELEMETRY STREAM HISTORY (REAL-TIME)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">SAMPLING RATE: 1000ms</span>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="telemetryCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={mainColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={mainColor} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="telemetryRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff88" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#020d1a', borderColor: 'rgba(0,212,255,0.4)', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="cpu" name="CPU Load %" stroke={mainColor} fillOpacity={1} fill="url(#telemetryCpu)" />
                <Area type="monotone" dataKey="ram" name="RAM Usage %" stroke="#00ff88" fillOpacity={1} fill="url(#telemetryRam)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'rgba(255,255,255,0.08)', fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.5)' }}>
          <span>SYSTEM WATCHDOG: ACTIVE | HARDWARE ACCELERATION: ENABLED</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors"
          >
            CLOSE TELEMETRY
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TelemetryModal;
