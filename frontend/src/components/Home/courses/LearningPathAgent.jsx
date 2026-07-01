"use client"

import { useState, useEffect } from "react"
import {
  BookOpen,
  Target,
  Clock,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Star,
  Calendar,
  Award,
  Lightbulb,
  RotateCcw,
  Smartphone,
  Trophy,
  Brain,
  Heart,
  Shield,
  AlertTriangle,
  X,
  BarChart3,
  Activity,
  Video,
  Monitor,
  BookMarked,
  GraduationCap,
  Timer,
  TargetIcon,
  Dumbbell,
  Zap,
  Eye,
  ChevronRight,
  Building,
  Briefcase,
  Code,
  Palette,
  Music,
  Camera,
  Wrench,
  Stethoscope,
  Calculator,
  Beaker,
  Cpu,
  Languages,
  ExternalLink,
  Flag,
  Info,
  Check,
  Loader2,
  Home,
  Map,
  Download,
  RefreshCw,
} from "lucide-react"
import {
  useGenerateLearningPathRoadmapMutation,
  useGetLearningPathDetailsQuery,
  useInitializeLearningPathAgentMutation,
  useProcessLearningPathResponsesMutation,
  useResumeLearningPathMutation,
} from "../../../services/AIServices"
import LearningPathHistory from './LearningPathHistory';
import RoadmapPDFGenerator from "./RoadmapPDFGenerator"
import { useNavigate } from "react-router-dom"
import useStudentAuthTokenRefresh from "../../../hooks/useStudentAuthTokenRefresh"
import { useGetFeatureStatusByNameQuery } from "../../../services/Masters/featureStatusAPI"
import { useAuthModal } from '../../../context/AuthModalContext';
import { useSelector } from 'react-redux';
import { getStudentToken } from '../../../services/CookieService';
import PrimaryLoader from "../../../components/ui/PrimaryLoader";

// Import the new component
import ComingSoonModal from "../../modal/ComingSoonModal"
import UniversalRoadmapDisplay from "./UniversalRoadmapDisplay"
import DefaultSEOMeta from "../../../context/DefaultSEOMeta";

// Goal type icons mapping
const getGoalIcon = (goalType) => {
  const iconMap = {
    exam: GraduationCap,
    academic: BookOpen,
    career: Briefcase,
    skill: Code,
    personal: Heart,
    fitness: Dumbbell,
    health: Stethoscope,
    creative: Palette,
    business: Building,
    certification: Award,
    technology: Cpu,
    language: Languages,
    music: Music,
    art: Camera,
    science: Beaker,
    math: Calculator,
    engineering: Wrench,
    default: Target,
  }
  return iconMap[goalType?.toLowerCase()] || iconMap.default
}

