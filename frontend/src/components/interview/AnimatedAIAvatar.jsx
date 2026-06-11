import { motion } from "framer-motion";
import { Bot } from "lucide-react";

const AnimatedAIAvatar = ({ isPlaying }) => {
  return (
    <div className="relative">
      <motion.div
        className="absolute inset-0 rounded-full bg-blue-200"
        animate={
          isPlaying
            ? {
                scale: [1, 1.4, 1.2],
                opacity: [0.2, 0.4, 0.2],
              }
            : { scale: 1, opacity: 0.2 }
        }
        transition={{
          duration: 2,
          repeat: isPlaying ? Number.POSITIVE_INFINITY : 0,
          repeatType: "loop",
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute inset-1 rounded-full bg-blue-300"
        animate={
          isPlaying
            ? {
                scale: [1, 1.2, 1.1],
                opacity: [0.3, 0.6, 0.3],
              }
            : { scale: 1, opacity: 0.3 }
        }
        transition={{
          duration: 1.5,
          repeat: isPlaying ? Number.POSITIVE_INFINITY : 0,
          repeatType: "loop",
          ease: "easeInOut",
          delay: 0.2,
        }}
      />

      <motion.div
        className="relative w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg z-10"
        animate={
          isPlaying
            ? {
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 4px 6px -1px rgba(59, 130, 246, 0.3)",
                  "0 10px 15px -3px rgba(59, 130, 246, 0.4)",
                  "0 4px 6px -1px rgba(59, 130, 246, 0.3)",
                ],
              }
            : { scale: 1 }
        }
        transition={{
          duration: 1,
          repeat: isPlaying ? Number.POSITIVE_INFINITY : 0,
          repeatType: "loop",
          ease: "easeInOut",
        }}
      >
        <motion.div
          animate={
            isPlaying
              ? {
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1],
                }
              : { rotate: 0, scale: 1 }
          }
          transition={{
            duration: 2,
            repeat: isPlaying ? Number.POSITIVE_INFINITY : 0,
            repeatType: "loop",
            ease: "easeInOut",
          }}
        >
          <Bot className="w-6 h-6 text-white" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AnimatedAIAvatar;