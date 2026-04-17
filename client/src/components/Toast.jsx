import { useState, useEffect } from 'react';

const Toast = ({ message, icon = '✅', show, onHide }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onHide, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  return (
    <div className={`toast ${show ? 'show' : ''}`}>
      <span className="toast-icon">{icon}</span>
      <span>{message}</span>
    </div>
  );
};

// Hook for easy toast usage
export const useToast = () => {
  const [toast, setToast] = useState({ show: false, message: '', icon: '✅' });

  const showToast = (message, icon = '✅') => {
    setToast({ show: true, message, icon });
  };

  const hideToast = () => setToast((t) => ({ ...t, show: false }));

  return { toast, showToast, hideToast };
};

export default Toast;
