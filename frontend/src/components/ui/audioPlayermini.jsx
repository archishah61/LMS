"use client"

import { useEffect, useRef, useState } from "react"

export default function AudioPlayer({ fileUrl, onComplete, autoPlay = true }) {
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const [audioDuration, setAudioDuration] = useState(0)
  const [currentAudioTime, setCurrentAudioTime] = useState(0)
  const [isAudioPlaying, setIsAudioPlaying] = useState(autoPlay)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    if (audioRef.current) {
      setIsAudioPlaying(!audioRef.current.paused)
    }
  }, [audioRef?.current?.paused])

  const onCompleteAudio = () => {
    setIsAudioPlaying(false)
    onComplete && onComplete()
  }

  const handlePlayPauseAudio = () => {
    if (audioRef.current.paused) {
      audioRef.current.play()
    } else {
      audioRef.current.pause()
    }
    setIsAudioPlaying(!audioRef.current.paused)
  }

  const toggleAudioMute = () => {
    audioRef.current.muted = !audioRef.current.muted
    setIsAudioMuted(audioRef.current.muted)
  }

  const handleAudioTimeUpdate = () => {
    setCurrentAudioTime(audioRef.current.currentTime)
  }

  const handleAudioProgressChange = (e) => {
    const newTime = e.target.value
    audioRef.current.currentTime = (newTime / 100) * audioDuration
    setCurrentAudioTime(audioRef.current.currentTime)
  }

  const handleAudioVolumeChange = (e) => {
    const volume = e.target.value / 100
    audioRef.current.volume = volume
    setIsAudioMuted(volume === 0)
  }

  // Demo file URL for testing
  const demoFileUrl = fileUrl || "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav";

  return (
    <div className="w-full p-4 bg-gray-50">
      <div className="w-full bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <audio
          ref={audioRef}
          onLoadedMetadata={(e) => setAudioDuration(e.target.duration)}
          onTimeUpdate={handleAudioTimeUpdate}
          onEnded={onCompleteAudio}
          src={demoFileUrl}
          autoPlay={autoPlay}
        >
          Your browser does not support the audio element.
        </audio>

        {/* Main Controls Container */}
        <div className="flex items-center gap-4 w-full">
          
          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPauseAudio}
            className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 transition-all duration-200 flex items-center justify-center shadow-md group"
            aria-label={isAudioPlaying ? "Pause" : "Play"}
          >
            {isAudioPlaying ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Current Time */}
          <div className="text-sm text-gray-600 font-mono min-w-fit">
            {formatDuration(currentAudioTime)}
          </div>

          {/* Progress Bar Container */}
          <div className="flex-1 relative">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-150"
                style={{ width: `${(currentAudioTime / audioDuration) * 100}%` }}
              ></div>
              <input
                type="range"
                min="0"
                max="100"
                value={(currentAudioTime / audioDuration) * 100 || 0}
                onChange={handleAudioProgressChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Total Duration */}
          <div className="text-sm text-gray-600 font-mono min-w-fit">
            {formatDuration(audioDuration)}
          </div>

          {/* Volume Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleAudioMute}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label={isAudioMuted ? "Unmute" : "Mute"}
            >
              {isAudioMuted ? (
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>
            
            {/* Volume Slider */}
            <div className="relative w-20">
              <div className="h-1.5 bg-gray-200 rounded-full">
                <div
                  className="h-full bg-gray-400 rounded-full transition-all duration-150"
                  style={{ width: `${isAudioMuted ? 0 : (audioRef.current?.volume || 1) * 100}%` }}
                ></div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={isAudioMuted ? 0 : (audioRef.current?.volume || 1) * 100}
                onChange={handleAudioVolumeChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}