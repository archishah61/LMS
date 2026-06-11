/* eslint-disable react/no-unknown-property */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import PrimaryLoader from '../../../components/ui/PrimaryLoader';
import { useNavigate, useParams, useLocation, useNavigationType } from 'react-router-dom';

import {
    useGetUserChallengeQuestByIdQuery,
} from '../../../services/Challenge/userChallengeQuestAPI';

import {
    useStartUserChallengePhaseMutation
} from "../../../services/Challenge/userChallengePhaseAPI";

import {
    useStartUserChallengeTaskMutation
} from "../../../services/Challenge/userChallengeTaskAPI";

import { Check, Loader2, Lock, AlertCircle, Trophy, CheckCircle, Clock, Target, BookOpen, Bookmark, X, Circle, Asterisk, Flag, Zap, Shield, Star, ArrowRight, ChevronLeft, ChevronRight, CloudCog } from 'lucide-react';
import { toast } from 'react-hot-toast';
import QuizResultAnimation from '../../../components/ui/animated-celebration';
import { getStudentToken } from '../../../services/CookieService';
import { slugify } from '../../../utils/slugify';
import SupportModal from '../../../components/modal/SupportModal';
import { useSelector } from 'react-redux';

export default function ChallengeQuestPhases() {
    const { access_token } = getStudentToken();
    const navigate = useNavigate();
    const navType = useNavigationType(); // returns 'PUSH', 'POP', or 'REPLACE'
    const [isSupportModalOpen, setSupportModalOpen] = useState(false);
    const { id: userId } = useSelector((state) => state.user)

    const { userChallengeId } = useLocation().state;

    const [activePhaseId, setActivePhaseId] = useState(1);
    const [activeUserPhase, setActiveUserPhase] = useState(null);
    const [showPhaseRewardPopup, setShowPhaseRewardPopup] = useState(false);
    const [phaseRewardData, setPhaseRewardData] = useState(null);
    const [showChallengeCompletePopup, setShowChallengeCompletePopup] = useState(false);

    // Inside your main component
    const [showResult, setShowResult] = useState(false);
    const [resultType, setResultType] = useState("success");
    const [resultMessage, setResultMessage] = useState("");
    const [timers, setTimers] = useState({});

    // Drag to scroll state
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const {
        data: challengeDetails,
        isLoading,
        error,
        refetch
    } = useGetUserChallengeQuestByIdQuery(
        { id: userChallengeId, access_token },
    );

    useEffect(() => {
        if (navType === 'POP') {
            // POP means the user navigated via back/forward (navigate(-1))
            refetch();
        }
    }, [navType, refetch]);

    useEffect(() => {
        if (challengeDetails?.data?.UserChallengePhases?.length > 0 && !activeUserPhase) {
            const phases = challengeDetails.data.UserChallengePhases;
            // Find index of the last completed phase
            const lastCompletedIndex = phases.findIndex(
                (phase) => !phase.is_completed
            );

            // If all are completed, fallback to last phase
            const nextPhase =
                lastCompletedIndex !== -1 ? phases[lastCompletedIndex] : phases[phases.length - 1];
            handlePhaseClick(nextPhase);
        }
        if (challengeDetails?.data?.is_completed) {
            triggerSuccess();
            if (challengeDetails?.data?.Challenge?.reward_points > 0) {
                const popupKey = `challenge_complete_popup_shown_${userChallengeId}_${userId}`;
                const hasShownParams = localStorage.getItem(popupKey);

                if (!hasShownParams) {
                    setShowChallengeCompletePopup(true);
                    localStorage.setItem(popupKey, 'true');
                }
            }
        }
    }, [challengeDetails, activeUserPhase, userChallengeId]);

    // Function to trigger success celebration
    const triggerSuccess = (message = null) => {
        setResultType("success");
        setResultMessage(message || "Congratulations! You've successfully completed the Challenge!");
        // setShowResult(true);
    };

    // Handle closing the animation
    const handleCloseAnimation = () => {
        setShowResult(false);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            const newTimers = {};
            activeUserPhase?.UserChallengeTasks?.forEach((task) => {
                if (task.revive_attempt_at) {
                    const reviveTime = new Date(task.revive_attempt_at).getTime();
                    const now = Date.now();
                    const diff = reviveTime - now;
                    newTimers[task.id] = diff > 0 ? diff : 0;
                }
            });
            setTimers(newTimers);
        }, 1000);

        return () => clearInterval(interval);
    }, [activeUserPhase]);

    // Check for Phase Reward Popup
    useEffect(() => {
        if (!challengeDetails?.data?.UserChallengePhases) return;

        const phases = challengeDetails.data.UserChallengePhases;

        // Find the first phase that needs a popup
        const phaseToShow = phases.find(p => {
            const key = `phase_reward_v2_${p.id}_${userId}`;
            const hasShown = localStorage.getItem(key);

            // Fallback to points_earned if bonus_reward is undefined in the list
            const rewardValue = p.ChallengePhase?.bonus_reward || p.points_earned || 0;
            const hasBonus = rewardValue > 0;

            return p.is_completed && hasBonus && !hasShown;
        });

        if (phaseToShow) {
            // const isLastPhase = phaseToShow.id === phases[phases.length - 1].id;
            // if (isLastPhase && challengeDetails.data.is_completed) {
            //     return;
            // }

            setPhaseRewardData(phaseToShow);
            setShowPhaseRewardPopup(true);
            localStorage.setItem(`phase_reward_v2_${phaseToShow.id}_${userId}`, 'true');
        }

    }, [challengeDetails, showChallengeCompletePopup]);

    // Scroll active phase into view
    useEffect(() => {
        if (activePhaseId) {
            const activeTab = document.getElementById(`phase-tab-${activePhaseId}`);
            if (activeTab) {
                activeTab.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }
    }, [activePhaseId]);

    const formatTime = (ms) => {
        if (ms <= 0) return "Ready to retry";
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor(ms / (1000 * 60 * 60));
        return `${hours > 0 ? hours + "h " : ""}${minutes}m ${seconds}s`;
    };

    const [startUserChallengePhase, { isLoading: isStartingPhase }] = useStartUserChallengePhaseMutation();
    const [startUserChallengeTask] = useStartUserChallengeTaskMutation();

    const handlePhaseClick = async (phase) => {
        try {
            const result = await startUserChallengePhase({
                data: {
                    user_challenge_id: userChallengeId,
                    challenge_phase_id: phase.challenge_phase_id,
                },
                access_token,
            }).unwrap();

            if (result.success) {
                setActivePhaseId(result.userChallengePhase.id);
                setActiveUserPhase(result.userChallengePhase);
                refetch();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error(error);
            toast.error(error?.data?.message || "Failed to Load phase");
        }
    };

    const handleTaskClick = async (task) => {
        try {
            const result = await startUserChallengeTask({
                data: {
                    user_challenge_phase_id: activeUserPhase.id,
                    challenge_task_id: task.challenge_task_id,
                },
                access_token,
            }).unwrap();

            if (result.success) {
                // Navigate to the challenge page with the challenge data
                navigate(`/challenges/task/${slugify(result.userChallengeTask?.ChallengeTask?.title)}`, { state: { userChallengeTaskId: result.userChallengeTask.id, challenge: result.userChallengeTask } });
            } else {
                toast.error(result.message || 'Failed to start challenge');
            }
        } catch (error) {
            console.error('Failed to start challenge:', error);
            toast.error(error.data?.message || 'Failed to start challenge');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <PrimaryLoader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold">Error Loading Challenge</h3>
                <p className="text-gray-600 mt-2 text-sm sm:text-base">
                    {error?.data?.message || "Could not load challenge details"}
                </p>
            </div>
        );
    }

    if (!challengeDetails?.data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
                <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold">Challenge Not Found</h3>
                <p className="text-gray-600 mt-2 text-sm sm:text-base">
                    This challenge doesn't exist or you don't have access to it.
                </p>
            </div>
        );
    }

    const { title, description } = challengeDetails?.data?.Challenge || {};
    const phases = challengeDetails?.data?.UserChallengePhases || [];
    const progressPercentage = Math.round(challengeDetails?.data?.progress_percentage || 0);

    const isPhaseActive = (phase) => activePhaseId === phase.id;

    if (!challengeDetails?.data) return null;

    return (
        <div className="container p-4 sm:p-8 bg-white sm:bg-transparent">
            {/* Header Section */}
            <div className="mb-6 sm:mb-8 relative">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold text-megistic mb-2 leading-tight">
                            {title}
                        </h1>
                        <p className="text-gray-500 text-sm sm:text-base md:text-md max-w-3xl leading-relaxed">
                            {description}
                        </p>
                    </div>
                    {/* Progress Badge - Responsive with better mobile design */}
                    <div className="flex items-center gap-3 sm:gap-4 bg-white md:bg-transparent p-3 sm:p-4 md:p-0 rounded-xl border md:border-0 border-gray-100 shadow-sm md:shadow-none">
                        {/* Mobile: Progress bar with text */}
                        <div className="md:hidden flex items-center justify-between w-full">
                            <div className="flex flex-col flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Trophy className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm font-bold text-gray-600">Keep it Up!</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-green-500 h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${progressPercentage}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-base font-bold text-gray-800 min-w-[50px]">{progressPercentage}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Desktop: Original circular progress */}
                        <div className="hidden md:flex items-center gap-4">
                            <div className="flex flex-col items-end mr-1">
                                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Progress</span>
                                <div className="flex items-center gap-1">
                                    <Trophy className="w-3.5 h-3.5 text-orange-500" />
                                    <span className="text-sm font-bold text-gray-600">Keep it Up!</span>
                                </div>
                            </div>

                            <div className="relative w-16 h-16 flex-shrink-0">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        fill="transparent"
                                        className="text-gray-100"
                                    />
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        fill="transparent"
                                        strokeDasharray={2 * Math.PI * 28}
                                        strokeDashoffset={2 * Math.PI * 28 * (1 - progressPercentage / 100)}
                                        byteLength="round"
                                        strokeLinecap="round"
                                        className="text-green-500 transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-sm font-bold text-gray-800">{progressPercentage}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs (Phase Titles) */}
            <div className="relative mb-6 sm:mb-8">
                <div
                    id="phases-container"
                    className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide scroll-smooth gap-2 cursor-grab active:cursor-grabbing select-none"
                    onWheel={(e) => {
                        const container = e.currentTarget;
                        if (e.deltaY !== 0) {
                            container.scrollLeft += e.deltaY;
                            e.preventDefault();
                        }
                    }}
                    onMouseDown={(e) => {
                        setIsDragging(true);
                        setStartX(e.pageX - e.currentTarget.offsetLeft);
                        setScrollLeft(e.currentTarget.scrollLeft);
                    }}
                    onMouseLeave={() => {
                        setIsDragging(false);
                    }}
                    onMouseUp={() => {
                        setIsDragging(false);
                    }}
                    onMouseMove={(e) => {
                        if (!isDragging) return;
                        e.preventDefault();
                        const x = e.pageX - e.currentTarget.offsetLeft;
                        const walk = (x - startX) * 2; // scroll-fast
                        e.currentTarget.scrollLeft = scrollLeft - walk;
                    }}
                >
                    {phases.map((phase, index) => {
                        const isActive = isPhaseActive(phase);

                        // Custom locking logic based on previous phase completion
                        let isLocked = !!phase.is_lock && !phase.is_completed;

                        if (index > 0) {
                            const prevPhase = phases[index - 1];
                            // Use activeUserPhase tasks if matching, to ensure we have latest progress/attempts
                            const prevTasks = (activeUserPhase?.id === prevPhase.id && activeUserPhase.UserChallengeTasks)
                                ? activeUserPhase.UserChallengeTasks
                                : (prevPhase.UserChallengeTasks || []);

                            // Check mandatory tasks completion
                            const mandatoriesDone = prevTasks.every(t =>
                                !t.ChallengeTask?.is_mandatory || t.is_completed
                            );

                            // Filter non-mandatory tasks
                            const nonMandatoryTasks = prevTasks.filter(t => !t.ChallengeTask?.is_mandatory);

                            // If there are 2 or more non-mandatory tasks, user must attempt all of them
                            const nonMandatoriesAttempted = nonMandatoryTasks.length < 2 || nonMandatoryTasks.every(t =>
                                t.attempts > 0 || t.is_completed
                            );

                            if (!mandatoriesDone || !nonMandatoriesAttempted) {
                                isLocked = true;
                            }
                        }

                        return (
                            <button
                                key={phase.id}
                                id={`phase-tab-${phase.id}`}
                                onClick={() => !isLocked && handlePhaseClick(phase)}
                                className={`pb-3 px-3 min-w-fit text-xs sm:text-sm font-medium whitespace-nowrap transition-colors relative flex items-center gap-2 ${isActive
                                    ? "text-primary border-b-2 border-primary"
                                    : isLocked
                                        ? "text-gray-300 cursor-not-allowed"
                                        : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                {!!phase.is_completed && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />}
                                {isLocked && <Lock className="w-3 h-3 sm:w-3 sm:h-3" />}
                                <span className="truncate max-w-[120px] sm:max-w-none">{phase.ChallengePhase?.title}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Active Phase Content */}
            <div className="space-y-4 sm:space-y-6">
                {phases.filter(p => p.id === activePhaseId).map((phase) => {
                    // Ensure we have the latest tasks from activeUserPhase if it matches, otherwise fallback to phase data
                    const tasksToRender = activeUserPhase?.id === phase.id ? activeUserPhase.UserChallengeTasks : phase.UserChallengeTasks;
                    if (!tasksToRender) return null;

                    return (
                        <div key={phase.id} className="animation-fade-in">
                            <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                                <h3 className="font-bold text-lg sm:text-xl text-megistic">Tasks</h3>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    {(activeUserPhase?.ChallengePhase?.bonus_reward || phase?.ChallengePhase?.bonus_reward) > 0 && (
                                        <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 sm:px-3 py-1 rounded-full border border-orange-100">
                                            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500 fill-orange-500" />
                                            <span className="text-xs sm:text-sm font-bold text-orange-700">
                                                +{activeUserPhase?.ChallengePhase?.bonus_reward || phase?.ChallengePhase?.bonus_reward} PTS
                                            </span>
                                        </div>
                                    )}
                                    <span className="text-xs sm:text-sm font-medium text-gray-500 bg-gray-100 px-2.5 sm:px-3 py-1 rounded-full">
                                        {tasksToRender.filter(t => t.is_completed).length}/{tasksToRender.length} Completed
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 sm:space-y-4">
                                {tasksToRender.map((task) => {
                                    // Determine Difficulty Icon and Style
                                    const difficulty = task.ChallengeTask?.difficulty_level?.toUpperCase();
                                    const difficultyColorClass = difficulty === 'HARD' ? 'bg-red-50 text-red-700 border-red-200' :
                                        difficulty === 'MEDIUM' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            'bg-green-50 text-green-700 border-green-200'; // Easy default
                                    const DifficultyIcon = difficulty === 'HARD' ? Zap :
                                        difficulty === 'MEDIUM' ? Shield :
                                            Star;

                                    return (
                                        <div
                                            key={task.id}
                                            className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6"
                                        >
                                            {/* Main Content */}
                                            <div className="flex-grow min-w-0 w-full">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                                    <h3 className="text-base sm:text-lg font-bold text-megistic truncate">{task.ChallengeTask?.title}</h3>
                                                    {/* Timer Display */}
                                                    {/* {timers[task.id] > 0 && (
                                                        <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-600 border border-orange-100">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {formatTime(timers[task.id])}
                                                        </span>
                                                    )} */}
                                                </div>
                                                <p className="text-gray-500 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 max-w-3xl">
                                                    {task.ChallengeTask?.description}
                                                </p>

                                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                                    {/* Mandatory Badge */}
                                                    {task.ChallengeTask.is_mandatory && (
                                                        <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-medium tracking-wide border bg-red-50 text-red-700 border-red-200">
                                                            <Flag className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                                                            Mandatory
                                                        </span>
                                                    )}

                                                    {/* Difficulty Badge */}
                                                    <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-medium tracking-wide border ${difficultyColorClass}`}>
                                                        <DifficultyIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                                                        {task.ChallengeTask.difficulty_level}
                                                    </span>

                                                    {/* Attempts Badge */}
                                                    <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-medium tracking-wide border bg-gray-50 text-gray-700 border-gray-200">
                                                        Attempts: {task.revive_attempt_at && timers[task.id] === 0 ? '0' : task.attempts}/{task?.ChallengeTask?.max_attempts}
                                                    </span>

                                                    {/* Qualify Badge */}
                                                    <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-medium tracking-wide border bg-indigo-50 text-indigo-700 border-indigo-200">
                                                        Qualify: {task?.ChallengeTask?.qualify_percentage}%
                                                    </span>

                                                    {/* Points Display */}
                                                    {task.ChallengeTask.reward_points > 0 && (
                                                        <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wide border bg-orange-50 text-orange-700 border-orange-200">
                                                            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-600 mr-0.5 sm:mr-1.5" />
                                                            {task.ChallengeTask.reward_points} Bonus Points
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right Side Actions */}
                                            <div className="flex flex-col gap-2 flex-shrink-0 w-full md:w-auto items-start md:items-end border-t md:border-t-0 border-gray-100 pt-4 md:pt-0 mt-2 md:mt-0">
                                                {!(!(timers[task.id] > 0) && (task.attempts == task?.ChallengeTask?.max_attempts && !task.revive_attempt_at)) && <button
                                                    onClick={() => handleTaskClick(task)}
                                                    disabled={timers[task.id] > 0 || (task.attempts == task?.ChallengeTask?.max_attempts && !task.revive_attempt_at)}
                                                    className={`h-9 sm:h-10 px-4 sm:px-6 rounded-lg font-bold text-xs sm:text-sm transition-transform active:scale-95 flex items-center gap-1.5 sm:gap-2 
                                                        ${timers[task.id] > 0 || (task.attempts == task?.ChallengeTask?.max_attempts && !task.revive_attempt_at)
                                                            ? 'bg-white border border-gray-200 text-gray-400 cursor-not-allowed shadow-none active:scale-100'
                                                            : 'bg-leafGreen text-white shadow-sm'
                                                        }`}
                                                >
                                                    {task.is_completed ? 'Reattempt' : 'Start Task'}
                                                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </button>}
                                                {timers[task.id] > 0 && !task.is_completed && (
                                                    <span className="text-xs text-orange-500 font-medium text-left md:text-right">
                                                        Retry in {formatTime(timers[task.id])}
                                                    </span>
                                                )}
                                                {timers[task.id] > 0 && task.is_completed && (
                                                    <span className="text-xs text-orange-500 bg-orange-50 border border-orange-200 px-2 py-1 rounded-full font-medium text-left md:text-right">
                                                        Next attempt in {formatTime(timers[task.id])}
                                                    </span>
                                                )}
                                                {!(timers[task.id] > 0) && (task.attempts == task?.ChallengeTask?.max_attempts && !task.revive_attempt_at) && (
                                                    <span className="text-xs text-red-500 bg-red-50 border border-red-200 px-2 py-1 rounded-full font-medium text-left md:text-right">
                                                        no attempt are availble
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {showResult && (
                <QuizResultAnimation
                    type={resultType}
                    onClose={handleCloseAnimation}
                    message={resultMessage}
                />
            )}

            <SupportModal
                isOpen={isSupportModalOpen}
                onClose={() => setSupportModalOpen(false)}
                defaultCategory={'Content'}
                relatedId={challengeDetails?.data?.Challenge?.id}
                relatedName={challengeDetails?.data?.Challenge?.title}
                defaultRelatedType={'challenge-quest'}
            />

            {/* Challenge Complete Popup */}
            {showChallengeCompletePopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-sm md:max-w-md p-6 sm:p-8 text-center transform transition-all animate-bounceIn">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-inner">
                            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 fill-current drop-shadow-sm" />
                        </div>
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 mb-2 tracking-tight">Challenge Completed!</h3>
                        <p className="text-slate-600 text-sm sm:text-base mb-4 sm:mb-6 font-medium">
                            Congratulations! You've successfully conquered the <span className="font-bold text-slate-900">{challengeDetails?.data?.Challenge?.title}</span>!
                            You've earned <span className="font-bold text-green-600">+{challengeDetails?.data?.Challenge?.reward_points} challenge points</span>!
                        </p>
                        <button
                            onClick={() => setShowChallengeCompletePopup(false)}
                            className="w-full py-2.5 sm:py-3 px-4 bg-forestGreen text-white font-bold rounded-lg transition-colors text-sm sm:text-base"
                        >
                            Outstanding!
                        </button>
                    </div>
                </div>
            )}

            {/* Phase Reward Popup */}
            {showPhaseRewardPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-sm md:max-w-md p-6 sm:p-8 text-center transform transition-all animate-bounceIn">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-inner">
                            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 fill-current drop-shadow-sm" />
                        </div>
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 mb-2 tracking-tight">Phase Complete!</h3>
                        {(phaseRewardData?.ChallengePhase?.bonus_reward || activeUserPhase?.ChallengePhase?.bonus_reward || 0) > 0 ? (
                            <p className="text-slate-600 text-sm sm:text-base mb-4 sm:mb-6 font-medium">
                                Congratulations! You've mastered this phase.
                                You've earned <span className="font-bold text-green-600">+{phaseRewardData?.ChallengePhase?.bonus_reward || activeUserPhase?.ChallengePhase?.bonus_reward} reward points</span>!
                            </p>
                        ) : (
                            <p className="text-slate-600 text-sm sm:text-base mb-4 sm:mb-6 font-medium">
                                Congratulations! You've mastered this phase.
                            </p>
                        )}
                        <button
                            onClick={() => setShowPhaseRewardPopup(false)}
                            className="w-full py-2.5 sm:py-3 px-4 bg-forestGreen text-white font-bold rounded-lg transition-colors text-sm sm:text-base"
                        >
                            Awesome!
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}