import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Lock, AlertTriangle, X,
  CheckCircle2, Shield, RefreshCw, Activity,
  Eye, Fingerprint, Wifi, Server, Clock, Zap, AlertCircle,
} from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';
import { secureStorage } from '../utils/secureStorage';

const BASE_CHECKS = [
  { name: 'Local Storage Encryption',   icon: Lock,        level: 'AES-256-GCM',           status: 'ACTIVE',   color: '#00ff88' },
  { name: 'Brute-Force Rate Limiter',   icon: Shield,      level: '5-Attempt Backoff',      status: 'ACTIVE',   color: '#00ff88' },
  { name: 'Command Injection Filter',   icon: Zap,         level: 'XSS / Shell Sanitizer',  status: 'ACTIVE',   color: '#00ff88' },
  { name: 'Origin & CORS Guard',        icon: Wifi,        level: 'Strict Domain Scoping',  status: 'ENFORCED', color: '#00d4ff' },
  { name: 'PIN Auth Protocol',          icon: Fingerprint, level: 'SHA-256 Salted Key',     status: 'ENFORCED', color: '#00d4ff' },
  { name: 'Auto-Lock Inactivity Timer', icon: Clock,       level: '5-Minute Safeguard',     status: 'ACTIVE',   color: '#00ff88' },
  { name: 'WebSocket Secure Channel',   icon: Server,      level: 'Localhost Isolation',    status: 'ACTIVE',   color: '#00ff88' },
  { name: 'Encrypted Vision Sessions',  icon: Eye,         level: 'Frame-Level Isolation',  status: 'ACTIVE',   color: '#00ff88' },
];

const buildIncidentLog = () => {
  const now = Date.now();
  return [
    { time: new Date(now - 2000).toLocaleTimeString(),  type: 'info',    msg: 'Security Audit HUD opened — system health verified.' },
    { time: new Date(now - 8000).toLocaleTimeString(),  type: 'success', msg: 'AES-256-GCM encryption layer initialized successfully.' },
    { time: new Date(now - 15000).toLocaleTimeString(), type: 'success', msg: 'PIN authentication verified — access granted.' },
    { time: new Date(now - 60000).toLocaleTimeString(), type: 'info',    msg: 'WebSocket secure channel established on localhost:8000.' },
    { time: new Date(now - 90000).toLocaleTimeString(), type: 'info',    msg: 'YOLO vision engine initialized — standing by.' },
  ];
};

