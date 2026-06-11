import { useEffect, useRef, useState } from "react";

export default function AudioPlayer({ fileUrl, onComplete, autoPlay = true, navbarHeight = 60 }) {
    const formatDuration = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };
    const [audioDuration, setAudioDuration] = useState(0);
    const [currentAudioTime, setCurrentAudioTime] = useState(0);
    const [isAudioPlaying, setIsAudioPlaying] = useState(autoPlay);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const [position, setPosition] = useState({ x: 20, y: navbarHeight + 20 }); // Start below navbar
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [hasDragged, setHasDragged] = useState(false);
    const audioRef = useRef(null);
    const hideTimeoutRef = useRef(null);
    const dragRef = useRef(null);

    // Icon and modal dimensions
    const ICON_SIZE = 56; // Reduced from 80
    const MODAL_WIDTH = 280; // Reduced from 384
    const MODAL_HEIGHT = 420; // Reduced from 600

    // Reset auto-hide timer on user interaction
    const resetHideTimeout = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }
        hideTimeoutRef.current = setTimeout(() => {
            setIsExpanded(false);
        }, 5000);
    };

    // Auto-hide functionality
    useEffect(() => {
        if (isExpanded) {
            resetHideTimeout();
        }
        return () => {
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, [isExpanded]);

    // Dragging functionality with boundaries
    const handleMouseDown = (e) => {
        if (!isExpanded) {
            setIsDragging(true);
            setHasDragged(false);
            const rect = dragRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && !isExpanded) {
            setHasDragged(true);
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            // Set boundaries considering navbar and margins
            const maxX = window.innerWidth - ICON_SIZE - 20; // 20px right margin
            const maxY = window.innerHeight - ICON_SIZE - 20; // 20px bottom margin
            const minY = navbarHeight + 20; // 20px below navbar

            setPosition({
                x: Math.max(20, Math.min(newX, maxX)), // 20px left margin
                y: Math.max(minY, Math.min(newY, maxY)),
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isDragging, dragOffset]);

    const onCompleteAudio = () => {
        setIsAudioPlaying(false);
        onComplete && onComplete();
    };

    const handlePlayPauseAudio = () => {
        if (audioRef.current.paused) {
            audioRef.current.play();
        } else {
            audioRef.current.pause();
        }
        setIsAudioPlaying(!audioRef.current.paused);
        resetHideTimeout();
    };

    const toggleAudioMute = () => {
        audioRef.current.muted = !audioRef.current.muted;
        setIsAudioMuted(audioRef.current.muted);
        resetHideTimeout();
    };

    const handleAudioTimeUpdate = () => {
        setCurrentAudioTime(audioRef.current.currentTime);
    };

    const handleAudioProgressChange = (e) => {
        const newTime = e.target.value;
        audioRef.current.currentTime = (newTime / 100) * audioDuration;
        setCurrentAudioTime(audioRef.current.currentTime);
        resetHideTimeout();
    };

    const handleAudioVolumeChange = (e) => {
        const volume = e.target.value / 100;
        audioRef.current.volume = volume;
        setIsAudioMuted(volume === 0);
        resetHideTimeout();
    };

    const handleIconClick = () => {
        if (!hasDragged) {
            setIsExpanded(true);
        }
    };

    const getModalPosition = () => {
        let modalX = position.x;
        let modalY = position.y;

        // Adjust if modal would go off right edge
        if (position.x + MODAL_WIDTH > window.innerWidth - 20) {
            modalX = position.x - MODAL_WIDTH + ICON_SIZE;
        }

        // Adjust if modal would go off bottom edge
        if (position.y + MODAL_HEIGHT > window.innerHeight - 20) {
            modalY = position.y - MODAL_HEIGHT + ICON_SIZE;
        }

        // Ensure modal doesn't go above navbar
        modalY = Math.max(navbarHeight + 20, modalY);
        modalX = Math.max(20, modalX);

        return { x: modalX, y: modalY };
    };

    const demoFileUrl = fileUrl || "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav";

    return (
        <>
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

            {/* Collapsed Audio Icon - Draggable */}
            {!isExpanded && (
                <div
                    ref={dragRef}
                    className="fixed z-50 cursor-move"
                    style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                        userSelect: "none",
                    }}
                    onMouseDown={handleMouseDown}
                    onClick={handleIconClick}
                >
                    <div className="relative">
                        {isAudioPlaying && (
                            <>
                                <div className="absolute inset-0 w-14 h-14 rounded-full bg-gradient-to-r from-blue-400 via-indigo-400 to-slate-400 animate-ping opacity-30 scale-110"></div>
                                <div
                                    className="absolute inset-0 w-14 h-14 rounded-full bg-gradient-to-r from-slate-400 via-blue-400 to-indigo-400 animate-pulse opacity-20 scale-105"
                                    style={{ animationDelay: "0.5s" }}
                                ></div>
                            </>
                        )}
                        <div
                            className={`w-14 h-14 rounded-full bg-gradient-to-br shadow-lg border-3 flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300 ${isAudioPlaying
                                ? "border-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-slate-500 shadow-blue-500/25"
                                : "border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200"
                                }`}
                        >
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}

            {/* Expanded Audio Player */}
            {isExpanded && (
                <div
                    className="z-40"
                    onMouseMove={resetHideTimeout}
                    onClick={resetHideTimeout}
                >
                    <div
                        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-5 flex flex-col items-center gap-6 transform animate-in zoom-in-95 duration-300 fixed"
                        style={{
                            left: `${getModalPosition().x}px`,
                            top: `${getModalPosition().y}px`,
                            width: `${MODAL_WIDTH}px`,
                        }}
                    >
                        {/* Speaker Section - Top */}
                        <div className="relative flex-shrink-0">
                            {isAudioPlaying && (
                                <>
                                    <div className="absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-r from-blue-400 via-indigo-400 to-slate-400 animate-ping opacity-15 scale-110"></div>
                                    <div
                                        className="absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-r from-slate-400 via-blue-400 to-indigo-400 animate-pulse opacity-20 scale-105"
                                        style={{ animationDelay: "0.5s" }}
                                    ></div>
                                    <div
                                        className="absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-r from-indigo-400 via-slate-400 to-blue-400 animate-bounce opacity-10 scale-100"
                                        style={{ animationDelay: "1s" }}
                                    ></div>
                                </>
                            )}
                            <div
                                className={`relative w-32 h-32 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-3 transition-all duration-500 ${isAudioPlaying
                                    ? "border-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-slate-500 shadow-xl shadow-blue-500/25 animate-pulse"
                                    : "border-gray-300 shadow-md"
                                    }`}
                            >
                                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                    <div
                                        className={`w-16 h-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 border-2 border-gray-500 flex items-center justify-center transition-all duration-300 ${isAudioPlaying ? "animate-pulse scale-105" : ""
                                            }`}
                                    >
                                        <div
                                            className={`w-8 h-8 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 transition-all duration-300 ${isAudioPlaying ? "animate-bounce" : ""
                                                }`}
                                        ></div>
                                    </div>
                                    {isAudioPlaying && (
                                        <>
                                            <div className="absolute w-20 h-20 rounded-full border-2 border-blue-400/30 animate-ping"></div>
                                            <div
                                                className="absolute w-24 h-24 rounded-full border border-indigo-400/20 animate-pulse"
                                                style={{ animationDelay: "0.3s" }}
                                            ></div>
                                            <div
                                                className="absolute w-28 h-28 rounded-full border border-slate-400/15 animate-ping"
                                                style={{ animationDelay: "0.6s" }}
                                            ></div>
                                        </>
                                    )}
                                </div>
                                <button
                                    onClick={handlePlayPauseAudio}
                                    className="absolute inset-0 w-32 h-32 rounded-full flex items-center justify-center bg-black/10 hover:bg-black/20 transition-all duration-300 group"
                                    aria-label={isAudioPlaying ? "Pause" : "Play"}
                                >
                                    <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-200 border border-gray-200">
                                        {isAudioPlaying ? (
                                            <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-gray-700 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        )}
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Controls Section - Bottom */}
                        <div className="flex flex-col gap-4 w-full">
                            <div className="text-lg font-mono font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-600 bg-clip-text text-transparent text-center">
                                {formatDuration(currentAudioTime)} / {formatDuration(audioDuration)}
                            </div>

                            <div className="w-full">
                                <div className="relative h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                    <div
                                        className="absolute h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-slate-500 rounded-full transition-all duration-150 shadow-sm"
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

                            <div className="flex items-center gap-4 justify-center">
                                <button
                                    onClick={toggleAudioMute}
                                    className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm"
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
                                <div className="relative flex-1 max-w-24">
                                    <div className="h-2 bg-gray-200 rounded-full shadow-inner">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-150"
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

                        <div className="text-xs text-gray-500 text-center opacity-60">
                            Auto-hide in 5s
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}