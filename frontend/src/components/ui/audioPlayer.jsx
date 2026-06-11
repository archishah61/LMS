/* eslint-disable no-unused-vars */
"use client"

/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
import { useEffect, useRef, useState, useCallback } from "react"
import { FaPause, FaPlay } from "react-icons/fa"

export default function AudioPlayer({ fileUrl, onComplete, autoPlay = true, width = 600, fullWidth = false, isTopicCompleted }) {
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const [audioDuration, setAudioDuration] = useState(0)
  const [currentAudioTime, setCurrentAudioTime] = useState(0)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [showVolumeBar, setShowVolumeBar] = useState(false)
  const [volume, setVolume] = useState(1)
  const [bufferedPercent, setBufferedPercent] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const audioRef = useRef(null)
  const containerRef = useRef(null)
  const lastEmitRef = useRef(null);

  const widthValue = typeof width === 'number' ? `${width}px` : width
  const widthClass = fullWidth
    ? `w-full max-w-[${widthValue}]`
    : `w-full md:w-[${widthValue}]`

  // keep element volume in sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const toggleVolumeBar = () => setShowVolumeBar(prev => !prev)

  // close volume on outside click
  useEffect(() => {
    if (!showVolumeBar) return
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowVolumeBar(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showVolumeBar])

  const updateBuffered = () => {
    if (!audioRef.current) return
    try {
      const { buffered, duration } = audioRef.current
      if (duration && buffered.length) {
        const end = buffered.end(buffered.length - 1)
        setBufferedPercent((end / duration) * 100)
      }
    } catch (_) { /* ignore */ }
  }

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentAudioTime(audioRef.current.currentTime);
    if (!audioDuration && audioRef.current.duration) setAudioDuration(audioRef.current.duration);
    updateBuffered();

    const playing = !audioRef.current.paused;
    setIsPlaying(playing);
    try {
      const state = playing ? 'playing' : 'paused';
      if (lastEmitRef.current !== state) {
        lastEmitRef.current = state;
        window.dispatchEvent(new CustomEvent('AUDIO_PLAY_STATE_CHANGE', { detail: { state } }));
      }
    } catch (e) {
      // ignore
    }
  };


  const handleVolumeChange = (e) => {
    const newVolume = e.target.value / 100
    setVolume(newVolume)
    audioRef.current.volume = newVolume
    setIsAudioMuted(newVolume === 0)
  }

  const demoFileUrl = fileUrl || "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"

  // reset when src changes
  useEffect(() => {
    setAudioDuration(0)
    setCurrentAudioTime(0)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      if (autoPlay) audioRef.current.play().catch(() => { })
    }
  }, [demoFileUrl, autoPlay])


  // Add this useEffect hook after your existing useEffect hooks
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden - pause if playing
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause()
          // Store the playing state to resume later
          audioRef.current._wasPlaying = true
        }
      } else {
        // Tab visible again - resume if it was playing
        if (audioRef.current && audioRef.current._wasPlaying) {
          audioRef.current.play();
          audioRef.current._wasPlaying = false
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Clear saved state when audio completes
  const onCompleteAudio = () => {
    // no persisted state to clear; start fresh on next load
    setIsPlaying(false);
    try {
      lastEmitRef.current = 'ended';
      window.dispatchEvent(new CustomEvent('AUDIO_PLAY_STATE_CHANGE', { detail: { state: 'ended' } }));
    } catch (e) { /* ignore emit errors */ }
    onComplete && onComplete();
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
      try {
        lastEmitRef.current = 'playing';
        window.dispatchEvent(new CustomEvent('AUDIO_PLAY_STATE_CHANGE', { detail: { state: 'playing' } }));
      } catch (e) { /* ignore emit errors */ }
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
      try {
        lastEmitRef.current = 'paused';
        window.dispatchEvent(new CustomEvent('AUDIO_PLAY_STATE_CHANGE', { detail: { state: 'paused' } }));
      } catch (e) { /* ignore emit errors */ }
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;

    const value = Number(e.target.value);

    // Block dragging if topic not completed
    // if (!isTopicCompleted) return;

    audioRef.current.currentTime = value;
    setCurrentAudioTime(value);
  };

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label="Audio player"
      className={`flex items-center justify-center gap-2 md:gap-4 relative ${widthClass} mx-auto px-2 py-2`}
    >
      <audio
        ref={audioRef}
        onLoadedMetadata={(e) => {
          setAudioDuration(e.target.duration)
          updateBuffered()
        }}
        onProgress={updateBuffered}
        onTimeUpdate={handleAudioTimeUpdate}
        onEnded={onCompleteAudio}
        preload="metadata"
        src={demoFileUrl}
        autoPlay={autoPlay}
      />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="w-8 h-8 flex items-center justify-center text-blue-600 hover:text-blue-700 transition-colors"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <FaPause className="w-5 h-5" />
        ) : (
          <FaPlay className="w-5 h-5" />
        )}
      </button>

      {/* Time Display */}
      <span className="text-[11px] tracking-wide text-gray-600 font-medium flex-shrink-0 min-w-[60px] text-center">
        {formatDuration(currentAudioTime)} / {formatDuration(audioDuration)}
      </span>

      {/* Progress Bar */}
      <div className="flex flex-col flex-1 gap-1 select-none min-w-0">
        <input
          type="range"
          min="0"
          max={audioDuration || 0}
          step={0.01}
          value={currentAudioTime}
          onChange={handleSeek}
          // disabled={!isTopicCompleted}   // <---- seek disabled if topic not completed
          aria-label="Seek"
          className={`w-full h-1.5 rounded-full appearance-none progress-range focus:outline-none
    ${isTopicCompleted ? "cursor-pointer" : "cursor-not-allowed"}
  `}
          style={{
            background: audioDuration
              ? `linear-gradient(to right, #2563EB 0%, #2563EB ${(currentAudioTime / audioDuration) * 100}%, #d1d5db ${(currentAudioTime / audioDuration) * 100}%, #d1d5db ${bufferedPercent}%, #e5e7eb ${bufferedPercent}%)`
              : undefined,
          }}
        />

      </div>

      {/* Volume Controls */}
      <div className="flex items-center flex-shrink-0 justify-end">
        {/* Volume Button */}
        <button
          onClick={toggleVolumeBar}
          className="w-8 h-8 flex items-center justify-center text-blue-600 hover:text-blue-700 transition-colors"
          aria-label="Volume"
        >
          {isAudioMuted || volume === 0 ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z" />
            </svg>
          )}
        </button>

        {/* Inline Volume Slider - Aligned with progress bar */}
        <div className={`transition-all duration-200 flex items-center ${showVolumeBar ? 'w-16 lg:w-28 opacity-100 ml-1' : 'w-0 opacity-0'}`}>
          <input
            type="range"
            min="0"
            max="100"
            value={volume * 100}
            onChange={handleVolumeChange}
            aria-label="Volume level"
            className="w-full h-1.5 rounded-full cursor-pointer appearance-none volume-slider focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            style={{
              background: `linear-gradient(to right, #2563EB 0%, #2563EB ${volume * 100}%, #e5e7eb ${volume * 100}%, #e5e7eb 100%)`,
            }}
          />
        </div>
      </div>

      <style jsx>{`
        .progress-range::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #2563EB;
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          cursor: default;
        }
        .progress-range::-webkit-slider-thumb:hover { background:#2563EB; }
        .progress-range::-moz-range-thumb {
          width:16px; height:16px; background:#111827; border-radius:50%; border:2px solid #fff; box-shadow:0 2px 4px rgba(0,0,0,0.15); cursor:default;
        }
        .progress-range::-moz-range-progress { background:#111827; height:4px; }
        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #2563EB;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }
        .volume-slider::-webkit-slider-thumb:hover {
          background: #2563EB;
        }
        .volume-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #2563EB;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  )
}