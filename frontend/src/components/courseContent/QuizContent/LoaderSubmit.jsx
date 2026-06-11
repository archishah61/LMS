// LoaderSubmit.jsx
import React from "react";
import { FaSpinner } from "react-icons/fa";

const LoaderSubmit = ({ message = "Submitting your quiz..." }) => {
  return (
    <>
      <style>{`
        @keyframes indeterminate {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(166%);
          }
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
      
      <div 
        className="fixed inset-0 flex items-center justify-center bg-slate-800/60 backdrop-blur-sm z-50"
        aria-live="polite"
        role="status"
      >
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <FaSpinner className="text-indigo-600 text-4xl animate-spin" />
              <div className="absolute inset-0 rounded-full opacity-10 animate-ping bg-indigo-400"></div>
            </div>
            
            <h3 className="text-lg font-semibold text-slate-900">
              {message}
            </h3>
            
            <p className="text-sm text-slate-600">
              Please wait while we process your responses.
            </p>
            
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-indigo-600 h-full animate-indeterminate"
                style={{
                  animation: 'indeterminate 2s ease-in-out infinite',
                  width: '60%'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoaderSubmit;