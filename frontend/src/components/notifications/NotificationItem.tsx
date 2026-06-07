import { useState, useEffect } from 'react';
import { Icon } from '@/components/ui';
import type { Notification, NotificationType } from '@/contexts/NotificationContext';

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

const typeConfig: Record<NotificationType, { bg: string; border: string; text: string; icon: string }> = {
  success: {
    bg: 'var(--success-50)',
    border: '1px solid var(--success-200)',
    text: 'var(--success-700)',
    icon: 'check-circle',
  },
  error: {
    bg: 'var(--error-100)',
    border: '1px solid var(--error-200)',
    text: 'var(--error-700)',
    icon: 'alert-circle',
  },
  info: {
    bg: 'var(--blue-50)',
    border: '1px solid var(--blue-200)',
    text: 'var(--blue-700)',
    icon: 'info',
  },
  warning: {
    bg: 'var(--warning-50)',
    border: '1px solid var(--warning-200)',
    text: 'var(--warning-700)',
    icon: 'alert-triangle',
  },
};

export default function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const [isExiting, setIsExiting] = useState(false);
  const config = typeConfig[notification.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 200);
    }, (notification.duration || 4000) - 200);

    return () => clearTimeout(timer);
  }, [notification.duration, onClose]);

  return (
    <div
      role="alert"
      style={{
        background: config.bg,
        border: config.border,
        borderRadius: 'var(--r-md)',
        padding: '12px 16px',
        color: config.text,
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        pointerEvents: 'auto',
        animation: isExiting ? 'fadeOut 0.2s ease-out' : 'slideIn 0.2s ease-out',
        boxShadow: 'var(--shadow-md)',
        maxWidth: '100%',
        wordWrap: 'break-word',
      }}
    >
      <Icon name={config.icon as any} size={16} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{notification.message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          opacity: 0.6,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
        aria-label="Close notification"
      >
        <Icon name="x" size={16} />
      </button>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(400px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(400px);
          }
        }
      `}</style>
    </div>
  );
}
