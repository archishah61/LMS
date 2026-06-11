"use client";
import React, { useState } from "react";
import {
  motion,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";

export const AnimatedTooltip = ({ items }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const springConfig = { stiffness: 100, damping: 5 };
  const x = useMotionValue(0);

  // Rotate and translate the tooltip based on cursor movement
  const rotate = useSpring(useTransform(x, [-100, 100], [-45, 45]), springConfig);
  const translateX = useSpring(useTransform(x, [-100, 100], [-50, 50]), springConfig);

  const handleMouseMove = (event) => {
    const halfWidth = event.target.offsetWidth / 2;
    x.set(event.nativeEvent.offsetX - halfWidth);
  };

  return (
    <>
      {items.map((item) => (
        <div
          className="group relative -mr-2 md:-mr-4"
          key={item.id}
          onMouseEnter={() => setHoveredIndex(item.id)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence mode="popLayout">
            {hoveredIndex === item.id && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.6 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 260,
                    damping: 10,
                  },
                }}
                exit={{ opacity: 0, y: 20, scale: 0.6 }}
                style={{
                  translateX: translateX,
                  rotate: rotate,
                  whiteSpace: "nowrap",
                }}
                className="absolute -top-12 md:-top-16 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5 md:px-4 md:py-2 text-xs shadow-xl"
              >
                {/* Glowing Lines - Themed */}
                <div className="absolute inset-x-10 -bottom-px z-30 h-px w-[20%] bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
                <div className="absolute -bottom-px left-10 z-30 h-px w-[40%] bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />

                {/* Name & Designation - Themed */}
                <div className="relative z-30 text-sm md:text-base font-bold text-white">{item.name}</div>
                <div className="text-xs text-gray-200">{item.designation}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Picture */}
          <img
            onMouseMove={handleMouseMove}
            height={100}
            width={100}
            src={item.image || `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`}
            alt={item.name}
            className="relative !m-0 h-10 w-10 md:h-14 md:w-14 rounded-full border-2 border-white object-cover object-top !p-0 transition duration-500 group-hover:z-30 group-hover:scale-110 shadow-md hover:shadow-lg"
          />
        </div>
      ))}
    </>
  );
};