import React, { useState, useRef } from 'react';
import { Settings, HelpCircle, Mic, Send, X, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CommandSuggestions from './CommandSuggestions';

const Waveform = ({ isListening }) => (
  <div className="flex items-center gap-[3px] mx-3">
    {[...Array(10)].map((_, i) => (
      <motion.div
        key={i}
        className="w-[3px] rounded-full"
        style={{ background: 'linear-gradient(to top, var(--color-accent1), var(--color-accent2))' }}
        animate={isListening
          ? { height: [3, Math.random() * 18 + 8, 3] }
          : { height: 3 }}
        transition={{ repeat: Infinity, duration: 0.45 + Math.random() * 0.4, delay: i * 0.08 }}
      />
    ))}
  </div>
);

const BottomBar = ({ isListening, onToggleListen, onTextSubmit, onOpenSettings }) => {
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [inputText, setInputText] = useState('');
  const inputRef = useRef(null) ;

  const handleSubmit = (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (text && onTextSubmit) {
      onTextSubmit(text);
      setInputText('');
      setIsKeyboardMode(false);
    }
  };

  const handleSuggestionSelect = (cmd) => {
    setInputText(cmd);
    // submit immediately
    if (onTextSubmit) {
      onTextSubmit(cmd);
      setInputText('');
      setIsKeyboardMode(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsKeyboardMode(false);
      setInputText('');
    }
  };

  return (
    <div
      className="drag-region fixed bottom-5 left-1/2 -translate-x-1/2 px-5 py-3 flex items-center justify-between"
      style={{
        background: 'var(--bottom-bar-bg)',
        border: '1px solid var(--bottom-bar-border)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        minWidth: '520px',
        boxShadow: '0 8px 32px var(--shadow-color)',
      }}
    >
      {/* Left buttons */}
      <div className="no-drag flex items-center gap-2">
        <button
          id="btn-settings"
          onClick={onOpenSettings}
          className="icon-btn"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Center */}
      <div className="no-drag flex items-center absolute left-1/2 -translate-x-1/2 justify-center w-[320px]">
        <AnimatePresence mode="wait">
          {isKeyboardMode ? (
            <motion.div
              key="keyboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="relative w-full"
            >
              <CommandSuggestions query={inputText} onSelect={handleSuggestionSelect} />
              <form
                onSubmit={handleSubmit}
                className="flex items-center w-full gap-2 rounded-full px-2 py-1"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-accent)' }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  autoFocus
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command..."
                  className="flex-1 bg-transparent border-none outline-none text-sm px-2 py-2"
                  style={{ color: 'var(--text-primary)' }}
                />
                <button
                  type="button"
                  onClick={() => { setIsKeyboardMode(false); setInputText(''); }}
                  className="icon-btn w-6 h-6 p-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  type="submit"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(135deg, var(--color-accent1), var(--color-accent2))' }}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="mic"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="flex items-center"
            >
              <Waveform isListening={isListening} />
              <motion.button
                id="btn-mic"
                onClick={onToggleListen}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                animate={isListening
                  ? { boxShadow: '0 0 24px 8px rgba(255,95,109,0.45)' }
                  : { boxShadow: '0 0 0px 0px rgba(255,95,109,0)' }
                }
                className="w-14 h-14 rounded-full flex items-center justify-center relative z-10 transition-colors"
                style={isListening
                  ? { background: 'linear-gradient(135deg, var(--color-accent1), var(--color-accent2))' }
                  : { background: 'var(--btn-bg)', border: '2px solid var(--border)' }
                }
              >
                <Mic className={`w-7 h-7 ${isListening ? 'text-white' : ''}`}
                  style={!isListening ? { color: 'var(--text-muted)' } : {}} />
              </motion.button>
              <Waveform isListening={isListening} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right buttons */}
      <div className="no-drag flex items-center gap-2">
        <button
          id="btn-keyboard"
          onClick={() => setIsKeyboardMode(!isKeyboardMode)}
          className={`icon-btn ${isKeyboardMode ? 'active' : ''}`}
          title="Type command"
        >
          <Keyboard className="w-4 h-4" />
        </button>
        <button
          id="btn-help"
          onClick={() => onTextSubmit && onTextSubmit('help')}
          className="icon-btn"
          title="Show help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default BottomBar;
