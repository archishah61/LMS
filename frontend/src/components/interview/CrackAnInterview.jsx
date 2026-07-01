import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCreateCompleteEvaluationMutation,
  useEvaluateInterviewAnswersMutation,
  useGenerateInterviewQuestionsMutation,
  useGetCompleteEvaluationByUserQuery,
  useGetUserDailyFeatureCountQuery,
} from "../../services/Ai/interviewAPI";
import { useSpeech } from "react-text-to-speech";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import { getStudentToken } from "../../services/CookieService";

import renderSetupModal from "./renderSetupModal";
import renderInterviewScreen from "./renderInterviewScreen";
import renderEvaluationScreen from "./renderEvaluationScreen";
import renderErrorModal from "./renderErrorModal";
import renderCameraView from "./renderCameraView";
import { useSelector } from "react-redux";
import useScreenRecorder from "../../hooks/useScreenRecorder";
import RenderStartScreen from "./renderStartScreen";
import renderInstructionsScreen from "./renderInstructionsScreen";
import useStudentAuthTokenRefresh from "../../hooks/useStudentAuthTokenRefresh";
import { Loader2 } from "lucide-react";
import { useGetFeatureStatusByNameQuery } from "../../services/Masters/featureStatusAPI";
import ComingSoonModal from "../modal/ComingSoonModal";
import { toast } from "react-hot-toast";
import PrimaryLoader from "../../components/ui/PrimaryLoader";

import { useAuthModal } from "../../context/AuthModalContext";
import renderNotFoundModal from "./renderNotFoundModal";
import DefaultSEOMeta from "../../context/DefaultSEOMeta";

