import React from 'react';
import { BookOpen } from 'lucide-react';

/**
 * AdminLoader Component
 * A premium dynamic loader for the admin side that matches the LMS theme.
 * 
 * @param {Object} props
 * @param {boolean} props.fullScreen - If true, the loader will cover the entire screen.
 * @param {string} props.message - The loading message to display.
 * @param {string} props.className - Additional classes for the wrapper.
 * @param {string} props.type - The type of loader ('spinner', 'pulse', 'dots').
 */
const AdminLoader = ({ 
  fullScreen = false, 
  message = "Loading...", 
  className = "",
  type = "spinner"
}) => {
  const containerClasses = fullScreen 
    ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/90 backdrop-blur-md"
    : `flex flex-col items-center justify-center p-12 w-full h-full min-h-[300px] ${className}`;

  const renderLoader = () => {
    switch (type) {
      case "dots":
        return (
          <div className="flex space-x-3">
            <div className="w-5 h-5 bg-leafGreen rounded-full animate-dotBounce shadow-lg shadow-leafGreen/20"></div>
            <div className="w-5 h-5 bg-forestGreen rounded-full animate-dotBounce [animation-delay:0.2s] shadow-lg shadow-forestGreen/20"></div>
            <div className="w-5 h-5 bg-leafGreen rounded-full animate-dotBounce [animation-delay:0.4s] shadow-lg shadow-leafGreen/20"></div>
          </div>
        );
      case "pulse":
        return (
          <div className="relative flex items-center justify-center">
            <div className="absolute w-24 h-24 bg-leafGreen/20 rounded-full animate-ping"></div>
            <div className="absolute w-32 h-32 bg-leafGreen/10 rounded-full animate-[pulseRing_2s_infinite]"></div>
            <div className="relative w-16 h-16 bg-gradient-to-br from-leafGreen to-forestGreen rounded-2xl shadow-xl flex items-center justify-center transform rotate-45 animate-floatUp">
               <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin -rotate-45"></div>
            </div>
          </div>
        );
      case "spinner":
      default:
        return (
          <div className="relative group">
            {/* Main spinning ring with gradient */}
            <div className="w-20 h-20 border-4 border-transparent border-t-leafGreen border-r-leafGreen/50 rounded-full animate-spin"></div>
            
            {/* Middle counter-spinning ring
            <div className="absolute top-2 left-2 w-20 h-20 border-2 border-transparent border-b-forestGreen border-l-forestGreen/30 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
             */}
            {/* Center glow with icon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-tr from-leafGreen to-forestGreen rounded-full shadow-2xl flex items-center justify-center overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer skew-x-12"></div>
               <BookOpen className="text-white w-6 h-6 animate-pulse" />
            </div>
          </div>
        );
    }
  };

  return (
    <div className={containerClasses} id="admin-dynamic-loader">
      <div className="relative mb-10">
        {renderLoader()}
      </div>
      
      {message && (
        <div className="flex flex-col items-center space-y-3">
          <p className="text-forestGreen font-bold text-xl tracking-tight animate-pulse text-center max-w-xs">
            {message}
          </p>
          
          <div className="flex items-center gap-1.5">
             <span className="w-1.5 h-1.5 bg-leafGreen rounded-full animate-bounce [animation-delay:0.1s]"></span>
             <span className="w-1.5 h-1.5 bg-leafGreen rounded-full animate-bounce [animation-delay:0.2s]"></span>
             <span className="w-1.5 h-1.5 bg-leafGreen rounded-full animate-bounce [animation-delay:0.3s]"></span>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes shimmer-progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer-progress {
          animation: shimmer-progress 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(150%) skewX(-20deg); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default AdminLoader;
