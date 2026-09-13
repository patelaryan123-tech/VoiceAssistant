import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Shield, CheckCircle, XCircle } from 'lucide-react';
import ArcReactor3D from './ArcReactor3D';

const CORRECT_PIN = '3012'; // default — changeable in settings

const PinDot = ({ filled }) => (
  <motion.div
    animate={{ scale: filled ? 1 : 0.5, opacity: filled ? 1 : 0.3 }}
    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    style={{
      width: 12, height: 12,
      borderRadius: '50%',
      background: filled ? '#00d4ff' : 'transparent',
      border: `1px solid ${filled ? '#00d4ff' : 'rgba(0,212,255,0.4)'}`,
      boxShadow: filled ? '0 0 10px rgba(0,212,255,0.8)' : 'none',
    }}
  />
);

const PinLockScreen = ({
  onUnlock,
  onVerify,
  status = 'idle',
  setStatus,
  lockoutTime = 0,
  setLockoutTime,
  jarvisMode = false
}) => {
  const [pin, setPin]             = useState('');
  const [shake, setShake]         = useState(false);
  const [locked, setLocked]       = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  const timerRef = useRef(null);

  // Sync lockout countdown when prop changes
  useEffect(() => {
    if (lockoutTime > 0) {
      setLockTimer(lockoutTime);
      setLocked(true);
    }
  }, [lockoutTime]);

  useEffect(() => {
    if (locked && lockTimer > 0) {
      timerRef.current = setTimeout(() => {
        setLockTimer(t => {
          if (t <= 1) {
            setLocked(false);
            if (setLockoutTime) setLockoutTime(0);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [locked, lockTimer, setLockoutTime]);

  // Handle shake and reset on error status
  useEffect(() => {
    if (status === 'error') {
      setShake(true);
      const timer = setTimeout(() => {
        setPin('');
        setShake(false);
        if (setStatus) setStatus('idle');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [status, setStatus]);

  const handleDigit = (d) => {
    if (locked || status !== 'idle') return;
    const newPin = pin + d;
    setPin(newPin);
    if (newPin.length === 4) {
      onVerify(newPin);
    }
  };

  const handleBackspace = () => {
    if (locked || status !== 'idle') return;
    setPin(p => p.slice(0, -1));
  };

  const digits = [
    ['1','2','3'],
    ['4','5','6'],
    ['7','8','9'],
    ['⌫','0','✓'],
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{
        backgroundColor: '#010810',
        backgroundImage: 'linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(180deg, #010810 0%, #020d1a 100%)',
        backgroundSize: '60px 60px, 60px 60px, 100% 100%',
      }}
    >
      {/* Corner decorations */}
      <div className="corner-tl" style={{ position: 'fixed', top: 16, left: 16 }} />
      <div className="corner-tr" style={{ position: 'fixed', top: 16, right: 16 }} />
      <div className="corner-bl" style={{ position: 'fixed', bottom: 16, left: 16 }} />
      <div className="corner-br" style={{ position: 'fixed', bottom: 16, right: 16 }} />

      {/* Glow orb */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(0,212,255,0.08), transparent 70%)',
        filter: 'blur(60px)',
      }} />

      <div className="flex flex-col items-center gap-6">
        {/* 3D Arc Reactor */}
        <ArcReactor3D isListening={status === 'success'} size={140} jarvisMode={jarvisMode} />

        {/* Title */}
        <div className="text-center">
          <p className="font-bold tracking-widest" style={{ fontFamily: "'Orbitron', monospace", color: jarvisMode ? '#ff4757' : '#00d4ff', fontSize: 18, letterSpacing: '4px', textShadow: jarvisMode ? '0 0 15px rgba(255,71,87,0.7)' : '0 0 15px rgba(0,212,255,0.7)' }}>
            {jarvisMode ? 'J.A.R.V.I.S.' : 'A.R.I.A.'}
          </p>
          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: jarvisMode ? 'rgba(255,71,87,0.4)' : 'rgba(0,212,255,0.4)', letterSpacing: '2.5px', marginTop: 4 }}>
            BIOMETRIC SECURITY ACTIVE
          </p>
        </div>

        {/* Status */}
        {locked ? (
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: '#ff4757', letterSpacing: '1px', textAlign: 'center' }}>
            <div>⛔ TOO MANY ATTEMPTS</div>
            <div style={{ color: 'rgba(255,71,87,0.6)', fontSize: 10, marginTop: 4 }}>RETRY IN {lockTimer}s</div>
          </div>
        ) : (
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(0,212,255,0.5)', letterSpacing: '2px' }}>
            {status === 'success' ? '✓ ACCESS GRANTED' : status === 'error' ? '✗ INVALID PIN' : status === 'verifying' ? '⏳ VERIFYING...' : 'ENTER ACCESS CODE'}
          </div>
        )}

        {/* PIN dots */}
        <motion.div
          animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex gap-3"
        >
          {[0, 1, 2, 3].map(i => (
            <PinDot key={i} filled={pin.length > i} />
          ))}
        </motion.div>

        {/* Keypad */}
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: 'repeat(3, 1fr)', width: 200 }}
        >
          {digits.flat().map((d) => (
            <motion.button
              key={d}
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                if (d === '⌫') handleBackspace();
                else if (d === '✓') pin.length === 4 && onVerify(pin);
                else handleDigit(d);
              }}
              disabled={locked}
              style={{
                height: 48,
                background: d === '✓'
                  ? 'rgba(0,212,255,0.12)'
                  : d === '⌫'
                  ? 'rgba(255,71,87,0.08)'
                  : 'rgba(0,212,255,0.06)',
                border: `1px solid ${d === '✓' ? 'rgba(0,212,255,0.35)' : d === '⌫' ? 'rgba(255,71,87,0.25)' : 'rgba(0,212,255,0.15)'}`,
                borderRadius: '3px',
                fontFamily: "'Orbitron', monospace",
                fontSize: d === '⌫' || d === '✓' ? 14 : 16,
                color: d === '⌫' ? '#ff4757' : '#00d4ff',
                cursor: locked ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {d}
            </motion.button>
          ))}
        </div>

        {/* Hint */}
        <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: 'rgba(0,212,255,0.2)', letterSpacing: '1px' }}>
          DEFAULT PIN: 3012 · CHANGE IN SETTINGS
        </p>
      </div>
    </motion.div>
  );
};

export default PinLockScreen;
