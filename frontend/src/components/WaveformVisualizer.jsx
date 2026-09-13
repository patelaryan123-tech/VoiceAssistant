import React, { useRef, useEffect, useCallback } from 'react';

/**
 * WaveformVisualizer — Real-time microphone waveform via Web Audio API
 * Shows animated JARVIS-style bar chart when mic is active
 */
const WaveformVisualizer = ({ isListening, height = 48 }) => {
  const canvasRef  = useRef(null);
  const animRef    = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef  = useRef(null);
  const streamRef  = useRef(null);
  const ctxRef     = useRef(null);

  const stopMic = useCallback(() => {
    if (animRef.current)   { cancelAnimationFrame(animRef.current); animRef.current = null; }
    if (sourceRef.current) { try { sourceRef.current.disconnect(); } catch {} sourceRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    analyserRef.current = null;
    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx2d = canvas.getContext('2d');
      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.75;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      draw();
    } catch (e) {
      console.warn('[Waveform] Mic access denied:', e);
    }
  }, []);

  const draw = useCallback(() => {
    const canvas   = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx2d = canvas.getContext('2d');
    const W     = canvas.width;
    const H     = canvas.height;
    const data  = new Uint8Array(analyser.frequencyBinCount);

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      analyser.getByteFrequencyData(data);

      ctx2d.clearRect(0, 0, W, H);

      const barCount = data.length;
      const barW     = W / barCount - 1;

      for (let i = 0; i < barCount; i++) {
        const value   = data[i] / 255;
        const barH    = value * H * 0.9;
        const x       = i * (barW + 1);
        const y       = H - barH;

        // Cyan → green gradient based on value
        const r = Math.round(0   + value * 0);
        const g = Math.round(212 - value * 100);
        const b = Math.round(255 - value * 100);
        const alpha = 0.5 + value * 0.5;

        ctx2d.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx2d.shadowColor  = `rgba(0,212,255,${value * 0.8})`;
        ctx2d.shadowBlur   = value * 8;
        ctx2d.fillRect(x, y, barW, barH);
        ctx2d.shadowBlur = 0;
      }
    };
    animate();
  }, []);

  useEffect(() => {
    if (isListening) {
      startMic();
    } else {
      stopMic();
      // Draw idle bars
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx2d = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;
        ctx2d.clearRect(0, 0, W, H);
        const barCount = 32;
        const barW     = W / barCount - 1;
        for (let i = 0; i < barCount; i++) {
          const x = i * (barW + 1);
          const h = 2 + Math.sin(i * 0.5) * 2;
          ctx2d.fillStyle = 'rgba(0,212,255,0.18)';
          ctx2d.fillRect(x, H - h, barW, h);
        }
      }
    }
    return () => stopMic();
  }, [isListening, startMic, stopMic]);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height,
        background: 'rgba(0,212,255,0.03)',
        border: '1px solid rgba(0,212,255,0.1)',
        borderRadius: '3px',
      }}
    >
      <canvas
        ref={canvasRef}
        width={600}
        height={height}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      {isListening && (
        <div
          className="absolute top-1 right-2 text-[8px] tracking-widest"
          style={{ fontFamily: "'Share Tech Mono', monospace", color: '#00ff88', letterSpacing: '1.5px' }}
        >
          ● LIVE
        </div>
      )}
    </div>
  );
};

export default WaveformVisualizer;
