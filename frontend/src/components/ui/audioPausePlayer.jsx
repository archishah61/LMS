import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from "react-icons/fa";

const AudioPlayerForPause = forwardRef(
  (
    {
      fileUrl,
      onTimeUpdate,
      onEnded,
      stamps,
      onStampReached,
      autoPlay = false,
      fullWidth = false,
      disabled = false,
    },
    ref
  ) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [showVolumeControls, setShowVolumeControls] = useState(false);

    useImperativeHandle(ref, () => ({
      play: () => audioRef.current.play(),
      pause: () => audioRef.current.pause(),
      seek: (time) => {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
      },
      getCurrentTime: () => audioRef.current.currentTime,
      getDuration: () => audioRef.current.duration,
    }));

    const formatTime = (time) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    const togglePlayPause = () => {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    };

    const handleVolumeChange = (e) => {
      const newVolume = e.target.value / 100;
      setVolume(newVolume);
      audioRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    };

    const handleTimeUpdate = () => {
      const currentTime = audioRef.current.currentTime;
      setCurrentTime(currentTime);
      if (onTimeUpdate) onTimeUpdate(currentTime);
      stamps.forEach((stamp, index) => {
        if (
          currentTime >= stamp &&
          currentTime < (stamps[index + 1] || Infinity) &&
          currentTime !== stamp
        ) {
          if (onStampReached) onStampReached(index);
        }
      });
    };

    const handleAudioEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };

    const handleLoadedMetadata = () => {
      setDuration(audioRef.current.duration);
    };

    useEffect(() => {
      if (autoPlay && audioRef.current) {
        audioRef.current.play().catch((error) => {
          console.error("Audio play failed:", error);
        });
      }
    }, [autoPlay]);

    // Handle window resize for responsive behavior
    useEffect(() => {
      const handleResize = () => {
        if (window.innerWidth >= 768) {
          setShowVolumeControls(false);
        }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
      <div
        className={`flex items-center px-3 sm:px-4 md:px-5 py-2 sm:py-3 gap-2 sm:gap-3 md:gap-4 relative transition-colors ${fullWidth ? "w-full" : "w-full md:w-auto"
          }`}
      >
        <audio
          ref={audioRef}
          src={fileUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnded}
          onLoadedMetadata={handleLoadedMetadata}
          preload="metadata"
        />
        
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          disabled={disabled}
          className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center text-white transition-colors rounded-full bg-blue-600 flex-shrink-0 ${disabled ? "cursor-not-allowed opacity-50" : "hover:bg-blue-700"}`}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <FaPause className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          ) : (
            <FaPlay className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-0.5" />
          )}
        </button>
        
        {/* Time Display */}
        <span className="text-[10px] sm:text-[11px] tracking-wide text-gray-600 font-medium flex-shrink-0">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        
        {/* Progress Bar (Disabled) */}
        <div className="flex flex-col flex-1 gap-1 select-none min-w-[60px] sm:min-w-[80px] md:min-w-0">
          <input
            type="range"
            min="0"
            max={duration || 0}
            step={0.01}
            value={currentTime}
            disabled // <-- Disabled to prevent manual seeking
            className="w-full h-1 sm:h-1.5 rounded-full cursor-not-allowed appearance-none progress-range focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            style={{
              background: duration
                ? `linear-gradient(to right, #2563EB 0%, #2563EB ${(currentTime / duration) * 100
                }%, #d1d5db ${(currentTime / duration) * 100
                }%, #d1d5db 100%)`
                : undefined,
            }}
          />
        </div>
        
        {/* Volume Controls - Desktop */}
        <div className="hidden md:flex items-center gap-2 min-w-[70px] justify-end">
          <button
            onClick={toggleMute}
            className="w-8 h-8 flex items-center justify-center text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0"
            aria-label="Volume"
          >
            {isMuted || volume === 0 ? (
              <FaVolumeMute className="w-4 h-4 md:w-5 md:h-5" />
            ) : (
              <FaVolumeUp className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={volume * 100}
            onChange={handleVolumeChange}
            aria-label="Volume level"
            className="w-16 lg:w-20 h-1 bg-gray-100 rounded-full cursor-pointer appearance-none volume-slider focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            style={{
              background: `linear-gradient(to right, #2563EB 0%, #2563EB ${volume * 100
                }%, #e5e7eb ${volume * 100}%, #e5e7eb 100%)`,
            }}
          />
        </div>

        {/* Mobile Volume Toggle */}
        <div className="relative md:hidden flex items-center">
          <button
            onClick={() => setShowVolumeControls(!showVolumeControls)}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0"
            aria-label="Volume controls"
          >
            {isMuted || volume === 0 ? (
              <FaVolumeMute className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            ) : (
              <FaVolumeUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </button>
          
          {/* Mobile Volume Slider (appears on click) */}
          {showVolumeControls && (
            <div className="absolute bottom-full mb-2 right-0 bg-white rounded-lg shadow-lg p-3 border border-gray-200 z-50">
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="w-6 h-6 flex items-center justify-center text-blue-600"
                >
                  {isMuted || volume === 0 ? (
                    <FaVolumeMute className="w-3.5 h-3.5" />
                  ) : (
                    <FaVolumeUp className="w-3.5 h-3.5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={handleVolumeChange}
                  aria-label="Volume level"
                  className="w-24 h-1 bg-gray-100 rounded-full cursor-pointer appearance-none volume-slider-mobile"
                  style={{
                    background: `linear-gradient(to right, #2563EB 0%, #2563EB ${volume * 100
                      }%, #e5e7eb ${volume * 100}%, #e5e7eb 100%)`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Custom Styles for Sliders */}
        <style jsx>{`
          .progress-range::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            background: #2563EB;
            border-radius: 50%;
            border: 2px solid #fff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
            cursor: not-allowed;
          }
          
          @media (min-width: 640px) {
            .progress-range::-webkit-slider-thumb {
              width: 14px;
              height: 14px;
            }
          }
          
          @media (min-width: 768px) {
            .progress-range::-webkit-slider-thumb {
              width: 16px;
              height: 16px;
            }
          }
          
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
          
          @media (min-width: 768px) {
            .volume-slider::-webkit-slider-thumb {
              width: 12px;
              height: 12px;
            }
          }
          
          .volume-slider-mobile::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #2563EB;
            cursor: pointer;
            border: 1px solid white;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          }
          
          .volume-slider::-webkit-slider-thumb:hover,
          .volume-slider-mobile::-webkit-slider-thumb:hover {
            transform: scale(1.1);
          }
        `}</style>
      </div>
    );
  }
);

export default AudioPlayerForPause;