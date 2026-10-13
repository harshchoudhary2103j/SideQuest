import { createContext } from 'react';
import type { ToastType } from '../../../types';

export interface ToastContextValue {
  showToast: (options: {
    type?: ToastType;
    title: string;
    message?: string;
    duration?: number;
  }) => string;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);
