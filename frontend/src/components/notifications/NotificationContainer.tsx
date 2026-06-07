import { useNotification } from '@/contexts/NotificationContext';
import NotificationItem from './NotificationItem';

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        maxWidth: 400,
        pointerEvents: 'none',
      }}
    >
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}
