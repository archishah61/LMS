/* eslint-disable no-empty */
/* eslint-disable react/prop-types */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStudentToken } from '../../services/CookieService';
import { useDispatch, useSelector } from 'react-redux';
import useStudentAuthTokenRefresh from '../../hooks/useStudentAuthTokenRefresh';
import { jwtDecode } from 'jwt-decode';
import {
    useGetAccessibleSessionsQuery,
    useGetAccessibleModulesQuery,
    useGetAccessibleTopicsQuery,
    useGetAccessibleQuizzesQuery,
    useGetAccessibleAssignmentsQuery,
    useGetTopicTypeByIdQuery,
    useGetDetailedTopicByIdQuery,
    useMarkTopicCompletedMutation,
    useTrackStudentTimeSpentOnTopicMutation,
    useGetSlideIdAndTitleByTopicIdQuery,
    useGetSlideContentBySlideIdQuery,
    useGetSlideStatusByTopicIdQuery,
    useUpdateSlideCompletionStatusMutation,
    useUpdateAccrodianCompletionStatusMutation,
    useGetAccordianStatusByTopicIdQuery
} from '../../services/progressTracking/newProgressTrackingApi';
import CourseNavbarDup from '../../components/courseContent/SideBar/CourseNavbarDup';
import { FaInfoCircle, FaBookOpen, FaTimes, FaFile, FaFolder, FaSearch, } from 'react-icons/fa';
import { FiCopy, FiCheck } from 'react-icons/fi';
import parse, { domToReact } from 'html-react-parser';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useGetUserCourseByHashIdQuery } from '../../services/Enrollment/enrollAPI';
import DisplayVideoContentDup from '../../components/courseContent/TopicContent/DisplayVideoContentDup';
import DisplayAudioDup from '../../components/courseContent/TopicContent/DisplayAudioDup';
import DisplayAccordionDup from '../../components/courseContent/TopicContent/DisplayAccordionDup';
import DisplayGeneralDup from '../../components/courseContent/TopicContent/DisplayGeneralDup';
import DisplayMultiSlideDup from '../../components/courseContent/TopicContent/DisplayMultiSlideDup';
import { motion, AnimatePresence } from 'framer-motion';
import DailySessionTracker from './DailySessionTracker';
import { setActiveSession } from '../../features/Course_Management/courseTimeTrackingSlice';
import EndSessionModal from '../../components/modals/EndSessionModal';
import { useGetQuizByQuizIdQuery } from '../../services/Course_Management/quizApi';
import { useGetQuizCompletionByStudentIdQuery } from '../../services/QuizResponse/quizCompletionApi';
import { useGetActiveAssignmentModuleByIdQuery, useGetAssignmentByAssignmentIdQuery } from '../../services/Content_Management/assignmentApi';
import DisplayAssignmentContent from '../../components/courseContent/AssignmentContent/DisplayAssignmentContent';
import { useCreateDueDateOfAssignmentsMutation, useGetAssignmentCompletionByStudentIdQuery } from '../../services/Assignment/assignmentCompletionApi';
import DisplayQuizContent from '../../components/courseContent/QuizContent/DisplayQuizContent';
import { useSummarizePassageMutation } from '../../services/Ai/summarizeApi';
import { useCreateSummaryMutation, useGetSummariesByAccordionIdQuery, useGetSummariesByGeneralMaterialDescIdQuery, useGetSummariesByMultiSlideAccordionIdQuery, useGetSummariesByMultiSlideGeneralDescIdQuery } from '../../services/Ai/summaryApi';
import { useCreateBulletPointMutation } from '../../services/Ai/bulletPointApi';
import { useCreateFlashCardMutation } from '../../services/Ai/flashCardApi';
import ContentSummary from '../../components/courseContent/TopicContent/ContentSummary';
import AudioPlayer from '../../components/ui/audioPlayer';
import { FaExpand, FaCompress, FaListOl, FaClock } from 'react-icons/fa';
import {
    FaClipboardList,
    FaPuzzlePiece,
    FaCheckCircle,
    FaEdit,
    FaFileAlt,
} from 'react-icons/fa';
import { Clipboard, Clock, Timer } from 'lucide-react';
import CertificateModal from '../../components/modal/CertificateModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from "react-hot-toast";

