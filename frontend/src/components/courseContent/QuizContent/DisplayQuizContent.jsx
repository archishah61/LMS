/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
//DisplayQuizContent.jsx

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  FaArrowLeft,
  FaLightbulb,
  FaPlayCircle,
  FaClock,
  FaTrophy,
  FaCheckCircle,
  FaTimesCircle,
  FaRedo,
  FaArrowRight,
  FaChartBar,
  FaExclamationTriangle,
  FaGraduationCap,
  FaMicrophone,
  FaVolumeUp,
  FaInfoCircle,
  FaHistory,
  FaShieldAlt,
  FaClipboardList,
} from "react-icons/fa";
import { motion } from "framer-motion";
import BestOptionQuestion from "./BestOptionQuestion";
import DragDropQuestion from "./DragDropQuestion";
import { getStudentToken } from "../../../services/CookieService";
import { useCreateQuizCompletionMutation, useEvaluateQuizMutation, useGetQuizCompletionByQuizIdQuery } from "../../../services/QuizResponse/quizCompletionApi";
import { useCreateQuizResponseMutation } from "../../../services/QuizResponse/quizResponseApi";
import { addCompletion } from "../../../features/QuizResponse/quizCompletionSlice";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import ArrangeOrderQuestion from "./ArrangeOrderQuestion";
import VideoToScriptQuestion from "./VideoToScriptQuestion";
import ImageToScriptQuestion from "./ImageToScriptQuestion";
import QuestionMedia from "../../ui/QuestionMedia.JSX";
import SpeakingQuestion from "./SpeakingQuestion";
import { useEvaluateAnswerMutation } from "../../../services/AIServices";
import VideoPauseComponent from "./VideoPauseComponent";
import AudioPauseComponent from "./AudioPauseComponent";
import LoaderSubmit from "./LoaderSubmit";
import AudioToScriptQuestion from "./AudioToScriptQuestion";
import QuestionInstructionModal from "./QuestionInstructionModal";
import { CloudCog, Info, ClipboardCheck, ShieldCheck, CheckCircle2, BookOpenText, ListTodo } from "lucide-react";
import ResultCircularProgress from "./ResultCircularProgress";
import QuizResultPopup from "./QuizResultPopup";

const getQuizStorageKey = (quizId, userId) => `quiz-state-${quizId}-${userId}`;

// Function to count total questions in a quiz
const countTotalQuestions = (quiz) => {
  if (!quiz) return 0;

  // Use pre-calculated total if available from backend
  const backendCount = quiz.total_questions || quiz.totalQuestions || quiz.total_question;
  if (backendCount !== undefined && backendCount !== null) return Number(backendCount);

  let count = (
    (quiz.QuizQuestions?.length || 0) +
    (quiz.QuizPreDefinedQuestions?.length || 0) +
    (quiz.RealWordQuestions?.[0]?.correct_answers?.length || 0) +
    (quiz.AudioToScriptQuestions?.length || 0) +
    (quiz.SpeakingQuestions?.length || 0) +
    (quiz.DragDropQuestions?.length || 0) +
    (quiz.SummarizePassageQuestions?.length || 0) +
    (quiz.BestOptionQuestions?.length || 0) +
    (quiz.CompleteSentenceQuestions?.length || 0) +
    (quiz.ImageToScriptQuestions?.length || 0) +
    (quiz.VideoToScriptQuestions?.length || 0) +
    (quiz.VideoPauseQuestions?.length || 0) +
    (quiz.AudioPauseQuestions?.length || 0) +
    (quiz.ArrangeOrderQuestions?.length || 0)
  );

  // Add questions from text-based context if applicable
  if (quiz.quizType === "text_based" && quiz.TextedBasedQuizTexts) {
    quiz.TextedBasedQuizTexts.forEach(text => {
      count += (text.FillInBlankQuestions?.length || 0);
      count += (text.MultipleChoiceQuestions?.length || 0);
      count += (text.TrueFalseQuestions?.length || 0);
    });
  }

  return count;
};

// Robust date parser (supports ms timestamps, numeric strings, ISO strings)
const parseDateValue = (value) => {
  if (!value && value !== 0) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) { // pure digits
      const num = parseInt(trimmed, 10);
      const d = new Date(num);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

function CollapsibleText({ text, maxLines = 2 }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-4">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div
          className={`relative ${!isExpanded ? "overflow-hidden" : ""}`}
          style={{ maxHeight: isExpanded ? "none" : `${maxLines * 1.5}rem` }}
        >
          <p className="text-gray-800">{text}</p>

          {!isExpanded && (
            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent"></div>
          )}
        </div>

        <button
          onClick={toggleExpand}
          className="mt-2 text-blue-500 hover:text-blue-700 font-medium flex items-center"
        >
          {isExpanded ? "Show less" : "..."}
        </button>
      </div>
    </div>
  );
}

