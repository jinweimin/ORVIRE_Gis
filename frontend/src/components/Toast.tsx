import { useEffect } from 'react';
import { useAppStore } from '../store';

export default function Toast() {
  const { toasts, removeToast } = useAppStore();

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastItem key={toast.id} id={toast.id} type={toast.type} message={toast.message} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ id, type, message, onRemove }: { id: string; type: string; message: string; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), 3000);
    return () => clearTimeout(timer);
  }, [id, onRemove]);

  const icons: Record<string, string> = { success: '✅', warning: '⚠️', error: '❌' };

  return (
    <div className={`toast-item toast-${type}`} onClick={() => onRemove(id)}>
      <span className="toast-icon">{icons[type] || 'ℹ️'}</span>
      <span className="toast-msg">{message}</span>
    </div>
  );
}
