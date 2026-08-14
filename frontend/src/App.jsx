import React, { useState, useEffect, useRef, useCallback } from 'react';
import FloatingPill from './components/FloatingPill';
import ChatPanel from './components/ChatPanel';
import BottomBar from './components/BottomBar';
import SettingsPanel from './components/SettingsPanel';
import NotificationToast from './components/NotificationToast';

let _notifId = 0;
const makeId = () => ++_notifId;

function App() {
  const [isListening, setIsListening] = useState(false);
  const [history, setHistory] = useState([]);
  const [statusText, setStatusText] = useState('Ready');
  const [settings, setSettings] = useState({
    tts_enabled: true,
    theme: 'dark',
    voice_speed: 160,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const wsRef = useRef(null);

  // ── Apply theme to <html> ─────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.body.style.background = 'var(--bg)';
  }, [settings.theme]);

  // ── Dismiss notification ─────────────────────────────────────────────
  const dismissNotif = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // ── Add notification ─────────────────────────────────────────────────
  const addNotif = useCallback((kind, title, message) => {
    const id = makeId();
    setNotifications(prev => [...prev, { id, kind, title, message }]);
    // Auto-dismiss after 6 seconds
    setTimeout(() => dismissNotif(id), 6000);
  }, [dismissNotif]);

  // ── Export chat to .txt ───────────────────────────────────────────────
  const exportChat = useCallback((historyData) => {
    const lines = (historyData || history).map(msg =>
      `[${msg.role?.toUpperCase() || 'MSG'}] ${msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}\n${msg.content}\n`
    );
    const blob = new Blob([lines.join('\n---\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice_assistant_chat_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addNotif('success', 'Chat Exported', 'Chat history downloaded as .txt');
  }, [history, addNotif]);

  // ── WebSocket connection ──────────────────────────────────────────────
  useEffect(() => {
    let destroyed = false;       // guard against StrictMode / HMR ghost
    let reconnectTimer = null;

    const connect = () => {
      if (destroyed) return;

      const ws = new WebSocket('ws://127.0.0.1:8000/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        if (destroyed) { ws.close(); return; }   // StrictMode safety
        setStatusText('Ready');
      };

      ws.onmessage = (event) => {
        if (destroyed) return;
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'history':
            setHistory(msg.data || []);
            break;

          case 'settings':
            setSettings(msg.data || {});
            break;

          case 'transcript': {
            const entry = {
              role:        msg.role,
              content:     msg.text,
              data:        msg.data,
              success:     msg.success,
              intent_type: msg.intent_type,
              timestamp:   new Date().toISOString(),
            };
            setHistory(prev => [...prev, entry]);
            if (msg.role === 'assistant' || msg.role === 'user') {
              setIsListening(false);
              setStatusText('Ready');
            }
            break;
          }

          case 'status':
            setStatusText(msg.text);
            if (/Timed out|couldn't understand|Error|Could not/i.test(msg.text)) {
              setIsListening(false);
            }
            break;

          case 'clear':
            setHistory([]);
            setStatusText('Ready');
            break;

          case 'theme':
            setSettings(prev => ({ ...prev, theme: msg.theme }));
            break;

          case 'export_chat':
            exportChat(msg.data);
            break;

          case 'timer_done':
            addNotif('timer_done', 'Timer Done! ⏰', msg.text);
            setHistory(prev => [...prev, {
              role: 'assistant',
              content: msg.text,
              success: true,
              intent_type: 'timer_done',
              timestamp: new Date().toISOString(),
            }]);
            break;

          case 'reminder_done':
            addNotif('reminder_done', '🔔 Reminder!', msg.text);
            setHistory(prev => [...prev, {
              role: 'assistant',
              content: msg.text,
              success: true,
              intent_type: 'reminder_done',
              timestamp: new Date().toISOString(),
            }]);
            break;

          case 'wake_word_triggered':
            // Wake word fired — auto-start listening
            addNotif('info', '🎙️ ARIA Activated', 'Wake word detected — listening...');
            setIsListening(true);
            setStatusText('Listening... 🎙️');
            send({ action: 'start_listening' });
            break;

          default:
            break;
        }
      };

      ws.onclose = (evt) => {
        if (destroyed) return;
        setIsListening(false);
        // evt.code 1000 = normal close (user closed browser tab, etc.)
        // Only auto-reconnect on unexpected disconnect
        if (evt.code !== 1000) {
          setStatusText('Disconnected — reconnecting in 3s...');
          reconnectTimer = setTimeout(connect, 3000);
        } else {
          setStatusText('Disconnected — make sure backend is running.');
        }
      };

      ws.onerror = () => {
        if (destroyed) return;
        setStatusText('Cannot reach backend — is main.py running?');
        // onclose will fire after onerror, so reconnect handled there
      };
    };

    connect();

    return () => {
      destroyed = true;
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close(1000, 'component unmount');
        wsRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  // ── Helpers ───────────────────────────────────────────────────────────
  const send = (payload) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addNotif('error', 'Not Connected', 'Backend is not running. Start main.py first.');
      return;
    }
    wsRef.current.send(JSON.stringify(payload));
  };

  const handleToggleListen = () => {
    if (isListening) {
      setIsListening(false);
      setStatusText('Ready');
    } else {
      setIsListening(true);
      setStatusText('Listening... 🎤');
      send({ action: 'start_listening' });
    }
  };

  const handleTextCommand = (text) => {
    send({ action: 'text_command', text });
  };

  const handleClearChat = () => {
    send({ action: 'clear_chat' });
  };

  const handleUpdateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    send({ action: 'update_settings', key, value });
  };

  const handleExportChat = () => {
    send({ action: 'text_command', text: 'export chat' });
  };

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-screen relative overflow-hidden font-sans" style={{ background: 'var(--bg)' }}>
      {/* Subtle background gradient orb */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-accent1), transparent 70%)', filter: 'blur(60px)' }}
      />

      <FloatingPill isListening={isListening} theme={settings.theme} wakeWordEnabled={settings.wake_word_enabled} />

      <ChatPanel
        history={history}
        statusText={statusText}
        isListening={isListening}
        onClearChat={handleClearChat}
      />

      {/* Settings panel overlay */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onUpdateSetting={handleUpdateSetting}
          onExportChat={handleExportChat}
          onClose={() => setShowSettings(false)}
        />
      )}

      <BottomBar
        isListening={isListening}
        onToggleListen={handleToggleListen}
        onTextSubmit={handleTextCommand}
        onOpenSettings={() => setShowSettings(prev => !prev)}
      />

      {/* Toast notifications */}
      <NotificationToast notifications={notifications} onDismiss={dismissNotif} />
    </div>
  );
}

export default App;
