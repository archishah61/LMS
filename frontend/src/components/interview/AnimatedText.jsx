import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const AnimatedText = ({ text, isPlaying, onComplete }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [spokenWords, setSpokenWords] = useState(new Set());
  const words = text.split(" ");
  const wordsPerSecond = 2.5;
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      setCurrentWordIndex(-1);
      setSpokenWords(new Set());

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const startDelay = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          setCurrentWordIndex((prev) => {
            const next = prev + 1;
            if (next >= words.length) {
              clearInterval(intervalRef.current);
              onComplete?.();
              return prev;
            }

            setSpokenWords((prevSpoken) => new Set([...prevSpoken, next]));
            return next;
          });
        }, 1000 / wordsPerSecond);
      }, 300);

      return () => {
        clearTimeout(startDelay);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      setCurrentWordIndex(-1);
      setSpokenWords(new Set());
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isPlaying, words.length, onComplete]);

  const getWordStyle = (index) => {
    if (index === currentWordIndex) {
      return "text-white bg-primary";
    } else if (spokenWords.has(index)) {
      return "text-gray-800";
    } else if (isPlaying) {
      return "text-gray-400";
    } else {
      return "text-gray-800";
    }
  };

  return (
    <div className="text-lg leading-relaxed transition-all duration-500">
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className={`inline-block mr-2 px-2 py-1 rounded-md transition-all duration-500 font-medium ${getWordStyle(index)}`}
          initial={{ opacity: 0.7, scale: 1 }}
          animate={{
            scale: index === currentWordIndex ? 1.08 : 1,
            y: index === currentWordIndex ? -2 : 0,
            opacity: index === currentWordIndex ? 1 : spokenWords.has(index) ? 0.95 : isPlaying ? 0.6 : 1,
          }}
          transition={{
            duration: 0.4,
            ease: "easeOut",
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
          whileHover={{
            scale: 1.05,
            transition: { duration: 0.2 },
          }}
        >
          {word}
          {index === currentWordIndex && (
            <motion.div
              className="absolute inset-0 bg-primary rounded-md opacity-10"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          )}
        </motion.span>
      ))}
    </div>
  );
};

export default AnimatedText;