import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((t) => {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, ...t }]);
    if (!t.sticky) setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), t.duration || 4000);
  }, []);

  const hide = useCallback((id) => setToasts((s) => s.filter((t) => t.id !== id)), []);

  return (
    <ToastContext.Provider value={{ show, hide }}>
      {children}
      <div style={{ position: 'fixed', right: 16, top: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ background: 'rgba(0,0,0,0.85)', color: '#fff', padding: '10px 14px', borderRadius: 8, minWidth: 180 }}>
            {t.title && <div style={{ fontWeight: '600', marginBottom: 4 }}>{t.title}</div>}
            <div>{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
