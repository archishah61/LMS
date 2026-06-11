import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const instructionsMap = {
  "Drag and drop": "You will be given a set of options. Drag and drop them into the correct positions based on the question prompt.",
  "Video to script": "Watch the video carefully and then write or select the correct transcript that matches the spoken dialogue. Punctuation and capitalization matter.",
  "Audio to script": "Listen to the audio clip and provide the corresponding text or choose the most accurate transcript. Punctuation and capitalization matter.",
  "Image to script": "Observe the image carefully and write or choose a description that best represents it.",
  "Summarize": "Read the given passage and summarize it in your own words while maintaining the main ideas.",
  "Arrange order": "Rearrange the given sentences or steps into the correct logical or chronological order.",
};

export default function QuestionInstructionModal({ type, isOpen, onClose }) {
  if (!isOpen) return null;

  const instruction = instructionsMap[type] || "Please follow the on-screen instructions carefully.";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 sm:p-6 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg w-full max-w-md relative mx-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Content Container with responsive padding */}
            <div className="p-5 sm:p-6 md:p-6">
              {/* Close Button - adjusted position for mobile */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 sm:top-3 sm:right-3 md:top-3 md:right-3 text-slate-500 hover:text-slate-800 dark:hover:text-white p-1.5 sm:p-1 md:p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-manipulation"
                aria-label="Close modal"
                style={{
                  minWidth: '40px', // Better touch target on mobile
                  minHeight: '40px',
                }}
              >
                <X size={20} className="sm:w-5 sm:h-5 md:w-5 md:h-5" />
              </button>

              {/* Header - responsive text sizing */}
              <h2 className="text-lg sm:text-xl md:text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2 sm:mb-3 md:mb-3 pr-8 sm:pr-8 md:pr-8">
                Instructions – {type}
              </h2>

              {/* Body - improved readability on mobile */}
              <p className="text-sm sm:text-base md:text-base text-slate-600 dark:text-slate-300 leading-relaxed sm:leading-relaxed md:leading-relaxed">
                {instruction}
              </p>

              {/* Footer - responsive button */}
              <div className="mt-5 sm:mt-6 md:mt-6 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-5 sm:px-4 md:px-4 py-2.5 sm:py-2 md:py-2 bg-blue-600 text-white text-sm sm:text-sm md:text-sm font-medium rounded-lg hover:bg-blue-700 transition active:bg-blue-800 touch-manipulation w-full sm:w-auto md:w-auto"
                  style={{
                    minHeight: '44px', // Better touch target on mobile
                  }}
                >
                  Got it
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}