export default function CourseContentDup() {
    const { courseID } = useLocation().state;
    const { sessionState } = useLocation().state;
    const { moduleState } = useLocation().state;
    const { topicState } = useLocation().state;
    const { access_token } = getStudentToken();

    const navigate = useNavigate();

    const [userId, setUserId] = useState();
    const [courseId, setCourseId] = useState();
    const [currentSession, setCurrentSession] = useState(null);
    const [currentModule, setCurrentModule] = useState(null);
    const [currentTopic, setCurrentTopic] = useState(null);
    const [selectedQuizId, setSelectedQuizId] = useState(null);
    const [copiedKey, setCopiedKey] = useState(null);
    const [copiedCodeIndex, setCopiedCodeIndex] = useState(null);
    const [activeTab, setActiveTab] = useState('content');
    // right panel tab: 'topic' shows materials belonging to the topic, 'slide' shows materials for the active slide
    const [rightPanelTab, setRightPanelTab] = useState('topic');
    const [isDescriptionHovered, setIsDescriptionHovered] = useState(false);
    const [isFilesPanelOpen, setIsFilesPanelOpen] = useState(false);
    const [openAccordionIndex, setOpenAccordionIndex] = useState(0);
    const intervalRef = useRef(null);     // holds the active setInterval id
    const elapsedRef = useRef(0);        // holds seconds since last send (no staleness)
    const currentTopicRef = useRef(currentTopic);
    const [displaySeconds, setDisplaySeconds] = useState(0); // just for console/UI
    const completedRef = useRef(false);
    const [activeSlideId, setActiveSlideId] = useState(null);
    const [showEndSessionModal, setShowEndSessionModal] = useState(false);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false); // New state for right sidebar
    const [openMultiSlideAccordionId, setOpenMultiSlideAccordionId] = useState(null);
    const [isNavigatingAway, setIsNavigatingAway] = useState(false);
    const [quizStarted, setQuizStarted] = useState(false);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
    const [fileFilter, setFileFilter] = useState("");
    const [markedTopicResult, setMarkedTopicResult] = useState(null);
    const [lastSlideCompletionInfo, setLastSlideCompletionInfo] = useState(null);
    const [hasSummary, setHasSummary] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [summaryData, setSummaryData] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [previewMaterial, setPreviewMaterial] = useState(null);
    const [previewMaterialType, setPreviewMaterialType] = useState(null);
    const [isNavbarHidden, setIsNavbarHidden] = useState(false);
    const [navigationPhase, setNavigationPhase] = useState(null); // for module assesment through navigate after completion
    const [existingSummaries, setExistingSummaries] = useState(null);
    const [showTopicEndModal, setShowTopicEndModal] = useState(false);
    const [showSlideEndModal, setShowSlideEndModal] = useState(false);
    const [showModuleEndModal, setShowModuleEndModal] = useState(false);
    const [completedSlideId, setCompletedSlideId] = useState(null);
    const [initialized, setInitialized] = useState(false);
    const [initializedSession, setInitializedSession] = useState(false);
    const [initializedModule, setInitializedModule] = useState(false);
    const [loadedData, setLoadedData] = useState(false);
    const [materialsCount, setMaterialsCount] = useState(0);

    const [showDescriptionModal, setShowDescriptionModal] = useState(false);
    const [currentAccordionAudio, setCurrentAccordionAudio] = useState(null);
    const [currentAccordionTimer, setCurrentAccordionTimer] = useState(null);
    const [currentAccordionId, setCurrentAccordionId] = useState(null);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [showQuizAssignmentModal, setShowQuizAssignmentModal] = useState(false);
    const [topicQuizzes, setTopicQuizzes] = useState([]);
    const [topicAssignments, setTopicAssignments] = useState([]);
    const [showModuleCompletionModal, setShowModuleCompletionModal] = useState(false);
    const [showSessionCompletionModal, setShowSessionCompletionModal] = useState(false);
    const [quizProgress, setQuizProgress] = useState(null);

    const [showCertificateModal, setShowCertificateModal] = useState(false);

    const [isAssignmentSidebarOpen, setIsAssignmentSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const [topicExtraTimer, setTopicExtraTimer] = useState({
        active: false,
        key: 0,
        topicId: null,
        totalSeconds: 0,
        remainingSeconds: 0,
    });
    const [slideExtraTimer, setSlideExtraTimer] = useState({
        active: false,
        key: 0,
        topicId: null,
        slideId: null,
        totalSeconds: 0,
        remainingSeconds: 0,
    });
    const topicExtraSpentRef = useRef(0);
    const slideExtraSpentRef = useRef(0);
    const prevTopicIdRef = useRef(null);
    const prevSlideIdRef = useRef(null);

    const [languages, setLanguages] = useState([]);
    const [isTopicCompleted, setIsTopicCompleted] = useState(false);
    const [videoPaused, setVideoPaused] = useState(false);
    const [audioPaused, setAudioPaused] = useState(false);
    // Consider files panel open as a UI-pause as well so timers stop
    const mediaPaused = videoPaused || audioPaused || isFilesPanelOpen;
    // Keep track of media elements we programmatically paused so we can restore them
    const pausedMediaRef = useRef({ videos: new Set(), audios: new Set() });
    // Remember paused flags prior to opening files panel so we don't override user pauses
    const prevPausedFlagsRef = useRef({ videoPaused: false, audioPaused: false });
    // Inactivity handling
    const pausedMediaInactivityRef = useRef({ videos: new Set(), audios: new Set() });
    const inactivityTimerRef = useRef(null);
    const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes
    const [showInactivityModal, setShowInactivityModal] = useState(false);
    const inactivityHandlerRef = useRef(null);

    useEffect(() => {
        const checkScreenSize = () => {
            const mobile = window.innerWidth < 1024; // lg breakpoint
            setIsMobile(mobile);
            if (!mobile) {
                setIsAssignmentSidebarOpen(false); // Auto-close sidebar when resizing to desktop
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    useEffect(() => {
        if (isFilesPanelOpen) {
            const el = document.getElementById('course-navbar');
            if (el) {
                const rect = el.getBoundingClientRect();
                const offset = rect.height; // since navbar is sticky at top 0
                // setNavbarOffset(offset);
                document.documentElement.style.setProperty('--course-navbar-bottom', offset + 'px');
            }
        }
    }, [isFilesPanelOpen]);

    useEffect(() => {
        currentTopicRef.current = currentTopic;
        // Reset scroll to top when topic changes (fixes scroll position issue on next/prev topic navigation)
        window.scrollTo(0, 0);
        if (currentTopic?.content_type === "accordian") {
            setOpenAccordionIndex(0)
        }
    }, [currentTopic?.id]);

    const mediaBase = import.meta.env.VITE_BACKEND_MEDIA_URL || "";
    const dispatch = useDispatch();
    useStudentAuthTokenRefresh();


    const [pendingNavigation, setPendingNavigation] = useState(null);
    const [markTopicCompleted, { isLoading: markingTopic }] = useMarkTopicCompletedMutation();
    const [trackStudentTimeSpentOnTopic] = useTrackStudentTimeSpentOnTopicMutation();
    const [createDueDateOfAssignments] = useCreateDueDateOfAssignmentsMutation()

    const [summarizePassage, { isLoading: isLoadingSummary }] = useSummarizePassageMutation();
    const [createSummary] = useCreateSummaryMutation();
    const [createBulletPoint] = useCreateBulletPointMutation();
    const [createFlashCard] = useCreateFlashCardMutation();

    const [updateSlideStatus] = useUpdateSlideCompletionStatusMutation();
    const [updateAccordionStatus] = useUpdateAccrodianCompletionStatusMutation();

    const [showInstructions, setShowInstructions] = useState(false);

    const minuteToSeconds = useCallback((minutes) => {
        const n = Number(minutes);
        if (!Number.isFinite(n) || n <= 0) return 0;
        // Duration values are treated as decimal minutes (not MM.SS / MM:SS).
        return Math.round(n * 60);
    }, []);

    const trackFirstCompletionExtra = useCallback(async ({ topicId, slideId = null, timeSpent = 0, finalize = false }) => {
        if (!userId || !courseId || !topicId) return;

        const safeTimeSpent = Math.max(0, Math.floor(timeSpent || 0));
        if (safeTimeSpent === 0 && !finalize) return;

        try {
            await trackStudentTimeSpentOnTopic({
                userId,
                courseId,
                sessionId: currentSession?.id,
                moduleId: currentModule?.id,
                topicId,
                accordianId: null,
                slideId,
                timeSpent: safeTimeSpent,
                timer_time: 0,
                access_token,
                completion_status: null,
                include_in_first_completion: safeTimeSpent > 0,
                finalize_first_completion: !!finalize,
            });
        } catch (_) {
        }
    }, [userId, courseId, currentSession?.id, currentModule?.id, access_token, trackStudentTimeSpentOnTopic]);

    const startTopicExtraTimer = useCallback((topicId, seconds) => {
        if (!topicId || !seconds || seconds <= 0) return;
        topicExtraSpentRef.current = 0;
        setTopicExtraTimer({
            active: true,
            key: Date.now(),
            topicId,
            totalSeconds: seconds,
            remainingSeconds: seconds,
        });
    }, []);

    const startSlideExtraTimer = useCallback((topicId, slideId, seconds) => {
        if (!topicId || !slideId || !seconds || seconds <= 0) return;
        slideExtraSpentRef.current = 0;
        setSlideExtraTimer({
            active: true,
            key: Date.now(),
            topicId,
            slideId,
            totalSeconds: seconds,
            remainingSeconds: seconds,
        });
    }, []);

    const activeSession = useSelector(
        (state) => state.courseTimeTracking.activeSession
    );

    // Start timer that ticks each second, sends every 30s, resets after sending
    const startTimer = useCallback(() => {
        if (intervalRef.current || ((selectedAssignmentId || selectedQuizId) ? !isConnectedAssignmentOrQuiz(currentTopic, selectedAssignmentId, selectedQuizId) : false)) return; // already running

        intervalRef.current = setInterval(() => {
            elapsedRef.current += 1;
            const s = elapsedRef.current;
            setDisplaySeconds(s);

            if (s >= 30) {
                const chunk = s; // usually 30, but >=30 guards against small pauses/janks
                // reset local counter before calling API so we never double-count
                elapsedRef.current = 0;
                setDisplaySeconds(0);

                const res = trackStudentTimeSpentOnTopic({
                    userId,
                    courseId,
                    sessionId: currentSession?.id,
                    moduleId: currentModule?.id,
                    topicId: currentTopic?.id,
                    accordianId: null,
                    slideId: null,
                    timeSpent: chunk,     // ✅ send only the delta
                    timer_time: 0,
                    access_token,
                    completion_status: null,
                }).unwrap();
            }
        }, 1000);
    }, [
        userId,
        courseId,
        currentSession?.id,
        currentModule?.id,
        currentTopic?.id,
        selectedQuizId,
        selectedAssignmentId,
        access_token,
        trackStudentTimeSpentOnTopic,
    ]);

    const stopTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const flushPendingTopicTime = useCallback(async (reason = "manual") => {
        const pending = Math.max(0, Math.floor(elapsedRef.current || 0));
        if (
            pending <= 0 ||
            !userId ||
            !courseId ||
            !currentSession?.id ||
            !currentModule?.id ||
            !currentTopic?.id
        ) {
            return 0;
        }

        // Reset first to avoid duplicate sends if another completion path runs.
        elapsedRef.current = 0;
        setDisplaySeconds(0);

        try {
            await trackStudentTimeSpentOnTopic({
                userId,
                courseId,
                sessionId: currentSession?.id,
                moduleId: currentModule?.id,
                topicId: currentTopic?.id,
                accordianId: null,
                slideId: null,
                timeSpent: pending,
                timer_time: 0,
                access_token,
                completion_status: null,
            }).unwrap();
        } catch (error) {
            console.log('[ProgressDebug] flushPendingTopicTime failed', {
                reason,
                pending,
                topicId: currentTopic?.id,
                error,
            });
        }

        return pending;
    }, [
        userId,
        courseId,
        currentSession?.id,
        currentModule?.id,
        currentTopic?.id,
        access_token,
        trackStudentTimeSpentOnTopic,
    ]);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (access_token) {
            try {
                const decodedToken = jwtDecode(access_token);
                if (decodedToken) {
                    setUserId(decodedToken.id);
                }
            } catch (error) {
                console.error(error);
            }
        }
    }, [access_token]);

    const { data: courseData, isLoading, isError, refetch: refetchUserCourse } = useGetUserCourseByHashIdQuery(
        { hashId: courseID, userId, access_token },
        { skip: !userId || !courseID }
    );

    const enrollmentId = courseData?.enrollmentuser;

    useEffect(() => {
        if (courseData?.course?.id) {
            setCourseId(courseData.course.id);
        }
    }, [courseData]);

    const hasSentInitialTimeRef = useRef(false);

    useEffect(() => {
        if (!userId || !courseId || !currentSession?.id || !currentModule?.id || !currentTopic?.id || ((selectedAssignmentId || selectedQuizId) ? !isConnectedAssignmentOrQuiz(currentTopic, selectedAssignmentId, selectedQuizId) : false)) {
            stopTimer();
            elapsedRef.current = 0;
            setDisplaySeconds(0);
            hasSentInitialTimeRef.current = false; // Reset when no valid topic
            return;
        }

        if (!hasSentInitialTimeRef.current && !currentTopic.isCompleted) {
            hasSentInitialTimeRef.current = true;

            trackStudentTimeSpentOnTopic({
                userId,
                courseId,
                sessionId: currentSession?.id,
                moduleId: currentModule?.id,
                topicId: currentTopic?.id,
                accordianId: null,
                slideId: null,
                timeSpent: 0, // Or 1 if you want to count the first second
                timer_time: 0,
                access_token,
                completion_status: "in_progress",
            });
        }

        // switching topic/module/session → stop old, reset, start fresh
        stopTimer();
        elapsedRef.current = 0;
        setDisplaySeconds(0);
        startTimer();

        // cleanup runs when topic/module/session changes or component unmounts
        return () => {
            stopTimer();
            const leftover = elapsedRef.current;

            if (leftover > 0 && ((selectedAssignmentId || selectedQuizId) ? isConnectedAssignmentOrQuiz(currentTopic, selectedAssignmentId, selectedQuizId) : true)) {
                trackStudentTimeSpentOnTopic({
                    userId,
                    courseId,
                    sessionId: currentSession?.id,
                    moduleId: currentModule?.id,
                    topicId: currentTopic?.id,
                    accordianId: null,
                    slideId: null,
                    timeSpent: leftover,  // ✅ send remaining delta
                    timer_time: 0,
                    access_token,
                    completion_status: null,
                });
                elapsedRef.current = 0;
                setDisplaySeconds(0);
            }
            hasSentInitialTimeRef.current = false; // Reset for next topic
        };
    }, [
        userId,
        courseId,
        currentSession?.id,
        currentModule?.id,
        currentTopic?.id,
        selectedQuizId,
        selectedAssignmentId,
        startTimer,
        stopTimer,
        access_token,
        trackStudentTimeSpentOnTopic,
    ]);

    useEffect(() => {
        const onVis = () => {
            if (document.hidden) {
                stopTimer();
            } else {
                // resume only if we are on a valid topic
                if (currentTopic?.id && ((selectedAssignmentId || selectedQuizId) ? isConnectedAssignmentOrQuiz(currentTopic, selectedAssignmentId, selectedQuizId) : true)) {
                    startTimer();
                }
            }
        };
        document.addEventListener("visibilitychange", onVis);
        return () => document.removeEventListener("visibilitychange", onVis);
    }, [startTimer, stopTimer, currentTopic?.id, selectedQuizId, selectedAssignmentId]);

    useEffect(() => {
        if (!currentTopic) return;

        // if backend returns isCompleted inside currentTopic
        setIsTopicCompleted(currentTopic.isCompleted || false);

    }, [currentTopic]);

    const clearInactivityTimer = useCallback(() => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
        }
    }, []);

    const startInactivityTimer = useCallback(() => {
        clearInactivityTimer();
        inactivityTimerRef.current = setTimeout(() => {
            if (inactivityHandlerRef.current) inactivityHandlerRef.current();
        }, INACTIVITY_MS);
    }, [clearInactivityTimer]);

    const handleInactivity = useCallback(() => {
        // If there is active activity, skip
        try {
            const anyMediaPlaying = Array.from(document.querySelectorAll('video, audio')).some((el) => !el.paused);
            if (anyMediaPlaying || intervalRef.current || quizStarted || selectedAssignmentId) {
                // restart timer
                startInactivityTimer();
                return;
            }
        } catch (_) {
            // ignore DOM errors and proceed to show modal
        }

        // Pause currently-playing media and remember them
        try {
            pausedMediaInactivityRef.current = { videos: new Set(), audios: new Set() };
            const videos = Array.from(document.querySelectorAll('video'));
            const audios = Array.from(document.querySelectorAll('audio'));
            videos.forEach((v) => { try { if (!v.paused) { pausedMediaInactivityRef.current.videos.add(v); v.pause(); } } catch (_) { } });
            audios.forEach((a) => { try { if (!a.paused) { pausedMediaInactivityRef.current.audios.add(a); a.pause(); } } catch (_) { } });
        } catch (_) { }

        // Stop the per-topic timer
        stopTimer();

        // Show inactivity modal
        setShowInactivityModal(true);
    }, [quizStarted, selectedAssignmentId, startInactivityTimer, stopTimer]);

    // keep ref to handler so timer can call latest
    useEffect(() => { inactivityHandlerRef.current = handleInactivity; }, [handleInactivity]);

    // reset inactivity timer on user interactions
    useEffect(() => {
        const reset = () => {
            if (showInactivityModal) return; // let modal handle user response
            startInactivityTimer();
        };
        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'click'];
        events.forEach((ev) => document.addEventListener(ev, reset));
        // start timer
        startInactivityTimer();
        return () => {
            clearInactivityTimer();
            events.forEach((ev) => document.removeEventListener(ev, reset));
        };
    }, [startInactivityTimer, clearInactivityTimer, showInactivityModal]);

    const handleInactivityStay = useCallback(() => {
        // Resume any media we paused and restart timers
        try {
            pausedMediaInactivityRef.current.videos.forEach((v) => { try { v.play().catch(() => { }); } catch (_) { } });
            pausedMediaInactivityRef.current.audios.forEach((a) => { try { a.play().catch(() => { }); } catch (_) { } });
        } catch (_) { }

        if (currentTopic?.id) startTimer();
        setShowInactivityModal(false);
        startInactivityTimer();
    }, [startTimer, currentTopic?.id, startInactivityTimer]);

    const handleInactivityEnd = useCallback(async () => {
        // Ask trackers to sync topic time first
        try {
            window.dispatchEvent(new CustomEvent('SYNC_TOPIC_TIME_BEFORE_SESSION_END', { detail: { reason: 'inactivity' } }));
        } catch (_) { }

        // small delay to let listeners save
        await new Promise((r) => setTimeout(r, 100));

        // Read session time from tracker DOM (updated by DailySessionTracker)
        const trackerElement = document.getElementById('daily-session-tracker');
        const time = Number(trackerElement?.getAttribute('data-session-time')) || 0;

        try {
            const blob = new Blob([JSON.stringify({ enrollment_id: enrollmentId, userId: userId, actual_time_spent: time })], { type: 'application/json' });
            navigator.sendBeacon(`${import.meta.env.VITE_BACKEND_URL}/track-course/end-session`, blob);
        } catch (_) { }

        setShowInactivityModal(false);
        // navigate away to dashboard
        navigate('/student-dashboard');
    }, [enrollmentId, userId, navigate]);

    const { data: sessionData, isLoading: sessionLoading, isError: sessionError, refetch: refetchSessions } = useGetAccessibleSessionsQuery({
        userId: Number(userId),
        courseId: Number(courseId),
        access_token
    });

    const { data: moduleData, isLoading: moduleLoading, isError: moduleError, refetch: refetchModules } = useGetAccessibleModulesQuery({
        userId: Number(userId),
        courseId: Number(courseId),
        sessionId: currentSession?.id,
        access_token
    }, {
        skip: !currentSession?.id
    });

    const { data: topicData, isLoading: topicLoading, isError: topicError, refetch: refetchTopics } = useGetAccessibleTopicsQuery({
        userId: Number(userId),
        courseId: Number(courseId),
        sessionId: currentSession?.id,
        moduleId: currentModule?.id,
        access_token
    }, {
        skip: !currentModule?.id
    });

    const { data: quizData, isLoading: quizLoading, isError: quizError, refetch: refetchQuizData } = useGetAccessibleQuizzesQuery({
        userId: Number(userId),
        courseId: Number(courseId),
        moduleId: currentModule?.id,
        access_token
    }, {
        skip: !currentModule?.id
    });


    const { data: assignmentData, isLoading: assignmentLoading, isError: assignmentError, refetch: refetchAssignmentData } = useGetAccessibleAssignmentsQuery({
        userId: Number(userId),
        courseId: Number(courseId),
        moduleId: currentModule?.id,
        access_token
    }, {
        skip: !currentModule?.id
    });

    const { data: topicTypeData, isLoading: topicTypeLoading, isError: topicTypeError } = useGetTopicTypeByIdQuery({
        topicId: currentTopic?.id,
        access_token
    }, {
        skip: !currentTopic?.id
    });

    const { data: detailedTopicData, isLoading: detailedTopicLoading, isError: detailedTopicError } = useGetDetailedTopicByIdQuery({
        topicId: currentTopic?.id,
        access_token
    }, {
        skip: !currentTopic?.id || !['video', 'audio', 'general', 'accordian', 'slide'].includes(topicTypeData?.topicType)
    });

    const { data: accordianStatusData, refetch: refetchAccordianStatusData } = useGetAccordianStatusByTopicIdQuery({
        userId,
        topicId: detailedTopicData?.topic?.id,
        access_token,
    }, {
        skip: !detailedTopicData?.topic?.id
    });

    const { data: selectedQuizData, isLoading: selectedQuizLoading, refetch: refetchSelectedQuiz } = useGetQuizByQuizIdQuery(
        { id: selectedQuizId, access_token },
        { skip: !selectedQuizId }
    );

    const { data: selectedAssignmentData, isLoading: selectedAssignmentLoading } =
        useGetAssignmentByAssignmentIdQuery(
            { assignmentId: selectedAssignmentId, access_token },
            { skip: !selectedAssignmentId }
        );

    const { data: slidesData, isLoading: slidesLoading, isError: slidesError } =
        useGetSlideIdAndTitleByTopicIdQuery(
            { topicId: currentTopic?.id, access_token },
            { skip: !currentTopic?.id || topicTypeData?.topicType !== "slide" }
        );

    const { data: slidesStatusData } = useGetSlideStatusByTopicIdQuery({
        userId,
        topicId: currentTopic?.id,
        access_token,
    });

    // Inside your component:
    const { data: slideContentData, isLoading: slideContentLoading, isError: slideContentError } =
        useGetSlideContentBySlideIdQuery(
            { slideId: activeSlideId, access_token },
            { skip: !activeSlideId } // only fetch when we have a slide selected
        );


    // Pause/resume topic & session timers
    useEffect(() => {
        const handleVideoState = (e) => {
            const state = e.detail?.state;
            const isVideoTopic = topicTypeData?.topicType === 'video' || (topicTypeData?.topicType === 'slide' && slideContentData?.slide?.type === 'video');
            if (!isVideoTopic) return;

            if (state === 'paused') {
                setVideoPaused(true);
                // pause topic tracking timer
                stopTimer();
            } else if (state === 'playing') {
                setVideoPaused(false);
                // resume topic tracking timer only when valid topic
                if (currentTopic?.id) {
                    startTimer();
                }
            } else if (state === 'ended') {
                // ended - clear paused state and resume tracking
                setVideoPaused(false);
                if (currentTopic?.id) startTimer();
            }
        };

        window.addEventListener('VIDEO_PLAY_STATE_CHANGE', handleVideoState);

        // AUDIO handler
        const handleAudioState = (e) => {
            const state = e.detail?.state;
            const isAudioTopic = topicTypeData?.topicType === 'audio'
                || (topicTypeData?.topicType === 'general' && detailedTopicData?.topic?.generalDetails?.[0]?.completion_type === 'audio')
                || (topicTypeData?.topicType === 'accordian')
                || (topicTypeData?.topicType === 'slide' && (slideContentData?.slide?.type === 'audio' || slideContentData?.slide?.completion_type === 'audio'));

            if (!isAudioTopic) return;


            if (state === 'paused') {
                setAudioPaused(true);
                stopTimer();
            } else if (state === 'playing') {
                setAudioPaused(false);
                if (currentTopic?.id) startTimer();
            } else if (state === 'ended') {
                setAudioPaused(false);
                if (currentTopic?.id) startTimer();
            }
        };

        window.addEventListener('AUDIO_PLAY_STATE_CHANGE', handleAudioState);
        return () => {
            window.removeEventListener('VIDEO_PLAY_STATE_CHANGE', handleVideoState);
            window.removeEventListener('AUDIO_PLAY_STATE_CHANGE', handleAudioState);
        };
    }, [topicTypeData?.topicType, detailedTopicData?.topic, slideContentData?.slide?.type, currentTopic?.id, startTimer, stopTimer]);

    // Pause/resume topic & session timers when the Materials (files) panel is opened.
    // If the panel opens we pause currently-playing media and stop timers.
    // When it closes we resume only media we paused earlier and resume timers
    // only if there are no other pause reasons.
    useEffect(() => {
        if (isFilesPanelOpen) {
            // stop per-topic timer immediately
            stopTimer();

            // remember current paused flags so we can restore them later
            prevPausedFlagsRef.current = { videoPaused, audioPaused };

            // collect and pause currently-playing media elements
            try {
                const videos = Array.from(document.querySelectorAll('video'));
                const audios = Array.from(document.querySelectorAll('audio'));

                pausedMediaRef.current.videos = new Set();
                pausedMediaRef.current.audios = new Set();

                videos.forEach((v) => {
                    try {
                        if (!v.paused) {
                            pausedMediaRef.current.videos.add(v);
                            v.pause();
                        }
                    } catch (_) { }
                });

                audios.forEach((a) => {
                    try {
                        if (!a.paused) {
                            pausedMediaRef.current.audios.add(a);
                            a.pause();
                        }
                    } catch (_) { }
                });
            } catch (e) {
                // ignore DOM exceptions
            }

            // set local flags so UI and trackers consider media paused
            setVideoPaused(true);
            setAudioPaused(true);

            // Broadcast paused events so other listeners know playback stopped
            try { window.dispatchEvent(new CustomEvent('VIDEO_PLAY_STATE_CHANGE', { detail: { state: 'paused' } })); } catch (_) { }
            try { window.dispatchEvent(new CustomEvent('AUDIO_PLAY_STATE_CHANGE', { detail: { state: 'paused' } })); } catch (_) { }
        } else {
            // files panel closed: restore previously-playing media
            try {
                pausedMediaRef.current.videos.forEach((v) => {
                    try { v.play().catch(() => { }); } catch (_) { }
                });
                pausedMediaRef.current.audios.forEach((a) => {
                    try { a.play().catch(() => { }); } catch (_) { }
                });
            } catch (e) {
                // ignore
            }

            // restore paused flags to their previous values
            setVideoPaused(prevPausedFlagsRef.current.videoPaused);
            setAudioPaused(prevPausedFlagsRef.current.audioPaused);

            // clear remembered paused elements
            pausedMediaRef.current = { videos: new Set(), audios: new Set() };

            // resume per-topic timer if there are no remaining pause reasons
            const stillPaused = prevPausedFlagsRef.current.videoPaused || prevPausedFlagsRef.current.audioPaused;
            if (!stillPaused && currentTopic?.id) {
                startTimer();
            }
        }
    }, [isFilesPanelOpen, startTimer, stopTimer, currentTopic?.id]);

    useEffect(() => {
        if (!slidesData?.slides?.length || !slidesStatusData?.slideStatus) return;
        // Do not auto-select slides while completion popups are visible or topic is completed.
        if (showTopicEndModal || showModuleEndModal || showSessionCompletionModal) return;

        // Extract all slide IDs from the new data
        const slideIds = slidesData.slides.map(slide => slide.id);

        // Find accessible slides (completed or in_progress)
        const accessibleSlides = slidesStatusData.slideStatus
            .filter(s => s.status !== "not_started")
            .map(s => s.slide_id);

        // ✅ Check if all slides are completed
        const allSlidesCompleted =
            slidesStatusData.slideStatus.length > 0 &&
            slidesStatusData.slideStatus.every(s => s.status === "completed");

        // Choose slide
        let targetSlideId = null;

        if (allSlidesCompleted) {
            // 👉 If all completed → go to FIRST slide
            const firstSlide = [...slidesData.slides]
                .sort((a, b) => a.sequence_no - b.sequence_no)[0];

            targetSlideId = firstSlide?.id;
        } else if (accessibleSlides.length > 0) {
            // 👉 Otherwise → last accessible slide
            targetSlideId = slidesData.slides
                .filter(slide => accessibleSlides.includes(slide.id))
                .sort((a, b) => a.sequence_no - b.sequence_no)
                .slice(-1)[0]?.id;
        }

        // Apply only if activeSlideId is invalid
        if (!slideIds.includes(activeSlideId)) {
            if (targetSlideId) {
                setActiveSlideId(targetSlideId);
            } else {
                // fallback → first slide
                const firstSlide = [...slidesData.slides]
                    .sort((a, b) => a.sequence_no - b.sequence_no)[0];

                if (firstSlide) {
                    setActiveSlideId(firstSlide.id);
                }
            }
        }
    }, [slidesData, slidesStatusData, isTopicCompleted, showTopicEndModal, showModuleEndModal, showSessionCompletionModal]);

    // Initialize session - this runs first
    useEffect(() => {
        if (!initializedSession && sessionData?.sessions) {
            // Find first accessible but NOT completed session
            const firstIncompleteSession = sessionData.sessions.find(session => session.isAccessible && !session.isCompleted);

            // Fallback to last accessible session
            const lastAccessibleSession = [...sessionData.sessions].reverse().find(session => session.isAccessible);

            if (sessionState) {
                setCurrentSession(sessionState)
            } else {
                setCurrentSession(firstIncompleteSession || lastAccessibleSession || sessionData.sessions[0]);
            }
            setInitializedSession(true);
        }
    }, [sessionData, initializedSession, sessionState]);

    const { data: completionData, refetch: refetchQuizCompletion } = useGetQuizCompletionByStudentIdQuery(
        { userId, courseId: courseID },
        { skip: !userId }
    );


    const {
        data: assignmentCompletionData,
        refetch: refetchAssignmentCompletion,
    } = useGetAssignmentCompletionByStudentIdQuery(
        { studentId: userId, access_token },
        {
            skip: !userId,
        }
    );



    const { data: assignmentDataByModule = [], isLoading: isAssignmentLoadingByModule } =
        useGetActiveAssignmentModuleByIdQuery({ moduleId: currentModule?.id, access_token }, { skip: !currentModule?.id });


    const { data: existingAccordionSummaries, isLoading: isLoadingSummaries, refetch } = useGetSummariesByAccordionIdQuery(
        {
            topic_id: currentTopic?.id,
            accordion_id: currentTopic?.id,
            access_token,
        },
        {
            pollingInterval: 30000,
            skip: !currentTopic?.id || !['accordian'].includes(topicTypeData?.topicType)

        }
    );

    const generalDescId = detailedTopicData?.topic?.generalDetails?.[0]?.id || null;
    const { data: existingGeneralSummaries, isLoading: isLoadingGeneralSummaries } = useGetSummariesByGeneralMaterialDescIdQuery(
        {
            topic_id: currentTopic?.id,
            general_material_desc_id: generalDescId,
            access_token,
        },
        {
            pollingInterval: 30000,
            skip: !currentTopic?.id || !['general'].includes(topicTypeData?.topicType) || !generalDescId,
        }
    )

    const { data: existingSlideAccordionSummaries, isLoading: isLoadingAccordionSummaries } = useGetSummariesByMultiSlideAccordionIdQuery({
        topic_id: currentTopic?.id,
        multi_slide_accordion_id: currentTopic?.id,
        access_token,
    }, { skip: !currentTopic?.id });

    const activeGeneralDescId = slideContentData?.slide?.generalDetails?.[0]?.id || null;

    const { data: existingGeneralDescSummaries, isLoading: isLoadingGeneralDescSummaries } = useGetSummariesByMultiSlideGeneralDescIdQuery({
        topic_id: currentTopic?.id,
        multi_slide_general_desc_id: activeGeneralDescId,
        access_token,
    }, { skip: !currentTopic?.id || !activeGeneralDescId });



    useEffect(() => {
        if (slideContentData) {
            let hasExistingSummary = false;
            let existingSummary = null;

            switch (slideContentData.slide.type) {
                case "general":
                    if (existingGeneralDescSummaries && existingGeneralDescSummaries.length > 0) {
                        hasExistingSummary = true;
                        existingSummary = existingGeneralDescSummaries[0];
                    }
                    break;
                case "accordian":
                    if (existingSlideAccordionSummaries && existingSlideAccordionSummaries.length > 0) {
                        hasExistingSummary = true;
                        existingSummary = existingSlideAccordionSummaries[0];
                    }
                    break;
                default:
                    break;
            }

            if (hasExistingSummary && existingSummary) {
                setHasSummary(true);
                setSummaryData({
                    summary: existingSummary.summary,
                    bullet_points: existingSummary.bullet_points.map(bp => bp.bullet_point),
                    flash_cards: existingSummary.flash_cards.map(fc => ({
                        question: fc.question,
                        answer: fc.answer,
                    })),
                });
            } else {
                setHasSummary(false);
                setSummaryData(null);
            }
        }
    }, [slideContentData, existingAccordionSummaries, existingGeneralDescSummaries]);

    useEffect(() => {
        if (['accordian'].includes(topicTypeData?.topicType)) {
            setExistingSummaries(existingAccordionSummaries || []);
        } else if (['general'].includes(topicTypeData?.topicType)) {
            setExistingSummaries(existingGeneralSummaries || []);
        } else {
            setExistingSummaries([]);
        }
    }, [existingAccordionSummaries, existingGeneralSummaries, topicTypeData?.topicType]);

    // Initialize module - runs after session is set
    useEffect(() => {
        if (initializedSession && !initializedModule && moduleData?.modules && currentSession) {
            if (!currentModule || currentModule.sessionId !== currentSession?.id) {
                // Find first accessible but NOT completed module
                const firstIncompleteModule = moduleData.modules.find(module => module.isAccessible && !module.isCompleted);

                // Fallback to last accessible module
                const lastAccessibleModule = [...moduleData.modules]
                    .reverse()
                    .find(module => module.isAccessible);

                if (moduleState) {
                    setCurrentModule(moduleState)
                } else {
                    setCurrentModule(firstIncompleteModule || lastAccessibleModule || moduleData.modules[0]);
                }

                setCurrentTopic(null);
                setInitializedModule(true);
            }
        }
    }, [moduleData, currentSession, initializedSession, moduleState]);

    // MAIN INITIALIZATION: Set initial topic, quiz, or assignment
    // This runs after module is initialized
    useEffect(() => {
        if (!initialized && initializedModule && currentModule && topicData?.topics && quizData?.quizzes && assignmentData?.assignments) {
            // 1️⃣ Find last accessible but not completed topic
            const lastAccessibleTopic = [...(topicData?.topics || [])]
                .find(topic => topic.isAccessible && !topic.isCompleted);

            // 2️⃣ Find last accessible but not completed quiz
            const lastAccessibleQuiz = [...(quizData?.quizzes || [])]
                .find(quiz => quiz.isAccessible && !quiz.isCompleted);

            // 3️⃣ Find last accessible but not completed assignment
            const lastAccessibleAssignment = [...(assignmentData?.assignments || [])]
                .find(assignment => assignment.isAccessible && !assignment.isCompleted);

            // Priority: Topic > Quiz > Assignment
            if (lastAccessibleTopic) {
                if (topicState) {
                    setCurrentTopic(topicState)
                } else {
                    setCurrentTopic(lastAccessibleTopic);
                }
            } else if (lastAccessibleQuiz) {
                handleSetSelectedQuizId(lastAccessibleQuiz.id);
                setCurrentTopic(null);
            } else if (lastAccessibleAssignment) {
                handleSetSelectedAssignmentId(lastAccessibleAssignment.id);
                setCurrentTopic(null);
            } else {
                // If everything is completed, fallback to first accessible item
                const firstAccessibleTopic = [...(topicData?.topics || [])]
                    .find(topic => topic.isAccessible);
                const firstAccessibleQuiz = [...(quizData?.quizzes || [])]
                    .find(quiz => quiz.isAccessible);
                const firstAccessibleAssignment = [...(assignmentData?.assignments || [])]
                    .find(assignment => assignment.isAccessible);

                if (firstAccessibleTopic) {
                    if (topicState) {
                        setCurrentTopic(topicState)
                    } else {
                        setCurrentTopic(firstAccessibleTopic);
                    }
                } else if (firstAccessibleQuiz) {
                    handleSetSelectedQuizId(firstAccessibleQuiz.id);
                    setCurrentTopic(null);
                } else if (firstAccessibleAssignment) {
                    handleSetSelectedAssignmentId(firstAccessibleAssignment.id);
                    setCurrentTopic(null);
                } else {
                    // Fallback to first topic if nothing is accessible
                    if (topicData?.topics?.[0]) {
                        setCurrentTopic(topicData.topics[0]);
                    }
                }
            }

            setInitialized(true);
        }
    }, [initialized, initializedModule, currentModule, topicData, quizData, assignmentData, topicState]);

    useEffect(() => {
        if (existingSummaries && existingSummaries.length > 0) {
            const userSummary = existingSummaries[0];
            if (userSummary) {
                setHasSummary(true);
                setSummaryData({
                    summary: userSummary.summary,
                    bullet_points: userSummary.bullet_points.map(bp => bp.bullet_point),
                    flash_cards: userSummary.flash_cards.map(fc => ({
                        question: fc.question,
                        answer: fc.answer,
                    })),
                });
            } else {
                setHasSummary(false);
                setSummaryData(null);
            }
        } else {
            setHasSummary(false);
            setSummaryData(null);
        }
    }, [existingSummaries]);

    useEffect(() => {
        const accDetailsRoot = detailedTopicData?.topic?.accordianDetails || detailedTopicData?.topic?.accordionDetails || [];
        const curAcc = (openAccordionIndex !== null) ? accDetailsRoot?.[openAccordionIndex] : null;
        const accordionAttachments = curAcc ? (curAcc.AccordionAttachments || curAcc.accordionAttachments || curAcc.attachments || []) : [];
        const generalDetails = topicTypeData?.topicType === 'general' ? (detailedTopicData?.topic?.generalDetails || []) : [];
        const multiSlideGeneralDetails = (topicTypeData?.topicType === 'slide' && slideContentData?.slide?.type === 'general')
            ? (slideContentData?.slide?.generalDetails || []) : [];
        const generalMaterials = generalDetails.flatMap(g => (Array.isArray(g?.materials) ? g.materials : []));
        const multiSlideAttachments = (topicTypeData?.topicType === 'slide' && slideContentData?.slide?.type === 'accordian' && openMultiSlideAccordionId)
            ? (slideContentData?.slide?.accordianDetails?.find(acc => acc.id === openMultiSlideAccordionId)?.MultiSlideAccordionAttachments || []) : [];
        const slideGeneralMaterials = (topicTypeData?.topicType === 'slide' && slideContentData?.slide?.type === 'general')
            ? (slideContentData?.slide?.generalDetails || []).flatMap(g => (Array.isArray(g?.materials) ? g.materials : [])) : [];

        // const all = [
        //     ...accordionAttachments,
        //     ...generalMaterials,
        //     ...multiSlideAttachments,
        //     ...slideGeneralMaterials,
        // ];
        const topicMaterials = detailedTopicData?.topic?.TopicMaterials || [];

        const topicFiles = [
            ...accordionAttachments,
            ...topicMaterials.filter(m => m.fileType !== 'code'), // Exclude code materials from files,
            ...multiSlideAttachments,
            ...slideGeneralMaterials,
        ];

        // Count slide-specific materials if present
        const slideMaterialsCount = (topicTypeData?.topicType === 'slide' && slideContentData?.slide?.slideMaterials)
            ? slideContentData.slide.slideMaterials.length
            : 0;

        setMaterialsCount(topicFiles.length + slideMaterialsCount);
        setLanguages(detailedTopicData?.topic?.languages)
    }, [detailedTopicData, slideContentData, openAccordionIndex, openMultiSlideAccordionId, topicTypeData]);

    // Copy paste restriction useEffect
    useEffect(() => {
        if (courseData?.course?.is_copy_paste_allowed) return;

        const showRestrictionToast = () => {
            toast.error('Cut-Copy-Paste restricted from entire course panel');
        };

        const handleContextMenu = (e) => e.preventDefault();
        const handleCopy = (e) => {
            e.preventDefault();
            showRestrictionToast();
        };
        const handleCut = (e) => {
            e.preventDefault();
            showRestrictionToast();
        };
        const handlePaste = (e) => {
            e.preventDefault();
            showRestrictionToast();
        };
        const handleKeyDown = (e) => {
            if (
                (e.ctrlKey || e.metaKey) &&
                ["c", "v", "x"].includes(e.key.toLowerCase())
            ) {
                e.preventDefault();
                showRestrictionToast();
            }
        };

        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("copy", handleCopy);
        document.addEventListener("cut", handleCut);
        document.addEventListener("paste", handlePaste);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("copy", handleCopy);
            document.removeEventListener("cut", handleCut);
            document.removeEventListener("paste", handlePaste);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [courseData?.course?.is_copy_paste_allowed]);

    const handleSessionStateChange = useCallback((isActive) => {
        // Check current Redux state to prevent unnecessary updates
        const isCurrentlyActive = !!activeSession;
        const isNewStateActive = !!isActive;

        // Always log the current state for debugging
        // Only dispatch if there's actually a change
        if (isCurrentlyActive !== isNewStateActive) {
            // If session is ending, dispatch event for topic time tracking
            if (isCurrentlyActive && !isNewStateActive) {
                // Dispatch both events to ensure proper handling - session limit and session end
                window.dispatchEvent(new CustomEvent('SYNC_TOPIC_TIME_ON_SESSION_LIMIT'));
                window.dispatchEvent(new CustomEvent('SYNC_TOPIC_TIME_BEFORE_SESSION_END', {
                    detail: { reason: 'session_ended_in_course_content' }
                }));
            }

            dispatch(setActiveSession({ session: isActive ? { id: currentSession?.id } : null }));
        } else {
            console.log("No change in session state, not dispatching");
        }
    }, [dispatch, activeSession, currentSession?.id]);

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        setIsFilesPanelOpen(tab === 'files');
        setIsAssignmentSidebarOpen(tab === 'assignment');

        // Close other panels when opening assignment sidebar
        if (tab === 'assignment') {
            setIsFilesPanelOpen(false);
        }
    };

    // Create wrapper functions that update both state and localStorage
    const handleSetSelectedQuizId = (quizId) => {
        setSelectedQuizId(quizId);
        if (quizId) {
            localStorage.setItem('activeCourseContent', JSON.stringify({
                userId: userId,
                contentType: 'quiz',
                contentId: quizId,
                currentSession: currentSession,
                currentModule: currentModule,
                courseId: courseId
            }));
        } else {
            localStorage.removeItem('activeCourseContent');
        }
    };

    const handleSetSelectedAssignmentId = (assignmentId) => {
        setSelectedAssignmentId(assignmentId);
        if (assignmentId) {
            localStorage.setItem('activeCourseContent', JSON.stringify({
                userId: userId,
                contentType: 'assignment',
                contentId: assignmentId,
                currentSession: currentSession,
                currentModule: currentModule,
                courseId: courseId
            }));
        } else {
            localStorage.removeItem('activeCourseContent');
        }
    };

    // Handle back to topics
    const handleBackToTopics = () => {
        setSelectedQuizId(null);
        setSelectedAssignmentId(null);
        localStorage.removeItem('activeCourseContent');
    };

    const handleDownloadMaterial = async (url, fileName) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName || url.split('/').pop() || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Failed to download file. Opening in new tab instead.');
            window.open(url, '_blank');
        }
    };

    // useEffect to restore state on component mount
    useEffect(() => {
        if (!courseId || !userId) return;

        const savedContent = localStorage.getItem('activeCourseContent');

        if (savedContent) {
            try {
                const { contentType, contentId, slideId, userId: savedUserId, courseId: savedCourseId, currentSession: savedSession, currentModule: savedModule } = JSON.parse(savedContent);

                // Only restore if it's the same course
                if (savedCourseId === courseId && savedUserId === userId) {
                    setInitialized(true);
                    if (savedSession && !loadedData) {
                        setInitializedSession(true);
                        setCurrentSession(savedSession);
                    }

                    if (savedModule && !loadedData) {
                        setInitializedModule(true);
                        setCurrentModule(savedModule);
                    }

                    if (contentType === 'quiz') {
                        handleSetSelectedQuizId(contentId);
                        setCurrentTopic(null);
                    } else if (contentType === 'assignment') {
                        handleSetSelectedAssignmentId(contentId);
                        setCurrentTopic(null);
                    } else if (contentType === "topic") {
                        if (!topicData?.topics) return;

                        handleSetSelectedAssignmentId(null);
                        handleSetSelectedQuizId(null);
                        // 🔥 Restore the topic from topicData.topics
                        const topics = topicData.topics;
                        const foundTopic = topics.find(t => t.id == contentId);

                        if (foundTopic) {
                            setCurrentTopic(foundTopic);
                            setActiveSlideId(slideId);
                        }
                    }
                } else {
                    // Clear if it's a different course
                    localStorage.removeItem('activeCourseContent');
                }
            } catch (error) {
                console.error('Error restoring saved content:', error);
                localStorage.removeItem('activeCourseContent');
            } finally {
                setLoadedData(true);
            }
        } else {
            setLoadedData(true);
        }
    }, [courseId, topicData?.topics]);

    useEffect(() => {
        if (currentTopic && !selectedQuizId && !selectedAssignmentId) {
            let slideIdToSave = null;

            // Check slide conditions
            if (topicTypeData?.topicType === "slide" && slidesData?.slides?.length > 0) {
                const slideExists = slidesData.slides.some(
                    slide => slide.id === activeSlideId
                );

                if (slideExists) {
                    slideIdToSave = activeSlideId;
                }
            }

            localStorage.setItem(
                "activeCourseContent",
                JSON.stringify({
                    contentType: "topic",
                    contentId: currentTopic?.id,
                    currentSession: currentSession,
                    currentModule: currentModule,
                    slideId: slideIdToSave,
                    courseId: courseId,
                    userId: userId,
                })
            );
        }
    }, [currentTopic, activeSlideId, topicTypeData]);

    // Also clear localStorage when component unmounts or course changes
    // useEffect(() => {
    //     return () => {
    // Optional: Clear on unmount if you want fresh start on next visit
    // localStorage.removeItem('activeCourseContent');
    //     };
    // }, []);

    const processDescriptionWithTags = (html) => {
        if (!html) return null
        // Trim full-document wrappers
        if (/<!?DOCTYPE|<html/i.test(html)) {
            const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
            if (bodyMatch?.[1]) html = bodyMatch[1]
            html = html.replace(/<head[\s\S]*?<\/head>/i, "")
        }

        const hasLists = /<(ul|ol)[^>]*>/i.test(html)

        const tagRegex = /#[^#\s]+#/g
        const topicTags = Array.isArray(topicData.TopicTags) ? topicData.TopicTags : []
        const grouped = topicTags.reduce((acc, t) => {
            if (!t?.tag) return acc
            acc[t.tag] = acc[t.tag] ? [...acc[t.tag], t] : [t]
            return acc
        }, {})
        const occurrenceTracker = {}
        const isImageExt = (p) => /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(p || "")

        const createTagElement = (tagObj, key) => {
            if (!tagObj)
                return (
                    <span key={key} className="text-gray-400">
                        #missing-tag#
                    </span>
                )
            const fileUrl = `${mediaBase}${tagObj.tag_file_path || "/placeholder.png"}`
            switch (tagObj.tag_file_type) {
                case "image":
                    return (
                        <div key={key} className="my-4 block mx-auto max-w-full text-center">
                            <img
                                src={fileUrl || "/placeholder.svg"}
                                alt={tagObj.tag}
                                className={
                                    hasLists
                                        ? "my-4 max-w-xs max-h-64 w-auto rounded-lg border object-contain shadow-sm block"
                                        : "float-left mr-4 mb-4 max-w-xs max-h-64 w-auto rounded-lg border object-contain shadow-sm"
                                }
                            />
                            <p className="mt-2 text-[10px] md:text-xs font-mono text-black">{tagObj.tag?.replace(/#/g, "")}</p>
                        </div>
                    )
                case "code":
                    return (
                        <div
                            key={key}
                            className="relative my-4 border rounded-xl overflow-hidden bg-gray-900 shadow not-prose clear-both"
                        >
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(tagObj.tag_file_path || "")
                                    setCopiedKey(key)
                                    setTimeout(() => setCopiedKey(null), 1500)
                                }}
                                className={`absolute top-2 right-2 text-[11px] px-2 py-1 rounded-md font-medium transition-all ${copiedKey === key ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-100 hover:bg-gray-600"
                                    }`}
                            >
                                {copiedKey === key ? "Copied" : "Copy"}
                            </button>
                            <SyntaxHighlighter
                                language={tagObj.code_language || "javascript"}
                                style={dracula}
                                customStyle={{ margin: 0, padding: "1rem", fontSize: "13px" }}
                            >
                                {tagObj.tag_file_path || ""}
                            </SyntaxHighlighter>
                            <div className="bg-gray-800 px-4 py-1 border-t border-gray-700 text-center">
                                <p className="text-[10px] md:text-xs font-mono text-white">{tagObj.tag?.replace(/#/g, "")}</p>
                            </div>
                        </div>
                    )
                default:
                    if (isImageExt(tagObj.tag_file_path)) {
                        return (
                            <div key={key} className="my-4 block mx-auto max-w-full text-center">
                                <img
                                    src={fileUrl || "/placeholder.svg"}
                                    alt={tagObj.tag}
                                    className={
                                        hasLists
                                            ? "my-4 max-w-xs max-h-64 w-auto rounded-lg border object-contain shadow-sm block"
                                            : "float-left mr-4 mb-4 max-w-xs max-h-64 w-auto rounded-lg border object-contain shadow-sm"
                                    }
                                />
                                <p className="mt-2 text-[10px] md:text-xs font-mono text-black">{tagObj.tag?.replace(/#/g, "")}</p>
                            </div>
                        )
                    }
                    return (
                        <button
                            key={key}
                            onClick={() => window.open(fileUrl, "_blank", "noopener")}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium transition-colors mr-2 mb-2"
                        >
                            View File
                        </button>
                    )
            }
        }

        // Add element-level styling so TinyMCE HTML (lists, headings, links, etc.) renders properly.
        const options = {
            replace: (node) => {
                // Style HTML element tags
                if (node.type === "tag") {
                    const { name, children, attribs = {} } = node
                    const commonText = "text-gray-800"
                    if (name === "p") {
                        return <p className={`mb-3 leading-relaxed ${commonText}`}>{domToReact(children, options)}</p>
                    }
                    if (name === "h1") {
                        return <h1 className="mt-4 mb-3 text-2xl font-semibold text-gray-900">{domToReact(children, options)}</h1>
                    }
                    if (name === "h2") {
                        return <h2 className="mt-4 mb-2 text-xl font-semibold text-gray-900">{domToReact(children, options)}</h2>
                    }
                    if (name === "h3") {
                        return <h3 className="mt-3 mb-2 text-lg font-semibold text-gray-900">{domToReact(children, options)}</h3>
                    }
                    if (name === "ul") {
                        return <ul className="my-3 list-disc pl-5 space-y-2">{domToReact(children, options)}</ul>
                    }
                    if (name === "ol") {
                        return <ol className="my-3 list-decimal pl-5 space-y-2">{domToReact(children, options)}</ol>
                    }
                    if (name === "li") {
                        return <li className={`${commonText}`}>{domToReact(children, options)}</li>
                    }
                    if (name === "a") {
                        const href = attribs.href || "#"
                        return (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline hover:text-blue-700"
                            >
                                {domToReact(children, options)}
                            </a>
                        )
                    }
                    if (name === "blockquote") {
                        return (
                            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-3">
                                {domToReact(children, options)}
                            </blockquote>
                        )
                    }
                    if (name === "pre") {
                        return (
                            <pre className="my-4 rounded-lg bg-gray-900 text-gray-100 p-4 overflow-auto text-xs">
                                {domToReact(children, options)}
                            </pre>
                        )
                    }
                    if (name === "code") {
                        return (
                            <code className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-800">{domToReact(children, options)}</code>
                        )
                    }
                    if (name === "table") {
                        return (
                            <div className="my-4 overflow-auto">
                                <table className="w-full border-collapse text-sm">{domToReact(children, options)}</table>
                            </div>
                        )
                    }
                    if (name === "th") {
                        return (
                            <th className="border border-gray-200 bg-gray-50 px-3 py-2 text-left font-medium text-gray-900">
                                {domToReact(children, options)}
                            </th>
                        )
                    }
                    if (name === "td") {
                        return (
                            <td className="border border-gray-200 px-3 py-2 align-top text-gray-800">
                                {domToReact(children, options)}
                            </td>
                        )
                    }
                    if (name === "img") {
                        const src = attribs.src || "/placeholder.svg"
                        const alt = attribs.alt || "image"
                        return (
                            <img
                                src={src || "/placeholder.svg"}
                                alt={alt}
                                className={
                                    hasLists
                                        ? "my-4 max-w-xs max-h-64 w-auto rounded-lg border object-contain shadow-sm block"
                                        : "float-left mr-4 mb-4 max-w-xs max-h-64 w-auto rounded-lg border object-contain shadow-sm"
                                }
                            />
                        )
                    }
                }

                // Existing tag token replacement against text nodes
                if (node.type !== "text") return undefined
                const text = node.data
                const matches = [...text.matchAll(tagRegex)]
                if (!matches.length) return undefined
                const parts = []
                let cursor = 0
                matches.forEach((m) => {
                    const match = m[0]
                    const offset = m.index
                    if (offset > cursor) parts.push(text.slice(cursor, offset))
                    occurrenceTracker[match] = (occurrenceTracker[match] || 0) + 1
                    const list = grouped[match] || []
                    const tagObj = list[occurrenceTracker[match] - 1] || list[0]
                    parts.push(createTagElement(tagObj, `${match}-${occurrenceTracker[match]}`) || match)
                    cursor = offset + match.length
                })
                if (cursor < text.length) parts.push(text.slice(cursor))
                return <>{parts.map((p, i) => (typeof p === "string" ? <span key={i}>{p}</span> : p))}</>
            },
        }

        return parse(html, options)
    }

    const decodeHtml = (htmlString) => {
        if (!htmlString) return '';

        // Create a temporary div element to parse HTML and get text content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;
        return tempDiv.textContent || tempDiv.innerText || '';
    };

    const summarizeGeneralDescription = async (description) => {
        try {
            setIsSummaryLoading(true);
            if (!description) return;

            // Clean the HTML content before sending
            const cleanText = cleanHtmlContent(description);

            const result = await summarizePassage({ passage: cleanText, access_token }).unwrap();

            // Prepare the summary data
            const summaryData = {
                topic_id: currentTopic.id,
                summary: result.summary,
                general_material_desc_id: null,
                general_material_pdf_id: null,
                accordion_id: null,
                multi_slide_general_desc_id: activeGeneralDescId,
                multi_slide_general_pdf_id: null,
                multi_slide_accordion_id: null,
            };

            const response = await createSummary({ summaryData, access_token }).unwrap();

            const bulletPointData = {
                summary_id: response.id,
                bullet_point: result.bullet_points,
            }

            await createBulletPoint({ bulletPointData, access_token }).unwrap();

            const flashCardData = {
                summary_id: response.id,
                flash_cards: result.flash_cards,
            }

            await createFlashCard({ flashCardData, access_token }).unwrap();
            setSummaryData(result);
            setShowSummary(true);
        } finally {
            setIsSummaryLoading(false);
        }
    };

    const summarizeAllAccordionBodies = async () => {
        try {
            setIsSummaryLoading(true);

            const accordions = slideContentData?.slide?.accordianDetails || [];

            if (accordions.length === 0) return;

            const allBodies = accordions.map(accordion => accordion.body).join('\n\n');

            const result = await summarizePassage({ passage: allBodies, access_token }).unwrap();

            // Prepare the summary data
            const summaryData = {
                topic_id: currentTopic?.id,
                summary: result.summary,
                general_material_desc_id: null,
                general_material_pdf_id: null,
                accordion_id: null,
                multi_slide_general_desc_id: null,
                multi_slide_general_pdf_id: null,
                multi_slide_accordion_id: currentTopic?.id,
            };

            const response = await createSummary({ summaryData, access_token }).unwrap();

            const bulletPointData = {
                summary_id: response.id,
                bullet_point: result.bullet_points,
            }

            await createBulletPoint({ bulletPointData, access_token }).unwrap();

            const flashCardData = {
                summary_id: response.id,
                flash_cards: result.flash_cards,
            }

            await createFlashCard({ flashCardData, access_token }).unwrap();
            setSummaryData(result);
            setShowSummary(true);
        } finally {
            setIsSummaryLoading(false);
        }
    };

    const hasQuizzesOrAssignments = (topicData) => {
        if (!topicData) return false;

        const hasQuizzes = Array.isArray(topicData.quizzes) && topicData.quizzes.length > 0;
        const hasAssignments = Array.isArray(topicData.assignments) && topicData.assignments.length > 0;

        return hasQuizzes || hasAssignments;
    }

    const isConnectedAssignmentOrQuiz = (topicData, selectedAssignmentId, selectedQuizId) => {
        if (!topicData) return true;

        const quizIds = Array.isArray(topicData.quizzes)
            ? topicData.quizzes.map(q => q.id)
            : [];

        const assignmentIds = Array.isArray(topicData.assignments)
            ? topicData.assignments.map(a => a.id)
            : [];

        // Check if the provided IDs exist in topicData
        const isQuizConnected = selectedQuizId ? quizIds.includes(selectedQuizId) : false;
        const isAssignmentConnected = selectedAssignmentId ? assignmentIds.includes(selectedAssignmentId) : false;

        // Return true only if one of it is connected
        return (isQuizConnected || isAssignmentConnected);
    };

    const areTopicQuizzesAndAssignmentsCompleted = (topic) => {
        const quizzesCompleted = topic?.quizzes?.every(q => q.isCompleted) ?? true;
        const assignmentsCompleted = topic?.assignments?.every(a => a.isCompleted) ?? true;
        return quizzesCompleted && assignmentsCompleted;
    };

    // Helper function to show appropriate modals after topic completion
    const showTopicCompletionModals = useCallback((markedTopic) => {

        // Check for session and module completion
        const hasCompletedSession = markedTopic?.sessionCompletionStatus?.sessionCompleted;
        const alreadyCompletedSession = markedTopic?.sessionCompletionStatus?.sessionAlreadyCompleted;
        const hasCompletedModule = markedTopic?.moduleStatus?.isModuleCompleted;
        const alreadyCompletedModule = markedTopic?.moduleStatus?.moduleAlreadyCompleted;
        const isLastModule = markedTopic?.moduleStatus?.isLastModule;
        const moduleContainAssesment = markedTopic?.moduleStatus?.details?.totalAssignments > 0 || markedTopic?.moduleStatus?.details?.totalQuizzes > 0
        const courseCompleted = markedTopic?.courseCompletionStatus?.courseCompleted;
        const courseAlreadyCompleted = markedTopic?.courseCompletionStatus?.courseAlreadyCompleted;

        // Clear any previous modal states
        setShowTopicEndModal(false);
        setShowModuleCompletionModal(false);
        setShowModuleEndModal(false);
        setShowSessionCompletionModal(false);

        console.log("markedTopic ", markedTopic);

        if (courseCompleted && !courseAlreadyCompleted) {
            clearActiveSlideForNavigation();
            setShowCertificateModal(true);
        } else if (hasCompletedSession && (!alreadyCompletedSession || (alreadyCompletedSession && markedTopic.isLastTopic && isLastModule && !moduleContainAssesment))) {
            setShowSessionCompletionModal(true);
        } else if (hasCompletedModule && (!alreadyCompletedModule || (alreadyCompletedModule && markedTopic.isLastTopic && !moduleContainAssesment))) {
            setShowModuleCompletionModal(true);
        } else if (markedTopic && markedTopic.isLastTopic) {
            setShowModuleEndModal(true);
        } else {
            setShowTopicEndModal(true);
        }
    }, []);

    const handleMarkTopicCompleted = useCallback(async (options = {}) => {
        const deferCompletionPopups = typeof options === "object" && options?.deferCompletionPopups === true;
        const topic = currentTopicRef.current;

        if (!userId || !courseId || !topic?.id) {
            return;
        }

        try {
            // Flush unsent (<30s) topic time before completion to avoid first-completion undercount.
            await flushPendingTopicTime('before-topic-complete');

            const hasContent = hasQuizzesOrAssignments(topic);

            if (!hasContent) {
                const markedTopic = await markTopicCompleted({
                    userId,
                    courseId,
                    topicId: topic.id,
                    access_token,
                }).unwrap();

                setMarkedTopicResult(markedTopic);
                setIsTopicCompleted(markedTopic.success || false);

                // Refetch data to ensure next items are unlocked
                refetchTopics();
                refetchModules();
                refetchSessions();

                if (!deferCompletionPopups) {
                    showTopicCompletionModals(markedTopic);
                }
            } else {

                setTopicQuizzes(topic.quizzes);
                setTopicAssignments(topic.assignments);

                const allQuizzesCompleted = topic.quizzes.every(quiz =>
                    quiz.isCompleted === 1
                );

                const allAssignmentsCompleted = topic.assignments.every(assignment =>
                    assignment.isCompleted === 1
                );


                if (allQuizzesCompleted && allAssignmentsCompleted) {
                    const markedTopic = await markTopicCompleted({
                        userId,
                        courseId,
                        topicId: topic.id,
                        access_token,
                    }).unwrap();

                    setMarkedTopicResult(markedTopic);
                    setIsTopicCompleted(markedTopic.success || false);

                    // Refetch data to ensure next items are unlocked
                    refetchTopics();
                    refetchModules();
                    refetchSessions();

                    if (!deferCompletionPopups) {
                        showTopicCompletionModals(markedTopic);
                    }
                    completedRef.current = true;
                } else {
                    setShowQuizAssignmentModal(true);
                    console.log("❌ Cannot mark topic as completed - content pending completion");
                }
            }
        } catch (error) {
            console.log('[ProgressDebug] handleMarkTopicCompleted error', error);
            const errorMessage = error?.data?.error ||
                error?.data?.message ||
                error?.error ||
                error?.message ||
                'Failed to delete role';
            toast.error(errorMessage);
        }
    }, [userId, courseId, currentTopic, currentTopicRef, access_token, markTopicCompleted, showTopicCompletionModals, refetchTopics, refetchModules, refetchSessions, flushPendingTopicTime]);


    useEffect(() => {
        if (!currentTopic || !hasQuizzesOrAssignments(currentTopic)) return;

        const allQuizzesCompleted = currentTopic.quizzes?.every(q => q.isCompleted === 1) ?? true;
        const allAssignmentsCompleted = currentTopic.assignments?.every(a => a.isCompleted === 1) ?? true;

        if (allQuizzesCompleted && allAssignmentsCompleted && !currentTopic.isCompleted) {
            const extraFromCurrentTopic = minuteToSeconds(currentTopic?.extra_duration);
            const extraFromDetailedTopic = minuteToSeconds(detailedTopicData?.topic?.extra_duration);
            const extraSeconds = extraFromCurrentTopic > 0 ? extraFromCurrentTopic : extraFromDetailedTopic;
            const shouldRunTopicExtra = !isYouTubeTopic && extraSeconds > 0;
            handleMarkTopicCompleted({ deferCompletionPopups: shouldRunTopicExtra });
            if (shouldRunTopicExtra && currentTopic?.id && !topicExtraTimer.active) {
                startTopicExtraTimer(currentTopic.id, extraSeconds);
            }
        }
    }, [currentTopic, minuteToSeconds, detailedTopicData?.topic?.extra_duration, topicExtraTimer.active, startTopicExtraTimer]);

    useEffect(() => {
        if (currentTopic && hasQuizzesOrAssignments(currentTopic) && topicData?.topics) {
            const topic = [...topicData.topics]
                .find(topic => topic.id === currentTopic.id);

            if (topic) {
                setCurrentTopic(topic);
            }
        }
    }, [topicData]);

    const toggleRightSidebar = () => {
        setIsRightSidebarOpen(!isRightSidebarOpen);
    };

    const countTotalQuestions = (quiz) => {
        if (!quiz) return 0;

        return (
            (quiz.QuizQuestions?.length || 0) +
            (quiz.QuizPreDefinedQuestions?.length || 0) +
            (quiz.RealWordQuestions?.length || 0) +
            (quiz.AudioToScriptQuestions?.length || 0) +
            (quiz.VideoToScriptQuestions?.length || 0) +
            (quiz.ImageToScriptQuestions?.length || 0) +
            (quiz.ArrangeOrderQuestions?.length || 0) +
            (quiz.AudioPauseQuestions?.length || 0) +
            (quiz.VideoPauseQuestions?.length || 0) +
            (quiz.SpeakingQuestions?.length || 0) +
            (quiz.DragDropQuestions?.length || 0) +
            (quiz.SummarizePassageQuestions?.length || 0) +
            (quiz.BestOptionQuestions?.length || 0) +
            (quiz.CompleteSentenceQuestions?.length || 0)
        );
    };

    const summarizeAllAccordions = async () => {
        if (!detailedTopicData?.topic?.accordianDetails || detailedTopicData?.topic?.accordianDetails.length === 0) return;
        try {
            const allBodies = detailedTopicData?.topic?.accordianDetails.map(accordion => accordion.body).join('\n\n');
            const result = await summarizePassage({ passage: allBodies, access_token }).unwrap();

            const summaryData = {
                topic_id: currentTopic.id,
                summary: result.summary,
                general_material_desc_id: null,
                general_material_pdf_id: null,
                accordion_id: currentTopic.id,
                multi_slide_general_desc_id: null,
                multi_slide_general_pdf_id: null,
                multi_slide_accordion_id: null,
                user_id: access_token.userId
            };

            const response = await createSummary({ summaryData, access_token }).unwrap();

            const bulletPointData = {
                summary_id: response.id,
                bullet_point: result.bullet_points,
            };

            await createBulletPoint({ bulletPointData, access_token }).unwrap();

            const flashCardData = {
                summary_id: response.id,
                flash_cards: result.flash_cards,
            };

            await createFlashCard({ flashCardData, access_token }).unwrap();

            // Refetch the summaries to ensure the latest data is displayed
            await refetch();

            setSummaryData({
                summary: result.summary,
                bullet_points: result.bullet_points,
                flash_cards: result.flash_cards,
            });
            setShowSummary(true);
            setHasSummary(true);
        } catch (error) {
            const errorMessage = error?.data?.error ||
                error?.data?.message ||
                error?.error ||
                error?.message ||
                'Failed to delete role';
            toast.error(errorMessage);
        }
    };

    const viewSummary = () => {
        if (summaryData) {
            setShowSummary(true);
        }
    };
    const cleanHtmlContent = (html) => {
        if (!html) return ""
        const temp = document.createElement("div")
        temp.innerHTML = html
        temp.querySelectorAll("script,style").forEach((n) => n.remove())
        return (temp.textContent || "").replace(/\s+/g, " ").trim()
    }


    const currentSlideIndex = slidesData?.slides?.findIndex((slide) => slide.id === activeSlideId)
    const currentSlide = slidesData?.slides[currentSlideIndex]
    const displaySlide = currentSlide || slidesData?.slides[0]
    const isLastSlide = currentSlideIndex === (slidesData?.slides?.length || 0) - 1;
    const isYouTubeSlide = slideContentData?.slide?.type === "video" &&
        slideContentData?.slide?.videoDetails?.type === "youtube";
    const isYouTubeTopic = topicTypeData?.topicType === "video" &&
        detailedTopicData?.topic?.videoDetails?.[0]?.video_type === "youtube";

    const materialsScopeKey = useMemo(() => {
        const topicId = currentTopic?.id ?? 'none';
        const topicType = topicTypeData?.topicType;

        if (topicType === 'slide') {
            const slideId = activeSlideId ?? slideContentData?.slide?.id ?? 'none';
            const slideType = slideContentData?.slide?.type;

            if (slideType === 'accordian') {
                const sectionId = openMultiSlideAccordionId ?? 'none';
                return `topic:${topicId}|slide:${slideId}|slide-accordion:${sectionId}`;
            }

            return `topic:${topicId}|slide:${slideId}|slide-type:${slideType || 'default'}`;
        }

        if (topicType === 'accordian' || topicType === 'accordion') {
            const accDetailsRoot = detailedTopicData?.topic?.accordianDetails || detailedTopicData?.topic?.accordionDetails || [];
            const section = openAccordionIndex !== null ? accDetailsRoot?.[openAccordionIndex] : null;
            const sectionId = section?.id ?? openAccordionIndex ?? 'none';
            return `topic:${topicId}|topic-accordion:${sectionId}`;
        }

        return `topic:${topicId}|topic-type:${topicType || 'default'}`;
    }, [
        currentTopic?.id,
        topicTypeData?.topicType,
        activeSlideId,
        slideContentData?.slide?.id,
        slideContentData?.slide?.type,
        openMultiSlideAccordionId,
        detailedTopicData?.topic?.accordianDetails,
        detailedTopicData?.topic?.accordionDetails,
        openAccordionIndex,
    ]);

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const clearActiveSlideForNavigation = useCallback(async () => {
        if (currentTopicRef.current?.content_type === "slide") {
            setActiveSlideId(null);

            await delay(200); // central delay here
        }
    }, []);

    const handleTopicCompletionWithExtra = useCallback(async () => {
        const wasAlreadyCompleted = !!currentTopic?.isCompleted;
        const topicExtraFromCurrent = minuteToSeconds(currentTopic?.extra_duration);
        const topicExtraFromDetailed = minuteToSeconds(detailedTopicData?.topic?.extra_duration);
        const topicExtraSeconds = topicExtraFromCurrent > 0 ? topicExtraFromCurrent : topicExtraFromDetailed;
        const shouldRunTopicExtra = !isYouTubeTopic && !wasAlreadyCompleted && topicExtraSeconds > 0;

        await handleMarkTopicCompleted({ deferCompletionPopups: shouldRunTopicExtra });

        if (!shouldRunTopicExtra) return;

        if (topicExtraSeconds > 0 && currentTopic?.id) {
            startTopicExtraTimer(currentTopic.id, topicExtraSeconds);
        }
    }, [handleMarkTopicCompleted, isYouTubeTopic, minuteToSeconds, currentTopic?.extra_duration, currentTopic?.id, currentTopic?.isCompleted, detailedTopicData?.topic?.extra_duration, startTopicExtraTimer]);

    const summarizeDescription = async () => {
        if (!detailedTopicData?.topic?.generalDetails[0]?.description) return

        try {
            const cleanText = cleanHtmlContent(detailedTopicData?.topic?.generalDetails[0]?.description)
            if (!cleanText) return
            const result = await summarizePassage({ passage: cleanText, access_token }).unwrap()
            const summaryPayload = {
                topic_id: currentTopic.id,
                summary: result.summary,
                general_material_desc_id: generalDescId,
                general_material_pdf_id: null,
                accordion_id: null,
                multi_slide_general_desc_id: null,
                multi_slide_general_pdf_id: null,
                multi_slide_accordion_id: null,
            }
            const saved = await createSummary({ summaryData: summaryPayload, access_token }).unwrap()
            await createBulletPoint({
                bulletPointData: { summary_id: saved.id, bullet_point: result.bullet_points },
                access_token,
            }).unwrap()
            await createFlashCard({
                flashCardData: { summary_id: saved.id, flash_cards: result.flash_cards },
                access_token,
            }).unwrap()
            setSummaryData({ summary: result.summary, bullet_points: result.bullet_points, flash_cards: result.flash_cards })
            setHasSummary(true)
            setShowSummary(true)
        } catch (e) {
            const errorMessage = e?.data?.error ||
                e?.data?.message ||
                e?.error ||
                e?.message ||
                'Failed to delete role';
            toast.error(errorMessage);
        }
    }

    const activeIndex = currentSlideIndex !== -1 ? currentSlideIndex : 0


    const goToPrevious = async () => {
        if (activeIndex > 0) {
            await clearActiveSlideForNavigation();
            setActiveSlideId(slidesData?.slides[activeIndex - 1].id)
        }
    }

    const goToNext = async () => {
        if (activeIndex < slidesData?.slides.length - 1) {
            await clearActiveSlideForNavigation();
            setActiveSlideId(slidesData?.slides[activeIndex + 1].id)
        }
    }

    const [openId, setOpenId] = useState(openMultiSlideAccordionId || slideContentData?.slide?.accordianDetails?.[0]?.id || null);


    const nextSlide = slidesData?.slides[activeIndex + 1];
    const nextSlideStatus = slidesStatusData?.slideStatus?.find(
        (s) => s.slide_id === nextSlide?.id
    )?.status;

    useEffect(() => {
        const prevTopicId = prevTopicIdRef.current;
        const nextTopicId = currentTopic?.id || null;

        if (prevTopicId && prevTopicId !== nextTopicId) {
            const spent = topicExtraSpentRef.current || 0;
            if (spent > 0) {
                trackFirstCompletionExtra({ topicId: prevTopicId, timeSpent: spent, finalize: true });
            } else {
                trackFirstCompletionExtra({ topicId: prevTopicId, timeSpent: 0, finalize: true });
            }

            setTopicExtraTimer((prev) => ({ ...prev, active: false, remainingSeconds: 0 }));
            topicExtraSpentRef.current = 0;
        }

        prevTopicIdRef.current = nextTopicId;
    }, [currentTopic?.id, topicExtraTimer.active, trackFirstCompletionExtra]);

    useEffect(() => {
        const prevSlideId = prevSlideIdRef.current;
        const nextSlideId = activeSlideId || null;

        if (prevSlideId && prevSlideId !== nextSlideId && slideExtraTimer.topicId) {
            const spent = slideExtraSpentRef.current || 0;
            // if (spent > 0) {
            //     trackFirstCompletionExtra({
            //         topicId: slideExtraTimer.topicId,
            //         slideId: prevSlideId,
            //         timeSpent: spent,
            //         finalize: true,
            //     });
            // } else {
            //     trackFirstCompletionExtra({
            //         topicId: slideExtraTimer.topicId,
            //         slideId: prevSlideId,
            //         timeSpent: 0,
            //         finalize: true,
            //     });
            // }

            setSlideExtraTimer((prev) => ({ ...prev, active: false, remainingSeconds: 0 }));

            slideExtraSpentRef.current = 0;
        }

        prevSlideIdRef.current = nextSlideId;
    }, [activeSlideId, slideExtraTimer.topicId, trackFirstCompletionExtra]);

    const handleSlideComplete = async (slideId, isYouTubeSlide = false) => {

        const existingSlideStatus = slidesStatusData?.slideStatus?.find((s) => s.slide_id === slideId)?.status;
        const wasAlreadyCompleted = existingSlideStatus === 'completed';

        const topic = currentTopicRef.current;

        await updateSlideStatus({
            userId,
            topicId: topic.id,
            slideId: slideId,
            completionStatus: "completed",
            access_token,
        }).unwrap();

        // find current slide index
        const currentIndex = slidesData.slides.findIndex(s => s.id === slideId);
        const isLastSlide = currentIndex === slidesData.slides.length - 1;

        // Check if this is the last topic in the module
        const isLastTopic = topicData?.topics?.findIndex(t => t.id === topic?.id) === topicData?.topics?.length - 1;

        // Set completed slide ID
        setCompletedSlideId(slideId);

        const slideInfo = slidesData?.slides?.find((s) => s.id === slideId);
        const slideExtraSeconds = !isYouTubeSlide ? minuteToSeconds(slideInfo?.slide_extra_duration || slideContentData?.slide?.slide_extra_duration) : 0;
        const shouldRunSlideExtra = slideExtraSeconds > 0 && !wasAlreadyCompleted;

        if (shouldRunSlideExtra) {
            startSlideExtraTimer(topic?.id, slideId, slideExtraSeconds);
        }

        // Only show completion modal if it's not last slide and no slide extra
        if (!(isLastSlide) && !isYouTubeSlide && !shouldRunSlideExtra) {
            setShowSlideEndModal(true);
        }

        // Store slide completion info for later use (when extra timer completes)
        setLastSlideCompletionInfo({
            slideId,
            isLastSlide,
            isYouTubeSlide,
            shouldRunSlideExtra,
        });

        if (isLastSlide) {
            // Keep the current slide selected; resetting to null can trigger slide re-initialization.
            // ✅ Last slide, mark topic as completed
            if (typeof handleMarkTopicCompleted === "function") {
                handleMarkTopicCompleted({ deferCompletionPopups: shouldRunSlideExtra });
            }
        }
    };

    const handleNextModule = async () => {
        await clearActiveSlideForNavigation();
        // Find the next module in the modules array
        const currentModuleIndex = moduleData?.modules?.findIndex(m => m.id === currentModule?.id);
        if (currentModuleIndex !== -1 && currentModuleIndex < moduleData?.modules?.length - 1) {
            const nextModule = moduleData?.modules[currentModuleIndex + 1];
            if (nextModule?.isAccessible) {
                setCurrentModule(nextModule);
                // Reset topic and selections to ensure we start fresh in the new module
                setCurrentTopic(null);
                handleSetSelectedQuizId(null);
                handleSetSelectedAssignmentId(null);
            }
        }
        setShowModuleCompletionModal(false);
    };

    const handleNextSession = async () => {
        await clearActiveSlideForNavigation();
        // Find the next session in the sessions array
        const currentSessionIndex = sessionData?.sessions?.findIndex(s => s.id === currentSession?.id);
        if (currentSessionIndex !== -1 && currentSessionIndex < sessionData?.sessions?.length - 1) {
            const nextSession = sessionData?.sessions[currentSessionIndex + 1];
            if (nextSession?.isAccessible) {
                // Set the next session
                setCurrentSession(nextSession);
                // Reset module and topic since we're changing sessions
                setCurrentModule(null);
                setCurrentTopic(null);
                // Reset other states as needed
                handleSetSelectedQuizId(null);
                handleSetSelectedAssignmentId(null);
            }
        } else {
            // If there's no next session, just close the modal
            setShowSessionCompletionModal(false);
        }
        // Close the modal
        setShowSessionCompletionModal(false);
    };

    const navigateToNextTopic = useCallback(async () => {
        await clearActiveSlideForNavigation();
        // 1. Try Next Topic in current module
        if (topicData?.topics && currentTopic) {
            const topics = topicData.topics;
            const currentIndex = topics.findIndex(t => t.id === currentTopic.id);
            const nextTopic = topics[currentIndex + 1];

            if (nextTopic && nextTopic.isAccessible) {
                setCurrentTopic(nextTopic);
                handleSetSelectedQuizId(null);
                handleSetSelectedAssignmentId(null);
                return;
            }
        }

        // 2. Next module
        if (moduleData?.modules && currentModule) {
            const currentModuleIndex = moduleData.modules.findIndex(m => m.id === currentModule.id);
            const nextModule = moduleData.modules[currentModuleIndex + 1];
            if (nextModule && nextModule.isAccessible) {
                setCurrentModule(nextModule);
                setCurrentTopic(null);
                handleSetSelectedQuizId(null);
                handleSetSelectedAssignmentId(null);
                return;
            }
        }

        // 3. Next session
        if (sessionData?.sessions && currentSession) {
            const currentSessionIndex = sessionData.sessions.findIndex(s => s.id === currentSession.id);
            const nextSession = sessionData.sessions[currentSessionIndex + 1];
            if (nextSession && nextSession.isAccessible) {
                setCurrentSession(nextSession);
                setCurrentModule(null);
                setCurrentTopic(null);
                handleSetSelectedQuizId(null);
                handleSetSelectedAssignmentId(null);
                return;
            }
        }

        // 4. Default fallback: deselect everything
        handleSetSelectedQuizId(null);
        handleSetSelectedAssignmentId(null);
    }, [
        currentTopic, topicData,
        currentModule, moduleData,
        currentSession, sessionData,
        clearActiveSlideForNavigation
    ]);

    const canContinueFromAssessment = useMemo(() => {
        if (!selectedQuizId && !selectedAssignmentId) return false;

        const topics = Array.isArray(topicData?.topics) ? topicData.topics : [];
        const allModuleQuizzes = Array.isArray(quizData?.quizzes) ? quizData.quizzes : [];
        const allModuleAssignments = Array.isArray(assignmentData?.assignments) ? assignmentData.assignments : [];
        const quizCompletions = Array.isArray(completionData) ? completionData : [];
        const assignmentCompletions = Array.isArray(assignmentCompletionData) ? assignmentCompletionData : [];

        const sameId = (left, right) => String(left) === String(right);
        const isCompletedFlag = (item) => item?.isCompleted === true || item?.isCompleted === 1;
        const isAccessible = (item) => item?.isAccessible !== false;

        const isQuizCompletedByData = (quizId) => {
            const related = quizCompletions.filter((completion) => sameId(completion?.quizId, quizId));
            if (related.length === 0) return false;

            return related.some((completion) => {
                const status = String(completion?.status || "").toLowerCase();
                return status === "passed" || status === "failed" || status === "completed" || Number(completion?.triedAttempts || 0) > 0;
            });
        };

        const isAssignmentCompletedByData = (assignmentId) => {
            const completion = assignmentCompletions.find(
                (item) => sameId(item?.assignmentId ?? item?.assignment_id, assignmentId)
            );
            if (!completion) return false;

            const status = String(completion?.status || "").toLowerCase();
            return status === "completed" || completion?.isCompleted === true || completion?.isCompleted === 1;
        };

        const isQuizPending = (quiz) => !isCompletedFlag(quiz) && !isQuizCompletedByData(quiz?.id);
        const isAssignmentPending = (assignment) => !isCompletedFlag(assignment) && !isAssignmentCompletedByData(assignment?.id);

        const topicQuizIds = new Set(
            topics
                .flatMap((topic) => (Array.isArray(topic?.quizzes) ? topic.quizzes : []).map((quiz) => String(quiz?.id)))
                .filter(Boolean)
        );

        const topicAssignmentIds = new Set(
            topics
                .flatMap((topic) => (Array.isArray(topic?.assignments) ? topic.assignments : []).map((assignment) => String(assignment?.id)))
                .filter(Boolean)
        );

        const moduleOnlyQuizzes = allModuleQuizzes.filter((quiz) => !topicQuizIds.has(String(quiz?.id)));
        const moduleOnlyAssignments = allModuleAssignments.filter((assignment) => !topicAssignmentIds.has(String(assignment?.id)));

        const resolvedTopic = currentTopic || topics.find((topic) => {
            const quizIds = Array.isArray(topic?.quizzes) ? topic.quizzes.map((q) => String(q?.id)) : [];
            const assignmentIds = Array.isArray(topic?.assignments) ? topic.assignments.map((a) => String(a?.id)) : [];
            return (selectedQuizId && quizIds.includes(String(selectedQuizId))) ||
                (selectedAssignmentId && assignmentIds.includes(String(selectedAssignmentId)));
        });

        const hasNextModuleOrSession = () => {
            if (currentModule && Array.isArray(moduleData?.modules)) {
                const currentModuleIndex = moduleData.modules.findIndex((module) => sameId(module?.id, currentModule?.id));
                const nextModule = moduleData.modules[currentModuleIndex + 1];
                if (nextModule && nextModule.isAccessible) return true;
            }

            if (currentSession && Array.isArray(sessionData?.sessions)) {
                const currentSessionIndex = sessionData.sessions.findIndex((session) => sameId(session?.id, currentSession?.id));
                const nextSession = sessionData.sessions[currentSessionIndex + 1];
                if (nextSession && nextSession.isAccessible) return true;
            }

            return false;
        };

        const hasNextTopic = (baseTopic = currentTopic) => {
            if (!baseTopic || !Array.isArray(topics)) return false;
            const currentTopicIndex = topics.findIndex((topic) => sameId(topic?.id, baseTopic?.id));
            const nextTopic = topics[currentTopicIndex + 1];
            return Boolean(nextTopic && nextTopic.isAccessible);
        };

        const pendingModuleQuiz = moduleOnlyQuizzes.find((quiz) => isAccessible(quiz) && isQuizPending(quiz));
        const pendingModuleAssignment = moduleOnlyAssignments.find((assignment) => isAccessible(assignment) && isAssignmentPending(assignment));

        if (selectedQuizId && moduleOnlyQuizzes.some((quiz) => sameId(quiz?.id, selectedQuizId))) {
            const currentModuleQuizIndex = moduleOnlyQuizzes.findIndex((quiz) => sameId(quiz?.id, selectedQuizId));
            const nextModuleQuiz = moduleOnlyQuizzes
                .slice(currentModuleQuizIndex + 1)
                .find((quiz) => isAccessible(quiz) && isQuizPending(quiz));

            if (nextModuleQuiz || pendingModuleAssignment) return true;
            return hasNextModuleOrSession();
        }

        if (selectedAssignmentId && moduleOnlyAssignments.some((assignment) => sameId(assignment?.id, selectedAssignmentId))) {
            if (pendingModuleQuiz) return true;

            const currentModuleAssignmentIndex = moduleOnlyAssignments.findIndex((assignment) => sameId(assignment?.id, selectedAssignmentId));
            const nextModuleAssignment = moduleOnlyAssignments
                .slice(currentModuleAssignmentIndex + 1)
                .find((assignment) => isAccessible(assignment) && isAssignmentPending(assignment));

            if (nextModuleAssignment) return true;
            return hasNextModuleOrSession();
        }

        if (resolvedTopic && selectedQuizId) {
            const topicQuizzesList = Array.isArray(resolvedTopic.quizzes) ? resolvedTopic.quizzes : [];
            const currentQuizIndex = topicQuizzesList.findIndex((quiz) => sameId(quiz?.id, selectedQuizId));

            if (currentQuizIndex !== -1) {
                const nextQuiz = topicQuizzesList
                    .slice(currentQuizIndex + 1)
                    .find((quiz) => isAccessible(quiz) && isQuizPending(quiz));
                if (nextQuiz) return true;
            }

            const topicAssignmentsList = Array.isArray(resolvedTopic.assignments) ? resolvedTopic.assignments : [];
            const pendingTopicAssignment = topicAssignmentsList.find((assignment) => isAccessible(assignment) && isAssignmentPending(assignment));
            if (pendingTopicAssignment) return true;

            if (pendingModuleQuiz || pendingModuleAssignment) return true;
            if (hasNextTopic(resolvedTopic)) return true;
            return hasNextModuleOrSession();
        }

        if (resolvedTopic && selectedAssignmentId) {
            const topicQuizzesList = Array.isArray(resolvedTopic.quizzes) ? resolvedTopic.quizzes : [];
            const pendingTopicQuiz = topicQuizzesList.find((quiz) => isAccessible(quiz) && isQuizPending(quiz));
            if (pendingTopicQuiz) return true;

            const topicAssignmentsList = Array.isArray(resolvedTopic.assignments) ? resolvedTopic.assignments : [];
            const currentAssignmentIndex = topicAssignmentsList.findIndex((assignment) => sameId(assignment?.id, selectedAssignmentId));

            if (currentAssignmentIndex !== -1) {
                const nextAssignment = topicAssignmentsList
                    .slice(currentAssignmentIndex + 1)
                    .find((assignment) => isAccessible(assignment) && isAssignmentPending(assignment));
                if (nextAssignment) return true;
            }

            if (pendingModuleQuiz || pendingModuleAssignment) return true;
            if (hasNextTopic(resolvedTopic)) return true;
            return hasNextModuleOrSession();
        }

        return hasNextTopic() || hasNextModuleOrSession();
    }, [
        selectedQuizId,
        selectedAssignmentId,
        currentTopic,
        topicData,
        quizData,
        assignmentData,
        completionData,
        assignmentCompletionData,
        currentModule,
        moduleData,
        currentSession,
        sessionData
    ]);

    const navigateToNextItem = useCallback(async () => {
        await clearActiveSlideForNavigation();
        const topics = Array.isArray(topicData?.topics) ? topicData.topics : [];
        const allModuleQuizzes = Array.isArray(quizData?.quizzes) ? quizData.quizzes : [];
        const allModuleAssignments = Array.isArray(assignmentData?.assignments) ? assignmentData.assignments : [];
        const quizCompletions = Array.isArray(completionData) ? completionData : [];
        const assignmentCompletions = Array.isArray(assignmentCompletionData) ? assignmentCompletionData : [];

        const allModuleQuizzesCompleted = allModuleQuizzes.length > 0
            ? allModuleQuizzes.every(q => q.isCompleted)
            : true;

        const allModuleAssignmentsCompleted = allModuleAssignments.length > 0
            ? allModuleAssignments.every(a => a.isCompleted)
            : true;

        const isCompletedFlag = (item) => item?.isCompleted === true || item?.isCompleted === 1;
        const isAccessible = (item) => item?.isAccessible !== false;

        const isQuizCompletedByData = (quizId) => {
            const related = quizCompletions.filter((completion) => String(completion?.quizId) === String(quizId));
            if (related.length === 0) return false;

            return related.some((completion) => {
                const status = String(completion?.status || "").toLowerCase();
                return status === "passed" || status === "failed" || status === "completed" || Number(completion?.triedAttempts || 0) > 0;
            });
        };

        const isAssignmentCompletedByData = (assignmentId) => {
            const completion = assignmentCompletions.find(
                (item) => String(item?.assignmentId ?? item?.assignment_id) === String(assignmentId)
            );
            if (!completion) return false;

            const status = String(completion?.status || "").toLowerCase();
            return status === "completed" || completion?.isCompleted === true || completion?.isCompleted === 1;
        };

        const isQuizPending = (quiz) => !isCompletedFlag(quiz) && !isQuizCompletedByData(quiz?.id);
        const isAssignmentPending = (assignment) => !isCompletedFlag(assignment) && !isAssignmentCompletedByData(assignment?.id);

        const topicQuizIds = new Set(
            topics.flatMap((topic) =>
                (Array.isArray(topic?.quizzes) ? topic.quizzes : []).map((quiz) => quiz?.id)
            ).filter(Boolean)
        );

        const topicAssignmentIds = new Set(
            topics.flatMap((topic) =>
                (Array.isArray(topic?.assignments) ? topic.assignments : []).map((assignment) => assignment?.id)
            ).filter(Boolean)
        );

        const moduleOnlyQuizzes = allModuleQuizzes.filter((quiz) => !topicQuizIds.has(quiz?.id));
        const moduleOnlyAssignments = allModuleAssignments.filter((assignment) => !topicAssignmentIds.has(assignment?.id));

        const pendingModuleQuiz = moduleOnlyQuizzes.find((quiz) => isAccessible(quiz) && isQuizPending(quiz));
        const pendingModuleAssignment = moduleOnlyAssignments.find((assignment) => isAccessible(assignment) && isAssignmentPending(assignment));

        const resolvedTopic = currentTopic || topics.find((topic) => {
            const quizIds = Array.isArray(topic?.quizzes) ? topic.quizzes.map((q) => q?.id) : [];
            const assignmentIds = Array.isArray(topic?.assignments) ? topic.assignments.map((a) => a?.id) : [];
            return (selectedQuizId && quizIds.includes(selectedQuizId)) ||
                (selectedAssignmentId && assignmentIds.includes(selectedAssignmentId));
        });

        const goToNextModuleOrSession = () => {
            if (moduleData?.modules && currentModule) {
                const currentModuleIndex = moduleData.modules.findIndex((module) => module.id === currentModule.id);
                const nextModule = moduleData.modules[currentModuleIndex + 1];
                if (nextModule && nextModule.isAccessible) {
                    setCurrentModule(nextModule);
                    setCurrentTopic(null);
                    handleSetSelectedQuizId(null);
                    handleSetSelectedAssignmentId(null);
                    return true;
                }
            }

            if (sessionData?.sessions && currentSession) {
                const currentSessionIndex = sessionData.sessions.findIndex((session) => session.id === currentSession.id);
                const nextSession = sessionData.sessions[currentSessionIndex + 1];
                if (nextSession && nextSession.isAccessible) {
                    setCurrentSession(nextSession);
                    setCurrentModule(null);
                    setCurrentTopic(null);
                    handleSetSelectedQuizId(null);
                    handleSetSelectedAssignmentId(null);
                    return true;
                }
            }

            return false;
        };

        if (allModuleAssignmentsCompleted && allModuleQuizzesCompleted) {

            // 👉 STEP 0: Initialize phase ONLY ONCE
            let currentPhase = navigationPhase;

            if (!currentPhase) {
                currentPhase = "quiz";
                setNavigationPhase("quiz");
            }

            // =============================
            // 👉 PHASE 1: QUIZZES
            // =============================
            if (currentPhase === "quiz") {
                const currentQuizIndex = moduleOnlyQuizzes.findIndex(
                    (q) => q.id === selectedQuizId
                );

                const nextQuiz = moduleOnlyQuizzes[currentQuizIndex + 1];

                if (nextQuiz) {
                    setCurrentTopic(null);
                    handleSetSelectedQuizId(nextQuiz.id);
                    handleSetSelectedAssignmentId(null);
                    return;
                }

                // 👉 Move to assignments phase
                setNavigationPhase("assignment");

                const firstAssignment = moduleOnlyAssignments[0];
                if (firstAssignment) {
                    setCurrentTopic(null);
                    handleSetSelectedAssignmentId(firstAssignment.id);
                    handleSetSelectedQuizId(null);
                    return;
                }
            }

            // =============================
            // 👉 PHASE 2: ASSIGNMENTS
            // =============================
            if (currentPhase === "assignment") {
                const currentAssignmentIndex = moduleOnlyAssignments.findIndex(
                    (a) => a.id === selectedAssignmentId
                );

                const nextAssignment = moduleOnlyAssignments[currentAssignmentIndex + 1];

                if (nextAssignment) {
                    setCurrentTopic(null);
                    handleSetSelectedAssignmentId(nextAssignment.id);
                    handleSetSelectedQuizId(null);
                    return;
                }

                // 👉 FINAL STEP
                setNavigationPhase(null); // reset for next module

                if (goToNextModuleOrSession()) return;

                handleSetSelectedQuizId(null);
                handleSetSelectedAssignmentId(null);
            }
        }

        // If current item is module-level, continue only inside module-level sequence.
        if (selectedQuizId && moduleOnlyQuizzes.some((quiz) => quiz?.id === selectedQuizId)) {
            const currentModuleQuizIndex = moduleOnlyQuizzes.findIndex((quiz) => quiz?.id === selectedQuizId);
            const nextModuleQuiz = moduleOnlyQuizzes
                .slice(currentModuleQuizIndex + 1)
                .find((quiz) => isAccessible(quiz) && isQuizPending(quiz));

            if (nextModuleQuiz) {
                setCurrentTopic(null);
                handleSetSelectedQuizId(nextModuleQuiz.id);
                handleSetSelectedAssignmentId(null);
                return;
            }

            if (pendingModuleAssignment) {
                setCurrentTopic(null);
                handleSetSelectedAssignmentId(pendingModuleAssignment.id);
                handleSetSelectedQuizId(null);
                return;
            }

            if (goToNextModuleOrSession()) return;
            handleSetSelectedQuizId(null);
            handleSetSelectedAssignmentId(null);
            return;
        }

        if (selectedAssignmentId && moduleOnlyAssignments.some((assignment) => assignment?.id === selectedAssignmentId)) {
            if (pendingModuleQuiz) {
                setCurrentTopic(null);
                handleSetSelectedQuizId(pendingModuleQuiz.id);
                handleSetSelectedAssignmentId(null);
                return;
            }

            const currentModuleAssignmentIndex = moduleOnlyAssignments.findIndex((assignment) => assignment?.id === selectedAssignmentId);
            const nextModuleAssignment = moduleOnlyAssignments
                .slice(currentModuleAssignmentIndex + 1)
                .find((assignment) => isAccessible(assignment) && isAssignmentPending(assignment));

            if (nextModuleAssignment) {
                setCurrentTopic(null);
                handleSetSelectedAssignmentId(nextModuleAssignment.id);
                handleSetSelectedQuizId(null);
                return;
            }

            if (goToNextModuleOrSession()) return;
            handleSetSelectedQuizId(null);
            handleSetSelectedAssignmentId(null);
            return;
        }

        // Topic-level quiz: next topic quiz -> same-topic assignment -> pending module-level items.
        if (resolvedTopic && selectedQuizId) {
            const topicQuizzesList = Array.isArray(resolvedTopic.quizzes) ? resolvedTopic.quizzes : [];
            const currentQuizIndex = topicQuizzesList.findIndex((quiz) => quiz?.id === selectedQuizId);

            if (currentQuizIndex !== -1) {
                const nextQuiz = topicQuizzesList
                    .slice(currentQuizIndex + 1)
                    .find((quiz) => isAccessible(quiz) && isQuizPending(quiz));

                if (nextQuiz) {
                    if (!currentTopic || currentTopic.id !== resolvedTopic.id) {
                        setCurrentTopic(resolvedTopic);
                    }
                    handleSetSelectedQuizId(nextQuiz.id);
                    handleSetSelectedAssignmentId(null);
                    return;
                }
            }

            const topicAssignmentsList = Array.isArray(resolvedTopic.assignments) ? resolvedTopic.assignments : [];
            const pendingTopicAssignment = topicAssignmentsList.find((assignment) => isAccessible(assignment) && isAssignmentPending(assignment));
            if (pendingTopicAssignment) {
                if (!currentTopic || currentTopic.id !== resolvedTopic.id) {
                    setCurrentTopic(resolvedTopic);
                }
                handleSetSelectedAssignmentId(pendingTopicAssignment.id);
                handleSetSelectedQuizId(null);
                return;
            }

            if (pendingModuleQuiz) {
                setCurrentTopic(null);
                handleSetSelectedQuizId(pendingModuleQuiz.id);
                handleSetSelectedAssignmentId(null);
                return;
            }

            if (pendingModuleAssignment) {
                setCurrentTopic(null);
                handleSetSelectedAssignmentId(pendingModuleAssignment.id);
                handleSetSelectedQuizId(null);
                return;
            }
        }

        // Topic-level assignment: next topic assignment -> pending module-level items.
        if (resolvedTopic && selectedAssignmentId) {
            const topicQuizzesList = Array.isArray(resolvedTopic.quizzes) ? resolvedTopic.quizzes : [];
            const pendingTopicQuiz = topicQuizzesList.find((quiz) => isAccessible(quiz) && isQuizPending(quiz));
            if (pendingTopicQuiz) {
                if (!currentTopic || currentTopic.id !== resolvedTopic.id) {
                    setCurrentTopic(resolvedTopic);
                }
                handleSetSelectedQuizId(pendingTopicQuiz.id);
                handleSetSelectedAssignmentId(null);
                return;
            }

            const topicAssignmentsList = Array.isArray(resolvedTopic.assignments) ? resolvedTopic.assignments : [];
            const currentAssignmentIndex = topicAssignmentsList.findIndex((assignment) => assignment?.id === selectedAssignmentId);

            if (currentAssignmentIndex !== -1) {
                const nextAssignment = topicAssignmentsList
                    .slice(currentAssignmentIndex + 1)
                    .find((assignment) => isAccessible(assignment) && isAssignmentPending(assignment));

                if (nextAssignment) {
                    if (!currentTopic || currentTopic.id !== resolvedTopic.id) {
                        setCurrentTopic(resolvedTopic);
                    }
                    handleSetSelectedAssignmentId(nextAssignment.id);
                    handleSetSelectedQuizId(null);
                    return;
                }
            }

            if (pendingModuleQuiz) {
                setCurrentTopic(null);
                handleSetSelectedQuizId(pendingModuleQuiz.id);
                handleSetSelectedAssignmentId(null);
                return;
            }

            if (pendingModuleAssignment) {
                setCurrentTopic(null);
                handleSetSelectedAssignmentId(pendingModuleAssignment.id);
                handleSetSelectedQuizId(null);
                return;
            }
        }

        navigateToNextTopic();
    }, [
        currentTopic,
        topicData,
        quizData,
        assignmentData,
        completionData,
        assignmentCompletionData,
        selectedQuizId,
        selectedAssignmentId,
        currentModule,
        moduleData,
        currentSession,
        sessionData,
        navigateToNextTopic,
        clearActiveSlideForNavigation
    ]);

    const handleStayHere = (modalType) => {
        if (modalType === 'module') {
            setShowModuleCompletionModal(false);
        } else if (modalType === 'session') {
            setShowSessionCompletionModal(false);
        }
    };

    const isSlideExtraActiveForCurrentSlide =
        topicTypeData?.topicType === "slide" &&
        slideExtraTimer.active &&
        slideExtraTimer.topicId === currentTopic?.id &&
        slideExtraTimer.slideId === activeSlideId;

    const activeExtraDurationTimer =
        topicTypeData?.topicType === "slide" &&
            slideExtraTimer.active &&
            slideExtraTimer.topicId === currentTopic?.id
            ? slideExtraTimer
            : topicExtraTimer;

    if (showSummary && summaryData) {
        return <ContentSummary summaryData={summaryData} onBack={() => setShowSummary(false)} />;
    }

    return (
        <div className="min-h-screen">

            {!quizStarted && !isNavbarHidden && (
                <CourseNavbarDup
                    courseTitle={courseData?.course?.title}
                    sessions={sessionData?.sessions}
                    currentSession={currentSession}
                    setCurrentSession={setCurrentSession}
                    modules={moduleData?.modules || []}
                    isModulesLoading={moduleLoading}
                    currentModule={currentModule}
                    setCurrentModule={setCurrentModule}
                    topics={topicData?.topics || []}
                    isTopicsLoading={topicLoading}
                    currentTopic={currentTopic}
                    setCurrentTopic={setCurrentTopic}
                    quizzes={quizData?.quizzes || []}
                    isQuizzesLoading={quizLoading}
                    assignments={assignmentData?.assignments || []}
                    isAssignmentsLoading={assignmentLoading}
                    setShowEndSessionModal={setShowEndSessionModal}
                    setIsRightSidebarOpen={setIsRightSidebarOpen}
                    setIsFilesPanelOpen={setIsFilesPanelOpen} // to close materials on course navigator open
                    isRightSidebarOpen={isRightSidebarOpen}
                    access_token={access_token}
                    selectedQuizId={selectedQuizId}
                    setSelectedQuizId={handleSetSelectedQuizId}
                    selectedAssignmentId={selectedAssignmentId}
                    setSelectedAssignmentId={handleSetSelectedAssignmentId}
                    loadedData={loadedData}
                    completionData={completionData}
                    refetchQuizCompletion={refetchQuizCompletion}
                    languages={languages}
                    extraDurationTimer={activeExtraDurationTimer}
                    materialsCount={materialsCount}
                    materialsScopeKey={materialsScopeKey}
                />
            )}

            {(selectedQuizId && quizStarted) && (<div
                className={`bg-gray-100 backdrop-blur-md border-b border-gray-200/50 sticky z-10 shadow-lg ${quizStarted ? "top-0" : isNavbarHidden ? "top-0" : "top-[70px]"
                    }`}
            >
                {/* {!selectedAssignmentId && ( */}
                <div className="mx-3 py-3">
                    {selectedQuizId && selectedQuizData ? (
                        // QUIZ HEADER when quiz is active
                        <div className="flex items-center justify-between gap-2 sm:gap-4">
                            {/* Left: Title */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 sm:gap-2">
                                    {/* Title with responsive truncation */}
                                    <div className="min-w-0 flex-1">
                                        <div className="text-start">
                                            <h2
                                                className="font-semibold text-gray-900 text-sm xs:text-base sm:text-lg md:text-md lg:text-lg leading-tight truncate"
                                                title={selectedQuizData.title}
                                            >
                                                {selectedQuizData.title}
                                            </h2>
                                        </div>
                                    </div>

                                    {/* Info icon with responsive tooltip/panel */}
                                    <div className="flex-shrink-0">
                                        <div className="group relative flex items-center">
                                            <button
                                                onClick={() => setShowInstructions(!showInstructions)}
                                                className="flex items-center justify-center p-1.5 sm:p-2 rounded-full bg-white text-black shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200"
                                                aria-label="View instructions"
                                            >
                                                <FaInfoCircle className="text-xs sm:text-sm md:text-base" />
                                            </button>

                                            {/* Desktop: Hover tooltip (1024px+) */}
                                            <div className="hidden lg:block absolute top-8 right-0 bg-white text-gray-800 text-sm leading-relaxed border border-gray-200 rounded-xl shadow-lg p-4 sm:p-5 z-50 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-out pointer-events-none w-80 max-w-3xl">
                                                <p className="text-base font-semibold text-gray-700 mb-2">
                                                    Instructions
                                                </p>
                                                <ul className="text-sm text-gray-800 space-y-1">
                                                    <li>• Select one answer per question before proceeding</li>
                                                    <li>• Navigate back to review your answers anytime</li>
                                                    <li>• All questions must be answered to submit</li>
                                                </ul>
                                            </div>

                                            {/* Tablet: Hover tooltip (768px - 1024px) */}
                                            <div className="hidden md:block lg:hidden absolute top-8 right-0 bg-white text-gray-800 text-sm leading-relaxed border border-gray-200 rounded-xl shadow-lg p-4 z-50 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out pointer-events-none w-64">
                                                <p className="text-sm font-semibold text-gray-700 mb-2">
                                                    Instructions
                                                </p>
                                                <ul className="text-xs text-gray-800 space-y-1">
                                                    <li>• Select one answer per question</li>
                                                    <li>• Navigate back to review answers</li>
                                                    <li>• All questions must be answered</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile: Clickable instructions panel (<768px) */}
                                    {showInstructions && (
                                        <div className="md:hidden fixed inset-x-4 top-20 bg-white text-gray-800 text-sm leading-relaxed border border-gray-200 rounded-xl shadow-lg p-4 z-50 animate-in slide-in-from-top duration-300">
                                            <div className="flex justify-between items-center mb-3">
                                                <p className="text-base font-semibold text-gray-700">
                                                    Instructions
                                                </p>
                                                <button
                                                    onClick={() => setShowInstructions(false)}
                                                    className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                                    aria-label="Close instructions"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                            <ul className="text-sm text-gray-800 space-y-2">
                                                <li>• Select one answer per question before proceeding</li>
                                                <li>• Navigate back to review your answers anytime</li>
                                                <li>• All questions must be answered to submit</li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Stats - Desktop (1024px+) */}
                            <div className="hidden lg:flex lg:flex-wrap lg:gap-3">
                                {!quizStarted && (
                                    <>
                                        <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700">
                                            <span className="text-lg">⏱</span>
                                            <span className="text-sm font-semibold">{selectedQuizData.duration_minutes} min</span>
                                        </div>

                                        <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700">
                                            <span className="text-lg">❓</span>
                                            <span className="text-sm font-semibold">{quizProgress?.totalQuestions || countTotalQuestions(selectedQuizData)}</span>
                                        </div>
                                    </>
                                )}

                                {quizStarted && (
                                    <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700">
                                        <FaListOl />
                                        <span className="text-sm font-semibold">
                                            {quizProgress?.currentQuestion || 0}/{quizProgress?.totalQuestions || 0}
                                        </span>
                                    </div>
                                )}

                                {quizProgress?.isTimerActive && quizStarted && (
                                    <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700">
                                        <FaClock className="text-indigo-600" />
                                        <span className="text-sm font-semibold">
                                            {Math.floor(quizProgress.timeRemaining / 60)}:
                                            {String(quizProgress.timeRemaining % 60).padStart(2, "0")}
                                            <span className="mx-1 text-gray-400">/</span>
                                            {selectedQuizData.duration_minutes} min
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700">
                                    <span className="text-lg">🏅</span>
                                    <span className="text-sm font-semibold">{selectedQuizData.passing_score}%</span>
                                </div>
                            </div>

                            {/* Right: Stats - Tablet (768px - 1024px) */}
                            <div className="hidden md:flex lg:hidden items-center gap-2">
                                {!quizStarted && (
                                    <>
                                        <div className="flex items-center space-x-1 px-2 py-1 rounded-full border border-gray-200 text-xs font-medium text-gray-700">
                                            <span className="text-base">⏱</span>
                                            <span className="text-xs font-semibold">{selectedQuizData.duration_minutes}m</span>
                                        </div>

                                        <div className="flex items-center space-x-1 px-2 py-1 rounded-full border border-gray-200 text-xs font-medium text-gray-700">
                                            <span className="text-base">❓</span>
                                            <span className="text-xs font-semibold">{quizProgress?.totalQuestions || countTotalQuestions(selectedQuizData)}</span>
                                        </div>
                                    </>
                                )}

                                {quizStarted && (
                                    <div className="flex items-center space-x-1 px-2 py-1 rounded-full border border-gray-200 text-xs font-medium text-gray-700">
                                        <FaListOl className="text-xs" />
                                        <span className="text-xs font-semibold">
                                            {quizProgress?.currentQuestion || 0}/{quizProgress?.totalQuestions || 0}
                                        </span>
                                    </div>
                                )}

                                {quizProgress?.isTimerActive && quizStarted && (
                                    <div className="flex items-center space-x-1 px-2 py-1 rounded-full border border-gray-200 text-xs font-medium text-gray-700">
                                        <FaClock className="text-indigo-600 text-xs" />
                                        <span className="text-xs font-semibold">
                                            {Math.floor(quizProgress.timeRemaining / 60)}:
                                            {String(quizProgress.timeRemaining % 60).padStart(2, "0")}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center space-x-1 px-2 py-1 rounded-full border border-gray-200 text-xs font-medium text-gray-700">
                                    <span className="text-base">🏅</span>
                                    <span className="text-xs font-semibold">{selectedQuizData.passing_score}%</span>
                                </div>
                            </div>

                            {/* Right: Stats - Mobile (<768px) */}
                            <div className="flex md:hidden items-center gap-1.5">
                                {/* Questions counter - always visible on mobile */}
                                <div className="flex items-center space-x-1 px-2 py-1 rounded-full border border-gray-200 text-[10px] font-medium text-gray-700">
                                    <FaListOl className="text-[10px]" />
                                    <span className="text-[10px] font-semibold">
                                        {quizStarted
                                            ? `${quizProgress?.currentQuestion || 0}/${quizProgress?.totalQuestions || 0}`
                                            : quizProgress?.totalQuestions || countTotalQuestions(selectedQuizData)
                                        }
                                    </span>
                                </div>

                                {/* Timer - only when active and quiz started */}
                                {quizProgress?.isTimerActive && quizStarted && (
                                    <div className="flex items-center space-x-1 px-2 py-1 rounded-full border border-gray-200 text-[10px] font-medium text-gray-700">
                                        <FaClock className="text-indigo-600 text-[10px]" />
                                        <span className="text-[10px] font-semibold">
                                            {Math.floor(quizProgress.timeRemaining / 60)}:
                                            {String(quizProgress.timeRemaining % 60).padStart(2, "0")}
                                        </span>
                                    </div>
                                )}

                                {/* Duration - show on mobile only when quiz not started */}
                                {!quizStarted && (
                                    <div className="flex items-center space-x-1 px-2 py-1 rounded-full border border-gray-200 text-[10px] font-medium text-gray-700">
                                        <span className="text-[10px]">⏱</span>
                                        <span className="text-[10px] font-semibold">{selectedQuizData.duration_minutes}m</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : selectedAssignmentId && selectedAssignmentData ? (
                        // ASSIGNMENT HEADER when assignment is active
                        <div className="flex items-center justify-between gap-4">
                            {/* Left: Title */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    {/* Mobile: Truncated title with tooltip */}
                                    {/* <div className="max-w-[180px] xs:max-w-[220px] sm:max-w-none">
                                        <h2 className="truncate cursor-help relative group text-lg sm:text-xl md:text-2xl font-bold text-gray-900 tracking-tight"
                                            title={selectedAssignmentData.title}
                                        >
                                            {selectedAssignmentData.title}

                                            <span className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 left-0 top-full mt-1 bg-gray-800 text-white text-xs rounded-md px-3 py-2 z-[100] shadow-lg whitespace-normal break-words min-w-[200px] max-w-[300px]">
                                                {selectedAssignmentData.title}
                                            </span>
                                        </h2>
                                    </div> */}

                                    <div className="min-w-0">
                                        <div className="text-start">
                                            <h2
                                                className="font-semibold text-gray-900 text-base leading-tight truncate"
                                                title={selectedAssignmentData.title}
                                            >
                                                {selectedAssignmentData.title}
                                            </h2>
                                        </div>
                                        {/* Description on desktop */}
                                        {!isMobile && selectedAssignmentData.description && (
                                            <p className="text-sm text-gray-600 mt-1 max-w-2xl">
                                                {decodeHtml(selectedAssignmentData.description.length > 120
                                                    ? `${selectedAssignmentData.description.substring(0, 120)}...`
                                                    : selectedAssignmentData.description)
                                                }
                                            </p>
                                        )}
                                    </div>

                                    {/* Info icon */}
                                    <div className="flex-shrink-0">
                                        <div className="group relative flex items-center">
                                            <button
                                                onClick={() => setShowInstructions(!showInstructions)}
                                                className="flex items-center justify-center p-1.5 md:p-2 rounded-full bg-white text-black shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200"
                                            >
                                                <FaInfoCircle className="text-xs md:text-sm" />
                                            </button>

                                            {/* Desktop: Hover tooltip */}
                                            <div  // dont replace right-6 with left-0 it cause problem in responsive
                                                className="
                                                    hidden sm:block
                                                    absolute top-8 right-6
                                                    bg-white text-gray-800 text-sm leading-relaxed
                                                    border border-gray-200 rounded-xl shadow-lg
                                                    p-4 sm:p-5 z-50
                                                    opacity-0 scale-95
                                                    group-hover:opacity-100 group-hover:scale-100
                                                    transition-all duration-300 ease-out
                                                    pointer-events-none
                                                    w-96 max-w-3xl
                                                "
                                            >
                                                <p className="text-base font-semibold text-gray-700 mb-2">
                                                    Instructions
                                                </p>

                                                {selectedAssignmentData?.category && (
                                                    selectedAssignmentData.category === "regular" ? (
                                                        <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                                                            <li>Read the provided document carefully.</li>
                                                            <li>Make sure you understand all the concepts explained in the file.</li>
                                                            <li>After completing the reading, click on the Submit button to mark the assignment as completed.</li>
                                                        </ul>
                                                    ) : selectedAssignmentData.category === "matching" ? (
                                                        <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                                                            <li>Match each item in Column A with the correct option in Column B.</li>
                                                            <li>Ensure every item is matched correctly.</li>
                                                            <li>Double-check all matches before submitting the assignment.</li>
                                                        </ul>
                                                    ) : selectedAssignmentData.category === "true_false" ? (
                                                        <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                                                            <li>Read each statement carefully.</li>
                                                            <li>Select True or False for every question.</li>
                                                            <li>Ensure all questions are answered before submitting.</li>
                                                            <li>Review your selections and then click Submit.</li>
                                                        </ul>
                                                    ) : selectedAssignmentData.category === "fill_in_the_blanks" ? (
                                                        <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                                                            <li>Read each sentence carefully.</li>
                                                            <li>Enter the correct word or phrase in each blank.</li>
                                                            <li>Make sure all blanks are filled.</li>
                                                            <li>Review your answers before clicking Submit.</li>
                                                        </ul>
                                                    ) : selectedAssignmentData.category === "paragraph_writing" ? (
                                                        <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                                                            <li>Carefully observe the given paragraph.</li>
                                                            <li>Type the text exactly as shown, paying attention to spelling, punctuation, and spacing.</li>
                                                            <li>Try to maintain accuracy and speed.</li>
                                                            <li>Review your typed content before clicking Submit.</li>
                                                        </ul>
                                                    ) : (
                                                        <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                                                            <li>Read each question carefully</li>
                                                            <li>Select the appropriate answer for each</li>
                                                            <li>Review your responses before submitting</li>
                                                        </ul>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile: Clickable instructions panel */}
                                    {showInstructions && (
                                        <div className="sm:hidden fixed inset-x-4 top-20 bg-white text-gray-800 text-sm leading-relaxed border border-gray-200 rounded-xl shadow-lg p-4 z-50 animate-in slide-in-from-top duration-300">
                                            <div className="flex justify-between items-center mb-3">
                                                <p className="text-base font-semibold text-gray-700">
                                                    Instructions
                                                </p>
                                                <button
                                                    onClick={() => setShowInstructions(false)}
                                                    className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                            {selectedAssignmentData?.category && (
                                                selectedAssignmentData.category === "regular" ? (
                                                    <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                                                        <li>Read the provided document carefully.</li>
                                                        <li>Make sure you understand all the concepts explained in the file.</li>
                                                        <li>After completing the reading, click on the Submit button to mark the assignment as completed.</li>
                                                    </ul>
                                                ) : selectedAssignmentData.category === "matching" ? (
                                                    <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                                                        <li>Match each item in Column A with the correct option in Column B.</li>
                                                        <li>Ensure every item is matched correctly.</li>
                                                        <li>Double-check all matches before submitting the assignment.</li>
                                                    </ul>
                                                ) : selectedAssignmentData.category === "true_false" ? (
                                                    <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                                                        <li>Read each statement carefully.</li>
                                                        <li>Select True or False for every question.</li>
                                                        <li>Ensure all questions are answered before submitting.</li>
                                                        <li>Review your selections and then click Submit.</li>
                                                    </ul>
                                                ) : selectedAssignmentData.category === "fill_in_the_blanks" ? (
                                                    <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                                                        <li>Read each sentence carefully.</li>
                                                        <li>Enter the correct word or phrase in each blank.</li>
                                                        <li>Make sure all blanks are filled.</li>
                                                        <li>Review your answers before clicking Submit.</li>
                                                    </ul>
                                                ) : selectedAssignmentData.category === "paragraph_writing" ? (
                                                    <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                                                        <li>Carefully observe the given paragraph.</li>
                                                        <li>Type the text exactly as shown, paying attention to spelling, punctuation, and spacing.</li>
                                                        <li>Try to maintain accuracy and speed.</li>
                                                        <li>Review your typed content before clicking Submit.</li>
                                                    </ul>
                                                ) : (
                                                    <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                                                        <li>Read each question carefully</li>
                                                        <li>Select the appropriate answer for each</li>
                                                        <li>Review your responses before submitting</li>
                                                    </ul>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Stats */}
                            <div className="flex flex-wrap gap-3">
                                {isMobile ? (
                                    <button
                                        onClick={() => handleTabClick("assignment")}
                                        className={`pb-1 sm:pb-2 text-xs sm:text-base font-medium transition-all duration-200 relative text-black border-b sm:border-b-2 border-black flex items-center`}
                                    >
                                        <svg
                                            className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <span className="hidden sm:inline">Assignment Details</span>
                                    </button>
                                ) : (
                                    <>
                                        {/* Due Date */}
                                        {selectedAssignmentData.due_date && (
                                            <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700">
                                                <FaClock className="text-amber-600" />
                                                <span className="text-sm font-semibold">
                                                    Due: {new Date(selectedAssignmentData.due_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}

                                        {/* Assignment Type */}
                                        <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700">
                                            <span className="text-lg">📝</span>
                                            <span className="text-sm font-semibold capitalize">
                                                {selectedAssignmentData.category?.replace(/_/g, ' ') || 'Assignment'}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : detailedTopicLoading ? (
                        <div className="flex items-center space-x-3">
                            <div className="animate-pulse flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                    <div className="w-4 h-4 bg-white/30 rounded-full animate-pulse"></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-5 bg-gray-300 rounded-md w-48 animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded-md w-32 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    ) : detailedTopicError ? (
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center">
                                <FaInfoCircle className="text-white" size={16} />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-red-600">Unable to load topic</p>
                                <p className="text-sm text-red-500">Please try refreshing the page</p>
                            </div>
                        </div>
                    ) : detailedTopicData?.topic || slidesData?.topicData ? (
                        <div className="flex items-center justify-between">
                            {/* Previous Code Left side - titles and info */}
                            {/* <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-2">
                                            {topicTypeData?.topicType === "slide" ? (

                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-l font-bold text-gray-800 leading-tight flex-1 min-w-0">
                                                            <span className="block md:hidden">
                                                                {((slidesData?.topicData?.title || "Untitled Topic").length > 15
                                                                    ? (slidesData?.topicData?.title || "Untitled Topic").slice(0, 15) + "..."
                                                                    : slidesData?.topicData?.title || "Untitled Topic")}
                                                            </span>

                                                            <span className="hidden md:block">
                                                                {slidesData?.topicData?.title || "Untitled Topic"}
                                                            </span>
                                                        </h3>

                                                        <span className="text-gray-500 text-l">›</span>

                                                        <h1 className="text-l font-bold text-slate-700 leading-tight flex-1 min-w-0">
                                                            <span className="block md:hidden">
                                                                {((displaySlide?.title || "Untitled Slide").length > 15
                                                                    ? (displaySlide?.title || "Untitled Slide").slice(0, 15) + "..."
                                                                    : displaySlide?.title || "Untitled Slide")}
                                                            </span>

                                                            <span className="hidden md:block">
                                                                {displaySlide?.title || "Untitled Slide"}
                                                            </span>
                                                        </h1>
                                                    </div>

                                                    {"comment it"}
                                                     {topicTypeData?.topicType === "slide" && slidesData?.topicData?.description && (
                                                        <div className="relative ml-2">
                                                            <button
                                                                onMouseEnter={() => setIsDescriptionHovered(true)}
                                                                onMouseLeave={() => setIsDescriptionHovered(false)}
                                                                className="flex items-center justify-center p-2 rounded-full bg-white text-black shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200"
                                                            >
                                                                <FaInfoCircle className="text-sm" />
                                                            </button>
                                                            {isDescriptionHovered && (
                                                                <div className="absolute left-full ml-2 z-50 w-[900px] max-w-[900px] bg-white text-black text-sm rounded-lg shadow-xl border border-gray-200 p-4">
                                                                    {processDescriptionWithTags(slidesData.topicData.description)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )} 
                                                    {"till here"}
                                                    {
                                                        (
                                                            topicTypeData?.topicType === "slide" && slidesData?.topicData?.description
                                                        )
                                                        && (
                                                            <div className="ml-2">
                                                                <button
                                                                    onClick={() => setShowDescriptionModal(true)}
                                                                    className="flex items-center justify-center p-2 rounded-full bg-white text-black shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200"
                                                                >
                                                                    <FaInfoCircle className="text-sm" />
                                                                </button>
                                                            </div>
                                                        )}

                                                </div>

                                            ) : (
                                                <h3 className="text-sm md:text-base font-bold text-gray-800 leading-tight flex items-center gap-2">
                                                    <span className="flex-1 min-w-0">
                                                        <span className="block md:hidden">
                                                            {((detailedTopicData?.topic?.title || "Untitled Topic").length > 20
                                                                ? (detailedTopicData?.topic?.title || "Untitled Topic").slice(0, 20) + "..."
                                                                : detailedTopicData?.topic?.title || "Untitled Topic")}
                                                        </span>

                                                        <span className="hidden md:block">
                                                            {detailedTopicData?.topic?.title || "Untitled Topic"}
                                                        </span>
                                                    </span>

                                                    {
                                                        (
                                                            (topicTypeData?.topicType === "general" || topicTypeData?.topicType === "accordian")
                                                            && detailedTopicData?.topic?.description
                                                        )
                                                        && (
                                                            <div>
                                                                <button
                                                                    onClick={() => setShowDescriptionModal(true)}
                                                                    className="flex items-center justify-center p-1.5 md:p-2 rounded-full bg-white text-black shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 flex-shrink-0"
                                                                >
                                                                    <FaInfoCircle className="text-xs md:text-sm" />
                                                                </button>
                                                            </div>
                                                        )}
                                                </h3>
                                            )}

                                        </div>
                            </div> */}

                            {/* Left side - titles and info */}
                            <div className="flex-1 min-w-0">
                                {topicTypeData?.topicType === "slide" ? (
                                    <div className="flex items-center gap-2">
                                        {/* Topic Title + Separator + Slide Title */}
                                        {/* <div className="flex items-center gap-2"> */}
                                        {/* Topic Title */}
                                        {/* <div className="max-w-[96px] sm:max-w-[196px] md:max-w-[256px] lg:max-w-[384px] xl:max-w-[512px]">
                                                    <p className='truncate cursor-help relative group text-l font-bold text-gray-800 leading-tight'
                                                        title={slidesData?.topicData?.title || "Untitled Topic"}
                                                    >
                                                         {slidesData?.topicData?.title || "Untitled Topic"}
                                                        <span className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 left-0 top-full mt-1 bg-gray-800 text-white text-xs rounded-md px-3 py-2 z-[100] shadow-lg whitespace-normal break-words min-w-[250px] max-w-[350px]">
                                                            {slidesData?.topicData?.title || "Untitled Topic"}
                                                        </span>
                                                    </p>
                                                </div> */}

                                        {/* Separator */}
                                        {/* <span className="text-gray-500 text-l flex-shrink-0">›</span> */}

                                        {/* Slide Title */}
                                        {/* <div className="max-w-[200px] sm:max-w-[246px] md:max-w-[276px] lg:max-w-[384px] xl:max-w-[512px]">
                                                <p className='truncate cursor-help relative group text-l font-bold text-slate-700 leading-tight'
                                                    title={displaySlide?.title || "Untitled Slide"}
                                                >
                                                    {displaySlide?.title || "Untitled Slide"}
                                                    <span className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 left-0 top-full mt-1 bg-gray-800 text-white text-xs rounded-md px-3 py-2 z-[100] shadow-lg whitespace-normal break-words min-w-[250px] max-w-[350px]">
                                                        {displaySlide?.title || "Untitled Slide"}
                                                    </span>
                                                </p>
                                            </div> */}
                                        {/* </div> */}

                                        <div className="min-w-0">
                                            <div className="text-start">
                                                <h2
                                                    className="font-semibold text-gray-900 text-base leading-tight truncate"
                                                    title={displaySlide?.title}
                                                >
                                                    {displaySlide?.title}
                                                </h2>
                                            </div>
                                        </div>

                                        {/* Info icon */}
                                        {(topicTypeData?.topicType === "slide" && slidesData?.topicData?.description) && (
                                            <div className="flex-shrink-0">
                                                <button
                                                    onClick={() => setShowDescriptionModal(true)}
                                                    className="flex items-center justify-center p-2 rounded-full bg-white text-black shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200"
                                                >
                                                    <FaInfoCircle className="text-sm" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        {/* <div className="max-w-[240px] sm:max-w-[420px] md:max-w-[592px] lg:max-w-[840px] xl:max-w-[1024px]">
                                                <p className='truncate cursor-help relative group text-sm md:text-base font-bold text-gray-800 leading-tight'
                                                    title={detailedTopicData?.topic?.title || "Untitled Topic"}
                                                >
                                                    {detailedTopicData?.topic?.title || "Untitled Topic"}
                                                    <span className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 left-0 top-full mt-1 bg-gray-800 text-white text-xs rounded-md px-3 py-2 z-[100] shadow-lg whitespace-normal break-words min-w-[250px] max-w-[350px]">
                                                        {detailedTopicData?.topic?.title || "Untitled Topic"}
                                                    </span>
                                                </p>
                                            </div> */}

                                        <div className="min-w-0">
                                            <div className="text-start">
                                                <h2
                                                    className="font-semibold text-gray-900 text-base leading-tight truncate"
                                                    title={detailedTopicData?.topic?.title}
                                                >
                                                    {detailedTopicData?.topic?.title}
                                                </h2>
                                            </div>
                                        </div>

                                        {/* Info icon */}
                                        {((topicTypeData?.topicType === "general" || topicTypeData?.topicType === "accordian") && detailedTopicData?.topic?.description) && (
                                            <div className="flex-shrink-0">
                                                <button
                                                    onClick={() => setShowDescriptionModal(true)}
                                                    className="flex items-center justify-center p-1.5 md:p-2 rounded-full bg-white text-black shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200"
                                                >
                                                    <FaInfoCircle className="text-xs md:text-sm" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Tabs */}
                            <div className="flex items-center space-x-2 sm:space-x-8">

                                {(topicTypeData?.topicType === "accordian" || topicTypeData?.topicType === "general") && (
                                    <>
                                        {!hasSummary ? (
                                            <button
                                                onClick={() =>
                                                    topicTypeData?.topicType === "accordian"
                                                        ? summarizeAllAccordions()
                                                        : summarizeDescription()
                                                }
                                                disabled={isLoadingSummary || isLoadingSummaries}
                                                className={`pb-1 sm:pb-2 text-xs sm:text-base font-medium transition-all duration-200 relative flex items-center
          ${(isLoadingSummary || isLoadingSummaries)
                                                        ? "text-gray-400 cursor-not-allowed"
                                                        : "text-gray-500 hover:text-gray-700"
                                                    }`}
                                            >
                                                {(isLoadingSummary || isLoadingSummaries) ? (
                                                    <>
                                                        <span className="sm:hidden">⏳</span>
                                                        <span className="hidden sm:inline">Generating...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="sm:hidden">📝</span>
                                                        <span className="hidden sm:inline">Get Summary</span>
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={viewSummary}
                                                className={`pb-1 sm:pb-2 text-xs sm:text-base font-medium transition-all duration-200 relative flex items-center
          ${hasSummary
                                                        ? "text-black border-b sm:border-b-2 border-black"
                                                        : "text-gray-500 hover:text-gray-700"
                                                    }`}
                                            >
                                                <span className="sm:hidden">👁️</span>
                                                <span className="hidden sm:inline">View Summary</span>
                                            </button>
                                        )}
                                    </>
                                )}

                                {topicTypeData?.topicType == "slide" && (
                                    <>
                                        {slideContentData?.slide?.type === "accordian" && (
                                            <>
                                                {!hasSummary ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            summarizeAllAccordionBodies();
                                                        }}
                                                        disabled={isSummaryLoading || isLoadingAccordionSummaries}
                                                        className={`pb-1 sm:pb-2 text-xs sm:text-base font-medium transition-all duration-200 relative flex items-center border-b ${isSummaryLoading || isLoadingAccordionSummaries
                                                            ? "text-gray-400 border-gray-300 cursor-not-allowed"
                                                            : "text-black border-black "
                                                            }`}
                                                    >
                                                        {(isSummaryLoading || isLoadingAccordionSummaries) ? (
                                                            <>
                                                                <svg
                                                                    className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-gray-500 sm:mr-2"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <circle
                                                                        className="opacity-25"
                                                                        cx="12"
                                                                        cy="12"
                                                                        r="10"
                                                                        stroke="currentColor"
                                                                        strokeWidth="4"
                                                                    ></circle>
                                                                    <path
                                                                        className="opacity-75"
                                                                        fill="currentColor"
                                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 
                     5.373 0 12h4zm2 5.291A7.962 7.962 
                     0 014 12H0c0 3.042 1.135 5.824 
                     3 7.938l3-2.647z"
                                                                    ></path>
                                                                </svg>
                                                                <span className="hidden sm:inline">Summarizing...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg
                                                                    className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 
                       003-3v-1m-4-4l-4 4m0 0l-4-4m4 
                       4V4"
                                                                    />
                                                                </svg>
                                                                <span className="hidden sm:inline">Summarize</span>
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => setShowSummary(true)}
                                                        className="pb-1 sm:pb-2 text-xs sm:text-base font-medium transition-all duration-200 relative flex items-center text-black border-b sm:border-b-2 border-black "
                                                    >
                                                        <svg
                                                            className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                            />
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                            />
                                                        </svg>
                                                        <span className="hidden sm:inline">View Summary</span>
                                                    </button>
                                                )}
                                            </>
                                        )}

                                        {slideContentData?.slide?.type === "general" && (
                                            <>
                                                {slideContentData.slide.description && (
                                                    !hasSummary ? (
                                                        <button
                                                            onClick={() => summarizeGeneralDescription(slideContentData.slide.description)}
                                                            disabled={slidesLoading || isLoadingGeneralDescSummaries}
                                                            className={`pb-1 sm:pb-2 text-xs sm:text-base font-medium transition-all duration-200 relative flex items-center border-b ${isLoading || isLoadingGeneralDescSummaries
                                                                ? "text-gray-400 border-gray-300 cursor-not-allowed"
                                                                : "text-black border-black"
                                                                }`}
                                                        >
                                                            {(slidesLoading || isLoadingGeneralDescSummaries) ? (
                                                                <>
                                                                    <svg
                                                                        className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-gray-500 sm:mr-2"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <circle
                                                                            className="opacity-25"
                                                                            cx="12"
                                                                            cy="12"
                                                                            r="10"
                                                                            stroke="currentColor"
                                                                            strokeWidth="4"
                                                                        ></circle>
                                                                        <path
                                                                            className="opacity-75"
                                                                            fill="currentColor"
                                                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                                        ></path>
                                                                    </svg>
                                                                    <span className="hidden sm:inline">Summarizing...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg
                                                                        className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        stroke="currentColor"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                                        />
                                                                    </svg>
                                                                    <span className="hidden sm:inline">Summarize</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => setShowSummary(true)}
                                                            className="pb-1 sm:pb-2 text-xs sm:text-base font-medium transition-all duration-200 relative flex items-center text-black border-b sm:border-b-2 border-black"
                                                        >
                                                            <svg
                                                                className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                                />
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                                />
                                                            </svg>
                                                            <span className="hidden sm:inline">View Summary</span>
                                                        </button>
                                                    )
                                                )}
                                            </>
                                        )}

                                    </>
                                )}

                                {/* Topic Materials Button Removed */}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center">
                                    <FaBookOpen className="text-white" size={18} />
                                </div>
                                <div>
                                    <p className="text-xl font-semibold text-gray-500">Ready to Learn</p>
                                    <p className="text-sm text-gray-400">
                                        Select a topic from the sidebar to begin your learning journey
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {/* )} */}

            </div>)}

            {!selectedQuizId && !selectedAssignmentId && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-[1000]">
                    <div className={`mx-auto px-0 md:px-6 md:py-3 flex flex-col ${topicTypeData?.topicType === "slide" ? "md:flex-row md:items-center md:justify-between" : "sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-3"} space-y-0`}>
                        {/* Mobile Navigation Buttons Bar */}
                        <div className={`${topicTypeData?.topicType === "slide" ? "md:hidden" : "sm:hidden"} flex justify-stretch items-stretch w-full`}>
                            {/* Previous Topic Button */}
                            <button
                                onClick={async () => {
                                    if (!topicData?.topics || !currentTopic) return;
                                    const topics = topicData.topics;
                                    const currentIndex = topics.findIndex(t => t.id === currentTopic.id);
                                    if (currentIndex > 0) {
                                        await clearActiveSlideForNavigation();
                                        setCurrentTopic(topics[currentIndex - 1]);
                                        handleSetSelectedQuizId(null);
                                        handleSetSelectedAssignmentId(null);
                                    }
                                }}
                                disabled={
                                    !topicData?.topics ||
                                    !currentTopic ||
                                    topicData.topics.findIndex(t => t.id === currentTopic.id) === 0
                                }
                                className="flex-1 min-w-0 py-3 font-medium transition text-sm border-r border-gray-300 disabled:bg-gray-200 disabled:text-gray-400 bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                                Previous
                            </button>
                            {/* Previous Slide Button */}
                            {topicTypeData?.topicType === "slide" && (
                                <button
                                    onClick={goToPrevious}
                                    disabled={currentSlideIndex === 0}
                                    className="flex-1 min-w-0 py-3 font-medium transition text-sm border-r border-gray-300 disabled:bg-gray-200 disabled:text-gray-400 bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center gap-1"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    <ChevronLeft className="w-4 h-4 -ml-2" />
                                    Slide
                                </button>
                            )}
                            {/* Next Slide / Finish Button for Slides */}
                            {topicTypeData?.topicType === "slide" && !isLastSlide && (
                                <button
                                    onClick={async () => {
                                        if (isLastSlide) {
                                            if (isYouTubeSlide) {
                                                await handleMarkTopicCompleted();
                                            }
                                            // Go to next topic after handling last slide
                                            if (topicData?.topics && currentTopic) {
                                                const topics = topicData.topics;
                                                const currentIndex = topics.findIndex(t => t.id === currentTopic.id);
                                                const nextTopic = topics[currentIndex + 1];
                                                if (nextTopic?.isAccessible) {
                                                    setCurrentTopic(nextTopic);
                                                    handleSetSelectedQuizId(null);
                                                    handleSetSelectedAssignmentId(null);
                                                }
                                            }
                                        } else {
                                            if (isYouTubeSlide) {
                                                await handleSlideComplete(activeSlideId, isYouTubeSlide);
                                            }
                                            goToNext();
                                        }
                                    }}
                                    disabled={isLastSlide || (!isYouTubeSlide && nextSlideStatus === "not_started" && !isLastSlide)}
                                    title={
                                        !isYouTubeSlide && nextSlideStatus === "not_started" && !isLastSlide
                                            ? "Please complete the current slide to access next slide"
                                            : ""
                                    }
                                    className={`flex-1 min-w-0 py-3 font-medium transition-all text-sm border-r border-gray-300
            ${isLastSlide
                                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                            : !isYouTubeSlide && nextSlideStatus === "not_started"
                                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                                : "bg-blue-600 text-white hover:bg-blue-700"
                                        } flex items-center justify-center gap-1`}
                                >
                                    Slide
                                    <ChevronRight className="w-4 h-4" />
                                    <ChevronRight className="w-4 h-4 -ml-2" />
                                </button>
                            )}
                            {/* Conditional Rightmost Button: Mark Completed (for YouTube videos) or Next */}
                            {(() => {
                                const showMarkCompleted = topicTypeData?.topicType === "video" &&
                                    detailedTopicData?.topic?.videoDetails?.[0]?.video_type === "youtube" &&
                                    !currentTopic?.isCompleted;
                                const nextOnClick = async () => {
                                    if (!topicData?.topics || !currentTopic) return;
                                    const topics = topicData.topics;
                                    const currentIndex = topics.findIndex(t => t.id === currentTopic.id);
                                    const nextTopic = topics[currentIndex + 1];
                                    if (nextTopic?.isAccessible) {
                                        await clearActiveSlideForNavigation();
                                        setCurrentTopic(nextTopic);
                                        handleSetSelectedQuizId(null);
                                        handleSetSelectedAssignmentId(null);
                                    }
                                };
                                const nextDisabled = !topicData?.topics ||
                                    !currentTopic ||
                                    (() => {
                                        const topics = topicData.topics;
                                        const currentIndex = topics.findIndex(t => t.id === currentTopic.id);
                                        const nextTopic = topics[currentIndex + 1];
                                        return !nextTopic || !nextTopic.isAccessible;
                                    })();
                                return (
                                    <button
                                        onClick={showMarkCompleted ? handleTopicCompletionWithExtra : nextOnClick}
                                        disabled={showMarkCompleted ? false : nextDisabled}
                                        className={`flex-1 min-w-0 py-3 font-medium transition text-sm
                ${showMarkCompleted
                                                ? "bg-green-600 text-white hover:bg-green-700 border-r-0"
                                                : "disabled:bg-gray-200 disabled:text-gray-400 bg-blue-600 text-white hover:bg-blue-700 border-r-0"
                                            }`}
                                    >
                                        {showMarkCompleted ? "Mark Completed" : "Next"}
                                    </button>
                                );
                            })()}
                        </div>

                        {/* Desktop Left Section - unchanged */}
                        <div className={`${topicTypeData?.topicType === "slide" ? "md:flex" : "sm:flex"} hidden items-center gap-2 lg:gap-4 flex-shrink-0`}>
                            {/* Previous Topic Button */}
                            <button
                                onClick={async () => {
                                    if (!topicData?.topics || !currentTopic) return;
                                    const topics = topicData.topics;
                                    const currentIndex = topics.findIndex(t => t.id === currentTopic.id);
                                    if (currentIndex > 0) {
                                        await clearActiveSlideForNavigation();
                                        setCurrentTopic(topics[currentIndex - 1]);
                                        handleSetSelectedQuizId(null);
                                        handleSetSelectedAssignmentId(null);
                                    }
                                }}
                                disabled={
                                    !topicData?.topics ||
                                    !currentTopic ||
                                    topicData.topics.findIndex(t => t.id === currentTopic.id) === 0
                                }
                                className="w-28 px-4 py-2.5 rounded-lg font-medium transition
                        disabled:bg-gray-200 disabled:text-gray-400
                        bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                                Previous
                            </button>
                            {/* Previous Slide Button */}
                            {topicTypeData?.topicType === "slide" && (
                                <button
                                    onClick={goToPrevious}
                                    disabled={currentSlideIndex === 0}
                                    className="w-18 lg:w-36 flex items-center justify-center px-4 py-2.5 rounded-lg font-medium transition
                            disabled:bg-gray-200 disabled:text-gray-400
                            bg-gray-100 text-gray-700 hover:bg-gray-200"
                                >
                                    {/* <ChevronLeft className="lg:hidden w-4 h-4 mr-2" />Previous<span className='hidden lg:inline-flex lg:ml-2'> Slide</span> */}
                                    <span className='lg:hidden inline-flex items-center justify-between'><ChevronLeft className="w-4 h-4 mr-2" />Prev</span>
                                    <span className='hidden lg:inline-flex'>Previous Slide</span>
                                </button>
                            )}
                        </div>

                        {/* Center Section - unchanged */}
                        <div className={`${topicTypeData?.topicType === "slide" ? "md:flex-1" : "sm:flex-1"} w-full flex justify-center`}>
                            {topicTypeData?.topicType === "video" &&
                                detailedTopicData?.topic?.videoDetails?.[0]?.video_type === "youtube" &&
                                !currentTopic?.isCompleted && (
                                    <button
                                        onClick={handleTopicCompletionWithExtra}
                                        className="hidden sm:block px-4 py-2 bg-green-600 text-white font-medium rounded-lg shadow hover:bg-green-700 transition"
                                    >
                                        Mark as Completed
                                    </button>
                                )}
                            {/* Audio Player */}
                            {topicTypeData?.topicType === "audio" &&
                                detailedTopicData?.topic?.audioDetails?.[0]?.url && (
                                    <div className="w-full max-w-lg">
                                        <AudioPlayer
                                            fileUrl={`${mediaBase}${detailedTopicData.topic.audioDetails[0].url}`}
                                            onComplete={handleTopicCompletionWithExtra}
                                            isTopicCompleted={isTopicCompleted}
                                        />
                                    </div>
                                )}
                            {/* General with audio completion */}
                            {topicTypeData?.topicType === "general" &&
                                detailedTopicData?.topic?.generalDetails?.[0]?.completion_type === "audio" &&
                                detailedTopicData?.topic?.generalDetails?.[0]?.audio_url && (
                                    <div className="w-full max-w-lg">
                                        <AudioPlayer
                                            fileUrl={`${mediaBase}${detailedTopicData.topic.generalDetails[0].audio_url}`}
                                            onComplete={handleTopicCompletionWithExtra}
                                            isTopicCompleted={isTopicCompleted}
                                        />
                                    </div>
                                )}
                            {topicTypeData?.topicType === "accordian" && (
                                <div className="flex flex-col items-center justify-center w-full">
                                    {/* Audio Player */}
                                    {currentAccordionAudio && (
                                        <div className="w-full max-w-lg">
                                            <AudioPlayer
                                                fileUrl={currentAccordionAudio}
                                                onComplete={async () => {
                                                    const response = await updateAccordionStatus({
                                                        userId,
                                                        topicId: detailedTopicData.topic.id,
                                                        accordianId: currentAccordionId,
                                                        completionStatus: "completed",
                                                        access_token,
                                                    }).unwrap();
                                                    await refetchAccordianStatusData();
                                                    const nextAccordionId = response?.next_accordian_id;
                                                    const currentIndex = detailedTopicData.topic.accordianDetails.findIndex(
                                                        (acc) => acc.id === currentAccordionId
                                                    );
                                                    const isLastAccordion =
                                                        currentIndex === detailedTopicData.topic.accordianDetails.length - 1;
                                                    if (isLastAccordion) {
                                                        setOpenAccordionIndex(null);
                                                        if (typeof handleMarkTopicCompleted === "function") {
                                                            handleTopicCompletionWithExtra();
                                                        }
                                                    } else if (nextAccordionId) {
                                                        const nextIndex = detailedTopicData.topic.accordianDetails.findIndex(
                                                            (acc) => acc.id === nextAccordionId
                                                        );
                                                        const nextAcc = detailedTopicData.topic.accordianDetails.find(
                                                            (acc) => acc.id === nextAccordionId
                                                        );
                                                        if (nextAcc) {
                                                            if (nextAcc.completion_type === "timer") {
                                                                setCurrentAccordionTimer(nextAcc.completion_time);
                                                                setCurrentAccordionAudio(null);
                                                            } else {
                                                                setCurrentAccordionAudio(`${mediaBase}${nextAcc.audio_url || nextAcc.audioUrl}`);
                                                                setCurrentAccordionTimer(null)
                                                            }
                                                        }
                                                        if (nextIndex !== -1) {
                                                            setOpenAccordionIndex(nextIndex);
                                                            setCurrentAccordionId(nextAcc.id);
                                                        }
                                                    }
                                                }}
                                                isTopicCompleted={isTopicCompleted}
                                            />
                                        </div>
                                    )}
                                    {/* Timer */}
                                    {currentAccordionTimer && (accordianStatusData?.accordianStatus?.find((s) => s.accordian_id === currentAccordionId)?.status !== 'completed') && (
                                        <div className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                                            <CountdownTimer
                                                seconds={currentAccordionTimer * 60}
                                                key={`accordian-${openAccordionIndex}`}
                                                isMaterialSidebarOpen={isFilesPanelOpen}
                                                onComplete={async () => {
                                                    const response = await updateAccordionStatus({
                                                        userId,
                                                        topicId: detailedTopicData.topic.id,
                                                        accordianId: currentAccordionId,
                                                        completionStatus: "completed",
                                                        access_token,
                                                    }).unwrap();
                                                    await refetchAccordianStatusData();
                                                    const nextAccordionId = response?.next_accordian_id;
                                                    const currentIndex = detailedTopicData.topic.accordianDetails.findIndex(
                                                        (acc) => acc.id === currentAccordionId
                                                    );
                                                    const isLastAccordion =
                                                        currentIndex === detailedTopicData.topic.accordianDetails.length - 1;
                                                    if (isLastAccordion) {
                                                        setOpenAccordionIndex(null);
                                                        if (typeof handleMarkTopicCompleted === "function") {
                                                            handleTopicCompletionWithExtra();
                                                        }
                                                    } else if (nextAccordionId) {
                                                        const nextIndex = detailedTopicData.topic.accordianDetails.findIndex(
                                                            (acc) => acc.id === nextAccordionId
                                                        );
                                                        const nextAcc = detailedTopicData.topic.accordianDetails.find(
                                                            (acc) => acc.id === nextAccordionId
                                                        );
                                                        if (nextAcc) {
                                                            if (nextAcc.completion_type === "timer") {
                                                                setCurrentAccordionTimer(nextAcc.completion_time);
                                                                setCurrentAccordionAudio(null);
                                                            } else {
                                                                setCurrentAccordionAudio(`${mediaBase}${nextAcc.audio_url || nextAcc.audioUrl}`);
                                                                setCurrentAccordionTimer(null)
                                                            }
                                                        }
                                                        if (nextIndex !== -1) {
                                                            setOpenAccordionIndex(nextIndex);
                                                            setCurrentAccordionId(nextAcc.id);
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                            {topicTypeData?.topicType === "general" &&
                                detailedTopicData?.topic?.generalDetails?.[0]?.completion_type === "timer" &&
                                !currentTopic?.isCompleted && (
                                    <CountdownTimer
                                        seconds={(detailedTopicData?.topic?.generalDetails?.[0]?.completion_time || 1) * 60}
                                        key={`general-${detailedTopicData?.topic?.id}`}
                                        isMaterialSidebarOpen={isFilesPanelOpen}
                                        onComplete={handleTopicCompletionWithExtra}
                                    />
                                )}
                            {topicExtraTimer.active && topicExtraTimer.topicId === currentTopic?.id && (
                                <div className="hidden" aria-hidden="true">
                                    <CountdownTimer
                                        seconds={topicExtraTimer.totalSeconds}
                                        key={`topic-extra-${topicExtraTimer.key}`}
                                        isMaterialSidebarOpen={isFilesPanelOpen}
                                        onTick={(remainingSeconds) => {
                                            const spent = Math.max(0, topicExtraTimer.totalSeconds - remainingSeconds);
                                            topicExtraSpentRef.current = spent;
                                            setTopicExtraTimer((prev) => prev.active ? { ...prev, remainingSeconds } : prev);
                                        }}
                                        onComplete={async () => {
                                            const spent = topicExtraTimer.totalSeconds;
                                            topicExtraSpentRef.current = spent;
                                            await trackFirstCompletionExtra({
                                                topicId: currentTopic?.id,
                                                timeSpent: spent,
                                                finalize: true,
                                            });
                                            setTopicExtraTimer((prev) => ({ ...prev, active: false, remainingSeconds: 0 }));

                                            // Show completion modals now that extra timer is done
                                            if (markedTopicResult) {
                                                showTopicCompletionModals(markedTopicResult);
                                            }
                                        }}
                                    />
                                </div>
                            )}
                            {topicTypeData?.topicType === "slide" && (
                                <>
                                    {slideContentData?.slide?.type === "audio" && (
                                        <div className="w-full max-w-lg">
                                            <AudioPlayer
                                                fileUrl={`${mediaBase}${slideContentData.slide.audioDetails.url}`}
                                                onComplete={() => handleSlideComplete(slideContentData.slide.id)}
                                                isTopicCompleted={isTopicCompleted}
                                                width={240}
                                            />
                                        </div>
                                    )}
                                    {slideContentData?.slide?.type === "general" && (
                                        <div className="w-full max-w-lg">
                                            {slideContentData?.slide?.audio_url ? (
                                                // 🎧 Show Audio Player when audio exists
                                                <AudioPlayer
                                                    fileUrl={`${mediaBase}${slideContentData?.slide?.audio_url}`}
                                                    onComplete={() => handleSlideComplete(slideContentData.slide.id)}
                                                    className="w-full sm:w-[300px] md:w-[400px]"
                                                    isTopicCompleted={isTopicCompleted}
                                                    width={240}
                                                />
                                            ) : slideContentData?.slide?.completion_type === "timer" &&
                                                slidesStatusData?.slideStatus?.find((s) => s.slide_id === slideContentData.slide.id)?.status !== 'completed' &&
                                                !isSlideExtraActiveForCurrentSlide ? (
                                                // ⏳ Show Countdown Timer when no audio
                                                <div className="flex justify-center items-center">
                                                    <CountdownTimer
                                                        seconds={(slideContentData?.slide?.completion_time || 1) * 60}
                                                        key={`slide-${slideContentData.slide.id}`}
                                                        isMaterialSidebarOpen={isFilesPanelOpen}
                                                        onComplete={() => handleSlideComplete(slideContentData.slide.id)}
                                                    />
                                                </div>
                                            ) : null}
                                        </div>
                                    )}

                                    {slideContentData?.slide?.type === "accordian" && (
                                        <div className="w-full max-w-lg">
                                            {slideContentData?.slide?.audio_url ? (
                                                // 🎧 Show Audio Player when audio is available
                                                <AudioPlayer
                                                    fileUrl={`${mediaBase}${slideContentData?.slide?.audio_url}`}
                                                    onComplete={() => handleSlideComplete(slideContentData.slide.id)}
                                                    className="w-full sm:w-[300px] md:w-[400px]"
                                                    isTopicCompleted={isTopicCompleted}
                                                    width={240}
                                                />
                                            ) : slideContentData?.slide?.completion_type === "timer" &&
                                                slidesStatusData?.slideStatus?.find((s) => s.slide_id === slideContentData.slide.id)?.status !== 'completed' &&
                                                !isSlideExtraActiveForCurrentSlide ? (
                                                // ⏳ Show Countdown Timer when no audio
                                                <div className="flex justify-center items-center">
                                                    <CountdownTimer
                                                        seconds={(slideContentData?.slide?.completion_time || 1) * 60}
                                                        key={`slide-${slideContentData.slide.id}`}
                                                        isMaterialSidebarOpen={isFilesPanelOpen}
                                                        onComplete={() => handleSlideComplete(slideContentData.slide.id)}
                                                    />
                                                </div>
                                            ) : null}
                                        </div>
                                    )}

                                    {slideExtraTimer.active && slideExtraTimer.slideId === slideContentData?.slide?.id && (
                                        <div className="hidden" aria-hidden="true">
                                            <CountdownTimer
                                                seconds={slideExtraTimer.totalSeconds}
                                                key={`slide-extra-${slideExtraTimer.key}`}
                                                isMaterialSidebarOpen={isFilesPanelOpen}
                                                onTick={(remainingSeconds) => {
                                                    const spent = Math.max(0, slideExtraTimer.totalSeconds - remainingSeconds);
                                                    slideExtraSpentRef.current = spent;
                                                    setSlideExtraTimer((prev) => prev.active ? { ...prev, remainingSeconds } : prev);
                                                }}
                                                onComplete={async () => {
                                                    const spent = slideExtraTimer.totalSeconds;
                                                    slideExtraSpentRef.current = spent;
                                                    // await trackFirstCompletionExtra({
                                                    //     topicId: currentTopic?.id,
                                                    //     slideId: slideContentData?.slide?.id,
                                                    //     timeSpent: spent,
                                                    //     finalize: true,
                                                    // });
                                                    setSlideExtraTimer((prev) => ({ ...prev, active: false, remainingSeconds: 0 }));
                                                    // Show slide completion modal if not last slide
                                                    if (lastSlideCompletionInfo && !lastSlideCompletionInfo.isLastSlide && lastSlideCompletionInfo.shouldRunSlideExtra) {
                                                        setShowSlideEndModal(true);
                                                    }
                                                    // If last slide and had extra, show topic completion modals
                                                    if (lastSlideCompletionInfo && lastSlideCompletionInfo.isLastSlide && markedTopicResult) {
                                                        showTopicCompletionModals(markedTopicResult);
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}

                                </>
                            )}
                        </div>

                        {/* Desktop Right Section - unchanged */}
                        <div className={`${topicTypeData?.topicType === "slide" ? "md:flex" : "sm:flex"} hidden items-center gap-2 lg:gap-4 flex-shrink-0`}>
                            {/* Full Screen Toggle Button */}
                            <button
                                onClick={() => setIsNavbarHidden(!isNavbarHidden)}
                                className="p-2 rounded-full transition bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                                title={isNavbarHidden ? "Exit Full Screen" : "Full Screen"}
                            >
                                {isNavbarHidden ? (
                                    <FaCompress className="text-lg" />
                                ) : (
                                    <FaExpand className="text-lg" />
                                )}
                            </button>
                            {/* Next Slide Button */}
                            {topicTypeData?.topicType === "slide" && !isLastSlide && (
                                <button
                                    onClick={async () => {
                                        if (isYouTubeSlide) {
                                            await handleSlideComplete(activeSlideId, isYouTubeSlide);
                                        }
                                        goToNext();
                                    }}
                                    disabled={!isYouTubeSlide && nextSlideStatus === "not_started"}
                                    title={
                                        !isYouTubeSlide && nextSlideStatus === "not_started"
                                            ? "Please complete the current slide to access next slide"
                                            : ""
                                    }
                                    className={`w-18 lg:w-36 flex group items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all
                            ${!isYouTubeSlide && nextSlideStatus === "not_started"
                                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                            : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                                        }`}
                                >
                                    {/* Next<span className='hidden lg:inline-flex mr-2'>Slide</span><ChevronRight className="lg:hidden w-4 h-4 ml-2" /> */}
                                    <span className='lg:hidden inline-flex items-center justify-between'>Next<ChevronRight className="lg:hidden w-4 h-4 ml-2" /></span>
                                    <span className='hidden lg:inline-flex'>Next Slide</span>
                                </button>
                            )}
                            {/* Mark as Completed for Last YouTube Slide */}
                            {topicTypeData?.topicType === "slide" && isLastSlide && isYouTubeSlide && (
                                <button
                                    onClick={() => handleSlideComplete(activeSlideId, true)}
                                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg shadow hover:bg-green-700 transition"
                                >
                                    Mark as Completed
                                </button>
                            )}
                            {/* Next Topic Button */}
                            <button
                                onClick={navigateToNextTopic}
                                disabled={
                                    !topicData?.topics ||
                                    !currentTopic ||
                                    (() => {
                                        // Still compute locally for 'disabled' state just for the button visual
                                        const topics = topicData.topics;
                                        const currentIndex = topics.findIndex(t => t.id === currentTopic.id);
                                        const nextTopic = topics[currentIndex + 1];
                                        return !nextTopic || !nextTopic.isAccessible;
                                    })()
                                }
                                className="w-28 px-4 py-2.5 rounded-lg font-medium transition 
                        disabled:bg-gray-200 disabled:text-gray-400
                        bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedQuizId && selectedQuizData ? (
                <div className="flex-1">
                    <DisplayQuizContent
                        activeQuiz={selectedQuizData}
                        quizData={selectedQuizData}
                        setShowCertificateModal={() => setShowCertificateModal(true)}
                        setShowModuleCompletionModal={setShowModuleCompletionModal}
                        setShowSessionCompletionModal={setShowSessionCompletionModal}
                        isLoading={selectedQuizLoading}
                        userId={userId}
                        courseId={courseId}
                        access_token={access_token}
                        setQuizStarted={setQuizStarted}
                        completionData={completionData}
                        refetchQuizCompletion={refetchQuizCompletion}
                        refetchActiveQuiz={refetchSelectedQuiz}
                        refetchSessions={refetchSessions}
                        refetchModules={refetchModules}
                        refetchTopics={refetchTopics}
                        refetchQuizData={refetchQuizData}
                        onQuizProgress={setQuizProgress}
                        onContinueLearning={canContinueFromAssessment ? navigateToNextItem : null}
                        moduleTopics={topicData?.topics || []}
                        moduleAssignments={assignmentData?.assignments || []}
                        assignmentCompletionData={assignmentCompletionData || []}
                    />
                </div>
            ) : selectedAssignmentId && selectedAssignmentData ? (
                <div className="flex flex-1 relative">
                    <div className={`flex-1`}>
                        <DisplayAssignmentContent
                            activeAssignment={selectedAssignmentData}
                            setActiveAssignment={handleSetSelectedAssignmentId}
                            assignmentData={assignmentData}
                            setShowCertificateModal={() => setShowCertificateModal(true)}
                            setShowModuleCompletionModal={setShowModuleCompletionModal}
                            setShowSessionCompletionModal={setShowSessionCompletionModal}
                            userId={userId}
                            courseId={courseId}
                            moduleId={currentModule?.id}
                            access_token={access_token}
                            completionData={assignmentCompletionData}
                            moduleQuizzes={quizData?.quizzes || []}
                            quizCompletionData={completionData || []}
                            refetchSessions={refetchSessions}
                            refetchModules={refetchModules}
                            refetchTopics={refetchTopics}
                            refetchAssignmentCompletion={refetchAssignmentCompletion}
                            refetchAssignmentData={refetchAssignmentData}
                            isMobile={isMobile}
                            onBack={() => setSelectedAssignmentId(null)}
                            onContinueLearning={canContinueFromAssessment ? navigateToNextItem : null}
                        />
                    </div>
                    <AnimatePresence>
                        {isAssignmentSidebarOpen && (
                            <>
                                {/* Translucent backdrop */}
                                <motion.div
                                    className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsAssignmentSidebarOpen(false)}
                                />
                                <motion.div
                                    className="fixed right-0 w-full sm:w-[400px] bg-white/95 backdrop-blur-xl border-l border-gray-200 shadow-xl z-50 flex flex-col"
                                    style={{
                                        top: 'var(--course-navbar-bottom, 70px)',
                                        bottom: '0px'
                                    }}
                                    initial={{ x: '100%' }}
                                    animate={{ x: 0 }}
                                    exit={{ x: '100%' }}
                                    transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                                    role="dialog"
                                    aria-label="Assignment details"
                                >
                                    {(() => {
                                        const assignment = selectedAssignmentData;
                                        if (!assignment) {
                                            return (
                                                <div className="flex-1 flex items-center justify-center p-8">
                                                    <p className="text-gray-500 text-sm">No assignment data available</p>
                                                </div>
                                            );
                                        }

                                        const completedAssignment = assignmentCompletionData?.find(
                                            (completion) => completion.assignmentId === assignment.id
                                        );

                                        // Helper to format date
                                        const formatDate = (dateString) => {
                                            return new Date(dateString).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            });
                                        };

                                        // Helper to format category - first letter capital, remove underscores, add spaces
                                        const formatCategory = (category) => {
                                            if (!category) return '';
                                            return category
                                                .replace(/_/g, ' ') // Replace underscores with spaces
                                                .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letter of each word
                                        };

                                        return (
                                            <>
                                                {/* Header - Mobile Optimized */}
                                                <div className="px-4 py-3 border-b border-gray-200/70 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm sticky top-0 z-10">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow ring-1 ring-blue-400/30 flex-shrink-0">
                                                                <FaClipboardList className="text-white text-sm" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <h3 className="text-sm font-semibold text-gray-800 truncate">
                                                                    Assignment
                                                                </h3>
                                                                <p className="text-[10px] text-gray-500 truncate">
                                                                    {formatCategory(assignment.category)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            <button
                                                                onClick={() => setIsAssignmentSidebarOpen(false)}
                                                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                                                            >
                                                                <FaTimes size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Assignment Content - Mobile Optimized */}
                                                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                                                    style={{ maxHeight: 'calc(100% - 80px)' }}>

                                                    {/* Basic Info */}
                                                    <div className="space-y-3">
                                                        <div>
                                                            <h4 className="text-base font-semibold text-gray-900 mb-2 break-words">
                                                                {assignment.title}
                                                            </h4>
                                                            {assignment.description && (
                                                                <div
                                                                    className="text-xs text-gray-600 leading-relaxed break-words prose prose-sm max-w-none"
                                                                    dangerouslySetInnerHTML={{ __html: assignment.description }}
                                                                />
                                                            )}
                                                        </div>

                                                        {/* Assignment Details Grid - Mobile Optimized */}
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <div className="bg-gray-50 rounded-lg p-2">
                                                                <p className="text-[10px] text-gray-500 font-medium mb-1">Max Score</p>
                                                                <p className="text-gray-900 font-semibold text-sm">{assignment.max_score} points</p>
                                                            </div>
                                                            <div className="bg-gray-50 rounded-lg p-2">
                                                                <p className="text-[10px] text-gray-500 font-medium mb-1">Max Attempts</p>
                                                                <p className="text-gray-900 font-semibold text-sm">{assignment.max_attempt}</p>
                                                            </div>
                                                            <div className="bg-gray-50 rounded-lg p-2">
                                                                <p className="text-[10px] text-gray-500 font-medium mb-1">Due Date</p>
                                                                <p className="text-gray-900 font-semibold text-sm">{formatDate(completedAssignment?.due_date)}</p>
                                                            </div>
                                                            <div className="bg-gray-50 rounded-lg p-2">
                                                                <p className="text-[10px] text-gray-500 font-medium mb-1">Used Attempts</p>
                                                                <p className="text-gray-900 font-semibold text-sm">{completedAssignment?.tried_attempts || 0}</p>
                                                            </div>
                                                            {assignment.extension_limit > 0 && (
                                                                <div className="bg-gray-50 rounded-lg p-2 col-span-2">
                                                                    <p className="text-[10px] text-gray-500 font-medium mb-1">Extension Limit</p>
                                                                    <p className="text-gray-900 font-semibold text-sm">{assignment.extension_limit}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                </div>
                                            </>
                                        );
                                    })()}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                <>
                    {/* Main Content + Right Panel */}
                    <div className="flex flex-1 relative">
                        {/* Main Content (Left) - No margin adjustment */}
                        <div className="flex-1 p-4 md:p-6">
                            {topicTypeData?.topicType === "video" && (
                                <DisplayVideoContentDup
                                    detailedTopicData={detailedTopicData}
                                    handleMarkTopicCompleted={handleTopicCompletionWithExtra}
                                    isNavbarHidden={isNavbarHidden}
                                    isTopicCompleted={isTopicCompleted}
                                />
                            )}
                            {topicTypeData?.topicType === "audio" && (
                                <DisplayAudioDup
                                    detailedTopicData={detailedTopicData}
                                    handleMarkTopicCompleted={handleTopicCompletionWithExtra}
                                />
                            )}
                            {topicTypeData?.topicType === "accordian" && (
                                <DisplayAccordionDup
                                    detailedTopicData={detailedTopicData}
                                    accordianStatusData={accordianStatusData}
                                    openIndex={openAccordionIndex}
                                    setOpenIndex={setOpenAccordionIndex}
                                    handleMarkTopicCompleted={handleMarkTopicCompleted}
                                    userId={userId}
                                    courseId={courseId}
                                    currentSession={currentSession}
                                    currentModule={currentModule}
                                    access_token={access_token}
                                    trackStudentTimeSpentOnTopic={trackStudentTimeSpentOnTopic}
                                    onAudioChange={(audioUrl) => {
                                        setCurrentAccordionAudio(audioUrl);
                                    }}
                                    onTimerChange={(timerValue) => {
                                        setCurrentAccordionTimer(timerValue);
                                    }} // ✅ new
                                    setCurrentAccordionId={setCurrentAccordionId}
                                    isTopicCompleted={isTopicCompleted}
                                />
                            )}
                            {topicTypeData?.topicType === "general" && (
                                <DisplayGeneralDup
                                    detailedTopicData={detailedTopicData}
                                    handleMarkTopicCompleted={handleMarkTopicCompleted}
                                    isTopicCompleted={isTopicCompleted}
                                />
                            )}

                            {topicTypeData?.topicType === "slide" && (
                                <DisplayMultiSlideDup
                                    slides={slidesData || []}
                                    isLoading={slidesLoading}
                                    isError={slidesError}
                                    activeSlideId={activeSlideId}
                                    setActiveSlideId={setActiveSlideId}
                                    slideContent={slideContentData}   // ✅ send the actual slide content
                                    userId={userId}
                                    courseId={courseId}
                                    currentSession={currentSession}
                                    currentModule={currentModule}
                                    currentTopic={currentTopicRef.current}
                                    access_token={access_token}
                                    handleMarkTopicCompleted={handleMarkTopicCompleted}
                                    handleSlideComplete={handleSlideComplete}  // ✅ new slide completion handler
                                    openAccordionId={openMultiSlideAccordionId}               // ✅ new
                                    setOpenAccordionId={setOpenMultiSlideAccordionId}
                                    setOpenId={setOpenId}  // ✅ new    
                                    openId={openId}        // ✅ new
                                    existingAccordionSummaries={existingSlideAccordionSummaries}
                                    isTopicCompleted={isTopicCompleted}
                                />
                            )}

                        </div>
                        {/* Enhanced Files Panel (Refactored) */}
                        <AnimatePresence>
                            {isFilesPanelOpen && (
                                <>
                                    {/* Translucent backdrop */}
                                    <motion.div
                                        className="fixed inset-0 z-40"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setIsFilesPanelOpen(false)}
                                    />
                                    <motion.div
                                        className={`fixed right-0 bottom-0 w-[400px] max-w-[90vw] bg-white border-l border-gray-200 shadow-[-5px_0_30px_rgba(0,0,0,0.1)] z-[1100] flex flex-col top-[0px]`}
                                        initial={{ x: "100%" }}
                                        animate={{ x: 0 }}
                                        exit={{ x: "100%" }}
                                        transition={{ type: "spring", stiffness: 320, damping: 32 }}
                                        role="dialog"
                                        aria-label="Topic materials"
                                    >

                                        {(() => {
                                            // derive attachment sources
                                            // Support both misspelled 'accordianDetails' and correct 'accordionDetails'
                                            const accDetailsRoot = detailedTopicData?.topic?.accordianDetails || detailedTopicData?.topic?.accordionDetails || [];
                                            const curAcc = (openAccordionIndex !== null) ? accDetailsRoot?.[openAccordionIndex] : null;
                                            const accordionAttachments = curAcc ? (curAcc.AccordionAttachments || curAcc.accordionAttachments || curAcc.attachments || []) : [];
                                            // General topic details (single topic) and multi-slide general details
                                            const generalDetails = topicTypeData?.topicType === 'general' ? (detailedTopicData?.topic?.generalDetails || []) : [];
                                            const multiSlideGeneralDetails = (topicTypeData?.topicType === 'slide' && slideContentData?.slide?.type === 'general')
                                                ? (slideContentData?.slide?.generalDetails || []) : [];
                                            // New materials arrays from backend for general topics and slide-general
                                            const topicMaterials = (detailedTopicData?.topic?.TopicMaterials || []).map(m => ({
                                                fileUrl: m.url,
                                                fileType: m.material_type,
                                                fileName: m.url?.split('/').pop(),
                                                code: m.code,
                                                codeLanguage: m.codeLanguage
                                            }));

                                            // Build list of slide-specific materials (if any)
                                            const slideMaterials = (topicTypeData?.topicType === 'slide' && slideContentData?.slide?.slideMaterials)
                                                ? slideContentData.slide.slideMaterials.map(m => ({
                                                    fileUrl: m.url,
                                                    fileType: m.material_type,
                                                    fileName: m.url?.split('/').pop(),
                                                    code: m.code,
                                                    codeLanguage: m.codeLanguage
                                                }))
                                                : [];

                                            const generalMaterials = generalDetails.flatMap(g => (Array.isArray(g?.materials) ? g.materials : []).map(m => ({
                                                fileUrl: m.url,
                                                fileType: m.material_type,
                                                fileName: m.url?.split('/').pop()
                                            })));
                                            const multiSlideAttachments = (topicTypeData?.topicType === 'slide' && slideContentData?.slide?.type === 'accordian' && openMultiSlideAccordionId)
                                                ? (slideContentData?.slide?.accordianDetails?.find(acc => acc.id === openMultiSlideAccordionId)?.MultiSlideAccordionAttachments || []) : [];
                                            const slideGeneralMaterials = (topicTypeData?.topicType === 'slide' && slideContentData?.slide?.type === 'general')
                                                ? (slideContentData?.slide?.generalDetails || []).flatMap(g => (Array.isArray(g?.materials) ? g.materials : []).map(m => ({
                                                    fileUrl: m.url,
                                                    fileType: m.material_type,
                                                    fileName: m.url?.split('/').pop()
                                                })))
                                                : [];

                                            // Consolidated code example sources (avoid duplicates by simple JSON string key uniqueness)
                                            const codeExampleBlocks = (() => {
                                                const map = new Map();

                                                // Include generalDetails and multiSlideGeneralDetails as before
                                                [...generalDetails, ...multiSlideGeneralDetails].filter(g => g?.code).forEach(g => {
                                                    const key = `${g.codeLanguage || 'text'}::${(g.code || '').slice(0, 50)}`;
                                                    if (!map.has(key)) map.set(key, g);
                                                });

                                                if (topicTypeData?.topicType === 'slide' && slideMaterials.length > 0 && rightPanelTab === 'slide') {
                                                    // Add slideMaterials with material_type: "code"
                                                    slideMaterials.filter(m => m.fileType === 'code' && m.code).forEach(m => {
                                                        const key = `${m.codeLanguage || 'text'}::${(m.code || '').slice(0, 50)}`;
                                                        if (!map.has(key)) map.set(key, m);
                                                    });
                                                } else {
                                                    // Add TopicMaterials with material_type: "code"
                                                    topicMaterials.filter(m => m.fileType === 'code' && m.code).forEach(m => {
                                                        const key = `${m.codeLanguage || 'text'}::${(m.code || '').slice(0, 50)}`;
                                                        if (!map.has(key)) map.set(key, m);
                                                    });
                                                }

                                                return Array.from(map.values());
                                            })();
                                            // Build list of files that belong to the topic (attachments, topic materials, general materials etc.)
                                            const topicFiles = [
                                                ...accordionAttachments.map(a => ({
                                                    fileUrl: a.fileUrl,
                                                    fileType: a.fileType,
                                                    fileName: a.fileName || a.fileUrl?.split('/').pop()
                                                })),
                                                ...generalMaterials,
                                                ...topicMaterials.filter(m => m.fileType !== 'code'), // Exclude code materials from files
                                                ...multiSlideAttachments.map(a => ({
                                                    fileUrl: a.fileUrl,
                                                    fileType: a.fileType,
                                                    fileName: a.fileName || a.fileUrl?.split('/').pop()
                                                })),
                                                ...slideGeneralMaterials,
                                            ];

                                            // Build list of slide-specific materials (if any)
                                            const slideMaterialsFiles = (topicTypeData?.topicType === 'slide' && slideContentData?.slide?.slideMaterials)
                                                ? slideContentData.slide.slideMaterials
                                                    .filter(m => m.material_type !== "code") // ⬅ ignore code type
                                                    .map(m => ({
                                                        fileUrl: m.url,
                                                        fileType: m.material_type,
                                                        fileName: m.url?.split('/').pop(),
                                                        code: m.code,
                                                        codeLanguage: m.codeLanguage
                                                    }))
                                                : [];

                                            // Choose which list to show based on the tab selection
                                            const activeFilesList = (topicTypeData?.topicType === 'slide' && slideMaterials.length > 0 && rightPanelTab === 'slide') ? slideMaterialsFiles : topicFiles;

                                            // FIXED SEARCH FUNCTIONALITY - Only search in displayed names
                                            const filtered = fileFilter ? activeFilesList.filter((f, index) => {
                                                // Create the displayed name that users see (same as in the UI)
                                                const displayedName = `${currentTopic?.title || 'Topic'} - ${index + 1}`;

                                                // Search in the full displayed name (not truncated)
                                                return displayedName?.toLowerCase().includes(fileFilter.toLowerCase());
                                            }) : activeFilesList;
                                            const fileIcon = (t, ext) => {
                                                if (t === 'video' || /\.(mp4|mov|webm)$/i.test(ext)) return <FaFile className="text-rose-500" />;
                                                if (t === 'audio' || /\.(mp3|wav|ogg)$/i.test(ext)) return <FaFile className="text-sky-500" />;
                                                if (/\.(pdf)$/i.test(ext)) return <FaFile className="text-red-600" />;
                                                if (/\.(png|jpe?g|gif|webp|svg)$/i.test(ext)) return <FaFile className="text-amber-500" />;
                                                return <FaFile className="text-emerald-600" />;
                                            };

                                            // Helper: extract a YouTube video id from various URL forms
                                            const extractYouTubeId = (url) => {
                                                if (!url) return null;
                                                // If already looks like a raw 11-char ID
                                                if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
                                                const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
                                                const match = url.match(regExp);
                                                return match ? match[1] : null;
                                            };

                                            // Helper: build final href without erroneously prefixing backend media base
                                            const resolveAttachmentUrl = (f) => {
                                                if (!f) return '#';
                                                const raw = f.fileUrl || '';
                                                if (f.fileType === 'youtube') {
                                                    const id = extractYouTubeId(raw);
                                                    if (id) return `https://www.youtube.com/watch?v=${id}`;
                                                    // fallback: if already a full http(s) link, return as-is
                                                    if (/^https?:\/\//i.test(raw)) return raw;
                                                    return `https://www.youtube.com/watch?v=${raw}`; // last resort
                                                }
                                                // Absolute URL (already external)
                                                if (/^https?:\/\//i.test(raw)) return raw;
                                                // Otherwise treat as backend relative asset
                                                return `${mediaBase}${raw}`;
                                            };

                                            return (
                                                <>
                                                    {/* Header */}
                                                    <div className="px-5 py-3 border-b border-gray-200/70 bg-gradient-to-r from-white/80 to-white/60 sticky top-0 z-10">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow ring-1 ring-blue-400/30">
                                                                    <FaFolder className="text-white text-base" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-sm font-semibold text-gray-800 leading-tight">
                                                                        Materials
                                                                    </h3>
                                                                    <p className="text-[11px] text-gray-500">
                                                                        {filtered.length} file{filtered.length !== 1 && 's'}
                                                                        {fileFilter && ` (filtered from ${activeFilesList.length})`}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button onClick={() => setIsFilesPanelOpen(false)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
                                                                    <FaTimes size={14} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* If topic is 'slide' and slideMaterials exist, show tabs to switch between topic & slide materials */}
                                                        {topicTypeData?.topicType === 'slide' && slideContentData?.slide?.slideMaterials && slideContentData?.slide?.slideMaterials.length > 0 ? (
                                                            <div className="mb-3 flex items-center gap-2 px-3">
                                                                <button
                                                                    onClick={() => setRightPanelTab('topic')}
                                                                    className={`flex-1 text-center px-4 py-2 rounded-t-lg text-sm font-medium transition ${rightPanelTab === 'topic' ? 'bg-white text-black border border-b-0 border-gray-200' : 'text-gray-600 bg-transparent'}`}
                                                                >
                                                                    Topic Materials
                                                                </button>

                                                                <div className="w-[1px] bg-gray-200 h-6 rounded" aria-hidden />

                                                                <button
                                                                    onClick={() => setRightPanelTab('slide')}
                                                                    className={`flex-1 text-center px-4 py-2 rounded-t-lg text-sm font-medium transition ${rightPanelTab === 'slide' ? 'bg-white text-black border border-b-0 border-gray-200' : 'text-gray-600 bg-transparent'}`}
                                                                >
                                                                    Slide Materials
                                                                    <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full">{slideContentData?.slide?.slideMaterials?.length || 0}</span>
                                                                </button>
                                                            </div>
                                                        ) : null}
                                                    </div>

                                                    {/* List */}
                                                    <div className="flex-1 mb-16 overflow-y-auto px-4 py-4 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ maxHeight: 'calc(100% - 100px)' }}>
                                                        {filtered.length === 0 && (
                                                            <div className="text-center py-12 px-4 border border-dashed rounded-xl bg-white/40">
                                                                <p className="text-sm font-medium text-gray-600 mb-1">
                                                                    {fileFilter ? 'No matching files found' : 'No files available'}
                                                                </p>
                                                                <p className="text-xs text-gray-400">
                                                                    {fileFilter ? 'Try a different search term' : 'No materials attached to this topic'}
                                                                </p>
                                                                {fileFilter && (
                                                                    <button
                                                                        onClick={() => setFileFilter('')}
                                                                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                                                                    >
                                                                        Clear search
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}

                                                        {filtered.map((f, i) => {
                                                            const actualFileName = f.fileName || (f.fileUrl ? f.fileUrl.split('/').pop() : 'File');
                                                            const ext = actualFileName || '';
                                                            const href = resolveAttachmentUrl(f);
                                                            const isImage = /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(ext);

                                                            // Display name for the list
                                                            const displayNumber = `${i + 1}`;
                                                            const topicDisplayName = `${currentTopic?.title || 'Topic'} - ${displayNumber}`;

                                                            return (
                                                                <motion.div
                                                                    key={(f.fileUrl || '') + i}
                                                                    className="group block rounded-xl border border-gray-200 hover:border-blue-300 bg-white/70 hover:bg-white transition shadow-sm hover:shadow-md p-3 cursor-pointer"
                                                                    onClick={() => {
                                                                        const isViewerType = /\.(pdf|docx?|pptx?|xlsx?)$/i.test(ext);
                                                                        if (isImage) {
                                                                            setPreviewImage(href); // open modal instead of link
                                                                        } else if (isViewerType) {
                                                                            setPreviewMaterial(href);
                                                                            setPreviewMaterialType(ext.split('.').pop().toLowerCase());
                                                                        } else {
                                                                            window.open(href, "_blank", "noopener,noreferrer");
                                                                        }
                                                                    }}
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ delay: 0.05 * i }}
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:scale-105 transition">
                                                                            {fileIcon(f.fileType, ext)}
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="text-[13px] font-medium text-gray-700 truncate group-hover:text-gray-900">
                                                                                {topicDisplayName}
                                                                            </p>
                                                                            {/* <p className="text-[11px] text-gray-500 truncate mt-1">
                                                                                {actualFileName}
                                                                            </p> */}
                                                                            <p className="text-[10px] uppercase tracking-wide text-gray-400 mt-0.5">
                                                                                {f.fileType || 'file'}
                                                                            </p>
                                                                        </div>
                                                                        <span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-600 transition">
                                                                            {isImage ? 'VIEW' : 'OPEN'}
                                                                        </span>
                                                                    </div>
                                                                </motion.div>
                                                            );
                                                        })}

                                                        {/* Accordion code example (from open accordion) */}
                                                        {topicTypeData?.topicType === 'accordian' && curAcc?.code && (
                                                            <div className="pt-6">
                                                                <div className="text-sm font-medium text-gray-600 mb-2 flex items-center justify-between">
                                                                    <span>Code Example</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(curAcc.code || '');
                                                                            setCopiedCodeIndex(9999); // special marker
                                                                            setTimeout(() => setCopiedCodeIndex(null), 1500);
                                                                        }}
                                                                        className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 hover:scale-105 font-medium"
                                                                        title="Copy code"
                                                                    >
                                                                        {copiedCodeIndex === 9999 ? 'Copied!' : 'Copy'}
                                                                    </button>
                                                                </div>
                                                                <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                                                                    <pre className="m-0 p-4 text-[12px] leading-relaxed bg-[#1e1e2e] text-gray-100 overflow-auto">
                                                                        {curAcc.code}
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Code examples (general topic or multi-slide general) */}
                                                        {codeExampleBlocks.length > 0 && (
                                                            <div className="pt-4 space-y-4">
                                                                <div className="text-sm font-medium text-gray-600 mb-2">Code Examples</div>
                                                                {codeExampleBlocks.map((g, idx) => (
                                                                    <motion.div
                                                                        key={idx}
                                                                        initial={{ opacity: 0, y: 20 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ delay: 0.1 + (idx * 0.1) }}
                                                                        className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white"
                                                                    >
                                                                        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex items-center justify-between">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-sm font-small text-gray-600">
                                                                                    {g.codeLanguage ? g.codeLanguage.toUpperCase() : 'CODE'}
                                                                                </span>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    navigator.clipboard.writeText(g.code || "");
                                                                                    setCopiedCodeIndex(idx);
                                                                                    setTimeout(() => setCopiedCodeIndex(null), 1800);
                                                                                }}
                                                                                className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 hover:scale-105 font-medium"
                                                                                title="Copy code"
                                                                            >
                                                                                {copiedCodeIndex === idx ? (
                                                                                    <>
                                                                                        <FiCheck className="text-emerald-500" size={14} />
                                                                                        <span className="text-emerald-600">Copied!</span>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <FiCopy size={14} />
                                                                                        <span>Copy</span>
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                        <div className="relative">
                                                                            <SyntaxHighlighter
                                                                                language={g.codeLanguage || 'javascript'}
                                                                                style={dracula}
                                                                                customStyle={{
                                                                                    margin: 0,
                                                                                    fontSize: '13px',
                                                                                    background: '#1e1e2e',
                                                                                    padding: '16px 20px',
                                                                                    lineHeight: '1.5',
                                                                                    fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace'
                                                                                }}
                                                                            >
                                                                                {g.code}
                                                                            </SyntaxHighlighter>
                                                                        </div>
                                                                    </motion.div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </>
            )}

            <div id="daily-session-tracker" data-session-time="0">
                <DailySessionTracker
                    isRightSidebarOpen={isRightSidebarOpen}
                    onClose={() => setIsRightSidebarOpen(false)}
                    enrollmentId={enrollmentId}
                    userId={userId}
                    showEndSessionModal={showEndSessionModal}
                    setShowEndSessionModal={setShowEndSessionModal}
                    activeTopic={currentTopic}
                    onSessionStateChange={handleSessionStateChange}
                    onTimeUpdate={(time) => {
                        const trackerElement = document.getElementById('daily-session-tracker');
                        if (trackerElement) {
                            trackerElement.setAttribute('data-session-time', time.toString());
                        }
                    }}
                    pauseDueToMedia={mediaPaused}
                />
            </div>

            <div className="relative z-[9999]">
                <div className="relative z-[9999]">
                    <EndSessionModal
                        isOpen={showEndSessionModal}
                        onCancel={() => {
                            setIsNavigatingAway(false);
                            setShowEndSessionModal(false);
                            setPendingNavigation(null);
                        }}
                        onConfirm={async () => {
                            const tracker = document.getElementById('daily-session-tracker');
                            if (tracker) {
                                try {
                                    // First send the end session event to trigger the API call
                                    const sessionTime = parseInt(tracker.getAttribute('data-session-time') || '0', 10);

                                    // Dispatch SYNC_TOPIC_TIME event first
                                    window.dispatchEvent(new CustomEvent('SYNC_TOPIC_TIME_BEFORE_SESSION_END', {
                                        detail: { reason: 'session_end_from_modal' }
                                    }));

                                    // Wait for sync to complete
                                    await new Promise(resolve => setTimeout(resolve, 100));

                                    const endEvent = new CustomEvent('endSession', {
                                        bubbles: true,
                                        detail: { sessionTime }
                                    });
                                    tracker.dispatchEvent(endEvent);

                                    // Wait for the API call to complete
                                    await new Promise(resolve => setTimeout(resolve, 1000));

                                    // Then set the state to inactive
                                    const stateChangeEvent = new CustomEvent('sessionStateChange', {
                                        bubbles: true,
                                        detail: { active: false }
                                    });
                                    tracker.dispatchEvent(stateChangeEvent);

                                    // Wait for state changes to complete
                                    await new Promise(resolve => setTimeout(resolve, 100));

                                    setShowEndSessionModal(false);
                                    setIsNavigatingAway(false);

                                    if (pendingNavigation) {
                                        window.location.href = pendingNavigation; // go where user intended
                                    } else {
                                        navigate("/student-dashboard");
                                    }
                                    // window.location.replace("/student-dashboard");
                                } catch (error) {
                                    console.error("Error ending session:", error);
                                    // Still redirect even if there's an error
                                    setShowEndSessionModal(false);
                                    window.location.replace("/student-dashboard");
                                }
                            }
                        }}
                        sessionTimeSpent={parseInt(document.getElementById('daily-session-tracker')?.getAttribute('data-session-time') || '0', 10)}
                        formatTime={(time) => {
                            const hours = Math.floor(time / 3600);
                            const minutes = Math.floor((time % 3600) / 60);
                            const seconds = time % 60;
                            return `${hours.toString().padStart(2, '0')}:${minutes
                                .toString()
                                .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                        }}
                    />
                </div>
            </div>

            {showTopicEndModal && (() => {
                const topics = topicData?.topics || [];
                const currentIndex = topics.findIndex(t => t.id === currentTopic?.id);
                const isFirst = currentIndex === 0;
                const isLast = currentIndex === topics.length - 1;

                return (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-[2000] animate-in fade-in duration-200">
                        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-[400px] text-center transform animate-in zoom-in-95 duration-200 mx-4 sm:mx-0 border border-gray-100">
                            {/* Success Icon - Smaller on mobile */}
                            <div className="mx-auto w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 text-green-600">
                                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            {/* Title - Smaller text on mobile */}
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">
                                Topic Completed!
                            </h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Great job! What would you like to do next?
                            </p>

                            {/* Buttons - Adjusted spacing and padding for mobile */}
                            <div className="space-y-3">
                                {/* Next Topic */}
                                {!isLast && (
                                    <button
                                        onClick={async () => {
                                            const nextTopic = topics[currentIndex + 1];
                                            if (nextTopic?.isAccessible) {
                                                await clearActiveSlideForNavigation();
                                                setCurrentTopic(nextTopic);
                                                handleSetSelectedQuizId(null);
                                                handleSetSelectedAssignmentId(null);
                                            };
                                            setShowTopicEndModal(false);
                                            completedRef.current = true
                                        }}
                                        className="w-full px-4 py-2.5 rounded-md bg-blue-600 text-white font-medium text-sm"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            Continue to Next Topic
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </span>
                                    </button>
                                )}

                                {/* Previous Topic */}
                                {!isFirst && (
                                    <button
                                        onClick={async () => {
                                            if (currentIndex > 0) {
                                                await clearActiveSlideForNavigation();
                                                setCurrentTopic(topics[currentIndex - 1]);
                                                handleSetSelectedQuizId(null);
                                                handleSetSelectedAssignmentId(null);
                                            }
                                            setShowTopicEndModal(false);
                                        }}
                                        className="w-full px-4 py-2.5 rounded-md bg-white text-gray-700 font-medium hover:bg-gray-50 border border-gray-200 transition-colors duration-200 text-sm"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                                            </svg>
                                            Go to Previous Topic
                                        </span>
                                    </button>
                                )}

                                {/* Stay Here */}
                                <button
                                    onClick={() => setShowTopicEndModal(false)}
                                    className="w-full px-4 py-2.5 rounded-md bg-white text-gray-600 font-medium hover:text-gray-900 transition-colors duration-200 text-sm"
                                >
                                    Stay Here
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {
                showSlideEndModal && (() => {
                    const currentIndex = slidesData?.slides?.findIndex(s => s.id === completedSlideId) || 0;
                    const isLastSlide = currentIndex === (slidesData?.slides?.length || 0) - 1;
                    const nextSlide = slidesData?.slides?.[currentIndex + 1];
                    const prevSlide = slidesData?.slides?.[currentIndex - 1];

                    return (
                        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-[2000] animate-in fade-in duration-200 px-4">
                            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-[400px] text-center transform animate-in zoom-in-95 duration-200 border border-gray-100">
                                {/* Success Icon - Smaller on mobile */}
                                <div className="mx-auto w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 text-green-600">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>

                                {/* Title - Smaller text on mobile */}
                                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                                    Slide Completed!
                                </h2>

                                <p className="text-sm text-gray-500 mb-6">
                                    {isLastSlide
                                        ? "Great job! You've completed all slides in this topic!"
                                        : "Excellent work! Ready for the next slide?"}
                                </p>

                                {/* Buttons - Adjusted spacing and padding for mobile */}
                                <div className="space-y-3">
                                    {/* Next Button */}
                                    <button
                                        onClick={async () => {
                                            if (isLastSlide) {
                                                const topics = topicData?.topics || [];
                                                const currentTopicIndex = topics.findIndex(t => t.id === currentTopic.id);
                                                const nextTopic = topics[currentTopicIndex + 1];
                                                if (nextTopic?.isAccessible) {
                                                    await clearActiveSlideForNavigation();
                                                    setCurrentTopic(nextTopic);
                                                    handleSetSelectedQuizId(null);
                                                    handleSetSelectedAssignmentId(null);
                                                }
                                            } else if (nextSlide) {
                                                // clearActiveSlideForNavigation();
                                                setActiveSlideId(nextSlide.id);
                                                const nextItem = slidesData.slides.find(acc => acc.id === nextSlide.id);
                                                // if (nextItem) setOpenId(nextItem.id);
                                            }
                                            setShowSlideEndModal(false);
                                            setCompletedSlideId(null);
                                        }}
                                        className="w-full px-4 py-2.5 rounded-md bg-blue-600 text-white text-sm font-medium"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            {isLastSlide ? "Continue to Next Topic" : "Continue to Next Slide"}
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </span>
                                    </button>

                                    {/* Previous Slide Button */}
                                    {!isLastSlide && prevSlide && (
                                        <button
                                            onClick={() => {
                                                if (prevSlide) {
                                                    // clearActiveSlideForNavigation();
                                                    setActiveSlideId(prevSlide.id);
                                                    const prevItem = slidesData.slides.find(acc => acc.id === prevSlide.id);
                                                    // if (prevItem) setOpenId(prevItem.id);
                                                }
                                                setShowSlideEndModal(false);
                                                setCompletedSlideId(null);
                                            }}
                                            className="w-full px-4 py-2.5 rounded-md bg-white text-gray-700 text-sm font-medium border border-gray-200"
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                                                </svg>
                                                Go to Previous Slide
                                            </span>
                                        </button>
                                    )}

                                    {/* Previous Topic Button */}
                                    {isLastSlide && (() => {
                                        const topics = topicData?.topics || [];
                                        const currentTopicIndex = topics?.findIndex(t => t.id === currentTopic?.id);
                                        const prevTopic = topics[currentTopicIndex - 1];
                                        return prevTopic ? (
                                            <button
                                                onClick={async () => {
                                                    await clearActiveSlideForNavigation();
                                                    setCurrentTopic(prevTopic);
                                                    handleSetSelectedQuizId(null);
                                                    handleSetSelectedAssignmentId(null);
                                                    setShowSlideEndModal(false);
                                                    setCompletedSlideId(null);
                                                }}
                                                className="w-full px-4 py-2.5 rounded-md bg-white text-gray-600 text-sm font-medium hover:text-gray-900"
                                            >
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                                                    </svg>
                                                    Go to Previous Topic
                                                </span>
                                            </button>
                                        ) : null;
                                    })()}

                                    {/* Stay Here Button */}
                                    <button
                                        onClick={() => {
                                            setShowSlideEndModal(false);
                                            setCompletedSlideId(null);
                                        }}
                                        className="w-full px-4 py-2.5 rounded-md bg-white text-gray-600 font-medium hover:text-gray-900 transition-colors duration-200 text-sm"
                                    >
                                        Stay Here
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()
            }

            {/* Go To Quiz Or Assignment Or Both if remains to complete */}
            {
                showModuleEndModal && ((quizData?.quizzes?.length > 0) || (assignmentData?.assignments?.length > 0)) && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-[2000] animate-in fade-in duration-200">
                        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-[400px] text-center transform animate-in zoom-in-95 duration-200 mx-4 sm:mx-0 border border-gray-100">
                            {/* Success Icon */}
                            <div className="mx-auto w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 text-green-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            {/* Title - Smaller text on mobile */}
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">
                                All Topics Completed!
                            </h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Great job! What would you like to do next?
                            </p>
                            {/* Buttons - Adjusted spacing and padding for mobile */}
                            <div className="space-y-3">
                                {/* Quiz Button */}
                                {quizData?.quizzes?.length > 0 && <button
                                    onClick={async () => {
                                        await clearActiveSlideForNavigation();
                                        const moduleQuizzes = quizData?.quizzes || [];
                                        if (moduleQuizzes.length > 0) {
                                            handleSetSelectedQuizId(moduleQuizzes[0].id);
                                            handleSetSelectedAssignmentId(null);
                                        }
                                        setShowModuleEndModal(false);
                                        setShowTopicEndModal(false);
                                        setShowSlideEndModal(false);
                                    }}
                                    className="w-full px-4 py-2.5 rounded-md bg-blue-600 text-white font-medium text-sm"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        Start Quiz
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </span>
                                </button>}

                                {/* Assignment Button */}
                                {assignmentData?.assignments?.length > 0 && <button
                                    onClick={async () => {
                                        await clearActiveSlideForNavigation();
                                        const moduleAssignments = assignmentData?.assignments || [];
                                        if (moduleAssignments.length > 0) {
                                            handleSetSelectedAssignmentId(moduleAssignments[0].id);
                                            handleSetSelectedQuizId(null);
                                        }
                                        setShowModuleEndModal(false);
                                        setShowTopicEndModal(false);
                                        setShowSlideEndModal(false);
                                    }}
                                    className="w-full px-4 py-2.5 rounded-md bg-white text-gray-700 font-medium hover:bg-gray-50 border border-gray-200 transition-colors duration-200 text-sm"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        Start Assignment
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </span>
                                </button>}

                                {/* Stay Here Button */}
                                <button
                                    onClick={() => setShowModuleEndModal(false)}
                                    className="w-full px-4 py-2.5 rounded-md bg-white text-gray-600 font-medium hover:text-gray-900 transition-colors duration-200 text-sm"
                                >
                                    Stay Here
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* For Quiz And Assignment Related To Topic by Topic Content - Mobile optimized */}
            {showQuizAssignmentModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-[2000] animate-in fade-in duration-200 p-4">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-[400px] text-center transform animate-in zoom-in-95 duration-200 border border-gray-100">
                        <div className="mx-auto w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 text-green-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Topic Completed!</h3>
                        <p className="text-sm text-gray-600 mb-6">You&apos;ve completed this topic. Would you like to proceed to the assessments?</p>

                        <div className="space-y-3">
                            {topicQuizzes.map((quiz, index) => (
                                <button
                                    key={quiz.id}
                                    onClick={() => {
                                        handleSetSelectedQuizId(quiz.id);
                                        handleSetSelectedAssignmentId(null);
                                        setShowQuizAssignmentModal(false);
                                    }}
                                    className="w-full px-4 py-2.5 rounded-md bg-blue-600 text-white font-medium text-sm"
                                >
                                    Start Quiz {topicQuizzes.length > 1 ? `${index + 1}` : ''}
                                </button>
                            ))}

                            {topicAssignments.map((assignment, index) => {
                                const isPrimary = topicQuizzes.length === 0;
                                return (
                                    <button
                                        key={assignment.id}
                                        onClick={() => {
                                            handleSetSelectedAssignmentId(assignment.id);
                                            handleSetSelectedQuizId(null);
                                            setShowQuizAssignmentModal(false);
                                        }}
                                        className={`w-full px-4 py-2.5 rounded-md font-medium text-sm transition-colors duration-200 ${isPrimary
                                            ? "bg-blue-600 text-white"
                                            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                                            }`}
                                    >
                                        View Assignment {topicAssignments.length > 1 ? `${index + 1}` : ''}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => {
                                setShowQuizAssignmentModal(false);
                            }}
                            className="mt-3 px-3 py-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            Stay Here
                        </button>
                    </div>
                </div>
            )}

            {/* Module Completion Modal - Mobile optimized */}
            {showModuleCompletionModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-[2000] animate-in fade-in duration-200 p-4">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-[400px] text-center transform animate-in zoom-in-95 duration-200 border border-gray-100">

                        {/* Icon */}
                        <div className="mx-auto w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 text-green-600">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z"></path>
                            </svg>
                        </div>

                        {/* Title & Text */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Module Completed!</h3>
                        <p className="text-sm text-gray-600 mb-6">Congratulations! You&apos;ve successfully completed this module.</p>

                        {/* Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={handleNextModule}
                                className="w-full px-4 py-2.5 rounded-md bg-blue-600 text-white font-medium text-sm"
                            >
                                Go to Next Module
                            </button>
                            <button
                                onClick={() => handleStayHere('module')}
                                className="w-full px-4 py-2.5 rounded-md bg-white text-gray-600 font-medium hover:text-gray-900 transition-colors duration-200 text-sm"
                            >
                                Stay Here
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Session Completion Modal - Mobile optimized */}
            {showSessionCompletionModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-[2000] animate-in fade-in duration-200 p-4">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-[400px] text-center transform animate-in zoom-in-95 duration-200 border border-gray-100">
                        {/* Icon */}
                        <div className="mx-auto w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 text-green-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        {/* Title & Text */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Session Completed!</h3>
                        <p className="text-sm text-gray-600 mb-6">Awesome! You&apos;ve finished this session successfully.</p>

                        {/* Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={handleNextSession}
                                className="w-full px-4 py-2.5 rounded-md bg-blue-600 text-white font-medium text-sm"
                            >
                                Go to Next Session
                            </button>
                            <button
                                onClick={() => handleStayHere('session')}
                                className="w-full px-4 py-2.5 rounded-md bg-white text-gray-600 font-medium hover:text-gray-900 transition-colors duration-200 text-sm"
                            >
                                Stay Here
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Modal - Premium Centered Popup Design */}
            <AnimatePresence>
                {previewImage && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 md:p-10">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPreviewImage(null)}
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        />

                        {/* Popup Window */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
                        >
                            {/* Header */}
                            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                                        <FaFile className="text-amber-600 text-lg" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-bold text-gray-900 truncate">
                                            {previewImage.split('/').pop().split('?')[0]}
                                        </h3>
                                        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                                            Image Viewer
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownloadMaterial(previewImage, previewImage.split('/').pop().split('?')[0]);
                                        }}
                                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        <span className="hidden sm:inline lg:hidden">Download</span>
                                        <span className="hidden lg:inline">Download Image</span>
                                    </button>
                                    <button
                                        onClick={() => setPreviewImage(null)}
                                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all group"
                                    >
                                        <FaTimes className="text-base sm:text-lg group-hover:rotate-90 transition-transform duration-300" />
                                    </button>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 bg-gray-50 flex items-center justify-center overflow-auto p-4 sm:p-8">
                                <img
                                    src={previewImage || `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`}
                                    alt="Preview"
                                    className="max-w-full max-h-full rounded-lg shadow-lg object-contain bg-white"
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Material Preview Modal for PDFs and Documents - Centered Popup Design */}
            <AnimatePresence>
                {previewMaterial && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 md:p-10">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setPreviewMaterial(null);
                                setPreviewMaterialType(null);
                            }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Popup Window */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-6xl h-full max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
                        >
                            {/* Header */}
                            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                        <FaFile className="text-blue-600 text-lg" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-bold text-gray-900 truncate">
                                            {previewMaterial.split('/').pop()}
                                        </h3>
                                        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                                            {previewMaterialType} Viewer
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownloadMaterial(previewMaterial, previewMaterial.split('/').pop());
                                        }}
                                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        <span className="hidden sm:inline lg:hidden">Download</span>
                                        <span className="hidden lg:inline">Download File</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setPreviewMaterial(null);
                                            setPreviewMaterialType(null);
                                        }}
                                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all group"
                                    >
                                        <FaTimes className="text-base sm:text-lg group-hover:rotate-90 transition-transform duration-300" />
                                    </button>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 bg-gray-50 relative">
                                {previewMaterialType === 'pdf' ? (
                                    <iframe
                                        src={`${previewMaterial}#toolbar=0`}
                                        className="w-full h-full border-none rounded-b-2xl"
                                        title="PDF Preview"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col">
                                        <iframe
                                            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewMaterial)}`}
                                            className="w-full h-full border-none rounded-b-2xl"
                                            title="Document Preview"
                                        />
                                        {/* Optional Overlay message for Office Viewer as it can sometimes be slow */}
                                        <div className="absolute inset-0 -z-10 flex items-center justify-center bg-gray-50">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                <p className="text-sm text-gray-500 font-medium">Loading document viewer...</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal for description - Improved mobile sizing */}
            {
                showDescriptionModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 overflow-y-auto p-4">
                        <div
                            className="
                    bg-white
                    w-full
                    max-w-3xl
                    mx-auto
                    shadow-lg relative
                    rounded-xl overflow-hidden
                    flex flex-col
                    max-h-[85vh] sm:max-h-[70vh]
                "
                        >
                            {/* Header */}
                            <div className="sticky top-0 bg-white z-10 px-4 sm:px-6 py-3 sm:py-4 border-b rounded-t-xl">
                                <button
                                    onClick={() => setShowDescriptionModal(false)}
                                    className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-600 hover:text-gray-900"
                                >
                                    <FaTimes size={16} />
                                </button>
                                <h2 className="text-base sm:text-lg font-bold">Topic Information</h2>
                            </div>

                            {/* Scrollable Content */}
                            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                                <div className="prose text-gray-800 leading-relaxed text-justify max-w-none mx-auto w-full">
                                    {topicTypeData?.topicType === "general" ||
                                        topicTypeData?.topicType === "accordian"
                                        ? processDescriptionWithTags(detailedTopicData?.topic?.description)
                                        : topicTypeData?.topicType === "slide"
                                            ? processDescriptionWithTags(slidesData?.topicData?.description)
                                            : null}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            <CertificateModal
                isOpen={showCertificateModal}
                onClose={() => setShowCertificateModal(false)}
                courseId={courseData?.course?.id}
                courseName={courseData?.course?.title}
                certificate_url={courseData?.certificate_url}
                refetchUserCourse={refetchUserCourse}
            />
            {/* Inactivity Modal */}
            {showInactivityModal && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60" />
                    <div className="relative bg-white rounded-lg shadow-sm p-6 max-w-md w-full mx-4 sm:mx-0 z-10">
                        <div className="lg:hidden mb-4 md:mb-5 text-center">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                                <svg className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">Are you there?</h3>
                            <p className="text-xs md:text-sm text-gray-600">
                                {/* Dynamic message based on screen size */}
                                <span className="sm:hidden md:inline">We detected no activity for 5 minutes.</span>
                                <span className="hidden sm:inline md:hidden">No activity detected for 5 minutes.</span>
                            </p>
                        </div>

                        {/* Desktop Layout (unchanged) */}
                        <div className="hidden lg:block mb-6">
                            <h3 className="text-lg font-semibold mb-2">Are you there?</h3>
                            <p className="text-sm text-gray-600">We detected no activity for 5 minutes. Do you want to continue your session?</p>
                        </div>

                        {/* Buttons - Responsive Layout */}
                        <div className="flex flex-col sm:flex-row lg:flex-row lg:justify-end gap-2 md:gap-3">
                            {/* Mobile/Tablet: Full width on mobile, auto width on tablet */}
                            <button
                                onClick={handleInactivityStay}
                                className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-gray-100 rounded-md text-gray-800 font-medium transition-colors order-2 sm:order-1"
                            >
                                <span className="sm:hidden">Yes, Continue</span>
                                <span className="hidden sm:inline">Yes</span>
                            </button>
                            <button
                                onClick={handleInactivityEnd}
                                className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-red-500 text-white rounded-md font-medium transition-colors order-1 sm:order-2"
                            >
                                <span className="sm:hidden">No, End Session</span>
                                <span className="hidden sm:inline">No, End session</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}


function CountdownTimer({ seconds = 60, key, onComplete, onTick, isMaterialSidebarOpen = false }) {
    const [timeLeft, setTimeLeft] = useState(seconds);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef(null);
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        setIsPaused(isMaterialSidebarOpen);
    }, [isMaterialSidebarOpen]);

    // Update ref when onComplete changes
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    // Reset timer when seconds or key prop changes
    useEffect(() => {
        setTimeLeft(seconds);
    }, [seconds, key]);

    useEffect(() => {
        // Clear any existing interval first
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (timeLeft <= 0) return; // stop rendering interval if already 0

        if (!isPaused && !isMaterialSidebarOpen) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(timerRef.current);
                        if (onTick) onTick(0);
                        if (onCompleteRef.current) onCompleteRef.current();
                        return 0;
                    }
                    const nextTime = prevTime - 1;
                    if (onTick) onTick(nextTime);
                    return nextTime;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isPaused, isMaterialSidebarOpen, timeLeft]);

    // Handle tab visibility changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setIsPaused(true);
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
            } else {
                setIsPaused(false);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, []);

    const formatTime = (s) => {
        const hrs = Math.floor(s / 3600).toString().padStart(2, "0");
        const mins = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
        const secs = (s % 60).toString().padStart(2, "0");
        return `${hrs}:${mins}:${secs}`;
    };

    return (
        <div className="flex items-center gap-2 px-3 rounded-md">
            <Timer className="w-6 h-6 text-emerald-500" strokeWidth={2} />
            <span className="text-lg font-bold text-emerald-500 tabular-nums tracking-wide">
                {formatTime(timeLeft)}
            </span>
        </div>
    );
}
