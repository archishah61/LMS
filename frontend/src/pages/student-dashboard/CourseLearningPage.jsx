import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown,
    ChevronUp,
    Lock,
    Play,
    FileQuestion,
    BookOpen,
    FileText,
    Folder,
    CheckCircle,
    Circle,
} from 'lucide-react';
import {
    useGetCourseFullDetailsQuery
} from '../../services/progressTracking/newProgressTrackingApi';
import { getStudentToken } from '../../services/CookieService';
import { slugify } from '../../utils/slugify';
import PrimaryLoader from '../../components/ui/PrimaryLoader';

const CourseLearningPage = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { courseSlug } = useParams();
    const { access_token } = getStudentToken();

    // IDs
    const courseId = state?.coursePublicHash;
    const courseIdIndx = state?.courseId; // numeric ID
    const userId = state?.userId;
    const courseTitle = state?.courseTitle;
    const user_hash = state?.user_hash;

    // State for toggling sessions and modules
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [activeModuleId, setActiveModuleId] = useState(null);

    // Fetch Full Course Data
    const { data: courseFullData, isLoading } = useGetCourseFullDetailsQuery({
        userId,
        courseId: courseIdIndx,
    }, { skip: !courseIdIndx || !userId });

    const sessions = courseFullData?.data?.course?.sessions || [];

    // Open first session and first module by default when data loads
    useEffect(() => {
        if (sessions.length > 0) {
            const firstSession = sessions[0];
            const firstSessionId = firstSession.sessionId;

            setActiveSessionId((prev) => {
                if (!prev) return firstSessionId;
                return prev;
            });

            if (firstSession.modules && firstSession.modules.length > 0) {
                const firstModuleId = firstSession.modules[0].moduleId;
                setActiveModuleId((prev) => {
                    if (!prev) return firstModuleId;
                    return prev;
                });
            }
        }
    }, [courseFullData]);

    const toggleSession = (sessionId) => {
        setActiveSessionId(prev => prev === sessionId ? null : sessionId);
    };

    const toggleModule = (moduleId) => {
        setActiveModuleId(prev => prev === moduleId ? null : moduleId);
    };

    if (!courseId || !userId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="text-center max-w-md w-full">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2 md:mb-3">Course Details Not Found</h2>
                    <p className="text-gray-500 mb-4 md:mb-6 text-sm md:text-base">Please access this page from your dashboard.</p>
                    <button
                        onClick={() => navigate('/student-dashboard')}
                        className="px-5 md:px-6 py-2 md:py-2.5 bg-primary text-white rounded-lg hover:bg-green-600 transition-colors text-sm md:text-base font-medium"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Stats
    const totalSessions = sessions.length;
    const totalModules = sessions.reduce((acc, session) => acc + (session.modules?.length || 0), 0);

    return (
        <div className="min-h-screen bg-white">
            <div className="container px-5 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-6 md:mb-8">
                    <h1 className="text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1">My Learning</h1>
                    <div className="flex flex-wrap items-center text-xs xs:text-sm text-gray-500 gap-2">
                        <span>{totalSessions} sessions</span>
                        <span className="hidden xs:inline">•</span>
                        <span>{totalModules} modules</span>
                    </div>
                </div>

                {/* Sessions Container */}
                <div className="border border-gray-200 rounded-xl md:rounded-2xl overflow-hidden bg-white shadow-sm">
                    {isLoading && <PrimaryLoader />}

                    {!isLoading && sessions.map((session, sessionIndex) => {
                        const isOpen = activeSessionId === session.sessionId;
                        const isAccessible = session.isAccessible === 1; // Assuming 1 is true
                        const sessionModules = session.modules || [];

                        return (
                            <div key={session.sessionId} className="border-b border-gray-100 last:border-0">
                                {/* Session Header */}
                                <button
                                    onClick={() => toggleSession(session.sessionId)}
                                    // disabled={!isAccessible} // user didn't explicitly say to disable clicking, but maybe? keeping it clickable to see content but locked inside usually
                                    className={`w-full flex items-center justify-between px-5 md:px-8 py-4 transition-colors ${isOpen ? 'bg-emerald-50/50' : 'bg-white hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {isOpen ? (
                                            <ChevronDown className="w-4 h-4 xs:w-4 xs:h-4 md:w-5 md:h-5 text-gray-500" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 xs:w-4 xs:h-4 md:w-5 md:h-5 text-gray-500 -rotate-90" />
                                        )}
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900 text-left text-xs xs:text-sm sm:text-base md:text-lg">
                                                Session {sessionIndex + 1}: {session.title}
                                            </span>
                                            {!isAccessible && (
                                                <Lock className="w-3.5 h-3.5 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs xs:text-sm text-gray-500 font-medium whitespace-nowrap ml-2 md:ml-4">
                                        {sessionModules.length} modules
                                    </div>
                                </button>

                                {/* Modules List */}
                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial="collapsed"
                                            animate="open"
                                            exit="collapsed"
                                            variants={{
                                                open: { opacity: 1, height: "auto" },
                                                collapsed: { opacity: 0, height: 0 }
                                            }}
                                            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                            className="overflow-hidden"
                                        >
                                            <div className="bg-white">
                                                {sessionModules.length === 0 ? (
                                                    <div className="px-4 xs:px-6 sm:px-8 md:px-10 py-4 text-xs xs:text-sm text-gray-400 italic">
                                                        No modules available yet.
                                                    </div>
                                                ) : (
                                                    sessionModules.map((module, moduleIndex) => (
                                                        <ModuleSection
                                                            key={module.moduleId}
                                                            module={module}
                                                            moduleNumber={moduleIndex + 1}
                                                            isActive={activeModuleId === module.moduleId}
                                                            onToggle={() => toggleModule(module.moduleId)}
                                                            isSessionAccessible={isAccessible}
                                                            userId={userId}
                                                            courseIdIndx={courseIdIndx}
                                                            courseTitle={courseTitle}
                                                            user_hash={user_hash}
                                                            session={session}
                                                            access_token={access_token}
                                                        />
                                                    ))
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}

                    {(!sessions || sessions.length === 0) && !isLoading && (
                        <div className="text-center py-10 md:py-12 lg:py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-100 mb-4 md:mb-6">
                                <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-gray-300" />
                            </div>
                            <h3 className="text-lg md:text-xl font-medium text-gray-900 mb-2">No content available</h3>
                            <p className="text-gray-500 text-sm md:text-base">This course doesn't have any published content yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Module Section Component ---
const ModuleSection = ({ module, moduleNumber, isActive, onToggle, isSessionAccessible, userId, courseIdIndx, courseTitle, user_hash, session, access_token }) => {
    // Data passed directly via props
    const topics = module.topics || [];
    const quizzes = module.quizzes || [];
    const assignments = module.assignments || [];
    const isModuleAccessible = module.isAccessible === 1;

    const isModuleLocked = !isSessionAccessible || !isModuleAccessible;

    return (
        <div className="border-b border-gray-100 last:border-0">
            {/* Module Header */}
            <button
                onClick={onToggle}
                className={`w-full flex items-center justify-between px-4 xs:px-5 sm:px-6 md:px-8 py-3 transition-colors ${isActive ? 'bg-gray-50/50' : 'bg-white hover:bg-gray-50'} pl-12`}
            >
                <div className="flex items-center gap-2 md:gap-3">
                    <Folder className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-medium text-gray-800 text-xs xs:text-sm md:text-base text-left">
                        Module {moduleNumber} - {module.title}
                    </span>
                    {isModuleLocked && <Lock className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-gray-400 flex-shrink-0" />}
                </div>
                <div>
                    {isActive ? (
                        <ChevronUp className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-gray-400" />
                    )}
                </div>
            </button>

            {/* Topics/Activities List */}
            <AnimatePresence initial={false}>
                {isActive && (
                    <motion.div
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { opacity: 1, height: "auto" },
                            collapsed: { opacity: 0, height: 0 }
                        }}
                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white pb-2">
                            {topics.length === 0 && quizzes.length === 0 && assignments.length === 0 ? (
                                <div className="pl-20 xs:pl-24 sm:pl-28 pr-4 xs:pr-6 py-2 text-xs text-gray-400 italic">
                                    No topics found.
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {topics.map(topic => (
                                        <React.Fragment key={topic.topicId}>
                                            <TopicItem
                                                topic={topic}
                                                isModuleLocked={isModuleLocked}
                                                courseTitle={courseTitle}
                                                user_hash={user_hash}
                                                session={session}
                                                module={module}
                                            />
                                            {/* Render Inner Quizzes for Topic */}
                                            {topic.topic_quiz?.map(quiz => (
                                                <ActivityItem
                                                    key={`topic-quiz-${quiz.id}`}
                                                    activity={{
                                                        ...quiz,
                                                        isAccessible: topic.isAccessible === 1 // Inherit access from topic
                                                    }}
                                                    type="quiz"
                                                    isModuleLocked={isModuleLocked || topic.isAccessible !== 1}
                                                    isInner={true}
                                                />
                                            ))}
                                            {/* Render Inner Assignments for Topic */}
                                            {topic.topic_assignment?.map(assign => (
                                                <ActivityItem
                                                    key={`topic-assign-${assign.id}`}
                                                    activity={{
                                                        ...assign,
                                                        isAccessible: topic.isAccessible === 1 // Inherit access from topic
                                                    }}
                                                    type="assignment"
                                                    isModuleLocked={isModuleLocked || topic.isAccessible !== 1}
                                                    isInner={true}
                                                />
                                            ))}
                                        </React.Fragment>
                                    ))}
                                    {quizzes.map(quiz => (
                                        <ActivityItem
                                            key={`quiz-${quiz.id}`}
                                            activity={quiz}
                                            type="quiz"
                                            isModuleLocked={isModuleLocked}
                                        />
                                    ))}
                                    {assignments.map(assignment => (
                                        <ActivityItem
                                            key={`assign-${assignment.id}`}
                                            activity={assignment}
                                            type="assignment"
                                            isModuleLocked={isModuleLocked}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Topic Item ---
const TopicItem = ({ topic, isModuleLocked, courseTitle, user_hash, session, module }) => {
    const navigate = useNavigate();
    const isTopicAccessible = topic.isAccessible === 1; // 1 is accessible
    const isLocked = isModuleLocked || !isTopicAccessible;
    // console.log("states", user_hash, topic, session, module);

    const handleTopicClick = () => {
        if (isLocked) return;

        // Map IDs to match the structure expected by CourseContentDup (which uses .id)
        const sessionMapped = { ...session, id: session.sessionId };
        const moduleMapped = { ...module, id: module.moduleId };
        const topicMapped = { ...topic, id: topic.topicId };

        navigate(`/course-content/${slugify(courseTitle)}`, {
            state: {
                courseID: user_hash,
                topicState: topicMapped,
                sessionState: sessionMapped,
                moduleState: moduleMapped
            }
        });
    };

    return (
        <div
            className={`flex items-center justify-between py-2.5 px-4 xs:px-5 sm:px-6 md:px-8 pl-12 transition-colors ${isLocked ? 'opacity-60 cursor-default' : 'hover:bg-gray-50 cursor-default'}`}
        >
            <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
                {isLocked ? (
                    <Lock className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                ) : (
                    <BookOpen className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                )}
                <span className={`text-xs xs:text-sm truncate ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
                    {topic.title}
                </span>
            </div>

            <div className="flex items-center gap-2 xs:gap-3 md:gap-4 flex-shrink-0">
                {topic.duration_minutes > 0 && (
                    <span className="text-[10px] xs:text-xs text-gray-400 tabular-nums whitespace-nowrap">
                        {topic.duration_minutes} min
                    </span>
                )}

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleTopicClick();
                    }}
                    disabled={isLocked}
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 xs:px-3 xs:py-1.5 rounded-md transition-all border w-[32px] xs:w-[36px] sm:w-[130px] flex-shrink-0 ${isLocked
                        ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-pointer hover:bg-emerald-100 hover:border-emerald-300 shadow-sm'
                        }`}
                    title={isLocked ? "Locked" : "Start Learning"}
                >
                    {isLocked ? (
                        <Lock className="w-3 h-3 xs:w-3.5 xs:h-3.5" />
                    ) : (
                        <Play className="w-3 h-3 xs:w-3.5 xs:h-3.5 fill-current" />
                    )}
                    <span className="text-[10px] xs:text-xs font-medium hidden sm:inline">
                        {isLocked ? "Locked" : "Start Learning"}
                    </span>
                </button>
            </div>
        </div>
    );
};

// --- Activity Item (Quiz/Assignment) ---
const ActivityItem = ({ activity, type, isModuleLocked, isInner = false }) => {
    // Check isAccessible flag strictly
    const isAccessible = activity.isAccessible === 1 || activity.isAccessible === true;
    const isCompleted = activity.isCompleted === 1 || activity.isCompleted === true || activity.isComplete === 1 || activity.isComplete === true;

    // Lock if module is locked OR activity itself is not accessible
    const isLocked = isModuleLocked || !isAccessible;

    // Indentation padding
    const paddingLeft = 'pl-12';

    return (
        <div className={`flex items-center justify-between py-2.5 px-4 xs:px-5 sm:px-6 md:px-8 ${paddingLeft} transition-colors ${isLocked ? 'opacity-60 cursor-default' : 'hover:bg-gray-50'}`}>
            <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
                {type === 'quiz' ? (
                    <FileQuestion className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-purple-500 flex-shrink-0" />
                ) : (
                    <FileText className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-orange-500 flex-shrink-0" />
                )}
                <span className={`text-xs xs:text-sm truncate ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
                    {activity.title} <span className="text-[10px] xs:text-xs text-gray-400 ml-1">({type})</span>
                </span>
                {isLocked && <Lock className="w-2.5 h-2.5 text-gray-300 ml-2" />}
            </div>
            {/* <div className="flex-shrink-0"> */}
            {/* {isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                    <Circle className="w-4 h-4 text-gray-300" />
                )} */}
            {/* </div> */}
        </div>
    );
};

export default CourseLearningPage;
