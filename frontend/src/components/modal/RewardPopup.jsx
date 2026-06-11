import React from 'react';
import { Award, X } from 'lucide-react';

const RewardPopup = ({ isOpen, onClose, points }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-lg w-[90%] sm:w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center p-6 sm:p-8 text-center">
          
          {/* Icon Circle */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-lightGreen rounded-full flex items-center justify-center mb-4 sm:mb-6 ring-4 ring-lightGreen/30">
            <Award className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
          </div>

          {/* Title */}
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
            Congratulations!
          </h2>

          {/* Message */}
          <p className="text-sm sm:text-base text-gray-600 mb-2">
            You successfully enrolled in the course.
          </p>
          
          <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-primary mb-6">
            <span>You earned {points} reward points!</span>
          </div>

          {/* Button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-forestGreen text-white text-sm sm:text-base font-medium rounded-lg shadow-sm active:scale-95 transition-transform"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default RewardPopup;
