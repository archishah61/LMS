import React, { useState, useRef, useEffect } from "react";
import QuestionInstructionModal from "./QuestionInstructionModal";
import { FaInfoCircle } from "react-icons/fa";

export default function ImageToScriptQuestion({
  question,
  selectedAnswers,
  handleAnswerSelect,
}) {
  const [showInstructions, setShowInstructions] = useState(false);
  const textareaRef = useRef(null);

  // Auto-focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <div className="w-full pb-10">
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12 w-full px-4 sm:px-6 lg:px-0">
        {/* Left: Image Display */}
        <div className="lg:w-1/2">
          <div className="flex items-center justify-between relative mb-2 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">Image</h3>
          </div>

          <div
            className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200 w-full"
            style={{
              aspectRatio: window.innerWidth < 640 ? '4/3' : '16/10',
              maxHeight: window.innerWidth < 640 ? '300px' : '450px',
              minHeight: window.innerWidth < 640 ? '200px' : '280px'
            }}
          >
            <img
              src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.imageUrl || "/placeholder.png"}`}
              alt="Script to transcribe"
              className="w-full h-full object-contain md:object-cover"
              loading="lazy"
            />
          </div>

          {/* Hint for mobile */}
          {window.innerWidth < 640 && (
            <p className="mt-2 text-xs text-gray-500 text-center">
              Pinch to zoom the image if needed
            </p>
          )}
        </div>

        {/* Right: Transcription Area */}
        <div className="lg:w-1/2 flex flex-col">
          <div className="flex items-center justify-between relative mb-2 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">Transcription</h3>
            <button
              onClick={() => setShowInstructions(true)}
              className="text-gray-500 hover:text-blue-600 transition-colors p-1.5 sm:p-2 rounded-full hover:bg-blue-50"
              title="View Instructions"
              aria-label="View Instructions"
            >
              <FaInfoCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>

          <div className="relative flex-1 border-2 rounded-xl shadow-sm flex flex-col p-3 sm:p-4 lg:p-6 transition-all duration-300 border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-200">
            <textarea
              ref={textareaRef}
              className="w-full h-full border-none focus:outline-none resize-none bg-transparent text-gray-700 p-0 text-sm sm:text-base min-h-[250px] sm:min-h-[300px] lg:min-h-[350px]"
              value={selectedAnswers[question.id] || ""}
              onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
              placeholder="Type the script you see in the image..."
              rows={window.innerWidth < 640 ? 10 : window.innerWidth < 1024 ? 12 : undefined}
            />

            {/* Character counter */}
            <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 lg:bottom-4 lg:right-4 text-[10px] sm:text-xs text-gray-500 bg-white/90 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-sm border border-gray-200">
              {selectedAnswers[question.id]?.length || 0} characters
            </div>
          </div>

          {/* Clear button */}
          <div className="mt-3 sm:mt-4 flex justify-end">
            <button
              onClick={() => handleAnswerSelect(question.id, "")}
              className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 hover:bg-blue-50 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg w-full sm:w-auto justify-center"
              aria-label="Clear transcript"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="sm:w-4 sm:h-4"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Clear Transcript
            </button>
          </div>
        </div>
      </div>

      {/* Instruction Modal */}
      <QuestionInstructionModal
        type="Image to script"
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />

      <style jsx>{`
        @media (max-width: 640px) {
          .image-container {
            min-height: 200px;
          }
        }
        
        @media (min-width: 641px) and (max-width: 1023px) {
          .image-container {
            min-height: 280px;
          }
        }

        /* Improve touch targets on mobile */
        @media (max-width: 640px) {
          button, 
          [role="button"] {
            min-height: 44px;
            min-width: 44px;
          }
        }
      `}</style>
    </div>
  );
}