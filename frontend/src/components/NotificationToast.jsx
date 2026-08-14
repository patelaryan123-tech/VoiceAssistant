import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ICONS = {
  timer_done:    <Bell className="w-4 h-4" />,
  reminder_done: <Bell className="w-4 h-4" />,
  success:       <CheckCircle className="w-4 h-4" />,
  error:         <AlertCircle className="w-4 h-4" />,
  info:          <Info className="w-4 h-4" />,
};

const COLORS = {
  timer_done:    'from-purple-500 to-indigo-500',
  reminder_done: 'from-orange-500 to-amber-400',
  success:       'from-emerald-500 to-green-400',
  error:         'from-red-500 to-rose-400',
  info:          'from-blue-500 to-cyan-400',
};

const NotificationToast = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed top-16 right-4 z-[100] space-y-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl max-w-xs"
            style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-accent)',
              boxShadow: '0 8px 32px var(--shadow-color)',
            }}
          >
            {/* Icon gradient badge */}
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${COLORS[notif.kind] || COLORS.info} flex items-center justify-center text-white shrink-0 mt-0.5`}>
              {ICONS[notif.kind] || ICONS.info}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
                {notif.title || 'Notification'}
              </p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {notif.message}
              </p>
            </div>

            <button
              onClick={() => onDismiss(notif.id)}
              className="icon-btn shrink-0 w-6 h-6 p-0"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationToast;
