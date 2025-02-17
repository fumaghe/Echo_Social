import React from 'react';
import { useToast } from '../context/ToastContext';

export function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-2 rounded shadow-lg text-white 
            ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
