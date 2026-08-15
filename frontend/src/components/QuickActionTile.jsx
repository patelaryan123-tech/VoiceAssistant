import React from 'react';
import { motion } from 'framer-motion';

const QuickActionTile = ({ icon, label, onClick, color = 'var(--color-accent1)', disabled = false }) => {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.06, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      onClick={disabled ? undefined : onClick}
      className="quick-tile"
      style={{
        '--tile-color': color,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      title={label}
    >
      <span className="quick-tile-icon">{icon}</span>
      <span className="quick-tile-label">{label}</span>
      <div className="quick-tile-glow" />
    </motion.button>
  );
};

export default QuickActionTile;