function CompleteSentenceQuestion({ question, selectedAnswers, handleCompleteSentenceInput }) {
  const parts = question.question.split("_____");
  const numBlanks = parts.length - 1;

  // Handle both new array format and legacy single string format
  const correctWords = Array.isArray(question.correct_word)
    ? question.correct_word
    : Array(numBlanks).fill(question.correct_word || "");
  const hints = Array.isArray(question.hint)
    ? question.hint
    : Array(numBlanks).fill(question.hint || "");

  // Ensure we have enough correct words and hints for all blanks
  while (correctWords.length < numBlanks) {
    correctWords.push("");
  }
  while (hints.length < numBlanks) {
    hints.push("");
  }

  // Function to determine input box size based on screen size
  const getInputBoxSize = () => {
    return "w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10";
  };

  // Function to determine text size based on screen size
  const getTextSize = () => {
    return "text-base sm:text-lg md:text-xl";
  };

  // Function to handle input with auto-focus to next letter
  const handleInputChange = (e, questionId, blankIndex, letterIndex, totalLetters, isHintLetter) => {
    if (isHintLetter) return;

    const letter = e.target.value.toLowerCase();
    handleCompleteSentenceInput(questionId, blankIndex, letterIndex, letter);

    // Auto-focus to the next letter if not empty
    if (letter && letterIndex < totalLetters - 1) {
      const nextInputId = `${questionId}_${blankIndex}_${letterIndex + 1}`;
      const nextInput = document.getElementById(nextInputId);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  // Function to handle keyboard navigation
  const handleKeyDown = (e, questionId, blankIndex, letterIndex, value, totalLetters) => {
    // Backspace: go to previous letter
    if (e.key === "Backspace" && !value && letterIndex > 0) {
      let prevIndex = letterIndex - 1;
      const prevInputId = `${questionId}_${blankIndex}_${prevIndex}`;
      const prevInput = document.getElementById(prevInputId);
      if (prevInput) {
        prevInput.focus();
      }
    }

    // Left arrow: go to previous letter
    if (e.key === "ArrowLeft" && letterIndex > 0) {
      e.preventDefault();
      const prevInputId = `${questionId}_${blankIndex}_${letterIndex - 1}`;
      const prevInput = document.getElementById(prevInputId);
      if (prevInput) {
        prevInput.focus();
      }
    }

    // Right arrow: go to next letter
    if (e.key === "ArrowRight" && letterIndex < totalLetters - 1) {
      e.preventDefault();
      const nextInputId = `${questionId}_${blankIndex}_${letterIndex + 1}`;
      const nextInput = document.getElementById(nextInputId);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-indigo-800 text-center mb-1 sm:mb-2">
          Complete the Sentence
        </h3>
        <p className="text-center text-xs sm:text-sm md:text-base text-gray-600 px-2">
          Fill in the missing letters to complete the sentence correctly
        </p>
      </div>

      {/* Sentence container */}
      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 md:p-6 border border-indigo-100 max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 break-words">
          {parts.map((part, blankIndex) => (
            <React.Fragment key={`part_${blankIndex}`}>
              {/* Regular text part */}
              <span className={`${getTextSize()} text-gray-800 font-medium whitespace-normal break-words max-w-full`}>
                {part}
              </span>

              {/* Blank input fields */}
              {blankIndex < numBlanks && (
                <div className="inline-flex flex-wrap items-center gap-0.5 sm:gap-1 my-1 sm:my-0">
                  {Array.from({ length: correctWords[blankIndex]?.length || 0 }).map((_, letterIndex) => {
                    const inputId = `${question.id}_${blankIndex}_${letterIndex}`;
                    const hintLetters = hints[blankIndex]?.split("") || [];
                    const isHintLetter = letterIndex < hintLetters.length;
                    const value = isHintLetter
                      ? hintLetters[letterIndex]
                      : selectedAnswers[inputId] || "";

                    return (
                      <div
                        key={letterIndex}
                        className={`relative ${getInputBoxSize()} flex justify-center items-center transition-colors duration-200 rounded-md
                          ${isHintLetter
                            ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-300"
                            : "bg-white hover:bg-indigo-50 border-2 border-indigo-200"
                          }
                          shadow-sm
                        `}
                      >
                        <input
                          type="text"
                          id={inputId}
                          maxLength={1}
                          className={`w-full h-full text-center ${getTextSize()} font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent rounded-md bg-transparent
                            ${isHintLetter ? "text-indigo-700 cursor-default" : "text-gray-700"}
                          `}
                          value={value}
                          readOnly={isHintLetter}
                          onChange={(e) => handleInputChange(
                            e,
                            question.id,
                            blankIndex,
                            letterIndex,
                            correctWords[blankIndex].length,
                            isHintLetter
                          )}
                          onKeyDown={(e) => handleKeyDown(
                            e,
                            question.id,
                            blankIndex,
                            letterIndex,
                            value,
                            correctWords[blankIndex].length
                          )}
                          inputMode="text"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck="false"
                          aria-label={`Letter ${letterIndex + 1} of blank ${blankIndex + 1}`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>


      {/* Custom styles for better mobile experience */}
      <style jsx>{`
        @media (max-width: 640px) {
          /* Improve touch targets */
          input {
            font-size: 16px !important; /* Prevents zoom on iOS */
            min-height: 44px; /* Better touch target */
          }
          
          /* Better spacing for wrapped content */
          .flex-wrap {
            gap: 0.5rem;
          }
          
          /* Ensure text doesn't overflow */
          .break-words {
            word-break: break-word;
          }
        }

        @media (min-width: 641px) and (max-width: 1024px) {
          /* Medium screen optimizations */
          input {
            font-size: 18px;
          }
        }

        /* Remove number input spinners */
        input[type=text]::-webkit-inner-spin-button,
        input[type=text]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        /* Focus styles for better accessibility */
        input:focus-visible {
          outline: none;
          ring: 2px solid #818cf8;
        }

        /* Prevent text selection during rapid typing */
        input {
          user-select: text;
          -webkit-user-select: text;
        }
      `}</style>
    </div>
  );
}

const MCQComponent = ({
  question,
  selectedAnswers,
  handleAnswerSelect,
  isMultiSelect = false,
}) => {
  const isSelected = (optionId) => {
    if (isMultiSelect) {
      return Array.isArray(selectedAnswers[question.id])
        ? selectedAnswers[question.id].includes(optionId)
        : false;
    }
    return selectedAnswers[question.id] === optionId;
  };

  return (
    <div className="flex flex-col items-start space-y-3 sm:space-y-4 w-full">
      {question.QuizOptions?.map((option, index) => {
        const selected = isSelected(option.id);
        return (
          <div
            key={option.id}
            className={`flex flex-col items-start border rounded-xl cursor-pointer transition-all duration-300 w-full max-w-full sm:max-w-[650px] ${selected
              ? "border-blue-500 bg-blue-50"
              : "border-slate-200 hover:border-slate-300"
              }`}
            onClick={() => handleAnswerSelect(question.id, option.id, isMultiSelect)}
          >
            <div className="flex items-center justify-start text-left w-full p-3 sm:p-4 md:p-5">
              <div
                className={`flex-shrink-0 w-5 h-5 sm:w-4 sm:h-4 md:w-4 md:h-4 flex items-center justify-center rounded-full border-2 mr-3 sm:mr-4 transition-all duration-300 ${selected ? "border-blue-600" : "border-slate-300"
                  }`}
              >
                {selected && (
                  <div className="w-2.5 h-2.5 sm:w-2 sm:h-2 md:w-2 md:h-2 bg-blue-600 rounded-full animate-scaleIn"></div>
                )}
              </div>

              <span
                className={`break-words text-sm sm:text-base md:text-base ${selected ? "text-slate-900 font-medium" : "text-slate-700"
                  }`}
              >
                {option.option_text}
              </span>
            </div>

            {option.option_img &&
              option.option_img.trim() !== "" &&
              option.option_img !== "null" && (
                <div className="w-full px-3 pb-3 sm:px-4 sm:pb-4 md:px-4 md:pb-4 transition-all duration-500 transform hover:scale-105">
                  <div className="relative w-full overflow-hidden rounded-lg">
                    <img
                      src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${option.option_img || "/placeholder.png"
                        }`}
                      alt="Option illustration"
                      className="w-full h-auto object-contain max-h-24 xs:max-h-28 sm:max-h-32 md:max-h-32 rounded-lg shadow-md"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
          </div>
        );
      })}
    </div>
  );
};
export default function DisplayQuizContent({
  activeQuiz,
  setActiveTopic,
  onBack,
  setActiveQuiz,
  quizData,
  setShowCertificateModal,
  setShowModuleCompletionModal,
  setShowSessionCompletionModal,
  userId,
  refetchSessions,
  refetchModules,
  isQuizCompleted,
  completionData,
  topicContentDataByModule,
  setAttachmentsCompleted,
  refetchTopics,
  refetchQuizData,
  courseId,
  refetchQuizCompletion,
  setQuizStarted,
  refetchActiveQuiz,
  onQuizProgress,
  onContinueLearning,
  moduleTopics = [],
  moduleAssignments = [],
  assignmentCompletionData = []
}) {

  const totalQuestionCount = countTotalQuestions(activeQuiz);
  const prevQuizId = useRef(activeQuiz?.id);
  const [showInstructions, setShowInstructions] = useState(true);
  const [quizInProgress, setQuizInProgress] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [combinedQuestions, setCombinedQuestions] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalMarks, setTotalMarks] = useState(0);
  const [earnedMarks, setEarnedMarks] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  // Dynamic warning limit (Infinity means disabled)
  const warningLimit = activeQuiz?.isWarning ? Math.max(1, activeQuiz?.no_of_warning || 1) : Infinity;
  const [showModal, setShowModal] = useState(false);
  const [showBackModal, setShowBackModal] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const [hasPassedQuiz, setHasPassedQuiz] = useState(false);
  const [summaryTimeRemaining, setSummaryTimeRemaining] = useState(null);
  const [isSummaryTimerRunning, setIsSummaryTimerRunning] = useState(false);
  const [quizCompletions, setQuizCompletions] = useState([]);
  const { access_token } = getStudentToken();
  const dispatch = useDispatch();
  const [completionId, setCompletionId] = useState();
  const [triedAttempts, setTriedAttempts] = useState(0);
  const [nextAttemptTime, setNextAttemptTime] = useState(null); // Date object for next allowed attempt (gap rule)
  const [renewalTime, setRenewalTime] = useState(null); // Date object when attempts renew (renew rule)
  const [lastAttemptTime, setLastAttemptTime] = useState(null); // Date object of last attempt
  const [canAttempt, setCanAttempt] = useState(true);
  const [attemptsExhausted, setAttemptsExhausted] = useState(false);
  const [submissionReason, setSubmissionReason] = useState(null);
  const [speakingCheck, setSpeakingCheck] = useState({ speakerCheck: false, micCheck: false })
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAutoSubmit, setPendingAutoSubmit] = useState(false);
  const [pendingAutoSubmitReason, setPendingAutoSubmitReason] = useState(null);
  const [showSummaryInstructions, setShowSummaryInstructions] = useState(false);
  const [showDragDropInstructions, setShowDragDropInstructions] = useState(false);
  const [showArrangeOrderInstructions, setShowArrangeOrderInstructions] = useState(false);
  const [isStateRestored, setIsStateRestored] = useState(false);
  const [pendingCompletionPopup, setPendingCompletionPopup] = useState(null);

  const [evaluateQuiz] = useEvaluateQuizMutation();
  const [createQuizCompletion] = useCreateQuizCompletionMutation();
  const [createQuizResponse] = useCreateQuizResponseMutation();

  const [pauseQuestions, setPauseQuestions] = useState([]);
  const [currentPauseType, setCurrentPauseType] = useState(null); // "video" or "audio"

  // Track aggregated marks for pause-type questions
  const [pauseScores, setPauseScores] = useState({}); // { [pauseQuestionId]: { total: number, current: number, deductions: Array<{subId: string, marks: number}> } }

  const [showAudioSetup, setShowAudioSetup] = useState(false); // New state for audio setup modal
  const [audioSetupCompleted, setAudioSetupCompleted] = useState(false); // Add this new state
  const [showAllAttemptsModal, setShowAllAttemptsModal] = useState(false); // Modal for full attempts history

  const videoPauseRef = useRef(null);
  const [videoPauseStatus, setVideoPauseStatus] = useState({ showQuestion: false, isLastStamp: false, isNextDisabled: true, videoEnded: false });

  // Audio pause component state for mobile/tablet bottom bar
  const audioPauseRef = useRef(null);
  const [audioPauseStatus, setAudioPauseStatus] = useState({ showQuestion: false, isLastStamp: false, isNextDisabled: true, audioEnded: false });

  const continueLearningEligibility = useMemo(() => {
    const topics = Array.isArray(moduleTopics) ? moduleTopics : [];
    const assignments = Array.isArray(moduleAssignments) ? moduleAssignments : [];

    const pendingTopicCount = topics.filter(
      (topic) => !(topic?.isCompleted === 1 || topic?.isCompleted === true)
    ).length;

    const pendingAssignmentCount = assignments.filter((assignment) => {
      const completion = (Array.isArray(assignmentCompletionData) ? assignmentCompletionData : []).find(
        (item) => String(item?.assignmentId ?? item?.assignment_id) === String(assignment?.id)
      );

      const completionStatus = String(completion?.status || "").toLowerCase();
      const isCompletedByAssignmentFlag =
        assignment?.isCompleted === 1 || assignment?.isCompleted === true;
      const isCompletedByCompletionFlag =
        completion?.isCompleted === 1 || completion?.isCompleted === true;

      return !(isCompletedByAssignmentFlag || isCompletedByCompletionFlag || completionStatus === "completed");
    }).length;

    return {
      canContinue: true,
      pendingTopicCount,
      pendingAssignmentCount,
    };
  }, [moduleTopics, moduleAssignments, assignmentCompletionData]);

  const continueLearningMessage = useMemo(() => {
    const parts = [];
    if (continueLearningEligibility.pendingTopicCount > 0) {
      parts.push(`Pending topics: ${continueLearningEligibility.pendingTopicCount}.`);
    }
    if (continueLearningEligibility.pendingAssignmentCount > 0) {
      parts.push(`Pending assignments: ${continueLearningEligibility.pendingAssignmentCount}.`);
    }
    return parts.length > 0
      ? `Move to next item.`
      : "Move on to the next topic in your learning path.";
  }, [continueLearningEligibility]);

  const showContinueLearningInDetails = useMemo(() => {
    return Array.isArray(moduleTopics) && moduleTopics.length > 0;
  }, [moduleTopics]);

  const handleContinueLearning = () => {
    if (typeof onContinueLearning === "function") {
      onContinueLearning();
      return;
    }

    const topicContentList =
      topicContentDataByModule?.data?.[0]?.data ||
      topicContentDataByModule?.data ||
      topicContentDataByModule ||
      [];

    if (Array.isArray(topicContentList) && activeQuiz?.id) {
      const currentQuizIndex = topicContentList.findIndex(
        (item) => item?.quiz_id === activeQuiz.id || item?.quizId === activeQuiz.id
      );

      if (currentQuizIndex !== -1 && currentQuizIndex < topicContentList.length - 1) {
        const nextItem = topicContentList[currentQuizIndex + 1];
        if (nextItem?.topic_id && typeof setActiveTopic === "function") {
          setActiveTopic(nextItem.topic_id);
          toast.success("Moving to next topic");
          return;
        }
      }
    }

    toast.success("You've completed all topics in this module!");
  };

  const triggerCompletionPopup = useCallback((popupType) => {
    if (!popupType) return;

    if (popupType === "certificate") {
      setShowResults(false);
      setShowModuleCompletionModal(false);
      setShowSessionCompletionModal(false);
      setShowCertificateModal();
      return;
    }

    if (popupType === "session") {
      setShowResults(false);
      setShowSessionCompletionModal(true);
      setShowModuleCompletionModal(false);
      return;
    }

    if (popupType === "module") {
      setShowResults(false);
      setShowModuleCompletionModal(true);
    }
  }, [setShowCertificateModal, setShowModuleCompletionModal, setShowSessionCompletionModal]);

  useEffect(() => {
    if (!showResults || !pendingCompletionPopup) return;

    // Let the result screen render first, then show completion/certificate modal.
    const timer = setTimeout(() => {
      triggerCompletionPopup(pendingCompletionPopup);
      setPendingCompletionPopup(null);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showResults, pendingCompletionPopup, triggerCompletionPopup]);

  useEffect(() => {
    // When active quiz changes, reset attempt tracking (will be recalculated below)
    setAttemptsExhausted(false);
    setNextAttemptTime(null);
    setRenewalTime(null);
    setLastAttemptTime(null);
    setCanAttempt(true);
    setTriedAttempts(0);
    // Reset warning-related state so previous quiz warnings don't leak
    setAlertCount(0);
    setPendingAutoSubmit(false);
    setPendingAutoSubmitReason(null);
    setShowModal(false);
  }, [activeQuiz]);


  const [evaluateAnswer, { data, isLoading, error }] = useEvaluateAnswerMutation();

  const handleCheckAnswer = async (questionText, correctAnswer, userAnswer, type) => {
    try {
      // FIXED: Removed invalid/incomplete 'subm' line (caused ReferenceError crash during evaluation)

      const formData = new FormData();

      formData.append("question_text", questionText);
      formData.append("correct_answer_script", correctAnswer);
      if (type !== "speaking") {
        formData.append("user_answer_script", userAnswer);
      }
      formData.append("question_type", type);

      // append audio file
      if (userAnswer instanceof File) {
        // already a File
        formData.append("speakingAudio", userAnswer);
      } else if (userAnswer?.audioBlob instanceof Blob) {
        // convert Blob -> File
        const file = new File([userAnswer.audioBlob], userAnswer.filename || "speaking_answer.wav", {
          type: userAnswer.audioBlob.type || "audio/wav",
        });
        formData.append("speakingAudio", file);
      }

      const result = await evaluateAnswer({ data: formData, access_token }).unwrap();

      return result;
    } catch (err) {
      console.error("Error evaluating:", err);
      return null
    }
  };

  function formatUTCDate(dateString) {
    const d = new Date(dateString);

    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const year = d.getUTCFullYear();

    let hours = d.getUTCHours();
    const minutes = String(d.getUTCMinutes()).padStart(2, "0");
    const seconds = String(d.getUTCSeconds()).padStart(2, "0");

    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // convert 0 → 12, 13→1 etc.

    return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds}${ampm}`;
  }

  // function to check if user can attempt quiz
  const checkAttemptEligibility = (latestCompletion) => {
    if (!activeQuiz || !latestCompletion) {
      setCanAttempt(true);
      return true;
    }
    const nowUtc = new Date().toISOString();
    const attemptsGap = Number(activeQuiz.attempts_gap) || 0;
    const maxAttempts = Number(activeQuiz.max_attempts) || Infinity;
    const renewDays = Number(activeQuiz.attempts_renew_days) || 0;

    // Normalise last attempt time (could be ms timestamp or ISO string)
    const lastTimeRaw = latestCompletion.lastAttemptTime || latestCompletion.updatedAt || latestCompletion.createdAt;
    const lastTime = parseDateValue(lastTimeRaw);

    if (lastTime) setLastAttemptTime(lastTime);

    const usedAttempts = latestCompletion.triedAttempts || 0;

    const nextAttemptDate = activeQuiz.nextRetryDate

    if (activeQuiz.reason === "MaxAttempts") {
      if (nowUtc < nextAttemptDate) {
        setNextAttemptTime(formatUTCDate(nextAttemptDate));
      }
      setAttemptsExhausted(true);
      setCanAttempt(false);
      return false;
    } else if (activeQuiz.reason === "GapRestriction") {
      if (nowUtc < nextAttemptDate) {
        setNextAttemptTime(formatUTCDate(nextAttemptDate));
        setCanAttempt(false);
        return false;
      }
    } else {
      setAttemptsExhausted(false);
    }

    // // Renewal logic
    // if (maxAttempts !== Infinity && usedAttempts >= maxAttempts) {
    //   // compute renewal date if applicable
    //   if (nextRetryDate > 0 && lastTime) {
    //     const renew = new Date(lastTime.getTime());
    //     renew.setDate(renew.getDate() + renewDays);
    //     setRenewalTime(renew);
    //     if (now >= renew) {
    //       // Renewal window reached, reset state so user can attempt again
    //       setAttemptsExhausted(false);
    //       setCanAttempt(true);
    //       setNextAttemptTime(null);
    //       return true;
    //     }
    //   }
    //   setAttemptsExhausted(true);
    //   setCanAttempt(false);
    //   return false;
    // } else {
    //   setAttemptsExhausted(false);
    // }

    // // Gap logic (only matters if user already has at least one attempt)
    // if (attemptsGap > 0 && lastTime) {
    //   const next = new Date(lastTime.getTime());
    //   next.setHours(next.getHours() + attemptsGap);
    //   if (now < next) {
    //     setNextAttemptTime(next);
    //     setCanAttempt(false);
    //     return false;
    //   }
    // }

    setNextAttemptTime(null);
    setCanAttempt(true);
    return true;
  };

  // Fetch detailed quiz history directly for this specific quiz
  const { data: quizHistoryData, refetch: refetchQuizHistory } = useGetQuizCompletionByQuizIdQuery(
    { userId, quizId: activeQuiz?.id },
    { skip: !activeQuiz?.id || !userId }
  );

  // Derive completions for this quiz from completionData prop (all completions)
  const quizCompletionHistory = useMemo(() => {

    // Prefer specific history if available
    if (quizHistoryData) {
      // Ensure it's an array
      const history = Array.isArray(quizHistoryData) ? [...quizHistoryData] : [quizHistoryData];
      return history.sort((a, b) => {
        const atDate = parseDateValue(a.lastAttemptTime || a.updatedAt || a.createdAt);
        const btDate = parseDateValue(b.lastAttemptTime || b.updatedAt || b.createdAt);
        const at = atDate ? atDate.getTime() : 0;
        const bt = btDate ? btDate.getTime() : 0;
        return bt - at;
      });
    }

    if (!completionData || !activeQuiz) return [];
    return completionData.filter(c => c.quizId === activeQuiz.id)
      .sort((a, b) => {
        const atDate = parseDateValue(a.lastAttemptTime || a.updatedAt || a.createdAt);
        const btDate = parseDateValue(b.lastAttemptTime || b.updatedAt || b.createdAt);
        const at = atDate ? atDate.getTime() : 0;
        const bt = btDate ? btDate.getTime() : 0;
        return bt - at;
      });
  }, [completionData, activeQuiz, quizHistoryData]);

  const shouldShowContinueLearning =
    showContinueLearningInDetails &&
    quizCompletionHistory.length > 0 &&
    typeof onContinueLearning === "function";

  const totalQuestions = new Set(combinedQuestions.map(q => q.questionId)).size;

  // Recalculate attempt metadata when history changes
  useEffect(() => {
    if (quizCompletionHistory.length === 0) {
      setTriedAttempts(0);
      setLastAttemptTime(null);
      setNextAttemptTime(null);
      setRenewalTime(null);
      setCanAttempt(true);
      setAttemptsExhausted(false);
      return;
    }
    const latest = quizCompletionHistory[0];
    const used = latest.triedAttempts || quizCompletionHistory.length;
    setTriedAttempts(used);
    checkAttemptEligibility(latest);
  }, [quizCompletionHistory]);

  // Modify the useEffect that checks quiz completion
  useEffect(() => {
    if (isQuizCompleted && activeQuiz?.completionData) {
      // Always show latest results when a completion object is present
      setShowResults(true);
      setShowInstructions(true);
      setScore(activeQuiz.completionData.score);
      setCorrectAnswers(activeQuiz.completionData.count);
      setTotalMarks(activeQuiz.completionData.totalMarks || 0);
      setEarnedMarks(activeQuiz.completionData.obtainedMarks || 0);
      setHasPassedQuiz(activeQuiz.completionData.status === "Passed");
      setTimeExpired(false);
      if (activeQuiz.completionData.QuizResponses) {
        setCombinedQuestions(activeQuiz.completionData.QuizResponses);
      }
      if (activeQuiz.completionData.triedAttempts) {
        setTriedAttempts(activeQuiz.completionData.triedAttempts);
      }
      setQuizCompletions(activeQuiz.completionData);
      checkAttemptEligibility(activeQuiz.completionData);
    } else if (!quizInProgress && !showResults) {
      // Only revert to instructions if not currently displaying a fresh result
      setShowResults(false);
      setShowInstructions(true);
    }
  }, [isQuizCompleted, activeQuiz, quizInProgress]);

  useEffect(() => {
    if (pauseQuestions.length > 0) {
      const firstPauseQuestion = pauseQuestions[0];
      if (firstPauseQuestion.type === "video_pause") {
        setCurrentPauseType("video");
      } else if (firstPauseQuestion.type === "audio_pause") {
        setCurrentPauseType("audio");
      }
    }
  }, [pauseQuestions]);


  // Add check for topic quiz completion
  useEffect(() => {
    const isTopicQuiz = topicContentDataByModule?.data?.[0]?.data?.some(
      (content) => content.quiz_id === activeQuiz.id
    );

    // If it's a completed topic quiz, show results directly
    if (isTopicQuiz && isQuizCompleted && activeQuiz?.completionData) {
      setShowResults(true);
      setShowInstructions(true);
    } else if (isTopicQuiz && !isQuizCompleted) {
      setShowResults(false);
      setShowInstructions(true);
    }
  }, [activeQuiz, isQuizCompleted, topicContentDataByModule]);

  useEffect(() => {
    if (onQuizProgress && activeQuiz) {
      onQuizProgress({
        currentQuestion: combinedQuestions[currentQuestionIndex]?.sequenceNo,
        totalQuestions: activeQuiz?.total_active_questions || totalQuestions,
        timeRemaining: timeRemaining,
        isTimerActive: timeRemaining > 0
      });
    }
  }, [currentQuestionIndex, timeRemaining, combinedQuestions.length, onQuizProgress, activeQuiz]);

  useEffect(() => {
    if (quizInProgress && activeQuiz?.id && userId && isStateRestored) {
      const quizState = {
        currentQuestionIndex,
        selectedAnswers,
        timeRemaining,
        quizInProgress: true,
        timestamp: Date.now()
      };
      localStorage.setItem(getQuizStorageKey(activeQuiz.id, userId), JSON.stringify(quizState));
    }
  }, [currentQuestionIndex, selectedAnswers, quizInProgress, activeQuiz?.id, userId, isStateRestored]);

  // To restore quiz state on component mount
  useEffect(() => {
    if (activeQuiz?.id && userId && !isStateRestored) {

      const savedState = localStorage.getItem(getQuizStorageKey(activeQuiz.id, userId));

      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          const stateAge = Date.now() - parsedState.timestamp;

          // Only restore if state is less than 24 hours old
          if (stateAge < 24 * 60 * 60 * 1000) {
            // Rebuild questions first
            const response = buildCombinedQuestions(activeQuiz);

            setCurrentQuestionIndex(parsedState.currentQuestionIndex || 0);
            setSelectedAnswers(parsedState.selectedAnswers || {});
            setTimeRemaining(parsedState.timeRemaining || (activeQuiz.duration_minutes * 60));

            if (parsedState.quizInProgress) {
              setQuizStarted(true);
              setQuizInProgress(true);
              setShowInstructions(false);
              setShowResults(false);
              enterFullScreen();
            }
          } else {
            // Clear expired state
            localStorage.removeItem(getQuizStorageKey(activeQuiz.id, userId));
          }
        } catch (error) {
          console.error('Error restoring quiz state:', error);
          localStorage.removeItem(getQuizStorageKey(activeQuiz.id, userId));
        }
      }
      setIsStateRestored(true);
    }
  }, [activeQuiz?.id, userId, isStateRestored]);

  useEffect(() => {
    // When active quiz changes, reset attempt tracking (will be recalculated below)
    // setAttemptsExhausted(false);
    // setNextAttemptTime(null);
    // setRenewalTime(null);
    // setLastAttemptTime(null);
    // setCanAttempt(true);
    // setTriedAttempts(0);
    // Reset warning-related state so previous quiz warnings don't leak
    // setAlertCount(0);
    // setPendingAutoSubmit(false);
    // setPendingAutoSubmitReason(null);
    // setShowModal(false);

    // NEW: Reset view and progress states to force instructions for new quiz
    // Only reset if the quiz ID has actually changed (avoid reset on mount/unmount of same quiz)
    if (activeQuiz?.id !== prevQuizId.current) {
      prevQuizId.current = activeQuiz?.id;

      setShowResults(false);
      setShowInstructions(true);
      setQuizInProgress(false);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setScore(0);
      setCorrectAnswers(0);
      setTotalMarks(0);
      setEarnedMarks(0);
      setTimeExpired(false);
      setHasPassedQuiz(false);
      setPauseScores({});
      setIsStateRestored(false); // Re-trigger localStorage restore logic for the new quiz
    }

    // Clear any lingering localStorage for the old quiz (safety net)
    // Removed to allow state restoration
  }, [activeQuiz?.id]);

  // Check if quiz is associated with a topic
  const isTopicQuiz = topicContentDataByModule?.data?.[0]?.data?.some(
    (content) => content.quiz_id === activeQuiz.id
  );

  const handleBack = () => {
    if (setActiveQuiz) {
      setActiveQuiz(quizData); // Set activeQuiz to the full quizData array to show cards
      setActiveTopic(null); // Reset activeTopic to null
    }
    if (onBack) onBack();
  };

  const handleCompleteSentenceInput = (questionId, blankIndex, letterIndex, value) => {
    const letterKey = `${questionId}_${blankIndex}_${letterIndex}`;
    setSelectedAnswers((prev) => ({
      ...prev,
      [letterKey]: value,
    }));
  };

  // Check if quiz has speaking questions
  const hasSpeakingQuestions = useMemo(() => {
    if (!activeQuiz) return false;

    // Get all pause question IDs from both AudioPauseQuestions and VideoPauseQuestions
    const audioPauseQuestionIds = activeQuiz.AudioPauseQuestions?.flatMap(pause =>
      pause.question_ids?.flat() || []
    ) || [];

    const videoPauseQuestionIds = activeQuiz.VideoPauseQuestions?.flatMap(pause =>
      pause.question_ids?.flat() || []
    ) || [];

    // Combine all pause question IDs
    const allPauseQuestionIds = [...audioPauseQuestionIds, ...videoPauseQuestionIds];

    // Filter AllAssignedPauseIds to include only those with actual pause questions
    const assignedPauseQuestionIds = activeQuiz.AllAssignedPauseIds
      ?.filter(item => allPauseQuestionIds.includes(item.question_id)) || [];

    return (
      (activeQuiz.SpeakingQuestions?.length > 0) ||
      (activeQuiz.QuizQuestions?.some(q => q.question_type === "speaking")) ||
      (activeQuiz.QuizPreDefinedQuestions?.some(q =>
        q.PreDefinedQuestion?.question_type === "speaking"
      )) ||
      (activeQuiz.AudioPauseQuestions?.some(apq =>
        apq.question_ids?.some(qId => {
          const assignedQuestion = assignedPauseQuestionIds?.find(aq => aq.question_id === qId);
          return assignedQuestion?.question_type === "speaking";
        })
      )) ||
      (activeQuiz.VideoPauseQuestions?.some(vpq =>
        vpq.question_ids?.some(qId => {
          const assignedQuestion = assignedPauseQuestionIds?.find(aq => aq.question_id === qId);
          return assignedQuestion?.question_type === "speaking";
        })
      ))
    );
  }, [activeQuiz]);

  // Effect to show audio setup when quiz begins and has speaking questions
  useEffect(() => {
    if (quizInProgress && hasSpeakingQuestions && !showAudioSetup && !audioSetupCompleted) {
      setShowAudioSetup(true);
    }
  }, [quizInProgress, hasSpeakingQuestions, showAudioSetup, audioSetupCompleted]);



  // Modify handleBeginQuiz to check eligibility
  const handleBeginQuiz = () => {
    if (!canAttempt) {
      if (attemptsExhausted) {
        toast.error("Maximum attempts reached. Please wait for renewal.");
      } else if (nextAttemptTime) {
        toast.warn("You must wait until the next attempt time.");
      }
      return;
    }

    // Clear any existing quiz state
    if (activeQuiz?.id && userId) {
      localStorage.removeItem(getQuizStorageKey(activeQuiz.id, userId));
    }

    setQuizStarted(true);
    setShowInstructions(false);
    setShowResults(false);
    // Clear any lingering warning states (e.g., from prior quiz session)
    setAlertCount(0);
    setPendingAutoSubmit(false);
    setPendingAutoSubmitReason(null);
    setShowModal(false);

    // If there are speaking questions, show audio setup instead of immediately starting
    if (hasSpeakingQuestions) {
      setShowAudioSetup(true);
    } else {
      // No speaking questions, start quiz normally
      startQuiz();
    }
  };

  // Separate function to actually start the quiz
  const startQuiz = () => {
    setQuizStarted(true);
    setShowInstructions(false);
    setShowResults(false);
    enterFullScreen();
    setQuizInProgress(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setScore(0);
    setCorrectAnswers(0);
    setTotalMarks(0);
    setEarnedMarks(0);
    setTimeExpired(false);
    setHasPassedQuiz(false);
    // Ensure warnings reset when actual quiz run begins
    setAlertCount(0);
    setPendingAutoSubmit(false);
    setPendingAutoSubmitReason(null);
    setShowModal(false);

    // Reset pause scores at the start
    setPauseScores({});

    // Prepare questions based on quiz type
    if (activeQuiz) {
      const response = buildCombinedQuestions(activeQuiz);
      setTimeRemaining(activeQuiz.duration_minutes * 60);
    }
  };

  const buildCombinedQuestions = (activeQuiz) => {
    if (!activeQuiz) return { combinedQuestions: [], pauseQuestions: [] };

    // Prepare questions based on quiz type
    if (activeQuiz) {

      // Get all pause question IDs from both AudioPauseQuestions and VideoPauseQuestions
      const audioPauseQuestionIds = activeQuiz.AudioPauseQuestions?.flatMap(pause =>
        pause.question_ids?.flat() || []
      ) || [];

      const videoPauseQuestionIds = activeQuiz.VideoPauseQuestions?.flatMap(pause =>
        pause.question_ids?.flat() || []
      ) || [];

      // Combine all pause question IDs
      const allPauseQuestionIds = [...audioPauseQuestionIds, ...videoPauseQuestionIds];

      // Filter AllAssignedPauseIds to include only those with actual pause questions
      const assignedPauseQuestionIds = activeQuiz.AllAssignedPauseIds
        ?.filter(item => allPauseQuestionIds.includes(item.question_id))
        ?.map(item => item.question_id) || [];

      // Get all question IDs that are assigned to pause containers
      // const assignedPauseQuestionIds = activeQuiz.AllAssignedPauseIds?.map(item => item.question_id) || [];

      if (activeQuiz.quizType === "text_based") {

        const textBasedQuestions =
          activeQuiz.TextedBasedQuizTexts?.flatMap((text) => [
            ...(text.FillInBlankQuestions || []).map((q) => ({
              ...q,
              id: `fill_${q.id}`,
              questionId: `fill_${q.id}`,
              type: "fill_in_the_blank",
              quiz_id: activeQuiz.id,
              marks: q.marks || 1,
              text_based_text: text.text,
              question_text: q.text,
              correct_answer: q.correctAnswer,
              is_text_based: true
            })),
            ...(text.MultipleChoiceQuestions || []).map((q) => ({
              ...q,
              id: `multi_${q.id}`,
              questionId: `multi_${q.id}`,
              type: "multiple_choice",
              // Transform the string options to the expected QuizOptions format
              QuizOptions: q.options.map((optionText, index) => ({
                id: `multi_${q.id}_opt_${index}`, // Create unique ID for each option
                option_text: optionText,
                option_img: null, // or empty string if no image
                is_correct: q.correctAnswer?.trim().toLowerCase() === optionText?.trim().toLowerCase()
              })),
              quiz_id: activeQuiz.id,
              marks: q.marks || 1,
              text_based_text: text.text,
              question_text: q.text,
              is_text_based: true
            })),
            ...(text.TrueFalseQuestions || []).map((q) => ({
              ...q,
              id: `true_false_${q.id}`,
              questionId: `true_false_${q.id}`,
              type: "true_false",
              quiz_id: activeQuiz.id,
              marks: q.marks || 1,
              text_based_text: text.text,
              question_text: q.text,
              correct_answer: q.correctAnswer,
              is_text_based: true
            })),
          ]) || [];

        let currentSequence = 0;

        const finalQuestions = textBasedQuestions.map(q => {
          currentSequence += 1;

          return {
            ...q,
            sequenceNo: currentSequence,
          };
        });

        setCombinedQuestions(finalQuestions);
      } else {

        // Filter out questions that are assigned to pause containers
        const regularQuestions = (activeQuiz.QuizQuestions || []).filter(
          q => !assignedPauseQuestionIds.includes(q.id)
        ).map((q) => {
          return {
            ...q,
            questionId: q.id,
          };
        });

        // Filter out other question types that are assigned to pause containers
        // const predefinedQuestions = (activeQuiz.QuizPreDefinedQuestions || []).filter(
        //   q => !assignedPauseQuestionIds.includes(q.id)
        // ).map((preDefQues) => {

        const predefinedQuestions = (activeQuiz.QuizPreDefinedQuestions || [])
          .map((preDefQues) => {
            const questionData = preDefQues.PreDefinedQuestion;
            return {
              id: `pre_${questionData.id}`,
              questionId: `pre_${questionData.id}`,
              quiz_id: activeQuiz.id,
              question_text: questionData.question_text,
              question_img: questionData.question_img,
              question_type: questionData.question_type,
              marks: questionData.marks,
              sequence_no: questionData.sequence_no,
              QuizOptions: questionData.PreDefinedOptions.map((option) => ({
                id: `pre_opt_${option.id}`,
                question_id: `pre_${questionData.id}`,
                option_text: option.option_text,
                option_img: option.option_img,
                is_correct: option.is_correct,
              })),
            };
          });

        // Add AudioToScriptQuestions if they exist
        // Repeat for other question types (e.g., AudioToScriptQuestions, VideoToScriptQuestions, etc.)
        const audioScriptQuestions = (activeQuiz.AudioToScriptQuestions || []).filter(
          q => !assignedPauseQuestionIds.includes(q.id)
        ).map((audioQuestion, index) => ({
          id: `audio_${audioQuestion.id}`,
          questionId: audioQuestion.id,
          quiz_id: activeQuiz.id,
          question_text: "Listen to the audio and type the script you hear:",
          question_type: "audio_script",
          marks: audioQuestion.marks, // Default marks for audio questions
          sequence_no: 1000 + index, // Place audio questions at the end
          audioUrl: audioQuestion.url,
          correctScript: audioQuestion.script,
          type: "audio_script",
        }));

        // Add VideoToScriptQuestions if they exist
        const videoScriptQuestions = (activeQuiz.VideoToScriptQuestions || []).filter(
          q => !assignedPauseQuestionIds.includes(q.id)
        ).map((videoQuestion, index) => ({
          id: `video_${videoQuestion.id}`,
          questionId: videoQuestion.id,
          quiz_id: activeQuiz.id,
          question_text: "Watch the video and type the script you hear:",
          question_type: "video_script",
          marks: videoQuestion.marks, // Default marks for video questions
          sequence_no: 1050 + index, // Place video questions after audio questions
          videoUrl: videoQuestion.url,
          correctScript: videoQuestion.script,
          type: "video_script",
        }));

        // Add ImageToScriptQuestions if they exist
        const imageScriptQuestions = (activeQuiz.ImageToScriptQuestions || []).filter(
          q => !assignedPauseQuestionIds.includes(q.id)
        ).map((imageQuestion, index) => ({
          id: `image_${imageQuestion.id}`,
          questionId: imageQuestion.id,
          quiz_id: activeQuiz.id,
          question_text: "View the image and type the script you see:",
          question_type: "image_script",
          marks: imageQuestion.marks, // Default marks for image questions
          sequence_no: 1100 + index, // Place image questions after video questions
          imageUrl: imageQuestion.url,
          correctScript: imageQuestion.script,
          type: "image_script",
        }));


        // Add RealWordQuestions if they exist
        const realWordQuestions = (activeQuiz.RealWordQuestions || []).filter(
          q => !assignedPauseQuestionIds.includes(q.id)
        ).flatMap(
          (realWordQuestion, questionIndex) =>
            realWordQuestion.words.length > 0 ? [{
              id: `realword_${realWordQuestion.id}`,
              questionId: realWordQuestion.id,
              quiz_id: activeQuiz.id,
              question_text: "Identify which words are correct and which are fake:",
              question_type: "real_word",
              marks: realWordQuestion.words.length, // Total marks equal to number of words
              audio_url: realWordQuestion.audio_url,
              video_url: realWordQuestion.video_url,
              sequence_no: 2000 + questionIndex,
              words: realWordQuestion.words, // All words
              correctAnswers: realWordQuestion.correct_answers, // All correct answers
              type: "real_word",
            }] : []
        );

        // Add SpeakingQuestions if they exist
        const speakingQuestions = (activeQuiz.SpeakingQuestions || []).filter(
          q => !assignedPauseQuestionIds.includes(q.id)
        ).map((speakingQuestion, index) => ({
          id: `speaking_${speakingQuestion.id}`,
          questionId: speakingQuestion.id,
          quiz_id: activeQuiz.id,
          question_text: speakingQuestion.speaking_question,
          question_type: "speaking",
          marks: speakingQuestion.marks, // Default marks for audio questions
          sequence_no: 2500 + index, // Place audio questions at the end
          speakingAudioUrl: speakingQuestion.audio_url,
          speakingVideoUrl: speakingQuestion.video_url,
          imageUrl: speakingQuestion.question_img,
          speaking_answer: speakingQuestion.speaking_answer,
          type: "speaking",
        }));

        // Add DragDropQuestions if they exist
        const dragDropQuestions = (activeQuiz.DragDropQuestions || []).filter(
          q => !assignedPauseQuestionIds.includes(q.id)
        ).map(
          (dragDropQuestion, index) => ({
            id: `drag_drop_${dragDropQuestion.id}`,
            questionId: dragDropQuestion.id,
            quiz_id: activeQuiz.id,
            prompt: dragDropQuestion.prompt,
            question_type: "drag_drop",
            marks: dragDropQuestion.marks, // Default marks for drag and drop questions
            audio_url: dragDropQuestion.audio_url, // Add this
            video_url: dragDropQuestion.video_url, // Add this
            sequence_no: 3000 + index, // Place drag and drop questions after real word questions
            options: dragDropQuestion.options,
            blanks: dragDropQuestion.blanks,
            type: "drag_drop",
          })
        );

        // Add SummaryPassageQuestions if they exist
        const summaryPassageQuestions = (activeQuiz.SummarizePassageQuestions || []).filter(
          q => !assignedPauseQuestionIds.includes(q.id)
        ).map((summary, index) => ({
          id: `summary_${summary.id}`,
          questionId: summary.id,
          quiz_id: activeQuiz.id,
          question_text: summary.summary,
          question_type: "summary_passage",
          marks: summary.marks || 1, // Default marks or from DB
          audio_url: summary.audio_url, // Add this
          video_url: summary.video_url, // Add this
          sequence_no: 4000 + index,
          expectedSummary: summary.expected_summary, // Assuming you store the expected answer
          type: "summary_passage",
          time_limit: summary.time_limit,
        }));

        // Add BestOptionQuestions if they exist
        const bestOptionQuestions = (activeQuiz.BestOptionQuestions || []).filter(
          q => !assignedPauseQuestionIds.includes(q.id)
        ).map(
          (question, index) => ({
            id: `bestoption_${question.id}`,
            questionId: question.id,
            quiz_id: activeQuiz.id,
            question_type: "best_option",
            passage: question.passage,
            blanked_words: question.blanked_words,
            distractor_options: question.distractor_options,
            type: "best_option",
            marks: question.marks || 1, // Default marks or from DB
            audio_url: question.audio_url, // Add this
            video_url: question.video_url, // Add this
            sequence_no: 5000 + index,
          })
        );


        // Add CompleteSentenceQuestions if they exist
        const completeSentenceQuestions = (activeQuiz.CompleteSentenceQuestions || []).filter(
          q => !assignedPauseQuestionIds.includes(q.id)
        ).map((q, idx) => {
          // Extract correct words and hints from options array
          const options = q.options || [];
          const correct_word = options.map(opt => opt.correct_word);
          const hint = options.map(opt => opt.hint);

          return {
            ...q,
            id: `complete_sentence_${q.id}`,
            questionId: q.id,
            type: "complete_sentence",
            quiz_id: activeQuiz.id,
            question: q.question,
            correct_word: correct_word,
            hint: hint,
            marks: q.marks || 1,
            audio_url: q.audio_url, // Add this
            video_url: q.video_url, // Add this
            sequence_no: 6000 + idx,
          };
        });

        // Add ArrangeOrderQuestions if they exist
        const arrangeOrderQuestions = (activeQuiz.ArrangeOrderQuestions || []).filter(
          q => !assignedPauseQuestionIds.includes(q.id)
        ).map((q, idx) => ({
          id: `arrangeorder_${q.id}`,
          questionId: q.id,
          quiz_id: activeQuiz.id,
          type: "arrange_order",
          question_type: "arrange_order",
          arrangeorder_prompt: q.arrangeorder_prompt || "",
          sentences: q.sentences || [],
          correct_order: q.correct_order || [],
          marks: q.marks || 1,
          audio_url: q.audio_url, // Add this
          video_url: q.video_url, // Add this
          sequence_no: 7000 + idx, // Place after complete_sentence
        }));


        // Inside handleBeginQuiz, after all other question types:
        const videoPauseQuestions = (activeQuiz.VideoPauseQuestions || []).map((videoPause, index) => ({
          id: `video_pause_${videoPause.id}`,
          questionId: videoPause.id,
          quiz_id: activeQuiz.id,
          type: "video_pause",
          question_text: "Watch the video and answer the questions at the specified timestamps.",
          videoUrl: videoPause.url,
          stamps: videoPause.stamps,
          question_ids: videoPause.question_ids,
          marks: videoPause.marks || 1,
          sequence_no: 8000 + index, // Place after all other questions
        }));

        const audioPauseQuestions = (activeQuiz.AudioPauseQuestions || []).map((audioPause, index) => ({
          id: `audio_pause_${audioPause.id}`,
          questionId: audioPause.id,
          quiz_id: activeQuiz.id,
          type: "audio_pause",
          question_text: "Listen to the audio and answer the questions at the specified timestamps.",
          audioUrl: audioPause.url,
          stamps: audioPause.stamps,
          question_ids: audioPause.question_ids,
          marks: audioPause.marks || 1,
          sequence_no: 9000 + index, // Place after video pause questions
        }));

        const allQuestions = [
          ...regularQuestions,
          ...predefinedQuestions,
          ...audioScriptQuestions,
          ...videoScriptQuestions,
          ...imageScriptQuestions,
          ...realWordQuestions,
          ...speakingQuestions,
          ...dragDropQuestions,
          ...summaryPassageQuestions,
          ...bestOptionQuestions,
          ...completeSentenceQuestions,
          ...arrangeOrderQuestions,
          ...videoPauseQuestions, // Add video pause questions
          ...audioPauseQuestions, // Add audio pause questions
        ].sort((a, b) => a.sequence_no - b.sequence_no);

        // const videoPauseQuestions = activeQuiz.VideoPauseQuestions || [];
        // const audioPauseQuestions = activeQuiz.AudioPauseQuestions || [];
        setPauseQuestions([...videoPauseQuestions, ...audioPauseQuestions]);

        let currentSequence = 0;
        let lastQuestionId = null;

        const finalQuestions = allQuestions.map(q => {
          if (q.questionId !== lastQuestionId) {
            currentSequence += 1; // increment only when questionId changes
            lastQuestionId = q.questionId;
          }

          return {
            ...q,
            sequenceNo: currentSequence,
          };
        });

        setCombinedQuestions(finalQuestions);
      }
    }
  };

  // Audio device testing functions (keep the same)
  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let audioDetected = false;

      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

        if (average > 5) {
          audioDetected = true;
          setSpeakingCheck(prev => ({ ...prev, micCheck: true }));
          stream.getTracks().forEach(track => track.stop());
          // Check if audioContext is not already closed
          if (audioContext && audioContext.state !== "closed") {
            audioContext.close();
          }
          toast.success("Microphone working properly!");
        }
      };

      const interval = setInterval(checkAudio, 100);
      setTimeout(() => {
        clearInterval(interval);
        if (!audioDetected) {
          toast.warning("No audio detected. Please speak into your microphone.");
        }
        stream.getTracks().forEach(track => track.stop());
        // Check if audioContext is not already closed
        if (audioContext && audioContext.state !== "closed") {
          audioContext.close();
        }
      }, 5000);

    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Cannot access microphone. Please check permissions.");
    }
  };

  const testSpeakers = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

      oscillator.start();

      const userHeardSound = window.confirm(
        "Can you hear the test tone? Click OK if you can hear it, Cancel if you can't."
      );

      oscillator.stop();
      audioContext.close();

      if (userHeardSound) {
        setSpeakingCheck(prev => ({ ...prev, speakerCheck: true }));
        toast.success("Speakers working properly!");
      } else {
        toast.warning("Please check your speaker volume and connections.");
      }
    } catch (error) {
      console.error("Error testing speakers:", error);
      toast.error("Error testing audio output.");
    }
  };

  const handleAudioSetupComplete = () => {
    if (speakingCheck.micCheck && speakingCheck.speakerCheck) {
      setAudioSetupCompleted(true); // Mark audio setup as completed
      setShowAudioSetup(false);
      startQuiz(); // Now start the quiz
    } else {
      toast.warning("Please complete both microphone and speaker checks before proceeding.");
    }
  };

  const handleSkipAudioSetup = () => {
    setAudioSetupCompleted(true); // Mark audio setup as completed even when skipped
    setShowAudioSetup(false);
    startQuiz();
  };

  // Effect for timer
  useEffect(() => {
    const currentQ = combinedQuestions[currentQuestionIndex];

    // Pause if summary_passage
    if (
      timeRemaining !== null &&
      timeRemaining > 0 &&
      activeQuiz &&
      currentQ?.question_type !== "summary_passage"
    ) {
      const timer = setTimeout(() => {
        setTimeRemaining((prevTime) => prevTime - 1);
      }, 1000);

      if (timeRemaining === 1) {
        handleSubmitQuiz();
      }

      return () => clearTimeout(timer);
    }
  }, [timeRemaining, activeQuiz, currentQuestionIndex, combinedQuestions]);

  // Effect for summary timer - Fixed version
  useEffect(() => {
    const currentQuestion = combinedQuestions[currentQuestionIndex];

    if (currentQuestion?.question_type === "summary_passage") {
      const limitInSeconds = (currentQuestion.time_limit || 1);

      // Only reset timer if we're starting fresh or if no time is saved for this question
      const savedTime = selectedAnswers[currentQuestion.id]?.remainingTime;
      if (savedTime === undefined || savedTime === null) {
        setSummaryTimeRemaining(limitInSeconds);
      } else {
        setSummaryTimeRemaining(savedTime);
      }

      setIsSummaryTimerRunning(true);
    } else {
      setIsSummaryTimerRunning(false);
      setSummaryTimeRemaining(null);
    }
  }, [currentQuestionIndex, combinedQuestions]);

  // Effect for running the summary timer
  useEffect(() => {
    if (isSummaryTimerRunning && summaryTimeRemaining > 0) {
      const timer = setTimeout(() => {
        setSummaryTimeRemaining((prev) => {
          const newTime = prev - 1;

          // Save the current time to the answer state
          const currentQuestion = combinedQuestions[currentQuestionIndex];
          if (currentQuestion?.question_type === "summary_passage") {
            setSelectedAnswers(prevAnswers => ({
              ...prevAnswers,
              [currentQuestion.id]: {
                ...prevAnswers[currentQuestion.id],
                remainingTime: newTime
              }
            }));
          }

          return newTime;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (isSummaryTimerRunning && summaryTimeRemaining === 0) {
      setIsSummaryTimerRunning(false);
      // Don't auto-advance, just disable the input
    }
  }, [isSummaryTimerRunning, summaryTimeRemaining, currentQuestionIndex, combinedQuestions]);

  const handleAnswerSelect = (questionId, value, isMulti = false) => {
    setSelectedAnswers((prev) => {
      const currentQuestion = combinedQuestions.find(q => q.id === questionId);
      // Check if the current question has multiple correct options
      const correctOptions = currentQuestion?.QuizOptions?.filter(opt => opt.is_correct) || [];
      const isMultiSelect = correctOptions.length > 1;

      if (currentQuestion?.type === "summary_passage") {
        const currentAnswer = prev[currentQuestion.id] || {};
        return {
          ...prev,
          [currentQuestion.id]: {
            ...currentAnswer,
            userPassage: value,
            remainingTime: currentAnswer.remainingTime // Preserve the timer value
          },
        };
      } else if (isMultiSelect) {
        // Multi-select: Toggle value in array
        const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
        if (current.includes(value)) {
          return { ...prev, [questionId]: current.filter((v) => v !== value) };
        } else {
          return { ...prev, [questionId]: [...current, value] };
        }
      } else {
        // Single-select: Set single value
        return { ...prev, [questionId]: value };
      }
    });
  };


  const handleNextQuestion = async () => {
    const currentQuestion = combinedQuestions[currentQuestionIndex];

    // For summary passages, preserve the timer state when navigating away
    if (currentQuestion?.type === "summary_passage") {
      // Timer state is already preserved in selectedAnswers via the useEffect
      setIsSummaryTimerRunning(false);
    }

    // Proceed to next
    if (currentQuestionIndex < combinedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = async (reason = "user_submit") => {
    setIsSubmitting(true);
    setSubmissionReason(reason);

    try {
      const isTimeExpired = timeRemaining <= 1;

      // Prepare submission data
      const submissionData = {
        quizId: activeQuiz.id,
        answers: selectedAnswers,
        timeRemaining: timeRemaining,
        submissionReason: reason,
        // Add other relevant data like pauseScores if needed
      };

      const formData = new FormData();

      // append normal data
      formData.append("quizId", activeQuiz.id);
      formData.append("timeRemaining", timeRemaining);
      formData.append("submissionReason", reason);

      // IMPORTANT: stringify answers
      formData.append("answers", JSON.stringify(selectedAnswers));

      Object.entries(selectedAnswers).forEach(([key, answer]) => {
        const questionId = Number(key.split("_")[1]); // 👈 THIS IS THE LINE YOU WANT

        if (
          answer.type === "speaking_answer" &&
          answer.audioBlob instanceof Blob
        ) {
          const file = new File(
            [answer.audioBlob],
            `speakingAudio_${questionId}.wav`,
            { type: answer.audioBlob.type || "audio/wav" }
          );

          formData.append("speakingAudio", file);
        }
      });

      // Call backend API
      const result = await evaluateQuiz({ submissionData: formData, access_token }).unwrap();

      // Clear stored quiz state
      if (activeQuiz?.id && userId) {
        localStorage.removeItem(getQuizStorageKey(activeQuiz.id, userId));
      }

      if (result.success) {

        // Update state with results from backend
        setQuizStarted(false);
        setScore(result.data.score);
        setCorrectAnswers(result.data.correctAnswers);
        setTotalMarks(result.data.totalMarks);
        setEarnedMarks(result.data.earnedMarks);
        // Store quiz data and wait for persistence before showing results.
        const completionPopupType = await storeQuizData(
          result.data.score,
          result.data.correctAnswers,
          result.data.earnedMarks,
          result.data.totalMarks
        );

        if (refetchQuizCompletion) {
          await refetchQuizCompletion();
        }
        if (refetchQuizHistory) {
          await refetchQuizHistory();
        }

        setShowResults(true);
        setShowInstructions(true);
        setQuizInProgress(false);
        if (completionPopupType) {
          setPendingCompletionPopup(completionPopupType);
        }

        // Set pass status
        setHasPassedQuiz(result.data.hasPassed);

        if (result.data.isTimeExpired) {
          setTimeExpired(true);
        }

        // Exit fullscreen mode
        exitFullScreen();
      } else {
        throw new Error(result.message || 'Failed to evaluate quiz');
      }

    } catch (err) {
      console.error("Error during quiz submission:", err);
      toast.error("An error occurred during submission. Please try again.");
      // Optionally: Fall back to frontend evaluation if backend fails
      // await evaluateLocally(); // You might want to keep your original evaluation as fallback
    } finally {
      setIsSubmitting(false);
      setAlertCount(0);
      setPendingAutoSubmit(false);
      setPendingAutoSubmitReason(null);
      setShowModal(false);
    }
  };

  // Only keep beforeunload safeguard – remove legacy unconditional tab auto-submit
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (quizInProgress) {
        e.preventDefault();
        e.returnValue = true;
        // Do NOT auto-submit here if warnings are disabled; this protects accidental reload.
        if (activeQuiz?.isWarning) {
          handleSubmitQuiz();
        }
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [quizInProgress, activeQuiz?.isWarning, handleSubmitQuiz]);


  useEffect(() => {
    if (quizInProgress) {
      toast.warn("Warning: Leaving this page or click on ESC KEY will submit your quiz automatically.", {
        autoClose: false,
        position: "top-center",
      });
    }
  }, [quizInProgress]);


  const storeQuizData = (finalScore, correctAnswerCount, emarks, tmarks) => {

    const storeQuizCompletion = async () => {
      try {
        // Determine new attempt number robustly from latest history
        const previousAttempts = quizCompletionHistory;
        const prevAttemptCount = previousAttempts.length;
        // Use highest triedAttempts recorded (fallback to count)
        const prevMaxTried = previousAttempts.reduce((m, c) => Math.max(m, c.triedAttempts || 0), 0);
        const newAttemptNumber = (prevMaxTried || prevAttemptCount) + 1;

        const formData = {
          userId: userId,
          courseId: courseId,
          quizId: activeQuiz.id,
          score: finalScore,
          isCompleted: finalScore >= activeQuiz.passing_score,
          status: finalScore >= activeQuiz.passing_score ? "Passed" : "Failed",
          triedAttempts: newAttemptNumber,
          lastAttemptTime: Date.now(),
          count: correctAnswerCount,
          total_question: totalQuestions,
          created_by: userId,
          updated_by: userId,
          module_id: activeQuiz.module_id,
          totalMarks: tmarks,
          obtainedMarks: emarks,
          topic_id: (() => {
            //check if activeQuiz is a topic quiz
            if (topicContentDataByModule?.data?.[0]?.data) {
              const topicContent = topicContentDataByModule?.data?.[0]?.data?.find((content) => content.quiz_id === activeQuiz.id && content.topic_id);
              return topicContent ? topicContent.topic_id : null;
            }
            return null;
          })(),
        };

        const response = await createQuizCompletion({
          completionData: formData,
          access_token,
        }).unwrap();

        if (refetchTopics) await refetchTopics();
        if (refetchQuizData) await refetchQuizData();

        let completionPopupType = null;

        if (response?.courseCompletionStatus?.courseCompleted) {
          await refetchSessions();
          await refetchModules();
          completionPopupType = "certificate";
        } else if (response?.sessionCompletionStatus?.sessionCompleted) {
          await refetchSessions();
          await refetchModules();
          completionPopupType = "session";
        } else if (response?.moduleCompletionStatus?.isModuleCompleted) {
          await refetchModules();
          completionPopupType = "module";
        }

        dispatch(addCompletion(response));
        return {
          completionId: response?.quizCompletion?.id,
          completionPopupType,
        };
      } catch (error) {
        console.error("Failed to store quiz completion", error);
        throw error;
      }
    };

    return storeQuizCompletion()
      .then(async ({ completionId, completionPopupType }) => {
        setCompletionId(completionId);
        setTriedAttempts(prev => prev + 1);
        setLastAttemptTime(new Date());

        // Store quiz responses
        const quizAnswersData = combinedQuestions.map((question) => {
          const answerPayload = {};
          let isCorrect = false;

          // Helper: Compare arrays ignoring order
          const arraysEqual = (a, b) =>
            a.length === b.length &&
            a.every((val) => b.includes(val)) &&
            b.every((val) => a.includes(val));



          if (question.type === "summary_passage") {
            const answerData = selectedAnswers[question.id] || {};
            answerPayload[question.id] = {
              userPassage: answerData.userPassage,
              student_summary: answerData.student_summary,
              marks: answerData.marks,
            };
            isCorrect = answerData.marks >= 1; // e.g., passing grade is 4 or above

          } else if (
            question.question_type === "mcq" ||
            question.question_type === "true_false" ||
            question.type === "complete_sentence"
          ) {

            if (question.type === "complete_sentence") {
              // Handle multiple blanks in complete sentence questions
              const parts = question.question.split("_____");
              const numBlanks = parts.length - 1;

              // Get correct words and hints as arrays
              const correctWords = Array.isArray(question.correct_word)
                ? question.correct_word
                : Array(numBlanks).fill(question.correct_word || "");

              const hints = Array.isArray(question.hint)
                ? question.hint
                : Array(numBlanks).fill(question.hint || "");

              // Process each blank
              const userWords = [];
              let allBlanksCorrect = true;

              for (let blankIndex = 0; blankIndex < numBlanks; blankIndex++) {
                const correctWord = correctWords[blankIndex] || "";
                const hint = hints[blankIndex] || "";
                let userWord = "";

                for (let letterIndex = 0; letterIndex < correctWord.length; letterIndex++) {
                  if (letterIndex < hint.length) {
                    userWord += hint[letterIndex];
                  } else {
                    const key = `${question.id}_${blankIndex}_${letterIndex}`;
                    userWord += (selectedAnswers[key] || "").trim();
                  }
                }

                const trimmedUserWord = userWord.trim().toLowerCase();
                const trimmedCorrectWord = correctWord.trim().toLowerCase();

                userWords.push(trimmedUserWord);

                if (trimmedUserWord !== trimmedCorrectWord) {
                  allBlanksCorrect = false;
                }
              }

              isCorrect = allBlanksCorrect;

              // Store all user words in the payload
              answerPayload[question.id] = userWords;
            } else if (question.type === "arrange_order") {
              const userOrder = selectedAnswers[question.id] || [];
              const isCorrect =
                userOrder.length === question.sentences.length &&
                userOrder.every((sentence, index) => sentence === question.sentences[index]);
              answerPayload[question.id] = userOrder;
            }
            else if (
              question.question_type === "complete_sentence" &&
              Array.isArray(question.CompleteSentenceQuestions
              )
            ) {
              isCorrect = true; // Assume all sentences are correct initially

              question.CompleteSentenceQuestions
                .forEach((sentence) => {
                  // Fetch the user's answer for this specific sentence
                  const userAnswerKey = `${question.id}_${sentence.id}`;
                  const userAnswer = selectedAnswers[userAnswerKey]?.toLowerCase();
                  const correctAnswer = sentence.correct_word.toLowerCase();

                  // Check if the user's answer matches the correct answer
                  if (userAnswer !== correctAnswer) {
                    isCorrect = false; // Mark as incorrect if any sentence is wrong
                  }

                  // Store the user's answer in the payload
                  answerPayload[userAnswerKey] = userAnswer || "";
                });
            } else {
              // Handle MCQ / True False
              const correctOptions = question.QuizOptions?.filter((option) => option.is_correct).map(o => o.id) || [];
              const userSelected = selectedAnswers[question.id];
              if (correctOptions.length > 1) {
                // Multi-select
                const userArray = Array.isArray(userSelected) ? [...userSelected].sort() : [];
                const correctArray = [...correctOptions].sort();
                isCorrect = userArray.length === correctArray.length && userArray.every((val, idx) => val === correctArray[idx]);
                answerPayload[question.id] = userArray;  // Store as array
              } else {
                // Single-select
                isCorrect = correctOptions.includes(userSelected);
                answerPayload[question.id] = userSelected || null;
              }
            }
          }
          else if (question.type === "audio_script") {
            const userAnswer = selectedAnswers[question.id]?.trim().toLowerCase() || "";
            const correctAnswer = question.correctScript?.trim().toLowerCase() || "";
            isCorrect = userAnswer === correctAnswer;
            answerPayload[question.id] = userAnswer;

          } else if (question.type === "real_word") {
            const expectedAnswers = Array.isArray(question.correctAnswers)
              ? question.correctAnswers
              : [];

            const userAnswers = expectedAnswers.map((_, index) => {
              const prefixedKey = `${question.id}_word_${index}`;
              const numericKey = `${question.questionId}_word_${index}`;
              const value = selectedAnswers[prefixedKey] ?? selectedAnswers[numericKey] ?? "";
              return String(value).trim().toLowerCase();
            });

            const normalizedExpected = expectedAnswers.map((ans) => String(ans || "").trim().toLowerCase());
            isCorrect =
              userAnswers.length === normalizedExpected.length &&
              userAnswers.every((ans, index) => ans === normalizedExpected[index]);

            answerPayload[question.id] = userAnswers;

          } else if (question.type === "drag_drop") {
            const userAnswers = selectedAnswers[question.id] || {};
            let correctBlanks = 0;
            const totalBlanks = question.blanks?.length || 0;

            question.blanks.forEach((blank) => {
              const position = blank.position;
              const correctAnswer = blank.correct;
              const userAnswer = userAnswers[position];

              if (userAnswer === correctAnswer) {
                correctBlanks++;
              }
            });

            isCorrect = correctBlanks === totalBlanks;
            answerPayload[question.id] = userAnswers;

          } else if (question.type === "best_option") {
            let allBlanksCorrect = true;

            // Parse blanked_words if it's a string
            let blankedWords = question.blanked_words;
            if (typeof blankedWords === 'string') {
              try {
                blankedWords = JSON.parse(blankedWords);
              } catch (error) {
                console.error('Error parsing blanked_words JSON:', error);
                blankedWords = [];
              }
            }

            blankedWords?.forEach((blankedWord, index) => {
              const key = `${question.id}_${index}`;
              const userAnswer = selectedAnswers[key]?.toLowerCase();
              if (userAnswer !== blankedWord.word.toLowerCase()) {
                allBlanksCorrect = false;
              }
            });

            isCorrect = allBlanksCorrect;
            answerPayload[question.id] = selectedAnswers[question.id] || "";

          } else if (question.type === "video_pause" || question.type === "audio_pause") {
            // Persist pause aggregated score and deductions
            const entry = pauseScores[question.id] || { total: question.marks || 0, current: question.marks || 0, deductions: [] };
            isCorrect = entry.current === (question.marks || 0);
            answerPayload[question.id] = entry;
          } else {
            Object.entries(selectedAnswers).forEach(([key, value]) => {
              if (key === question.id || key.startsWith(`${question.id}_`)) {
                answerPayload[key] = value;
              }
            });
            const correctOption = question.QuizOptions?.find(
              (option) => option.is_correct
            );
            isCorrect =
              selectedAnswers[question.id] !== undefined &&
              selectedAnswers[question.id] === correctOption?.id;
            answerPayload[question.id] = selectedAnswers[question.id] || null;
          }

          return {
            quizCompletionId: completionId,
            questionId: question.id,
            answer: JSON.stringify(answerPayload),
            isCorrect,
            updated_by: userId,
            created_by: userId,
          };
        });

        await createQuizResponse({
          responseData: quizAnswersData,
          access_token,
        })
          .unwrap()
          .catch((error) => {
            console.log("Error storing quiz answers:", error);
          });
        if (refetchQuizCompletion) {
          await refetchQuizCompletion(); // 👈 Refetch quiz completion data
        }
        if (refetchQuizHistory) {
          await refetchQuizHistory();
        }
        await refetchQuizData();
        await refetchTopics();
        return completionPopupType;
      })
      .catch((error) => {
        console.log("Error:", error);
        throw error;
      });
  };

  const handleCloseResultPopup = async () => {
    if (refetchQuizCompletion) {
      await refetchQuizCompletion();
    }
    if (refetchQuizHistory) {
      await refetchQuizHistory();
    }
    if (refetchActiveQuiz) {
      await refetchActiveQuiz();
    }
    setShowResults(false);
  };

  const resetQuiz = () => {
    // Clear stored quiz state
    if (activeQuiz?.id && userId) {
      localStorage.removeItem(getQuizStorageKey(activeQuiz.id, userId));
    }

    setSubmissionReason(null); // Reset reason
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
    setTimeRemaining(activeQuiz.duration_minutes * 60);
    setQuizInProgress(true);
    setTimeExpired(false);
    enterFullScreen();
    // Reset pause scores on reset
    setPauseScores({});
    if (refetchActiveQuiz) {
      // ensure latest quiz config (e.g., attempts, warnings) before starting
      setTimeout(() => {
        refetchActiveQuiz();
        if (refetchQuizCompletion) refetchQuizCompletion();
      }, 0);
    }
  };

  const handleBackToQuizzes = async () => {
    // Clear stored quiz state
    if (activeQuiz?.id && userId) {
      localStorage.removeItem(getQuizStorageKey(activeQuiz.id, userId));
    }

    // Reset quiz state
    if (refetchQuizCompletion) {
      await refetchQuizCompletion(); // Refresh status before going back
    }
    if (refetchActiveQuiz) {
      await refetchActiveQuiz(); // get updated quiz data (attempt counts etc.)
    }
    if (refetchQuizHistory) {
      await refetchQuizHistory(); // Refresh attempt history from direct API
    }
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
    setShowInstructions(true);
    setQuizInProgress(false);
    setTimeRemaining(0);
    setTimeExpired(false);
    setCorrectAnswers(0);
    setHasPassedQuiz(false);
    setShowBackModal(false);
    // Clear warning states on exit
    setAlertCount(0);
    setPendingAutoSubmit(false);
    setPendingAutoSubmitReason(null);
    setShowModal(false);

    // Exit fullscreen if currently in fullscreen mode
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }

    // Go back to the quiz list
    // handleBack();
  };

  const handleBackToQuizzesContent = () => {
    if (quizInProgress) {
      setShowBackModal(true);
      return;
    }

    handleBackToQuizzes();
  };

  const enterFullScreen = () => {
    const elem = document.documentElement;
    const requestFullScreen =
      elem.requestFullscreen ||
      elem.mozRequestFullScreen ||
      elem.webkitRequestFullscreen ||
      elem.msRequestFullscreen;

    if (requestFullScreen) {
      requestFullScreen.call(elem).catch((error) => {
        setShowModal(true);
      });
    } else {
      setShowModal(true);
    }
  };

  const exitFullScreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  };

  // Unified cheat event handler (fullscreen exit / tab switch / ESC)
  const handleCheatEvent = (reason = "focus_violation") => {
    if (!quizInProgress || !activeQuiz?.isWarning) return;
    if (alertCount < warningLimit) {
      // Issue a warning (counts from 1..warningLimit)
      setAlertCount((prev) => prev + 1);
      setShowModal(true);
    } else {
      // Exceeded allowed warnings: show confirmation and submit after user acknowledges
      setAlertCount((prev) => prev + 1); // move to warningLimit+1
      setPendingAutoSubmit(true);
      setPendingAutoSubmitReason(reason);
      setShowModal(true);
    }
  };

  // const handleFullScreenChange = () => {
  //   if (!document.fullscreenElement) {
  //     handleCheatEvent("fullscreen_exit");
  //   }
  // };

  // useEffect(() => {
  //   if (!activeQuiz?.isWarning) return; // no listeners if warnings disabled
  //   document.addEventListener("fullscreenchange", handleFullScreenChange);
  //   document.addEventListener("webkitfullscreenchange", handleFullScreenChange);
  //   document.addEventListener("mozfullscreenchange", handleFullScreenChange);
  //   document.addEventListener("MSFullscreenChange", handleFullScreenChange);
  //   return () => {
  //     document.removeEventListener("fullscreenchange", handleFullScreenChange);
  //     document.removeEventListener("webkitfullscreenchange", handleFullScreenChange);
  //     document.removeEventListener("mozfullscreenchange", handleFullScreenChange);
  //     document.removeEventListener("MSFullscreenChange", handleFullScreenChange);
  //   };
  // }, [alertCount, quizInProgress, activeQuiz?.isWarning, warningLimit]);

  const lastEventRef = useRef(0);

  // Anti-Cheat Listener
  useEffect(() => {
    if (!quizInProgress || !activeQuiz?.isWarning) return;

    const handleCheat = (type) => {
      const now = Date.now();
      if (now - lastEventRef.current < 300) return;
      lastEventRef.current = now;

      handleCheatEvent(type);
    };

    const onBlur = () => handleCheat("window_blur");
    const onPageHide = () => handleCheat("tab_switch");

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleCheat("tab_switch"); // Treat hiding the tab/page as a potential switch
      }
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        // Only trigger if currently in fullscreen and warnings are active
        if (
          document.fullscreenElement &&
          quizInProgress &&
          activeQuiz?.isWarning
        ) {
          handleCheat("esc_key");
        }
      }
    };

    const onFullscreenChange = () => {
      if (
        !document.fullscreenElement &&
        quizInProgress &&
        activeQuiz?.isWarning
      ) {
        handleCheatEvent("fullscreen_exit");
      }
    };

    window.addEventListener("blur", onBlur);
    window.addEventListener("pagehide", onPageHide);
    // Add visibilitychange listener
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("mozfullscreenchange", onFullscreenChange);
    document.addEventListener("MSFullscreenChange", onFullscreenChange);

    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      document.removeEventListener("mozfullscreenchange", onFullscreenChange);
      document.removeEventListener("MSFullscreenChange", onFullscreenChange);
    };
  }, [alertCount, warningLimit, quizInProgress, activeQuiz?.isWarning]);

  // Check if a question has been answered
  const isNextButtonDisabled = () => {
    const currentQuestion = combinedQuestions[currentQuestionIndex];
    if (!currentQuestion) return true;

    const selected = selectedAnswers[currentQuestion.id];
    const correctOptions = currentQuestion.QuizOptions?.filter(opt => opt.is_correct) || [];
    const isMultiSelect = correctOptions.length > 1;

    // Handle best_option questions
    if (currentQuestion.type === "best_option") {
      let blankedWords = currentQuestion.blanked_words;
      if (typeof blankedWords === 'string') {
        try {
          blankedWords = JSON.parse(blankedWords);
        } catch (error) {
          console.error('Error parsing blanked_words JSON:', error);
          blankedWords = [];
        }
      }
      // Check if all blanks are filled
      for (let i = 0; i < blankedWords.length; i++) {
        const key = `${currentQuestion.id}_${i}`;
        if (!selectedAnswers[key]) {
          return true; // Disable if any blank is empty
        }
      }
      return false; // Enable if all blanks are filled
    }

    if (currentQuestion.type === "complete_sentence") {
      const numBlanks = currentQuestion.correct_word?.length || 0;
      let allFilled = true;
      for (let blankIndex = 0; blankIndex < numBlanks; blankIndex++) {
        const correctWord = currentQuestion.correct_word[blankIndex] || "";
        const hint = currentQuestion.hint[blankIndex] || "";
        for (let letterIndex = hint.length; letterIndex < correctWord.length; letterIndex++) {
          const key = `${currentQuestion.id}_${blankIndex}_${letterIndex}`;
          if (!selectedAnswers[key] || selectedAnswers[key].trim() === "") {
            allFilled = false;
            break;
          }
        }
        if (!allFilled) break;
      }
      return !allFilled; // Return true (disabled) if not all filled, false (enabled) if all filled
    }

    if (currentQuestion.type === "real_word") {
      const words = currentQuestion.words || [];
      for (let i = 0; i < words.length; i++) {
        const key = `${currentQuestion.id}_word_${i}`;
        if (!selectedAnswers[key]) {
          return true;
        }
      }
      return false;
    }

    // Handle arrange_order questions
    if (currentQuestion.type === "arrange_order") {
      return !selected || selected.length === 0;
    }

    // Handle summary_passage questions - never disable next button for summary passages
    if (currentQuestion.type === "summary_passage") {
      return false; // Always allow navigation from summary passages
    }

    if (currentQuestion.type === "video_pause" || currentQuestion.type === "audio_pause") {
      return false; // Child component controls its own button state
    }

    if (currentQuestion.type === "speaking") {
      return !selected || !selected?.audioBlob
    }

    // Handle multi-select questions
    if (isMultiSelect) {
      return !selected || selected.length === 0;
    }

    // Default: single-select or other types
    return !selected;
  };

  const CircularCountdown = ({ timeInSeconds, totalSeconds }) => {
    const radius = 30;
    const stroke = 6;
    const normalizedRadius = radius - stroke * 0.5;
    const circumference = normalizedRadius * 2 * Math.PI;
    const progress =
      circumference - (timeInSeconds / totalSeconds) * circumference;

    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    const displayTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    return (
      <div className="relative w-16 h-16 sm:w-20 sm:h-20">
        <svg height="100%" width="100%">
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx="50%"
            cy="50%"
          />
          <circle
            stroke="#3b82f6"
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={progress}
            r={normalizedRadius}
            cx="50%"
            cy="50%"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-blue-700 font-bold text-xs sm:text-sm">
          {displayTime}
        </div>
      </div>
    );
  };

  // Add this component to show attempt status

  if (showInstructions) {
    return (
      <div className="w-full bg-white min-h-[calc(100vh-9.5vh)] overflow-y-auto">
        <QuizResultPopup
          isOpen={showResults}
          onClose={handleCloseResultPopup}
          score={score}
          isPassed={hasPassedQuiz}
          totalQuestions={totalQuestions}
          correctAnswers={correctAnswers}
          totalMarks={totalMarks}
          earnedMarks={earnedMarks}
          attemptsAllowed={activeQuiz.max_attempts || "∞"}
          attemptsUsed={triedAttempts}
          onRetry={handleBackToQuizzes}
          canAttempt={canAttempt}
          attemptsExhausted={attemptsExhausted}
          activeQuiz={activeQuiz}
          onContinueLearning={handleContinueLearning}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full h-full"
        >
          {/* Mobile & Tablet: Single Column Stack */}
          <div className="md:hidden">
            <div className="p-4 pb-20 space-y-4">
              {/* Header - Mobile */}
              <div className="mb-2">
                <h3 className="text-xl font-bold text-megistic">Quiz Details</h3>
                <p className="text-darkSand text-sm mt-1">
                  Review parameters before starting
                </p>
              </div>

              {/* Stats Grid - Mobile Optimized */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Attempts */}
                <div className="bg-white p-3 rounded-lg border border-darkSand/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-lightGreen flex items-center justify-center text-primary flex-shrink-0">
                      <FaHistory className="text-lg" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-semibold text-darkSand/60 uppercase block truncate">ATTEMPTS</span>
                      <div className="text-sm font-bold text-megistic truncate">
                        {
                          triedAttempts > activeQuiz.max_attempts
                            ? triedAttempts % activeQuiz.max_attempts
                            : triedAttempts
                        }<span className="text-xs font-medium text-darkSand/60 ml-1">/ {activeQuiz.max_attempts || 10}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time Limit */}
                <div className="bg-white p-3 rounded-lg border border-darkSand/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-lightGreen flex items-center justify-center text-primary flex-shrink-0">
                      <FaClock className="text-lg" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-semibold text-darkSand/60 uppercase block truncate">TIME LIMIT</span>
                      <div className="text-sm font-bold text-megistic truncate">
                        {activeQuiz.duration_minutes}<span className="text-xs font-medium text-darkSand/60 ml-1">mins</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passing Score */}
                <div className="bg-white p-3 rounded-lg border border-darkSand/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-lightGreen flex items-center justify-center text-primary flex-shrink-0">
                      <FaTrophy className="text-lg" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-semibold text-darkSand/60 uppercase block truncate">PASS SCORE</span>
                      <div className="text-sm font-bold text-megistic truncate">
                        {activeQuiz.passing_score || 70}<span className="text-xs font-medium text-darkSand/60 ml-1">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Questions */}
                <div className="bg-white p-3 rounded-lg border border-darkSand/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-lightGreen flex items-center justify-center text-primary flex-shrink-0">
                      <FaClipboardList className="text-lg" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-semibold text-darkSand/60 uppercase block truncate">QUESTIONS</span>
                      <div className="text-sm font-bold text-megistic truncate">
                        {activeQuiz.total_active_questions}<span className="text-xs font-medium text-darkSand/60 ml-1">items</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Action - Mobile */}
              <div className="space-y-3 mb-4">
                <div className={`w-full flex items-start p-3 rounded-lg border text-sm ${!canAttempt && nextAttemptTime
                  ? 'bg-experience4/10 border-experience4/20 text-experience4'
                  : 'bg-lightGreen/30 border-primary/20 text-primary'
                  }`}>
                  {!canAttempt && nextAttemptTime ? (
                    <>
                      <FaClock className="text-lg opacity-80 flex-shrink-0 mt-0.5 mr-3" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">Next attempt:</p>
                        <p className="text-xs mt-1 break-words">
                          {typeof nextAttemptTime === 'string'
                            ? nextAttemptTime
                            : nextAttemptTime?.toLocaleString?.([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="text-lg opacity-80 flex-shrink-0 mt-0.5 mr-3" />
                      <p className="flex-1">You are eligible to start this assessment</p>
                    </>
                  )}
                </div>

                <button
                  onClick={handleBeginQuiz}
                  disabled={!canAttempt}
                  className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-bold uppercase ${canAttempt
                    ? "bg-leafGreen text-white"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  START ASSESSMENT
                  <FaArrowRight fontSize={12} />
                </button>

                {shouldShowContinueLearning && (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-sm font-bold text-slate-900 mb-1">Ready to continue?</h3>
                      <p className="text-xs text-slate-500">
                        {continueLearningMessage}
                      </p>
                    </div>
                    <button
                      onClick={handleContinueLearning}
                      className="flex items-center justify-center gap-2 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-sm w-full sm:w-auto flex-shrink-0 bg-primary text-white hover:bg-primary/90 active:scale-95"
                    >
                      <FaPlayCircle className="w-4 h-4" />
                      Continue Learning
                      <FaArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Instructions - Mobile */}
              <div className="bg-sand/20 p-4 rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-bold text-megistic">Instructions</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <FaCheckCircle className="text-white text-[8px]" />
                    </div>
                    <p className="text-darkSand text-xs leading-relaxed flex-1">
                      This assessment is <span className="font-semibold">{activeQuiz.isQuizCompulsory === 1 ? 'mandatory' : 'optional'}</span>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <FaCheckCircle className="text-white text-[8px]" />
                    </div>
                    <p className="text-darkSand text-xs leading-relaxed flex-1">
                      Quiz is <span className="font-semibold">auto-submit</span> when timer reaches zero.
                    </p>
                  </div>
                  {activeQuiz?.isWarning && (
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <FaCheckCircle className="text-white text-[8px]" />
                      </div>
                      <p className="text-darkSand text-xs leading-relaxed flex-1">
                        Focus mode enabled. Auto-submit after {warningLimit} violations.
                      </p>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <FaCheckCircle className="text-white text-[8px]" />
                    </div>
                    <p className="text-darkSand text-xs leading-relaxed flex-1">
                      {(activeQuiz.attempts_gap || 0) === 0 ? 'No time gap' : `${activeQuiz.attempts_gap}-hour gap`} between attempts.
                      Attempts reset every {activeQuiz.attempts_renew_days || 0} days.
                    </p>
                  </div>
                </div>
              </div>

              {/* Attempt History - Mobile */}
              <div className="bg-sand p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-megistic">Attempt History</h3>
                  {quizCompletionHistory.length > 3 && (
                    <button
                      onClick={() => setShowAllAttemptsModal(true)}
                      className="text-primary text-xs font-semibold underline"
                    >
                      View All
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {quizCompletionHistory.length > 0 ? (
                    quizCompletionHistory.slice(0, 3).map((att, i) => {
                      const attTime = parseDateValue(att.lastAttemptTime || att.updatedAt || att.createdAt);
                      const isPassed = att.status === 'Passed';
                      return (
                        <div key={i} className="p-3 rounded-lg border border-darkSand/10 bg-white">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isPassed ? 'bg-lightGreen text-primary' : 'bg-experience4/10 text-experience4'
                                }`}>
                                <FaHistory className="text-xs" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-megistic block truncate">Attempt {quizCompletionHistory.length - i}</span>
                                <span className="text-[9px] text-darkSand/40 block truncate">
                                  {attTime ? attTime.toLocaleDateString() : '--'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <span className={`text-xs font-bold block ${isPassed ? 'text-primary' : 'text-experience4'
                                }`}>
                                {att.obtainedMarks ?? 0}/{att.totalMarks ?? totalQuestionCount}
                              </span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${isPassed ? 'bg-lightGreen text-primary' : 'bg-experience4/10 text-experience4'
                                }`}>
                                {isPassed ? 'PASS' : 'FAIL'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 bg-white/50 rounded-lg border border-dashed border-darkSand/20">
                      <p className="text-xs text-darkSand/40 italic">No attempts recorded yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tablet: Adjusted Layout (641px - 1024px) */}
          <div className="hidden md:block lg:hidden">
            <div className="p-6 pb-24 space-y-6">
              {/* Tablet Header */}
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-megistic">Quiz Details</h3>
                <p className="text-darkSand font-medium">Review parameters before starting your assessment.</p>
              </div>

              {/* Tablet Stats Grid - 4 columns */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  {
                    icon: FaHistory, label: "ATTEMPTS", value: `${triedAttempts > activeQuiz.max_attempts
                      ? triedAttempts % activeQuiz.max_attempts
                      : triedAttempts
                      }/${activeQuiz.max_attempts || 10}`
                  },
                  { icon: FaClock, label: "TIME LIMIT", value: `${activeQuiz.duration_minutes} mins` },
                  { icon: FaTrophy, label: "PASS SCORE", value: `${activeQuiz.passing_score || 70}%` },
                  { icon: FaClipboardList, label: "QUESTIONS", value: `${activeQuiz.total_active_questions} items` }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-darkSand/10">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-lightGreen flex items-center justify-center text-primary mb-3 mx-auto">
                      <stat.icon className="text-lg sm:text-xl" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold text-darkSand/60 uppercase tracking-wider block text-center mb-1">
                      {stat.label}
                    </span>
                    <div className="text-base sm:text-lg font-bold text-megistic text-center break-words">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tablet Status & Action */}
              <div className="space-y-4 mb-6">
                <div className={`w-full flex items-center p-4 rounded-xl border ${!canAttempt && nextAttemptTime
                  ? 'bg-experience4/10 border-experience4/20 text-experience4'
                  : 'bg-lightGreen border-primary/20 text-primary'
                  }`}>
                  {!canAttempt && nextAttemptTime ? (
                    <>
                      <FaClock className="text-xl opacity-80 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">Next attempt available at:</p>
                        <p className="text-sm mt-1 break-words">
                          {typeof nextAttemptTime === 'string'
                            ? nextAttemptTime
                            : nextAttemptTime?.toLocaleString?.([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="text-xl opacity-80 mr-3 flex-shrink-0" />
                      <p className="text-forestGreen">You are currently eligible to start this assessment.</p>
                    </>
                  )}
                </div>

                <button
                  onClick={handleBeginQuiz}
                  disabled={!canAttempt}
                  className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold uppercase ${canAttempt
                    ? "bg-leafGreen text-white"
                    : "bg-sand text-darkSand/40 cursor-not-allowed"
                    }`}
                >
                  START ASSESSMENT
                  <FaArrowRight fontSize={14} />
                </button>

                {shouldShowContinueLearning && (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-sm font-bold text-slate-900 mb-1">Ready to continue?</h3>
                      <p className="text-xs text-slate-500">
                        {continueLearningMessage}
                      </p>
                    </div>
                    <button
                      onClick={handleContinueLearning}
                      className="flex items-center justify-center gap-2 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-sm w-full sm:w-auto flex-shrink-0 bg-primary text-white hover:bg-primary/90 active:scale-95"
                    >
                      <FaPlayCircle className="w-4 h-4" />
                      Continue Learning
                      <FaArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Tablet Two Columns for Instructions & History */}
              <div className="grid grid-cols-2 gap-6">
                {/* Instructions */}
                <div className="bg-sand/30 p-5 rounded-xl">
                  <h3 className="text-xl font-bold text-megistic mb-4">Instructions</h3>
                  <div className="space-y-4">
                    {[
                      `Assessment is ${activeQuiz.isQuizCompulsory === 1 ? 'mandatory' : 'optional'} for all staff`,
                      "Quiz auto-submits when timer reaches zero",
                      ...(activeQuiz?.isWarning ? [`Focus mode enabled. Auto-submit after ${warningLimit} violations`] : []),
                      `${(activeQuiz.attempts_gap || 0) === 0 ? 'No time gap' : `${activeQuiz.attempts_gap}-hour gap`} between attempts. Resets every ${activeQuiz.attempts_renew_days || 0} days`
                    ].map((text, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="mt-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <FaCheckCircle className="text-white text-[8px]" />
                        </div>
                        <p className="text-darkSand text-xs leading-relaxed flex-1">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* History */}
                <div className="bg-sand p-5 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-megistic">Attempt History</h3>
                    {quizCompletionHistory.length > 3 && (
                      <button
                        onClick={() => setShowAllAttemptsModal(true)}
                        className="text-primary text-xs font-bold underline"
                      >
                        View All
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                    {quizCompletionHistory.length > 0 ? (
                      quizCompletionHistory.slice(0, 3).map((att, i) => {
                        const attTime = parseDateValue(att.lastAttemptTime || att.updatedAt || att.createdAt);
                        const isPassed = att.status === 'Passed';
                        return (
                          <div key={i} className="p-3 rounded-lg border border-darkSand/10 bg-white">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isPassed ? 'bg-lightGreen text-primary' : 'bg-experience4/10 text-experience4'
                                  }`}>
                                  <FaHistory className="text-xs sm:text-sm" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs sm:text-sm font-bold text-megistic block truncate">Attempt {quizCompletionHistory.length - i}</span>
                                  <span className="text-[9px] sm:text-[10px] text-darkSand/40 block truncate">
                                    {attTime ? attTime.toLocaleDateString() : '--'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-2">
                                <span className={`text-xs sm:text-sm font-bold block ${isPassed ? 'text-primary' : 'text-experience4'
                                  }`}>
                                  {att.obtainedMarks ?? 0}/{att.totalMarks ?? totalQuestionCount}
                                </span>
                                <span className={`text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded ${isPassed ? 'bg-lightGreen text-primary' : 'bg-experience4/10 text-experience4'
                                  }`}>
                                  {isPassed ? 'PASS' : 'FAIL'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 bg-white/50 rounded-lg border border-dashed border-darkSand/20">
                        <p className="text-xs text-darkSand/40 italic">No attempts recorded yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Original Two-Column Layout (UNCHANGED) */}
          <div className="hidden lg:grid lg:grid-cols-2 items-stretch h-full overflow-hidden">
            {/* Left Column - Quiz Details */}
            <div className="h-full flex flex-col overflow-hidden md:border-r md:border-darkSand/10 p-6">
              <div className="mb-8">
                <div className="flex flex-col gap-2 mb-10">
                  <h3 className="text-2xl font-bold text-megistic">Quiz Details </h3>
                  <p className="text-darkSand font-medium">Please review the parameters before starting your assessment.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-8 mb-10">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-lightGreen flex items-center justify-center text-primary">
                      <FaHistory className="text-2xl" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-darkSand/60 uppercase tracking-widest">ATTEMPTS</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-megistic">{
                          triedAttempts > activeQuiz.max_attempts
                            ? triedAttempts % activeQuiz.max_attempts
                            : triedAttempts
                        }</span>
                        <span className="text-lg font-medium text-darkSand/60">/ {activeQuiz.max_attempts || 10}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-lightGreen flex items-center justify-center text-primary">
                      <FaClock className="text-2xl" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-darkSand/60 uppercase tracking-widest">TIME LIMIT</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-megistic">{activeQuiz.duration_minutes}</span>
                        <span className="text-lg font-medium text-darkSand/60">mins</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-lightGreen flex items-center justify-center text-primary">
                      <FaTrophy className="text-2xl" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-darkSand/60 uppercase tracking-widest">PASSING SCORE</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-megistic">{activeQuiz.passing_score || 70}</span>
                        <span className="text-lg font-medium text-darkSand/60">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-lightGreen flex items-center justify-center text-primary">
                      <FaClipboardList className="text-2xl" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-darkSand/60 uppercase tracking-widest">QUESTIONS</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-megistic">{activeQuiz.total_active_questions}</span>
                        <span className="text-lg font-medium text-darkSand/60">items</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-5 mb-8">
                  <div className={`w-full flex items-center px-4 py-4 rounded-xl border ${!canAttempt && nextAttemptTime
                    ? 'bg-experience4/10 border-experience4/20 text-experience4'
                    : 'bg-lightGreen border-primary/20 text-primary'
                    }`}>
                    {!canAttempt && nextAttemptTime ? (
                      <div className="flex items-center gap-3">
                        <FaClock className="text-xl opacity-80" />
                        <p className="text-sm font-semibold">Your next attempt will be available at: <span className="font-bold underline decoration-experience4 ml-1">
                          {typeof nextAttemptTime === 'string'
                            ? nextAttemptTime
                            : nextAttemptTime?.toLocaleString?.([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span></p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <FaCheckCircle className="text-xl opacity-80" />
                        <p className="text-sm text-forestGreen">You are currently eligible to start this assessment.</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleBeginQuiz}
                    disabled={!canAttempt}
                    className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-extrabold tracking-widest uppercase transition-all transform active:scale-[0.99] ${canAttempt
                      ? "bg-leafGreen text-white"
                      : "bg-sand text-darkSand/40 cursor-not-allowed border border-darkSand/10"
                      }`}
                  >
                    START ASSESSMENT
                    <FaArrowRight fontSize={14} />
                  </button>

                  {shouldShowContinueLearning && (
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-sm font-bold text-slate-900 mb-1">Ready to continue?</h3>
                        <p className="text-xs text-slate-500">
                          {continueLearningMessage}
                        </p>
                      </div>
                      <button
                        onClick={handleContinueLearning}
                        className="flex items-center justify-center gap-2 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-sm w-full sm:w-auto flex-shrink-0 bg-primary text-white hover:bg-primary/90 active:scale-95"
                      >
                        <FaPlayCircle className="w-4 h-4" />
                        Continue Learning
                        <FaArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Instructions & History */}
            <div className="flex flex-col bg-sand p-6">
              <div className="mb-8">
                <div className="flex items-center gap-3 text-megistic mb-4">
                  <h3 className="text-2xl font-bold tracking-tight">Instructions</h3>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <FaCheckCircle className="text-white text-[10px]" />
                    </div>
                    <p className="text-darkSand text-sm leading-relaxed">
                      This assessment is <span className="font-bold">{activeQuiz.isQuizCompulsory === 1 ? 'mandatory' : 'optional'}</span> for all staff members.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <FaCheckCircle className="text-white text-[10px]" />
                    </div>
                    <p className="text-darkSand text-sm leading-relaxed">
                      The quiz is <span className="font-bold">auto-submit</span>. If the timer reaches zero, your progress will be automatically saved.
                    </p>
                  </div>
                  {activeQuiz?.isWarning && (
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <FaCheckCircle className="text-white text-[10px]" />
                      </div>
                      <p className="text-darkSand text-sm leading-relaxed">
                        Focus mode is enabled. Quiz will auto-submit after {warningLimit} focus violations.
                      </p>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <FaCheckCircle className="text-white text-[10px]" />
                    </div>
                    <p className="text-darkSand text-sm leading-relaxed">
                      {(activeQuiz.attempts_gap || 0) === 0 ? (
                        <span>There is <span className="font-bold">no time gap</span> between attempts.</span>
                      ) : (
                        <span>Attempts have a mandatory <span className="font-bold">{activeQuiz.attempts_gap}-hour</span> gap.</span>
                      )}
                      {' '}Your attempt limit resets every <span className="font-bold">{activeQuiz.attempts_renew_days || 0} days</span>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col flex-1 overflow-hidden min-h-0">
                <div className="flex items-center justify-between mb-6 mr-4">
                  <h3 className="text-2xl font-bold text-megistic">Attempt History</h3>
                  {quizCompletionHistory.length > 3 && (
                    <button
                      onClick={() => setShowAllAttemptsModal(true)}
                      className="text-primary text-xs font-bold underline cursor-pointer select-none hover:text-leafGreen transition-colors"
                    >
                      View All
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {quizCompletionHistory.length > 0 ? (
                    quizCompletionHistory.slice(0, 3).map((att, i) => {
                      const attTime = parseDateValue(att.lastAttemptTime || att.updatedAt || att.createdAt);
                      const isPassed = att.status === 'Passed';
                      return (
                        <div key={i} className="p-4 rounded-xl border border-darkSand/10 bg-white/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isPassed ? 'bg-lightGreen text-primary' : 'bg-experience4/10 text-experience4'
                                }`}>
                                <FaHistory className="text-sm" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-megistic">Attempt {quizCompletionHistory.length - i}</span>
                                <span className="text-[10px] text-darkSand/40 font-medium tracking-tight">
                                  {attTime ? attTime.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '--'}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              <span className={`text-sm font-black leading-none ${isPassed ? 'text-primary' : 'text-experience4'
                                }`}>
                                {att.obtainedMarks ?? 0}/{att.totalMarks ?? totalQuestionCount}
                                <span className="text-[10px] ml-1 opacity-80">
                                  ({Math.round(((att.obtainedMarks ?? 0) / ((att.totalMarks ?? totalQuestionCount) || 1)) * 100)}%)
                                </span>
                              </span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${isPassed
                                ? 'bg-lightGreen text-primary border border-primary/20'
                                : 'bg-experience4/10 text-experience4 border border-experience4/20'
                                }`}>
                                {isPassed ? 'PASS' : 'FAIL'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 bg-white/50 rounded-xl border border-dashed border-darkSand/20">
                      <p className="text-xs text-darkSand/40 italic font-medium">No attempts recorded yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* All Attempts Modal */}
          {showAllAttemptsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden max-h-[80vh] flex flex-col mx-4"
              >
                <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-megistic truncate">All Attempts</h3>
                    <p className="text-xs text-darkSand/60 mt-1 truncate">Full history for this assessment</p>
                  </div>
                  <button
                    onClick={() => setShowAllAttemptsModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
                  >
                    <FaTimesCircle className="text-lg sm:text-xl" />
                  </button>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3">
                  {quizCompletionHistory.map((att, i) => {
                    const attTime = parseDateValue(att.lastAttemptTime || att.updatedAt || att.createdAt);
                    const isPassed = att.status === 'Passed';
                    return (
                      <div key={i} className="p-3 sm:p-4 rounded-xl border border-darkSand/10 bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${isPassed ? 'bg-lightGreen text-primary' : 'bg-experience4/10 text-experience4'
                              }`}>
                              <FaHistory className="text-xs sm:text-sm" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-xs sm:text-sm font-bold text-megistic block truncate">Attempt {quizCompletionHistory.length - i}</span>
                              <span className="text-[9px] sm:text-[10px] text-darkSand/40 font-medium tracking-tight block truncate">
                                {attTime ? attTime.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '--'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <span className={`text-xs sm:text-sm font-black leading-none block ${isPassed ? 'text-primary' : 'text-experience4'
                              }`}>
                              {att.obtainedMarks ?? 0}/{att.totalMarks ?? totalQuestionCount}
                            </span>
                            <span className={`text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider inline-block ${isPassed
                              ? 'bg-lightGreen text-primary border border-primary/20'
                              : 'bg-experience4/10 text-experience4 border border-experience4/20'
                              }`}>
                              {isPassed ? 'PASS' : 'FAIL'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // Render quiz questions
  const currentQuestion = combinedQuestions[currentQuestionIndex];
  const progressPercentage =
    ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="transition-all duration-500 px-4 sm:px-6 md:px-8 lg:px-16 mt-2 sm:mt-6 lg:mt-10 quiz-content-container">
      {/* Question Content */}
      {currentQuestion && (
        <div className="flex flex-col items-start select-none w-full">
          {currentQuestion.is_text_based && (
            <div className="w-full max-w-8xl mb-6">
              <div className="max-h-96 overflow-y-auto p-4 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-slate-900 font-medium text-base sm:text-lg prose leading-relaxed text-left">
                  {currentQuestion.text_based_text}
                </p>
              </div>
            </div>
          )}

          <div className="transition-all duration-300 w-full max-w-8xl">
            <div className="flex flex-col items-start mb-4 w-full">
              {/* Container for question and marks */}
              <div className="flex items-start w-full relative">
                {/* Centered question number and text - using flex-col to allow text wrapping */}
                <div className="flex flex-col items-start w-full pr-20 sm:pr-24 md:pr-28">
                  {/* Question number and text container */}
                  <div className="flex items-start w-full">
                    <h3 className="text-slate-900 font-bold text-base sm:text-lg md:text-xl leading-relaxed text-left">
                      <span className="mr-2">{currentQuestion.sequenceNo}.</span>
                      {currentQuestion.question_type !== "complete_sentence" && currentQuestion.type !== "fill_in_the_blank" && (
                        <span className={`font-medium text-sm sm:text-base md:text-lg prose ${currentQuestion.type === "drag_drop" || currentQuestion.type === "best_option" ? "text-black" : "text-slate-800"
                          }`}>
                          {currentQuestion.type === "drag_drop"
                            ? "Drag and Drop the Correct Answer"
                            : currentQuestion.type === "best_option"
                              ? "Select the best option for each missing word."
                              : (currentQuestion.question_text || currentQuestion.arrangeorder_prompt)}
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                {/* Absolute-positioned info icon and marks on the far right */}
                <div className="absolute right-0 top-0 flex items-center gap-1 sm:gap-2">
                  {currentQuestion.type === "drag_drop" && (
                    <button
                      onClick={() => setShowDragDropInstructions(true)}
                      className="text-gray-500 hover:text-blue-600 transition-colors p-1.5 sm:p-2 rounded-full hover:bg-blue-50"
                      title="View Instructions"
                    >
                      <FaInfoCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                  )}
                  {currentQuestion.type === "arrange_order" && (
                    <button
                      onClick={() => setShowArrangeOrderInstructions(true)}
                      className="text-gray-500 hover:text-blue-600 transition-colors p-1.5 sm:p-2 rounded-full hover:bg-blue-50"
                      title="View Instructions"
                    >
                      <FaInfoCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                  )}
                  <span className="text-xs sm:text-sm text-blue-700 font-semibold bg-blue-50 px-2 sm:px-3 py-1 rounded-full border border-blue-100 whitespace-nowrap">
                    Marks: {currentQuestion.marks || 1}
                  </span>
                </div>
              </div>
            </div>

            {/* Question Image (if any) */}
            {currentQuestion.question_img && (
              <div className="mt-4 sm:mt-6 flex justify-center">
                <img
                  src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${currentQuestion.question_img || "/placeholder.png"}`}
                  alt="Question illustration"
                  className="rounded-lg shadow-md w-full max-w-xs mx-auto object-cover"
                />
              </div>
            )}

            {/* Media (optional) */}
            {!["video_pause", "audio_pause", "audio_script", "video_script"].includes(currentQuestion.type) && (
              <div className="mt-4 sm:mt-6">
                <QuestionMedia
                  audioUrl={currentQuestion.audio_url || currentQuestion.audioUrl}
                  videoUrl={currentQuestion.video_url || currentQuestion.videoUrl}
                />
              </div>
            )}

            {/* Answer Options */}
            <div className="space-y-4 mt-4 sm:mt-6">
              {currentQuestion.type === "summary_passage" ? (
                <div className="space-y-3 sm:space-y-4 md:space-y-4 relative">
                  <p className="text-slate-700 mb-1 sm:mb-2 font-medium text-xs sm:text-sm md:text-base">
                    Write a summary for the given passage:
                  </p>

                  {/* Textarea with circular countdown */}
                  <div className="relative">
                    <textarea
                      className={`p-3 sm:p-4 md:p-4 border rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 outline-none shadow-sm min-h-[150px] xs:min-h-[200px] sm:min-h-[250px] md:min-h-[300px] text-xs sm:text-sm md:text-base text-slate-800 ${summaryTimeRemaining === 0
                        ? 'bg-gray-100 cursor-not-allowed border-gray-300'
                        : 'bg-white border-slate-300'
                        }`}
                      value={selectedAnswers[currentQuestion.id]?.userPassage || ""}
                      onChange={(e) => {
                        if (summaryTimeRemaining > 0) {
                          handleAnswerSelect(currentQuestion.id, e.target.value);
                        }
                      }}
                      placeholder={
                        summaryTimeRemaining === 0
                          ? "Time has expired - submission locked"
                          : "Write your summary here..."
                      }
                      disabled={summaryTimeRemaining === 0}
                      style={{
                        WebkitAppearance: 'none', // Fix for iOS rounding
                        WebkitBorderRadius: '12px', // Ensure consistent border radius on iOS
                      }}
                    />

                    {/* Circular countdown positioned at top-right - adjusted for mobile */}
                    <div className="absolute -top-1 -right-1 xs:-top-2 xs:-right-2 sm:-top-2 sm:-right-2 md:-top-2 md:-right-2">
                      <CircularCountdown
                        timeInSeconds={summaryTimeRemaining}
                        totalSeconds={(currentQuestion.time_limit || 1)}
                      />
                    </div>
                  </div>

                  {/* Time message with improved mobile layout */}
                  <div className={`flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs sm:text-sm md:text-sm ${summaryTimeRemaining > 0 ? 'text-amber-800' : 'text-red-600'
                    }`}>
                    {summaryTimeRemaining > 0 ? (
                      <>
                        <FaClock className="text-amber-500 flex-shrink-0 text-xs sm:text-sm" />
                        <span>
                          You have <strong>{summaryTimeRemaining}</strong> second{summaryTimeRemaining !== 1 ? 's' : ''} remaining
                        </span>
                      </>
                    ) : (
                      <>
                        <FaExclamationTriangle className="text-red-500 flex-shrink-0 text-xs sm:text-sm" />
                        <span className="font-bold">Time's up! Submission locked</span>
                      </>
                    )}
                  </div>

                  {/* Instructions Button - adjusted for mobile */}
                  <div className="flex justify-center mt-3 sm:mt-4 md:mt-6">
                    <button
                      onClick={() => setShowSummaryInstructions(true)}
                      className="px-4 sm:px-4 md:px-4 py-2 sm:py-2 md:py-2 text-xs sm:text-sm md:text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition active:bg-blue-800 touch-manipulation"
                      style={{
                        minHeight: '36px', // Better touch target on mobile
                        touchAction: 'manipulation', // Improve touch responsiveness
                      }}
                    >
                      View Instructions
                    </button>
                  </div>

                  {/* Instruction Modal */}
                  <QuestionInstructionModal
                    type="Summarize"
                    isOpen={showSummaryInstructions}
                    onClose={() => setShowSummaryInstructions(false)}
                  />
                </div>
              ) : currentQuestion.type === "fill_in_the_blank" ? (
                <div className="space-y-4 text-base sm:text-lg text-slate-800">
                  <p className="prose leading-relaxed text-justify">
                    {currentQuestion.question_text.split("_______").map((part, index, arr) => (
                      <React.Fragment key={index}>
                        {part}
                        {index < arr.length - 1 && (
                          <input
                            type="text"
                            className="border-b border-violet-500 focus:outline-none bg-transparent text-center mx-1 align-baseline text-sm sm:text-base"
                            style={{
                              display: "inline-block",
                              width: `${Math.max(
                                40,
                                (selectedAnswers[currentQuestion.id]?.length || 0) * 9
                              )}px`,
                              transition: "width 0.2s ease",
                              minWidth: "40px",
                            }}
                            value={selectedAnswers[currentQuestion.id] || ""}
                            onChange={(e) =>
                              handleAnswerSelect(currentQuestion.id, e.target.value)
                            }
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </p>
                </div>
              ) : currentQuestion.type === "multiple_choice" ? (
                <MCQComponent
                  question={currentQuestion}
                  selectedAnswers={selectedAnswers}
                  handleAnswerSelect={handleAnswerSelect}
                  isMultiSelect={
                    (currentQuestion.QuizOptions?.filter((opt) => opt.is_correct) || []).length > 1
                  }
                />
              ) : currentQuestion.type === "true_false" ? (
                <div className="space-y-3">
                  {["True", "False"].map((option) => (
                    <div
                      key={option}
                      className={`p-3 sm:p-4 border rounded-xl cursor-pointer transition-all duration-300 transform hover:translate-x-1 ${selectedAnswers[currentQuestion.id] === option
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      onClick={() =>
                        handleAnswerSelect(currentQuestion.id, option)
                      }
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full border mr-3 sm:mr-4 transition-all duration-300 ${selectedAnswers[currentQuestion.id] === option
                            ? "border-blue-600 bg-blue-600 scale-110"
                            : "border-slate-300"
                            }`}
                        >
                          {selectedAnswers[currentQuestion.id] === option && (
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-scaleIn"></div>
                          )}
                        </div>
                        <span
                          className={`text-sm sm:text-base ${selectedAnswers[currentQuestion.id] === option
                            ? "text-slate-900 font-medium"
                            : "text-slate-700"
                            }`}
                        >
                          {option}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : currentQuestion.type === "audio_script" ? (
                <AudioToScriptQuestion
                  question={currentQuestion}
                  selectedAnswers={selectedAnswers}
                  handleAnswerSelect={handleAnswerSelect}
                />
              ) : currentQuestion.type === "real_word" ? (
                <div className="space-y-4 mt-4 sm:mt-6 md:mt-8 w-full">
                  <p className="text-slate-600 text-xs sm:text-sm md:text-base mb-2 sm:mb-3 md:mb-4">
                    Select the appropriate category for each item listed below.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                    {currentQuestion.words.map((word, index) => {
                      const wordId = `${currentQuestion.id}_word_${index}`;
                      const selectedAnswer = selectedAnswers[wordId];

                      return (
                        <div
                          key={index}
                          className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 md:p-3 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-3 md:gap-4"
                        >
                          {/* Word - Full width on mobile, auto on larger */}
                          <div className="font-medium text-slate-800 text-sm xs:text-base sm:text-lg md:text-xl w-full xs:w-auto">
                            {word}
                          </div>

                          {/* Buttons - Full width on mobile, inline on larger */}
                          <div className="flex w-full xs:w-auto gap-2 md:gap-3 justify-end">
                            {/* Correct Button */}
                            <button
                              onClick={() => handleAnswerSelect(wordId, "yes")}
                              className={`
                  flex-1 xs:flex-none
                  flex items-center justify-center xs:justify-start
                  gap-1 sm:gap-2 md:gap-2.5
                  px-2 xs:px-3 sm:px-4 md:px-5
                  py-1.5 sm:py-2 md:py-2.5
                  rounded-lg transition-all duration-200 
                  text-xs xs:text-sm md:text-base
                  ${selectedAnswer === "yes"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                                }
                `}
                            >
                              <div className={`
                  w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5
                  rounded-full border-2 md:border-2.5 flex items-center justify-center 
                  ${selectedAnswer === "yes" ? "border-emerald-500" : "border-slate-300"}
                `}>
                                {selectedAnswer === "yes" && (
                                  <div className="w-1.5 h-1.5 xs:w-1.75 xs:h-1.75 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full bg-emerald-500"></div>
                                )}
                              </div>
                              <span className="whitespace-nowrap">Correct</span>
                            </button>

                            {/* Fake Button */}
                            <button
                              onClick={() => handleAnswerSelect(wordId, "no")}
                              className={`
                  flex-1 xs:flex-none
                  flex items-center justify-center xs:justify-start
                  gap-1 sm:gap-2 md:gap-2.5
                  px-2 xs:px-3 sm:px-4 md:px-5
                  py-1.5 sm:py-2 md:py-2.5
                  rounded-lg transition-all duration-200 
                  text-xs xs:text-sm md:text-base
                  ${selectedAnswer === "no"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-white text-slate-600 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                                }
                `}
                            >
                              <div className={`
                  w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5
                  rounded-full border-2 md:border-2.5 flex items-center justify-center 
                  ${selectedAnswer === "no" ? "border-rose-500" : "border-slate-300"}
                `}>
                                {selectedAnswer === "no" && (
                                  <div className="w-1.5 h-1.5 xs:w-1.75 xs:h-1.75 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full bg-rose-500"></div>
                                )}
                              </div>
                              <span className="whitespace-nowrap">Fake</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : currentQuestion.type === "complete_sentence" ? (
                <CompleteSentenceQuestion
                  question={currentQuestion}
                  selectedAnswers={selectedAnswers}
                  handleCompleteSentenceInput={handleCompleteSentenceInput}
                />
              ) : currentQuestion.type === "speaking" ? (
                <SpeakingQuestion
                  currentQuestion={currentQuestion}
                  handleAnswerSelect={handleAnswerSelect}
                  selectedAnswers={selectedAnswers}
                  check={speakingCheck}
                  setCheck={setSpeakingCheck}
                />
              ) : currentQuestion.type === "drag_drop" ? (
                <>
                  <DragDropQuestion
                    currentQuestion={currentQuestion}
                    handleAnswerSelect={handleAnswerSelect}
                    selectedAnswers={selectedAnswers}
                  />
                  <QuestionInstructionModal
                    type="Drag and drop"
                    isOpen={showDragDropInstructions}
                    onClose={() => setShowDragDropInstructions(false)}
                  />
                </>
              ) : currentQuestion.type === "best_option" ? (
                <BestOptionQuestion
                  question={currentQuestion}
                  handleAnswerSelect={handleAnswerSelect}
                  selectedAnswers={selectedAnswers}
                />
              ) : currentQuestion.type === "arrange_order" ? (
                <>
                  <ArrangeOrderQuestion
                    question={currentQuestion}
                    selectedAnswers={selectedAnswers}
                    handleAnswerSelect={handleAnswerSelect}
                  />
                  <QuestionInstructionModal
                    type="Arrange order"
                    isOpen={showArrangeOrderInstructions}
                    onClose={() => setShowArrangeOrderInstructions(false)}
                  />
                </>
              ) : currentQuestion.type === "video_script" ? (
                <VideoToScriptQuestion
                  question={currentQuestion}
                  selectedAnswers={selectedAnswers}
                  handleAnswerSelect={handleAnswerSelect}
                />
              ) : currentQuestion.type === "image_script" ? (
                <ImageToScriptQuestion
                  question={currentQuestion}
                  selectedAnswers={selectedAnswers}
                  handleAnswerSelect={handleAnswerSelect}
                />
              ) : currentQuestion.type === "video_pause" ? (
                <VideoPauseComponent
                  ref={videoPauseRef}
                  videoUrl={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${currentQuestion.videoUrl}`}
                  questionIds={currentQuestion.question_ids}
                  currQuestion={currentQuestion}
                  stamps={currentQuestion.stamps}
                  questions={activeQuiz.AllAssignedPauseIds}
                  quizId={quizData.id}
                  selectedAnswers={selectedAnswers}
                  setSelectedAnswers={setSelectedAnswers}
                  onStampStatusChange={setVideoPauseStatus}
                  onScoreInit={(pauseId, totalMarks) =>
                    setPauseScores((prev) => ({ ...prev, [pauseId]: { total: totalMarks, current: totalMarks, deductions: [] } }))
                  }
                  onScoreChange={(pauseId, newScore, deduction) =>
                    setPauseScores((prev) => {
                      const prevEntry = prev[pauseId] || { total: newScore ?? 0, current: newScore ?? 0, deductions: [] };
                      // If a deduction is provided, append only if unique by subId
                      let deductions = prevEntry.deductions || [];
                      if (deduction && !deductions.some(d => d.subId === deduction.subId)) {
                        deductions = [...deductions, deduction];
                      }
                      const baseTotal = prevEntry.total || 0;
                      const computedCurrent = Math.max(0, baseTotal - deductions.reduce((s, d) => s + Number(d.marks || 0), 0));
                      return {
                        ...prev,
                        [pauseId]: {
                          total: baseTotal,
                          current: computedCurrent,
                          deductions,
                        }
                      };
                    })
                  }
                  onComplete={() => {
                    // Move to the next question after video pause is complete
                    handleNextQuestion();
                  }}
                  speakingCheck={speakingCheck}
                  setSpeakingCheck={setSpeakingCheck}
                />
              ) : currentQuestion.type === "audio_pause" ? (
                <AudioPauseComponent
                  ref={audioPauseRef}
                  audioUrl={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${currentQuestion.audioUrl}`}
                  questionIds={currentQuestion.question_ids}
                  currQuestion={currentQuestion}
                  stamps={currentQuestion.stamps}
                  questions={activeQuiz.AllAssignedPauseIds}
                  quizId={quizData.id}
                  selectedAnswers={selectedAnswers}
                  setSelectedAnswers={setSelectedAnswers}
                  onScoreInit={(pauseId, totalMarks) =>
                    setPauseScores((prev) => ({ ...prev, [pauseId]: { total: totalMarks, current: totalMarks, deductions: [] } }))
                  }
                  onScoreChange={(pauseId, newScore, deduction) =>
                    setPauseScores((prev) => {
                      const prevEntry = prev[pauseId] || { total: newScore ?? 0, current: newScore ?? 0, deductions: [] };
                      // If a deduction is provided, append only if unique by subId
                      let deductions = prevEntry.deductions || [];
                      if (deduction && !deductions.some(d => d.subId === deduction.subId)) {
                        deductions = [...deductions, deduction];
                      }
                      const baseTotal = prevEntry.total || 0;
                      const computedCurrent = Math.max(0, baseTotal - deductions.reduce((s, d) => s + Number(d.marks || 0), 0));
                      return {
                        ...prev,
                        [pauseId]: {
                          total: baseTotal,
                          current: computedCurrent,
                          deductions,
                        }
                      };
                    })
                  }
                  onComplete={() => {
                    // Move to the next question after audio pause is complete
                    handleNextQuestion();
                  }}
                  speakingCheck={speakingCheck}
                  setSpeakingCheck={setSpeakingCheck}
                  onStampStatusChange={setAudioPauseStatus}
                />
              ) : (
                <div className="flex flex-col items-start space-y-3 sm:space-y-4">
                  {currentQuestion.QuizOptions?.map((option) => {
                    const selected = Array.isArray(selectedAnswers[currentQuestion.id])
                      ? selectedAnswers[currentQuestion.id].includes(option.id)
                      : selectedAnswers[currentQuestion.id] === option.id;

                    return (
                      <div
                        key={option.id}
                        className={`flex flex-col w-full max-w-full sm:max-w-xl p-3 sm:p-4 border rounded-xl cursor-pointer transition-all duration-300 ${selected
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200"
                          }`}
                        onClick={() => handleAnswerSelect(currentQuestion.id, option.id)}
                      >
                        <div className="flex items-center sm:justify-start text-left">
                          <div
                            className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 flex items-center justify-center rounded-full border-2 mr-2 sm:mr-3 transition-all duration-300 ${selected ? "border-blue-600" : "border-slate-300"
                              }`}
                          >
                            {selected && (
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full animate-scaleIn"></div>
                            )}
                          </div>

                          <span
                            className={`break-words text-sm sm:text-base ${selected ? "text-slate-900 font-medium" : "text-slate-700"
                              }`}
                          >
                            {option.option_text}
                          </span>
                        </div>

                        {option.option_img &&
                          option.option_img.trim() !== "" &&
                          option.option_img !== "null" && (
                            <div className="mt-2 sm:mt-3 transition-all duration-500 transform hover:scale-105">
                              <img
                                src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${option.option_img || "/placeholder.png"}`}
                                alt="Option illustration"
                                className="rounded-lg shadow-md max-h-24 sm:max-h-32 w-auto"
                              />
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Audio Setup Modal */}
      {showAudioSetup && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm animate-fadeIn z-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl text-center animate-scaleIn max-w-md w-full mx-auto">
            <div className="text-2xl sm:text-3xl mb-3 sm:mb-4 mx-auto w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <FaMicrophone />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-slate-900">
              Audio Setup Required
            </h3>
            <p className="mb-4 sm:mb-6 text-sm sm:text-base text-slate-600">
              This quiz contains speaking questions. Please test your microphone and speakers before starting.
            </p>

            {/* Mobile: Stack vertically, Tablet: Side by side with adjusted sizing */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4 sm:mb-6">
              {/* Microphone Test */}
              <div className={`flex-1 p-3 sm:p-4 border-2 rounded-lg transition-all duration-300 ${speakingCheck.micCheck
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-200 bg-slate-50'
                }`}>
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3 text-slate-600">
                  <FaMicrophone />
                </div>
                <h4 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Microphone Test</h4>
                <p className="text-xs text-slate-600 mb-2 sm:mb-3 line-clamp-2">
                  Click below to test your microphone.
                </p>
                <button
                  onClick={testMicrophone}
                  className={`w-full py-2 sm:py-2.5 md:py-2 px-2 sm:px-3 rounded-lg font-medium text-xs sm:text-sm transition-all whitespace-normal ${speakingCheck.micCheck
                    ? 'bg-emerald-500 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                >
                  {speakingCheck.micCheck ? (
                    <span className="flex items-center justify-center gap-1">
                      <span>✓</span>
                      <span className="hidden xs:inline">Microphone Ready</span>
                      <span className="xs:hidden">Ready</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1">
                      <span>Test</span>
                      <span className="hidden xs:inline">Microphone</span>
                    </span>
                  )}
                </button>
              </div>

              {/* Speaker Test */}
              <div className={`flex-1 p-3 sm:p-4 border-2 rounded-lg transition-all duration-300 ${speakingCheck.speakerCheck
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-200 bg-slate-50'
                }`}>
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3 text-slate-600">
                  <FaVolumeUp />
                </div>
                <h4 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Speaker Test</h4>
                <p className="text-xs text-slate-600 mb-2 sm:mb-3 line-clamp-2">
                  Click below to test your speakers.
                </p>
                <button
                  onClick={testSpeakers}
                  className={`w-full py-2 sm:py-2.5 md:py-2 px-2 sm:px-3 rounded-lg font-medium text-xs sm:text-sm transition-all whitespace-normal ${speakingCheck.speakerCheck
                    ? 'bg-emerald-500 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                >
                  {speakingCheck.speakerCheck ? (
                    <span className="flex items-center justify-center gap-1">
                      <span>✓</span>
                      <span className="hidden xs:inline">Speakers Ready</span>
                      <span className="xs:hidden">Ready</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1">
                      <span>Test</span>
                      <span className="hidden xs:inline">Speakers</span>
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile: Column with Skip on top, Tablet/Desktop: Row with Skip on left */}
            <div className="flex flex-col-reverse xs:flex-row gap-2 sm:gap-3 justify-center">
              <button
                onClick={handleSkipAudioSetup}
                className="w-full xs:w-auto px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-xs sm:text-sm"
              >
                Skip Setup
              </button>
              <button
                onClick={handleAudioSetupComplete}
                disabled={!speakingCheck.micCheck || !speakingCheck.speakerCheck}
                className={`w-full xs:w-auto px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all ${speakingCheck.micCheck && speakingCheck.speakerCheck
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
              >
                Start Quiz
              </button>
            </div>

            {(!speakingCheck.micCheck || !speakingCheck.speakerCheck) && (
              <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-amber-600">
                Please complete both tests for the best experience.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm animate-fadeIn z-50 p-4">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl text-center animate-scaleIn max-w-md w-full mx-4">
            <div className="text-4xl sm:text-5xl mb-4 sm:mb-6 mx-auto w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full">
              {!pendingAutoSubmit ? (
                <FaExclamationTriangle className="text-amber-500" />
              ) : (
                <FaTimesCircle className="text-rose-500" />
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-slate-900">
              {!pendingAutoSubmit ? "Return to Quiz" : "Warnings Exceeded"}
            </h3>
            <p className="mb-4 sm:mb-6 text-sm sm:text-base text-slate-600 leading-relaxed">
              {!pendingAutoSubmit
                ? `Stay focused on the quiz. Do not exit fullscreen, switch tabs, or press ESC. Warning ${alertCount} of ${warningLimit}.`
                : "You have exceeded the allowed number of warnings. Clicking OK will submit your quiz now."}
            </p>
            <button
              onClick={async () => {
                if (!pendingAutoSubmit) {
                  setShowModal(false);
                  enterFullScreen();
                } else {
                  setShowModal(false);
                  await handleSubmitQuiz(pendingAutoSubmitReason || "focus_violation");
                  setPendingAutoSubmit(false);
                  setPendingAutoSubmitReason(null);
                  setShowResults(true);
                }
              }}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-2 sm:py-3 px-6 sm:px-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 w-full text-sm sm:text-base"
            >
              {!pendingAutoSubmit ? "Return to Quiz" : "OK"}
            </button>
          </div>
        </div>
      )}

      {/* Loader */}
      {isSubmitting && <LoaderSubmit />}

      {/* Exit Quiz Modal */}
      {showBackModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm animate-fadeIn z-50 p-4">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl text-center animate-scaleIn max-w-md w-full mx-4">
            <div className="text-4xl sm:text-5xl mb-4 sm:mb-6 mx-auto w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full">
              <FaExclamationTriangle className="text-amber-500" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-slate-900">
              Exit Quiz?
            </h3>
            <p className="mb-4 sm:mb-6 text-sm sm:text-base text-slate-600 leading-relaxed">
              Are you sure you want to exit the quiz? Your progress will be lost
              and you&apos;ll need to start over.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setShowBackModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-sm sm:text-base order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={handleBackToQuizzes}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-sm sm:text-base order-1 sm:order-2"
              >
                Exit Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bottom Bar */}
      {
        quizInProgress && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
            {/* Mobile & Tablet Layout */}
            <div className="md:hidden">
              <div className="flex justify-between items-center px-4 py-3">
                {/* Previous Button - Mobile */}
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={`flex items-center gap-1 px-3 py-2.5 rounded-lg font-medium text-sm ${currentQuestionIndex === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-300"
                    }`}
                >
                  <FaArrowLeft className="text-xs" />
                  <span className="hidden xs:inline">Prev</span>
                </button>

                {/* Question Counter - Mobile */}
                <div className="flex flex-col items-center">
                  <span className="text-sm font-semibold text-gray-700">
                    {currentQuestionIndex + 1}/{combinedQuestions.length}
                  </span>
                  <span className="text-xs text-gray-500">Question</span>
                </div>

                {/* Next/Submit Button - Mobile */}
                {/* Next/Submit/Continue Button - Mobile (hidden between pause stamps, Next only after media ends) */}
                {combinedQuestions[currentQuestionIndex]?.type === "video_pause" ? (
                  // Video pause question type
                  videoPauseStatus.showQuestion && !videoPauseStatus.videoEnded ? (
                    <button
                      onClick={() => videoPauseRef.current?.handleNext()}
                      disabled={videoPauseStatus.isNextDisabled}
                      className={`flex items-center gap-1 px-3 py-2.5 rounded-lg font-medium text-sm ${videoPauseStatus.isNextDisabled
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                    >
                      <span className="hidden xs:inline">Continue</span>
                      <FaArrowRight className="text-xs" />
                    </button>
                  ) : videoPauseStatus.videoEnded ? (
                    <button
                      onClick={handleNextQuestion}
                      disabled={isSubmitting}
                      className={`flex items-center gap-1 px-3 py-2.5 rounded-lg font-medium text-sm ${isSubmitting
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : currentQuestionIndex < combinedQuestions.length - 1
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                    >
                      {currentQuestionIndex < combinedQuestions.length - 1 ? (
                        <>
                          <span className="hidden xs:inline">Next</span>
                          <FaArrowRight className="text-xs" />
                        </>
                      ) : (
                        <>
                          {isSubmitting ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                              <span className="text-xs">Submitting</span>
                            </>
                          ) : (
                            <>
                              <span className="hidden xs:inline">Submit</span>
                              <FaCheckCircle className="text-xs" />
                            </>
                          )}
                        </>
                      )}
                    </button>
                  ) : null
                ) : combinedQuestions[currentQuestionIndex]?.type === "audio_pause" ? (
                  // Audio pause question type
                  audioPauseStatus.showQuestion && !audioPauseStatus.audioEnded ? (
                    <button
                      onClick={() => audioPauseRef.current?.handleNext()}
                      disabled={audioPauseStatus.isNextDisabled}
                      className={`flex items-center gap-1 px-3 py-2.5 rounded-lg font-medium text-sm ${audioPauseStatus.isNextDisabled
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                    >
                      <span className="hidden xs:inline">Continue</span>
                      <FaArrowRight className="text-xs" />
                    </button>
                  ) : audioPauseStatus.audioEnded ? (
                    <button
                      onClick={handleNextQuestion}
                      disabled={isSubmitting}
                      className={`flex items-center gap-1 px-3 py-2.5 rounded-lg font-medium text-sm ${isSubmitting
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : currentQuestionIndex < combinedQuestions.length - 1
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                    >
                      {currentQuestionIndex < combinedQuestions.length - 1 ? (
                        <>
                          <span className="hidden xs:inline">Next</span>
                          <FaArrowRight className="text-xs" />
                        </>
                      ) : (
                        <>
                          {isSubmitting ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                              <span className="text-xs">Submitting</span>
                            </>
                          ) : (
                            <>
                              <span className="hidden xs:inline">Submit</span>
                              <FaCheckCircle className="text-xs" />
                            </>
                          )}
                        </>
                      )}
                    </button>
                  ) : null
                ) : (
                  // Non pause question type - original behavior
                  <button
                    onClick={handleNextQuestion}
                    disabled={isNextButtonDisabled() || isSubmitting}
                    className={`flex items-center gap-1 px-3 py-2.5 rounded-lg font-medium text-sm ${isNextButtonDisabled() || isSubmitting
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : currentQuestionIndex < combinedQuestions.length - 1
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                  >
                    {currentQuestionIndex < combinedQuestions.length - 1 ? (
                      <>
                        <span className="hidden xs:inline">Next</span>
                        <FaArrowRight className="text-xs" />
                      </>
                    ) : (
                      <>
                        {isSubmitting ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                            <span className="text-xs">Submitting</span>
                          </>
                        ) : (
                          <>
                            <span className="hidden xs:inline">Submit</span>
                            <FaCheckCircle className="text-xs" />
                          </>
                        )}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Tablet Layout */}
            <div className="hidden md:block lg:hidden">
              <div className="flex justify-between items-center px-6 py-3">
                {/* Previous Button - Tablet */}
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold ${currentQuestionIndex === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 hover:from-slate-200 hover:to-slate-100 border border-slate-300"
                    }`}
                >
                  <FaArrowLeft className="text-sm" />
                  Previous
                </button>

                {/* Question Counter - Tablet */}
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold text-gray-800">
                    Question {currentQuestionIndex + 1} of {combinedQuestions.length}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    {Array.from({ length: Math.min(combinedQuestions.length, 10) }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${idx <= currentQuestionIndex ? 'bg-blue-500' : 'bg-gray-300'}`}
                      />
                    ))}
                    {combinedQuestions.length > 10 && (
                      <span className="text-xs text-gray-500 ml-1">+{combinedQuestions.length - 10}</span>
                    )}
                  </div>
                </div>

                {/* Next/Submit Button - Tablet */}
                {/* Next/Submit/Continue Button - Tablet (hidden between pause stamps, Next only after media ends) */}
                {combinedQuestions[currentQuestionIndex]?.type === "video_pause" ? (
                  videoPauseStatus.showQuestion && !videoPauseStatus.videoEnded ? (
                    <button
                      onClick={() => videoPauseRef.current?.handleNext()}
                      disabled={videoPauseStatus.isNextDisabled}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${videoPauseStatus.isNextDisabled
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md"
                        }`}
                    >
                      Continue
                      <FaArrowRight className="text-sm" />
                    </button>
                  ) : videoPauseStatus.videoEnded ? (
                    <button
                      onClick={handleNextQuestion}
                      disabled={isSubmitting}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${isSubmitting
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : currentQuestionIndex < combinedQuestions.length - 1
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md"
                          : "bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-md"
                        }`}
                    >
                      {currentQuestionIndex < combinedQuestions.length - 1 ? (
                        <>
                          Next
                          <FaArrowRight className="text-sm" />
                        </>
                      ) : (
                        <>
                          {isSubmitting ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              Submit Quiz
                              <FaCheckCircle className="text-sm ml-1" />
                            </>
                          )}
                        </>
                      )}
                    </button>
                  ) : null
                ) : combinedQuestions[currentQuestionIndex]?.type === "audio_pause" ? (
                  audioPauseStatus.showQuestion && !audioPauseStatus.audioEnded ? (
                    <button
                      onClick={() => audioPauseRef.current?.handleNext()}
                      disabled={audioPauseStatus.isNextDisabled}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${audioPauseStatus.isNextDisabled
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md"
                        }`}
                    >
                      Continue
                      <FaArrowRight className="text-sm" />
                    </button>
                  ) : audioPauseStatus.audioEnded ? (
                    <button
                      onClick={handleNextQuestion}
                      disabled={isSubmitting}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${isSubmitting
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : currentQuestionIndex < combinedQuestions.length - 1
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md"
                          : "bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-md"
                        }`}
                    >
                      {currentQuestionIndex < combinedQuestions.length - 1 ? (
                        <>
                          Next
                          <FaArrowRight className="text-sm" />
                        </>
                      ) : (
                        <>
                          {isSubmitting ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              Submit Quiz
                              <FaCheckCircle className="text-sm ml-1" />
                            </>
                          )}
                        </>
                      )}
                    </button>
                  ) : null
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    disabled={isNextButtonDisabled() || isSubmitting}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${isNextButtonDisabled() || isSubmitting
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : currentQuestionIndex < combinedQuestions.length - 1
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md"
                        : "bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-md"
                      }`}
                  >
                    {currentQuestionIndex < combinedQuestions.length - 1 ? (
                      <>
                        Next
                        <FaArrowRight className="text-sm" />
                      </>
                    ) : (
                      <>
                        {isSubmitting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            Submit Quiz
                            <FaCheckCircle className="text-sm ml-1" />
                          </>
                        )}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Layout - UNCHANGED */}
            {/* Desktop Layout */}
            <div className="hidden lg:block">
              <div className="mx-16 py-3">
                <div className="flex justify-between">
                  {/* Left Section - Previous Button (far left) */}
                  <div className="flex items-center">
                    <button
                      onClick={handlePrevQuestion}
                      disabled={currentQuestionIndex === 0}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${currentQuestionIndex === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 hover:from-slate-200 hover:to-slate-100 border border-slate-300 hover:border-slate-400 hover:shadow-md"
                        }`}
                    >
                      <FaArrowLeft className="text-sm" />
                      Previous
                    </button>
                  </div>

                  {/* Right Section - Next/Submit Button (far right) */}
                  {/* Right Section - Next/Submit/Continue Button (hidden between pause stamps, Next only after media ends) */}
                  <div className="flex items-center">
                    {combinedQuestions[currentQuestionIndex]?.type === "video_pause" ? (
                      videoPauseStatus.showQuestion && !videoPauseStatus.videoEnded ? (
                        <button
                          onClick={() => videoPauseRef.current?.handleNext()}
                          disabled={videoPauseStatus.isNextDisabled}
                          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${videoPauseStatus.isNextDisabled
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl hover:scale-105"
                            }`}
                        >
                          Continue
                          <FaArrowRight className="text-sm" />
                        </button>
                      ) : videoPauseStatus.videoEnded ? (
                        <button
                          onClick={handleNextQuestion}
                          disabled={isSubmitting}
                          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${isSubmitting
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : currentQuestionIndex < combinedQuestions.length - 1
                              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl hover:scale-105"
                              : "bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-lg hover:shadow-xl hover:scale-105"
                            }`}
                        >
                          {currentQuestionIndex < combinedQuestions.length - 1 ? (
                            <>
                              Next
                              <FaArrowRight className="text-sm" />
                            </>
                          ) : (
                            <>
                              {isSubmitting ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  Submit Quiz
                                  <FaCheckCircle className="text-sm" />
                                </>
                              )}
                            </>
                          )}
                        </button>
                      ) : null
                    ) : combinedQuestions[currentQuestionIndex]?.type === "audio_pause" ? (
                      audioPauseStatus.showQuestion && !audioPauseStatus.audioEnded ? (
                        <button
                          onClick={() => audioPauseRef.current?.handleNext()}
                          disabled={audioPauseStatus.isNextDisabled}
                          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${audioPauseStatus.isNextDisabled
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl hover:scale-105"
                            }`}
                        >
                          Continue
                          <FaArrowRight className="text-sm" />
                        </button>
                      ) : audioPauseStatus.audioEnded ? (
                        <button
                          onClick={handleNextQuestion}
                          disabled={isSubmitting}
                          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${isSubmitting
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : currentQuestionIndex < combinedQuestions.length - 1
                              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl hover:scale-105"
                              : "bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-lg hover:shadow-xl hover:scale-105"
                            }`}
                        >
                          {currentQuestionIndex < combinedQuestions.length - 1 ? (
                            <>
                              Next
                              <FaArrowRight className="text-sm" />
                            </>
                          ) : (
                            <>
                              {isSubmitting ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  Submit Quiz
                                  <FaCheckCircle className="text-sm" />
                                </>
                              )}
                            </>
                          )}
                        </button>
                      ) : null
                    ) : (
                      <button
                        onClick={handleNextQuestion}
                        disabled={isNextButtonDisabled() || isSubmitting}
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${isNextButtonDisabled() || isSubmitting
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : currentQuestionIndex < combinedQuestions.length - 1
                            ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl hover:scale-105"
                            : "bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-lg hover:shadow-xl hover:scale-105"
                          }`}
                      >
                        {currentQuestionIndex < combinedQuestions.length - 1 ? (
                          <>
                            Next
                            <FaArrowRight className="text-sm" />
                          </>
                        ) : (
                          <>
                            {isSubmitting ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                Submit Quiz
                                <FaCheckCircle className="text-sm" />
                              </>
                            )}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .animate-slideUp {
          animation: slideUp 0.5s ease-out forwards;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        .animate-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }

        .quiz-content-container {
          padding-bottom: 70px;
        }

        @media (min-width: 768px) {
          .quiz-content-container {
            padding-bottom: 80px;
          }
        }

        @media (min-width: 1024px) {
          .quiz-content-container {
            padding-bottom: 80px;
          }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        @media (max-width: 640px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
        }

        .truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
