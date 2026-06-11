import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bot,
    User,
    Volume2,
    Pause,
    Mic,
    MicOff,
    Award,
    ArrowRight,
    Loader2,
    X,
    Video
} from "lucide-react";
import AnimatedText from "./AnimatedText";

const scrollClass = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

const Timer = () => {
    const [seconds, setSeconds] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(interval);
    }, []);
    const formatTime = (totalSeconds) => {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };
    return <span>{formatTime(seconds)}</span>;
};

const renderInterviewScreen = ({
    interviewQuestions,
    currentQuestionIndex,
    messageInput,
    setMessageInput,
    displayTranscript,
    isPlaying,
    handleSpeakQuestion,
    handleStopSpeaking,
    handleSpeechComplete,
    handleNextQuestion,
    handleEvaluateAnswers,
    handleStartListening,
    isListening,
    isEvaluating,
    isVoiceModalOpen,
    handleStopListening,
    navigate,
    onShowRecordingInstructions,
    showCameraView,
    toggleCamera
}) => {
    const currentQuestion = interviewQuestions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === interviewQuestions.length - 1;

    if (!currentQuestion) {
        return (
            <div className="fixed inset-0 z-40 bg-white flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#00BB6E] animate-spin mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Processing Session State...</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-40 overflow-hidden bg-white flex flex-col text-slate-800">
            {/* 1. Header equivalent to image */}
            <header className="shrink-0 border-b border-slate-100 bg-white">
                <div className="container mx-auto py-4 flex justify-between items-center px-4">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <Bot className="w-8 h-8 text-[#00BB6E]" />
                        {/* <span className="font-bold text-xl tracking-tight text-slate-900">Interview<span className="text-[#00BB6E]">AI</span></span> */}
                    </div>

                    {/* Progress Bar */}
                    <div className="hidden md:flex flex-col flex-1 max-w-lg mx-6">
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Question {currentQuestionIndex + 1} of {interviewQuestions.length}</span>
                            <span className="text-xs font-bold text-[#00BB6E]">{Math.round(((currentQuestionIndex + 1) / interviewQuestions.length) * 100)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-md overflow-hidden">
                            <div
                                className="h-full bg-[#00BB6E] transition-all duration-700 ease-out rounded-md"
                                style={{ width: `${((currentQuestionIndex + 1) / interviewQuestions.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Right Info */}
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                Session • <Timer />
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* 2. Main content wrapper */}
            <main className="flex-1 min-h-0 w-full bg-[#fcfcfc] flex flex-col py-2 md:py-4">

                {/* Card Container for Question & Answer */}
                <div className="container mx-auto px-4 flex flex-col gap-3 md:gap-4 w-full max-w-5xl flex-1 min-h-0">

                    {/* Question Card */}
                    <div className="shrink-0 bg-white border border-slate-200 rounded-lg shadow-sm p-4 md:p-6 relative flex flex-col items-start w-full max-h-[35vh] md:max-h-[45vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                        {/* Green left border effect */}
                        <div className="absolute left-0 top-4 md:top-6 bottom-4 md:bottom-6 w-1 hover:w-1.5 transition-all bg-[#00BB6E] rounded-r-md"></div>

                        <div className="w-full flex justify-between items-start gap-4 pl-3 md:pl-4 flex-col md:flex-row">
                            <div className="flex flex-col w-full">
                                <div className="text-xl md:text-2xl font-semibold text-slate-900 leading-snug">
                                    <AnimatedText
                                        text={currentQuestion.question}
                                        isPlaying={isPlaying}
                                        onComplete={handleSpeechComplete}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={isPlaying ? handleStopSpeaking : handleSpeakQuestion}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors shrink-0 shadow-sm md:w-auto w-full mt-4 md:mt-0"
                            >
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                {isPlaying ? "Stop" : "Listen"}
                            </button>
                        </div>
                    </div>
                    {/* Answer Section */}
                    <div className="flex flex-col w-full flex-1 min-h-[150px] max-h-[35vh] md:max-h-[350px] lg:max-h-[400px] relative">
                        <span className="shrink-0 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1 md:ml-2">Your Answer</span>
                        <div className="relative w-full flex-1 min-h-0 flex flex-col">
                            <textarea
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="Type your detailed response here or use voice transcription..."
                                className="w-full flex-1 p-4 md:p-6 border border-slate-200 rounded-lg shadow-sm focus:ring-1 focus:ring-[#00BB6E] focus:outline-none text-base md:text-lg resize-none placeholder:text-slate-300 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300"
                            />

                        </div>
                    </div>

                    {/* Speak Now Button Area */}
                    <div className="shrink-0 flex flex-col items-center justify-center pt-1 pb-3">
                        <button
                            onClick={isListening ? handleStopListening : handleStartListening}
                            className={`flex items-center gap-2 px-8 py-3.5 rounded-lg font-bold text-sm text-white shadow-sm transition-all ${isListening ? 'bg-rose-500' : 'bg-[#00BB6E]'}`}
                        >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            {isListening ? "Stop Recording" : "Speak Now"}
                        </button>
                        <span className="text-xs text-slate-400 mt-3 italic">
                            Click to start voice-to-text transcription
                        </span>
                    </div>

                </div>

            </main>

            {/* 3. Footer */}
            <footer className="shrink-0 bg-white border-t border-slate-200 py-4 px-4 md:px-12 flex justify-between items-center w-full z-10">
                <button
                    onClick={handleEvaluateAnswers}
                    disabled={isEvaluating}
                    className={`flex items-center gap-2 font-semibold text-sm transition-colors ${isEvaluating ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <div className={`p-1 rounded-md ${isEvaluating ? 'bg-slate-50 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                        <X className="w-3.5 h-3.5" />
                    </div>
                    {isEvaluating ? "Submitting..." : "Abort Session"}
                </button>

                <div className="flex items-center gap-2 md:gap-4">
                    <button
                        onClick={isLastQuestion ? handleEvaluateAnswers : handleNextQuestion}
                        className="px-3 md:px-6 py-2 md:py-2.5 bg-slate-50 border border-slate-200 text-slate-600 font-bold text-xs md:text-sm rounded-md hover:bg-slate-100 transition-colors shadow-sm"
                    >
                        Skip
                    </button>
                    <button
                        onClick={isLastQuestion ? handleEvaluateAnswers : handleNextQuestion}
                        disabled={(!messageInput.trim() && !displayTranscript.trim()) || isEvaluating}
                        className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-2.5 font-bold text-xs md:text-sm rounded-md shadow-sm transition-all ${isEvaluating || (!messageInput.trim() && !displayTranscript.trim())
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                            : "bg-[#00BB6E] text-white hover:bg-[#00A05E]"
                            }`}
                    >
                        {isEvaluating ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Verifying</>
                        ) : isLastQuestion ? (
                            <><Award className="w-4 h-4" /> Terminate & Analyze</>
                        ) : (
                            <>Next Question <ArrowRight className="w-4 h-4" /></>
                        )}
                    </button>
                </div>
            </footer>


        </div>
    );
};

export default renderInterviewScreen;