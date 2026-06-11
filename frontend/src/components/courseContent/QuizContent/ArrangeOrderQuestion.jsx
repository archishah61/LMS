import { useState, useEffect, useRef } from "react";

export default function ArrangeOrderQuestion({ question, selectedAnswers, handleAnswerSelect }) {
  const [items, setItems] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedFromLeft, setDraggedFromLeft] = useState(false);
  const [originalItems, setOriginalItems] = useState([]);
  const [touchDragging, setTouchDragging] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const dragItemRef = useRef(null);
  const dragNodeRef = useRef(null);

  useEffect(() => {
    const shuffled = [...(question.sentences || [])].sort(() => Math.random() - 0.5);
    setOriginalItems(shuffled);
    if (selectedAnswers[question.id]) {
      setItems(selectedAnswers[question.id]);
    } else {
      setItems([]);
    }
  }, [question.id, question.sentences]);

  // Mouse drag events
  const handleDragStart = (e, sentence, fromLeft = false) => {
    setDraggedItem(sentence);
    setDraggedFromLeft(fromLeft);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnRight = (e, targetIndex = null) => {
    e.preventDefault();
    if (!draggedItem) return;

    if (draggedFromLeft) {
      if (!items.includes(draggedItem)) {
        const newItems = [...items];
        const insertIndex = targetIndex !== null ? targetIndex : newItems.length;
        newItems.splice(insertIndex, 0, draggedItem);
        setItems(newItems);
        handleAnswerSelect(question.id, newItems);
      }
    } else {
      const currentIndex = items.indexOf(draggedItem);
      if (currentIndex !== -1 && targetIndex !== null && currentIndex !== targetIndex) {
        const newItems = [...items];
        newItems.splice(currentIndex, 1);
        newItems.splice(targetIndex, 0, draggedItem);
        setItems(newItems);
        handleAnswerSelect(question.id, newItems);
      }
    }
    setDraggedItem(null);
    setDraggedFromLeft(false);
  };

  const handleDropOnLeft = (e) => {
    e.preventDefault();
    if (!draggedItem || draggedFromLeft) return;
    const newItems = items.filter((item) => item !== draggedItem);
    setItems(newItems);
    handleAnswerSelect(question.id, newItems);
    setDraggedItem(null);
    setDraggedFromLeft(false);
  };

  // Update the handleTouchMove function to prevent default and handle scrolling
  const handleTouchMove = (e) => {
    if (!touchDragging || !dragItemRef.current) return;

    const touch = e.touches[0];
    dragItemRef.current.style.left = `${touch.clientX - dragItemRef.current.offsetWidth / 2}px`;
    dragItemRef.current.style.top = `${touch.clientY - dragItemRef.current.offsetHeight / 2}px`;

    // Prevent default to stop scrolling
    e.preventDefault();
    e.stopPropagation();
  };

  // Update the handleTouchStart function to add more aggressive prevention
  const handleTouchStart = (e, sentence, fromLeft = false, index = null) => {
    // Prevent any default touch behavior immediately
    e.preventDefault();
    e.stopPropagation();

    setTouchDragging(true);
    setDraggedItem(sentence);
    setDraggedFromLeft(fromLeft);
    setTouchStartY(e.touches[0].clientY);

    // Create a visual feedback for dragging
    const touch = e.touches[0];
    const draggedElement = e.currentTarget.cloneNode(true);
    draggedElement.style.position = "fixed";
    draggedElement.style.zIndex = "1000";
    draggedElement.style.opacity = "0.8";
    draggedElement.style.pointerEvents = "none";
    draggedElement.style.width = `${e.currentTarget.offsetWidth}px`;
    draggedElement.style.left = `${touch.clientX - e.currentTarget.offsetWidth / 2}px`;
    draggedElement.style.top = `${touch.clientY - e.currentTarget.offsetHeight / 2}px`;
    draggedElement.classList.add("shadow-lg", "bg-blue-50", "border-blue-300");

    // Add CSS to prevent touch actions on the drag element
    draggedElement.style.touchAction = "none";
    draggedElement.style.webkitUserSelect = "none";
    draggedElement.style.userSelect = "none";

    document.body.appendChild(draggedElement);
    dragItemRef.current = draggedElement;
    dragNodeRef.current = { sentence, fromLeft, index };
  };

  const handleTouchEnd = (e) => {
    if (!touchDragging || !dragNodeRef.current) return;

    const touch = e.changedTouches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);

    // Check if dropped on right container
    const rightContainer = elements.find(el =>
      el.classList &&
      (el.classList.contains('min-h-[300px]') ||
        el.closest('.min-h\\[300px\\]'))
    );

    // Check if dropped on left container
    const leftContainer = elements.find(el =>
      el.classList &&
      (el.classList.contains('min-h-[200px]') ||
        el.closest('.min-h\\[200px\\]'))
    );

    if (rightContainer && !dragNodeRef.current.fromLeft) {
      // Reordering within right container
      const rightItems = rightContainer.querySelectorAll('[draggable="true"]');
      let targetIndex = items.length;

      for (let i = 0; i < rightItems.length; i++) {
        const rect = rightItems[i].getBoundingClientRect();
        if (touch.clientY < rect.top + rect.height / 2) {
          targetIndex = i;
          break;
        }
      }

      const currentIndex = items.indexOf(dragNodeRef.current.sentence);
      if (currentIndex !== -1 && targetIndex !== null && currentIndex !== targetIndex) {
        const newItems = [...items];
        newItems.splice(currentIndex, 1);
        newItems.splice(targetIndex, 0, dragNodeRef.current.sentence);
        setItems(newItems);
        handleAnswerSelect(question.id, newItems);
      }
    }
    else if (rightContainer && dragNodeRef.current.fromLeft) {
      // Adding from left to right
      if (!items.includes(dragNodeRef.current.sentence)) {
        const newItems = [...items, dragNodeRef.current.sentence];
        setItems(newItems);
        handleAnswerSelect(question.id, newItems);
      }
    }
    else if (leftContainer && !dragNodeRef.current.fromLeft) {
      // Removing from right container
      const newItems = items.filter((item) => item !== dragNodeRef.current.sentence);
      setItems(newItems);
      handleAnswerSelect(question.id, newItems);
    }

    // Cleanup
    if (dragItemRef.current) {
      document.body.removeChild(dragItemRef.current);
      dragItemRef.current = null;
    }

    setTouchDragging(false);
    setDraggedItem(null);
    setDraggedFromLeft(false);
    dragNodeRef.current = null;
  };

  const addToRight = (sentence) => {
    if (!items.includes(sentence)) {
      const newItems = [...items, sentence];
      setItems(newItems);
      handleAnswerSelect(question.id, newItems);
    }
  };

  const removeItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
    handleAnswerSelect(question.id, newItems);
  };

  const moveItem = (fromIndex, toIndex) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setItems(newItems);
    handleAnswerSelect(question.id, newItems);
  };

  // Add touch event listeners to document
  useEffect(() => {
    if (touchDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [touchDragging]);

  const currentMobileItems = items.length === originalItems.length
    ? items
    : [...items, ...originalItems.filter(item => !items.includes(item))];

  const moveMobileItem = (fromIndex, toIndex) => {
    const newItems = [...currentMobileItems];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setItems(newItems);
    handleAnswerSelect(question.id, newItems);
  };

  return (
    <div className="sm:space-y-6 sm:p-4 bg-white rounded-xl shadow-sm sm:mt-4">
      {/* Desktop/Web View (lg and above) */}
      <div className="hidden lg:flex flex-row gap-4 sm:gap-6">
        {/* Left Column: Available Sentences */}
        <div className="flex-1 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-gray-700 font-semibold text-sm uppercase tracking-wider mb-3">
            Available Sentences
          </h3>
          <div
            onDragOver={handleDragOver}
            onDrop={handleDropOnLeft}
            className="space-y-2"
          >
            {originalItems.map((sentence, index) => {
              const isUsed = items.includes(sentence);
              return (
                <div
                  key={`original-${index}`}
                  draggable={!isUsed}
                  onDragStart={(e) => handleDragStart(e, sentence, true)}
                  onTouchStart={(e) => !isUsed && handleTouchStart(e, sentence, true)}
                  className={`p-3 border rounded-lg transition-all ${isUsed
                    ? "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed"
                    : "bg-white border-gray-300 shadow-sm hover:shadow-md cursor-move hover:border-blue-400"
                    } ${touchDragging && draggedItem === sentence ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={isUsed ? "text-gray-500" : "text-gray-800"}>{sentence}</span>
                    {!isUsed && (
                      <button
                        onClick={() => addToRight(sentence)}
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                        title="Add to arrangement"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Arrow Icon */}
        <div className="flex items-center justify-center lg:flex-col lg:justify-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full shadow-md">
            <svg
              className="w-6 h-6 text-blue-600 transform rotate-90 md:rotate-0 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>
        </div>

        {/* Right Column: Arrangement Area */}
        <div className="flex-1 flex flex-col bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-700 font-semibold text-sm uppercase tracking-wider">
              Your Arrangement ({items.length}/{originalItems.length})
            </h3>
            {items.length > 0 && (
              <button
                onClick={() => {
                  setItems([]);
                  handleAnswerSelect(question.id, []);
                }}
                className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnRight(e)}
            className={`space-y-2 flex-1 rounded-lg ${items.length === 0 ? "border-2 border-dashed border-gray-300 p-4 flex items-center justify-center" : ""
              }`}
          >
            {items.length === 0 ? (
              <div className="text-center">
                <p className="text-gray-500 font-medium">Drag sentences here to arrange them</p>
                <p className="text-gray-400 text-sm mt-1">Drop zone for your sentence arrangement</p>
              </div>
            ) : (
              items.map((sentence, index) => (
                <div
                  key={`arranged-${index}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, sentence, false)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.stopPropagation();
                    handleDropOnRight(e, index);
                  }}
                  onTouchStart={(e) => handleTouchStart(e, sentence, false, index)}
                  className={`p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all cursor-move ${touchDragging && draggedItem === sentence ? 'opacity-30' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
                        {index + 1}
                      </span>
                      <span className="text-gray-800">{sentence}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {index > 0 && (
                        <button
                          onClick={() => moveItem(index, index - 1)}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                          title="Move up"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                      {index < items.length - 1 && (
                        <button
                          onClick={() => moveItem(index, index + 1)}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                          title="Move down"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => removeItem(index)}
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                        title="Remove"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mobile/Tablet View (below lg) */}
      <div className="flex flex-col lg:hidden gap-4">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-700 font-semibold text-sm uppercase tracking-wider">
              Arrange Sentences
            </h3>
            {items.length > 0 && (
              <button
                onClick={() => {
                  setItems([]);
                  handleAnswerSelect(question.id, []);
                }}
                className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
          <div className="space-y-2">
            {currentMobileItems.map((sentence, index) => (
              <div
                key={`mobile-${index}`}
                className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 pr-4">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
                      {index + 1}
                    </span>
                    <span className="text-gray-800 text-sm md:text-base">{sentence}</span>
                  </div>
                  <div className="flex flex-col space-y-1 flex-shrink-0">
                    <button
                      onClick={() => index > 0 && moveMobileItem(index, index - 1)}
                      disabled={index === 0}
                      className={`p-2 rounded-md transition-colors active:scale-95 ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-blue-500 hover:bg-blue-50 hover:text-blue-700'}`}
                      title="Move up"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => index < currentMobileItems.length - 1 && moveMobileItem(index, index + 1)}
                      disabled={index === currentMobileItems.length - 1}
                      className={`p-2 rounded-md transition-colors active:scale-95 ${index === currentMobileItems.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-blue-500 hover:bg-blue-50 hover:text-blue-700'}`}
                      title="Move down"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}