// Enhanced Goal Input Component
const GoalInputStep = ({ goalInput, sessionData, setGoalInput, handleInitialize, handleSelectHistoryPath, isLoading }) => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Zap,
      title: "AI-Powered Analysis",
      desc: "Deep analysis of your goals to ensure success",
    },
    {
      icon: Star,
      title: "Personalized Roadmap",
      desc: "Tailored specifically to your unique needs",
    },
    {
      icon: CheckCircle, // Changed icon to match typical tick mark in image if needed, or stick to CheckCircle/Award
      title: "Expert Resources",
      desc: "Curated learning materials from top sources",
    },
  ];

  const goals = [
    { icon: GraduationCap, label: "Exams" },
    { icon: Briefcase, label: "Career" },
    { icon: Code, label: "Skills" },
    { icon: Dumbbell, label: "Fitness" },
    { icon: Palette, label: "Creative" },
    { icon: Building, label: "Business" },
  ];

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 px-3 xs:px-4 sm:px-6 py-4">

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-3 xs:top-6 xs:left-6 flex items-center gap-1.5 text-primary font-medium hover:text-green-700 transition-colors text-xs xs:text-sm"
      >
        <ArrowLeft className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
        <span>Back</span>
      </button>

      <div className="absolute top-4 right-3 xs:top-6 xs:right-6 flex items-center gap-2">
        <LearningPathHistory
          onSelectPath={handleSelectHistoryPath}
          currentSessionId={sessionData?.sessionId}
        />
      </div>

      <div className="container mx-auto max-w-4xl space-y-3 pt-8 xs:pt-4">

        {/* Header */}
        <div className="text-center space-y-2 mb-2">
          <div className="inline-flex items-center justify-center w-10 h-10 xs:w-12 xs:h-12 rounded-lg bg-primary text-white shadow-sm">
            <Target className="w-5 h-5 xs:w-6 xs:h-6" />
          </div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
            Universal Learning Path Agent
          </h1>
          <p className="text-gray-500 text-xs xs:text-sm md:text-base max-w-2xl mx-auto px-2">
            Create personalized roadmaps for any learning goal - from exam prep to skill development
          </p>
        </div>

        {/* 1. Goal Icons Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 xs:gap-3">
          {goals.map((item, index) => (
            <div
              key={index}
              onClick={() => setGoalInput(item.label)}
              className="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-1.5 xs:gap-2 cursor-pointer hover:border-primary hover:shadow-md transition-all duration-200 h-20 xs:h-24"
            >
              <item.icon className="w-4 h-4 xs:w-5 xs:h-5 text-primary" />
              <span className="text-gray-700 font-medium text-[10px] xs:text-xs">{item.label}</span>
            </div>
          ))}
        </div>

        {/* 2. Input Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 xs:p-5 sm:p-6">
          <h2 className="text-base xs:text-lg font-bold text-gray-900 mb-3 xs:mb-4">What's your learning goal?</h2>

          <div className="relative mb-2">
            <input
              type="text"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="e.g., JEE Main, UPSC, Web Development, Data Science..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 xs:px-4 pr-9 xs:pr-10 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all text-xs xs:text-sm md:text-base placeholder-gray-400 text-gray-800"
              onKeyPress={(e) => e.key === "Enter" && handleInitialize()}
            />
            <Lightbulb className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 xs:w-5 xs:h-5 text-gray-400" />
          </div>

          <p className="text-[10px] xs:text-xs text-gray-500 mb-4 xs:mb-6">
            Enter any goal - academic, professional, personal, or creative
          </p>

          <button
            onClick={handleInitialize}
            disabled={!goalInput.trim() || isLoading}
            className="w-full bg-primary text-white py-2 xs:py-2.5 rounded-lg font-semibold text-xs xs:text-sm md:text-base shadow-sm hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 xs:w-5 xs:h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Start Your Learning Journey
                <ArrowRight className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
              </>
            )}
          </button>
        </div>

        {/* 3. Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 xs:gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-4 xs:p-5 rounded-lg shadow-sm border border-gray-100 flex sm:flex-col items-center sm:items-center gap-3 sm:gap-0 sm:text-center"
            >
              <div className="w-9 h-9 xs:w-10 xs:h-10 bg-green-50 rounded-lg flex items-center justify-center sm:mb-3 shrink-0">
                <feature.icon className="w-4 h-4 xs:w-5 xs:h-5 text-primary" />
              </div>
              <div className="sm:text-center">
                <h3 className="font-bold text-gray-900 text-xs xs:text-sm mb-0.5 xs:mb-1">{feature.title}</h3>
                <p className="text-[10px] xs:text-xs text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

// Generating Content Overlay
const GeneratingOverlay = ({ isVisible, currentStep }) => {
  if (!isVisible) return null;

  // Loading context:
  // currentStep 1 → handleInitialize fired: Goal is IN PROGRESS (user waiting for analysis)
  //   → Goal should be ACTIVE ● (not yet done)
  // currentStep 2 → handleAssessmentComplete fired: Q&A answers submitted & done
  //   → Goal ✓, Assessment ✓+ring
  // currentStep 3 → handleFinalSubmit fired: Follow-up done, generating roadmap
  //   → Goal ✓, Assessment ✓, Preferences ✓+ring
  //
  // activeStep = which step circle gets the glow ring
  // done       = steps BEFORE the active step are fully ✓
  // The active step itself shows ● for step1 (in-progress), or ✓+ring for steps 2&3 (just completed)
  const activeStep =
    currentStep === 1 ? 1 :   // Goal in-progress
      currentStep === 2 ? 2 :   // Assessment done → active ring on Assessment
        currentStep === 3 ? 3 : 4; // Preferences done, generating roadmap → active ring on Preferences

  // Step 1: Goal is in-progress (active, not yet done) → done = n < 1 (nothing done yet)
  // Step 2: Assessment just completed → done = n <= 2 (Goal ✓ + Assessment ✓+ring)
  // Step 3: Preferences just completed → done = n <= 3
  const isDone = (n) => currentStep === 1 ? n < activeStep : n <= activeStep;
  const isCurrent = (n) => n === activeStep;

  const stepLabels = ['Goal', 'Assessment', 'Preferences', 'Roadmap'];

  const messages = [
    {
      headline: 'Decoding your ambition',
      sub: 'Not just the words — the why behind them. Our AI is mapping exactly what success looks like for you.',
    },
    {
      headline: 'Sizing up your strengths',
      sub: 'Knowing where you stand today is the first step to knowing how far you can go tomorrow.',
    },
    {
      headline: 'Learning how you learn',
      sub: 'Your pace, your style, your instincts — we are weaving it all into a plan that feels made just for you.',
    },
    {
      headline: 'Your path is taking shape',
      sub: 'Every insight you shared is becoming a milestone. Your personalised learning journey is almost ready.',
    },
  ];
  const msg = messages[activeStep - 1];

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes lpa-card-in {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes lpa-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes lpa-pulse-icon {
          0%,100% { box-shadow: 0 0 0 0 rgba(0,187,110,0.30); }
          60%      { box-shadow: 0 0 0 12px rgba(0,187,110,0); }
        }
        @keyframes lpa-dot3 {
          0%,60%,100% { transform: translateY(0);    opacity: 0.3; }
          30%          { transform: translateY(-6px); opacity: 1;   }
        }
        @keyframes lpa-bar-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%);  }
        }
      ` }} />

      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(8, 20, 14, 0.60)',
      }}>

        {/* Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 18,
          padding: '40px 32px 32px',
          width: 'min(400px, calc(100vw - 40px))',
          boxShadow: '0 32px 100px rgba(0,0,0,0.28)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center',
          position: 'relative', overflow: 'hidden',
          animation: 'lpa-card-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}>

          {/* Green top bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: 'linear-gradient(90deg, #00BB6E 0%, #52dfad 100%)',
          }} />

          {/* ── Icon + Spinner ── */}
          <div style={{ position: 'relative', marginBottom: 22 }}>

            {/* Outer CSS spinner ring */}
            <div style={{
              width: 86, height: 86,
              borderRadius: '50%',
              border: '3px solid #e6f6ee',
              borderTopColor: '#00BB6E',
              animation: 'lpa-spin 1s linear infinite',
              position: 'absolute', top: -7, left: -7,
              boxSizing: 'border-box',
            }} />

            {/* Second slower ring */}
            <div style={{
              width: 94, height: 94,
              borderRadius: '50%',
              border: '2px solid #f0faf5',
              borderBottomColor: '#009D5C',
              animation: 'lpa-spin 2.4s linear infinite reverse',
              position: 'absolute', top: -11, left: -11,
              boxSizing: 'border-box',
            }} />

            {/* Icon centrepiece */}
            <div style={{
              width: 72, height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(145deg, #00BB6E 20%, #009D5C 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'lpa-pulse-icon 2s ease-in-out infinite',
              position: 'relative', zIndex: 1,
            }}>
              <Brain style={{ width: 34, height: 34, color: '#fff' }} />
            </div>
          </div>

          {/* ── Headline ── */}
          <h2 style={{
            fontSize: 17, fontWeight: 700, color: '#0f172a',
            margin: '0 0 7px', lineHeight: 1.35,
          }}>
            {msg.headline}
          </h2>

          {/* ── Sub text ── */}
          <p style={{
            fontSize: 13, color: '#64748b',
            margin: '0 0 28px', lineHeight: 1.65, maxWidth: 290,
          }}>
            {msg.sub}
          </p>

          {/* ── Horizontal step indicator ── */}
          <div style={{ width: '100%', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {stepLabels.map((label, i) => {
                const n = i + 1;
                const done = isDone(n);
                const current = isCurrent(n);
                return (
                  <>
                    {/* Step circle */}
                    <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        // done=true → green fill+tick. current (step1 only) without done → white+green border+dot
                        background: done ? '#00BB6E' : current ? '#fff' : '#f1f5f9',
                        border: (done || current) ? '2px solid #00BB6E' : '2px solid #e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: current ? '0 0 0 3px rgba(0,187,110,0.22)' : 'none',
                        transition: 'all 0.3s ease',
                        flexShrink: 0,
                      }}>
                        {done ? (
                          <svg width="9" height="9" viewBox="0 0 11 11" fill="none">
                            <path d="M1.5 5.5L4.5 8.5L9.5 2.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: current ? '#00BB6E' : '#cbd5e1',
                            display: 'block',
                          }} />
                        )}
                      </div>
                      <span style={{
                        fontSize: 9.5,
                        fontWeight: current ? 700 : done ? 600 : 400,
                        color: done ? '#00BB6E' : current ? '#0f172a' : '#94a3b8',
                        whiteSpace: 'nowrap',
                      }}>
                        {label}
                      </span>
                    </div>

                    {/* Connector line (not after last) */}
                    {i < stepLabels.length - 1 && (
                      <div key={`line-${i}`} style={{
                        flex: 1, height: 2, marginBottom: 16,
                        background: '#e2e8f0',
                        position: 'relative', overflow: 'hidden', marginInline: 4,
                      }}>
                        <div style={{
                          position: 'absolute', top: 0, left: 0,
                          height: '100%',
                          // Fill fully when BOTH endpoints are done; half-fill when left endpoint is active
                          width: isDone(i + 2) ? '100%' : isDone(i + 1) && !isDone(i + 2) ? '55%' : '0%',
                          background: '#00BB6E',
                          transition: 'width 0.5s ease',
                          borderRadius: 99,
                        }} />
                        {/* Sweep beam on the connector whose right endpoint is the active step */}
                        {isCurrent(i + 2) && (
                          <div style={{
                            position: 'absolute', top: 0, left: 0,
                            height: '100%', width: '40%',
                            background: 'linear-gradient(90deg, transparent, rgba(0,187,110,0.6), transparent)',
                            animation: 'lpa-bar-sweep 1.6s ease-in-out infinite',
                          }} />
                        )}
                      </div>
                    )}
                  </>
                );
              })}
            </div>
          </div>

          {/* ── 3 dots ── */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#00BB6E',
                animation: `lpa-dot3 1.1s ease-in-out ${i * 0.17}s infinite`,
              }} />
            ))}
          </div>

        </div>
      </div>
    </>
  );
};



