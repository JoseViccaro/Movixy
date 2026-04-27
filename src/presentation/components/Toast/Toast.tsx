import { type ReactNode, useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { ToastContext } from './ToastContext';
import type { Toast } from './types';

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: Toast['type'], message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 9999,
      }}
      role="region"
      aria-label="Notificaciones"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };
  
  const colors = {
    success: '#46d369',
    error: '#e50914',
    info: '#0080ff',
    warning: '#f5a623',
  };

  const Icon = icons[toast.type];
  const color = colors[toast.type];

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="alert"
      style={{
        backgroundColor: '#232323',
        color: 'white',
        padding: '14px 16px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '280px',
        maxWidth: '400px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        animation: 'slideIn 0.3s ease-out',
        borderLeft: `4px solid ${color}`,
      }}
    >
      <Icon size={20} color={color} aria-hidden="true" />
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={onClose}
        aria-label="Cerrar notificación"
        style={{
          background: 'none',
          border: 'none',
          color: '#a3a3a3',
          cursor: 'pointer',
          padding: '4px',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default ToastProvider;