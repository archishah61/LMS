/* eslint-disable react/jsx-key */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useCreateExtensionRequestMutation, useGetMyExtensionRequestsQuery } from "../../../services/Assignment/assignmentExtensionRequestApi";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCheck,
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
  FaClipboardList,
  FaHistory,
  FaEnvelope,
} from "react-icons/fa";
import { motion } from "framer-motion";
import RegularAssignment from "./Assignments/RegularAssignment";
import MatchingQuestions from "./Assignments/MatchingQuestions";
import TrueFalseQuestions from "./Assignments/TrueFalseQuestions";
import FillInTheBlanksQuestions from "./Assignments/FillInTheBlanksQuestions";
import ParagraphWritingQuestions from "./Assignments/ParagraphWritingQuestions";
import { useCreateAssignmentCompletionMutation, useEvaluateAssignmentMutation, useCreateDueDateOfAssignmentsMutation } from "../../../services/Assignment/assignmentCompletionApi";
import { useCreateAssignmentResponseMutation, useGetAssignmentResponsesByCompletionIdQuery } from "../../../services/Assignment/assignmentResponseApi";
import { getStudentToken } from "../../../services/CookieService";
import { useDispatch } from "react-redux";
import { addCompletion } from "../../../features/Assignment/assignmentCompletionSlice";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const getAssignmentStorageKey = (assignmentId, userId) => `assignment-state-${assignmentId}-${userId}`;

const parseParagraphMeta = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
};

