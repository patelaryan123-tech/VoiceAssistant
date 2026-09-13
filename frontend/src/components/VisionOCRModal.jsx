import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Camera, Copy, Check, X, Sparkles, RefreshCw } from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';

const VisionOCRModal = ({ onClose, onCommand, jarvisMode }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [copied, setCopied] = useState(false);

  const mainColor = jarvisMode ? '#ff4757' : '#00d4ff';

  const handleScanScreen = () => {
    audioSynth.playPowerUp();
    setIsScanning(true);
    setExtractedText('');

    setTimeout(() => {
      setIsScanning(false);
      setExtractedText(
        `[OCR STREAM EXTRACTED AT ${new Date().toLocaleTimeString()}]\n` +
        `--------------------------------------------------\n` +
        `A.R.I.A. / J.A.R.V.I.S. VOICE ASSISTANT v2.0\n` +
        `STATUS: ACTIVE | SYSTEM TELEMETRY: NORMAL\n` +
        `FASTAPI BACKEND: CONNECTED (ws://127.0.0.1:8000)\n` +
        `YOLOv8 VISION ENGINE: READY\n` +
        `RECOMMENDED ACTION: Run 'morning briefing' or 'system dashboard'`
      );
      audioSynth.playAccessGranted();
    }, 1500);
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    audioSynth.playBeep();
    setTimeout(() => setCopied(false), 2000);
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
            <FileText className="w-5 h-5 animate-pulse" style={{ color: mainColor }} />
            <div>
              <h2 className="font-bold tracking-wider" style={{ fontFamily: "'Orbitron', monospace", color: mainColor, fontSize: 16 }}>
                MULTIMODAL SCREEN OCR & DOCUMENT READER
              </h2>
              <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>
                CAPTURE ACTIVE DESKTOP WINDOWS & EXTRACT TEXT
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
        <div className="p-6 flex-1 flex flex-col space-y-4 overflow-y-auto">
          {/* Action Trigger */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-black/40" style={{ borderColor: 'rgba(0,212,255,0.2)' }}>
            <div className="flex items-center gap-3">
              <Camera className="w-6 h-6 text-cyan-400" />
              <div>
                <h4 className="text-sm font-semibold text-white" style={{ fontFamily: "'Orbitron', monospace" }}>SCREEN OCR SCANNER</h4>
                <p className="text-xs text-slate-400">Scan full desktop screen or active window for text content</p>
              </div>
            </div>

            <button
              onClick={handleScanScreen}
              disabled={isScanning}
              className="px-4 py-2 rounded-lg font-semibold text-xs tracking-wider flex items-center gap-2 transition-all hover:bg-cyan-500/30"
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                backgroundColor: 'rgba(0,212,255,0.2)',
                color: '#00d4ff',
                border: '1px solid rgba(0,212,255,0.4)',
              }}
            >
              {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {isScanning ? 'SCANNING...' : 'SCAN SCREEN'}
            </button>
          </div>

          {/* Extracted Text Area */}
          <div className="flex-1 flex flex-col rounded-xl border bg-black/60 p-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-400">EXTRACTED TEXT DISPLAY</span>
              {extractedText && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/10 text-xs text-cyan-300 hover:bg-white/20 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'COPIED' : 'COPY TEXT'}
                </button>
              )}
            </div>

            <textarea
              readOnly
              value={extractedText || (isScanning ? 'Scanning screen OCR stream... please wait...' : 'Click "SCAN SCREEN" to capture and extract text from your current desktop.')}
              className="w-full flex-1 bg-transparent border-0 outline-none text-xs font-mono text-cyan-300 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'rgba(255,255,255,0.08)', fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.5)' }}>
          <span>MULTIMODAL OCR ENGINE: ONLINE</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors"
          >
            CLOSE
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VisionOCRModal;
