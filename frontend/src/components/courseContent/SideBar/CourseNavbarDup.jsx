"use client"
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { FaChevronDown, FaSignOutAlt, FaBars, FaTimes, FaCode, FaRegFolderOpen, FaRegClock, FaList, FaLock, FaCheckCircle, FaRegCircle, FaPlayCircle, FaQuestionCircle, FaFileAlt, FaEllipsisV, FaInfoCircle } from "react-icons/fa"

export default function CourseNavbar({
    courseTitle,
    sessions,
    currentSession,
    setCurrentSession,
    modules,
    isModulesLoading,
    currentModule,
    setCurrentModule,
    topics,
    isTopicsLoading,
    currentTopic,
    setCurrentTopic,
    quizzes,
    isQuizzesLoading,
    assignments,
    isAssignmentsLoading,
    setShowEndSessionModal,
    setIsFilesPanelOpen,
    setIsRightSidebarOpen,
    isRightSidebarOpen,
    selectedQuizId,
    setSelectedQuizId,
    selectedAssignmentId,
    setSelectedAssignmentId,
    loadedData,
    completionData = [],
    languages,
    extraDurationTimer,
    materialsCount = 0,
    materialsScopeKey = null
}) {
    const [openDropdown, setOpenDropdown] = useState(null);
    const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(false);
    const [expandedSessions, setExpandedSessions] = useState(new Set());
    const [expandedModules, setExpandedModules] = useState(new Set());
    const [expandedTopics, setExpandedTopics] = useState(new Set());
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [isTopicInfoOpen, setIsTopicInfoOpen] = useState(false);
    const sidebarRef = useRef(null);
    const mobileDropdownRef = useRef(null);

    const normalizeId = (id) => (id === null || id === undefined ? null : String(id));

    const getItemTitle = (item) => {
        if (!item) return '';
        return item.title || item.name || item.quizTitle || item.assignmentTitle || item.quiz_name || item.assignment_name || '';
    };

    // Completion data lookup map
    const quizCompletionMap = useMemo(() => {
        if (!Array.isArray(completionData)) return {};
        const map = {};
        for (const c of completionData) {
            if (!c?.quizId) continue;
            const ts = new Date(c.updatedAt || c.lastAttemptTime || c.createdAt || 0).getTime();
            if (!map[c.quizId] || ts > map[c.quizId].ts) {
                map[c.quizId] = { rec: c, ts };
            }
        }
        Object.keys(map).forEach(k => map[k] = map[k].rec);
        return map;
    }, [completionData]);

    const quizzesWithStatus = useMemo(() => {
        if (!Array.isArray(quizzes)) return [];
        return quizzes.map(q => {
            const comp = quizCompletionMap[q.id];
            return {
                ...q,
                isCompleted: q.isCompleted,
                lastScore: comp ? (comp.obtainedMarks ?? comp.score ?? null) : null,
                totalMarks: comp ? (comp.totalMarks ?? null) : null,
                attemptsUsed: comp ? (comp.triedAttempts ?? 1) : 0,
            };
        });
    }, [quizzes, quizCompletionMap]);

    const quizLookup = useMemo(() => {
        const map = {};

        if (Array.isArray(quizzes)) {
            quizzes.forEach((quiz) => {
                const key = normalizeId(quiz?.id ?? quiz?.quizId);
                if (key) map[key] = quiz;
            });
        }

        if (Array.isArray(topics)) {
            topics.forEach((topic) => {
                if (!Array.isArray(topic?.quizzes)) return;
                topic.quizzes.forEach((quiz) => {
                    const key = normalizeId(quiz?.id ?? quiz?.quizId);
                    if (key && !map[key]) map[key] = quiz;
                });
            });
        }

        if (selectedQuiz) {
            const key = normalizeId(selectedQuiz?.id ?? selectedQuiz?.quizId);
            if (key && !map[key]) map[key] = selectedQuiz;
        }

        return map;
    }, [quizzes, topics, selectedQuiz]);

    const assignmentLookup = useMemo(() => {
        const map = {};

        if (Array.isArray(assignments)) {
            assignments.forEach((assignment) => {
                const key = normalizeId(assignment?.id);
                if (key) map[key] = assignment;
            });
        }

        if (Array.isArray(topics)) {
            topics.forEach((topic) => {
                if (!Array.isArray(topic?.assignments)) return;
                topic.assignments.forEach((assignment) => {
                    const key = normalizeId(assignment?.id);
                    if (key && !map[key]) map[key] = assignment;
                });
            });
        }

        if (selectedAssignment) {
            const key = normalizeId(selectedAssignment?.id);
            if (key && !map[key]) map[key] = selectedAssignment;
        }

        return map;
    }, [assignments, topics, selectedAssignment]);

    const activeSelectedQuiz = useMemo(() => {
        const selectedKey = normalizeId(selectedQuizId);
        if (selectedKey) {
            return quizLookup[selectedKey] || selectedQuiz || null;
        }
        return selectedQuiz || null;
    }, [selectedQuizId, quizLookup, selectedQuiz]);

    const activeSelectedAssignment = useMemo(() => {
        const selectedKey = normalizeId(selectedAssignmentId);
        if (selectedKey) {
            return assignmentLookup[selectedKey] || selectedAssignment || null;
        }
        return selectedAssignment || null;
    }, [selectedAssignmentId, assignmentLookup, selectedAssignment]);

    const currentNavText = useMemo(() => {
        const quizTitle = getItemTitle(activeSelectedQuiz);
        const assignmentTitle = getItemTitle(activeSelectedAssignment);
        if (quizTitle) return `Quiz: ${quizTitle}`;
        if (assignmentTitle) return `Assignment: ${assignmentTitle}`;
        if (currentTopic) return currentTopic.title;
        if (currentModule) return currentModule.title;
        if (currentSession) return currentSession.title;
        return 'Select Session';
    }, [activeSelectedQuiz, activeSelectedAssignment, currentTopic, currentModule, currentSession]);

    const topicDescription = useMemo(() => {
        const rawDescription = currentTopic?.description ?? '';
        if (!rawDescription) return '';
        return String(rawDescription)
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }, [currentTopic]);

    const assignmentDescription = useMemo(() => {
        const rawDescription = activeSelectedAssignment?.description ?? '';
        if (!rawDescription) return '';
        return String(rawDescription)
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }, [activeSelectedAssignment]);

    // console.log("Current Nav Text:", currentNavText, assignmentDescription);

    const topicContentType = useMemo(() => {
        const rawType = currentTopic?.content_type ?? '';
        return String(rawType).toLowerCase();
    }, [currentTopic]);

    const shouldShowTopicInfo = useMemo(() => {
        if (!currentTopic || !topicDescription) return false;
        if (activeSelectedQuiz || activeSelectedAssignment) return false;
        return ['general', 'accordion', 'accordian', 'slide'].includes(topicContentType);
    }, [currentTopic, topicDescription, activeSelectedQuiz, activeSelectedAssignment, topicContentType]);

    const shouldShowAssignmentInfo = useMemo(() => {
        if (!activeSelectedAssignment || !assignmentDescription) return false;
        return true;
    }, [activeSelectedAssignment, assignmentDescription]);

    // console.log("Should show topic info:", shouldShowTopicInfo, { currentTopic, topicDescription, activeSelectedQuiz, activeSelectedAssignment, topicContentType });
    // console.log("Should show assignment info:", shouldShowAssignmentInfo, { activeSelectedAssignment, assignmentDescription });

    const [seenMaterialsScopeKeys, setSeenMaterialsScopeKeys] = useState(new Set());

    const currentMaterialsScopeKey = useMemo(() => {
        return normalizeId(materialsScopeKey) || normalizeId(currentTopic?.id);
    }, [materialsScopeKey, currentTopic?.id]);

    const hasTopicMaterials = useMemo(() => {
        if (selectedQuizId || selectedAssignmentId) return false;
        return Number(materialsCount) > 0;
    }, [materialsCount, selectedQuizId, selectedAssignmentId]);

    const shouldGlowMaterialsButton = useMemo(() => {
        if (!currentMaterialsScopeKey || !hasTopicMaterials) return false;
        return !seenMaterialsScopeKeys.has(currentMaterialsScopeKey);
    }, [currentMaterialsScopeKey, hasTopicMaterials, seenMaterialsScopeKeys]);

    const markCurrentTopicMaterialsSeen = useCallback(() => {
        if (!currentMaterialsScopeKey) return;
        setSeenMaterialsScopeKeys((prev) => {
            if (prev.has(currentMaterialsScopeKey)) return prev;
            const next = new Set(prev);
            next.add(currentMaterialsScopeKey);
            return next;
        });
    }, [currentMaterialsScopeKey]);

    const handleMaterialsButtonClick = useCallback(() => {
        markCurrentTopicMaterialsSeen();
        setIsFilesPanelOpen(prev => !prev);
    }, [markCurrentTopicMaterialsSeen, setIsFilesPanelOpen]);

    const formatExtraSeconds = (seconds = 0) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    // Desktop heading max width (completely unchanged)
    const [headingMaxWidth, setHeadingMaxWidth] = useState('400px');
    useEffect(() => {
        const updateHeadingWidth = () => {
            const width = window.innerWidth;
            if (width >= 1280) setHeadingMaxWidth('600px');
            else if (width >= 1024) setHeadingMaxWidth('500px');
            else if (width >= 768) setHeadingMaxWidth('350px');
            else setHeadingMaxWidth('200px');
        };
        updateHeadingWidth();
        window.addEventListener('resize', updateHeadingWidth);
        return () => window.removeEventListener('resize', updateHeadingWidth);
    }, []);

    // Auto-expand current path
    useEffect(() => { if (currentSession?.id) setExpandedSessions(new Set([currentSession.id])); }, [currentSession]);
    useEffect(() => { if (currentModule?.id) setExpandedModules(new Set([currentModule.id])); }, [currentModule]);
    useEffect(() => { if (currentTopic?.id) setExpandedTopics(prev => new Set([...prev, currentTopic.id])); }, [currentTopic]);

    // All your existing handlers and effects (unchanged) ↓
    const handleSessionClick = (session, closeSidebar = true) => {
        if (session.isAccessible) {
            setCurrentSession(session);
            if (closeSidebar) setIsNavSidebarOpen(false);
        }
    };
    const handleModuleClick = (module, closeSidebar = true) => {
        if (module.isAccessible) {
            setCurrentModule(module);
            if (closeSidebar) setIsNavSidebarOpen(false);
        }
    };
    const handleTopicClick = (topic, closeSidebar = true) => {
        if (topic.isAccessible) {
            setCurrentTopic(topic);
            if (openDropdown === "mobile") setOpenDropdown(null);
            if (closeSidebar) setIsNavSidebarOpen(false);
            setSelectedQuizId(null);
            setSelectedAssignmentId(null);
            setSelectedQuiz(null);
            setSelectedAssignment(null);
        }
    };
    const handleQuizClick = (quiz) => {
        if (quiz.isAccessible || quiz.quizId || quiz.id) {
            setSelectedAssignment(null);
            setSelectedAssignmentId(null);
            if (openDropdown === "mobile") setOpenDropdown(null);
            const quizId = quiz.quizId || quiz.id;
            if (quizId) {
                setSelectedQuizId(quizId);
                setSelectedQuiz(quiz);
                const topicWithQuiz = topics?.find(topic =>
                    Array.isArray(topic.quizzes) && topic.quizzes.some(q => normalizeId(q.id || q.quizId) === normalizeId(quizId))
                );
                setTimeout(() => setCurrentTopic(topicWithQuiz || null), 0);
            }
        }
    };
    const handleAssignmentClick = (assignment) => {
        if (assignment.isAccessible) {
            setSelectedQuizId(null);
            setSelectedAssignmentId(assignment.id);
            if (openDropdown === "mobile") setOpenDropdown(null);
            setSelectedAssignment(assignment);
            setSelectedQuiz(null);
            const topicWithAssignment = topics?.find(topic =>
                Array.isArray(topic.assignments) && topic.assignments.some(a => normalizeId(a.id) === normalizeId(assignment.id))
            );
            setCurrentTopic(topicWithAssignment || null);
        }
    };
    const toggleDropdown = dropdown => setOpenDropdown(openDropdown === dropdown ? null : dropdown);
    const toggleExpand = (type, id) => {
        switch (type) {
            case 'session': setExpandedSessions(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }); break;
            case 'module': setExpandedModules(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }); break;
            case 'topic': setExpandedTopics(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }); break;
        }
    };
    const handleKeyDown = (e, action) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); action(); } };
    // Reset module when session changes
    useEffect(() => {
        if (currentSession !== null && sessions && sessions.length > 0) {
            const sessionExists = sessions?.some(s => s.id === currentSession.id);
            if (!sessionExists) {
                setCurrentModule(null);
            }
        }
    }, [currentSession, sessions, setCurrentModule])
    // Reset topic only if module actually changes

    useEffect(() => {
        if (selectedQuizId && quizzes) {
            const selectedKey = normalizeId(selectedQuizId);
            const quiz = quizLookup[selectedKey] || null;
            if (quiz) {
                setSelectedQuiz(quiz);
            }
        } else {
            setSelectedQuiz(null);
        }
    }, [selectedQuizId, quizzes, quizLookup]);
    // Sync selectedAssignment when selectedAssignmentId changes
    useEffect(() => {
        if (selectedAssignmentId && assignments) {
            const selectedKey = normalizeId(selectedAssignmentId);
            const assignment = assignmentLookup[selectedKey] || null;
            if (assignment) {
                setSelectedAssignment(assignment);
            }
        } else {
            setSelectedAssignment(null);
        }
    }, [selectedAssignmentId, assignments, assignmentLookup]);
    // Persist selected states after full screen changes
    useEffect(() => {
        const revalidateSelections = () => {
            if (!loadedData) return;
            if (isTopicsLoading) return; // Prevent selection while loading new topics

            // Don't reset if we already have valid selections
            if (currentModule && currentTopic) {
                const moduleExists = modules?.some(m => m.id === currentModule.id);
                const topicExists = topics?.some(t => t.id === currentTopic.id);
                // Only reset if the current selections are invalid
                if (!moduleExists && modules?.length > 0) {
                    setCurrentModule(modules.find(m => m.isAccessible) || modules[0]);
                }
                if (!topicExists && topics?.length > 0) {
                    setCurrentTopic(topics.find(t => t.isAccessible) || topics[0]);
                    setSelectedQuizId(null); // Reset quiz selection
                    setSelectedAssignmentId(null); // Reset assignment selection
                }
            } else {
                // Set initial selections only if we have none
                if (!currentModule && modules?.length > 0) {
                    setCurrentModule(modules.find(m => m.isAccessible) || modules[0]);
                }
                if (!currentTopic && topics?.length > 0 && currentModule) {
                    setCurrentTopic(topics.find(t => t.isAccessible) || topics[0]);
                }
            }
        };
        // Only run if we have data to work with
        if (modules?.length > 0 || topics?.length > 0) {
            revalidateSelections();
        }
    }, [currentModule, currentTopic, modules, topics, setCurrentModule, setCurrentTopic, setSelectedAssignmentId, setSelectedQuizId]);
    // Handle dropdown outside clicks
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (openDropdown && mobileDropdownRef.current && !mobileDropdownRef.current.contains(e.target)) {
                setOpenDropdown(null);
            }
        }
        if (openDropdown) {
            document.addEventListener("click", handleClickOutside)
            return () => document.removeEventListener("click", handleClickOutside)
        }
    }, [openDropdown])
    // Handle nav sidebar outside clicks (desktop only)
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                setIsNavSidebarOpen(false);
            }
        };
        if (isNavSidebarOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isNavSidebarOpen]);
    // Handle scroll lock for all sidebar/dropdown scenarios
    useEffect(() => {
        const shouldLockScroll = isRightSidebarOpen || isNavSidebarOpen || openDropdown === "mobile" || isTopicInfoOpen;
        if (shouldLockScroll) {
            document.body.style.overflow = "hidden";
            // Also add padding to prevent layout shift when scrollbar disappears
            document.body.style.paddingRight = "0px";
        } else {
            document.body.style.overflow = "auto";
            document.body.style.paddingRight = "0px";
        }
        return () => {
            document.body.style.overflow = "auto";
            document.body.style.paddingRight = "0px";
        };
    }, [isRightSidebarOpen, isNavSidebarOpen, openDropdown, isTopicInfoOpen, shouldShowAssignmentInfo]);

    useEffect(() => {
        if (!shouldShowTopicInfo) {
            setIsTopicInfoOpen(false);
        }
    }, [shouldShowTopicInfo]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') setIsTopicInfoOpen(false);
        };

        if (isTopicInfoOpen) {
            document.addEventListener('keydown', handleEsc);
            return () => document.removeEventListener('keydown', handleEsc);
        }
    }, [isTopicInfoOpen]);

    return (
        <>
            <div id="course-navbar" className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200/80 shadow-sm">
                <div className="relative flex items-center px-4 sm:px-6 py-2.5 sm:py-3">

                    {/* ==================== DESKTOP LEFT (100% UNCHANGED) ==================== */}
                    <div className="hidden md:flex items-center flex-1 min-w-0">
                        <img src="/assets/favIcon.png" alt="Logo" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 object-contain flex-shrink-0" />
                        <div className="relative flex items-center gap-2 min-w-0">
                            <div
                                className="font-medium text-gray-900 truncate text-sm sm:text-base leading-tight"
                                style={{ maxWidth: headingMaxWidth }}
                                title={currentNavText}
                            >
                                {currentNavText}
                            </div>
                            {(shouldShowTopicInfo || shouldShowAssignmentInfo) && (
                                <>
                                    <button
                                        type="button"
                                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                        onClick={() => setIsTopicInfoOpen(prev => !prev)}
                                        aria-label="Show info"
                                        title="Show info"
                                    >
                                        <FaInfoCircle className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* ==================== MOBILE + TABLET CENTER TITLE (Fully Dynamic) ==================== */}
                    <div className="flex-1 min-w-0 md:hidden flex items-center">
                        <div className="relative flex items-center gap-2 min-w-0 w-full max-w-[calc(140vw-110px)]">
                            <img src="/assets/favIcon.png" alt="Logo" className="w-5 h-5 flex-shrink-0" />
                            <h1
                                className="font-medium text-gray-900 text-[13px] xs:text-sm sm:text-base leading-tight truncate"
                                style={{ maxWidth: 'calc(100vw - 130px)' }}
                                title={currentNavText}
                            >
                                {currentNavText}
                            </h1>
                            {(shouldShowTopicInfo || shouldShowAssignmentInfo) && (
                                <>
                                    <button
                                        type="button"
                                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                        onClick={() => setIsTopicInfoOpen(prev => !prev)}
                                        aria-label="Show info"
                                        title="Show info"
                                    >
                                        <FaInfoCircle className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* ==================== DESKTOP RIGHT ==================== */}
                    <div className="hidden md:flex items-center gap-2 ml-auto shrink-0">
                        {extraDurationTimer?.active && (
                            <div className="px-2.5 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold whitespace-nowrap">
                                Extra Time: {formatExtraSeconds(extraDurationTimer.remainingSeconds || 0)}
                            </div>
                        )}
                        {!selectedQuizId && !selectedAssignmentId && (
                            <button
                                onClick={handleMaterialsButtonClick}
                                className={`flex items-center gap-2 px-2.5 lg:px-3 py-2 text-sm font-medium bg-white border rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap ${shouldGlowMaterialsButton
                                    ? "text-primary border-primary/30 bg-primary/30 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_0_0_3px_rgba(16,185,129,0.10)]"
                                    : "text-gray-600 border-gray-200"
                                    }`}
                                title="Topic Materials"
                            >
                                <FaRegFolderOpen className={`w-4 h-4 ${shouldGlowMaterialsButton ? "text-primary" : ""}`} />
                                <span className="hidden md:inline">Material</span>
                                {shouldGlowMaterialsButton && (
                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/30 animate-pulse" aria-hidden="true" />
                                )}
                            </button>
                        )}
                        <button onClick={() => { setIsNavSidebarOpen(true); setIsRightSidebarOpen(false); setIsFilesPanelOpen(false); }} className="flex items-center gap-2 px-2.5 lg:px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap" title="Jump to">
                            <FaList className="w-4 h-4" />
                            <span className="hidden md:inline">Jump to</span>
                        </button>
                        <button onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)} className="p-2 text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" title={isRightSidebarOpen ? "Time & Progress" : "Time & Progress"}>
                            <FaRegClock className="w-4 h-4" />
                        </button>
                        {languages?.length > 0 && (
                            <button onClick={() => { localStorage.setItem("selectedLanguages", JSON.stringify(languages)); window.open("/virtual-lab", "_blank"); }} className="flex items-center gap-2 px-3 lg:px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200 whitespace-nowrap">
                                <span className="hidden md:inline">Try it yourself</span>
                                <span className="inline md:hidden">Try</span>
                                <FaCode className="w-3 h-4" />
                            </button>
                        )}
                        <button onClick={() => setShowEndSessionModal(true)} className="flex items-center justify-center p-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors" title="End Session">
                            <FaSignOutAlt className="w-4 h-4" />
                        </button>
                    </div>

                    {/* ==================== MOBILE 3-DOT MENU (Ultra Responsive) ==================== */}
                    <div className="flex items-center gap-1 md:hidden relative" ref={mobileDropdownRef}>
                        <button
                            onClick={() => setOpenDropdown(openDropdown === "mobile" ? null : "mobile")}
                            className="p-2 text-gray-500 bg-white hover:bg-gray-50 rounded-md transition-colors"
                        >
                            <FaEllipsisV className="w-4 h-4" />
                        </button>

                        {openDropdown === "mobile" && (
                            <div className={`
        absolute top-full right-0 mt-2 
        w-[280px] max-w-[calc(100vw-24px)] 
        bg-white rounded-2xl shadow-2xl border border-gray-100 
        pt-2 pb-2 z-[1002] 
        animate-in fade-in zoom-in-95 duration-200 
        origin-top-right overflow-hidden
        
        /* Tablet optimization */
        md:w-[320px] md:max-w-[calc(100vw-32px)]
        
        /* Mobile landscape optimization */
        landscape:max-h-[80vh] landscape:overflow-y-auto
        
        /* Small mobile devices */
        max-sm:w-[260px] max-sm:right-2
    `}>
                                {languages?.length > 0 && (
                                    <button
                                        onClick={() => {
                                            localStorage.setItem("selectedLanguages", JSON.stringify(languages));
                                            window.open("/virtual-lab", "_blank");
                                            setOpenDropdown(null);
                                        }}
                                        className="
                    w-full flex items-center gap-3 px-4 py-[14px] 
                    text-sm font-medium text-gray-700 
                    hover:bg-gray-50 
                    text-left
                    
                    /* Better touch target for mobile */
                    md:py-4
                "
                                    >
                                        <div className="
                    w-8 h-8 rounded-xl bg-blue-50 
                    flex items-center justify-center text-blue-600 
                    flex-shrink-0
                    
                    /* Slightly larger icons on tablet */
                    md:w-9 md:h-9
                ">
                                            <FaCode className="w-4 h-4 md:w-5 md:h-5" />
                                        </div>
                                        <span className="flex-1">Try it yourself</span>
                                    </button>
                                )}

                                {!selectedQuizId && !selectedAssignmentId && (
                                    <button
                                        onClick={() => {
                                            handleMaterialsButtonClick();
                                            setOpenDropdown(null);
                                        }}
                                        className="
                    w-full flex items-center gap-3 px-4 py-[14px] 
                    text-sm font-medium text-gray-700 
                    hover:bg-gray-50 
                    text-left
                    
                    /* Better touch target for mobile */
                    md:py-4
                    border border-transparent
                    rounded-xl
                    transition-colors
                    duration-200
                    shadow-none
                "
                                        style={shouldGlowMaterialsButton ? {
                                            borderColor: 'rgb(110 231 183)',
                                            backgroundColor: 'rgba(236, 253, 245, 0.75)',
                                            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06), 0 0 0 2px rgba(16, 185, 129, 0.10)',
                                        } : undefined}
                                    >
                                        <div className="
                    w-8 h-8 rounded-xl bg-emerald-50 
                    flex items-center justify-center text-emerald-600 
                    flex-shrink-0
                    
                    /* Slightly larger icons on tablet */
                    md:w-9 md:h-9
                ">
                                            <FaRegFolderOpen className="w-4 h-4 md:w-5 md:h-5" />
                                        </div>
                                        <span className="flex-1">Topic Materials</span>
                                        {shouldGlowMaterialsButton && (
                                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                                        )}
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        setIsNavSidebarOpen(true);
                                        setIsRightSidebarOpen(false);
                                        setIsFilesPanelOpen(false);
                                        setOpenDropdown(null);
                                    }}
                                    className="
                w-full flex items-center gap-3 px-4 py-[14px] 
                text-sm font-medium text-gray-700 
                hover:bg-gray-50 
                text-left
                
                /* Better touch target for mobile */
                md:py-4
            "
                                >
                                    <div className="
                w-8 h-8 rounded-xl bg-indigo-50 
                flex items-center justify-center text-indigo-600 
                flex-shrink-0
                
                /* Slightly larger icons on tablet */
                md:w-9 md:h-9
            ">
                                        <FaList className="w-4 h-4 md:w-5 md:h-5" />
                                    </div>
                                    <span className="flex-1">Jump to</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setIsRightSidebarOpen(!isRightSidebarOpen);
                                        setOpenDropdown(null);
                                    }}
                                    className="
                w-full flex items-center gap-3 px-4 py-[14px] 
                text-sm font-medium text-gray-700 
                hover:bg-gray-50 
                text-left
                
                /* Better touch target for mobile */
                md:py-4
            "
                                >
                                    <div className="
                w-8 h-8 rounded-xl bg-orange-50 
                flex items-center justify-center text-orange-600 
                flex-shrink-0
                
                /* Slightly larger icons on tablet */
                md:w-9 md:h-9
            ">
                                        <FaRegClock className="w-4 h-4 md:w-5 md:h-5" />
                                    </div>
                                    <span className="flex-1">Time & Progress</span>
                                </button>

                                <div className="h-px bg-gray-100 my-1 mx-4" />

                                <button
                                    onClick={() => {
                                        setShowEndSessionModal(true);
                                        setOpenDropdown(null);
                                    }}
                                    className="
                w-full flex items-center gap-3 px-4 py-[14px] 
                text-sm font-medium text-red-600 
                hover:bg-red-50 
                text-left
                
                /* Better touch target for mobile */
                md:py-4
            "
                                >
                                    <div className="
                w-8 h-8 rounded-xl bg-red-50 
                flex items-center justify-center text-red-600 
                flex-shrink-0
                
                /* Slightly larger icons on tablet */
                md:w-9 md:h-9
            ">
                                        <FaSignOutAlt className="w-4 h-4 md:w-5 md:h-5" />
                                    </div>
                                    <span className="flex-1">End Session</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop Navigation Sidebar */}
            <div ref={sidebarRef} className={`fixed inset-y-0 right-0 z-[1001] w-full md:w-96 bg-white shadow-2xl border-l border-gray-200 overflow-hidden transition-transform duration-300 ease-in-out ${isNavSidebarOpen ? "translate-x-0" : "translate-x-full"}`}>
                {/* Sidebar Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-start justify-between gap-4">
                    <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2 mt-0.5" title={courseTitle}>
                        {courseTitle}
                    </h3>
                    <button
                        onClick={() => setIsNavSidebarOpen(false)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors duration-200 flex-shrink-0"
                        aria-label="Close navigation sidebar"
                    >
                        <FaTimes className="w-4 h-4" />
                    </button>
                </div>
                {/* Sidebar Body - Scrollable */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden h-full">
                    <div className="py-4 space-y-1 pb-16">
                        {/* Sessions Section */}
                        {sessions && sessions.length > 0 && (
                            <>
                                <div className="space-y-1">
                                    {sessions.map((session, index) => (
                                        <div key={session.id}>
                                            <div className="flex items-center">
                                                <button
                                                    onClick={() => handleSessionClick(session, false)}
                                                    disabled={!session.isAccessible}
                                                    className={`flex-1 flex items-center justify-between gap-3 px-2 py-2 text-left transition-all duration-200 ${!session.isAccessible
                                                        ? "opacity-50 cursor-not-allowed rounded-lg"
                                                        : currentSession?.id === session.id
                                                            ? "bg-blue-50 border-l-4 border-blue-600 rounded-r-lg"
                                                            : "rounded-lg"
                                                        }`}
                                                >
                                                    <span
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (!session.isAccessible) return;
                                                            handleSessionClick(session, false);
                                                            toggleExpand('session', session.id);
                                                        }}
                                                        className={`p-2 transition-colors duration-200 ${currentSession?.id === session.id ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                                                    >
                                                        <FaChevronDown
                                                            className={`w-4 h-4 transition-transform duration-200 ${expandedSessions.has(session.id) ? "rotate-180" : ""}`}
                                                        />
                                                    </span>
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className="min-w-0 flex-1 break-words grid">
                                                            <div className={`text-sm leading-tight truncate ${currentSession?.id === session.id ? "text-blue-700 font-semibold" : "text-gray-900"}`}>{`Session ${index + 1} : ${session.title}`}</div>
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>
                                            {expandedSessions.has(session.id) && currentSession?.id === session.id && modules?.length > 0 && (
                                                <div className="pl-1 ml-2">
                                                    <div>
                                                        {isModulesLoading ? (
                                                            <div className="flex items-center gap-1 px-3 py-2 text-gray-500">
                                                                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                                                <span className="text-sm">Loading modules...</span>
                                                            </div>
                                                        ) : (
                                                            modules.map((module, mindex) => (
                                                                <div key={module.id}>
                                                                    <div className="flex items-center">
                                                                        <button
                                                                            onClick={() => handleModuleClick(module, false)}
                                                                            disabled={!module.isAccessible}
                                                                            className={`flex-1 flex items-center justify-between gap-2 px-3 py-2 text-left rounded-lg transition-all duration-200 ${!module.isAccessible
                                                                                ? "opacity-50 cursor-not-allowed"
                                                                                : ""
                                                                                }`}
                                                                        >
                                                                            <span
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (!module.isAccessible) return;
                                                                                    handleModuleClick(module, false);
                                                                                    toggleExpand('module', module.id);
                                                                                }}
                                                                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                                                            >
                                                                                <FaChevronDown
                                                                                    className={`w-4 h-4 transition-transform duration-200 ${expandedModules.has(module.id) ? "rotate-180" : ""}`}
                                                                                />
                                                                            </span>
                                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                                <div className="min-w-0 flex-1 break-words grid">
                                                                                    <div className="font-medium text-gray-900 text-sm leading-tight truncate">{`Module ${mindex + 1} : ${module.title}`}</div>
                                                                                </div>
                                                                            </div>
                                                                        </button>
                                                                    </div>
                                                                    {expandedModules.has(module.id) && currentModule?.id === module.id && (
                                                                        <div className="mt-1 ml-4 space-y-1 pl-1">
                                                                            {/* Topics Section with Heading */}
                                                                            {topics?.length > 0 && (
                                                                                <>
                                                                                    <div className="px-3 pt-2 pb-1">
                                                                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Topics</h4>
                                                                                    </div>
                                                                                    <div className="space-y-1">
                                                                                        {isTopicsLoading ? (
                                                                                            <div className="flex items-center gap-2 px-3 py-2 text-gray-500">
                                                                                                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                                                                                <span className="text-sm">Loading topics...</span>
                                                                                            </div>
                                                                                        ) : (
                                                                                            topics.map((topic, tindex) => (
                                                                                                <div key={topic.id}>
                                                                                                    <div className="flex items-center">
                                                                                                        <button
                                                                                                            onClick={() => handleTopicClick(topic, false)}
                                                                                                            disabled={!topic.isAccessible}
                                                                                                            className={`flex-1 flex items-center justify-between gap-3 px-3 py-2 text-left rounded-lg transition-all duration-200 ${!topic.isAccessible ? "cursor-not-allowed" : ""}`}
                                                                                                        >
                                                                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                                                                <FaPlayCircle
                                                                                                                    className={`w-4 h-4 flex-shrink-0 ${!topic.isAccessible ? "text-gray-400" :
                                                                                                                        (currentTopic?.id === topic.id && !selectedQuizId && !selectedAssignmentId) ? "text-blue-600" :
                                                                                                                            "text-gray-500"
                                                                                                                        }`}
                                                                                                                />
                                                                                                                <div className="min-w-0 flex-1 break-words grid">
                                                                                                                    <div className={`text-[0.813rem] font-medium leading-tight truncate ${!topic.isAccessible ? "text-gray-400" :
                                                                                                                        (currentTopic?.id === topic.id && !selectedQuizId && !selectedAssignmentId) ? "text-blue-600" :
                                                                                                                            "text-gray-900"
                                                                                                                        }`}>{topic.title}</div>
                                                                                                                </div>
                                                                                                            </div>

                                                                                                            {!topic.isAccessible ? (
                                                                                                                <FaLock className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                                                                                            ) : topic.isCompleted ? (
                                                                                                                <FaCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                                                                            ) : (
                                                                                                                <FaRegCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                                                                                            )}
                                                                                                        </button>
                                                                                                    </div>

                                                                                                    <div className="mt-1 space-y-1">
                                                                                                        {/* Topic Quizzes */}
                                                                                                        {topic.quizzes.length > 0 && (
                                                                                                            <>
                                                                                                                <div className="space-y-1">
                                                                                                                    {topic.quizzes.map((quiz) => (
                                                                                                                        <button
                                                                                                                            key={quiz.id}
                                                                                                                            onClick={() => handleQuizClick(quiz)}
                                                                                                                            disabled={!topic.isAccessible}
                                                                                                                            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-all duration-200 ${!topic.isAccessible ? "cursor-not-allowed" : ""}`}
                                                                                                                        >
                                                                                                                            <FaQuestionCircle
                                                                                                                                className={`w-4 h-4 flex-shrink-0 ${!topic.isAccessible ? "text-gray-400" :
                                                                                                                                    selectedQuizId === quiz.id ? "text-blue-600" :
                                                                                                                                        "text-gray-500"
                                                                                                                                    }`}
                                                                                                                            />
                                                                                                                            <div className="min-w-0 flex-1 break-words grid">
                                                                                                                                <div className={`text-[0.813rem] font-medium leading-tight truncate ${!topic.isAccessible ? "text-gray-400" :
                                                                                                                                    selectedQuizId === quiz.id ? "text-blue-600" :
                                                                                                                                        "text-gray-900"
                                                                                                                                    }`}>{quiz.title}</div>
                                                                                                                            </div>

                                                                                                                            {!topic.isAccessible ? (
                                                                                                                                <FaLock className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                                                                                                                            ) : quiz.isCompleted ? (
                                                                                                                                <FaCheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                                                                                                            ) : (
                                                                                                                                <FaRegCircle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                                                                                                                            )}
                                                                                                                        </button>
                                                                                                                    ))}
                                                                                                                </div>
                                                                                                            </>
                                                                                                        )}
                                                                                                        {/* Topic Assignments */}
                                                                                                        {topic.assignments.length > 0 && (
                                                                                                            <>
                                                                                                                <div className="space-y-1">
                                                                                                                    {topic.assignments.map((assignment) => (
                                                                                                                        <button
                                                                                                                            key={assignment.id}
                                                                                                                            onClick={() => handleAssignmentClick({ id: assignment.id, title: assignment.title, isAccessible: topic.isAccessible })}
                                                                                                                            disabled={!topic.isAccessible}
                                                                                                                            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-all duration-200 ${!topic.isAccessible ? "cursor-not-allowed" : ""}`}
                                                                                                                        >
                                                                                                                            <FaFileAlt
                                                                                                                                className={`w-4 h-4 flex-shrink-0 ${!topic.isAccessible ? "text-gray-400" :
                                                                                                                                    selectedAssignmentId === assignment.id ? "text-blue-600" :
                                                                                                                                        "text-gray-500"
                                                                                                                                    }`}
                                                                                                                            />
                                                                                                                            <div className="min-w-0 flex-1 break-words grid">
                                                                                                                                <div className={`text-[0.813rem] font-medium leading-tight truncate ${!topic.isAccessible ? "text-gray-400" :
                                                                                                                                    selectedAssignmentId === assignment.id ? "text-blue-600" :
                                                                                                                                        "text-gray-900"
                                                                                                                                    }`}>{assignment.title}</div>
                                                                                                                            </div>

                                                                                                                            {!topic.isAccessible ? (
                                                                                                                                <FaLock className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                                                                                                                            ) : assignment.isCompleted ? (
                                                                                                                                <FaCheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                                                                                                            ) : (
                                                                                                                                <FaRegCircle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                                                                                                                            )}
                                                                                                                        </button>
                                                                                                                    ))}
                                                                                                                </div>
                                                                                                            </>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))
                                                                                        )}
                                                                                    </div>
                                                                                </>
                                                                            )}

                                                                            {/* Module-Level Quizzes Section with Heading */}
                                                                            {quizzesWithStatus?.length > 0 && (
                                                                                <>
                                                                                    <div className="px-3 pt-3 pb-1">
                                                                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Module Quizzes</h4>
                                                                                    </div>
                                                                                    <div className="space-y-1">
                                                                                        {isQuizzesLoading ? (
                                                                                            <div className="flex items-center gap-2 px-3 py-3 text-gray-500">
                                                                                                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                                                                                <span className="text-sm">Loading quizzes...</span>
                                                                                            </div>
                                                                                        ) : (
                                                                                            quizzesWithStatus.map((quiz) => (
                                                                                                <button
                                                                                                    key={quiz.id}
                                                                                                    onClick={() => handleQuizClick(quiz)}
                                                                                                    disabled={!quiz.isAccessible}
                                                                                                    className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-all duration-200 ${!quiz.isAccessible ? "cursor-not-allowed" : ""}`}
                                                                                                >
                                                                                                    <FaQuestionCircle
                                                                                                        className={`w-4 h-4 flex-shrink-0 ${!quiz.isAccessible ? "text-gray-400" :
                                                                                                            selectedQuizId === quiz.id ? "text-blue-600" :
                                                                                                                "text-gray-500"
                                                                                                            }`}
                                                                                                    />
                                                                                                    <div className="min-w-0 flex-1 break-words grid">
                                                                                                        <div className={`text-[0.813rem] font-medium leading-tight truncate ${!quiz.isAccessible ? "text-gray-400" :
                                                                                                            selectedQuizId === quiz.id ? "text-blue-600" :
                                                                                                                "text-gray-900"
                                                                                                            }`}>{quiz.title}</div>
                                                                                                    </div>

                                                                                                    {!quiz.isAccessible ? (
                                                                                                        <FaLock className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                                                                                                    ) : quiz.isCompleted ? (
                                                                                                        <FaCheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                                                                                    ) : (
                                                                                                        <FaRegCircle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                                                                                                    )}
                                                                                                </button>
                                                                                            ))
                                                                                        )}
                                                                                    </div>
                                                                                </>
                                                                            )}

                                                                            {/* Module-Level Assignments Section with Heading */}
                                                                            {assignments?.length > 0 && (
                                                                                <>
                                                                                    <div className="px-3 pt-3 pb-1">
                                                                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Module Assignments</h4>
                                                                                    </div>
                                                                                    <div className="space-y-1">
                                                                                        {isAssignmentsLoading ? (
                                                                                            <div className="flex items-center gap-2 px-3 py-3 text-gray-500">
                                                                                                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                                                                                <span className="text-sm">Loading assignments...</span>
                                                                                            </div>
                                                                                        ) : (
                                                                                            assignments.map((assignment) => (
                                                                                                <button
                                                                                                    key={assignment.id}
                                                                                                    onClick={() => handleAssignmentClick(assignment)}
                                                                                                    disabled={!assignment.isAccessible}
                                                                                                    className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-all duration-200 ${!assignment.isAccessible ? "cursor-not-allowed" : ""}`}
                                                                                                >
                                                                                                    <FaFileAlt
                                                                                                        className={`w-4 h-4 flex-shrink-0 ${!assignment.isAccessible ? "text-gray-400" :
                                                                                                            selectedAssignmentId === assignment.id ? "text-blue-600" :
                                                                                                                "text-gray-500"
                                                                                                            }`}
                                                                                                    />
                                                                                                    <div className="min-w-0 flex-1 break-words grid">
                                                                                                        <div className={`text-[0.813rem] font-medium leading-tight truncate ${!assignment.isAccessible ? "text-gray-400" :
                                                                                                            selectedAssignmentId === assignment.id ? "text-blue-600" :
                                                                                                                "text-gray-900"
                                                                                                            }`}>{assignment.title}</div>
                                                                                                    </div>

                                                                                                    {!assignment.isAccessible ? (
                                                                                                        <FaLock className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                                                                                                    ) : assignment.isCompleted ? (
                                                                                                        <FaCheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                                                                                    ) : (
                                                                                                        <FaRegCircle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                                                                                                    )}
                                                                                                </button>
                                                                                            ))
                                                                                        )}
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {isTopicInfoOpen && (shouldShowTopicInfo || shouldShowAssignmentInfo) && (
                <div
                    className="fixed inset-0 z-[1100] bg-black/45 backdrop-blur-[1px] flex items-start justify-center overflow-y-auto p-4 pt-16 sm:pt-20"
                    onClick={() => setIsTopicInfoOpen(false)}
                >
                    <div
                        className="w-full max-w-2xl max-h-[80vh] rounded-lg border border-gray-200 bg-white shadow-xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
                            <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-gray-900 tracking-wide uppercase">
                                    {shouldShowAssignmentInfo ? 'Assignment Description' : 'Topic Description'}
                                </h3>
                                <p className="text-xs text-gray-500 truncate mt-0.5" title={currentNavText}>{currentNavText}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsTopicInfoOpen(false)}
                                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                aria-label="Close info"
                            >
                                <FaTimes className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="px-5 py-4 overflow-y-auto max-h-[calc(80vh-70px)]">
                            <p className="text-[15px] leading-7 text-gray-700 whitespace-pre-wrap">
                                {shouldShowAssignmentInfo ? assignmentDescription : topicDescription}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}