export default function DisplayAssignmentContent({
  activeAssignment,
  setActiveTopic,
  onBack,
  onContinueLearning,
  setActiveAssignment,
  assignmentData,
  setShowCertificateModal,
  setShowModuleCompletionModal,
  setShowSessionCompletionModal,
  userId,
  setAttachmentsCompleted,
  refetchSessions,
  refetchModules,
  refetchTopics,
  refetchAssignmentData,
  refetchAssignmentCompletion,
  isAssignmentCompleted,
  completionData,
  topicContentDataByModule,
  courseId,
  moduleId,
  moduleQuizzes = [],
  quizCompletionData = [],
  isMobile,
}) {

  // Utility function to strip HTML tags
  const stripHtmlTags = (html) => {
    if (!html) return '';
    return html.replace(/<\/?[^>]+(>|$)/g, "");
  };

  const decodeHtml = (htmlString) => {
    if (!htmlString) return '';

    // Create a temporary div element to parse HTML and get text content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { access_token } = getStudentToken();
  const [showPreview, setShowPreview] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [blanksAnswers, setBlanksAnswers] = useState({});
  const [blanksSubmitted, setBlanksSubmitted] = useState(false);
  const [blanksScores, setBlanksScores] = useState({});
  const [matchingAnswers, setMatchingAnswers] = useState({});
  const [matchingScores, setMatchingScores] = useState({});
  const [matchingSubmitted, setMatchingSubmitted] = useState(false);
  const [completionId, setCompletionId] = useState(null);
  const [individualScores, setIndividualScores] = useState({});
  const [paragraphAnswers, setParagraphAnswers] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(0);
  const [typingEfficiency, setTypingEfficiency] = useState(0);
  const [spellingErrors, setSpellingErrors] = useState([]);
  const [paragraphComplete, setParagraphComplete] = useState(false);
  const [showBackModal, setShowBackModal] = useState(false);
  const [assignmentInProgress, setAssignmentInProgress] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [hasPassedAssignment, setHasPassedAssignment] = useState(false);
  const [triedAttempts, setTriedAttempts] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(0);
  const [attemptsExhausted, setAttemptsExhausted] = useState(false);
  const [lastAttemptTime, setLastAttemptTime] = useState(null);
  const [questionAttemptTimes, setQuestionAttemptTimes] = useState({});
  const [dueDate, setDueDate] = useState(null);
  const [isStateRestored, setIsStateRestored] = useState(false);
  const [showMobileSubmit, setShowMobileSubmit] = useState(false);
  const [pendingCompletionPopup, setPendingCompletionPopup] = useState(null);
  const [loadedResponses, setLoadedResponses] = useState({});
  const [paragraphMetadata, setParagraphMetadata] = useState({});

  const [showStartPopup, setShowStartPopup] = useState(false);
  const [createDueDateOfAssignments] = useCreateDueDateOfAssignmentsMutation();

  const [createAssignmentCompletion] = useCreateAssignmentCompletionMutation();
  const [createAssignmentResponse] = useCreateAssignmentResponseMutation();
  const [createExtensionRequest] = useCreateExtensionRequestMutation();
  const [evaluateAssignment] = useEvaluateAssignmentMutation();
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  // Get extension requests
  const { data: extensionRequests, isLoading: isLoadingRequests } = useGetMyExtensionRequestsQuery({
    access_token
  });

  // Get assignment responses (for retrieving stored metadata)
  const { data: assignmentResponsesData, isLoading: isLoadingResponses } = useGetAssignmentResponsesByCompletionIdQuery(
    completionId ? { completionId, access_token } : null,
    { skip: !completionId } // Skip query if no completionId
  );

  // Get current assignment's PENDING extension request (only pending blocks new requests)
  const currentAssignmentRequest = extensionRequests?.requests?.find(
    request => request.assignmentId === activeAssignment?.id && request.status === 'Pending'
  );

  // Calculate remaining extension requests
  const usedExtensionRequests = extensionRequests?.requests?.filter(
    request => request.assignmentId === activeAssignment?.id
  )?.length || 0;
  const extensionLimit = activeAssignment?.extension_limit || 0;

  const remainingExtensions = Math.max(0, extensionLimit - usedExtensionRequests);

  // Handle extension request
  const handleExtensionRequest = async () => {
    try {
      await createExtensionRequest({
        requestData: {
          assignmentId: activeAssignment.id,
        },
        access_token: access_token
      }).unwrap();

      toast.success("Extension request sent successfully!");
    } catch (error) {
      console.error("Error sending extension request:", error);
      toast.error("Failed to send extension request. Please try again.");
    }
  };

  // Function to record when a question is first answered
  const recordQuestionTime = (questionId, timestamp) => {
    setQuestionAttemptTimes(prev => ({
      ...prev,
      [questionId]: timestamp
    }));
  };

  const paragraphRef = useRef(null);
  const previousAssignmentIdRef = useRef(null);

  const isImage = (value) => {
    return typeof value === "string" && (
      value.endsWith(".jpg") ||
      value.endsWith(".jpeg") ||
      value.endsWith(".png") ||
      value.endsWith(".webp")
    );
  };

  // Function to handle continue learning - navigate to next topic
  const handleContinueLearning = () => {
    // Use parent-provided callback if available (correct approach)
    if (typeof onContinueLearning === 'function') {
      onContinueLearning();
      return;
    }

    // Fallback: try topicContentDataByModule if passed
    if (topicContentDataByModule && activeAssignment) {
      const topics = topicContentDataByModule;
      const currentTopicIndex = topics.findIndex(
        topic => topic.assignmentId === activeAssignment.id
      );
      if (currentTopicIndex !== -1 && currentTopicIndex < topics.length - 1) {
        const nextTopic = topics[currentTopicIndex + 1];
        if (typeof setActiveTopic === 'function') setActiveTopic(nextTopic);
        toast.success("Moving to next topic");
        return;
      }
    }

    // Nothing to navigate — course complete or no callback
    toast.success("You've completed all topics in this module!");
  };

  const triggerCompletionPopup = useCallback((popupType) => {
    if (!popupType) return;

    if (popupType === "certificate") {
      setShowModuleCompletionModal(false);
      setShowSessionCompletionModal(false);
      setShowCertificateModal();
      return;
    }

    if (popupType === "session") {
      setShowSessionCompletionModal(true);
      setShowModuleCompletionModal(false);
      return;
    }

    if (popupType === "module") {
      setShowModuleCompletionModal(true);
    }
  }, [setShowCertificateModal, setShowModuleCompletionModal, setShowSessionCompletionModal]);

  // Load responses and extract paragraph metadata
  useEffect(() => {
    if (assignmentResponsesData?.success && assignmentResponsesData?.data) {
      const responses = assignmentResponsesData.data;
      const responsesObj = {};
      const metadataObj = {};

      responses.forEach((response) => {
        responsesObj[response.questionId] = response.selectedAnswer;

        const parsedMeta = parseParagraphMeta(response.paragraph_meta_data ?? response.paragraphMetaData);
        if (parsedMeta) {
          metadataObj[response.questionId] = parsedMeta;
        }
      });

      setLoadedResponses(responsesObj);
      setParagraphMetadata(metadataObj);
    }
  }, [assignmentResponsesData]);

  useEffect(() => {
    if (!showResults || !pendingCompletionPopup) return;

    // Let the result screen render first, then show completion/certificate modal.
    const timer = setTimeout(() => {
      triggerCompletionPopup(pendingCompletionPopup);
      setPendingCompletionPopup(null);
    }, 1200);

    return () => clearTimeout(timer);
  }, [showResults, pendingCompletionPopup, triggerCompletionPopup]);

  useEffect(() => {
    // Re-run state restoration when changing assignment/user
    setIsStateRestored(false);
  }, [activeAssignment?.id, userId]);

  useEffect(() => {
    // Store the current assignment ID to maintain state isolation between assignments
    const currentAssignmentId = activeAssignment?.id;
    const hasAssignmentChanged = String(previousAssignmentIdRef.current) !== String(currentAssignmentId);

    if (activeAssignment && completionData) {
      // Find the completion data for the current active assignment
      const currentAssignmentCompletion = completionData.find(
        completion => String(completion.assignmentId) === String(activeAssignment.id)
      );

      // If assignment is already completed, never gate with Start popup.
      if (currentAssignmentCompletion?.isCompleted) {
        setDueDate(currentAssignmentCompletion?.due_date || null);
        setShowStartPopup(false);
      } else if (currentAssignmentCompletion?.due_date) {
        setDueDate(currentAssignmentCompletion.due_date);
        setShowStartPopup(false);
      } else {
        setDueDate(null);
        setShowStartPopup(true);
      }
    } else if (activeAssignment) {
      setDueDate(null);
      setShowStartPopup(true);
    }

    // First, immediately set max attempts from the active assignment to prevent UI flicker
    if (activeAssignment) {
      const maxAttemptValue = activeAssignment.max_attempt || 1;
      setMaxAttempts(maxAttemptValue);
      setAttemptsRemaining(maxAttemptValue);
    }

    // Reset local states only when user actually switches to a different assignment.
    if (hasAssignmentChanged) {
      setShowResults(false);
      setScore(0);
      setIsSubmitted(false);
      setAssignmentInProgress(true);
      setUserAnswers({});
      setBlanksAnswers({});
      setMatchingAnswers({});
      setParagraphAnswers({});
      setQuestionAttemptTimes({});
      setBlanksSubmitted(false);
      setMatchingSubmitted(false);
      setBlanksScores({});
      setMatchingScores({});
      setSpellingErrors([]);
      setTypingSpeed(0);
      setTypingEfficiency(0);
      setBackspaceCount(0);
      setIndividualScores({});
      setHasPassedAssignment(false);
      setTriedAttempts(0);
      setAttemptsExhausted(false);
      setLastAttemptTime(null);
    }

    // Check assignment attempt tracking and completion status
    if (completionData && activeAssignment) {
      const completedAssignment = completionData.find(
        (completion) => String(completion.assignmentId) === String(activeAssignment.id)
      );

      if (completedAssignment) {
        const triedAttempts = completedAssignment.tried_attempts || 0;
        setTriedAttempts(triedAttempts);
        setLastAttemptTime(completedAssignment.last_attempt_time ? new Date(completedAssignment.last_attempt_time) : null);

        const maxAttempts = activeAssignment.max_attempt || 1;
        setMaxAttempts(maxAttempts);

        const remaining = maxAttempts - triedAttempts;
        const attemptsRemaining = remaining >= 0 ? remaining : 0;
        setAttemptsRemaining(attemptsRemaining);
        setAttemptsExhausted(attemptsRemaining <= 0);

        if (completedAssignment.isCompleted) {
          setShowResults(true);
          setScore(completedAssignment.score);
          setIsSubmitted(true);
          setAssignmentInProgress(false);

          if (completedAssignment.individualScores) {
            setIndividualScores(completedAssignment.individualScores);
          }
        }
      } else {
        const maxAttemptValue = activeAssignment.max_attempt || 1;
        setMaxAttempts(maxAttemptValue);
        setAttemptsRemaining(maxAttemptValue);
        setTriedAttempts(0);
        setAttemptsExhausted(false);
      }

      if (completedAssignment) {
        setHasPassedAssignment(completedAssignment.status === "Completed");

        const responses = completedAssignment.AssignmentResponses || completedAssignment.assignmentResponses || [];

        if (responses.length > 0) {
          const type = completedAssignment.Assignment?.category || activeAssignment?.category;

          const tfAnswers = {};
          responses.forEach((response) => {
            if (
              activeAssignment?.TrueFalseQuestions &&
              activeAssignment.TrueFalseQuestions.length > 0 &&
              activeAssignment.TrueFalseQuestions.some(
                (q) => String(q.id) === String(response.questionId)
              )
            ) {
              tfAnswers[response.questionId] =
                response.selectedAnswer === "true";
            }
          });
          if (type == "true_false") {
            setUserAnswers(tfAnswers);
          }

          const matchingAns = {};
          responses.forEach((response) => {
            if (
              activeAssignment?.MatchingQuestions &&
              activeAssignment.MatchingQuestions.length > 0 &&
              activeAssignment.MatchingQuestions.some(
                (q) => String(q.id) === String(response.questionId)
              )
            ) {
              const lastHyphenIndex = response.selectedAnswer.lastIndexOf("<->");
              if (lastHyphenIndex !== -1) {
                const optionText = response.selectedAnswer.substring(0, lastHyphenIndex);
                const matchText = response.selectedAnswer.substring(lastHyphenIndex + 3);
                if (!matchingAns[response.questionId]) {
                  matchingAns[response.questionId] = {};
                }
                matchingAns[response.questionId][optionText] = matchText;
              }
            }
          });
          if (type == 'matching') {
            setMatchingAnswers(matchingAns);
            setMatchingSubmitted(true);
          }

          const blanksAns = {};
          responses.forEach((response) => {
            if (
              activeAssignment?.FillTheBlanksQuestions &&
              activeAssignment.FillTheBlanksQuestions.length > 0 &&
              activeAssignment.FillTheBlanksQuestions.some(
                (q) => q.id === response.questionId
              )
            ) {
              if (response.selectedAnswer) {
                const questionObj = activeAssignment.FillTheBlanksQuestions.find(q => String(q.id) === String(response.questionId));
                const questionText = questionObj?.question_text || '';
                const blankCount = (questionText.match(/_____/g) || []).length;
                const correctAnswersArray = questionObj?.answers || [];

                if (response.selectedAnswer.includes("|||")) {
                  blanksAns[response.questionId] = response.selectedAnswer.split("|||").map(ans => ans.trim());
                } else {
                  const parts = response.selectedAnswer.split(",");
                  if (blankCount === correctAnswersArray.length) {
                    if (parts.length === blankCount) {
                      blanksAns[response.questionId] = parts.map(ans => ans.trim());
                    } else if (blankCount === 1) {
                      blanksAns[response.questionId] = [response.selectedAnswer.trim()];
                    } else {
                      blanksAns[response.questionId] = parts.map(ans => ans.trim());
                      while (blanksAns[response.questionId].length < blankCount) {
                        blanksAns[response.questionId].push('');
                      }
                      if (blanksAns[response.questionId].length > blankCount) {
                        blanksAns[response.questionId] = blanksAns[response.questionId].slice(0, blankCount);
                      }
                    }
                  } else {
                    blanksAns[response.questionId] = response.selectedAnswer.split(",").map(ans => ans.trim());
                  }
                }
              }
            }
          });

          if (type == "fill_in_the_blanks" || activeAssignment.category === "fill_in_the_blanks") {
            const filteredBlanksAns = {};
            if (activeAssignment.FillTheBlanksQuestions) {
              const validQuestionIds = new Set(
                activeAssignment.FillTheBlanksQuestions.map(question => question.id)
              );
              Object.keys(blanksAns).forEach(questionId => {
                if (validQuestionIds.has(parseInt(questionId)) || validQuestionIds.has(questionId)) {
                  filteredBlanksAns[questionId] = blanksAns[questionId];
                }
              });
            }
            setBlanksAnswers(filteredBlanksAns);
            setBlanksSubmitted(Object.keys(filteredBlanksAns).length > 0);
            setTimeout(debugFillInTheBlanks, 1000);
          }

          const paragraphAns = {};
          const paragraphMeta = {};
          responses.forEach((response) => {
            const responseQuestionId = response.questionId ?? response.question_id;
            const responseSelectedAnswer = response.selectedAnswer ?? response.selected_answer;
            const responseParagraphMeta = parseParagraphMeta(response.paragraph_meta_data ?? response.paragraphMetaData);
            if (
              activeAssignment?.ParagraphWritings &&
              activeAssignment.ParagraphWritings.length > 0 &&
              activeAssignment.ParagraphWritings.some(
                (q) => String(q.id) === String(responseQuestionId)
              )
            ) {
              paragraphAns[responseQuestionId] = responseSelectedAnswer || "";
              if (responseParagraphMeta) {
                paragraphMeta[responseQuestionId] = responseParagraphMeta;
              }
            }
          });

          if (type === "paragraph_writing" || activeAssignment.category === "paragraph_writing") {
            setParagraphAnswers(paragraphAns);
            setParagraphMetadata(paragraphMeta);
          }

          if (
            activeAssignment.category === "paragraph_writing" &&
            activeAssignment.ParagraphWritings &&
            activeAssignment.ParagraphWritings.length > 0
          ) {
            const paragraphId = activeAssignment.ParagraphWritings[0].id;

            if (paragraphId && paragraphAns && paragraphAns[paragraphId] !== undefined) {
              const typedText = paragraphAns[paragraphId] || "";
              const originalText = activeAssignment.ParagraphWritings[0].paragraph || "";

              if (originalText && typedText) {
                const errors = findSpellingErrors(stripHtmlTags(originalText), typedText);
                setSpellingErrors(errors || []);
              } else {
                setSpellingErrors([]);
              }
            }

            const savedMeta = paragraphMeta[paragraphId] || null;
            setTypingEfficiency(savedMeta?.typingEfficiency ?? 0);
            setTypingSpeed(savedMeta?.typingSpeed ?? 0);
            setBackspaceCount(savedMeta?.backspaceCount ?? 0);
            if (Array.isArray(savedMeta?.spellingErrors)) {
              setSpellingErrors(savedMeta.spellingErrors);
            }
          }
        } else {
          // Fallback: if API completion payload has no AssignmentResponses,
          // restore last submitted/in-progress answers from localStorage.
          // const savedState = localStorage.getItem(getAssignmentStorageKey(activeAssignment.id, userId));
          // if (savedState) {
          //   try {
          //     const parsedState = JSON.parse(savedState);
          //     const savedUserAnswers = parsedState?.userAnswers || {};
          //     const savedBlanksAnswers = parsedState?.blanksAnswers || {};
          //     const savedMatchingAnswers = parsedState?.matchingAnswers || {};
          //     const savedParagraphAnswers = parsedState?.paragraphAnswers || {};

          //     if (Object.keys(savedUserAnswers).length > 0) {
          //       setUserAnswers(savedUserAnswers);
          //     }

          //     if (Object.keys(savedBlanksAnswers).length > 0) {
          //       setBlanksAnswers(savedBlanksAnswers);
          //       setBlanksSubmitted(true);
          //     }

          //     if (Object.keys(savedMatchingAnswers).length > 0) {
          //       setMatchingAnswers(savedMatchingAnswers);
          //       setMatchingSubmitted(true);
          //     }

          //     if (Object.keys(savedParagraphAnswers).length > 0) {
          //       setParagraphAnswers(savedParagraphAnswers);
          //     }

          //     const savedParagraphMeta = parsedState?.paragraphMetadata || {};
          //     if (savedParagraphMeta && typeof savedParagraphMeta === "object" && Object.keys(savedParagraphMeta).length > 0) {
          //       setParagraphMetadata(savedParagraphMeta);
          //       const firstKey = Object.keys(savedParagraphMeta)[0];
          //       const meta = savedParagraphMeta[firstKey] || {};
          //       setTypingEfficiency(meta.typingEfficiency ?? 0);
          //       setTypingSpeed(meta.typingSpeed ?? 0);
          //       setBackspaceCount(meta.backspaceCount ?? 0);
          //       setSpellingErrors(Array.isArray(meta.spellingErrors) ? meta.spellingErrors : []);
          //     }
          //   } catch (error) {
          //     console.error('Error restoring fallback assignment state:', error);
          //   }
          // }
        }
      }
    }

    previousAssignmentIdRef.current = currentAssignmentId;
  }, [activeAssignment?.id, completionData, activeAssignment, userId]);

  useEffect(() => {
    if (!activeAssignment?.id || !userId || !isStateRestored) {
      return;
    }

    const completedAssignment = completionData?.find(
      (completion) => String(completion.assignmentId) === String(activeAssignment.id)
    );

    if (completedAssignment?.isCompleted) {
      return;
    }

    const hasDraftAnswers =
      Object.keys(userAnswers || {}).length > 0 ||
      Object.keys(matchingAnswers || {}).length > 0 ||
      Object.keys(paragraphAnswers || {}).length > 0 ||
      Object.values(blanksAnswers || {}).some(
        (ans) => Array.isArray(ans) && ans.some((item) => String(item || "").trim().length > 0)
      );

    if (assignmentInProgress && activeAssignment.category != "regular" && hasDraftAnswers) {
      const assignmentState = {
        userAnswers,
        blanksAnswers,
        matchingAnswers,
        paragraphAnswers,
        assignmentInProgress: true,
        timestamp: Date.now()
      };
      localStorage.setItem(getAssignmentStorageKey(activeAssignment.id, userId), JSON.stringify(assignmentState));
    }
  }, [userAnswers, blanksAnswers, matchingAnswers, paragraphAnswers, assignmentInProgress, activeAssignment?.id, activeAssignment?.category, userId, isStateRestored, completionData]);

  useEffect(() => {
    if (activeAssignment?.id && userId && !isStateRestored) {
      const completedAssignment = completionData?.find(
        (completion) => String(completion.assignmentId) === String(activeAssignment.id)
      );

      // Do not restore in-progress draft state over completed results
      if (completedAssignment?.isCompleted) {
        setIsStateRestored(true);
        return;
      }

      const savedState = localStorage.getItem(getAssignmentStorageKey(activeAssignment.id, userId));

      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          const stateAge = Date.now() - parsedState.timestamp;

          if (stateAge < 24 * 60 * 60 * 1000) {
            setUserAnswers(parsedState.userAnswers || {});
            setBlanksAnswers(parsedState.blanksAnswers || {});
            setMatchingAnswers(parsedState.matchingAnswers || {});
            setParagraphAnswers(parsedState.paragraphAnswers || {});
            setShowResults(false);

            if (parsedState.assignmentInProgress) {
              setAssignmentInProgress(true);
            }
          } else {
            localStorage.removeItem(getAssignmentStorageKey(activeAssignment.id, userId));
          }
        } catch (error) {
          console.error('Error restoring assignment state:', error);
          localStorage.removeItem(getAssignmentStorageKey(activeAssignment.id, userId));
        }
      }
      setIsStateRestored(true);
    }
  }, [activeAssignment?.id, userId, isStateRestored, completionData]);

  useEffect(() => {
    try {
      if (
        !activeAssignment?.ParagraphWritings ||
        !Array.isArray(activeAssignment.ParagraphWritings) ||
        activeAssignment.ParagraphWritings.length === 0
      ) {
        return;
      }

      const paragraphQuestion = activeAssignment.ParagraphWritings[0];
      if (!paragraphQuestion || !paragraphQuestion.id) {
        setParagraphComplete(false);
        return;
      }

      const paragraphId = paragraphQuestion.id;
      const paragraph = paragraphQuestion.paragraph || "";

      if (!paragraph) {
        setParagraphComplete(false);
        return;
      }

      if (!paragraphAnswers || typeof paragraphAnswers !== 'object') {
        setParagraphComplete(false);
        return;
      }

      const normalizedOriginal = stripHtmlTags(paragraph).trim().replace(/\s+/g, ' ');
      const typedText = paragraphAnswers[paragraphId] || "";
      const normalizedTyped = typedText.trim().replace(/\s+/g, ' ');
      const originalWords = normalizedOriginal ? normalizedOriginal.split(/\s+/) : [];
      const typedWords = normalizedTyped ? normalizedTyped.split(/\s+/) : [];

      const paragraphCompleteNow =
        originalWords.length > 0 &&
        typedWords.length >= originalWords.length;

      setParagraphComplete(paragraphCompleteNow);
    } catch (error) {
      console.error("Error checking paragraph completion:", error);
      setParagraphComplete(false);
    }
  }, [paragraphAnswers, activeAssignment?.ParagraphWritings]);

  useEffect(() => {
    if (showResults && !isSubmitted &&
      activeAssignment?.category === "paragraph_writing" &&
      activeAssignment?.ParagraphWritings?.length > 0) {
      try {
        const paragraphId = activeAssignment.ParagraphWritings[0].id;
        const paragraphText = activeAssignment.ParagraphWritings[0].paragraph;

        if (!paragraphId || !paragraphText) {
          setSpellingErrors([]);
          return;
        }

        if (!paragraphAnswers || !paragraphAnswers[paragraphId]) {
          setSpellingErrors([]);
          return;
        }

        const endTime = new Date();
        const timeTaken = startTime ? (endTime - startTime) / 1000 : 60;
        const wordsTyped = paragraphAnswers[paragraphId]?.split(" ").length || 0;
        const typingSpeedWPM = Math.round((wordsTyped / Math.max(timeTaken, 1)) * 60);
        setTypingSpeed(typingSpeedWPM);

        const errors = findSpellingErrors(
          stripHtmlTags(paragraphText),
          paragraphAnswers[paragraphId]
        );

        setSpellingErrors(errors || []);

        const words = paragraphText.trim().split(/\s+/);
        const totalWords = words.length;
        const efficiency = totalWords > 0 ?
          Math.max(0, ((totalWords - (errors?.length || 0)) / totalWords) * 100) : 100;

        setTypingEfficiency(efficiency > 0 ? efficiency : 0);
      } catch (error) {
        console.error("Error calculating paragraph metrics:", error);
        setSpellingErrors([]);
        setTypingEfficiency(0);
      }
    }
  }, [showResults, activeAssignment, paragraphAnswers, startTime, backspaceCount, isSubmitted]);

  const findSpellingErrors = (original, typed) => {
    if (!original || !typed || typeof original !== 'string' || typeof typed !== 'string') {
      return [];
    }

    try {
      const originalWords = original.split(" ");
      const typedWords = typed.split(" ");
      const errors = [];

      if (originalWords && originalWords.length > 0 && typedWords && typedWords.length > 0) {
        originalWords.forEach((word, index) => {
          if (typedWords[index] && typedWords[index] !== word) {
            errors.push({
              original: word,
              typed: typedWords[index],
            });
          }
        });

        if (typedWords.length > originalWords.length) {
          for (let i = originalWords.length; i < typedWords.length; i++) {
            errors.push({
              original: "(none)",
              typed: typedWords[i],
            });
          }
        }
      }

      return errors;
    } catch (error) {
      console.error("Error in findSpellingErrors:", error);
      return [];
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const calculateParagraphWritingScore = () => {
    if (!activeAssignment || activeAssignment.category !== "paragraph_writing") return 0;

    const paragraphText = activeAssignment.ParagraphWritings[0].paragraph;
    const paragraphId = activeAssignment.ParagraphWritings[0].id;

    const errors = findSpellingErrors(paragraphText, paragraphAnswers[paragraphId]) || [];
    const maxScore = activeAssignment.max_score || 100;

    const words = paragraphText.trim().split(/\s+/);
    const totalWords = words.length;
    const scorePerWord = maxScore / totalWords;
    const wrongWordPenalty = errors.length * scorePerWord;
    const penaltyPerBackspace = Math.max(scorePerWord / 5, 0.2);
    const backspacePenalty = (backspaceCount || 0) * penaltyPerBackspace;
    const rawScore = maxScore - wrongWordPenalty - backspacePenalty;

    return Math.max(0, Math.round(rawScore));
  };

  const calculateTrueFalseScore = () => {
    if (
      !activeAssignment.TrueFalseQuestions ||
      activeAssignment.TrueFalseQuestions.length === 0
    )
      return 0;
    if (isNaN(activeAssignment.max_score) || activeAssignment.max_score <= 0)
      return 0;

    const totalQuestions = activeAssignment.TrueFalseQuestions.length;
    const pointsPerQuestion = activeAssignment.max_score / totalQuestions;

    let correctAnswers = 0;
    activeAssignment.TrueFalseQuestions.forEach((question) => {
      if (userAnswers[question.id] === question.correct_answer) {
        correctAnswers++;
      }
    });

    const score = Math.round(correctAnswers * pointsPerQuestion * 10) / 10;
    setIndividualScores((prev) => ({ ...prev, trueFalse: score }));
    setCorrectAnswers(correctAnswers);
    return score;
  };

  const calculateMatchingScore = () => {
    if (
      !activeAssignment.MatchingQuestions ||
      activeAssignment.MatchingQuestions.length === 0
    )
      return 0;
    if (isNaN(activeAssignment.max_score) || activeAssignment.max_score <= 0)
      return 0;

    const currentAssignmentId = activeAssignment.id;

    let totalCorrectMatches = 0;
    let totalMatches = 0;
    const newScores = {};

    activeAssignment.MatchingQuestions.forEach((question) => {
      const userAnswer = matchingAnswers[question.id] || {};
      const correctAnswers = {};

      question.MatchingOptions.forEach((option) => {
        correctAnswers[option.option_text] = option.match_text;
      });

      let correctMatchCount = 0;
      const questionTotalMatches = question.MatchingOptions.length;

      Object.keys(correctAnswers).forEach((optionText) => {
        if (userAnswer[optionText] === correctAnswers[optionText]) {
          correctMatchCount++;
        }
      });

      totalCorrectMatches += correctMatchCount;
      totalMatches += questionTotalMatches;

      newScores[question.id] = {
        correctMatches: correctMatchCount,
        totalMatches: questionTotalMatches,
        correctAnswers,
      };
    });

    setMatchingScores(newScores);
    setMatchingSubmitted(true);

    const pointsPerMatch = activeAssignment.max_score / totalMatches;
    const totalScore =
      Math.round(totalCorrectMatches * pointsPerMatch * 10) / 10;

    setIndividualScores((prev) => ({ ...prev, matching: totalScore }));
    setCorrectAnswers(totalCorrectMatches);

    return totalScore;
  };

  const calculateBlanksScore = () => {
    if (
      !activeAssignment?.FillTheBlanksQuestions ||
      activeAssignment.FillTheBlanksQuestions.length === 0
    )
      return 0;
    if (isNaN(activeAssignment.max_score) || activeAssignment.max_score <= 0)
      return 0;

    const newScores = {};
    let totalCorrect = 0;

    const assignmentId = activeAssignment.id;

    activeAssignment.FillTheBlanksQuestions.forEach((question) => {
      if (!question.id) {
        console.warn('Skipping question with no ID');
        return;
      }

      const userAnswers = blanksAnswers[question.id] || [];
      let isCorrect = true;

      const questionText = question.question_text || '';
      const blankCount = (questionText.match(/_____/g) || []).length;
      const correctAnswers = question.answers || [];

      if (blankCount === correctAnswers.length) {
        userAnswers.forEach((answer, index) => {
          if (!answer || answer.trim() === '') {
            isCorrect = false;
            return;
          }

          if (!correctAnswers[index]) {
            console.warn(`No correct answer defined for question ${question.id}, blank ${index}`);
            isCorrect = false;
            return;
          }

          const userAnswer = answer.trim().toLowerCase();
          const correctAnswer = correctAnswers[index].trim().toLowerCase();

          if (userAnswer.toLowerCase() !== correctAnswer.toLowerCase()) {
            isCorrect = false;
          }
        });
      } else {
        isCorrect = false;
      }

      newScores[question.id] = {
        isCorrect,
        correctAnswer: correctAnswers.map(ans => ans.trim()).join(', '),
        userAnswerArray: userAnswers || [],
        questionText: decodeHtml(question.question_text),
        attemptTime: questionAttemptTimes[question.id] || new Date().toLocaleString()
      };

      if (isCorrect) totalCorrect++;
    });

    setBlanksScores(newScores);
    setBlanksSubmitted(true);

    const totalQuestions = activeAssignment.FillTheBlanksQuestions.length;
    const pointsPerQuestion = activeAssignment.max_score / totalQuestions;
    const score = Math.round(totalCorrect * pointsPerQuestion * 10) / 10;
    setIndividualScores((prev) => ({ ...prev, fillInTheBlanks: score }));
    setCorrectAnswers(totalCorrect);
    return score;
  };

  const handleSubmitAssignment = async () => {
    setIsSubmitting(true);
    try {
      let submitTypingSpeed = typingSpeed;
      let submitTypingEfficiency = typingEfficiency;
      let submitSpellingErrors = Array.isArray(spellingErrors) ? spellingErrors : [];

      if (activeAssignment.category === 'paragraph_writing' && activeAssignment?.ParagraphWritings?.length > 0) {
        const paragraphId = activeAssignment.ParagraphWritings[0].id;
        const paragraphText = activeAssignment.ParagraphWritings[0].paragraph || "";
        const typedText = paragraphAnswers?.[paragraphId] || "";

        if (typedText.trim()) {
          const endTime = new Date();
          const timeTakenSeconds = startTime ? Math.max(1, (endTime - startTime) / 1000) : 60;
          const wordsTyped = typedText.trim().split(/\s+/).length;
          submitTypingSpeed = Math.round((wordsTyped / timeTakenSeconds) * 60);

          const errors = findSpellingErrors(stripHtmlTags(paragraphText), typedText) || [];
          const totalWords = Math.max(1, stripHtmlTags(paragraphText).trim().split(/\s+/).length);
          submitTypingEfficiency = Math.max(0, ((totalWords - errors.length) / totalWords) * 100);
          submitSpellingErrors = errors;

          setTypingSpeed(submitTypingSpeed);
          setTypingEfficiency(submitTypingEfficiency);
          setSpellingErrors(errors);
        }
      }

      const submissionData = {
        assignmentId: activeAssignment.id,
        userAnswers:
          activeAssignment.category === 'true_false' ? userAnswers
            : activeAssignment.category === 'fill_in_the_blanks' ? blanksAnswers
              : activeAssignment.category === 'matching' ? matchingAnswers
                : activeAssignment.category === 'paragraph_writing' ? { ...paragraphAnswers, typingSpeed: submitTypingSpeed, backspaceCount: backspaceCount } : null
      }

      const minWaitPromise = new Promise(resolve => setTimeout(resolve, 2000));
      const [result] = await Promise.all([
        evaluateAssignment({ submissionData, access_token }).unwrap(),
        minWaitPromise
      ]);

      const mappedMatchingAnswers = {};
      Object.keys(matchingAnswers).forEach((questionId) => {
        const answers = matchingAnswers[questionId];
        mappedMatchingAnswers[questionId] = Object.entries(answers).map(
          ([optionText, matchText]) => ({
            optionText,
            matchText,
          })
        );
      });

      if (activeAssignment?.id && userId) {
        const localParagraphMetadata = {};
        if (activeAssignment?.category === "paragraph_writing" && activeAssignment?.ParagraphWritings?.length > 0) {
          const paragraphId = activeAssignment.ParagraphWritings[0].id;
          localParagraphMetadata[paragraphId] = {
            typingSpeed: submitTypingSpeed ?? 0,
            typingEfficiency: submitTypingEfficiency ?? 0,
            backspaceCount: backspaceCount || 0,
            spellingErrorCount: submitSpellingErrors?.length || 0,
            spellingErrors: Array.isArray(submitSpellingErrors) ? submitSpellingErrors : [],
            submittedAt: new Date().toISOString(),
          };
        }

        // Preserve latest submitted answers locally to avoid empty UI during revisit
        // before backend response records are available in completion payload.
        localStorage.setItem(
          getAssignmentStorageKey(activeAssignment.id, userId),
          JSON.stringify({
            userAnswers,
            blanksAnswers,
            matchingAnswers,
            paragraphAnswers,
            paragraphMetadata: localParagraphMetadata,
            assignmentInProgress: false,
            timestamp: Date.now(),
          })
        );
      }

      const completionPopupType = await storeAssignmentData(result?.data?.score, mappedMatchingAnswers, {
        typingSpeed: submitTypingSpeed,
        typingEfficiency: submitTypingEfficiency,
        spellingErrors: submitSpellingErrors,
      });
      setScore(result?.data?.score);
      setShowResults(true);
      setAssignmentInProgress(false);
      setIsSubmitted(true);
      if (completionPopupType) {
        setPendingCompletionPopup(completionPopupType);
      }
    } catch (error) {
      toast.error(error?.data?.message)
    } finally {
      setIsSubmitting(false);
    }
  };

  const storeAssignmentData = async (finalScore, mappedMatchingAnswers, paragraphMetrics = null) => {
    const currentMaxAttempts = activeAssignment?.max_attempt || 1;

    if (attemptsRemaining <= 0) {
      toast.error("You have exhausted all allowed attempts for this assignment.");
      return;
    }

    const passingScore = activeAssignment.passing_score || 0;
    const isPassed = activeAssignment.category === "regular" ? true : finalScore >= passingScore;

    const newTriedAttempts = triedAttempts + 1;
    setTriedAttempts(newTriedAttempts);

    const newAttemptsRemaining = currentMaxAttempts - newTriedAttempts;
    setAttemptsRemaining(newAttemptsRemaining >= 0 ? newAttemptsRemaining : 0);

    if (newAttemptsRemaining <= 0) {
      setAttemptsExhausted(true);
    }

    const assignmentCompletionData = {
      userId,
      assignmentId: activeAssignment.id,
      isCompleted: true,
      status: isPassed ? "Completed" : "Incomplete",
      score: finalScore,
      tried_attempts: newTriedAttempts,
      updated_by: userId,
      created_by: userId,
      individualScores,
      ...(activeAssignment.category === "paragraph_writing" && {
        typingSpeed: paragraphMetrics?.typingSpeed ?? typingSpeed,
        typingEfficiency: paragraphMetrics?.typingEfficiency ?? typingEfficiency,
        backspaceCount,
        spellingErrorCount: spellingErrors.length,
      }),
      courseId: courseId,
      moduleId: moduleId,
    };

    try {
      const response = await createAssignmentCompletion({
        completionData: assignmentCompletionData,
        access_token,
      }).unwrap();

      const id = response.id;
      setCompletionId(id);

      const assignmentAnswersData = [];

      activeAssignment.TrueFalseQuestions.forEach((question) => {
        assignmentAnswersData.push({
          assignmentCompletionId: id,
          questionId: question.id,
          selectedAnswer: userAnswers[question.id],
          updated_by: userId,
          created_by: userId,
        });
      });

      Object.keys(mappedMatchingAnswers).forEach((questionId) => {
        const questionAnswers = mappedMatchingAnswers[questionId];
        questionAnswers.forEach(({ optionText, matchText }) => {
          assignmentAnswersData.push({
            assignmentCompletionId: id,
            questionId: questionId,
            selectedAnswer: `${optionText}<->${matchText}`,
            updated_by: userId,
            created_by: userId,
          });
        });
      });

      Object.keys(blanksAnswers).forEach((questionId) => {
        const formattedAnswers = blanksAnswers[questionId].map(ans => ans.trim());
        const question = activeAssignment.FillTheBlanksQuestions.find(q => q.id === parseInt(questionId) || q.id === questionId);
        const delimiter = "|||";

        assignmentAnswersData.push({
          assignmentCompletionId: id,
          questionId: questionId,
          selectedAnswer: formattedAnswers.join(delimiter),
          updated_by: userId,
          created_by: userId,
        });
      });

      Object.keys(paragraphAnswers).forEach((questionId) => {
        const answerText = paragraphAnswers[questionId];
        const metricSpellingErrors = Array.isArray(paragraphMetrics?.spellingErrors)
          ? paragraphMetrics.spellingErrors
          : (Array.isArray(spellingErrors) ? spellingErrors : []);

        // Construct paragraph metadata with all metrics
        const paragraphMetadata = {
          typingSpeed: paragraphMetrics?.typingSpeed ?? typingSpeed ?? 0,
          typingEfficiency: paragraphMetrics?.typingEfficiency ?? typingEfficiency ?? 0,
          backspaceCount: backspaceCount || 0,
          spellingErrorCount: metricSpellingErrors.length,
          spellingErrors: metricSpellingErrors,
          submittedAt: new Date().toISOString(),
        };

        assignmentAnswersData.push({
          assignmentCompletionId: id,
          questionId: questionId,
          selectedAnswer: answerText,
          paragraph_meta_data: paragraphMetadata,
          updated_by: userId,
          created_by: userId,
        });
      });

      if (assignmentAnswersData.length > 0) {
        await createAssignmentResponse({
          responseData: assignmentAnswersData,
          access_token,
        }).unwrap();
      }

      let completionPopupType = null;

      if (response?.courseCompletionStatus?.courseCompleted) {
        refetchSessions();
        refetchModules();
        completionPopupType = "certificate";
      } else if (response?.sessionCompletionStatus?.sessionCompleted) {
        refetchSessions();
        refetchModules();
        completionPopupType = "session";
      } else if (response?.moduleCompletionStatus?.isModuleCompleted) {
        refetchModules();
        completionPopupType = "module";
      }

      await refetchAssignmentData();
      await refetchTopics();
      await refetchAssignmentCompletion();

      dispatch(addCompletion(response));
      return completionPopupType;

    } catch (error) {
      toast.error("Failed to submit assignment. Please try again.");
      return null;
    }
  };

  const renderTrueFalseResponses = () => {
    if (!activeAssignment?.TrueFalseQuestions?.length) {
      return <div className="text-gray-500">No true/false questions available</div>;
    }

    return activeAssignment.TrueFalseQuestions.map((question) => (
      <div
        key={question.id}
        className="bg-gray-50 p-2 sm:p-4 rounded-lg border border-gray-100"
      >
        <p className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
          {question.question_text}
        </p>
        <div className="flex flex-col space-y-2 text-sm sm:text-base">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="text-gray-600 sm:w-32">Your Answer:</span>
            <span
              className={`font-medium ${userAnswers[question.id] === question.correct_answer
                ? "text-green-600"
                : "text-red-600"
                }`}
            >
              {userAnswers[question.id] ? "True" : "False"}
            </span>
            {userAnswers[question.id] === question.correct_answer ? (
              <FaCheckCircle className="w-4 h-4 text-green-500 ml-0 sm:ml-2 inline-block" />
            ) : (
              <FaTimesCircle className="w-4 h-4 text-red-500 ml-0 sm:ml-2 inline-block" />
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="text-gray-600 sm:w-32">Correct Answer:</span>
            <span className="font-medium text-green-600">
              {question.correct_answer ? "True" : "False"}
            </span>
          </div>
        </div>
      </div>
    ));
  };

  const renderMatchingResponses = () => {
    return activeAssignment.MatchingQuestions.map((question) => (
      <div
        key={question.id}
        className="bg-gray-50 p-2 sm:p-4 rounded-lg border border-gray-100"
      >
        <p className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">
          {question.question_text}
        </p>
        <div className="space-y-3">
          {question.MatchingOptions.map((option) => (
            <div
              key={option.id}
              className="bg-white p-3 rounded-lg border border-gray-100"
            >
              <div className="flex flex-col space-y-2 text-sm sm:text-base">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-gray-600 sm:w-32">Option:</span>
                  <div className="flex-1">
                    {option.option_type === "image" ? (
                      <img
                        src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${option.option_text || "/placeholder.png"}`}
                        alt={`Option ${option.option_text}`}
                        className="h-10 w-10 sm:h-12 sm:w-12 object-cover rounded"
                      />
                    ) : (
                      <span className="font-medium text-gray-800">
                        {option.option_text}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-gray-600 sm:w-32">Your Match:</span>
                  <div className="flex items-center flex-1">
                    {matchingAnswers[question.id]?.[option.option_text] ? (
                      option.match_type === "image" ? (
                        <img
                          src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${matchingAnswers[question.id]?.[option.option_text] || "/placeholder.png"}`}
                          alt={`Your Match ${matchingAnswers[question.id]?.[option.option_text]}`}
                          className="h-10 w-10 sm:h-12 sm:w-12 object-cover rounded mr-2"
                        />
                      ) : (
                        <span
                          className={`font-medium mr-2 ${matchingAnswers[question.id]?.[option.option_text] === option.match_text
                            ? "text-green-600"
                            : "text-red-600"
                            }`}
                        >
                          {matchingAnswers[question.id]?.[option.option_text]}
                        </span>
                      )
                    ) : (
                      <span className="font-medium text-gray-500 mr-2">Not answered</span>
                    )}
                    {matchingAnswers[question.id]?.[option.option_text] === option.match_text ? (
                      <FaCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      matchingAnswers[question.id]?.[option.option_text] && (
                        <FaTimesCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      )
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-gray-600 sm:w-32">Correct Match:</span>
                  <div className="flex-1">
                    {option.match_type === "image" ? (
                      <img
                        src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${option.match_text || "/placeholder.png"}`}
                        alt={`Correct Match ${option.match_text}`}
                        className="h-10 w-10 sm:h-12 sm:w-12 object-cover rounded"
                      />
                    ) : (
                      <span className="font-medium text-green-600">
                        {option.match_text}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  const renderBlanksResponses = () => {
    if (!activeAssignment?.FillTheBlanksQuestions?.length) {
      return <div className="text-gray-500">No fill-in-the-blanks questions available</div>;
    }

    return activeAssignment.FillTheBlanksQuestions.map((question) => {
      const userAnswers = blanksAnswers[question.id] || [];
      const correctAnswers = question.answers || [];

      const scoreData = blanksScores[question.id] || {};
      const isCorrect = scoreData.isCorrect || (
        Array.isArray(userAnswers) &&
        Array.isArray(correctAnswers) &&
        userAnswers.length === correctAnswers.length &&
        userAnswers.every((ans, i) => ans.trim().toLowerCase() == correctAnswers[i].trim().toLowerCase())
      ) || false;

      const cleanQuestion = decodeHtml(question.question_text);

      return (
        <div
          key={question.id}
          className={`bg-gray-50 p-2 sm:p-4 rounded-lg border ${isCorrect ? 'border-green-100' : 'border-red-100'}`}
        >
          <p className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">
            {cleanQuestion}
          </p>

          {scoreData?.attemptTime && (
            <p className="text-xs text-gray-500 italic mb-3">
              <FaClock className="inline mr-1" /> Attempted: {scoreData.attemptTime}
            </p>
          )}

          <div className="flex flex-col space-y-3 text-sm sm:text-base">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-gray-600 sm:w-32">Your Answers:</span>
              <div className="flex-1">
                <span
                  className={`font-medium ${isCorrect ? "text-green-600" : "text-red-600"}`}
                >
                  {userAnswers.length > 0
                    ? userAnswers.map(ans => decodeHtml(ans || '')).join(", ")
                    : "Not answered"}
                </span>
                {userAnswers.length > 0 && (
                  isCorrect ? (
                    <FaCheckCircle className="w-4 h-4 text-green-500 ml-2 inline-block" />
                  ) : (
                    <FaTimesCircle className="w-4 h-4 text-red-500 ml-2 inline-block" />
                  )
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-gray-600 sm:w-32">Correct Answers:</span>
              <div className="flex-1">
                <span className="font-medium text-green-600">
                  {correctAnswers.map(ans => decodeHtml(ans || '')).join(", ")}
                </span>
              </div>
            </div>

            {userAnswers.length > 0 && correctAnswers.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Answer Details:</p>
                <div className="space-y-2">
                  {userAnswers.map((userAnswer, index) => {
                    const correctAnswer = correctAnswers[index];
                    const isMatch = userAnswer && correctAnswer &&
                      userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

                    return (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 ml-0 sm:ml-2">
                        <span className="text-xs text-gray-500 sm:w-8">#{index + 1}:</span>
                        <div className="flex-1 flex flex-wrap items-center gap-1">
                          <span className={isMatch ? "text-green-600" : "text-red-600"}>
                            {decodeHtml(userAnswer || 'No answer')}
                          </span>
                          {isMatch ? (
                            <FaCheckCircle className="w-3 h-3 text-green-500 ml-1 inline-block" />
                          ) : (
                            <>
                              <FaTimesCircle className="w-3 h-3 text-red-500 ml-1 inline-block" />
                              <span className="text-xs text-gray-600 ml-2">
                                (Correct: {decodeHtml(correctAnswer || 'No expected answer')})
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  const renderParagraphResponses = () => {
    if (!activeAssignment?.ParagraphWritings || !activeAssignment.ParagraphWritings.length) {
      return <div className="text-gray-500">No paragraph writing questions available</div>;
    }

    try {
      return activeAssignment.ParagraphWritings.map((question) => {
        if (!question || typeof question !== 'object') {
          console.error("Invalid paragraph question object:", question);
          return <div className="text-red-500">Error loading paragraph question</div>;
        }

        const questionId = question.id;
        const userAnswer = paragraphAnswers[questionId] || "";
        const metadata = paragraphMetadata[questionId];

        return (
          <div
            key={questionId || 'unknown'}
            className="bg-gray-50 p-2 sm:p-4 rounded-lg border border-gray-100"
          >
            <p className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">
              {question.question_text || "No question text"}
            </p>

            {/* Typing Performance Metrics */}
            {metadata && (
              <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="text-center">
                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">WPM</div>
                  <div className="text-lg sm:text-xl font-bold text-blue-900">{metadata.typingSpeed || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Accuracy</div>
                  <div className="text-lg sm:text-xl font-bold text-blue-900">{Math.round(metadata.typingEfficiency || 0)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Errors</div>
                  <div className="text-lg sm:text-xl font-bold text-blue-900">{metadata.spellingErrorCount || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Backspace</div>
                  <div className="text-lg sm:text-xl font-bold text-blue-900">{metadata.backspaceCount || 0}</div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-100">
                <h5 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Your Answer:</h5>
                <p className="whitespace-pre-wrap text-gray-800 text-sm sm:text-base">
                  {userAnswer ? userAnswer : "No answer provided"}
                </p>
              </div>
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-100">
                <h5 className="font-medium text-green-700 mb-2 text-sm sm:text-base">Correct Answer:</h5>
                <p className="whitespace-pre-wrap text-green-800 text-sm sm:text-base">
                  {stripHtmlTags(question.paragraph) || "No model answer provided"}
                </p>
              </div>

              {/* Spelling Errors */}
              {metadata?.spellingErrors && metadata.spellingErrors.length > 0 && (
                <div className="bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-100">
                  <h5 className="font-medium text-orange-700 mb-2 text-sm sm:text-base">Spelling Errors:</h5>
                  <div className="text-orange-800 text-xs sm:text-sm space-y-1">
                    {metadata.spellingErrors.map((err, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <FaTimesCircle className="w-3 h-3 text-orange-500 flex-shrink-0" />
                        <span className="font-mono">{err}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      });
    } catch (error) {
      console.error("Error rendering paragraph responses:", error);
      return <div className="text-red-500">Error displaying paragraph responses</div>;
    }
  };

  const isSubmitDisabled = () => {
    if (!activeAssignment) {
      return true;
    }

    if (dueDate && new Date(dueDate) < new Date()) return true;

    if (attemptsRemaining <= 0 && triedAttempts > 0) {
      return true;
    }

    if (activeAssignment.category === "regular" && (activeAssignment.file != null || activeAssignment.description != null)) {
      return false;
    }

    const trueFalseCount = activeAssignment.TrueFalseQuestions?.length || 0;
    const matchingCount = activeAssignment.MatchingQuestions?.length || 0;
    const blanksCount = activeAssignment.FillTheBlanksQuestions?.length || 0;
    const paragraphCount = activeAssignment.ParagraphWritings?.length || 0;

    let trueFalseAnswered = true;
    let matchingAnswered = true;
    let blanksAnswered = true;
    let paragraphAnswered = true;

    if (trueFalseCount > 0) {
      trueFalseAnswered = Object.keys(userAnswers).length === trueFalseCount;
    }

    if (matchingCount > 0) {
      const matchingQuestionAnswered = Object.keys(matchingAnswers).length === matchingCount;

      if (matchingQuestionAnswered) {
        activeAssignment.MatchingQuestions?.forEach(question => {
          const options = question.MatchingOptions || [];
          const answered = matchingAnswers[question.id] || {};
          if (Object.keys(answered).length < options.length) {
            matchingAnswered = false;
          }
        });
      } else {
        matchingAnswered = false;
      }
    }

    if (blanksCount > 0) {
      blanksAnswered = activeAssignment.FillTheBlanksQuestions?.every(
        (question) => {
          return (
            blanksAnswers[question.id] &&
            blanksAnswers[question.id].every((answer) => answer && answer.trim() !== "")
          );
        }
      ) ?? true;
    }

    if (paragraphCount > 0) {
      paragraphAnswered = Object.keys(paragraphAnswers).length === paragraphCount && paragraphComplete;
    }

    return !(trueFalseAnswered && matchingAnswered && blanksAnswered && paragraphAnswered);
  };

  const debugFillInTheBlanks = () => {
    if (!activeAssignment?.FillTheBlanksQuestions || activeAssignment.FillTheBlanksQuestions.length === 0) {
      return;
    }

    activeAssignment.FillTheBlanksQuestions.forEach(question => {
      const userAnswer = blanksAnswers[question.id];
      if (userAnswer && question.answers) {
        userAnswer.forEach((ans, idx) => {
          if (idx < question.answers.length) {
            const match = ans.trim().toLowerCase() === question.answers[idx].trim().toLowerCase();
          } else {
            console.log(`Answer ${idx}: "${ans}" - No corresponding correct answer`);
          }
        });
      }
    });

    Object.keys(blanksAnswers).forEach(answerId => {
      const matchingQuestion = activeAssignment.FillTheBlanksQuestions.find(q => q.id == answerId);
      if (!matchingQuestion) {
        console.warn(`WARNING: Found answer for question ID ${answerId} but this question doesn't exist in the current assignment!`);
      }
    });
  };

  const handleReAttempt = (isReset) => {
    if (attemptsRemaining <= 0) {
      toast.error("You have exhausted all allowed attempts for this assignment.");
      return;
    }

    if (dueDate && new Date(dueDate) < new Date()) {
      toast.error("This assignment is past due. Request an extension to retake it.");
      return;
    }

    const currentAssignmentId = activeAssignment?.id;

    if (activeAssignment?.id && userId && isReset) {
      localStorage.removeItem(getAssignmentStorageKey(activeAssignment.id, userId));
    }

    setShowResults(false);
    setScore(0);
    setIsSubmitted(false);
    setAssignmentInProgress(true);
    setUserAnswers({});
    setBlanksAnswers({});
    setMatchingAnswers({});
    setParagraphAnswers({});
    setQuestionAttemptTimes({});
    setBlanksSubmitted(false);
    setMatchingSubmitted(false);
    setBlanksScores({});
    setMatchingScores({});
    setSpellingErrors([]);
    setTypingSpeed(0);
    setTypingEfficiency(0);
    setBackspaceCount(0);
    setIndividualScores({});
    setStartTime(null);
    setParagraphComplete(false);

    toast.info("You can now re-attempt this assignment.");
  };

  const continueLearningEligibility = useMemo(() => {
    const quizzesInCurrentModule = (Array.isArray(moduleQuizzes) ? moduleQuizzes : []).filter((quiz) => {
      if (!quiz) return false;
      if (!moduleId || !quiz.module_id) return true;
      return String(quiz.module_id) === String(moduleId);
    });

    if (quizzesInCurrentModule.length === 0) {
      return {
        canContinue: true,
        pendingQuizCount: 0,
        compulsoryNotPassedCount: 0,
      };
    }

    // Keep latest attempt by quizId
    const latestCompletionByQuizId = {};
    (Array.isArray(quizCompletionData) ? quizCompletionData : []).forEach((completion) => {
      if (!completion?.quizId) return;
      const key = String(completion.quizId);
      const ts = new Date(
        completion.updatedAt || completion.lastAttemptTime || completion.createdAt || 0
      ).getTime();
      if (!latestCompletionByQuizId[key] || ts > latestCompletionByQuizId[key].ts) {
        latestCompletionByQuizId[key] = { data: completion, ts };
      }
    });

    let pendingQuizCount = 0;
    let compulsoryNotPassedCount = 0;

    quizzesInCurrentModule.forEach((quiz) => {
      const latestCompletion = latestCompletionByQuizId[String(quiz.id)]?.data;
      const completionStatus = String(latestCompletion?.status || "").toLowerCase();

      const isCompletedByQuizFlag = quiz?.isCompleted === 1 || quiz?.isCompleted === true;
      const isCompletedByAttempt =
        completionStatus === "passed" ||
        completionStatus === "failed" ||
        Number(latestCompletion?.triedAttempts || 0) > 0;
      const isQuizCompleted = isCompletedByQuizFlag || isCompletedByAttempt;

      if (!isQuizCompleted) {
        pendingQuizCount += 1;
      }

      const isCompulsory = quiz?.isQuizCompulsory === 1 || quiz?.isQuizCompulsory === true;
      const isPassed =
        isCompletedByQuizFlag ||
        completionStatus === "passed" ||
        latestCompletion?.isCompleted === true;

      if (isCompulsory && !isPassed) {
        compulsoryNotPassedCount += 1;
      }
    });

    return {
      canContinue: true,
      pendingQuizCount,
      compulsoryNotPassedCount,
    };
  }, [moduleQuizzes, quizCompletionData, moduleId]);
  const handleStartAssignment = async () => {
    try {
      const daysToComplete = activeAssignment.days_to_complete || 7;
      const newDueDate = new Date();
      newDueDate.setTime(newDueDate.getTime() + daysToComplete * 24 * 60 * 60 * 1000);

      const dueDatePromises = {
        user_id: userId,
        assignment_id: activeAssignment.id,
        due_date: newDueDate.toISOString(),
        status: "Incomplete"
      };

      await createDueDateOfAssignments({
        dueDateData: dueDatePromises,
        access_token
      }).unwrap();

      setDueDate(newDueDate.toISOString());
      setShowStartPopup(false);

      if (typeof refetchAssignmentData === 'function') refetchAssignmentData();
    } catch (error) {
      console.error('Failed to set assignment due date:', error);
      toast.error("Failed to start assignment. Please try again.");
    }
  };

  // If the assignment has not been started, display the popup before anything else
  if (showStartPopup) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-white rounded-2xl shadow-sm border border-slate-200 p-8 m-4 lg:m-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaClipboardList className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Start Assignment</h2>
          <p className="text-slate-600">
            You are about to start the assignment <strong>{activeAssignment?.title || "Assignment"}</strong>.
          </p>
          <div className="bg-slate-50 p-6 rounded-xl text-sm text-slate-700 text-left space-y-4 border border-slate-100">
            <div className="flex items-start gap-3">
              <FaClock className="mt-1 text-slate-400 w-4 h-4" />
              <span>You will have <strong>{activeAssignment?.days_to_complete || 7} days</strong> to complete this assignment.</span>
            </div>
            <div className="flex items-start gap-3">
              <FaCheckCircle className="mt-1 text-slate-400 w-4 h-4" />
              <span>The due date will be generated starting from this exact moment.</span>
            </div>
            <div className="flex items-start gap-3">
              <FaLightbulb className="mt-1 text-slate-400 w-4 h-4" />
              <span>Make sure you are ready to start before proceeding.</span>
            </div>
          </div>
          <button
            onClick={handleStartAssignment}
            className="w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold rounded-xl transition-colors duration-200 mt-4 shadow-sm"
          >
            Start Now
          </button>
        </div>
      </div>
    );
  }

  if (showResults) {
    const total = activeAssignment?.max_score || 0;
    const percentage = total ? Math.round((score / total) * 100) : 0;
    const passed = score >= activeAssignment.passing_score;
    const attemptsTotal = maxAttempts || activeAssignment?.max_attempt || 1;
    const dueDateValue = dueDate ? new Date(dueDate) : null;
    const hasValidDueDate = Boolean(dueDateValue && !Number.isNaN(dueDateValue.getTime()));
    const isAssignmentPastDue = Boolean(hasValidDueDate && dueDateValue.getTime() < Date.now());
    const formattedDueDate = hasValidDueDate ? dueDateValue.toLocaleString() : null;
    const canReAttempt = attemptsRemaining > 0 && !isAssignmentPastDue;
    const isRegularAssignment = activeAssignment?.category === 'regular';

    let questions = [];
    if (activeAssignment?.category === 'true_false') {
      questions = activeAssignment.TrueFalseQuestions || [];
    } else if (activeAssignment?.category === 'fill_in_the_blanks') {
      questions = activeAssignment.FillTheBlanksQuestions || activeAssignment.FillInTheBlanks || [];
    } else if (activeAssignment?.category === 'matching') {
      questions = activeAssignment.MatchingQuestions || [];
    } else if (activeAssignment?.category === 'paragraph_writing') {
      questions = activeAssignment.ParagraphWritings || [];
    }

    return (
      <div className="h-auto bg-white">
        <div className={`mx-3 sm:mx-6 h-full ${isRegularAssignment ? 'flex justify-center' : ''}`}>
          <div className={`w-full ${isRegularAssignment ? 'max-w-2xl' : ''}`}>
            <div className={isRegularAssignment ? 'flex justify-center' : 'flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-8 h-full'}>
              {/* Left Column - Summary Card */}
              <div className={isRegularAssignment ? 'w-full' : 'lg:col-span-4'}>
                <div className="lg:sticky lg:top-4">
                  <div className="flex items-center gap-3 mb-3 mt-3 lg:mt-5">
                    <div className="w-8 h-8 lg:w-12 lg:h-12 bg-blue-50 text-blue-600 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                      <FaTrophy className="w-4 h-4 lg:w-6 lg:h-6" />
                    </div>
                    <div>
                      <h1 className="text-base lg:text-lg font-bold text-slate-900">Assignment Completed</h1>
                      <p className="text-slate-500 text-[11px] lg:text-xs leading-tight">
                        Here's a summary of your performance based on your latest attempt.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center mb-4 pt-4 lg:pt-6 border-t border-slate-100">
                    <div className="flex-1 text-center border-r border-slate-100 px-2 lg:px-4">
                      <div className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 lg:mb-1">Final Score</div>
                      <div className="text-xl lg:text-2xl font-bold text-slate-900">{score}/{total}</div>
                    </div>
                    <div className="flex-1 text-center px-2 lg:px-4">
                      <div className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 lg:mb-1">Status</div>
                      <div className={`text-xl lg:text-2xl font-bold ${passed ? 'text-emerald-500' : 'text-red-500'}`}>
                        {passed ? 'Passed' : 'Failed'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center mb-6 lg:mb-10 pt-4 lg:pt-6 border-t border-slate-100">
                    <div className="flex-1 text-center border-r border-slate-100 px-2 lg:px-4">
                      <div className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 lg:mb-1">Total Attempts</div>
                      <div className="text-xl lg:text-2xl font-bold text-slate-900">{maxAttempts}</div>
                    </div>
                    <div className="flex-1 text-center px-2 lg:px-4">
                      <div className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 lg:mb-1">Used Attempts</div>
                      <div className="text-xl lg:text-2xl font-bold text-slate-900">{triedAttempts}</div>
                    </div>
                  </div>

                  {hasValidDueDate && (
                    <div className={`mb-4 lg:mb-6 rounded-xl border px-4 py-3 lg:px-5 lg:py-4 flex items-center justify-between gap-3 ${isAssignmentPastDue ? 'border-red-100 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isAssignmentPastDue ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600'}`}>
                          <FaHistory className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Due Date</div>
                          <div className={`text-xs lg:text-sm font-semibold truncate ${isAssignmentPastDue ? 'text-red-700' : 'text-slate-700'}`} title={formattedDueDate || ''}>
                            {formattedDueDate}
                          </div>
                        </div>
                      </div>
                      <span className={`text-[10px] lg:text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex-shrink-0 ${isAssignmentPastDue ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isAssignmentPastDue ? 'Overdue' : 'Active'}
                      </span>
                    </div>
                  )}

                  {isAssignmentPastDue ? (
                    <div className="bg-red-50 border border-red-100 rounded-lg lg:rounded-xl p-3 lg:p-4">
                      <h3 className="font-semibold text-red-900 text-xs sm:text-sm mb-2 flex items-center gap-2">
                        <FaExclamationTriangle className="w-3.5 h-3.5 text-red-600" />
                        Assignment Past Due
                      </h3>
                      <p className="text-red-600 text-xs lg:text-sm mb-3">
                        {currentAssignmentRequest
                          ? 'Your extension request is being reviewed by admin.'
                          : remainingExtensions > 0
                            ? 'This assignment is past its due date. Request an extension to reopen it.'
                            : extensionLimit > 0
                              ? 'This assignment is past its due date and all extension requests have been used.'
                              : 'This assignment is past its due date. You can no longer submit.'}
                      </p>
                      {currentAssignmentRequest ? (
                        <div className="text-xs sm:text-sm font-medium text-yellow-600">
                          Extension Request Status: Pending
                        </div>
                      ) : remainingExtensions > 0 ? (
                        <button
                          onClick={handleExtensionRequest}
                          className="inline-flex items-center px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 text-xs sm:text-sm"
                        >
                          <FaEnvelope className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          Request Extension ({remainingExtensions} remaining)
                        </button>
                      ) : extensionLimit > 0 ? (
                        <div className="text-xs sm:text-sm font-medium text-red-600">
                          All {extensionLimit} extension request{extensionLimit > 1 ? 's' : ''} have been used.
                        </div>
                      ) : null}
                    </div>
                  ) : canReAttempt ? (
                    <>
                      <button
                        onClick={() => handleReAttempt(false)}
                        className="w-full bg-blue-600 text-white font-semibold py-2.5 lg:py-3 px-3 lg:px-4 rounded-lg lg:rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 mb-2 lg:mb-3 text-sm lg:text-base"
                      >
                        <FaRedo className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                        Retake Assignment
                      </button>

                      <p className="text-center text-[11px] lg:text-xs text-slate-400">
                        Note: Retaking will consume one of your remaining attempts.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="bg-red-50 border border-red-100 rounded-lg lg:rounded-xl p-3 lg:p-4 text-center">
                        <p className="text-red-600 font-medium text-xs lg:text-sm">
                          All attempts have been used for this assignment.
                        </p>
                      </div>
                    </>
                  )}

                  {isRegularAssignment && typeof onContinueLearning === 'function' && (
                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-xl p-4 lg:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex-1 text-center sm:text-left">
                          <h3 className="text-sm lg:text-base font-bold text-slate-900 mb-1">Ready to continue?</h3>
                          <p className="text-xs lg:text-sm text-slate-500">
                            {continueLearningEligibility.pendingQuizCount > 0 || continueLearningEligibility.compulsoryNotPassedCount > 0
                              ? `Move to next item.`
                              : "Move on to the next topic in your learning path."}
                          </p>
                        </div>
                        <button
                          onClick={handleContinueLearning}
                          className="flex items-center justify-center gap-2 font-semibold px-5 py-2.5 rounded-xl text-sm lg:text-base transition-all duration-200 shadow-sm w-full sm:w-auto flex-shrink-0 bg-primary text-white hover:bg-primary/90 active:scale-95"
                        >
                          <FaPlayCircle className="w-4 h-4" />
                          Continue Learning
                          <FaArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Detailed Breakdown */}
              {!isRegularAssignment && (
                <div className="lg:col-span-8 lg:border-l lg:border-slate-100 h-full overflow-y-auto scrollbar-hide pb-16 lg:pb-0">
                  <div className="mx-2 sm:mx-6">
                    <div className="sticky top-0 bg-white z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 py-2 lg:py-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-100 p-1.5 lg:p-2 rounded-lg">
                          <FaClipboardList className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-gray-600" />
                        </div>
                        <div>
                          <h2 className="text-sm lg:text-lg font-bold text-slate-900">Your Responses</h2>
                          <p className="text-[10px] lg:text-xs text-slate-500">Detailed answer breakdown</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        {activeAssignment?.category === 'paragraph_writing' ? (
                          <>
                            <div className="text-[9px] lg:text-xs font-bold text-slate-500 bg-slate-50 px-1.5 lg:px-3 py-1 lg:py-1.5 rounded-md lg:rounded-lg border border-slate-100 uppercase tracking-wider">
                              Speed: <span className="text-slate-900">{typingSpeed} WPM</span>
                            </div>
                            <div className="text-[9px] lg:text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 lg:px-3 py-1 lg:py-1.5 rounded-md lg:rounded-lg border border-emerald-100 uppercase tracking-wider">
                              Accuracy: <span className="text-emerald-700">{Math.round(typingEfficiency)}%</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-[11px] lg:text-sm font-medium text-slate-500">
                            {questions.length} Questions
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 lg:mt-10 mx-0 sm:mx-1">
                      {questions.map((question, index) => {
                        const userAnswer = userAnswers[question.id];
                        let isCorrect = false;
                        let correctText = '';
                        let userText = '';

                        if (activeAssignment.category === 'true_false') {
                          isCorrect = userAnswer === (question.answer === 1);
                          correctText = question.answer === 1 ? 'True' : 'False';
                          userText = userAnswer === true ? 'True' : 'False';
                          if (userAnswer === undefined) userText = 'Not Answered';
                        } else if (activeAssignment.category === 'fill_in_the_blanks') {
                          const scoreInfo = blanksScores[question.id] || {};
                          const userAns = blanksAnswers[question.id] || blanksAnswers[String(question.id)] || [];
                          const correctAnswers = question.answers || question.answer || question.blanks?.map(b => b.answer) || [];
                          const normalize = (value) => decodeHtml(String(value || ''))
                            .replace(/\s+/g, ' ')
                            .trim()
                            .toLowerCase();

                          const normalizedUserAnswers = Array.isArray(userAns) ? userAns.map(normalize) : [];
                          const normalizedCorrectAnswers = Array.isArray(correctAnswers) ? correctAnswers.map(normalize) : [];
                          const hasExactAnswerMatch =
                            normalizedUserAnswers.length > 0 &&
                            normalizedUserAnswers.length === normalizedCorrectAnswers.length &&
                            normalizedUserAnswers.every((ans, i) => ans === normalizedCorrectAnswers[i]);

                          // Never force incorrect solely from stale/missing score cache.
                          isCorrect = scoreInfo.isCorrect === true || hasExactAnswerMatch;
                          correctText = Array.isArray(correctAnswers) ? correctAnswers.map(ans => decodeHtml(ans || '')).join(', ') : '';
                          userText = Array.isArray(userAns) ? userAns.map(ans => decodeHtml(ans || '')).join(', ') : 'Not Answered';
                          if (!userText) userText = 'Not Answered';
                        } else if (activeAssignment.category === 'matching') {
                          const scoreInfo = matchingScores[question.id] || {};
                          isCorrect = scoreInfo.correctMatches === scoreInfo.totalMatches;
                          const userAnswer = matchingAnswers[question.id] || {};
                          const userPairs = [];
                          const correctPairs = [];
                          question.MatchingOptions?.forEach(opt => {
                            userPairs.push(`${opt.option_text}: ${userAnswer[opt.option_text] || 'None'}`);
                            correctPairs.push(`${opt.option_text}: ${opt.match_text}`);
                          });
                          userText = userPairs.join(' | ');
                          correctText = correctPairs.join(' | ');
                        } else if (activeAssignment.category === 'paragraph_writing') {
                          isCorrect = true;
                          userText = paragraphAnswers[question.id] || "No response provided";
                          correctText = question.paragraph || "No model answer provided";
                        }

                        if (activeAssignment.category === 'paragraph_writing') {
                          const typedText = paragraphAnswers[question.id] || "";
                          const originalText = stripHtmlTags(question.paragraph || "").trim().replace(/\s+/g, ' ');
                          const cleanTypedText = typedText.trim().replace(/\s+/g, ' ');
                          const originalWords = originalText.split(/\s+/);
                          const typedWords = cleanTypedText.split(/\s+/);

                          const errors = [];
                          typedWords.forEach((word, wordIndex) => {
                            if (wordIndex < originalWords.length && word) {
                              if (word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") !== originalWords[wordIndex].toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")) {
                                errors.push({
                                  wrong: word,
                                  right: originalWords[wordIndex]
                                });
                              }
                            }
                          });

                          return (
                            <div key={question.id} className="mb-5 lg:mb-10 last:mb-0">
                              <div className="flex flex-col sm:flex-row items-baseline gap-1.5 sm:gap-0 mb-3">
                                <span className="text-slate-900 font-bold text-sm lg:text-lg min-w-[1.5rem]">{index + 1}.</span>
                                <div className="flex-1 w-full">
                                  <h3 className="text-slate-800 font-medium text-sm lg:text-lg leading-snug mb-3 lg:mb-5">
                                    {question.question || question.question_text || "Writing Performance Analysis"}
                                  </h3>

                                  <div className="mb-4 lg:mb-8">
                                    <div className="text-[9px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 lg:mb-4 flex items-center gap-1.5">
                                      <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full bg-emerald-400"></div>
                                      Original Paragraph
                                    </div>
                                    <p className="text-slate-500 leading-relaxed whitespace-pre-wrap text-xs lg:text-base">
                                      {stripHtmlTags(question.paragraph) || "No original content available"}
                                    </p>
                                  </div>

                                  <div className="mb-4 lg:mb-8">
                                    <div className="text-[9px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 lg:mb-4 flex items-center gap-1.5">
                                      <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full bg-blue-400"></div>
                                      Your Submission
                                    </div>
                                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap text-xs lg:text-base">
                                      {typedText || "No response provided"}
                                    </p>
                                  </div>

                                  {errors.length > 0 && (
                                    <div>
                                      <div className="text-[9px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 lg:mb-4 flex items-center gap-1.5">
                                        <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full bg-orange-400"></div>
                                        Spelling & Accuracy Corrections
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 lg:gap-3">
                                        {errors.map((error, errIndex) => (
                                          <div key={errIndex} className="flex items-center gap-1.5 lg:gap-3 text-[11px] lg:text-sm bg-white border border-slate-100 p-2 lg:p-3.5 rounded-lg lg:rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] border-l-4 border-l-orange-400">
                                            <div className="flex-1 flex items-center flex-wrap gap-0.5 lg:gap-2">
                                              <span className="text-slate-400 font-medium line-through decoration-slate-300">{error.wrong}</span>
                                              <FaArrowRight className="w-2 h-2 lg:w-2.5 lg:h-2.5 text-slate-300" />
                                              <span className="text-emerald-600 font-bold">{error.right}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={question.id} className="mb-4 lg:mb-8 last:mb-0">
                            <div className="flex items-baseline mb-1.5 lg:mb-2">
                              <span className="text-slate-900 font-bold text-sm lg:text-lg min-w-[1.25rem]">{index + 1}.</span>
                              <h3 className="text-slate-800 font-medium text-xs lg:text-lg leading-snug">
                                {question.question || question.question_text}
                              </h3>
                            </div>

                            <div className="pl-3 lg:pl-6">
                              {activeAssignment.category === 'matching' ? (
                                <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-3 pt-1 lg:pt-2">
                                  {question.MatchingOptions?.map((opt, optIndex) => {
                                    const userAnswer = matchingAnswers[question.id] || matchingAnswers[String(question.id)] || {};
                                    const selectedMatch = userAnswer[opt.option_text];
                                    const isMatchCorrect = selectedMatch === opt.match_text;

                                    return (
                                      <div key={optIndex} className="py-2 lg:py-3 border-b border-slate-50">
                                        <div className="grid grid-cols-[80px_1fr] lg:grid-cols-[120px_1fr] gap-x-1.5 lg:gap-x-3 gap-y-1 lg:gap-y-2 text-[11px] lg:text-sm">

                                          {/* OPTION */}
                                          <div className="text-slate-400 font-medium">Option:</div>
                                          <div className="text-slate-900 font-bold break-words text-xs lg:text-sm">
                                            {opt.option_type === "image" ? (
                                              <img
                                                src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${opt.option_text || "/placeholder.png"}`}
                                                alt="option"
                                                className="w-16 h-16 object-cover rounded"
                                              />
                                            ) : (
                                              opt.option_text
                                            )}
                                          </div>

                                          {/* YOUR MATCH */}
                                          <div className="text-slate-400 font-medium">Your Match:</div>
                                          <div
                                            className={`font-bold flex items-center gap-1.5 lg:gap-2 ${isMatchCorrect ? "text-emerald-500" : "text-red-500"
                                              } break-words text-xs lg:text-sm`}
                                          >
                                            {selectedMatch && isImage(selectedMatch) ? (
                                              <img
                                                src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${selectedMatch || "/placeholder.png"}`}
                                                alt="your-match"
                                                className="w-16 h-16 object-cover rounded"
                                              />
                                            ) : (
                                              selectedMatch || "No match selected"
                                            )}

                                            {isMatchCorrect ? (
                                              <FaCheckCircle className="w-2.5 h-2.5 lg:w-4 lg:h-4 flex-shrink-0" />
                                            ) : (
                                              <FaTimesCircle className="w-2.5 h-2.5 lg:w-4 lg:h-4 flex-shrink-0" />
                                            )}
                                          </div>

                                          {/* CORRECT MATCH */}
                                          {!isMatchCorrect && (
                                            <>
                                              <div className="text-slate-400 font-medium">Correct Match:</div>
                                              <div className="text-emerald-500 font-bold break-words text-xs lg:text-sm">
                                                {opt.match_type === "image" ? (
                                                  <img
                                                    src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${opt.match_text || "/placeholder.png"}`}
                                                    alt="correct-match"
                                                    className="w-16 h-16 object-cover rounded"
                                                  />
                                                ) : (
                                                  opt.match_text
                                                )}
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="grid grid-cols-[90px_1fr] lg:grid-cols-[120px_1fr] gap-y-1.5 lg:gap-y-2 text-[11px] lg:text-sm">
                                  <div className="text-slate-400 font-medium">Your Answer:</div>
                                  <div className={`font-semibold flex items-center gap-1.5 lg:gap-2 ${isCorrect ? 'text-green-600' : 'text-red-600'} break-words text-xs lg:text-sm`}>
                                    {userText}
                                    {isCorrect ? (
                                      <FaCheckCircle className="w-2.5 h-2.5 lg:w-4 lg:h-4 flex-shrink-0" />
                                    ) : (
                                      <FaTimesCircle className="w-2.5 h-2.5 lg:w-4 lg:h-4 flex-shrink-0" />
                                    )}
                                  </div>

                                  {!isCorrect && (
                                    <>
                                      <div className="text-slate-400 font-medium">Correct Answer:</div>
                                      <div className="text-slate-800 font-medium break-words text-xs lg:text-sm">
                                        {correctText}
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}

                              {question.explanation && (
                                <div className="mt-2 lg:mt-4 pt-1.5 lg:pt-3">
                                  <div className="text-[9px] lg:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5 lg:mb-1">Explanation:</div>
                                  <p className="text-slate-600 text-[11px] lg:text-sm leading-relaxed">
                                    {question.explanation}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {questions.length === 0 && (
                        <div className="text-center py-6 lg:py-12 text-slate-400 text-xs lg:text-base">
                          Detailed review logic for {activeAssignment.category.replace(/_/g, ' ')} is coming soon.
                        </div>
                      )}

                      {/* Continue Learning - Bottom of answers list */}
                      {typeof onContinueLearning === 'function' && (
                        <div className="mt-8 lg:mt-12 pt-6 border-t border-slate-100">
                          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-xl p-4 lg:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex-1 text-center sm:text-left">
                              <h3 className="text-sm lg:text-base font-bold text-slate-900 mb-1">Ready to continue?</h3>
                              <p className="text-xs lg:text-sm text-slate-500">
                                {continueLearningEligibility.pendingQuizCount > 0 || continueLearningEligibility.compulsoryNotPassedCount > 0
                                  ? `Move to next item.`
                                  : "Move on to the next topic in your learning path."}
                              </p>
                            </div>
                            <button
                              onClick={handleContinueLearning}
                              className="flex items-center justify-center gap-2 font-semibold px-5 py-2.5 rounded-xl text-sm lg:text-base transition-all duration-200 shadow-sm w-full sm:w-auto flex-shrink-0 bg-primary text-white hover:bg-primary/90 active:scale-95"
                            >
                              <FaPlayCircle className="w-4 h-4" />
                              Continue Learning
                              <FaArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${activeAssignment?.category === 'paragraph_writing' || activeAssignment?.category === 'matching' || activeAssignment?.category === 'fill_in_the_blanks' || activeAssignment?.category === 'true_false' || activeAssignment?.category === 'regular' ? 'h-[calc(100vh-62px)] overflow-hidden' : ''}`}>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className="z-[9999]"
      />

      {/* Instructions Modal Popup for Mobile/Tablet */}
      {isMobile && (
        <>
          {/* Instructions Modal */}
          {showInstructionsModal && (
            <div className="fixed inset-0 z-[2000] lg:hidden" onClick={() => setShowInstructionsModal(false)}>
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Instructions</h2>
                  <button
                    onClick={() => setShowInstructionsModal(false)}
                    className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <FaTimesCircle className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                <div className="p-4">
                  {/* Paragraph Writing Instructions */}
                  {activeAssignment?.category === 'paragraph_writing' && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">Carefully read the paragraph displayed above and retype it exactly as shown in the typing area below.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">Type word for word — spelling, capitalization, and spacing must match the given paragraph.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">Accuracy is calculated based on how many words match the original paragraph.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">Speed (WPM) shows how many words you type per minute, based on your typing time.</p>
                      </div>
                      {dueDate && (
                        <div className="flex items-start gap-3">
                          <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-600">
                            The assignment is due on <span className="font-semibold text-slate-900">{new Date(dueDate).toLocaleDateString('en-GB')}</span> at <span className="font-semibold text-slate-900">{new Date(dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>.
                          </p>
                        </div>
                      )}
                      {activeAssignment?.extension_limit > 0 && (
                        <div className="flex items-start gap-3">
                          <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-600">
                            You are allowed up to <span className="font-semibold text-slate-900">{activeAssignment.extension_limit}</span> extension request{activeAssignment.extension_limit > 1 ? 's' : ''} for this assignment.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Matching Instructions */}
                  {activeAssignment?.category === 'matching' && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">Click on an item (1, 2, 3...) from the left column to select it.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">Click on a corresponding match (A, B, C...) from the right column to connect them.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">To disconnect an item, simply click on the connected item or match again.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">Review all your connections before submitting the assignment.</p>
                      </div>
                      {dueDate && (
                        <div className="flex items-start gap-3">
                          <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-600">
                            The assignment is due on <span className="font-semibold text-slate-900">{new Date(dueDate).toLocaleDateString('en-GB')}</span> at <span className="font-semibold text-slate-900">{new Date(dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>.
                          </p>
                        </div>
                      )}
                      {activeAssignment?.extension_limit > 0 && (
                        <div className="flex items-start gap-3">
                          <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-600">
                            You are allowed up to <span className="font-semibold text-slate-900">{activeAssignment.extension_limit}</span> extension request{activeAssignment.extension_limit > 1 ? 's' : ''} for this assignment.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fill in the Blanks Instructions */}
                  {activeAssignment?.category === 'fill_in_the_blanks' && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">Read each sentence carefully and identify the missing word or phrase.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">Type your answer into the blank space provided.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">Double-check your spelling before submitting.</p>
                      </div>
                      {dueDate && (
                        <div className="flex items-start gap-3">
                          <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-600">
                            The assignment is due on <span className="font-semibold text-slate-900">{new Date(dueDate).toLocaleDateString('en-GB')}</span> at <span className="font-semibold text-slate-900">{new Date(dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>.
                          </p>
                        </div>
                      )}
                      {activeAssignment?.extension_limit > 0 && (
                        <div className="flex items-start gap-3">
                          <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-600">
                            You are allowed up to <span className="font-semibold text-slate-900">{activeAssignment.extension_limit}</span> extension request{activeAssignment.extension_limit > 1 ? 's' : ''} for this assignment.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* True/False Instructions */}
                  {activeAssignment?.category === 'true_false' && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">Read each statement carefully.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">Select whether the statement is True or False.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">Check your answers before submitting.</p>
                      </div>
                      {dueDate && (
                        <div className="flex items-start gap-3">
                          <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-600">
                            The assignment is due on <span className="font-semibold text-slate-900">{new Date(dueDate).toLocaleDateString('en-GB')}</span> at <span className="font-semibold text-slate-900">{new Date(dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>.
                          </p>
                        </div>
                      )}
                      {activeAssignment?.extension_limit > 0 && (
                        <div className="flex items-start gap-3">
                          <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-600">
                            You are allowed up to <span className="font-semibold text-slate-900">{activeAssignment.extension_limit}</span> extension request{activeAssignment.extension_limit > 1 ? 's' : ''} for this assignment.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Regular Assignment Instructions */}
                  {activeAssignment?.category === 'regular' && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">Please read the document attached.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">Complete the assignment as per the instructions in the document.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">Submit your work before the deadline.</p>
                      </div>
                      {dueDate && (
                        <div className="flex items-start gap-3">
                          <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-600">
                            The assignment is due on <span className="font-semibold text-slate-900">{new Date(dueDate).toLocaleDateString('en-GB')}</span> at <span className="font-semibold text-slate-900">{new Date(dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>.
                          </p>
                        </div>
                      )}
                      {activeAssignment?.extension_limit > 0 && (
                        <div className="flex items-start gap-3">
                          <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-600">
                            You are allowed up to <span className="font-semibold text-slate-900">{activeAssignment.extension_limit}</span> extension request{activeAssignment.extension_limit > 1 ? 's' : ''} for this assignment.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Attempt Summary for Mobile */}
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Attempt Summary</h3>
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                      <div className="text-center flex-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Total Attempts
                        </div>
                        <div className="text-xl font-bold text-slate-900">{maxAttempts}</div>
                      </div>
                      <div className="text-center flex-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Used Attempts
                        </div>
                        <div className={`text-xl font-bold ${triedAttempts >= maxAttempts ? "text-red-600" : "text-emerald-600"}`}>
                          {triedAttempts}
                        </div>
                      </div>
                      <div className="text-center flex-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Remaining
                        </div>
                        <div className={`text-xl font-bold ${attemptsRemaining > 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {attemptsRemaining}
                        </div>
                      </div>
                    </div>
                  </div>

                  {extensionLimit > 0 && (
                    <div className="mt-3 flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                      <div className="text-center flex-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Extension Limit
                        </div>
                        <div className="text-xl font-bold text-slate-900">{extensionLimit}</div>
                      </div>
                      <div className="text-center flex-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Remaining Extensions
                        </div>
                        <div className={`text-xl font-bold ${remainingExtensions > 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {remainingExtensions}
                        </div>
                      </div>
                    </div>
                  )}

                  {attemptsExhausted && (!dueDate || new Date(dueDate) >= new Date()) && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <div className="flex-shrink-0 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                          <FaExclamationTriangle className="w-2.5 h-2.5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-red-900 text-xs">Attempts Exhausted</h4>
                          <p className="text-red-700 text-xs">You have used all allowed attempts for this assignment.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className={`${activeAssignment?.category === 'paragraph_writing' || activeAssignment?.category === 'matching' || activeAssignment?.category === 'fill_in_the_blanks' || activeAssignment?.category === 'true_false' || activeAssignment?.category === 'regular' ? 'w-full h-full' : 'mx-auto mt-4 sm:mt-6 px-4 sm:px-0'}`}>
        <div className={`flex flex-col lg:flex-row ${activeAssignment?.category === 'paragraph_writing' || activeAssignment?.category === 'matching' || activeAssignment?.category === 'fill_in_the_blanks' || activeAssignment?.category === 'true_false' || activeAssignment?.category === 'regular' ? 'h-full' : 'gap-4 sm:gap-6'}`}>

          {/* Left Column - Assignment Content - Scrollable */}
          <div className={`flex-1 min-w-0 ${activeAssignment?.category === 'paragraph_writing'
            ? 'px-4 sm:px-6 py-4 sm:py-6 h-full overflow-hidden flex flex-col pb-32 lg:pb-6'
            : activeAssignment?.category === 'matching' || activeAssignment?.category === 'fill_in_the_blanks' || activeAssignment?.category === 'true_false' || activeAssignment?.category === 'regular'
              ? 'px-4 sm:px-6 py-4 sm:py-6 h-full overflow-y-auto lg:pb-6 mb-10 lg:mb-0'
              : 'px-4 sm:px-6 py-4 sm:py-6'
            }`}>

            <div className="flex-1 min-w-0">
              {dueDate && new Date(dueDate) < new Date() ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <FaExclamationTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900 mb-1 text-sm sm:text-base">Assignment Past Due</h3>
                      <p className="text-red-700 text-xs sm:text-sm mb-3 sm:mb-4">
                        {currentAssignmentRequest ?
                          "Your extension request is being reviewed by admin." :
                          remainingExtensions > 0 ?
                            "This assignment is past its due date. You can no longer submit. Please request an extension from your admin." :
                            extensionLimit > 0 ?
                              "This assignment is past its due date and all extension requests have been used." :
                              "This assignment is past its due date. You can no longer submit. Please request an extension from your admin."}
                      </p>
                      {currentAssignmentRequest ? (
                        <div className="mt-2">
                          <div className="text-xs sm:text-sm font-medium text-yellow-600">
                            Extension Request Status: Pending
                          </div>
                        </div>
                      ) : remainingExtensions > 0 ? (
                        <button
                          onClick={handleExtensionRequest}
                          className="inline-flex items-center px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 text-xs sm:text-sm"
                        >
                          <FaEnvelope className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          Request Extension ({remainingExtensions} remaining)
                        </button>
                      ) : extensionLimit > 0 ? (
                        <div className="mt-2">
                          <div className="text-xs sm:text-sm font-medium text-red-600">
                            All {extensionLimit} extension request{extensionLimit > 1 ? 's' : ''} have been used.
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 sm:mb-8 -mt-4 sm:-mt-8">
                  {activeAssignment.category === "regular" && (
                    <RegularAssignment
                      assignmentData={activeAssignment}
                      showPreview={showPreview}
                      setShowPreview={setShowPreview}
                    />
                  )}
                  {activeAssignment.category === "true_false" && (
                    <TrueFalseQuestions
                      assignmentData={activeAssignment}
                      userAnswers={userAnswers}
                      handleAnswerChange={(questionId, answer) => setUserAnswers((prev) => ({ ...prev, [questionId]: answer }))}
                      isSubmitted={isSubmitted}
                    />
                  )}
                  {activeAssignment.category === "matching" && (
                    <MatchingQuestions
                      assignmentData={activeAssignment}
                      matchingAnswers={matchingAnswers}
                      setMatchingAnswers={setMatchingAnswers}
                      matchingSubmitted={matchingSubmitted}
                      matchingScores={matchingScores}
                    />
                  )}
                  {activeAssignment.category === "fill_in_the_blanks" && (
                    <FillInTheBlanksQuestions
                      assignmentData={{
                        ...activeAssignment,
                        recordQuestionTime,
                      }}
                      blanksAnswers={blanksAnswers}
                      setBlanksAnswers={setBlanksAnswers}
                      blanksSubmitted={blanksSubmitted}
                      blanksScores={blanksScores}
                    />
                  )}
                  {activeAssignment.category === "paragraph_writing" && (
                    <ParagraphWritingQuestions
                      assignmentData={activeAssignment}
                      paragraphAnswers={paragraphAnswers}
                      setParagraphAnswers={setParagraphAnswers}
                      startTime={startTime}
                      setStartTime={setStartTime}
                      backspaceCount={backspaceCount}
                      setBackspaceCount={setBackspaceCount}
                      isSubmitted={isSubmitted}
                    />
                  )}
                </div>
              )}

              {/* Submit Assignment - Left Column (Visible only on mobile, hidden on desktop for certain categories) */}
              {isMobile && (activeAssignment?.category !== 'paragraph_writing' && activeAssignment?.category !== 'matching' && activeAssignment?.category !== 'fill_in_the_blanks' && activeAssignment?.category !== 'true_false' && activeAssignment?.category !== 'regular') &&
                (!dueDate || new Date(dueDate) >= new Date()) && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mt-4">
                    <div className="flex justify-end">
                      <button
                        onClick={handleSubmitAssignment}
                        disabled={isSubmitDisabled() || attemptsExhausted}
                        className={`inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold transition-all duration-200 text-sm sm:text-base ${isSubmitDisabled() || attemptsExhausted
                          ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                          : "bg-slate-900 text-white"
                          }`}
                      >
                        Submit Assignment
                        <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3" />
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Right Column - Fixed Attempt Information Panel (Hidden on Mobile/Tablet) */}
          <div className={`
            ${activeAssignment?.category === 'paragraph_writing' || activeAssignment?.category === 'matching' ||
              activeAssignment?.category === 'fill_in_the_blanks' || activeAssignment?.category === 'true_false' ||
              activeAssignment?.category === 'regular'
              ? 'hidden lg:block w-full lg:w-[28rem] flex-shrink-0 bg-sand border-t lg:border-t-0 lg:border-l border-gray-200 min-h-auto lg:min-h-full'
              : 'hidden lg:block w-full lg:w-80 flex-shrink-0'
            }`}>
            <div className={`
              ${activeAssignment?.category === 'paragraph_writing' || activeAssignment?.category === 'matching' ||
                activeAssignment?.category === 'fill_in_the_blanks' || activeAssignment?.category === 'true_false' ||
                activeAssignment?.category === 'regular'
                ? 'px-4 sm:px-6 py-4 flex-1 flex flex-col h-auto lg:h-full overflow-y-auto'
                : 'bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 lg:p-8 sticky top-4 lg:top-8'
              }`}>

              {/* Instructions Section - Desktop Only */}
              {activeAssignment?.category === 'paragraph_writing' && (
                <div className="mb-6 lg:mb-8">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">Instructions</h2>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-slate-600">Carefully read the paragraph displayed above and retype it exactly as shown in the typing area below.</p>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-slate-600">Type word for word — spelling, capitalization, and spacing must match the given paragraph.</p>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-slate-600">Accuracy is calculated based on how many words match the original paragraph.</p>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-slate-600">Speed (WPM) shows how many words you type per minute, based on your typing time.</p>
                    </div>
                    {dueDate && (
                      <div className="flex items-start gap-2 sm:gap-3">
                        <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-slate-600">
                          The assignment is due on <span className="font-semibold text-slate-900">{new Date(dueDate).toLocaleDateString('en-GB')}</span> at <span className="font-semibold text-slate-900">{new Date(dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>.
                        </p>
                      </div>
                    )}
                    {activeAssignment?.extension_limit > 0 && (
                      <div className="flex items-start gap-2 sm:gap-3">
                        <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-slate-600">
                          You are allowed up to <span className="font-semibold text-slate-900">{activeAssignment.extension_limit}</span> extension request{activeAssignment.extension_limit > 1 ? 's' : ''} for this assignment.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Matching Instructions - Desktop Only */}
              {activeAssignment?.category === 'matching' && (
                <div className="mb-6 lg:mb-8">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">Instructions</h2>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-slate-600">Click on an item (1, 2, 3...) from the left column to select it.</p>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-slate-600">Click on a corresponding match (A, B, C...) from the right column to connect them.</p>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-slate-600">To disconnect an item, simply click on the connected item or match again.</p>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-slate-600">Review all your connections before submitting the assignment.</p>
                    </div>
                    {dueDate && (
                      <div className="flex items-start gap-2 sm:gap-3">
                        <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-slate-600">
                          The assignment is due on <span className="font-semibold text-slate-900">{new Date(dueDate).toLocaleDateString('en-GB')}</span> at <span className="font-semibold text-slate-900">{new Date(dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>.
                        </p>
                      </div>
                    )}
                    {activeAssignment?.extension_limit > 0 && (
                      <div className="flex items-start gap-2 sm:gap-3">
                        <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-slate-600">
                          You are allowed up to <span className="font-semibold text-slate-900">{activeAssignment.extension_limit}</span> extension request{activeAssignment.extension_limit > 1 ? 's' : ''} for this assignment.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fill in the Blanks Instructions - Desktop Only */}
              {activeAssignment?.category === 'fill_in_the_blanks' && (
                <div className="mb-6 lg:mb-8">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">Instructions</h2>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-slate-600">Read each sentence carefully and identify the missing word or phrase.</p>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-slate-600">Type your answer into the blank space provided.</p>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-slate-600">Double-check your spelling before submitting.</p>
                    </div>
                    {dueDate && (
                      <div className="flex items-start gap-2 sm:gap-3">
                        <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-slate-600">
                          The assignment is due on <span className="font-semibold text-slate-900">{new Date(dueDate).toLocaleDateString('en-GB')}</span> at <span className="font-semibold text-slate-900">{new Date(dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>.
                        </p>
                      </div>
                    )}
                    {activeAssignment?.extension_limit > 0 && (
                      <div className="flex items-start gap-2 sm:gap-3">
                        <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-slate-600">
                          You are allowed up to <span className="font-semibold text-slate-900">{activeAssignment.extension_limit}</span> extension request{activeAssignment.extension_limit > 1 ? 's' : ''} for this assignment.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* True/False Instructions - Desktop Only */}
              {activeAssignment?.category === 'true_false' && (
                <div className="mb-6 lg:mb-8">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">Instructions</h2>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-slate-600">Read each statement carefully.</p>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-slate-600">Select whether the statement is True or False.</p>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-slate-600">Check your answers before submitting.</p>
                    </div>
                    {dueDate && (
                      <div className="flex items-start gap-2 sm:gap-3">
                        <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-slate-600">
                          The assignment is due on <span className="font-semibold text-slate-900">{new Date(dueDate).toLocaleDateString('en-GB')}</span> at <span className="font-semibold text-slate-900">{new Date(dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>.
                        </p>
                      </div>
                    )}
                    {activeAssignment?.extension_limit > 0 && (
                      <div className="flex items-start gap-2 sm:gap-3">
                        <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-slate-600">
                          You are allowed up to <span className="font-semibold text-slate-900">{activeAssignment.extension_limit}</span> extension request{activeAssignment.extension_limit > 1 ? 's' : ''} for this assignment.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Regular Assignment Instructions - Desktop Only */}
              {activeAssignment?.category === 'regular' && (
                <div className="mb-6 lg:mb-8">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">Instructions</h2>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-slate-600">Please read the document attached.</p>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-slate-600">Complete the assignment as per the instructions in the document.</p>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-slate-600">Submit your work before the deadline.</p>
                    </div>
                    {dueDate && (
                      <div className="flex items-start gap-2 sm:gap-3">
                        <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-slate-600">
                          The assignment is due on <span className="font-semibold text-slate-900">{new Date(dueDate).toLocaleDateString('en-GB')}</span> at <span className="font-semibold text-slate-900">{new Date(dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>.
                        </p>
                      </div>
                    )}
                    {activeAssignment?.extension_limit > 0 && (
                      <div className="flex items-start gap-2 sm:gap-3">
                        <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-slate-600">
                          You are allowed up to <span className="font-semibold text-slate-900">{activeAssignment.extension_limit}</span> extension request{activeAssignment.extension_limit > 1 ? 's' : ''} for this assignment.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Attempt Summary Section - Desktop Only */}
              <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Attempt Summary</h2>
              </div>

              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                {dueDate && (activeAssignment?.category !== 'paragraph_writing' && activeAssignment?.category !== 'matching' &&
                  activeAssignment?.category !== 'fill_in_the_blanks' && activeAssignment?.category !== 'true_false' &&
                  activeAssignment?.category !== 'regular') && (
                    <div className={`${activeAssignment?.category === 'paragraph_writing' || activeAssignment?.category === 'matching' ||
                      activeAssignment?.category === 'fill_in_the_blanks' || activeAssignment?.category === 'true_false' ||
                      activeAssignment?.category === 'regular' ? 'bg-white' : 'bg-slate-50'} 
                    rounded-xl p-3 sm:p-4 border ${new Date(dueDate) < new Date() ? 'border-red-200' : 'border-slate-100'}`}>
                      <div className={`text-xs sm:text-sm font-medium mb-1 ${new Date(dueDate) < new Date() ? 'text-red-500' : 'text-slate-500'}`}>
                        Due Date & Time
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <div className={`text-base sm:text-xl font-bold ${new Date(dueDate) < new Date() ? 'text-red-600' : 'text-slate-900'}`}>
                          {new Date(dueDate).toLocaleDateString('en-GB')}
                        </div>
                        <div className={`text-sm sm:text-lg font-semibold ${new Date(dueDate) < new Date() ? 'text-red-500' : 'text-slate-700'}`}>
                          {new Date(dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  )}

                {extensionLimit > 0 && (activeAssignment?.category !== 'paragraph_writing' && activeAssignment?.category !== 'matching' &&
                  activeAssignment?.category !== 'fill_in_the_blanks' && activeAssignment?.category !== 'true_false' &&
                  activeAssignment?.category !== 'regular') && (
                    <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-100">
                      <div className="text-xs sm:text-sm font-medium mb-1 text-slate-500">
                        Remaining Extension Requests
                      </div>
                      <div className={`text-base sm:text-xl font-bold ${remainingExtensions > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {remainingExtensions} / {extensionLimit}
                      </div>
                    </div>
                  )}

                {(!dueDate || new Date(dueDate) >= new Date()) && (
                  <>
                    {(activeAssignment?.category === 'paragraph_writing' || activeAssignment?.category === 'matching' ||
                      activeAssignment?.category === 'fill_in_the_blanks' || activeAssignment?.category === 'true_false' ||
                      activeAssignment?.category === 'regular') ? (
                      <>
                        <div className="flex items-center mt-2 gap-2 sm:gap-0">
                          <div className="flex-1 flex flex-col items-center text-center border-r border-slate-200 px-2">
                            <div className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">
                              Total Attempts
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold text-slate-900">{maxAttempts}</div>
                          </div>
                          <div className="flex-1 flex flex-col items-center text-center px-2">
                            <div className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">
                              Used Attempts
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold text-slate-900">{triedAttempts}</div>
                          </div>
                        </div>
                        {extensionLimit > 0 && (
                          <div className="flex items-center mt-3 gap-2 sm:gap-0">
                            <div className="flex-1 flex flex-col items-center text-center border-r border-slate-200 px-2">
                              <div className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">
                                Extension Limit
                              </div>
                              <div className="text-2xl sm:text-3xl font-bold text-slate-900">{extensionLimit}</div>
                            </div>
                            <div className="flex-1 flex flex-col items-center text-center px-2">
                              <div className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">
                                Remaining Extensions
                              </div>
                              <div className={`text-2xl sm:text-3xl font-bold ${remainingExtensions > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{remainingExtensions}</div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-100">
                          <div className="text-slate-500 text-xs sm:text-sm font-medium mb-1">Total Attempts Allowed</div>
                          <div className="text-xl sm:text-2xl font-bold text-slate-900">{maxAttempts}</div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-100">
                          <div className="text-slate-500 text-xs sm:text-sm font-medium mb-1">Attempts Used</div>
                          <div className={`text-xl sm:text-2xl font-bold ${triedAttempts >= maxAttempts ? "text-red-600" : "text-emerald-600"}`}>
                            {triedAttempts}
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-100">
                          <div className="text-slate-500 text-xs sm:text-sm font-medium mb-1">Attempts Remaining</div>
                          <div className={`text-xl sm:text-2xl font-bold ${attemptsRemaining > 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {attemptsRemaining}
                          </div>
                        </div>
                        {extensionLimit > 0 && (
                          <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-100">
                            <div className="text-slate-500 text-xs sm:text-sm font-medium mb-1">Remaining Extension Requests</div>
                            <div className={`text-xl sm:text-2xl font-bold ${remainingExtensions > 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {remainingExtensions} / {extensionLimit}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              {attemptsExhausted && (!dueDate || new Date(dueDate) >= new Date()) && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <FaExclamationTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-900 mb-1 text-xs sm:text-sm">Attempts Exhausted</h3>
                      <p className="text-red-700 text-xs">You have used all allowed attempts for this assignment.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Assignment - Right Column (Desktop Only) */}
              {(activeAssignment?.category === 'paragraph_writing' || activeAssignment?.category === 'matching' ||
                activeAssignment?.category === 'fill_in_the_blanks' || activeAssignment?.category === 'true_false' ||
                activeAssignment?.category === 'regular') && (!dueDate || new Date(dueDate) >= new Date()) && (
                  <div className="pt-4 sm:pt-6 mt-auto">
                    <button
                      onClick={handleSubmitAssignment}
                      disabled={isSubmitDisabled() || attemptsExhausted}
                      className={`w-full inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-200 text-sm sm:text-base ${isSubmitDisabled() || attemptsExhausted
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                        : "bg-slate-900 text-white"
                        }`}
                    >
                      Submit Assignment
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3" />
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Static Footer with Submit Button */}
      {isMobile && (activeAssignment?.category === 'paragraph_writing' || activeAssignment?.category === 'matching' ||
        activeAssignment?.category === 'fill_in_the_blanks' || activeAssignment?.category === 'true_false' ||
        activeAssignment?.category === 'regular') && (!dueDate || new Date(dueDate) >= new Date()) && (

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 lg:hidden z-[1000]">
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 max-w-lg mx-auto">
                {/* Simple Instructions Icon */}
                <button
                  onClick={() => setShowInstructionsModal(true)}
                  className="p-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                  aria-label="View instructions"
                >
                  <FaLightbulb className="w-5 h-5" />
                </button>

                {/* Clean Submit Button */}
                <button
                  onClick={handleSubmitAssignment}
                  disabled={isSubmitDisabled() || attemptsExhausted}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${isSubmitDisabled() || attemptsExhausted
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950"
                    }`}
                >
                  Submit Assignment
                </button>
              </div>
            </div>
          </div>
        )}
      {/* Submitting Loader Popup */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col items-center max-w-sm w-full mx-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-3 sm:mb-4"></div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Submitting...</h3>
            <p className="text-gray-500 text-center text-xs sm:text-sm">Please wait while we process your assignment.</p>
          </div>
        </div>
      )}
    </div>
  );
}
