import { motion } from "framer-motion";

const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className={`absolute rounded-full ${i % 3 === 0
          ? 'w-1 h-1 bg-blue-300/30'
          : i % 3 === 1
            ? 'w-1.5 h-1.5 bg-indigo-300/25'
            : 'w-0.5 h-0.5 bg-purple-300/35'
          }`}
        animate={{
          x: [0, Math.random() * 200 - 100],
          y: [0, Math.random() * -300 - 100],
          opacity: [0, 0.8, 0],
          scale: [0.5, 1.2, 0.5],
        }}
        transition={{
          duration: 8 + Math.random() * 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          left: `${Math.random() * 100}%`,
          top: `${80 + Math.random() * 20}%`,
        }}
      />
    ))}
  </div>
);

export default FloatingParticles;