// Error Popup Component
const ErrorPopup = ({ isOpen, message, title, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 scale-100">
        <div className="p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title || "Error"}</h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            {message}
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gray-900 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-800 transition-colors"
          >
            I understand, I'll try again later
          </button>
        </div>
      </div>
    </div>
  );
};

const UniversalLearningPathAgent = () => {
  useStudentAuthTokenRefresh();
  const navigate = useNavigate();
  const { openLogin } = useAuthModal();
  const { access_token } = getStudentToken();
  const { id, isLoaded } = useSelector((state) => state.user);

  // State Management
  const [currentStep, setCurrentStep] = useState(1)
  const [goalInput, setGoalInput] = useState("")
  const [sessionData, setSessionData] = useState(null)
  const [userResponses, setUserResponses] = useState({})
  const [followUpResponses, setFollowUpResponses] = useState({})
  const [followUpQuestions, setFollowUpQuestions] = useState([])
  const [preliminaryInsights, setPreliminaryInsights] = useState(null)
  const [finalRoadmap, setFinalRoadmap] = useState(null)
  // Question navigation state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentFollowUpIndex, setCurrentFollowUpIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [errorPopup, setErrorPopup] = useState({ show: false, message: "", title: "" })
  // Add this state
  const [historySessionId, setHistorySessionId] = useState(null);
  const { data: historyDetails, isLoading: isLoadingHistory, refetch: refetchHistory } = useGetLearningPathDetailsQuery(
    historySessionId,
    { enabled: false }
  );
  const [resumeLearningPath] = useResumeLearningPathMutation();

  const [initializePath, { isLoading: initLoading }] = useInitializeLearningPathAgentMutation()
  const [processResponses, { isLoading: processLoading }] = useProcessLearningPathResponsesMutation()
  const [generateRoadmap, { isLoading: roadmapLoading }] = useGenerateLearningPathRoadmapMutation()

  // Helper to handle API errors
  const handleError = (error) => {
    console.error("API Error:", error);
    let message = "An unexpected error occurred. Please try again.";
    let title = "Something went wrong";

    // Check for specific status codes
    if (error?.status === 429) {
      title = "Request Limit Reached";
      message = "We're receiving too many requests right now. Please wait a moment and try again.";
    } else if (error?.data?.message) {
      message = error.data.message;
    } else if (error?.error) {
      message = error.error;
    } else if (error?.data?.error) {
      title = "Request Limit Reached";
      message = error?.data?.error;
    }

    setErrorPopup({ show: true, message, title });
  }

  // Add this function
  const handleSelectHistoryPath = async (sessionId) => {
    try {
      const result = await resumeLearningPath(sessionId).unwrap();
      const restoredState = result.data;

      // Restore the state
      setSessionData(restoredState.sessionData);
      setUserResponses(restoredState.userResponses);
      setFollowUpResponses(restoredState.followUpResponses);
      setFollowUpQuestions(restoredState.followUpQuestions);
      setPreliminaryInsights(restoredState.preliminaryInsights);
      if (restoredState.currentStep == 2 || restoredState.currentStep == 3) {
        setCurrentStep(restoredState.currentStep - 0.5);
      } else if (restoredState.currentStep != 4) {
        setCurrentStep(restoredState.currentStep);
      }

      // Reset question indices
      setCurrentQuestionIndex(0);
      setCurrentFollowUpIndex(0);

      // If the path is completed, we need to fetch the roadmap
      if (restoredState.sessionData.status === 'completed') {
        // setFinalRoadmap()
      }
    } catch (error) {
      console.error('Error resuming path:', error);
      handleError(error);
    } finally {
      setHistorySessionId(null);
    }
  };

  // Step 1: Initialize Learning Path
  const handleInitialize = async () => {
    if (!goalInput.trim()) return
    setIsLoading(true)
    try {
      const result = await initializePath({ goal: goalInput })

      if (result.error) {
        handleError(result.error);
        return;
      }

      setSessionData(result.data?.data)
      setCurrentStep(1.5) // Show analysis first
      setCurrentQuestionIndex(0)
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false)
    }
  }

  // Handle single question response (assessment only)
  const handleQuestionResponse = (questionId, value) => {
    setUserResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  // Handle follow-up question response (separate state to avoid ID collisions)
  const handleFollowUpResponse = (questionId, value) => {
    setFollowUpResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  // Navigate to next question
  const handleNextQuestion = () => {
    const totalQuestions = sessionData?.assessmentQuestions?.length || 0
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      // All assessment questions completed, process responses
      handleAssessmentComplete()
    }
  }

  // Navigate to previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  // Complete assessment and move to follow-up
  const handleAssessmentComplete = async () => {
    setIsLoading(true)
    try {
      const result = await processResponses({
        sessionId: sessionData.sessionId,
        goal: sessionData.goal,
        responses: userResponses,
        step: 2,
      })

      if (result.error) {
        handleError(result.error);
        return;
      }

      setFollowUpQuestions(result.data?.data?.followUpQuestions || [])
      setPreliminaryInsights(result.data?.data?.preliminaryInsights || null)
      setCurrentStep(2.5) // Show preliminary insights
      setCurrentFollowUpIndex(0)
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false)
    }
  }

  // Handle follow-up question navigation
  const handleNextFollowUp = () => {
    if (currentFollowUpIndex < followUpQuestions.length - 1) {
      setCurrentFollowUpIndex((prev) => prev + 1)
    } else {
      // All follow-up questions completed
      handleFinalSubmit()
    }
  }

  const handlePrevFollowUp = () => {
    if (currentFollowUpIndex > 0) {
      setCurrentFollowUpIndex((prev) => prev - 1)
    }
  }

  // Generate final roadmap
  const handleFinalSubmit = async () => {
    setIsLoading(true)
    try {
      const result = await generateRoadmap({
        sessionId: sessionData.sessionId,
        goal: sessionData.goal,
        allResponses: { ...userResponses, ...followUpResponses },
        userProfile: { ...userResponses, ...followUpResponses },
      })

      if (result.error) {
        handleError(result.error);
        return;
      }

      setFinalRoadmap(result.data?.data)
      setCurrentStep(4)
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false)
    }
  }

  // Reset to start
  const resetAgent = () => {
    setCurrentStep(1)
    setGoalInput("")
    setSessionData(null)
    setUserResponses({})
    setFollowUpResponses({})
    setFollowUpQuestions([])
    setPreliminaryInsights(null)
    setFinalRoadmap(null)
    setCurrentQuestionIndex(0)
    setCurrentFollowUpIndex(0)
  }

  // Feature status query - no authentication required
  const { data: featureData, isLoading: featureDataLoading, error: featureDataError } =
    useGetFeatureStatusByNameQuery(
      { name: "learning_path_ai" }
    )

  useEffect(() => {
    if (!access_token && Boolean(featureData?.is_active)) {
      navigate("/");
      openLogin();
    }
  }, [access_token, navigate, featureData, openLogin]);

  useEffect(() => {
    if (isLoaded && !id && Boolean(featureData?.is_active)) {
      navigate("/");
      openLogin();
    }
  }, [isLoaded, id, navigate, featureData, openLogin]);

  // Show coming soon page if feature is inactive - this check happens FIRST
  if (featureData?.is_active === 0) {
    return <ComingSoonModal featureData={featureData} />;
  }

  // Show loading state for feature data
  if (featureDataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
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

  // Enhanced StepIndicator Component
  const StepIndicator = () => {
    const steps = [
      { id: 1, label: "GOAL", icon: Target },
      { id: 1.5, label: "ANALYSIS", icon: Eye },
      { id: 2.0, label: "ASSESS", icon: BookOpen }, // 2.0 to match step 2
      { id: 2.5, label: "INSIGHTS", icon: Lightbulb },
      { id: 3, label: "DETAILS", icon: Activity },
      { id: 4, label: "ROADMAP", icon: Map },
    ];

    // Helper to determine status
    const getStepStatus = (stepId) => {
      if (currentStep > stepId) return "completed";
      if (currentStep === stepId) return "current";
      return "upcoming";
    }

    return (
      <div className="w-full bg-white border-b border-gray-100 py-3 pb-6 mb-4 sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto">
          <div className="flex items-center justify-between relative">
            {/* Connecting Line - Background */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -z-10 transform -translate-y-1/2 rounded-full" />

            {/* Connecting Line - Progress */}
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-primary -z-10 transform -translate-y-1/2 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${(steps.findIndex(s => s.id === currentStep) / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((step, index) => {
              const status = getStepStatus(step.id);
              const isActive = status === "current";
              const isCompleted = status === "completed";

              return (
                <div key={step.id} className="relative flex flex-col items-center bg-white px-0.5 xs:px-1 sm:px-2">
                  <div
                    className={`
                      w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                      ${isActive ? "border-primary bg-white text-primary shadow-sm scale-110" : ""}
                      ${isCompleted ? "border-primary bg-primary text-white" : ""}
                      ${status === "upcoming" ? "border-gray-200 text-gray-300" : ""}
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <step.icon className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </div>
                  <span
                    className={`
                      absolute top-8 xs:top-8 sm:top-9 text-[8px] xs:text-[9px] sm:text-[10px] uppercase font-bold tracking-wider transition-colors duration-300
                      ${isActive ? "text-primary" : "text-gray-400"}
                      ${isCompleted ? "text-primary" : ""}
                    `}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Goal Analysis Display
  const GoalAnalysisStep = () => {
    const goalAnalysis = sessionData?.goalAnalysis
    const GoalIcon = getGoalIcon(goalAnalysis?.goalType)
    const [activeTab, setActiveTab] = useState("overview");

    return (
      <div className="pb-12">
        <div className="container mx-auto">

          {/* Header Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 xs:gap-4 mb-4 xs:mb-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900">Goal Analysis Complete</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] xs:text-xs font-bold bg-green-100 text-green-700 uppercase tracking-wide">
                  Ready
                </span>
              </div>
              <p className="text-gray-500 text-xs xs:text-sm">
                Here's what we discovered about your learning path for <span className="font-semibold text-gray-900">{goalAnalysis?.goalTitle}</span>.
              </p>
            </div>
            <button
              onClick={() => setCurrentStep(2)}
              className="w-full sm:w-auto bg-primary text-white px-4 xs:px-6 py-2 xs:py-2 md:py-3 rounded-lg font-semibold text-xs xs:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              Start Assessment
              <ArrowRight className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xs:gap-6">
            {/* Main Content - Left Column (2/3) */}
            <div className="lg:col-span-2 space-y-4 xs:space-y-6">

              {/* Tabs */}
              <div className="flex items-center gap-3 xs:gap-6 border-b border-gray-200 mb-2 overflow-x-auto scrollbar-hide">
                {["Overview", "Prerequisites", "Resources", "Outcomes"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase())}
                    className={`
                      pb-3 text-xs xs:text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap shrink-0
                      ${activeTab === tab.toLowerCase()
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-500 hover:text-gray-700"}
                    `}
                  >
                    {tab === "Overview" ? "Core Overview" : tab === "Prerequisites" ? "Prerequisites & Skills" : tab}
                  </button>
                ))}
              </div>

              {/* Tab Content: Overview */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Main Identity Card */}
                  <div className="bg-white rounded-xl p-6 border border-gray-100 flex gap-4 shadow-sm">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-primary">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{goalAnalysis?.goalTitle}</h3>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                          {goalAnalysis?.goalType} Goal
                        </span>
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full font-medium">
                          {goalAnalysis?.complexity} Difficulty
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {goalAnalysis?.description}
                      </p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-green-50/50 rounded-lg p-4 border border-green-100/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-800">Time Frame</span>
                      </div>
                      <p className="text-sm text-gray-600">{goalAnalysis?.timeFrameEstimate}</p>
                    </div>
                    <div className="bg-green-50/50 rounded-lg p-4 border border-green-100/50">
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-800">Difficulty Profile</span>
                      </div>
                      <p className="text-sm text-gray-600">{goalAnalysis?.challenges?.difficultyLevel}</p>
                    </div>
                  </div>

                  {/* Core Requirements Section */}
                  <div>
                    <h4 className="text-base font-bold text-gray-900 mb-4">Core Requirements</h4>
                    <div className="space-y-3">
                      {/* We will map dynamic requirements to generic cards if specific keys missing */}
                      <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm flex gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900">Academic / Technical Eligibility</h5>
                          <p className="text-xs text-gray-500 mt-1">
                            {goalAnalysis?.requirements?.prerequisites?.length > 0
                              ? goalAnalysis.requirements.prerequisites[0]
                              : "No specific prerequisites identified."}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm flex gap-3">
                        <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900">Key Focus Areas</h5>
                          <p className="text-xs text-gray-500 mt-1">
                            {goalAnalysis?.requirements?.skills?.slice(0, 3).join(", ") || "General focus requirements."}
                          </p>
                        </div>
                      </div>
                      {/* <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm flex gap-3">
                        <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900">Required Skills</h5>
                          <p className="text-xs text-gray-500 mt-1">
                            {goalAnalysis?.requirements?.skills?.slice(3).join(", ") || "Critical thinking and problem solving."}
                          </p>
                        </div>
                      </div> */}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Prerequisites */}
              {activeTab === "prerequisites" && (
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm space-y-6">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" /> Prerequisites
                    </h4>
                    <ul className="grid grid-cols-1 gap-2">
                      {goalAnalysis?.requirements?.prerequisites?.map((req, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2 bg-gray-50 p-2 rounded">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" /> Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {goalAnalysis?.requirements?.skills?.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Resources */}
              {activeTab === "resources" && (
                <div className="space-y-4">
                  {/* Courses */}
                  {goalAnalysis?.topResources?.courses && goalAnalysis.topResources.courses.length > 0 && (
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-primary" /> Top Recommended Courses
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {goalAnalysis.topResources.courses.map((course, i) => (
                          <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-start gap-2.5">
                            <GraduationCap className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{course.name}</p>
                              <span className="text-xs text-green-700 font-medium">{course.provider}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* YouTube Channels */}
                  {goalAnalysis?.topResources?.youtubeChannels && goalAnalysis.topResources.youtubeChannels.length > 0 && (
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Video className="w-4 h-4 text-primary" /> Essential YouTube Channels
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {goalAnalysis.topResources.youtubeChannels.map((channel, i) => (
                          <div key={i} className="bg-red-50/50 p-3 rounded-lg border border-red-100/50 flex items-start gap-2.5">
                            <Video className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{channel.name}</p>
                              <p className="text-xs text-gray-600 mt-0.5">{channel.focus}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Books */}
                  {goalAnalysis?.topResources?.books && goalAnalysis.topResources.books.length > 0 && (
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <BookMarked className="w-4 h-4 text-primary" /> Must-Read Books & Materials
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {goalAnalysis.topResources.books.map((book, i) => (
                          <div key={i} className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/50 flex items-start gap-2.5">
                            <BookOpen className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-gray-900 leading-tight">{book.title}</p>
                              <span className="text-xs text-blue-700 font-medium">By {book.author}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!goalAnalysis?.topResources ||
                    (!goalAnalysis.topResources.courses?.length &&
                      !goalAnalysis.topResources.youtubeChannels?.length &&
                      !goalAnalysis.topResources.books?.length)) && (
                      <div className="bg-white rounded-xl p-8 border border-gray-100 text-center shadow-sm">
                        <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Detailed resources will be generated in your final roadmap.</p>
                      </div>
                    )}
                </div>
              )}

              {/* Tab Content: Outcomes */}
              {activeTab === "outcomes" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <h4 className="font-bold mb-3 text-sm uppercase tracking-wide text-primary">Immediate Benefits</h4>
                    <ul className="space-y-2">
                      {goalAnalysis?.outcomes?.immediateOutcomes?.map((outcome, i) => (
                        <li key={i} className="text-sm text-gray-600 flex gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {outcome}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Long-term Vision</h4>
                    <ul className="space-y-2">
                      {goalAnalysis?.outcomes?.longTermBenefits?.map((benefit, i) => (
                        <li key={i} className="text-sm text-gray-600 flex gap-2">
                          <Star className="w-4 h-4 text-primary flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

            </div>

            {/* Sidebar - Right Column (1/3) */}
            <div className="space-y-6">

              {/* Market Insights Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Market Insights
                  </h3>
                  {/* <button className="text-[10px] font-bold text-primary hover:text-green-700 uppercase tracking-wide">
                    View Report
                  </button> */}
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-green-500">
                    <h5 className="text-[10px] uppercase font-bold text-gray-500">Demand</h5>
                    <p
                      className="text-sm font-semibold text-gray-900 mt-0.5 line-clamp-1"
                      title={goalAnalysis?.industryContext?.marketDemand || "High Demand "}
                    >
                      {goalAnalysis?.industryContext?.marketDemand || "High Demand "}
                    </p>
                    <p
                      className="text-xs text-gray-500 mt-1 line-clamp-2"
                      title={goalAnalysis?.industryContext?.marketDemand || "Continuous high demand expected."}
                    >
                      {goalAnalysis?.industryContext?.marketDemand || "Continuous high demand expected."}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-gray-400">
                    <h5 className="text-[10px] uppercase font-bold text-gray-500">Competition Level</h5>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {goalAnalysis?.industryContext?.competitionLevel?.split(' ')[0] || "Moderate"}
                    </p>
                    <p
                      className="text-xs text-gray-500 mt-1 line-clamp-2"
                      title={goalAnalysis?.industryContext?.competitionLevel || "Competitive landscape."}
                    >
                      {goalAnalysis?.industryContext?.competitionLevel || "Competitive landscape."}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-gray-800">
                    <h5 className="text-[10px] uppercase font-bold text-gray-500">Latest Trend</h5>
                    <p
                      className="text-xs text-gray-600 mt-1 line-clamp-3"
                      title={goalAnalysis?.industryContext?.currentTrends?.[0] || "Rapidly evolving field."}
                    >
                      {goalAnalysis?.industryContext?.currentTrends?.[0] || "Rapidly evolving field."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expected Outcomes Sidebar Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <Trophy className="w-4 h-4 text-primary" />
                  Expected Outcomes
                </h3>
                <div className="space-y-6 relative ml-1">
                  {/* Timeline Line */}
                  <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-gray-100 -z-10" />

                  <div className="flex gap-3 relative">
                    <div className="w-3 h-3 rounded-full border-2 border-primary bg-white mt-1.5 flex-shrink-0 z-10" />
                    <div>
                      <h5 className="text-xs font-bold text-gray-900">Immediate Access</h5>
                      <p
                        className="text-[10px] text-gray-500 mt-0.5 line-clamp-2"
                        title={goalAnalysis?.outcomes?.immediateOutcomes?.[0] || "Foundation knowledge"}
                      >
                        {goalAnalysis?.outcomes?.immediateOutcomes?.[0] || "Foundation knowledge"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 relative">
                    <div className="w-3 h-3 rounded-full border-2 border-gray-400 bg-white mt-1.5 flex-shrink-0 z-10" />
                    <div>
                      <h5 className="text-xs font-bold text-gray-900">Advanced Eligibility</h5>
                      <p
                        className="text-[10px] text-gray-500 mt-0.5 line-clamp-2"
                        title={goalAnalysis?.outcomes?.immediateOutcomes?.[1] || "Skill mastery"}
                      >
                        {goalAnalysis?.outcomes?.immediateOutcomes?.[1] || "Skill mastery"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 relative">
                    <div className="w-3 h-3 rounded-full border-2 border-gray-300 bg-white mt-1.5 flex-shrink-0 z-10" />
                    <div>
                      <h5 className="text-xs font-bold text-gray-900">Long-term Career</h5>
                      <p
                        className="text-[10px] text-gray-500 mt-0.5 line-clamp-2"
                        title={goalAnalysis?.outcomes?.longTermBenefits?.[0] || "Professional growth"}
                      >
                        {goalAnalysis?.outcomes?.longTermBenefits?.[0] || "Professional growth"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    )
  }

  // Enhanced Single Question Component
  const SingleQuestionStep = () => {
    const currentQuestion = sessionData?.assessmentQuestions?.[currentQuestionIndex]
    const totalQuestions = sessionData?.assessmentQuestions?.length || 0
    const answeredCount = sessionData?.assessmentQuestions?.filter(q => userResponses[q.id])?.length || 0
    const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0
    const currentResponse = userResponses[currentQuestion?.id]

    // Circle calculation
    const radius = 14;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    if (!currentQuestion) return null

    return (
      <div className="pt-2 pb-4 w-full overflow-hidden">
        <div className="container mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 xs:mb-4">
            <div>
              <h2 className="text-base xs:text-xl font-bold text-gray-900">Assessment</h2>
              <p className="text-gray-500 text-xs xs:text-sm mt-0.5">Question {currentQuestionIndex + 1} of {totalQuestions}</p>
            </div>

            {/* Progress Badge */}
            <div className="bg-white rounded-full py-1.5 px-3 border border-gray-100 shadow-sm flex items-center gap-2">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    className="text-gray-100"
                    strokeWidth="2.5"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="16"
                    cy="16"
                  />
                  <circle
                    className="text-primary transition-all duration-500 ease-out"
                    strokeWidth="2.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="16"
                    cy="16"
                  />
                </svg>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-xs font-bold text-gray-900">{progress}%</span>
                <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Complete</span>
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-5 leading-snug">
              {currentQuestion.question}
            </h3>

            <div className="space-y-2 mb-6">
              {currentQuestion.options?.map((option, optionIndex) => {
                const isSelected = currentResponse === option;
                return (
                  <label
                    key={optionIndex}
                    className={`
                      relative flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200
                      ${isSelected
                        ? "border-primary bg-green-50/20"
                        : "border-gray-200 bg-white hover:border-gray-300"
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option}
                      checked={isSelected}
                      onChange={(e) => handleQuestionResponse(currentQuestion.id, e.target.value)}
                      className="sr-only"
                    />

                    {/* Custom Radio */}
                    <div className={`
                      w-4 h-4 rounded-full border mr-3 flex items-center justify-center flex-shrink-0 transition-colors
                      ${isSelected ? "border-primary" : "border-gray-300"}
                    `}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>

                    <span className={`text-sm font-medium ${isSelected ? "text-gray-900" : "text-gray-600"}`}>
                      {option}
                    </span>

                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </label>
                )
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-2">
              <button
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
                className={`
                  flex items-center text-sm font-semibold transition-colors
                  ${currentQuestionIndex === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-gray-800"}
                `}
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Previous
              </button>

              {/* Pagination Dots */}
              <div className="hidden md:flex items-center gap-1">
                {Array.from({ length: totalQuestions }, (_, i) => (
                  <div
                    key={i}
                    className={`
                       h-1.5 rounded-full transition-all duration-300
                       ${i === currentQuestionIndex ? "w-5 bg-primary" : "w-1.5 bg-gray-200"}
                     `}
                  />
                ))}
              </div>

              <button
                onClick={handleNextQuestion}
                disabled={!currentResponse || isLoading}
                className={`
                   flex items-center px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all
                   ${!currentResponse || isLoading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-opacity-90"}
                `}
              >
                {isLoading ? (
                  <>Processing...</>
                ) : currentQuestionIndex === totalQuestions - 1 ? (
                  <>Complete</>
                ) : (
                  <>Next <ArrowRight className="w-4 h-4 ml-1.5" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Preliminary Insights Display
  const PreliminaryInsightsStep = () => {
    const insights = preliminaryInsights
    const strengths = insights?.leverageableStrengths || []
    const focusAreas = insights?.recommendedFocus || []
    const challenges = insights?.potentialChallenges || []

    return (
      <div className="w-full pt-2 pb-12">
        <div className="container mx-auto w-full flex flex-col gap-5 xs:gap-6">
          {/* Header with Action Button */}
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 xs:gap-4">
            <div>
              <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900">Preliminary Analysis</h2>
              <p className="text-gray-500 text-xs xs:text-sm mt-1">Based on your assessment answers — personalised just for you</p>
            </div>
            <button
              onClick={() => setCurrentStep(3)}
              className="w-full sm:w-auto bg-primary text-white px-4 xs:px-6 py-2 xs:py-2.5 rounded-full font-bold shadow-sm transition-all flex items-center justify-center gap-2 text-xs xs:text-sm"
            >
              Continue to Detailed Questions
              <ArrowRight className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
            </button>
          </div>

          {/* Personalised Approach Card */}
          {insights?.personalizedApproach && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 xs:p-6 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-l-lg" />
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-primary" />
                <h3 className="text-sm xs:text-base font-bold text-gray-900">AI Recommendation for You</h3>
              </div>
              <p className="text-gray-600 leading-relaxed text-xs xs:text-sm md:text-base">
                {insights.personalizedApproach}
              </p>
            </div>
          )}

          {/* Two Columns: Key Strengths & Focus Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-6">
            {/* Key Strengths */}
            <div className="flex flex-col">
              <h3 className="text-base xs:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 xs:w-5 xs:h-5 text-primary" />
                Your Strengths
              </h3>
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 xs:p-5 flex-grow">
                {strengths.length > 0 ? (
                  <ul className="space-y-3">
                    {strengths.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 text-xs xs:text-sm leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 text-xs xs:text-sm">Analysis in progress…</p>
                )}
              </div>
            </div>

            {/* Focus Areas */}
            <div className="flex flex-col">
              <h3 className="text-base xs:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 xs:w-5 xs:h-5 text-primary" />
                Priority Focus Areas
              </h3>
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 xs:p-5 flex-grow">
                {focusAreas.length > 0 ? (
                  <ul className="space-y-3">
                    {focusAreas.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <TrendingUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 text-xs xs:text-sm leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 text-xs xs:text-sm">Analysis in progress…</p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Challenges | Timeline | Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Challenges */}
            {challenges.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs xs:text-sm font-bold text-gray-900">Potential Challenges</h4>
                </div>
                <ul className="space-y-1.5">
                  {challenges.slice(0, 3).map((c, i) => (
                    <li key={i} className="text-[10px] xs:text-xs text-gray-500 flex gap-1.5">
                      <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Timeline Realism */}
            {insights?.timelineRealism && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <h4 className="text-xs xs:text-sm font-bold text-gray-900">Timeline Reality Check</h4>
                </div>
                <p className="text-[10px] xs:text-xs text-gray-500 leading-relaxed">{insights.timelineRealism}</p>
              </div>
            )}

            {/* Budget Advice */}
            {insights?.budgetOptimization && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <h4 className="text-xs xs:text-sm font-bold text-gray-900">Budget Strategy</h4>
                </div>
                <p className="text-[10px] xs:text-xs text-gray-500 leading-relaxed">{insights.budgetOptimization}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Enhanced Follow-up Questions
  const FollowUpStep = () => {
    const currentQuestion = followUpQuestions[currentFollowUpIndex]
    const totalQuestions = followUpQuestions.length
    const currentResponse = followUpResponses[currentQuestion?.id]
    // Progress based on index + whether current Q is answered (no shared userResponses collision)
    const answeredBase = currentFollowUpIndex + (currentResponse ? 1 : 0)
    const progress = totalQuestions > 0 ? Math.round((answeredBase / totalQuestions) * 100) : 0

    // Circle calculation
    const radius = 12; // Reduced radius
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    if (!currentQuestion) return null

    return (
      <div className="w-full py-2 overflow-hidden">
        <div className="container mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base xs:text-lg font-bold text-gray-900">Detailed Assessment</h2>
              <p className="text-gray-500 text-[10px] xs:text-xs mt-0.5">Question {currentFollowUpIndex + 1} of {totalQuestions}</p>
            </div>

            {/* Progress Badge */}
            <div className="bg-white rounded-full py-1 px-2.5 border border-gray-100 shadow-sm flex items-center gap-2">
              <div className="relative w-7 h-7 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    className="text-gray-100"
                    strokeWidth="2"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="14"
                    cy="14"
                  />
                  <circle
                    className="text-primary transition-all duration-500 ease-out"
                    strokeWidth="2"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="14"
                    cy="14"
                  />
                </svg>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[10px] font-bold text-gray-900">{progress}%</span>
                <span className="text-[8px] text-gray-400 font-semibold uppercase tracking-wide">Done</span>
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 leading-snug">
              {currentQuestion.question}
            </h3>

            {currentQuestion.reasoning && (
              <div className="mb-3 bg-gray-100 rounded-lg p-3 border-l-4 border-gray-400 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-800 text-xs font-medium leading-relaxed">
                  {currentQuestion.reasoning}
                </p>
              </div>
            )}

            <div className="space-y-1.5 mb-3">
              {currentQuestion.options?.map((option, optionIndex) => {
                const isSelected = currentResponse === option;
                return (
                  <label
                    key={optionIndex}
                    className={`
                      relative flex items-center p-2.5 rounded-lg border cursor-pointer transition-all duration-200
                      ${isSelected
                        ? "border-primary bg-green-50/20"
                        : "border-gray-200 bg-white hover:border-gray-300"
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name={`followup-${currentQuestion.id}`}
                      value={option}
                      checked={isSelected}
                      onChange={(e) => handleFollowUpResponse(currentQuestion.id, e.target.value)}
                      className="sr-only"
                    />

                    {/* Custom Radio */}
                    <div className={`
                      w-3.5 h-3.5 rounded-full border mr-2.5 flex items-center justify-center flex-shrink-0 transition-colors
                      ${isSelected ? "border-primary" : "border-gray-300"}
                    `}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>

                    <span className={`text-xs md:text-sm font-medium ${isSelected ? "text-gray-900" : "text-gray-600"}`}>
                      {option}
                    </span>

                    {isSelected && (
                      <CheckCircle className="w-3.5 h-3.5 text-primary ml-auto" />
                    )}
                  </label>
                )
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-1">
              <button
                onClick={handlePrevFollowUp}
                disabled={currentFollowUpIndex === 0}
                className={`
                  flex items-center text-xs font-semibold transition-colors
                  ${currentFollowUpIndex === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-gray-800"}
                `}
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </button>

              {/* Pagination Dots */}
              <div className="hidden md:flex items-center gap-1">
                {Array.from({ length: totalQuestions }, (_, i) => (
                  <div
                    key={i}
                    className={`
                       h-1 rounded-full transition-all duration-300
                       ${i === currentFollowUpIndex ? "w-4 bg-primary" : "w-1 bg-gray-200"}
                     `}
                  />
                ))}
              </div>

              <button
                onClick={handleNextFollowUp}
                disabled={!currentResponse || isLoading}
                className={`
                   flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all
                   ${!currentResponse || isLoading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-primary text-white"}
                `}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Generating...
                  </>
                ) : currentFollowUpIndex === totalQuestions - 1 ? (
                  <>
                    Generate
                    <Award className="w-3.5 h-3.5 ml-1.5" />
                  </>
                ) : (
                  <>
                    Next <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }



  return (
    <div className="min-h-screen lpa-no-scrollbar">
      <DefaultSEOMeta />

      {/* ── AI Generating Overlay ── */}
      <GeneratingOverlay isVisible={isLoading} currentStep={currentStep} />

      {currentStep > 1 && <StepIndicator />}
      {currentStep === 1 && (
        <GoalInputStep
          goalInput={goalInput}
          sessionData={sessionData}
          setGoalInput={setGoalInput}
          handleInitialize={handleInitialize}
          handleSelectHistoryPath={handleSelectHistoryPath}
          isLoading={isLoading}
        />
      )}
      {currentStep === 1.5 && <GoalAnalysisStep />}
      {currentStep === 2 && <SingleQuestionStep />}
      {currentStep === 2.5 && <PreliminaryInsightsStep />}
      {currentStep === 3 && <FollowUpStep />}
      {currentStep === 4 && <UniversalRoadmapDisplay finalRoadmap={finalRoadmap} />}
      {/* Error Popup */}
      <ErrorPopup
        isOpen={errorPopup.show}
        message={errorPopup.message}
        title={errorPopup.title}
        onClose={() => setErrorPopup(prev => ({ ...prev, show: false }))}
      />
    </div>
  )
}

export default UniversalLearningPathAgent
