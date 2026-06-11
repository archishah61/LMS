import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FaInfoCircle } from "react-icons/fa";
import QuestionInstructionModal from "./QuestionInstructionModal";
import AudioPlayer from "../../ui/audioPlayer";

export default function AudioToScriptQuestion({
  question,
  selectedAnswers,
  handleAnswerSelect,
}) {
  const [audioEnded, setAudioEnded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showVolumeBar, setShowVolumeBar] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const textareaRef = useRef(null);

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // keep element volume in sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const handleAudioEnd = () => {
    setAudioEnded(true);
    setIsPlaying(false);
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const toggleVolumeBar = () => setShowVolumeBar(prev => !prev);

  // close volume on outside click
  useEffect(() => {
    if (!showVolumeBar) return;
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowVolumeBar(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showVolumeBar]);

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value) / 100;
    setVolume(newVolume);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    if (!duration && audioRef.current.duration) {
      setDuration(audioRef.current.duration);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  useEffect(() => {
    if (audioEnded) {
      textareaRef.current?.focus();
    }
  }, [audioEnded]);

  return (
    <div className="w-full pb-10">
      <div className="overflow-hidden px-4 sm:px-6 md:px-0">
        {/* Transcript Section - Full Width */}
        <div className="w-full">
          <div className="flex items-center justify-between relative mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">
              Transcription
            </h3>
            <button
              onClick={() => setShowInstructions(true)}
              className="sm:absolute sm:right-0 text-gray-500 hover:text-blue-600 transition-colors p-1.5 sm:p-2 rounded-full hover:bg-blue-50"
              title="View Instructions"
            >
              <FaInfoCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>

          {!audioEnded && (
            <div className="mb-4 p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
              <p className="text-gray-800 text-xs sm:text-md flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="mr-1.5 sm:mr-2 text-gray-400 flex-shrink-0"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span className="truncate">Transcription will be enabled after audio finishes.</span>
              </p>
            </div>
          )}

          <div className="relative mb-3 sm:mb-4">
            <textarea
              ref={textareaRef}
              className={`w-full p-3 sm:p-4 border-2 rounded-xl shadow-sm text-gray-700 bg-white resize-none focus:outline-none text-sm sm:text-base ${
                !audioEnded
                  ? "border-gray-300 bg-gray-100 cursor-not-allowed opacity-70"
                  : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              }`}
              rows={window.innerWidth < 640 ? 8 : 12}
              value={selectedAnswers[question.id] || ""}
              onChange={(e) =>
                audioEnded && handleAnswerSelect(question.id, e.target.value)
              }
              placeholder={
                !audioEnded
                  ? "Please listen to the audio first"
                  : "Type the script you heard in the audio..."
              }
              disabled={!audioEnded}
            />
            <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 text-[10px] sm:text-xs text-gray-500 bg-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
              {selectedAnswers[question.id]?.length || 0} characters
            </div>
          </div>

          {audioEnded && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mb-4 md:mb-0">
              <div className="text-xs sm:text-sm text-gray-500 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="mr-1.5 sm:mr-2 text-blue-400 flex-shrink-0"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <span className="text-center sm:text-left">Punctuation and capitalization matter</span>
              </div>
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

      {/* Fixed Audio Player - Positioned above navigation footer */}
      <div className="fixed bottom-[72px] sm:bottom-[58px] md:bottom-[76px] lg:bottom-2 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:w-[480px] lg:w-[700px] z-50 pointer-events-none">
        <div className="px-3 sm:px-4 md:px-0 pointer-events-auto">
          <div className="bg-white border border-gray-200 rounded-xl md:rounded-2xl shadow-lg md:shadow-md">
            <audio
              ref={audioRef}
              src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.audioUrl}`}
              onEnded={handleAudioEnd}
              onLoadedMetadata={(e) => setDuration(e.target.duration)}
              onTimeUpdate={handleTimeUpdate}
              preload="metadata"
              className="hidden"
            />

            <div
              ref={containerRef}
              className="flex items-center px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-2 gap-2 sm:gap-3 md:gap-4 relative transition-colors hover:border-gray-300 w-full"
              role="group"
              aria-label="Audio player"
            >
              {/* Play / Pause Button */}
              <button
                onClick={toggleAudio}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center text-white transition-colors bg-blue-600 hover:bg-blue-700 rounded-full flex-shrink-0"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Time Display - Hide on smallest screens */}
              <span className="text-[10px] sm:text-[11px] tracking-wide text-gray-600 font-medium flex-shrink-0 hidden xs:inline">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </span>

              {/* Progress Bar */}
              <div className="flex flex-1 min-w-[60px] sm:min-w-[80px] md:min-w-[100px] gap-1 select-none">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  step={0.01}
                  value={currentTime}
                  disabled
                  aria-label="Seek"
                  className="w-full h-1.5 rounded-full cursor-not-allowed appearance-none progress-range focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  style={{
                    background: duration
                      ? `linear-gradient(to right, #2563EB 0%, #2563EB ${(currentTime / duration) * 100}%, #d1d5db ${(currentTime / duration) * 100}%, #d1d5db 100%)`
                      : undefined,
                  }}
                />
              </div>

              {/* Volume Control */}
              <div className="flex items-center flex-shrink-0">
                {/* Volume Button */}
                <button
                  onClick={toggleVolumeBar}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-blue-600 hover:text-blue-700 transition-colors"
                  aria-label="Volume"
                >
                  {volume === 0 ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z" />
                    </svg>
                  )}
                </button>

                {/* Inline Volume Slider */}
                <div className={`transition-all duration-200 overflow-hidden ${showVolumeBar ? 'w-16 sm:w-20 md:w-28 opacity-100 ml-1 sm:ml-2' : 'w-0 opacity-0'}`}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume * 100}
                    onChange={handleVolumeChange}
                    aria-label="Volume level"
                    className="w-full h-1 bg-gray-100 rounded-full cursor-pointer appearance-none volume-slider focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                    style={{
                      background: `linear-gradient(to right, #2563EB 0%, #2563EB ${volume * 100}%, #e5e7eb ${volume * 100}%, #e5e7eb 100%)`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instruction Modal */}
      <QuestionInstructionModal
        type="Audio to script"
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />

      <style jsx>{`
        /* Custom breakpoint for extra small screens */
        @media (min-width: 480px) {
          .xs\\:inline {
            display: inline;
          }
        }
        
        .progress-range::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          background: #d1d5db;
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          cursor: not-allowed;
        }
        @media (min-width: 640px) {
          .progress-range::-webkit-slider-thumb {
            width: 16px;
            height: 16px;
          }
        }
        .progress-range::-webkit-slider-thumb:hover { background:#d1d5db; }
        .progress-range::-moz-range-thumb {
          width:14px; height:14px; background:#d1d5db; border-radius:50%; border:2px solid #fff; box-shadow:0 2px 4px rgba(0,0,0,0.15); cursor:not-allowed;
        }
        @media (min-width: 640px) {
          .progress-range::-moz-range-thumb {
            width:16px;
            height:16px;
          }
        }
        .progress-range::-moz-range-progress { background:#d1d5db; height:4px; }
        
        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #2563EB;
          cursor: pointer;
          border: 1px solid white;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        @media (min-width: 640px) {
          .volume-slider::-webkit-slider-thumb {
            width: 12px;
            height: 12px;
          }
        }
        .volume-slider::-webkit-slider-thumb:hover {
          background: #2563EB;
          transform: scale(1.1);
        }
        .volume-slider::-moz-range-thumb {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #2563EB;
          cursor: pointer;
          border: 1px solid white;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        @media (min-width: 640px) {
          .volume-slider::-moz-range-thumb {
            width: 12px;
            height: 12px;
          }
        }
      `}</style>
    </div>
  );
}