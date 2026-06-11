// components/student/Modal.jsx
import { useEffect } from "react";

export default function Modal({ children, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      ></div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}