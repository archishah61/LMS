import React, { useState, useEffect } from 'react';
import { Trophy, Star, Award, AlertCircle, XCircle, RefreshCw, ChevronRight } from 'lucide-react';

// Main component that handles both success and failure animations
export default function QuizResultAnimation({ type = "success", onClose, message }) {
  const [visible, setVisible] = useState(true);
  const [fireworks, setFireworks] = useState([]);
  const [confetti, setConfetti] = useState([]);

  // Default messages
  const successMessage = message || "Congratulations! You've successfully completed the quiz!";
  const failureMessage = message || "Oops! You didn't pass this time.";

  // Generate animations based on result type
  useEffect(() => {
    if (visible) {
      if (type === "success") {
        // Create success fireworks
        const newFireworks = [];
        for (let i = 0; i < 12; i++) {
          newFireworks.push({
            id: i,
            left: `${Math.random() * 90 + 5}%`,
            top: `${Math.random() * 70 + 10}%`,
            size: Math.random() * 0.5 + 0.7,
            delay: Math.random() * 0.8,
            color: getRandomSuccessColor(),
          });
        }
        setFireworks(newFireworks);

        // Create confetti for success
        const newConfetti = [];
        for (let i = 0; i < 80; i++) {
          newConfetti.push({
            id: i,
            left: `${Math.random() * 100}%`,
            delay: Math.random() * 2,
            speed: Math.random() * 3 + 3,
            size: Math.random() * 10 + 5,
            color: getRandomSuccessColor(),
          });
        }
        setConfetti(newConfetti);
      } else {
        // Create failure animation elements - sparks falling down
        const newFireworks = [];
        for (let i = 0; i < 8; i++) {
          newFireworks.push({
            id: i,
            left: `${Math.random() * 90 + 5}%`,
            top: `${Math.random() * 40 + 5}%`,
            size: Math.random() * 0.4 + 0.4,
            delay: Math.random() * 0.5,
            color: getRandomFailureColor(),
          });
        }
        setFireworks(newFireworks);

        // Create falling particles for failure
        const newConfetti = [];
        for (let i = 0; i < 40; i++) {
          newConfetti.push({
            id: i,
            left: `${Math.random() * 100}%`,
            delay: Math.random() * 1,
            speed: Math.random() * 2 + 2,
            size: Math.random() * 8 + 3,
            color: getRandomFailureColor(),
          });
        }
        setConfetti(newConfetti);
      }

      // Hide after 5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [visible, type, onClose]);

  // Random vibrant colors for success celebration
  function getRandomSuccessColor() {
    const colors = [
      '#FF5252', '#FF4081', '#E040FB', '#7C4DFF',
      '#536DFE', '#448AFF', '#40C4FF', '#18FFFF',
      '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41',
      '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Random colors for failure animation
  function getRandomFailureColor() {
    const colors = [
      '#FF5252', '#FF4081', '#F44336', '#FF7043',
      '#FFB74D', '#A1887F', '#9E9E9E', '#90A4AE'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center overflow-hidden">
      {/* Fireworks or sparks */}
      {/* {fireworks.map((fw) => (
        <div
          key={fw.id}
          className={type === "success" ? "absolute animate-ping" : "absolute animate-falldown"}
          style={{
            left: fw.left,
            top: fw.top,
            transform: `scale(${fw.size})`,
            animationDelay: `${fw.delay}s`,
            animationDuration: type === "success" ? '1.5s' : '2s',
          }}
        >
          <div
            className="w-12 h-12 rounded-full absolute"
            style={{
              boxShadow: `0 0 ${type === "success" ? '60px 30px' : '30px 15px'} ${fw.color}`,
              backgroundColor: fw.color
            }}
          />
        </div>
      ))} */}

      {/* Falling confetti or particles */}
      {confetti.map((c) => (
        <div
          key={c.id}
          className="absolute animate-fall"
          style={{
            left: c.left,
            top: '-20px',
            width: `${c.size}px`,
            height: `${c.size * 0.4}px`,
            backgroundColor: c.color,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.speed}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
            opacity: type === "success" ? 1 : 0.7
          }}
        />
      ))}

      {/* Result message */}
      {type === "success" ? (
        <div className="bg-white bg-opacity-90 rounded-xl p-8 max-w-md text-center z-10 scale-in animate-pulse shadow-xl">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Trophy className="w-20 h-20 text-yellow-500" />
              {/* <Star className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 animate-spin" style={{ animationDuration: '3s' }} />
              <Star className="w-8 h-8 text-yellow-400 absolute -top-2 -left-2 animate-spin" style={{ animationDuration: '3s' }} /> */}
            </div>
          </div>
          <h2 className="text-3xl font-bold text-blue-800 mb-2">Congratulations!</h2>
          <p className="text-xl text-gray-700 mb-4">{successMessage}</p>

          <div className="flex justify-center gap-2 mb-2">
            <Award className="w-6 h-6 text-purple-500" />
            <Award className="w-6 h-6 text-blue-500" />
            <Award className="w-6 h-6 text-green-500" />
            <Award className="w-6 h-6 text-yellow-500" />
            <Award className="w-6 h-6 text-red-500" />
          </div>

          <button
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center mx-auto transition-colors"
            onClick={() => {
              setVisible(false);
              if (onClose) onClose();
            }}
          >
            Continue <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      ) : (
        <div className="bg-white bg-opacity-90 rounded-xl p-8 max-w-md text-center z-10 scale-in shadow-xl border-t-4 border-red-500">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-14 h-14 text-red-500" />
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-red-800 mb-2">Not Quite There!</h2>
          <p className="text-xl text-gray-700 mb-6">{failureMessage}</p>

          <div className="flex justify-center gap-4">
            {/* <button 
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center transition-colors"
              onClick={() => {
                setVisible(false);
                if (onClose) onClose();
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button> */}

            <button
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center mx-auto transition-colors"
              onClick={() => {
                setVisible(false);
                if (onClose) onClose();
              }}
            >
              Review Lesson
            </button>
          </div>
        </div>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0.7; }
        }
        .animate-fall {
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: 1;
        }
        @keyframes falldown {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(70vh) scale(0.3); opacity: 0; }
        }
        .animate-falldown {
          animation-name: falldown;
          animation-timing-function: ease-in;
          animation-iteration-count: 1;
        }
        .scale-in {
          animation: scaleIn 0.5s ease-out forwards;
        }
        @keyframes scaleIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}