import React from 'react';
import { Mic, Minus, Square, X, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const FloatingPill = ({ isListening, theme, wakeWordEnabled }) => {
  const handleMin = () => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('window-min');
    }
  };

  const handleMax = () => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('window-max');
    }
  };

  const handleClose = () => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('window-close');
    }
  };

  return (
    <div
      className="drag-region mx-4 mt-4 flex items-center justify-between rounded-full p-2"
      style={{
        background: 'var(--bottom-bar-bg)',
        border: '1px solid var(--bottom-bar-border)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 4px 20px var(--shadow-color)',
      }}
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={isListening ? { scale: [1, 1.15, 1], opacity: [0.85, 1, 0.85] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-9 h-9 rounded-full flex items-center justify-center shadow-md"
          style={{ background: 'linear-gradient(135deg, var(--color-accent1), var(--color-accent2))' }}
        >
          <Mic className="text-white w-4 h-4" />
        </motion.div>

        <div className="flex items-center gap-2">
          <span className="font-medium text-sm" style={{ color: 'var(--color-accent1)' }}>
            {isListening ? 'Listening...' : 'Ready'}
          </span>
          {isListening && (
            <Activity className="w-3.5 h-3.5 animate-pulse" style={{ color: 'var(--color-accent1)' }} />
          )}
          {wakeWordEnabled && !isListening && (
            <div className="wake-badge">
              <div className="wake-dot" />
              ARIA ACTIVE
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 font-semibold tracking-wider text-xs" style={{ color: 'var(--text-dim)' }}>
          <Activity className="w-3.5 h-3.5" style={{ color: 'var(--color-accent2)' }} />
          VOICE ASSISTANT
        </div>

        <div className="no-drag flex items-center gap-2 mr-2" style={{ color: 'var(--text-muted)' }}>
          <button onClick={handleMin} className="hover:opacity-80 transition-opacity">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleMax} className="hover:opacity-80 transition-opacity">
            <Square className="w-3 h-3" />
          </button>
          <button onClick={handleClose} className="hover:text-red-500 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingPill;
