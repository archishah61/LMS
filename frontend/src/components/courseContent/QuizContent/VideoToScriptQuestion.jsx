import React, { useState, useRef, useEffect } from "react";
import QuestionInstructionModal from "./QuestionInstructionModal";
import { FaInfoCircle } from "react-icons/fa";

export default function VideoToScriptQuestion({
  question,
  selectedAnswers,
  handleAnswerSelect,
}) {
  const [videoEnded, setVideoEnded] = useState(false);
  const videoRef = useRef(null);
  const textareaRef = useRef(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnd = () => {
    setVideoEnded(true);
    setIsPlaying(false);
  };

  useEffect(() => {
    if (videoEnded) {
      textareaRef.current?.focus();
    }
  }, [videoEnded]);

  return (
    <div className="w-full pb-10">
      {!videoEnded && (
        <div className="w-full mb-3 sm:mb-4 p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
          <p className="text-gray-800 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="flex-shrink-0"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
            <span className="truncate">Transcription will be enabled after video finishes</span>
          </p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12 w-full px-4 sm:px-6 lg:px-0">
        {/* Left: Video Player */}
        <div className="lg:w-1/2">
          <div className="flex items-center justify-between relative mb-2 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">Video</h3>
          </div>

          <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="bg-black relative" style={{ aspectRatio: '16/10', minHeight: window.innerWidth < 640 ? '200px' : window.innerWidth < 1024 ? '280px' : '350px' }}>
              <video
                ref={videoRef}
                src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.videoUrl}`}
                className="w-full h-full object-contain"
                autoPlay
                onEnded={handleVideoEnd}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
                style={{ pointerEvents: 'none' }}
              />

              {/* Custom Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0">
                {/* Single row with play button, progress bar, and time */}
                <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={togglePlay}
                    className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors flex-shrink-0"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="sm:w-3.5 sm:h-3.5">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="sm:w-3.5 sm:h-3.5">
                         <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  {/* Progress Bar */}
                  <div className="relative flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                      style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                    />
                  </div>
                  
                  {/* Time Display */}
                  <div className="text-[10px] sm:text-xs font-medium text-white/90 flex-shrink-0">
                    {formatDuration(currentTime)} / {formatDuration(duration)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Transcription Area */}
        <div className="lg:w-1/2 flex flex-col">
          <div className="flex items-center justify-between relative mb-2 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">Transcription</h3>
            <button
              onClick={() => setShowInstructions(true)}
              className="text-gray-500 hover:text-blue-600 transition-colors p-1.5 sm:p-2 rounded-full hover:bg-blue-50"
              title="View Instructions"
            >
              <FaInfoCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>

          <div className={`relative flex-1 border-2 rounded-xl shadow-sm flex flex-col p-3 sm:p-4 lg:p-6 transition-all duration-300 ${
            !videoEnded
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-70'
              : 'border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-200'
          }`}>
            <textarea
              ref={textareaRef}
              className="w-full h-full border-none focus:outline-none resize-none bg-transparent text-gray-700 p-0 text-sm sm:text-base min-h-[200px] sm:min-h-[250px] lg:min-h-0"
              value={selectedAnswers[question.id] || ""}
              onChange={(e) => videoEnded && handleAnswerSelect(question.id, e.target.value)}
              placeholder={!videoEnded ? "Please watch the video first..." : "Type the script you heard in the video..."}
              disabled={!videoEnded}
              rows={window.innerWidth < 640 ? 8 : window.innerWidth < 1024 ? 10 : undefined}
            />
            <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 lg:bottom-4 lg:right-4 text-[10px] sm:text-xs text-gray-500 bg-white/90 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-sm border border-gray-200">
              {selectedAnswers[question.id]?.length || 0} characters
            </div>
          </div>

          {/* Clear button - only show when video ended */}
          {videoEnded && (
            <div className="mt-3 sm:mt-4 flex justify-end">
              <button
                onClick={() => handleAnswerSelect(question.id, "")}
                className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 hover:bg-blue-50 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg w-full sm:w-auto justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="sm:w-4 sm:h-4"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                Clear Transcript
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Instruction Modal */}
      <QuestionInstructionModal
        type="Video to script"
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />

      <style jsx>{`
        @media (max-width: 640px) {
          .video-container {
            min-height: 200px;
          }
        }
        
        @media (min-width: 641px) and (max-width: 1023px) {
          .video-container {
            min-height: 280px;
          }
        }
      `}</style>
    </div>
  );
}