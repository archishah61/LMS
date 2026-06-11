import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Tooltip = ({ children, text, position = "top" }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5"
  };

  const arrowPositionClasses = {
    top: "bottom-[-3px] left-1/2 -translate-x-1/2",
    bottom: "top-[-3px] left-1/2 -translate-x-1/2",
    left: "right-[-3px] top-1/2 -translate-y-1/2",
    right: "left-[-3px] top-1/2 -translate-y-1/2"
  };

  return (
    <div className="relative inline-block" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            className={`absolute z-50 px-2.5 py-1 text-xs font-medium text-white bg-gray-900/90 backdrop-blur-sm rounded-md shadow-lg whitespace-nowrap ${positionClasses[position]}`}
            style={{
              transform: position === "left" || position === "right"
                ? `translate(${position === "left" ? "-100%" : "0%"}, -50%)`
                : `translate(-50%, ${position === "top" ? "-100%" : "0%"})`
            }}
          >
            {text}
            <div
              className={`absolute w-1.5 h-1.5 bg-gray-900/90 transform rotate-45 ${arrowPositionClasses[position]}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;