import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaGraduationCap, FaCheckCircle, FaTimesCircle, FaClock, FaRedo, FaTimes } from "react-icons/fa";
import ResultCircularProgress from "./ResultCircularProgress";

const QuizResultPopup = ({
    isOpen,
    onClose,
    score,
    isPassed,
    totalQuestions,
    correctAnswers,
    totalMarks,
    earnedMarks,
    attemptsAllowed,
    attemptsUsed,
    onRetry,
    canAttempt,
    attemptsExhausted,
    activeQuiz,
    onContinueLearning
}) => {
    if (!isOpen) return null;

    // Responsive sizing helpers
    const getIconSize = () => "text-base xs:text-lg sm:text-xl md:text-2xl lg:text-lg";
    const getStatTextSize = () => "text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-[9px]";
    const getStatValueSize = () => "text-xs xs:text-sm sm:text-base md:text-lg lg:text-base";
    const getTitleSize = () => "text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-2xl";
    const getSubtitleSize = () => "text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-sm";
    const getButtonTextSize = () => "text-xs xs:text-sm sm:text-base md:text-lg lg:text-sm";
    const getContainerPadding = () => "p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8";
    const getGridGap = () => "gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 lg:gap-3";

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 xs:p-3 sm:p-4 md:p-5 lg:p-4 bg-black/50 backdrop-blur-sm">
                {/* Responsive Layout */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className={`bg-white w-full max-w-[280px] xs:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl rounded-xl xs:rounded-2xl sm:rounded-2xl md:rounded-3xl lg:rounded-3xl shadow-lg xs:shadow-xl sm:shadow-xl md:shadow-2xl lg:shadow-2xl overflow-hidden relative flex flex-col items-center ${getContainerPadding()} mx-auto`}
                >
                    {/* Close Button - Responsive */}
                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 xs:top-2.5 xs:right-2.5 sm:top-3 sm:right-3 md:top-4 md:right-4 lg:top-4 lg:right-4 p-1 xs:p-1.5 sm:p-1.5 md:p-2 lg:p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100 z-10"
                    >
                        <FaTimes size={14} className="xs:w-4 xs:h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-5 lg:h-5" />
                    </button>

                    {/* Title - Responsive */}
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-center mb-1 xs:mb-1.5 sm:mb-2 md:mb-2.5 lg:mb-2 mt-1 xs:mt-1.5 sm:mt-2 md:mt-2.5 lg:mt-0"
                    >
                        <h2 className={`${getTitleSize()} font-bold ${isPassed ? "text-emerald-500" : "text-rose-500"} leading-tight`}>
                            {isPassed ? "Assessment Passed!" : "Assessment Failed"}
                        </h2>
                        <p className={`text-slate-500 ${getSubtitleSize()} font-medium truncate max-w-[180px] xs:max-w-[220px] sm:max-w-[280px] md:max-w-sm lg:max-w-none mx-auto mt-0.5 xs:mt-1`}>
                            {activeQuiz?.title || "Quiz Completed"}
                        </p>
                    </motion.div>

                    {/* Progress Circle - Responsive scaling */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="mb-2 xs:mb-3 sm:mb-4 md:mb-5 lg:mb-4 scale-[0.6] xs:scale-[0.65] sm:scale-[0.7] md:scale-[0.8] lg:scale-90"
                    >
                        <ResultCircularProgress score={score} isPassed={isPassed} />
                    </motion.div>

                    {/* Performance Summary Cards - Mobile First Approach */}
                    <div className={`w-full grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:hidden ${getGridGap()} mb-2 xs:mb-3 sm:mb-4 md:mb-5`}>
                        {/* Total Questions */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white p-1.5 xs:p-2 sm:p-2.5 md:p-3 rounded-lg xs:rounded-xl sm:rounded-xl md:rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center"
                        >
                            <span className={`text-blue-500 ${getIconSize()} mb-0.5 xs:mb-1`}>
                                <FaGraduationCap />
                            </span>
                            <span className={`text-slate-400 ${getStatTextSize()} font-bold uppercase tracking-wider text-center`}>
                                Total
                            </span>
                            <span className={`${getStatValueSize()} font-bold text-slate-800 mt-0.5`}>
                                {totalMarks}
                            </span>
                        </motion.div>

                        {/* Correct Answers */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white p-1.5 xs:p-2 sm:p-2.5 md:p-3 rounded-lg xs:rounded-xl sm:rounded-xl md:rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center"
                        >
                            <span className={`text-emerald-500 ${getIconSize()} mb-0.5 xs:mb-1`}>
                                <FaCheckCircle />
                            </span>
                            <span className={`text-slate-400 ${getStatTextSize()} font-bold uppercase tracking-wider text-center`}>
                                Earned
                            </span>
                            <span className={`${getStatValueSize()} font-bold text-slate-800 mt-0.5`}>
                                {Number(earnedMarks?.toFixed(2))}
                            </span>
                        </motion.div>

                        {/* Attempts Allowed - Shows on all screens, but repositions on desktop */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white p-1.5 xs:p-2 sm:p-2.5 md:p-3 rounded-lg xs:rounded-xl sm:rounded-xl md:rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center"
                        >
                            <span className={`text-purple-500 ${getIconSize()} mb-0.5 xs:mb-1`}>
                                <FaTimesCircle />
                            </span>
                            <span className={`text-slate-400 ${getStatTextSize()} font-bold uppercase tracking-wider text-center`}>
                                Allowed
                            </span>
                            <span className={`${getStatValueSize()} font-bold text-slate-800 mt-0.5`}>
                                {attemptsAllowed}
                            </span>
                        </motion.div>

                        {/* Attempts Used */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="bg-white p-1.5 xs:p-2 sm:p-2.5 md:p-3 rounded-lg xs:rounded-xl sm:rounded-xl md:rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center"
                        >
                            <span className={`text-amber-500 ${getIconSize()} mb-0.5 xs:mb-1`}>
                                <FaClock />
                            </span>
                            <span className={`text-slate-400 ${getStatTextSize()} font-bold uppercase tracking-wider text-center`}>
                                Used
                            </span>
                            <span className={`${getStatValueSize()} font-bold text-slate-800 mt-0.5`}>
                                {attemptsUsed}
                            </span>
                        </motion.div>
                    </div>

                    {/* Performance Summary Cards - Desktop Only */}
                    <div className="hidden lg:grid w-full grid-cols-4 gap-3 mb-6">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center group hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-300"
                        >
                            <span className="text-blue-500 text-lg mb-1.5 group-hover:scale-110 transition-transform duration-300">
                                <FaGraduationCap />
                            </span>
                            <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest text-center">Total Marks</span>
                            <span className="text-base font-bold text-slate-800 mt-0.5">{totalMarks}</span>
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center group hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-300"
                        >
                            <span className="text-emerald-500 text-lg mb-1.5 group-hover:scale-110 transition-transform duration-300">
                                <FaCheckCircle />
                            </span>
                            <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest text-center">Earned Marks</span>
                            <span className="text-base font-bold text-slate-800 mt-0.5">{Number(earnedMarks?.toFixed(2))}</span>
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center group hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-300"
                        >
                            <span className="text-purple-500 text-lg mb-1.5 group-hover:scale-110 transition-transform duration-300">
                                <FaTimesCircle />
                            </span>
                            <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest text-center">Total Attempts</span>
                            <span className="text-base font-bold text-slate-800 mt-0.5">{attemptsAllowed}</span>
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center group hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-300"
                        >
                            <span className="text-amber-500 text-lg mb-1.5 group-hover:scale-110 transition-transform duration-300">
                                <FaClock />
                            </span>
                            <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest text-center">Used Attempts</span>
                            <span className="text-base font-bold text-slate-800 mt-0.5">{attemptsUsed}</span>
                        </motion.div>
                    </div>

                    {/* Action Buttons - Responsive */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="flex flex-col xs:flex-row sm:flex-row md:flex-row lg:flex-row gap-2 xs:gap-2 sm:gap-2.5 md:gap-3 lg:gap-2 w-full mt-1 xs:mt-1.5 sm:mt-2 md:mt-2.5 lg:mt-0"
                    >
                        <button
                            onClick={onClose}
                            className={`w-full px-3 xs:px-4 sm:px-5 md:px-6 lg:px-6 py-2 xs:py-2.5 sm:py-2.5 md:py-3 lg:py-2.5 bg-slate-100 text-slate-600 font-bold rounded-lg xs:rounded-xl sm:rounded-xl md:rounded-xl lg:rounded-xl hover:bg-slate-200 transition-colors ${getButtonTextSize()} active:scale-[0.98] transition-transform`}
                        >
                            Close
                        </button>

                        {(canAttempt && !attemptsExhausted) && (
                            <button
                                onClick={onRetry}
                                className={`w-full px-3 xs:px-4 sm:px-5 md:px-6 lg:px-6 py-2 xs:py-2.5 sm:py-2.5 md:py-3 lg:py-2.5 bg-blue-500 text-white font-bold rounded-lg xs:rounded-xl sm:rounded-xl md:rounded-xl lg:rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-2 ${getButtonTextSize()} active:scale-[0.98] transition-transform`}
                            >
                                <FaRedo className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-xs" />
                                Retry Quiz
                            </button>
                        )}

                        {/* {(isPassed && onContinueLearning) && (
                            <button
                                onClick={onContinueLearning}
                                className={`w-full px-3 xs:px-4 sm:px-5 md:px-6 lg:px-6 py-2 xs:py-2.5 sm:py-2.5 md:py-3 lg:py-2.5 bg-green-500 text-white font-bold rounded-lg xs:rounded-xl sm:rounded-xl md:rounded-xl lg:rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-2 ${getButtonTextSize()} active:scale-[0.98] transition-transform`}
                            >
                                Continue Learning
                            </button>
                        )} */}
                    </motion.div>

                </motion.div>
            </div>

            {/* Custom responsive styles */}
            <style jsx>{`
                /* Custom breakpoints for better control */
                @media (max-width: 480px) {
                    /* Extra small devices */
                    .max-w-\\[280px\\] {
                        max-width: 280px;
                    }
                }

                @media (min-width: 481px) and (max-width: 640px) {
                    /* Small devices */
                    .xs\\:max-w-sm {
                        max-width: 384px;
                    }
                }

                @media (min-width: 641px) and (max-width: 768px) {
                    /* Medium devices */
                    .sm\\:max-w-md {
                        max-width: 448px;
                    }
                }

                @media (min-width: 769px) and (max-width: 1024px) {
                    /* Large tablets */
                    .md\\:max-w-lg {
                        max-width: 512px;
                    }
                }

                /* Ensure smooth transitions */
                .transition-all {
                    transition-property: all;
                    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
                    transition-duration: 300ms;
                }

                /* Better touch targets for mobile */
                @media (max-width: 768px) {
                    button {
                        min-height: 44px;
                    }
                    
                    .p-1 {
                        padding: 0.5rem;
                    }
                }

                /* Prevent text overflow */
                .truncate {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            `}</style>
        </AnimatePresence>
    );
};

export default QuizResultPopup;