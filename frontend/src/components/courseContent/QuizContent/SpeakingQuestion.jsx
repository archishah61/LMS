"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, Play, Pause, Square, Volume2, CheckCircle, XCircle, X, AlertCircle } from "lucide-react"

const SpeakingQuestion = ({ currentQuestion, handleAnswerSelect, selectedAnswers, isPauseQuestion = false, check, setCheck }) => {
    const [isRecording, setIsRecording] = useState(false)
    const [recordedAudio, setRecordedAudio] = useState(null)
    const [recordedBlob, setRecordedBlob] = useState(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [playingAudio, setPlayingAudio] = useState(null)
    const [micPermission, setMicPermission] = useState(null)
    const [recordingTime, setRecordingTime] = useState(0)
    const [liveTranscript, setLiveTranscript] = useState("")
    const [finalTranscript, setFinalTranscript] = useState("")
    const [audioCurrentTime, setAudioCurrentTime] = useState(0)
    const [audioDuration, setAudioDuration] = useState(0)

    const [speakerChecked, setSpeakerChecked] = useState(check?.speakerCheck || false)
    const [micChecked, setMicChecked] = useState(check?.micCheck || false)
    const [showSpeakerModal, setShowSpeakerModal] = useState(false)
    const [showMicModal, setShowMicModal] = useState(false)
    const [micTestAudio, setMicTestAudio] = useState(null)
    const [micTestRecording, setMicTestRecording] = useState(false)
    const [countdown, setCountdown] = useState(0)
    const [isCountingDown, setIsCountingDown] = useState(false)
    const [autoRecordingStarted, setAutoRecordingStarted] = useState(false)
    const [questionAudioPlayed, setQuestionAudioPlayed] = useState(false)

    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])
    const questionAudioRef = useRef(null)
    const answerAudioRef = useRef(null)
    const micTestAudioRef = useRef(null)
    const recordingTimerRef = useRef(null)
    const countdownTimerRef = useRef(null)
    const transcriptRef = useRef(null)
    const containerRef = useRef(null)

    // Audio Player State
    const [volume, setVolume] = useState(1)
    const [showVolumeBar, setShowVolumeBar] = useState(false)

    // Browser Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    let recognitionRef = useRef(null)

    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
        }
    }, [liveTranscript, finalTranscript])

    // Check for system checks on component mount and question change
    useEffect(() => {
        if (!speakerChecked) {
            setShowSpeakerModal(true)
        } else if (!micChecked) {
            setShowMicModal(true)
        }
    }, [speakerChecked, micChecked])

    // Reset question audio played status when question changes
    useEffect(() => {
        // RESET TRANSCRIPTS WHEN QUESTION CHANGES
        setLiveTranscript("")
        setFinalTranscript("")

        const existingAnswer = selectedAnswers[currentQuestion.id]
        if (existingAnswer) {
            setQuestionAudioPlayed(existingAnswer?.isQuestionAudioPlayed || false)
            if (existingAnswer.audioBlob) {
                setRecordedBlob(existingAnswer.audioBlob)
                setRecordedAudio(existingAnswer.audioUrl)
            }
        } else {
            setQuestionAudioPlayed(false)
            // Clean up audio when question changes
            setRecordedAudio(null)
            setRecordedBlob(null)
            setRecordingTime(0)
        }

        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current)
            }
            if (countdownTimerRef.current) {
                clearInterval(countdownTimerRef.current)
            }
            // Clean up speech recognition when component unmounts or question changes
            if (recognitionRef.current) {
                recognitionRef.current.stop()
                recognitionRef.current = null
            }
        }
    }, [currentQuestion.id, selectedAnswers])

    useEffect(() => {
        if (speakerChecked && micChecked) {
            setCheck({ speakerCheck: true, micCheck: true, flag: true })
        }
    }, [speakerChecked, micChecked, setCheck])

    const requestMicPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            setMicPermission("granted")
            stream.getTracks().forEach((track) => track.stop())
            return true
        } catch (error) {
            console.error("Microphone permission denied:", error)
            setMicPermission("denied")
            return false
        }
    }

    const handleSpeakerCheckClick = () => {
        if (!speakerChecked) {
            setShowSpeakerModal(true)
        }
    }

    const handleMicCheckClick = async () => {
        if (!micChecked && speakerChecked) {
            const hasPermission = await requestMicPermission()
            if (hasPermission) {
                setShowMicModal(true)
            }
        }
    }

    const startMicTestInModal = async () => {
        setMicTestRecording(true)

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            const chunks = []

            mediaRecorder.ondataavailable = (event) => {
                chunks.push(event.data)
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: "audio/wav" })
                const audioUrl = URL.createObjectURL(blob)
                setMicTestAudio(audioUrl)
                stream.getTracks().forEach((track) => track.stop())
            }

            mediaRecorder.start()

            setTimeout(() => {
                if (mediaRecorder.state === "recording") {
                    mediaRecorder.stop()
                    setMicTestRecording(false)
                }
            }, 3000)
        } catch (error) {
            console.error("Error accessing microphone:", error)
            setMicTestRecording(false)
        }
    }

    // Audio Player Functions
    useEffect(() => {
        if (questionAudioRef.current) questionAudioRef.current.volume = volume
    }, [volume])

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

    const toggleQuestionAudio = () => {
        if (questionAudioRef.current) {
            if (isPlaying && playingAudio === "question") {
                questionAudioRef.current.pause()
            } else {
                // Pause answer audio if playing
                if (answerAudioRef.current) answerAudioRef.current.pause()
                questionAudioRef.current.play()
                setPlayingAudio("question")
            }
        }
    }

    const toggleVolumeBar = () => setShowVolumeBar(prev => !prev)

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value) / 100
        setVolume(newVolume)
    }

    const formatDuration = (seconds) => {
        if (!seconds) return "0:00"
        const minutes = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${minutes}:${secs.toString().padStart(2, "0")}`
    }

    const playQuestionAudio = () => {
        if (questionAudioRef.current && currentQuestion.speakingAudioUrl) {
            questionAudioRef.current.play()
            setIsPlaying(true)
            setPlayingAudio("question")

            questionAudioRef.current.onended = () => {
                setIsPlaying(false)
                setPlayingAudio(null)
                setQuestionAudioPlayed(true)
            }
        }
    }

    const startRecording = async () => {
        // Check if recording is allowed
        const canRecord = !(currentQuestion.audio_url || currentQuestion.speakingAudioUrl) || questionAudioPlayed
        if (!canRecord) {
            return
        }

        if (!check?.flag) {
            return
        }

        if (micPermission !== "granted") {
            const hasPermission = await requestMicPermission()
            if (!hasPermission) return
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            mediaRecorderRef.current = new MediaRecorder(stream)
            audioChunksRef.current = []

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data)
            }

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: "audio/wav" })
                const audioUrl = URL.createObjectURL(blob)
                setRecordedAudio(audioUrl)
                setRecordedBlob(blob)
                stream.getTracks().forEach((track) => track.stop())
                if (recordingTimerRef.current) {
                    clearInterval(recordingTimerRef.current)
                    // setRecordingTime(0)
                }
            }

            mediaRecorderRef.current.start()
            setIsRecording(true)
            setRecordingTime(0)

            recordingTimerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1)
            }, 1000)

            // Start Speech Recognition - RESET TRANSCRIPTS FIRST
            setLiveTranscript("")
            setFinalTranscript("")

            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition()
                recognitionRef.current.continuous = true
                recognitionRef.current.interimResults = true
                recognitionRef.current.lang = "en-US" // change language if needed

                recognitionRef.current.onresult = (event) => {
                    let interimTranscript = ""
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        if (event.results[i].isFinal) {
                            setFinalTranscript(prev => prev + " " + event.results[i][0].transcript)
                        } else {
                            interimTranscript += event.results[i][0].transcript
                        }
                    }
                    setLiveTranscript(interimTranscript)
                }

                recognitionRef.current.onerror = (event) => {
                    console.error("Speech recognition error:", event.error)
                }

                recognitionRef.current.start()
            }
        } catch (error) {
            console.error("Error starting recording:", error)
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current)
            }
        }

        // Stop Speech Recognition
        if (recognitionRef.current) {
            recognitionRef.current.stop()
            recognitionRef.current = null
        }
    }

    const submitAnswer = () => {
        if (recordedBlob) {
            const timestamp = Date.now()
            const filename = `speaking_answer_${currentQuestion.id}_${timestamp}.wav`

            handleAnswerSelect(currentQuestion.id, {
                audioBlob: recordedBlob,
                audioUrl: recordedAudio,
                filename: filename,
                duration: recordingTime,
                type: "speaking_answer",
                isQuestionAudioPlayed: questionAudioPlayed,
                // Optionally include the transcript in the answer data
                transcript: `${finalTranscript} ${liveTranscript}`.trim()
            })

            setLiveTranscript("")
            setFinalTranscript("")
        }
    }

    const cancelAnswer = () => {
        setRecordedAudio(null)
        setRecordedBlob(null)
        setRecordingTime(0)
        handleAnswerSelect(currentQuestion.id, { isQuestionAudioPlayed: questionAudioPlayed })

        // RESET TRANSCRIPTS WHEN CANCELLING
        setLiveTranscript("")
        setFinalTranscript("")
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    if (!currentQuestion || currentQuestion.type !== "speaking") {
        return <div>Invalid question type</div>
    }

    const getMediaUrl = (url) => {
        if (!url) return null
        const baseUrl = import.meta.env.VITE_BACKEND_MEDIA_URL || ""
        return url.startsWith("http") ? url : `${baseUrl}${url}`
    }

    const canRecord = !(currentQuestion.speakingAudioUrl || currentQuestion.audio_url) || questionAudioPlayed

    // Check if image exists
    const hasImage = currentQuestion.imageUrl || currentQuestion.question_img
    const hasAudio = currentQuestion.audio_url || currentQuestion.speakingAudioUrl
    const hasText = currentQuestion.text

    // Calculate grid columns based on content
    const leftColumnClasses = hasImage ? "lg:col-span-2" : "lg:col-span-3"
    const rightColumnClasses = hasImage ? "" : "lg:col-span-3"

    return (
        <div className="flex flex-col overflow-hidden mb-10">
            <div className="flex-grow w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 overflow-hidden">
                <div className={`grid grid-cols-1 ${!isPauseQuestion && hasImage ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-3 sm:gap-4 h-full overflow-hidden`}>
                    {/* Question Content - Dynamic sizing based on image presence */}
                    <div className={`${leftColumnClasses} space-y-3 sm:space-y-4 overflow-y-auto pr-1 sm:pr-2`}>
                        {/* Question Text - Always show if exists */}
                        {hasText && (
                            <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <Volume2 size={18} className="text-indigo-600 sm:w-5 sm:h-5" />
                                    Question
                                </h3>
                                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{currentQuestion.text}</p>
                            </div>
                        )}

                        {/* Question Image - Only show if exists */}
                        {hasImage && (
                            <div className="flex justify-start">
                                <img
                                    src={getMediaUrl(currentQuestion.imageUrl || currentQuestion.question_img) || `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`}
                                    alt="Question Reference"
                                    className="max-w-full h-auto max-h-60 sm:max-h-72 md:max-h-80 rounded-lg object-contain"
                                />
                            </div>
                        )}

                        {/* Hidden Audio Element for Logic - Essential for Bottom Player */}
                        {hasAudio && (
                            <audio
                                ref={questionAudioRef}
                                src={getMediaUrl(currentQuestion.audio_url || currentQuestion.speakingAudioUrl)}
                                onPlay={() => {
                                    setIsPlaying(true)
                                    setPlayingAudio("question")
                                }}
                                onPause={() => {
                                    setIsPlaying(false)
                                    if (playingAudio === "question") setPlayingAudio(null)
                                }}
                                onEnded={() => {
                                    setIsPlaying(false)
                                    setPlayingAudio(null)
                                    setQuestionAudioPlayed(true)
                                }}
                                onTimeUpdate={() => {
                                    if (questionAudioRef.current) {
                                        setAudioCurrentTime(questionAudioRef.current.currentTime)
                                        if (questionAudioRef.current.duration) setAudioDuration(questionAudioRef.current.duration)
                                    }
                                }}
                                className="hidden"
                            />
                        )}
                    </div>

                    {/* Control Panel - Dynamic sizing based on image presence */}
                    {hasImage ? (
                        <div className="space-y-3 sm:space-y-4">
                            {/* Recording Section */}
                            <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <Mic size={18} className="text-red-600 sm:w-5 sm:h-5" />
                                    Your Response
                                </h3>

                                {/* Recording Status */}
                                {(currentQuestion.audio_url || currentQuestion.speakingAudioUrl) && !questionAudioPlayed && (
                                    <div className="mb-2 p-2 bg-amber-100 border border-amber-300 rounded-md text-xs sm:text-sm">
                                        <div className="flex items-center gap-1 text-amber-800">
                                            <AlertCircle size={14} />
                                            Complete audio first
                                        </div>
                                    </div>
                                )}

                                {!recordedAudio ? (
                                    <div className="text-center">
                                        {!isRecording ? (
                                            <div className="space-y-2">
                                                <p className="text-gray-600 text-xs sm:text-sm mb-2">
                                                    {!check?.flag
                                                        ? "Complete checks"
                                                        : !canRecord
                                                            ? "Listen first"
                                                            : "Start response"}
                                                </p>
                                                <button
                                                    onClick={startRecording}
                                                    disabled={!check?.flag || !canRecord}
                                                    className={`w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-md font-medium text-xs sm:text-sm transition-colors shadow-sm ${!check?.flag || !canRecord
                                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                        : "bg-red-600 text-white hover:bg-red-700"
                                                        }`}
                                                >
                                                    <Mic size={16} />
                                                    Start Record
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-center gap-2 text-sm">
                                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                                    <span className="text-red-600 font-medium">
                                                        {formatTime(recordingTime)}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={stopRecording}
                                                    className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors shadow-sm font-medium text-xs sm:text-sm"
                                                >
                                                    <Square size={16} />
                                                    Stop Record
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="p-2 bg-green-100 border border-green-300 rounded-md text-xs sm:text-sm">
                                            <div className="flex items-center justify-center mb-1">
                                                <span className="text-green-800 font-medium">
                                                    Complete ({formatTime(recordingTime)})
                                                </span>
                                            </div>
                                            <audio
                                                ref={answerAudioRef}
                                                src={recordedAudio}
                                                controls
                                                className="w-full h-8 sm:h-16"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={submitAnswer}
                                                className="flex items-center justify-center gap-1 px-2 py-2.5 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all shadow-md font-medium text-xs sm:text-sm"
                                            >
                                                <CheckCircle size={14} />
                                                Confirm Audio
                                            </button>
                                            <button
                                                onClick={cancelAnswer}
                                                className="flex items-center justify-center gap-1 px-2 py-2.5 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all shadow-md font-medium text-xs sm:text-sm"
                                            >
                                                <XCircle size={14} />
                                                Re-Record
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* System Check */}
                            {(!speakerChecked || !micChecked) && (
                                <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 relative">
                                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <CheckCircle size={18} className="text-green-600 sm:w-5 sm:h-5" />
                                        System Check
                                    </h3>

                                    <div className="space-y-2">
                                        <div
                                            onClick={handleSpeakerCheckClick}
                                            className={`flex items-center justify-between p-2 sm:p-3 rounded-md border cursor-pointer transition-all shadow-sm text-xs sm:text-sm ${speakerChecked
                                                ? 'bg-green-100 border-green-300'
                                                : 'bg-white border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Volume2 size={16} className={speakerChecked ? 'text-green-600' : 'text-gray-700'} />
                                                <span className="font-medium text-gray-900">Speaker</span>
                                            </div>
                                            {speakerChecked ? (
                                                <CheckCircle size={16} className="text-green-600" />
                                            ) : (
                                                <span className="text-gray-600">Test</span>
                                            )}
                                        </div>

                                        <div
                                            onClick={handleMicCheckClick}
                                            className={`flex items-center justify-between p-2 sm:p-3 rounded-md border cursor-pointer transition-all shadow-sm text-xs sm:text-sm ${micChecked
                                                ? 'bg-green-100 border-green-300'
                                                : speakerChecked
                                                    ? 'bg-white border-gray-300 hover:bg-gray-50'
                                                    : 'bg-white border-gray-300 opacity-70 cursor-not-allowed'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Mic size={16} className={micChecked ? 'text-green-600' : 'text-gray-700'} />
                                                <span className="font-medium text-gray-900">Microphone</span>
                                            </div>
                                            {micChecked ? (
                                                <CheckCircle size={16} className="text-green-600" />
                                            ) : speakerChecked ? (
                                                <span className="text-gray-600">Test</span>
                                            ) : (
                                                <span className="text-gray-500">Speaker first</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}


                            <AnimatePresence>
                                {(finalTranscript || liveTranscript) && (
                                    <motion.div
                                        initial={{ y: "100%", opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: "100%", opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                        className="top-0 left-0 w-full p-3 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 sm:max-h-60 overflow-y-auto text-xs sm:text-sm text-gray-800 z-10"
                                        ref={transcriptRef}
                                    >
                                        <p className="font-medium text-gray-900 mb-1">Live Transcript:</p>
                                        <div id="transcript-content">{`${finalTranscript} ${liveTranscript}`.trim()}</div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        /* Full width layout when no image */
                        <div className={`${rightColumnClasses} grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4`}>
                            {/* Recording Section */}
                            <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <Mic size={18} className="text-red-600 sm:w-5 sm:h-5" />
                                    Your Response
                                </h3>

                                {/* Recording Status */}
                                {(currentQuestion.audio_url || currentQuestion.speakingAudioUrl) && !questionAudioPlayed && (
                                    <div className="mb-2 p-2 bg-amber-100 border border-amber-300 rounded-md text-xs sm:text-sm">
                                        <div className="flex items-center gap-1 text-amber-800">
                                            <AlertCircle size={14} />
                                            Complete audio first
                                        </div>
                                    </div>
                                )}

                                {!recordedAudio ? (
                                    <div className="text-center">
                                        {!isRecording ? (
                                            <div className="space-y-2">
                                                <p className="text-gray-600 text-xs sm:text-sm mb-2">
                                                    {!check?.flag
                                                        ? "Complete checks"
                                                        : !canRecord
                                                            ? "Listen first"
                                                            : "Start response"}
                                                </p>
                                                <button
                                                    onClick={startRecording}
                                                    disabled={!check?.flag || !canRecord}
                                                    className={`w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-md font-medium text-xs sm:text-sm transition-colors shadow-sm ${!check?.flag || !canRecord
                                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                        : "bg-red-600 text-white hover:bg-red-700"
                                                        }`}
                                                >
                                                    <Mic size={16} />
                                                    Start Record
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-center gap-2 text-sm">
                                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                                    <span className="text-red-600 font-medium">
                                                        {formatTime(recordingTime)}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={stopRecording}
                                                    className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors shadow-sm font-medium text-xs sm:text-sm"
                                                >
                                                    <Square size={16} />
                                                    Stop Record
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="p-2 bg-green-100 border border-green-300 rounded-md text-xs sm:text-sm">
                                            <div className="flex items-center justify-center mb-1">
                                                <span className="text-green-800 font-medium">
                                                    Complete ({formatTime(recordingTime)})
                                                </span>
                                            </div>
                                            <audio
                                                ref={answerAudioRef}
                                                src={recordedAudio}
                                                controls
                                                className="w-full h-8 sm:h-16"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={submitAnswer}
                                                className="flex items-center justify-center gap-1 px-2 py-2.5 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all shadow-md font-medium text-xs sm:text-sm"
                                            >
                                                <CheckCircle size={14} />
                                                Confirm Audio
                                            </button>
                                            <button
                                                onClick={cancelAnswer}
                                                className="flex items-center justify-center gap-1 px-2 py-2.5 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all shadow-md font-medium text-xs sm:text-sm"
                                            >
                                                <XCircle size={14} />
                                                Re-Record
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* System Check */}
                            {(!speakerChecked || !micChecked) && (
                                <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 relative">
                                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <CheckCircle size={18} className="text-green-600 sm:w-5 sm:h-5" />
                                        System Check
                                    </h3>

                                    <div className="space-y-2">
                                        <div
                                            onClick={handleSpeakerCheckClick}
                                            className={`flex items-center justify-between p-2 sm:p-3 rounded-md border cursor-pointer transition-all shadow-sm text-xs sm:text-sm ${speakerChecked
                                                ? 'bg-green-100 border-green-300'
                                                : 'bg-white border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Volume2 size={16} className={speakerChecked ? 'text-green-600' : 'text-gray-700'} />
                                                <span className="font-medium text-gray-900">Speaker</span>
                                            </div>
                                            {speakerChecked ? (
                                                <CheckCircle size={16} className="text-green-600" />
                                            ) : (
                                                <span className="text-gray-600">Test</span>
                                            )}
                                        </div>

                                        <div
                                            onClick={handleMicCheckClick}
                                            className={`flex items-center justify-between p-2 sm:p-3 rounded-md border cursor-pointer transition-all shadow-sm text-xs sm:text-sm ${micChecked
                                                ? 'bg-green-100 border-green-300'
                                                : speakerChecked
                                                    ? 'bg-white border-gray-300 hover:bg-gray-50'
                                                    : 'bg-white border-gray-300 opacity-70 cursor-not-allowed'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Mic size={16} className={micChecked ? 'text-green-600' : 'text-gray-700'} />
                                                <span className="font-medium text-gray-900">Microphone</span>
                                            </div>
                                            {micChecked ? (
                                                <CheckCircle size={16} className="text-green-600" />
                                            ) : speakerChecked ? (
                                                <span className="text-gray-600">Test</span>
                                            ) : (
                                                <span className="text-gray-500">Speaker first</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <AnimatePresence>
                                {(finalTranscript || liveTranscript) && (
                                    <motion.div
                                        initial={{ y: "100%", opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: "100%", opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                        className="top-0 left-0 w-full p-3 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 sm:max-h-60 overflow-y-auto text-xs sm:text-sm text-gray-800 z-10"
                                        ref={transcriptRef}
                                    >
                                        <p className="font-medium text-gray-900 mb-1">Live Transcript:</p>
                                        <div id="transcript-content">{`${finalTranscript} ${liveTranscript}`.trim()}</div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Speaker Check Modal */}
            <AnimatePresence>
                {showSpeakerModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 sm:p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6 mx-3 sm:mx-4"
                        >
                            <div className="flex justify-between items-center mb-3 sm:mb-4">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Speaker Test</h3>
                                <button
                                    onClick={() => setShowSpeakerModal(false)}
                                    className="text-gray-500 hover:text-gray-700 p-1"
                                >
                                    <X size={18} className="sm:w-5 sm:h-5" />
                                </button>
                            </div>

                            <div className="text-center space-y-3 sm:space-y-4">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center shadow-sm">
                                    <Volume2 size={24} className="text-blue-600 sm:w-8 sm:h-8" />
                                </div>
                                <div className="space-y-2 sm:space-y-3">
                                    <p className="text-gray-700 text-sm sm:text-base">
                                        Adjust volume and confirm clear audio.
                                    </p>

                                    <audio controls autoPlay className="w-full rounded-md shadow-sm h-8 sm:h-16">
                                        <source src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}/audio/demo.mp3`} type="audio/mpeg" />
                                    </audio>

                                    <p className="text-sm sm:text-base font-medium text-gray-900 p-2 sm:p-3 bg-gray-50 rounded-md border border-gray-200">
                                        "Hello! Speaker test. Clear?"
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setSpeakerChecked(true)
                                            setShowSpeakerModal(false)
                                        }}
                                        className="px-3 sm:px-4 py-2.5 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm font-medium text-xs sm:text-sm"
                                    >
                                        Yes
                                    </button>
                                    <button
                                        onClick={() => setShowSpeakerModal(false)}
                                        className="px-3 sm:px-4 py-2.5 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm font-medium text-xs sm:text-sm"
                                    >
                                        No
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Microphone Check Modal */}
            <AnimatePresence>
                {showMicModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 sm:p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6 mx-3 sm:mx-4"
                        >
                            <div className="flex justify-between items-center mb-3 sm:mb-4">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Mic Test</h3>
                                <button
                                    onClick={() => setShowMicModal(false)}
                                    className="text-gray-500 hover:text-gray-700 p-1"
                                >
                                    <X size={18} className="sm:w-5 sm:h-5" />
                                </button>
                            </div>

                            <div className="text-center space-y-3 sm:space-y-4">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-indigo-100 rounded-full flex items-center justify-center shadow-sm">
                                    <Mic size={24} className={`${micTestRecording ? "text-red-500 animate-pulse" : "text-indigo-600"} sm:w-8 sm:h-8`} />
                                </div>

                                {!micTestAudio ? (
                                    <div className="space-y-2 sm:space-y-3">
                                        <p className="text-gray-700 text-sm sm:text-base">Test your microphone</p>

                                        {!micTestRecording ? (
                                            <button
                                                onClick={startMicTestInModal}
                                                className="w-full px-3 sm:px-4 py-2.5 sm:py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm font-medium text-xs sm:text-sm"
                                            >
                                                Start Test
                                            </button>
                                        ) : (
                                            <div className="space-y-1 sm:space-y-2">
                                                <div className="w-4 h-4 bg-red-500 rounded-full mx-auto animate-pulse"></div>
                                                <p className="text-red-600 font-medium text-xs sm:text-sm">Recording...</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2 sm:space-y-3">
                                        <p className="text-green-600 font-medium text-sm sm:text-base">Complete!</p>

                                        <audio
                                            ref={micTestAudioRef}
                                            src={micTestAudio}
                                            controls
                                            className="w-full h-8 sm:h-16"
                                        />

                                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                            <button
                                                onClick={() => {
                                                    setMicChecked(true)
                                                    setShowMicModal(false)
                                                }}
                                                className="px-3 sm:px-4 py-2.5 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm font-medium text-xs sm:text-sm"
                                            >
                                                Sounds Good
                                            </button>
                                            <button
                                                onClick={() => setMicTestAudio(null)}
                                                className="px-3 sm:px-4 py-2.5 sm:py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 shadow-sm font-medium text-xs sm:text-sm"
                                            >
                                                Try Again
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fixed Audio Player at Bottom */}
            {hasAudio && !showSpeakerModal && !showMicModal && (
                <div className="fixed bottom-[72px] md:bottom-2 left-0 right-0 md:left-1/2 md:-translate-x-1/2 w-full md:w-[480px] lg:w-[700px] z-50 px-2 sm:px-3 md:px-0">
                    <div
                        ref={containerRef}
                        className="bg-white rounded-xl md:rounded-2xl flex items-center px-3 sm:px-4 md:px-5 py-2 gap-2 sm:gap-3 md:gap-4 relative transition-colors hover:border-gray-300 w-full shadow-lg md:shadow-none border border-gray-200 md:border-none"
                        role="group"
                        aria-label="Audio player"
                    >
                        {/* Play / Pause Button */}
                        <button
                            onClick={toggleQuestionAudio}
                            className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center text-white transition-colors bg-blue-600 hover:bg-blue-700 rounded-full flex-shrink-0"
                            aria-label={isPlaying && playingAudio === "question" ? "Pause" : "Play"}
                        >
                            {isPlaying && playingAudio === "question" ? (
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>

                        <span className="text-[10px] sm:text-[11px] tracking-wide text-gray-600 font-medium whitespace-nowrap min-w-[55px] sm:min-w-[65px]">
                            {formatDuration(audioCurrentTime)} / {formatDuration(audioDuration)}
                        </span>

                        {/* Progress + Time */}
                        <div className="flex flex-col flex-1 gap-1 select-none w-full">
                            <input
                                type="range"
                                min="0"
                                max={audioDuration || 0}
                                step={0.01}
                                value={audioCurrentTime}
                                disabled
                                aria-label="Seek"
                                className="w-full h-1.5 bg-gray-200 rounded-full cursor-not-allowed appearance-none progress-range focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                                style={{
                                    background: audioDuration
                                        ? `linear-gradient(to right, #2563EB 0%, #2563EB ${(audioCurrentTime / audioDuration) * 100}%, #d1d5db ${(audioCurrentTime / audioDuration) * 100}%, #d1d5db 100%)`
                                        : undefined,
                                }}
                            />
                        </div>

                        {/* Volume Button and Inline Volume Bar */}
                        <div className="flex items-center min-w-[50px] sm:min-w-[60px] md:min-w-[70px]">
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
                            <div className={`transition-all duration-200 overflow-hidden ${showVolumeBar ? 'w-20 sm:w-24 md:w-28 opacity-100 ml-1' : 'w-0 opacity-0'}`}>
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
            )}

            <style jsx>{`
        .progress-range::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: #d1d5db;
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          cursor: not-allowed;
        }
        .progress-range::-webkit-slider-thumb:hover { background:#d1d5db; }
        .progress-range::-moz-range-thumb {
          width:12px; 
          height:12px; 
          background:#d1d5db; 
          border-radius:50%; 
          border:2px solid #fff; 
          box-shadow:0 2px 4px rgba(0,0,0,0.15); 
          cursor:not-allowed;
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
          .progress-range::-webkit-slider-thumb {
            width: 14px;
            height: 14px;
          }
          .volume-slider::-webkit-slider-thumb {
            width: 11px;
            height: 11px;
          }
        }

        @media (min-width: 768px) {
          .progress-range::-webkit-slider-thumb {
            width: 16px;
            height: 16px;
          }
          .volume-slider::-webkit-slider-thumb {
            width: 12px;
            height: 12px;
          }
        }
      `}</style>
        </div>
    )
}

export default SpeakingQuestion