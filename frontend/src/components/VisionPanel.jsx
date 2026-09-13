import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Camera } from 'lucide-react';

/**
 * VisionPanel — Shows YOLO webcam stream + detections list
 * Receives vision_frame WebSocket messages from backend
 */
const VisionPanel = ({ frame, detections = [], isRunning, onStop }) => {
  return (
    <AnimatePresence>
      {isRunning && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="mx-4 mb-2 relative overflow-hidden"
          style={{
            background: 'rgba(0,10,22,0.98)',
            border: '1px solid rgba(0,212,255,0.35)',
            borderRadius: '4px',
            boxShadow: '0 0 20px rgba(0,212,255,0.1)',
          }}
        >
          {/* Corner decorations */}
          <div className="corner-tl" />
          <div className="corner-tr" />
          <div className="corner-bl" />
          <div className="corner-br" />

          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid rgba(0,212,255,0.15)', background: 'rgba(0,12,28,0.6)' }}>
            <div className="flex items-center gap-2">
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px rgba(0,255,136,0.8)' }} />
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, color: '#00d4ff', letterSpacing: '2px' }}>
                ARIA // VISION ACTIVE
              </span>
            </div>
            <button onClick={onStop} className="icon-btn" style={{ width: 24, height: 24, padding: 0 }} title="Stop vision">
              <EyeOff style={{ width: 11, height: 11 }} />
            </button>
          </div>

          <div className="flex gap-0">
            {/* Camera feed */}
            <div className="relative flex-1" style={{ minHeight: 160 }}>
              {frame ? (
                <img
                  src={`data:image/jpeg;base64,${frame}`}
                  alt="ARIA Vision"
                  className="w-full"
                  style={{ display: 'block', borderRadius: '0 0 0 3px', maxHeight: 200, objectFit: 'cover' }}
                />
              ) : (
                <div className="flex items-center justify-center" style={{ height: 160 }}>
                  <div className="text-center">
                    <Camera style={{ width: 24, height: 24, color: 'rgba(0,212,255,0.3)', margin: '0 auto 8px' }} />
                    <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'rgba(0,212,255,0.3)', letterSpacing: '1px' }}>
                      INITIALIZING CAMERA...
                    </p>
                  </div>
                </div>
              )}
              {/* Scan overlay */}
              <div className="scan-line" />
              {/* Corner brackets on feed */}
              <div style={{ position: 'absolute', top: 8, left: 8, width: 16, height: 16, borderTop: '2px solid #00d4ff', borderLeft: '2px solid #00d4ff', opacity: 0.7 }} />
              <div style={{ position: 'absolute', top: 8, right: 8, width: 16, height: 16, borderTop: '2px solid #00d4ff', borderRight: '2px solid #00d4ff', opacity: 0.7 }} />
              <div style={{ position: 'absolute', bottom: 8, left: 8, width: 16, height: 16, borderBottom: '2px solid #00d4ff', borderLeft: '2px solid #00d4ff', opacity: 0.7 }} />
              <div style={{ position: 'absolute', bottom: 8, right: 8, width: 16, height: 16, borderBottom: '2px solid #00d4ff', borderRight: '2px solid #00d4ff', opacity: 0.7 }} />
            </div>

            {/* Detections list */}
            <div style={{ width: 140, borderLeft: '1px solid rgba(0,212,255,0.15)', padding: '8px', overflowY: 'auto', maxHeight: 200 }}>
              <p style={{ fontFamily: "'Orbitron', monospace", fontSize: 8, color: '#00d4ff', letterSpacing: '1.5px', marginBottom: 6 }}>
                DETECTED
              </p>
              {detections.length === 0 ? (
                <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: 'rgba(0,212,255,0.3)', letterSpacing: '0.5px' }}>
                  SCANNING...
                </p>
              ) : (
                detections.map((d, i) => (
                  <div key={i} className="flex items-center justify-between mb-1">
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>
                      ▸ {d.label}
                    </span>
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: d.confidence > 0.7 ? '#00ff88' : '#ff9f43', flexShrink: 0 }}>
                      {Math.round(d.confidence * 100)}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VisionPanel;
