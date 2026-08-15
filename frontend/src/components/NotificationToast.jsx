import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, AlertCircle, Info, X, Timer } from 'lucide-react';

const ICONS = {
  timer_done:    <Timer style={{ width: 14, height: 14 }} />,
  reminder_done: <Bell style={{ width: 14, height: 14 }} />,
  success:       <CheckCircle style={{ width: 14, height: 14 }} />,
  error:         <AlertCircle style={{ width: 14, height: 14 }} />,
  info:          <Info style={{ width: 14, height: 14 }} />,
};

const COLORS = {
  timer_done:    { glow: 'rgba(168,85,247,0.8)', dim: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.35)', bar: '#a855f7' },
  reminder_done: { glow: 'rgba(255,159,67,0.8)',  dim: 'rgba(255,159,67,0.15)', border: 'rgba(255,159,67,0.35)',  bar: '#ff9f43' },
  success:       { glow: 'rgba(0,255,136,0.8)',   dim: 'rgba(0,255,136,0.12)',  border: 'rgba(0,255,136,0.3)',   bar: '#00ff88' },
  error:         { glow: 'rgba(255,71,87,0.8)',   dim: 'rgba(255,71,87,0.12)',  border: 'rgba(255,71,87,0.3)',   bar: '#ff4757' },
  info:          { glow: 'rgba(0,212,255,0.8)',   dim: 'rgba(0,212,255,0.1)',   border: 'rgba(0,212,255,0.3)',   bar: '#00d4ff' },
};

const DISMISS_MS = 6000;

const Toast = ({ notif, onDismiss }) => {
  const [progress, setProgress] = useState(100);
  const isUrgent = notif.kind === 'timer_done' || notif.kind === 'reminder_done';
  const c = COLORS[notif.kind] || COLORS.info;

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / DISMISS_MS) * 100);
      setProgress(pct);
      if (pct <= 0) clearInterval(id);
    }, 50);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="pointer-events-auto flex flex-col max-w-xs overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, rgba(0,18,36,0.98), rgba(0,10,22,0.98))',
        border: `1px solid ${c.border}`,
        borderRadius: '3px',
        boxShadow: `0 0 20px ${c.dim}, 0 8px 30px rgba(0,0,0,0.5)`,
      }}
    >
      {/* Corner decorations */}
      <div className="corner-tl" style={{ '--neon-border-color': c.bar }} />
      <div className="corner-br" style={{ '--neon-border-color': c.bar }} />

      <div className="flex items-start gap-3 px-4 py-3">
        {/* Icon */}
        <div
          className={`flex items-center justify-center shrink-0 mt-0.5 ${isUrgent ? 'animate-bounce' : ''}`}
          style={{
            width: 28, height: 28,
            background: c.dim,
            border: `1px solid ${c.border}`,
            borderRadius: '3px',
            color: c.bar,
            boxShadow: `0 0 10px ${c.dim}`,
          }}
        >
          {ICONS[notif.kind] || ICONS.info}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-bold leading-snug"
            style={{ fontFamily: "'Orbitron', monospace", color: c.bar, fontSize: 10, letterSpacing: '1px', textShadow: `0 0 6px ${c.glow}` }}
          >
            {notif.title || 'NOTIFICATION'}
          </p>
          <p
            className="text-xs mt-0.5 leading-relaxed"
            style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-muted)', fontSize: 10, letterSpacing: '0.3px' }}
          >
            {notif.message}
          </p>
        </div>

        <button
          onClick={() => onDismiss(notif.id)}
          className="icon-btn shrink-0"
          style={{ width: 22, height: 22, padding: 0 }}
        >
          <X style={{ width: 10, height: 10 }} />
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: 'rgba(0,212,255,0.08)' }}>
        <div
          style={{
            height: '100%',
            background: c.bar,
            width: `${progress}%`,
            boxShadow: `0 0 6px ${c.bar}`,
            transition: 'width 0.05s linear',
          }}
        />
      </div>
    </motion.div>
  );
};

const NotificationToast = ({ notifications, onDismiss }) => (
  <div className="fixed top-16 right-4 z-[100] space-y-2 pointer-events-none">
    <AnimatePresence>
      {notifications.map(notif => (
        <Toast key={notif.id} notif={notif} onDismiss={onDismiss} />
      ))}
    </AnimatePresence>
  </div>
);

export default NotificationToast;
