import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ALL_COMMANDS = [
  "weather in Mumbai", "weather in Delhi", "who is Elon Musk", "what is quantum computing",
  "calculate 25 times 48", "calculate 100 divided by 4", "convert 100 USD to INR",
  "convert 50 EUR to GBP", "set timer for 5 minutes", "set timer for 30 seconds",
  "news", "news about cricket", "news about technology", "search for Python tutorials",
  "volume up", "volume down", "mute", "unmute", "set volume to 50",
  "take a screenshot", "battery level", "shutdown", "restart", "lock screen",
  "cancel shutdown", "open notepad", "open chrome", "open calculator", "open paint",
  "close chrome", "kill notepad",
  "open file resume.pdf", "list files in downloads", "list files in documents",
  "find all pdf files", "find all mp4 files", "find all txt files",
  "where is my report file", "find video lecture",
  "create file notes.txt in desktop", "delete file old.txt from desktop",
  "rename file old.txt to new.txt in documents", "move file photo.jpg to pictures",
  "dark mode", "light mode", "export chat", "clear chat",
  "what's the time", "today's date",
  "open vscode", "open youtube", "open github", "open google",
  "open downloads folder", "open desktop folder", "open documents folder",
  "help", "exit",
];

const CommandSuggestions = ({ query, onSelect }) => {
  const suggestions = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return ALL_COMMANDS.filter(cmd => cmd.includes(q)).slice(0, 5);
  }, [query]);

  return (
    <AnimatePresence>
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="absolute bottom-full mb-2 left-0 right-0 rounded-xl overflow-hidden shadow-xl z-50"
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-accent)',
            boxShadow: '0 -8px 30px var(--shadow-color)',
          }}
        >
          {suggestions.map((cmd, i) => (
            <motion.button
              key={cmd}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onSelect(cmd)}
              className="no-drag w-full text-left px-4 py-2.5 text-xs font-mono transition-colors flex items-center gap-2"
              style={{ color: 'var(--text-dim)', borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span className="text-[10px]" style={{ color: 'var(--color-accent1)' }}>▸</span>
              <span>{cmd}</span>
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandSuggestions;
