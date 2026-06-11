import React, { useState, useEffect, useRef } from 'react';
import { Clock, Timer } from 'lucide-react';

const TimeWidget = ({ accessData, sessionTimeLeft, maxSessionTime, formatTime }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [timeSpent, setTimeSpent] = useState(0);
  const prevSessionTime = useRef(sessionTimeLeft);

  // Auto-collapse
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExpanded(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Track time spent based on sessionTimeLeft
  useEffect(() => {
    if (prevSessionTime.current > sessionTimeLeft) {
      const diff = prevSessionTime.current - sessionTimeLeft;
      setTimeSpent((prev) => prev + diff);
    }
    prevSessionTime.current = sessionTimeLeft;
  }, [sessionTimeLeft]);

  return (
    <div
      className="fixed top-4 right-4 z-50"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div
        className={`
          absolute top-0 right-0
          transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          ${isExpanded
            ? 'opacity-100 transform-none scale-100 origin-top-right'
            : 'opacity-0 translate-x-8 -translate-y-4 scale-75 pointer-events-none origin-top-right'
          }
        `}
      >
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-4 border border-gray-200 w-64">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium text-sm flex items-center">
                <Clock className="h-4 w-4 mr-1 text-gray-500" />
                Time Spent Today:
              </span>
              <span className="text-gray-900 font-semibold">
                {formatTime(
                  Math.floor(Number(accessData?.data?.todayHoursSpent || 0) * 3600 + timeSpent)
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium text-sm flex items-center">
                <Timer className="h-4 w-4 mr-1 text-gray-500" />
                Time Remaining:
              </span>
              <span
                className={`font-semibold ${sessionTimeLeft <= 300
                  ? "text-red-500 font-bold"
                  : "text-green-600"
                  }`}
              >
                {formatTime(sessionTimeLeft)}
              </span>
            </div>

            <div className="w-full pt-1">
              <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                <div
                  className={`absolute top-0 left-0 h-full rounded-full ${sessionTimeLeft <= 300
                    ? "bg-red-500"
                    : "bg-blue-500"
                    }`}
                  style={{
                    width: `${Math.max(5, (sessionTimeLeft / maxSessionTime) * 100)}%`,
                    transition: "width 1s linear",
                  }}
                />
              </div>
            </div>

            {sessionTimeLeft <= 300 && (
              <div className="text-xs text-red-500 mt-1 font-medium">
                Warning: Session ending soon
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        className={`
          bg-white rounded-full p-2 shadow-md border border-gray-200
          transition-all duration-300 hover:shadow-lg
          ${isExpanded ? 'opacity-0' : 'opacity-100'}
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Timer
          className={`h-6 w-6 ${sessionTimeLeft <= 300
            ? "text-red-500 animate-pulse"
            : "text-blue-500"
            }`}
        />
      </button>
    </div>
  );
};

export default TimeWidget;