export default function CrackAnInterview() {
  const navigate = useNavigate();
  useStudentAuthTokenRefresh();

  // Feature status query - no authentication required
  const { data: featureData, isLoading: featureDataLoading, error: featureDataError } =
    useGetFeatureStatusByNameQuery(
      { name: "interview_ai" }
    )

  const { access_token } = getStudentToken();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryInput, setCategoryInput] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [evaluationResultId, setEvaluationResultId] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isNotFoundModalOpen, setIsNotFoundModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
  const [displayTranscript, setDisplayTranscript] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [currentQuestionText, setCurrentQuestionText] = useState("");
  const [createCompleteEvaluation, { isLoading: isCreating }] = useCreateCompleteEvaluationMutation();
  const { data: evaluationData, error, isLoading, refetch } = useGetCompleteEvaluationByUserQuery({ access_token });
  const [mediaStream, setMediaStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const isSubmitting = useRef(false);

  const [selectedEvaluationId, setSelectedEvaluationId] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCameraExpanded, setIsCameraExpanded] = useState(false);
  const [showCameraView, setShowCameraView] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const { isScreenRecording, recordedBlob, startScreenRecording, stopScreenRecording, saveRecording, setRecordedBlob } = useScreenRecorder();
  const [showSaveRecordingModal, setShowSaveRecordingModal] = useState(false);
  const [showRecordingInstructions, setShowRecordingInstructions] = useState(false);
  const [shouldDownloadRecording, setShouldDownloadRecording] = useState(false);
  const [hasShownRecordingInstructions, setHasShownRecordingInstructions] = useState(false);
  const [hasAcceptedInstructions, setHasAcceptedInstructions] = useState(false);

  const [interviewHistory, setInterviewHistory] = useState([]); // State for interview history
  const [generateQuestions, { isLoading: isGenerating }] = useGenerateInterviewQuestionsMutation();
  const [evaluateInterviewAnswers, { isLoading: isEvaluating }] = useEvaluateInterviewAnswersMutation();
  const { Text, speechStatus, start, pause, stop } = useSpeech({
    text: currentQuestionText,
    rate: 0.9,
    pitch: 1,
    volume: 1,
  });
  const { transcript, isListening, startListening, stopListening, resetTranscript } = useSpeechToText();
  const {
    data: attemptsData,
    isLoading: attemptsLoading,
    refetch: refetchAttempts
  } = useGetUserDailyFeatureCountQuery({ type: "interview", access_token }, { refetchOnMountOrArgChange: true });

  const [forcedZeroByTabSwitch, setForcedZeroByTabSwitch] = useState(false);


  const { openLogin } = useAuthModal();

  // Redirect to login if not logged in (only if feature is active)
  useEffect(() => {
    if (!access_token && Boolean(featureData?.is_active)) {
      navigate("/");
      openLogin();
    }
  }, [access_token, navigate, featureData, openLogin]);

  // if (!access_token) return null;

  useEffect(() => {
    if (interviewQuestions.length > 0 && !hasShownRecordingInstructions) {
      setShowRecordingInstructions(true);
      setHasShownRecordingInstructions(true);
    }
  }, [interviewQuestions, hasShownRecordingInstructions]);

  // Fetch interview history on component mount
  useEffect(() => {
    const fetchInterviewHistory = async () => {
      try {
        const response = await refetch();
        if (response.data) {
          setInterviewHistory(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch interview history:", error);
      }
    };

    fetchInterviewHistory();
  }, [refetch]);

  // Update interview history when evaluationData changes
  useEffect(() => {
    if (evaluationData) {
      setInterviewHistory(evaluationData);
    }
  }, [evaluationData]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  const { id, isLoaded } = useSelector((state) => state.user);

  useEffect(() => {
    if (isLoaded && !id && Boolean(featureData?.is_active)) {
      navigate("/");
      openLogin();
    }
  }, [isLoaded, id, navigate, featureData, openLogin]);

  // Helper function to download a blob as a file
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  const stopCamera = useCallback(async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
    setShowCameraView(false);

    stopScreenRecording();
    // Removed auto-download here; video will only be saved on finish
  }, [stopScreenRecording]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMediaStream(stream);
      setIsCameraOn(true);

      await startScreenRecording(stream);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setIsCameraOn(false);
    }
  }, [startScreenRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  }, [mediaRecorder]);

  const saveRecordedVideo = async (blob) => {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: 'interview.webm',
        types: [{
          description: 'WebM Video',
          accept: {
            'video/webm': ['.webm'],
          },
        }],
      });

      const writableStream = await fileHandle.createWritable();
      await writableStream.write(blob);
      await writableStream.close();

    } catch (err) {
      console.error('Error saving video:', err);
    }
  };

  useEffect(() => {
    if (interviewQuestions.length > 0) {
      setShowCameraView(false);
      setIsCameraOn(false);
    }
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [interviewQuestions.length]);

  useEffect(() => {
    if (evaluation) {
      stopRecording();
      stopCamera();
      stopScreenRecording();
      if (recordedBlob) {
        setShowSaveRecordingModal(true);
      }
    }
  }, [evaluation, stopRecording, stopCamera, stopScreenRecording, recordedBlob]);

  const toggleCamera = useCallback(() => {
    if (showCameraView) {
      stopCamera();
    } else {
      setShowCameraView(true);
      startCamera();
    }
  }, [showCameraView, startCamera, stopCamera]);

  const toggleCameraSize = useCallback(() => {
    setIsCameraExpanded(prev => !prev);
  }, []);

  // Sync camera stream when switching between screens
  useEffect(() => {
    if (showCameraView && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
    }
  }, [showCameraView, hasAcceptedInstructions, interviewQuestions.length]);

  const [baseMessageContent, setBaseMessageContent] = useState("");

  useEffect(() => {
    if (transcript && !hasSubmittedAnswer) {
      setDisplayTranscript(transcript);
      const space = baseMessageContent && !baseMessageContent.endsWith(" ") ? " " : "";
      setMessageInput(baseMessageContent + space + transcript);
    }
  }, [transcript, hasSubmittedAnswer, baseMessageContent]);

  useEffect(() => {
    if (interviewQuestions.length > 0 && currentQuestionIndex < interviewQuestions.length) {
      setCurrentQuestionText(interviewQuestions[currentQuestionIndex].question);
    }
  }, [interviewQuestions, currentQuestionIndex]);

  useEffect(() => {
    if (speechStatus === "started") {
      setIsPlaying(true);
    } else if (speechStatus === "ended") {
      setIsPlaying(false);
    }
  }, [speechStatus]);

  const handleStartInterview = useCallback(async () => {
    if (categoryInput.trim() && roleInput.trim()) {
      try {
        const response = await generateQuestions({
          category: categoryInput.trim(),
          role: roleInput.trim(),
          access_token,
        }).unwrap();

        if (!response.is_valid) {
          setIsNotFoundModalOpen(true);
          return;
        }

        if (!response.interview_questions || response.interview_questions.length === 0) {
          setIsErrorModalOpen(true);
          return;
        }

        setInterviewQuestions(response.interview_questions);
        setIsModalOpen(false);
        setCurrentQuestionIndex(0);
        scrollToTop();
        // Reset category and role input fields
      } catch (error) {
        const errorMessage = error?.data?.error ||
          error?.data?.message ||
          error?.error ||
          error?.message ||
          'Failed to delete role';
        toast.error(errorMessage);
        setIsErrorModalOpen(true);
      }
    }
  }, [categoryInput, roleInput, access_token, generateQuestions, scrollToTop]);

  const handleSpeakQuestion = useCallback(() => {
    if (currentQuestionText) {
      setIsPlaying(true);
      start();
    }
  }, [currentQuestionText, start]);

  const handleStopSpeaking = useCallback(() => {
    setIsPlaying(false);
    stop();
  }, [stop]);

  const handleSpeechComplete = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleNextQuestion = useCallback(() => {
    const currentQuestion = interviewQuestions[currentQuestionIndex];
    const answerText = messageInput || displayTranscript;

    setUserAnswers((prev) => [
      ...prev,
      {
        question: currentQuestion.question,
        originalAnswer: currentQuestion.answer,
        userAnswer: answerText.trim() || "No answer provided.",
      },
    ]);

    setCurrentQuestionIndex((prev) => prev + 1);
    setDisplayTranscript("");
    setMessageInput("");
    setHasSubmittedAnswer(false);
    scrollToTop();
  }, [currentQuestionIndex, interviewQuestions, messageInput, displayTranscript, scrollToTop]);

  const handleEvaluateAnswers = useCallback(async () => {
    try {
      if (isSubmitting.current) return;
      isSubmitting.current = true;
      // Turn off camera and close camera view
      await stopCamera();

      // Stop mediaRecorder if recording
      if (isRecording && mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        setIsRecording(false);
      }

      // Stop screen recording to finalize the blob
      if (isScreenRecording) {
        await stopScreenRecording();
      }

      // Set flag to download recording when blob is ready
      setShouldDownloadRecording(true);

      // Collect final answer
      const finalAnswer = {
        question: interviewQuestions[currentQuestionIndex].question,
        originalAnswer: interviewQuestions[currentQuestionIndex].answer || "",
        userAnswer: (messageInput || displayTranscript || "").trim() || "No answer provided.",
      };

      const allAnswers = [...userAnswers, finalAnswer];

      if (allAnswers.length === 0) {
        toast.error("No answers found to evaluate. Please answer at least one question.");
        return;
      }

      // Now evaluate answers
      const evaluationResult = await evaluateInterviewAnswers({
        questionAnswers: allAnswers,
        access_token,
      }).unwrap();

      const rawEvaluations = evaluationResult?.evaluation?.questionEvaluations;
      if (!rawEvaluations || rawEvaluations.length === 0) {
        console.warn("[Interview] questionEvaluations is empty or missing in the API response.");
      }

      const structuredEvaluation = {
        overallScore: evaluationResult.evaluation.overallScore,
        overallAssessment: evaluationResult.evaluation.overallAssessment,
        fullResponse: evaluationResult.evaluation.fullResponse,
        questionEvaluations: (rawEvaluations || []).map((qEval) => ({
          question: qEval.question,
          originalAnswer: qEval.originalAnswer,
          userAnswer: qEval.userAnswer,
          score: qEval.score,
          feedback: qEval.feedback,
          suggestedImprovement: qEval.suggestedFeedback,
        })),
      };

      setEvaluation(structuredEvaluation);
      setForcedZeroByTabSwitch(false);
      scrollToTop();

      // Save evaluation to backend
      const completeEvaluationData = {
        role: roleInput.trim(),
        category: categoryInput.trim(),
        overallScore: structuredEvaluation.overallScore,
        overallAssessment: structuredEvaluation.overallAssessment,
        fullResponse: evaluationResult.evaluation.fullResponse || "",
        questionEvaluations: structuredEvaluation.questionEvaluations.map(q => ({
          question: q.question,
          originalAnswer: q.originalAnswer,
          userAnswer: q.userAnswer,
          score: q.score,
          feedback: q.feedback || "",
          suggestedFeedback: q.suggestedImprovement || "",
        })),
      };

      const createResponse = await createCompleteEvaluation({ data: completeEvaluationData, access_token }).unwrap();

      if (createResponse?.evaluation_result_id) {
        setEvaluationResultId(createResponse.evaluation_result_id);
      }

      // Always refetch after a successful save to keep history up-to-date
      await refetch();
      await refetchAttempts();
      isSubmitting.current = false;
    } catch (error) {
      const errorMessage = error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        'Failed to delete role';
      toast.error(errorMessage);
      setIsErrorModalOpen(true);
    }
  }, [
    currentQuestionIndex,
    interviewQuestions,
    messageInput,
    displayTranscript,
    userAnswers,
    access_token,
    evaluateInterviewAnswers,
    createCompleteEvaluation,
    categoryInput,
    roleInput,
    scrollToTop,
    refetch,
    refetchAttempts,
    isRecording,
    mediaRecorder,
    isScreenRecording,
    stopScreenRecording,
    recordedBlob,
    setRecordedBlob,
    stopCamera
  ]);

  // Download the recording when ready after finishing interview
  useEffect(() => {
    if (shouldDownloadRecording && recordedBlob) {
      const safeCategory = categoryInput.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
      const safeRole = roleInput.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
      const filename = `${safeCategory}-${safeRole}.webm`;
      downloadBlob(recordedBlob, filename);
      setRecordedBlob(null);
      setShouldDownloadRecording(false);
    }
  }, [shouldDownloadRecording, recordedBlob, categoryInput, roleInput]);

  const handleStartListening = useCallback(() => {
    setHasSubmittedAnswer(false);
    setBaseMessageContent(messageInput);
    setDisplayTranscript("");
    resetTranscript();
    startListening();
  }, [startListening, messageInput, resetTranscript]);

  const handleStopListening = useCallback(() => {
    stopListening();
  }, [stopListening]);

  const handleViewDetails = useCallback((id) => {
    setSelectedEvaluationId(id);
    scrollToTop();
  }, [scrollToTop]);

  const handleCloseDetails = useCallback(() => {
    setSelectedEvaluationId(null);
    scrollToTop();
  }, [scrollToTop]);

  const handleErrorModalClose = () => {
    setIsErrorModalOpen(false);
    navigate("/");
    // setTimeout(() => {
    //   window.location.reload();
    // }, 100); // delay to allow navigate to finish
  };

  const handleNotFoundModalClose = () => {
    setIsNotFoundModalOpen(false);
    setCategoryInput("");
    setRoleInput("");
  };

  const resetState = useCallback(async () => {
    setInterviewQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setEvaluation(null);
    setDisplayTranscript("");
    setMessageInput("");
    setHasSubmittedAnswer(false);
    setCurrentQuestionText("");
    setIsModalOpen(true);
    setCategoryInput(""); // Reset category input
    setRoleInput("");     // Reset role input
    setHasAcceptedInstructions(false);
    // Refetch the interview history to ensure it's up-to-date
    try {
      const response = await refetch();
      if (response.data) {
        setInterviewHistory(response.data);
      }
      await refetchAttempts();
    } catch (error) {
      console.error("Failed to refetch interview history:", error);
    }
  }, [refetch, refetchAttempts]);

  // tab switch useEffect
  useEffect(() => {
    if (interviewQuestions.length > 0 && !evaluation) {
      const handleVisibilityChange = async () => {
        if (!isSubmitting.current && document.visibilityState === 'hidden') {
          isSubmitting.current = true;

          // Set evaluation data to reflect tab change attempt
          const tabChangeEvaluation = {
            overallScore: 0,
            overallAssessment: 'You tried to change the tab during the interview.',
            fullResponse: '',
            questionEvaluations: interviewQuestions.map((q) => ({
              question: q.question,
              originalAnswer: q.answer,
              userAnswer: '',
              score: 0,
              feedback: '',
              suggestedImprovement: '',
            })),
          };

          setEvaluation(tabChangeEvaluation);

          // Save evaluation to backend
          const completeEvaluationData = {
            role: roleInput.trim(),
            category: categoryInput.trim(),
            overallScore: tabChangeEvaluation.overallScore,
            overallAssessment: tabChangeEvaluation.overallAssessment,
            fullResponse: tabChangeEvaluation.fullResponse || "",
            questionEvaluations: tabChangeEvaluation.questionEvaluations.map(q => ({
              question: q.question,
              originalAnswer: q.originalAnswer,
              userAnswer: q.userAnswer,
              score: q.score,
              suggestedFeedback: q.suggestedImprovement,
            })),
          };

          try {
            const createResponse = await createCompleteEvaluation({
              data: completeEvaluationData,
              access_token
            }).unwrap();

          } catch (error) {
            console.error("Failed to save evaluation:", error);
          }

          isSubmitting.current = false;
          setForcedZeroByTabSwitch(true);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [interviewQuestions, evaluation, roleInput, categoryInput, access_token, createCompleteEvaluation]);

  // Show coming soon page if feature is inactive - this check happens FIRST
  if (featureData?.is_active === 0) {
    return <ComingSoonModal featureData={featureData} />;
  }

  // Show loading state for feature data
  if (featureDataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <PrimaryLoader />
        </div>
      </div>
    )
  }

  // Show error state for feature data
  if (featureDataError) {
    return (
      <div className="text-red-500 text-center p-4 bg-red-50 min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong</h2>
          <p>Error loading feature status: {featureDataError?.toString()}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <DefaultSEOMeta />

      {evaluation ? (
        renderEvaluationScreen({ evaluation, scrollToTop, navigate, resetState, forcedZeroByTabSwitch, role: roleInput, category: categoryInput, evaluation_result_id: evaluationResultId, onDownloadSuccess: refetch })
      ) : interviewQuestions.length > 0 && !hasAcceptedInstructions ? (
        renderInstructionsScreen({
          onAccept: () => setHasAcceptedInstructions(true),
          toggleCamera,
          showCameraView,
          videoRef
        })
      ) : interviewQuestions.length > 0 ? (
        <>
          {renderInterviewScreen({
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
            scrollToTop,
            navigate,
            isEvaluating,
            isVoiceModalOpen,
            handleStopListening,
            showCameraView,
            toggleCamera,
            isCameraExpanded,
            toggleCameraSize,
            videoRef,
            isRecording,
            stopRecording,
            onShowRecordingInstructions: () => setHasAcceptedInstructions(false),
          })}
          {renderCameraView({
            showCameraView,
            toggleCamera,
            isCameraExpanded,
            toggleCameraSize,
            videoRef,
            isRecording,
            stopRecording,
          })}
        </>
      ) : (
        <RenderStartScreen
          key={attemptsData?.count}
          interviewHistory={interviewHistory}
          evaluationData={evaluationData}
          handleViewDetails={handleViewDetails}
          handleCloseDetails={handleCloseDetails}
          selectedEvaluationId={selectedEvaluationId}
          navigate={navigate}
          setIsModalOpen={setIsModalOpen}
          access_token={access_token}
          attemptsData={attemptsData}
          attemptsLoading={attemptsLoading}
          settingsData={attemptsData} // attemptsData now contains the limit too
          refetchAttempts={refetchAttempts}
          refetch={refetch}
          forcedZeroByTabSwitch={forcedZeroByTabSwitch}
        />
      )}

      {renderSetupModal({
        isModalOpen,
        setIsModalOpen,
        categoryInput,
        setCategoryInput,
        roleInput,
        setRoleInput,
        handleStartInterview,
        isGenerating,
      })}

      {renderErrorModal({ isErrorModalOpen, handleErrorModalClose })}

      {renderNotFoundModal({ isOpen: isNotFoundModalOpen, onClose: handleNotFoundModalClose })}
    </div>
  );
}