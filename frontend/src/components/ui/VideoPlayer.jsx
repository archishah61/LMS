/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import { FaCompress, FaExpand, FaPause, FaPlay } from "react-icons/fa";


export default function VideoPlayer({ fileUrl, captionsUrl, onComplete, autoPlay = true, style = {}, isEmbedded = false, isTopicCompleted, onPlayStateChange }) {
  // controlls restricted code
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [script, setScript] = useState("");
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const videoRef = useRef(null);
  const videoWrapperRef = useRef(null);
  const hideTimer = useRef(null);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    hasCompletedRef.current = false; // reset when video changes
  }, [fileUrl]);

  useEffect(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);

    hideTimer.current = setTimeout(() => {
      setIsHovering(false);
    }, 3000); // hide after 3 sec
  }, [isHovering]);

  useEffect(() => {
    if (captionsUrl) {
      fetch(captionsUrl)
        .then((res) => res.text())
        .then((text) => {
          // Clean VTT/SRT (optional, simple example)
          const clean = text
            .replace(/WEBVTT/g, "")
            .replace(/\d+\n/g, "")
            .replace(/(\d{2}:\d{2}:\d{2}\.\d{3} -->.*)/g, "")
            .trim();
          setScript(clean);
        });
    }
  }, [captionsUrl]);
  const handleVolumeChange = (e) => {
    const volume = e.target.value / 100;
    videoRef.current.volume = volume;
    setIsMuted(volume === 0);
  };
  const toggleMute = () => {
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };
  const handleFullscreen = () => {
    const isFullscreen =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement;
    setIsFullScreen(!isFullscreen);
    if (isFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    } else {
      const wrapper = videoWrapperRef.current;
      if (wrapper.requestFullscreen) {
        wrapper.requestFullscreen();
      } else if (wrapper.webkitRequestFullscreen) {
        wrapper.webkitRequestFullscreen();
      } else if (wrapper.msRequestFullscreen) {
        wrapper.msRequestFullscreen();
      }
    }
  };

  // Add this useEffect to listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
      setIsFullScreen(isCurrentlyFullscreen);
    };

    // Add event listeners for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleTimeUpdate = () => {
      setCurrentTime(videoRef.current.currentTime);
      const playing = !videoRef.current.paused;
      setIsPlaying(playing);
      if (typeof onPlayStateChange === 'function') onPlayStateChange(!playing ? 'paused' : 'playing');
    };

    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      videoElement.addEventListener('loadedmetadata', (e) => setVideoDuration(e.target.duration));
      videoElement.addEventListener('ended', () => {
        if (hasCompletedRef.current) return;

        hasCompletedRef.current = true;

        // Exit fullscreen on video end
        if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
          if (document.exitFullscreen) document.exitFullscreen();
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
          else if (document.msExitFullscreen) document.msExitFullscreen();
        }

        if (onComplete) onComplete();
        if (typeof onPlayStateChange === 'function') onPlayStateChange('ended');
      });
    }
    return () => {
      if (videoElement) {
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
  }, [onComplete, fileUrl, onPlayStateChange]);


  // Effect for handling tab visibility changes (pause when hidden, resume when visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden - pause if playing
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
          // Store the playing state to resume later
          videoRef.current._wasPlaying = true;
        }
      } else {
        // Tab visible again - resume if it was playing
        if (videoRef.current && videoRef.current._wasPlaying) {
          videoRef.current.play();
          videoRef.current._wasPlaying = false;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // removed persistence: video no longer saves currentTime to localStorage

  // removed restore-from-localStorage; video will start from beginning on mount

  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      if (typeof onPlayStateChange === 'function') onPlayStateChange('playing');
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      if (typeof onPlayStateChange === 'function') onPlayStateChange('paused');
    }
  };

  const handleSeek = (e) => {
    if (!videoRef.current) return;

    const value = Number(e.target.value);

    // If topic not completed → block manual seeking
    // if (!isTopicCompleted) return;

    videoRef.current.currentTime = value;
    setCurrentTime(value);
  };


  return (
    <div
      className="relative w-full bg-gradient-to-b from-gray-900 to-black rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:shadow-xl mx-auto"
      style={isEmbedded ? { width: "160px", height: "200px", ...style } : style}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={() => setIsHovering(true)}
    >
      <div
        ref={videoWrapperRef}
        className={`relative ${!isFullScreen && !isEmbedded ? "pt-[56.25%]" : ""}`}
        style={isEmbedded ? { width: "100%", height: "100%" } : {}}
      >
        {fileUrl ? (
          <>
            <video
              ref={videoRef}
              className="absolute top-0 left-0 w-full h-full rounded-xl "
              style={isEmbedded ? { objectFit: "contain" } : { objectFit: "contain" }}
              src={fileUrl}
              preload="metadata"
              muted={isMuted}
              autoPlay={autoPlay}
              controls={false}
            >
              {captionsUrl && <track src={captionsUrl} kind="subtitles" />}
              Your browser does not support the video tag.
            </video>
            {script && (
              <div className="mt-4 bg-gray-800 p-3 rounded-lg text-white max-h-60 overflow-y-auto">
                <h3 className="font-semibold mb-2">Transcript</h3>
                <pre className="whitespace-pre-wrap text-sm">{script}</pre>
              </div>
            )}
            {!isEmbedded && (
              <>

                <div
                  className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 to-transparent px-4 py-3 flex items-center gap-3 opacity-100"
                >
                  {/* Play / Pause */}
                  <button
                    onClick={togglePlayPause}
                    className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-all"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <FaPause className="w-4 h-4 ml-0.5" />
                    ) : (
                      <FaPlay className="w-4 h-4 ml-1" />
                    )}
                  </button>

                  {/* Volume */}
                  <div className="flex items-center group/volume">
                    <button
                      onClick={toggleMute}
                      className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-all"
                      aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                        </svg>
                      )}
                    </button>
                    <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 flex items-center ml-1">
                      <div className="relative w-full h-1 bg-gray-600/50 rounded-full">
                        <div
                          className="absolute h-full bg-blue-600 rounded-full"
                          style={{ width: `${isMuted ? 0 : videoRef.current?.volume * 100 || 100}%` }}
                        />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={isMuted ? 0 : videoRef.current?.volume * 100 || 100}
                          onChange={handleVolumeChange}
                          className="absolute w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Progress Fill */}
                  <div className="flex-1 relative h-1.5 bg-gray-600/50 rounded-full group/progress cursor-pointer">
                    <div
                      className="bg-blue-600 h-full rounded-full absolute top-0 left-0 transition-all duration-150"
                      style={{ width: `${(currentTime / videoDuration) * 100}%` }}
                    />
                    {/* Seekbar */}
                    <input
                      type="range"
                      min="0"
                      max={videoDuration}
                      step="0.1"
                      value={currentTime}
                      onChange={handleSeek}
                      className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer`}
                    // disabled={!isTopicCompleted}
                    />
                  </div>

                  {/* Time */}
                  <div className="text-white text-xs font-medium whitespace-nowrap">
                    {formatDuration(currentTime)} / {formatDuration(videoDuration)}
                  </div>

                  {/* Fullscreen */}
                  <button
                    onClick={handleFullscreen}
                    className="text-white hover:text-blue-400 transition-colors p-1"
                    aria-label="Fullscreen"
                  >
                    {isFullScreen ? <FaCompress className="w-4 h-4" /> : <FaExpand className="w-4 h-4" />}
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="relative" style={{ paddingTop: "56.25%" }}>
            <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl">
              <svg className="w-12 h-12 text-gray-400 mb-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400 font-medium">Video not available</p>
              <p className="text-gray-500 text-sm mt-2">Please check back later</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}