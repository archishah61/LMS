import React, { useEffect, useRef, useState, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useVoiceAssistantMutation } from "../../../services/AIServices";
import { useNavigate } from "react-router-dom";
import ExpressiveWhiteBlueRobot from "./RoboCharacter";
import { useSelector } from "react-redux";

const VoiceAssistant = () => {
    const [isActive, setIsActive] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [lastResponse, setLastResponse] = useState("");
    const [isVisible, setIsVisible] = useState(false); // Controls visibility for animation

    const courseID = useSelector((state) => state.course.activeCourseId);
    const activeSessionId = useSelector((state) => state.session.activeSessionId);
    const activeModuleId = useSelector((state) => state.module.activeModuleId);
    const activeTopicId = useSelector((state) => state.topic.activeTopicId);

    const voiceAssistantData = {
        courseID,
        activeSessionId,
        activeModuleId,
        activeTopicId,
    };

    const recognitionRef = useRef(null);
    const speechSynthesisRef = useRef(null);
    const isProcessingRef = useRef(false);
    const currentTranscriptRef = useRef("");
    const isActiveRef = useRef(false); // Track active state in ref for cleanup

    const navigate = useNavigate();
    const [voiceAssistant, { isLoading }] = useVoiceAssistantMutation();

    // Update active ref whenever isActive changes
    useEffect(() => {
        isActiveRef.current = isActive;

        // Handle visibility animation
        if (isActive) {
            setIsVisible(true);
        } else {
            // Delay hiding to allow slide-out animation
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 300); // Match this with CSS transition duration

            return () => clearTimeout(timer);
        }
    }, [isActive]);

    // Initialize speech recognition
    useEffect(() => {
        if (!("webkitSpeechRecognition" in window)) {
            alert("Your browser does not support speech recognition.");
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = "en-IN";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = handleSpeechResult;
        recognition.onerror = handleSpeechError;
        recognition.onend = handleSpeechEnd;

        recognitionRef.current = recognition;

        return () => {
            if (recognition) {
                recognition.stop();
            }
            if (speechSynthesisRef.current) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // Keyboard shortcut handler
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Check for Ctrl+K (Cmd+K on Mac)
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                toggleAssistant();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isActive, isListening, isSpeaking]);

    const handleSpeechResult = useCallback((event) => {
        // Check if assistant is still active using ref
        if (!isActiveRef.current || isSpeaking || isProcessingRef.current) {
            return;
        }

        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        const fullTranscript = finalTranscript || interimTranscript;
        currentTranscriptRef.current = fullTranscript.trim();

        // Update displayed transcript
        setTranscript(currentTranscriptRef.current);

        // Process immediately when we have final transcript (removed 2-second delay)
        if (finalTranscript.trim()) {
            const textToProcess = finalTranscript.trim();
            if (textToProcess && textToProcess.length > 2) {
                processCommand(textToProcess);
            }
        }

    }, [isSpeaking]);

    const startListening = useCallback(() => {
        const recognition = recognitionRef.current;

        // Double check if assistant is still active
        if (!recognition || isProcessingRef.current || isSpeaking || !isActiveRef.current) {
            return;
        }

        try {
            // Stop any existing recognition first
            recognition.stop();

            // Small delay before starting new recognition
            setTimeout(() => {
                // Check again if still active before starting
                if (!isActiveRef.current) {
                    return;
                }

                try {
                    recognition.start();
                    setIsListening(true);
                } catch (error) {
                    console.error("Error starting recognition after delay:", error);
                    // If recognition is already started, just set the state
                    if (error.name === 'InvalidStateError' && isActiveRef.current) {
                        setIsListening(true);
                    }
                }
            }, 100);

        } catch (error) {
            console.error("Error in startListening:", error);
            // If recognition is already started and assistant is still active, just set the state
            if (error.name === 'InvalidStateError' && isActiveRef.current) {
                setIsListening(true);
            }
        }
    }, [isSpeaking]);

    const handleSpeechError = useCallback((event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
            alert("Microphone access denied. Please allow microphone access and refresh the page.");
        }

        // Only restart recognition if assistant is still active
        if (isActiveRef.current && !isSpeaking) {
            setTimeout(() => {
                if (isActiveRef.current) { // Check again after timeout
                    startListening();
                }
            }, 1000);
        }
    }, [isSpeaking, startListening]);

    const handleSpeechEnd = useCallback(() => {
        setIsListening(false);

        // Only restart recognition if assistant is still active and not speaking/processing
        if (isActiveRef.current && !isSpeaking && !isProcessingRef.current) {
            setTimeout(() => {
                if (isActiveRef.current) { // Check again after timeout
                    startListening();
                }
            }, 300);
        }
    }, [isSpeaking, startListening]);

    const stopListening = useCallback(() => {
        const recognition = recognitionRef.current;
        if (recognition) {
            try {
                recognition.stop();
            } catch (error) {
                console.error("Error stopping recognition:", error);
            }
            setIsListening(false);
        }
    }, []);

    const speak = useCallback((text) => {
        return new Promise((resolve) => {
            if (!text) {
                resolve();
                return;
            }

            // Stop any ongoing speech and listening
            window.speechSynthesis.cancel();
            stopListening();

            const utterance = new SpeechSynthesisUtterance(text);

            // Enhanced voice settings for more realistic speech
            utterance.rate = 1.05; // Normal speed
            utterance.pitch = 1.2; // Slightly higher pitch for friendliness
            utterance.volume = 0.9; // Clear volume

            // Wait for voices to load and select the best one
            const setVoiceAndSpeak = () => {
                const voices = window.speechSynthesis.getVoices();

                // Priority order for voice selection (more natural voices)
                const preferredVoices = [
                    'Google UK English Female',     // Calm & clear
                    'Google US English',            // Neutral and reliable
                    'Microsoft Zira - English (United States)', // Professional, soft touch
                    'Samantha',                     // Light, confident voice
                    'Karen',                        // A bit warmer
                    'Veena',                        // Soft Indian English voice
                ];

                let selectedVoice = null;

                // First, try to find exact matches from preferred list
                for (const preferredName of preferredVoices) {
                    selectedVoice = voices.find(voice =>
                        voice.name === preferredName
                    );
                    if (selectedVoice) break;
                }

                // If no exact match, look for voices containing preferred keywords
                if (!selectedVoice) {
                    const keywords = ['female', 'woman', 'english', 'uk', 'us', 'natural', 'premium'];
                    for (const keyword of keywords) {
                        selectedVoice = voices.find(voice =>
                            voice.name.toLowerCase().includes(keyword) &&
                            voice.lang.startsWith('en')
                        );
                        if (selectedVoice) break;
                    }
                }

                // Fallback to any English voice
                if (!selectedVoice) {
                    selectedVoice = voices.find(voice =>
                        voice.lang.startsWith('en-')
                    );
                }

                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }

                utterance.onstart = () => {
                    setIsSpeaking(true);
                };

                utterance.onend = () => {
                    setIsSpeaking(false);
                    speechSynthesisRef.current = null;
                    resolve();

                    // Resume listening after speaking if assistant is still active
                    if (isActiveRef.current) {
                        setTimeout(() => {
                            if (isActiveRef.current) { // Double check
                                startListening();
                            }
                        }, 500);
                    }
                };

                utterance.onerror = (error) => {
                    console.error("Speech synthesis error:", error);
                    setIsSpeaking(false);
                    resolve();

                    // Resume listening even on error if assistant is still active
                    if (isActiveRef.current) {
                        setTimeout(() => {
                            if (isActiveRef.current) { // Double check
                                startListening();
                            }
                        }, 500);
                    }
                };

                speechSynthesisRef.current = utterance;
                window.speechSynthesis.speak(utterance);
            };

            // Ensure voices are loaded
            if (window.speechSynthesis.getVoices().length === 0) {
                window.speechSynthesis.onvoiceschanged = () => {
                    setVoiceAndSpeak();
                    window.speechSynthesis.onvoiceschanged = null; // Remove listener
                };
            } else {
                setVoiceAndSpeak();
            }
        });
    }, [startListening, stopListening]);

    const processCommand = async (command) => {
        if (isProcessingRef.current) return;

        isProcessingRef.current = true;

        // Clear transcript and stop listening during processing
        setTranscript("");
        currentTranscriptRef.current = "";
        stopListening();

        // Check for exit commands
        if (command.toLowerCase().includes("bye") ||
            command.toLowerCase().includes("goodbye") ||
            command.toLowerCase().includes("stop") ||
            command.toLowerCase().includes("exit")) {

            await speak("Goodbye! Press Ctrl+K anytime you need me.");
            setIsActive(false);
            isProcessingRef.current = false;
            return;
        }

        try {
            const response = await voiceAssistant({
                message: command,
                data: voiceAssistantData,
            }).unwrap();


            setLastResponse(response.reply);

            // Navigate if it's a navigation command
            if (response.link) {
                navigate(response.link);
            }

            if (response.command) {
                handleVoiceCommand(response.command);
            }

            // Speak the response
            await speak(response.reply);

        } catch (error) {
            console.error("Error processing command:", error);
            const errorMessage = "Sorry, I encountered an error. Please try again.";
            await speak(errorMessage);
            setLastResponse(errorMessage);
        } finally {
            isProcessingRef.current = false;
        }
    };

    const toggleAssistant = () => {
        if (isActive) {
            // Deactivate assistant
            setIsActive(false);

            // Force stop all speech recognition immediately
            const recognition = recognitionRef.current;
            if (recognition) {
                try {
                    recognition.stop();
                    recognition.abort(); // Force abort if available
                } catch (error) {
                    console.error("Error stopping recognition:", error);
                }
            }

            // Stop listening state
            setIsListening(false);

            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            setIsSpeaking(false);

            // Clear transcript
            setTranscript("");
            currentTranscriptRef.current = "";

            // Speak deactivation message
            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance("Voice assistant deactivated. Press Ctrl+K to activate again.");
                utterance.rate = 1.05; // Normal speed
                utterance.pitch = 1.2; // Slightly higher pitch for friendliness
                utterance.volume = 0.9; // Clear volume
                window.speechSynthesis.speak(utterance);
            }, 200);

        } else {
            // Activate assistant
            setIsActive(true);

            // Give quick feedback first
            const utterance = new SpeechSynthesisUtterance("I'm listening!");
            utterance.rate = 1.05; // Normal speed
            utterance.pitch = 1.2; // Slightly higher pitch for friendliness
            utterance.volume = 0.9; // Clear volume

            utterance.onend = () => {
                // Start listening after feedback
                setTimeout(() => {
                    if (isActiveRef.current && recognitionRef.current) {
                        try {
                            recognitionRef.current.start();
                            setIsListening(true);
                        } catch (error) {
                            console.error("Error starting recognition:", error);
                        }
                    }
                }, 100);
            };

            window.speechSynthesis.speak(utterance);
        }
    };

    const toggleMute = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);

            // Resume listening if assistant is active
            if (isActiveRef.current) {
                setTimeout(() => {
                    if (isActiveRef.current) {
                        startListening();
                    }
                }, 500);
            }
        }
    };

    const handleVoiceCommand = (command) => {
        switch (command) {
            case "GO_TO_NEXT_TOPIC":
                window.dispatchEvent(new Event("GO_TO_NEXT_TOPIC"));
                break;

            case "GO_TO_PREVIOUS_TOPIC":
                window.dispatchEvent(new Event("GO_TO_PREVIOUS_TOPIC"));
                break;
        }
    };

    // Don't render anything if not visible
    if (!isVisible) {
        return null;
    }

    return (
        <div
            className={`fixed bottom-4 right-4 z-50 transition-transform duration-300 ease-in-out ${isActive ? 'translate-x-0' : 'translate-x-full'
                }`}
            style={{
                transform: isActive ? 'translateX(0)' : 'translateX(100%)'
            }}
        >
            <ExpressiveWhiteBlueRobot />

            {/* Optional: Add status indicators */}
            {isActive && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                    <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                        {isListening && !isSpeaking && !isLoading && (
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                Listening...
                            </span>
                        )}
                        {isSpeaking && (
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                Speaking...
                            </span>
                        )}
                        {isLoading && (
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                Processing...
                            </span>
                        )}
                        {transcript && (
                            <div className="mt-1 text-xs opacity-80 max-w-48 truncate">
                                "{transcript}"
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoiceAssistant;