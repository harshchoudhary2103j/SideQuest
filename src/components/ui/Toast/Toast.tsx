import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import type { ToastItem } from '../../../types';
import styles from './Toast.module.css';

export interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const renderIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={16} />;
      case 'error':
        return <AlertCircle size={16} />;
      case 'warning':
        return <AlertTriangle size={16} />;
      case 'info':
      default:
        return <Info size={16} />;
    }
  };

  return (
    <div
      className={`${styles.toast} ${styles[toast.type]}`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.iconWrap}>{renderIcon()}</div>
      <div className={styles.body}>
        <div className={styles.title}>{toast.title}</div>
        {toast.message && <div className={styles.message}>{toast.message}</div>}
      </div>
      <button
        type="button"
        className={styles.closeButton}
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};
