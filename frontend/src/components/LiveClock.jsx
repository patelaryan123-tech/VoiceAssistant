import React, { useEffect, useState } from 'react';

const LiveClock = ({ compact = false }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const date = now.toLocaleDateString('en-IN', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  }).toUpperCase();

  if (compact) {
    return (
      <div className="live-clock-compact no-drag select-none" title={date}>
        <span className="clock-hm">{hh}:{mm}</span>
        <span className="clock-s">:{ss}</span>
      </div>
    );
  }

  return (
    <div className="live-clock-widget select-none">
      <div className="clock-time-row">
        <span className="clock-hm">{hh}:{mm}</span>
        <span className="clock-s">:{ss}</span>
      </div>
      <div className="clock-date">{date}</div>
    </div>
  );
};

export default LiveClock;