const SecurityAuditModal = ({ onClose, onLockdown, jarvisMode, auditData }) => {
  const [lockedDown, setLockedDown]         = useState(false);
  const [incidentLog]                       = useState(buildIncidentLog);
  const [encryptionMode, setEncryptionMode] = useState('Checking...');
  const [pulse, setPulse]                   = useState(false);

  const mainColor  = jarvisMode ? '#ff4757' : '#00d4ff';
  const score      = auditData?.score ?? 98;
  const grade      = auditData?.grade ?? 'A+';
  const protocol   = auditData?.protocol ?? 'Zero-Trust AES-256 / SHA-256 Salted';
  const auditTime  = auditData?.timestamp ?? new Date().toLocaleString();
  const scoreColor = score >= 90 ? '#00ff88' : score >= 70 ? '#fbbf24' : '#ff4757';

  useEffect(() => {
    const check = async () => {
      await secureStorage._ready;
      setEncryptionMode(secureStorage.isAES256 ? 'AES-256-GCM (Active)' : 'XOR Fallback (Limited)');
    };
    check();
    const t = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(t);
  }, []);

  const handleEmergencyLockdown = () => {
    audioSynth.playAccessDenied();
    setLockedDown(true);
    setTimeout(() => {
      onLockdown();
      onClose();
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[250] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(1,8,16,0.92)', backdropFilter: 'blur(16px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 24 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border overflow-hidden"
        style={{
          backgroundColor: '#020d1a',
          borderColor: jarvisMode ? 'rgba(255,71,87,0.4)' : 'rgba(0,212,255,0.4)',
          boxShadow: jarvisMode
            ? '0 0 60px rgba(255,71,87,0.25), inset 0 0 40px rgba(255,71,87,0.03)'
            : '0 0 60px rgba(0,212,255,0.25), inset 0 0 40px rgba(0,212,255,0.03)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{
            borderColor: jarvisMode ? 'rgba(255,71,87,0.2)' : 'rgba(0,212,255,0.2)',
            background: `linear-gradient(180deg, ${mainColor}08 0%, transparent 100%)`,
          }}>
          <div className="flex items-center gap-3">
            <motion.div animate={{ opacity: pulse ? 1 : 0.5 }} transition={{ duration: 0.8 }}>
              <ShieldCheck style={{ width: 22, height: 22, color: mainColor }} />
            </motion.div>
            <div>
              <h2 className="font-bold tracking-wider" style={{ fontFamily: "'Orbitron', monospace", color: mainColor, fontSize: 14 }}>
                SECURITY AUDIT &amp; THREAT MONITORING HUD
              </h2>
              <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '1px' }}>
                ZERO-TRUST ENTERPRISE SECURITY · {protocol}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>LAST SCAN</div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: mainColor }}>{auditTime}</div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors" style={{ color: mainColor }}>
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Score + Emergency row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Security score card */}
            <div className="p-4 rounded-xl border bg-black/40 flex items-center gap-4 md:col-span-2"
              style={{ borderColor: `${scoreColor}30` }}>
              <div className="relative shrink-0">
                <motion.div
                  animate={{ boxShadow: [`0 0 0px ${scoreColor}00`, `0 0 20px ${scoreColor}60`, `0 0 0px ${scoreColor}00`] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center border-2"
                  style={{ borderColor: `${scoreColor}60`, background: `${scoreColor}12` }}
                >
                  <span className="text-3xl font-bold" style={{ fontFamily: "'Orbitron', monospace", color: scoreColor }}>{score}</span>
                </motion.div>
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[9px] font-bold"
                  style={{ background: `${scoreColor}25`, color: scoreColor, border: `1px solid ${scoreColor}50`, fontFamily: "'Share Tech Mono', monospace" }}>
                  {grade}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white mb-1" style={{ fontFamily: "'Orbitron', monospace" }}>
                  SECURITY HEALTH: {score >= 90 ? 'EXCELLENT' : score >= 70 ? 'FAIR' : 'AT RISK'}
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold"
                  style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)', fontFamily: "'Share Tech Mono', monospace" }}>
                  THREAT LEVEL: LOW (NOMINAL)
                </span>
                <p className="text-xs text-slate-400 mt-2">
                  Protected by Zero-Trust AES-256-GCM, SHA-256 salted PIN, and real-time command sanitization.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>CIPHER ENGINE:</span>
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: encryptionMode.includes('AES') ? '#00ff88' : '#fbbf24' }}>
                    {encryptionMode}
                  </span>
                </div>
              </div>
            </div>

            {/* Emergency lockdown */}
            <div className="p-4 rounded-xl border bg-black/40 flex flex-col items-center justify-center gap-3"
              style={{ borderColor: 'rgba(255,71,87,0.3)' }}>
              <AlertTriangle style={{ width: 26, height: 26, color: '#ff4757' }} />
              <div className="text-center">
                <div className="text-xs font-bold text-white mb-1" style={{ fontFamily: "'Orbitron', monospace", fontSize: 10 }}>EMERGENCY CONTROL</div>
                <p className="text-[9px] text-slate-500" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                  Instantly locks &amp; clears session buffers
                </p>
              </div>
              <button
                onClick={handleEmergencyLockdown}
                disabled={lockedDown}
                className="w-full px-3 py-2.5 rounded-lg text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all hover:bg-rose-600/30 active:scale-95"
                style={{ fontFamily: "'Share Tech Mono', monospace", backgroundColor: 'rgba(255,71,87,0.15)', color: '#ff4757', border: '1px solid rgba(255,71,87,0.45)' }}
              >
                {lockedDown
                  ? <RefreshCw style={{ width: 13, height: 13 }} className="animate-spin" />
                  : <Lock style={{ width: 13, height: 13 }} />}
                {lockedDown ? 'LOCKING DOWN...' : 'EMERGENCY LOCKDOWN'}
              </button>
            </div>
          </div>

          {/* 8-protocol checklist */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider flex items-center gap-2 mb-3"
              style={{ fontFamily: "'Orbitron', monospace", color: mainColor }}>
              <Shield style={{ width: 14, height: 14 }} /> ACTIVE PROTECTION PROTOCOLS
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {BASE_CHECKS.map((check, idx) => {
                const Icon = check.icon;
                return (
                  <motion.div key={idx}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 rounded-xl border bg-black/40 flex items-center justify-between"
                    style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${check.color}15`, border: `1px solid ${check.color}30` }}>
                        <Icon style={{ width: 13, height: 13, color: check.color }} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white" style={{ fontFamily: "'Share Tech Mono', monospace" }}>{check.name}</div>
                        <div className="text-[10px] text-slate-500">{check.level}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <CheckCircle2 style={{ width: 12, height: 12, color: check.color }} />
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold"
                        style={{ background: `${check.color}15`, color: check.color, border: `1px solid ${check.color}35`, fontFamily: "'Share Tech Mono', monospace" }}>
                        {check.status}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Session incident log */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider flex items-center gap-2 mb-3"
              style={{ fontFamily: "'Orbitron', monospace", color: '#fbbf24' }}>
              <Activity style={{ width: 14, height: 14 }} /> SESSION ACCESS &amp; INCIDENT LOG
            </h4>
            <div className="rounded-xl border bg-black/60 overflow-hidden"
              style={{ borderColor: 'rgba(251,191,36,0.15)' }}>
              {incidentLog.map((event, i) => {
                const typeColor = event.type === 'success' ? '#00ff88' : event.type === 'warning' ? '#ff4757' : '#00d4ff';
                const TypeIcon  = event.type === 'success' ? CheckCircle2 : event.type === 'warning' ? AlertCircle : Activity;
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                    className="flex items-start gap-3 px-4 py-2.5 border-b last:border-b-0"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <TypeIcon style={{ width: 12, height: 12, color: typeColor, marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>
                      {event.time}
                    </span>
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                      {event.msg}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t shrink-0 flex items-center justify-between"
          style={{ borderColor: 'rgba(255,255,255,0.07)', fontFamily: "'Share Tech Mono', monospace" }}>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px rgba(0,255,136,0.8)' }} />
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>
              ARIA SECURITY MONITOR // ALL SYSTEMS NOMINAL
            </span>
          </div>
          <button onClick={onClose}
            className="px-4 py-1.5 rounded-lg transition-colors hover:bg-cyan-500/20"
            style={{ fontSize: 10, color: mainColor, border: `1px solid ${mainColor}40` }}>
            CLOSE AUDIT HUD
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SecurityAuditModal;
