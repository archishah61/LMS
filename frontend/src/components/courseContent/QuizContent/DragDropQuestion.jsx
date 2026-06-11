import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DragDropQuestion = ({ currentQuestion, handleAnswerSelect, selectedAnswers }) => {
  const [availableOptions, setAvailableOptions] = useState([]);
  const [filledBlanks, setFilledBlanks] = useState({});
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragSourceBlank, setDragSourceBlank] = useState(null);
  const [blankRefs, setBlankRefs] = useState({});
  const [touchDragging, setTouchDragging] = useState(false);
  const [dragPreview, setDragPreview] = useState(null);
  const optionRefs = useRef({});
  const touchStartRef = useRef({ x: 0, y: 0 });

  // Initialize available options and refs
  useEffect(() => {
    if (currentQuestion?.options) {
      setAvailableOptions(
        currentQuestion.options.map((option) => ({
          id: option,
          text: option,
          isAvailable: true,
          originalPosition: { x: 0, y: 0 },
        }))
      );

      // Create refs for blanks
      const refs = {};
      currentQuestion.blanks.forEach((blank) => {
        refs[blank.position] = React.createRef();
      });
      setBlankRefs(refs);

      // Initialize filled blanks from any existing answers
      const existingAnswer = selectedAnswers[currentQuestion.id];
      if (existingAnswer) {
        setFilledBlanks(existingAnswer);
        setAvailableOptions((prev) =>
          prev.map((option) => ({
            ...option,
            isAvailable: !Object.values(existingAnswer).includes(option.id),
          }))
        );
      } else {
        setFilledBlanks({});
      }
    }
  }, [currentQuestion, selectedAnswers]);

  // Split prompt by blanks (marked as "___")
  const promptParts = currentQuestion?.prompt.split("___") || [];

  // Update parent component with selected answers
  useEffect(() => {
    if (Object.keys(filledBlanks).length > 0) {
      handleAnswerSelect(currentQuestion.id, filledBlanks);
    }
  }, [filledBlanks]);

  // Handle starting drag from options pool
  const handleDragStart = (option) => {
    setDraggedItem(option);
    setDragSourceBlank(null);
  };

  // Handle starting drag from a filled blank
  const handleDragFromBlank = (blankPosition) => {
    const optionId = filledBlanks[blankPosition];
    if (!optionId) return;
    const option = availableOptions.find((opt) => opt.id === optionId);
    if (option) {
      setDraggedItem({ ...option, isAvailable: false });
      setDragSourceBlank(blankPosition);
    }
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e, option = null, blankPosition = null) => {
    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };

    if (blankPosition) {
      // Dragging from blank
      handleDragFromBlank(blankPosition);
      const optionId = filledBlanks[blankPosition];
      if (optionId) {
        const option = availableOptions.find((opt) => opt.id === optionId);
        if (option) {
          createDragPreview(option.text, touch.clientX, touch.clientY);
        }
      }
    } else if (option) {
      // Dragging from options pool
      handleDragStart(option);
      createDragPreview(option.text, touch.clientX, touch.clientY);
    }

    setTouchDragging(true);
  };

  const createDragPreview = (text, x, y) => {
    const preview = document.createElement('div');
    preview.textContent = text;
    preview.style.position = 'fixed';
    preview.style.zIndex = '1000';
    preview.style.background = 'white';
    preview.style.border = '2px solid #3b82f6';
    preview.style.borderRadius = '8px';
    preview.style.padding = '8px 12px';
    preview.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    preview.style.pointerEvents = 'none';
    preview.style.touchAction = 'none';
    preview.style.userSelect = 'none';
    preview.style.transform = 'translate(-50%, -50%)';
    preview.style.left = `${x}px`;
    preview.style.top = `${y}px`;
    preview.style.whiteSpace = 'nowrap';
    preview.style.maxWidth = '150px';
    preview.style.overflow = 'hidden';
    preview.style.textOverflow = 'ellipsis';
    preview.style.fontSize = '14px';

    document.body.appendChild(preview);
    setDragPreview(preview);
  };

  const handleTouchMove = (e) => {
    if (!touchDragging || !dragPreview) return;

    const touch = e.touches[0];
    dragPreview.style.left = `${touch.clientX}px`;
    dragPreview.style.top = `${touch.clientY}px`;

    e.preventDefault();
    e.stopPropagation();
  };

  const handleTouchEnd = (e) => {
    if (!touchDragging || !draggedItem) {
      cleanupTouch();
      return;
    }

    const touch = e.changedTouches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);

    // Find if we dropped on a blank
    const blankElement = elements.find(el =>
      el.classList && (
        el.classList.contains('bg-white') ||
        el.classList.contains('bg-gradient-to-r') ||
        el.getAttribute('data-blank-position')
      )
    );

    if (blankElement) {
      // Find the blank position
      let blankPosition = null;
      let currentElement = blankElement;

      while (currentElement && !blankPosition && currentElement !== document.body) {
        if (currentElement.getAttribute('data-blank-position')) {
          blankPosition = parseInt(currentElement.getAttribute('data-blank-position'));
          break;
        }
        currentElement = currentElement.parentElement;
      }

      // If we found a blank position, handle the drop
      if (blankPosition !== null) {
        handleDropInBlank(blankPosition);
      }
    }

    cleanupTouch();
  };

  const cleanupTouch = () => {
    if (dragPreview && document.body.contains(dragPreview)) {
      document.body.removeChild(dragPreview);
    }
    setDragPreview(null);
    setTouchDragging(false);
    setDraggedItem(null);
    setDragSourceBlank(null);
  };

  // Handle dropping into a blank
  const handleDropInBlank = (targetBlankPosition) => {
    if (!draggedItem) return;

    // Case 1: Dragging from options pool to blank
    if (dragSourceBlank === null) {
      if (filledBlanks[targetBlankPosition]) {
        setAvailableOptions((prev) =>
          prev.map((opt) =>
            opt.id === filledBlanks[targetBlankPosition] ? { ...opt, isAvailable: true } : opt
          )
        );
      }
      setFilledBlanks((prev) => ({
        ...prev,
        [targetBlankPosition]: draggedItem.id,
      }));
      setAvailableOptions((prev) =>
        prev.map((opt) => (opt.id === draggedItem.id ? { ...opt, isAvailable: false } : opt))
      );
    }
    // Case 2: Dragging from one blank to another (including swapping)
    else if (dragSourceBlank !== targetBlankPosition) {
      setFilledBlanks((prev) => {
        const newFilledBlanks = { ...prev };
        const targetOptionId = prev[targetBlankPosition];
        newFilledBlanks[targetBlankPosition] = prev[dragSourceBlank];
        if (targetOptionId) {
          newFilledBlanks[dragSourceBlank] = targetOptionId;
        } else {
          delete newFilledBlanks[dragSourceBlank];
        }
        return newFilledBlanks;
      });
    }
    setDraggedItem(null);
    setDragSourceBlank(null);
  };

  // Handle clicking on an option to place it in the first available blank
  const handleOptionClick = (option) => {
    if (!option.isAvailable || touchDragging) return;

    // Check if this is a tap (not drag) by measuring movement
    const touch = touchStartRef.current;
    const currentTouch = { x: 0, y: 0 };
    const distance = Math.sqrt(
      Math.pow(currentTouch.x - touch.x, 2) + Math.pow(currentTouch.y - touch.y, 2)
    );

    // If it's a tap (minimal movement), place in first available blank
    if (distance < 5) {
      const emptyBlankPosition = currentQuestion.blanks.find(
        (blank) => !filledBlanks[blank.position]
      )?.position;
      if (emptyBlankPosition) {
        setFilledBlanks((prev) => ({
          ...prev,
          [emptyBlankPosition]: option.id,
        }));
        setAvailableOptions((prev) =>
          prev.map((opt) => (opt.id === option.id ? { ...opt, isAvailable: false } : opt))
        );
      }
    }
  };

  // Handle removing an option from a blank by clicking
  const handleRemoveFromBlank = (blankPosition) => {
    if (touchDragging) return;
    const optionId = filledBlanks[blankPosition];
    if (!optionId) return;
    setAvailableOptions((prev) =>
      prev.map((opt) => (opt.id === optionId ? { ...opt, isAvailable: true } : opt))
    );
    const newFilledBlanks = { ...filledBlanks };
    delete newFilledBlanks[blankPosition];
    setFilledBlanks(newFilledBlanks);
  };

  // Add global touch event listeners
  useEffect(() => {
    if (touchDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('touchcancel', cleanupTouch);

      // Prevent body scroll during drag
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', cleanupTouch);

      // Restore body scroll
      document.body.style.overflow = '';
      document.body.style.touchAction = '';

      // Cleanup drag preview if it exists
      if (dragPreview && document.body.contains(dragPreview)) {
        document.body.removeChild(dragPreview);
      }
    };
  }, [touchDragging, dragPreview]);

  // Function to get dynamic width for blank based on content
  const getBlankWidth = (blankPosition) => {
    const content = filledBlanks[blankPosition];
    if (!content) return "w-20 sm:w-24";
    const option = availableOptions.find((opt) => opt.id === content);
    const text = option?.text || content;
    const charCount = text.length;
    
    // Mobile first widths with progressive sizing
    if (charCount <= 3) return "w-16 sm:w-20";
    if (charCount <= 6) return "w-20 sm:w-28";
    if (charCount <= 10) return "w-24 sm:w-36";
    if (charCount <= 15) return "w-28 sm:w-44";
    if (charCount <= 20) return "w-32 sm:w-52";
    if (charCount <= 25) return "w-36 sm:w-60";
    return "w-40 sm:w-64";
  };

  if (!currentQuestion || currentQuestion.type !== "drag_drop") {
    return <div>Invalid question type</div>;
  }

  // Animation variants
  const blankVariants = {
    empty: {
      scale: 1,
      boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.06)",
    },
    filled: {
      scale: 1,
      boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
    },
    hover: {
      scale: 1.03,
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.12)",
    },
  };

  const optionVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
    hover: {
      scale: 1.03,
      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
      borderColor: "rgba(59, 130, 246, 0.5)",
    },
    tap: { scale: 0.97 },
  };

  const contentVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-0">
      {/* Question prompt with blank spaces */}
      <div className="overflow-x-auto pb-2 sm:pb-0">
        <div className="text-sm sm:text-md md:text-lg leading-relaxed sm:leading-loose min-w-full inline-block">
          {promptParts.map((part, index) => (
            <React.Fragment key={index}>
              {/* Display the text part */}
              {part && (
                <span className="text-gray-800 font-medium text-sm sm:text-base md:text-lg break-words">
                  {part}
                </span>
              )}
              {/* Display a blank space if there's a part after this one */}
              {index < promptParts.length - 1 && (
                <motion.div
                  ref={blankRefs[index + 1]}
                  data-blank-position={index + 1}
                  className={`
                    inline-block align-middle mx-1 my-1
                    ${getBlankWidth(index + 1)} h-10 sm:h-12 rounded-lg relative cursor-pointer
                    ${filledBlanks[index + 1]
                      ? "bg-blue-50 border border-blue-500"
                      : "bg-white border-2 border-dashed border-gray-300"
                    }
                    flex-shrink-0
                  `}
                  variants={blankVariants}
                  initial={filledBlanks[index + 1] ? "filled" : "empty"}
                  animate={filledBlanks[index + 1] ? "filled" : "empty"}
                  onClick={() => filledBlanks[index + 1] && handleRemoveFromBlank(index + 1)}
                  draggable={!!filledBlanks[index + 1]}
                  onDragStart={() => filledBlanks[index + 1] && handleDragFromBlank(index + 1)}
                  onTouchStart={(e) => filledBlanks[index + 1] && handleTouchStart(e, null, index + 1)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add("ring-2", "ring-blue-400", "bg-blue-50");
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove("ring-2", "ring-blue-400", "bg-blue-50");
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("ring-2", "ring-blue-400", "bg-blue-50");
                    handleDropInBlank(index + 1);
                  }}
                >
                  <AnimatePresence mode="wait">
                    {filledBlanks[index + 1] && (
                      <motion.div
                        key={`filled-${index + 1}-${filledBlanks[index + 1]}`}
                        variants={contentVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="absolute inset-0 flex items-center justify-center text-gray-800 font-medium px-2 sm:px-3 text-center"
                      >
                        <span className="truncate w-full text-xs sm:text-sm leading-tight">
                          {availableOptions.find((opt) => opt.id === filledBlanks[index + 1])?.text ||
                            filledBlanks[index + 1]}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!filledBlanks[index + 1] && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-[10px] sm:text-xs font-medium px-1">
                      Drop here
                    </div>
                  )}
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Separator line */}
      <hr className="border-gray-200 my-3 sm:my-4" />

      {/* Options container */}
      <div className="overflow-x-auto pb-2 sm:pb-0">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-full">
          <span className="text-gray-800 font-medium text-xs sm:text-sm md:text-base whitespace-nowrap">
            Available Options :
          </span>
          <AnimatePresence>
            {availableOptions.map(
              (option) =>
                option.isAvailable && (
                  <motion.div
                    key={option.id}
                    ref={(el) => (optionRefs.current[option.id] = el)}
                    draggable
                    onDragStart={() => handleDragStart(option)}
                    onTouchStart={(e) => handleTouchStart(e, option)}
                    onClick={() => handleOptionClick(option)}
                    variants={optionVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-blue-50 border border-blue-500 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 cursor-grab
                    select-none max-w-[200px] sm:max-w-xs text-center touch-manipulation"
                    style={{ touchAction: touchDragging ? 'none' : 'manipulation' }}
                  >
                    <span className="text-xs sm:text-sm leading-tight text-gray-800 line-clamp-2">
                      {option.text}
                    </span>
                  </motion.div>
                )
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Instructions */}
      <div className="text-center text-xs sm:text-sm text-gray-500 lg:hidden bg-gray-50 p-2 sm:p-3 rounded-lg">
        <p className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
          <span>Tap and hold to drag options to the blanks</span>
        </p>
        <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2">
          Tap on a blank to remove an option
        </p>
      </div>

      {/* Desktop Instructions (hidden on mobile) */}
      <div className="hidden lg:block text-center text-sm text-gray-500">
        <p>Drag and drop options into the blanks</p>
      </div>

      {/* Custom styles for better mobile experience */}
      <style jsx>{`
        @media (max-width: 640px) {
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          /* Improve touch targets */
          [data-blank-position] {
            min-height: 40px;
            touch-action: manipulation;
          }
          
          /* Better scrolling experience */
          .overflow-x-auto {
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
          }
          
          /* Hide scrollbar on mobile but keep functionality */
          .overflow-x-auto::-webkit-scrollbar {
            height: 3px;
          }
          
          .overflow-x-auto::-webkit-scrollbar-thumb {
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 3px;
          }
        }

        @media (min-width: 641px) and (max-width: 1024px) {
          [data-blank-position] {
            min-height: 44px;
          }
          
          .overflow-x-auto::-webkit-scrollbar {
            height: 4px;
          }
        }

        /* Prevent text selection during drag */
        .cursor-grab {
          user-select: none;
          -webkit-user-select: none;
        }

        /* Improve touch feedback */
        @media (hover: none) and (pointer: coarse) {
          [data-blank-position]:active,
          .bg-blue-50:active {
            opacity: 0.8;
            transition: opacity 0.1s ease;
          }
        }
      `}</style>
    </div>
  );
};

export default DragDropQuestion;