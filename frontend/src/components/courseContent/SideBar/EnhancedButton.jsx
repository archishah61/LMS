import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaLock,
  FaCheckCircle,
  FaBookOpen,
  FaChevronDown,
  FaChevronRight,
  FaQuestionCircle,
  FaPencilAlt,
  FaRegClock,
  FaVideo,
  FaHeadphones,
  FaListUl,
  FaLayerGroup,
  FaFileAlt,
} from "react-icons/fa";

const EnhancedButton = ({
  isLocked,
  onClick,
  children,
  isCompleted,
  type,
  isActive = false,
}) => {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [wasLocked, setWasLocked] = useState(isLocked);
  const [animateShake, setAnimateShake] = useState(false);

  useEffect(() => {
    if (wasLocked && !isLocked) {
      // Start unlock animation sequence
      setAnimateShake(true);
      setTimeout(() => {
        setAnimateShake(false);
        setIsUnlocking(true);
      }, 100);

      const timer = setTimeout(() => setIsUnlocking(false), 1300);
      return () => clearTimeout(timer);
    }
    setWasLocked(isLocked);
  }, [isLocked, wasLocked]);

  // Different icon based on content type
  const getIcon = () => {
    switch (type) {
      case "quiz":
        return <FaQuestionCircle className="w-3 h-3" />;
      case "assignment":
        return <FaPencilAlt className="w-3 h-3" />;
      case "video":
        return <FaVideo className="w-3 h-3" />;
      case "audio":
        return <FaHeadphones className="w-3 h-3" />;
      case "accordion":
        return <FaListUl className="w-3 h-3" />;
      case "multi_slide":
        return <FaLayerGroup className="w-3 h-3" />;
      case "module":
        return <FaFileAlt className="w-3 h-3" />;
      default:
        return <FaBookOpen className="w-3 h-3" />;
    }
  };

  // Get button background styles based on state
  const getButtonStyles = () => {
    if (isLocked) {
      return "bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200";
    }
    if (isCompleted) {
      return "bg-green-50 text-green-700 border-l-4 border-green-500";
    }
    if (isActive) {
      return "bg-blue-100 text-blue-800 border-l-4 border-blue-600 shadow-md";
    }
    return "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-200";
  };

  const getIconStyles = () => {
    if (isCompleted) {
      return "bg-green-500 text-white";
    }
    if (isLocked) {
      return "bg-gray-300 text-gray-500";
    }
    if (isActive) {
      return "bg-blue-600 text-white";
    }
    return "bg-blue-500 text-white";
  };

  // Lock animation variants
  const lockIconVariants = {
    shake: {
      rotate: [0, -10, 10, -10, 10, -5, 5, 0],
      transition: { duration: 0.5 },
    },
    break: {
      scale: [1, 1.2, 0.8, 0],
      opacity: [1, 0.8, 0.5, 0],
      rotate: [0, -20, 20, 45],
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.button
      className={`w-full px-4 py-3 my-1 text-sm transition-all duration-300 rounded-lg flex items-center group relative ${getButtonStyles()}`}
      onClick={!isLocked ? onClick : undefined}
      disabled={isLocked}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isLocked ? { scale: 1.02, x: isActive ? 0 : 3 } : {}}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
    >
      {/* Status Icon Circle */}
      <motion.div
        className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-xs mr-3 transition-all duration-300 shadow-sm ${getIconStyles()}`}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <AnimatePresence mode="wait">
          {isLocked ? (
            <motion.span
              key="lock"
              variants={lockIconVariants}
              animate={animateShake ? "shake" : isUnlocking ? "break" : ""}
            >
              <FaLock className="w-3 h-3" />
            </motion.span>
          ) : isCompleted ? (
            <motion.span
              key="check"
              initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <FaCheckCircle className="w-4 h-4" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              {getIcon()}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Button Text */}
      <span className="truncate text-left flex-1 min-w-0 font-medium">
        {children}
      </span>

      {/* Active indicator */}
      {isActive && !isLocked && (
        <motion.div
          className="w-2 h-2 rounded-full bg-blue-600 ml-2"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Unlock animation effects */}
      {isUnlocking && (
        <>
          <motion.div
            className="absolute inset-0 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.3, 0],
              scale: [0.95, 1.05, 1],
            }}
            transition={{ duration: 1.2 }}
            style={{
              background:
                "radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(59,130,246,0) 70%)",
              pointerEvents: "none",
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-lg overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ pointerEvents: "none" }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1, ease: "easeInOut" }}
              style={{ opacity: 0.5 }}
            />
          </motion.div>
        </>
      )}
    </motion.button>
  );
};

export default EnhancedButton;
