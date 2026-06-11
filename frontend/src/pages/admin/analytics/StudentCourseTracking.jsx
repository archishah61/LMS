"use client"

/* eslint-disable no-unused-vars */
import { useState, useMemo, useRef, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { getAdminToken, getStudentToken } from "../../../services/CookieService"
import { useGetUserCourseProgressQuery, useLazyExportUserCourseProgressCsvQuery, useLazyExportUserCourseProgressXlsxQuery, useLazyExportUserCourseProgressPdfQuery } from "../../../services/Enrollment/enrollAPI"
import {
    ChevronDown,
    ChevronUp,
    Clock,
    BookOpen,
    CheckCircle,
    XCircle,
    AlertCircle,
    Award,
    TrendingUp,
    Target,
    FileQuestion,
    ListPlus,
    Menu,
    X,
} from "lucide-react"
import MyLearningSidebar from "../../../components/courseContent/SideBar/MyLearningSidebar"
import toast from "react-hot-toast"
import { slugify } from "../../../utils/slugify"
import AdminLoader from "../../../components/admin/AdminLoader"

export default function StudentCourseTracking(props) {
    const location = useLocation()
    const navigate = useNavigate()
    const navState = (props && props.state) || location.state || {}
    const { courseId, coursePublicHash, courseTitle } = navState
    const { access_token: admin_token } = getAdminToken()
    const { access_token: student_token } = getStudentToken()
    const [userId] = useState(navState.userId)
    const forStudent = props?.state?.forStudent || false;
    const access_token = forStudent ? student_token : admin_token

    // Mobile sidebar state
    const [showMobileSidebar, setShowMobileSidebar] = useState(false)

    // Lazy export hooks (RTK Query)
    const [triggerExportCsv, { isFetching: isExportingCsv }] = useLazyExportUserCourseProgressCsvQuery()
    const [triggerExportXlsx, { isFetching: isExportingXlsx }] = useLazyExportUserCourseProgressXlsxQuery()
    const [triggerExportPdf, { isFetching: isExportingPdf }] = useLazyExportUserCourseProgressPdfQuery()

    // PDF generation state (UI flag only)
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

    // Export dropdown menu
    const [showExportMenu, setShowExportMenu] = useState(false)
    const exportMenuRef = useRef(null)
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
                setShowExportMenu(false)
            }
        }
        if (showExportMenu) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showExportMenu])

    // Single open state for sessions and modules
    const [openSessionId, setOpenSessionId] = useState(null)
    const [openModuleId, setOpenModuleId] = useState(null)

    const [showStats, setShowStats] = useState(true)
    const [openQuizAttempts, setOpenQuizAttempts] = useState({})
    const [openAssignmentAttempts, setOpenAssignmentAttempts] = useState({})
    const toggleQuizAttempts = (quizId) => {
        setOpenQuizAttempts((prev) => ({ ...prev, [quizId]: !prev[quizId] }))
    }
    const toggleAssignmentAttempts = (assignmentId) => {
        setOpenAssignmentAttempts((prev) => ({ ...prev, [assignmentId]: !prev[assignmentId] }))
    }

    const [openSlideTopics, setOpenSlideTopics] = useState({});
    const toggleSlideDetails = (topicId) => {
        setOpenSlideTopics(prev => ({
            ...prev,
            [topicId]: !prev[topicId]
        }));
    };

    const {
        data: progressData,
        isLoading,
        error,
        refetch: refetchCourseProgress,
    } = useGetUserCourseProgressQuery(
        { userId, courseHash: coursePublicHash, access_token },
        { skip: !userId || !coursePublicHash || !access_token, refetchOnMountOrArgChange: true, refetchOnFocus: true, refetchOnReconnect: true },
    )

    // Toggle functions for single open accordion
    const toggleSession = (sessionId) => {
        setOpenSessionId(prev => prev === sessionId ? null : sessionId)
        // Close any open module when toggling session
        setOpenModuleId(null)
    }

    const toggleModule = (moduleId) => {
        setOpenModuleId(prev => prev === moduleId ? null : moduleId)
    }

    const getStatusIcon = (status) => {
        switch ((status || "").toLowerCase()) {
            case "completed":
                return <CheckCircle className="w-4 h-4 text-primary" />
            case "in_progress":
                return <Clock className="w-4 h-4 text-forestGreen" />
            case "not_started":
                return <XCircle className="w-4 h-4 text-gray-400" />
            default:
                return null
        }
    }

    const getStatusDisplay = (status, type = "topic") => {
        switch ((status || "").toLowerCase()) {
            case "completed":
                return (
                    <div className="flex items-center gap-1.5 text-primary">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-semibold">Completed</span>
                    </div>
                )
            case "in_progress":
                return (
                    <div className="flex items-center gap-1.5 text-forestGreen">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-semibold">{type === "assessment" ? "Available" : "In Progress"}</span>
                    </div>
                )
            case "not_started":
            default:
                return (
                    <div className="flex items-center gap-1.5 text-gray-500">
                        <XCircle className="w-4 h-4" />
                        <span className="text-xs font-semibold">{type === "assessment" ? "Pending" : "Not Started"}</span>
                    </div>
                )
        }
    }

    const getStatusColor = (status) => {
        switch ((status || "").toLowerCase()) {
            case "completed":
                return "bg-green-100 text-green-800 border-green-200"
            case "in_progress":
                return "bg-blue-100 text-blue-800 border-blue-200"
            default:
                return "bg-gray-100 text-gray-600 border-gray-200"
        }
    }

    const getColorDotClass = (colorDot, status = null) => {
        // If not started, always show gray
        if (status === 'not_started') {
            return 'bg-gray-400'
        }
        switch ((colorDot || 'gray').toLowerCase()) {
            case 'blue':
                return 'bg-blue-600'
            case 'yellow':
                return 'bg-amber-400'
            case 'red':
                return 'bg-red-500'
            case 'gray':
            default:
                return 'bg-gray-400'
        }
    }

    const formatDuration = (seconds) => {
        if (!seconds) return "0s"
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return [h ? h + "h" : null, m ? m + "m" : null, s ? s + "s" : null].filter(Boolean).join(" ")
    }

    // Get item status helper
    const getItemStatus = (item) => {
        if (item.isCompleted || Boolean(item.isComplete)) return "completed"
        if (item.isAccessible || (item.timeSpentSeconds && item.timeSpentSeconds > 0)) return "in_progress"
        return "not_started"
    }

    // Calculate total time for a module (sum of all topic times)
    const getModuleTotalTime = (module) => {
        if (!module?.topics) return 0
        return module.topics.reduce((total, topic) => total + (topic.timeSpentSeconds || 0), 0)
    }

    // Calculate total time for a session (sum of all module times)
    const getSessionTotalTime = (session) => {
        if (!session?.modules) return 0
        return session.modules.reduce((total, module) => total + getModuleTotalTime(module), 0)
    }

    // Calculate total course time (sum of all session times)
    const getCourseTotalTime = () => {
        if (!sessions) return 0
        return sessions.reduce((total, session) => total + getSessionTotalTime(session), 0)
    }

    // Backend now provides completionPercentage & counts per module/session
    const getModuleStats = (module) => ({
        ...module,
        totalTime: getModuleTotalTime(module)
    })

    const getSessionStats = (session) => ({
        ...session,
        totalTime: getSessionTotalTime(session)
    })

    const sessions = progressData?.sessions || []

    const formatDateTime = (dt) => {
        if (!dt) return null
        const d = new Date(dt)
        if (isNaN(d.getTime())) return null

        const day = d.getDate()
        const getOrdinal = (n) => {
            const s = ["th", "st", "nd", "rd"]
            const v = n % 100
            return s[(v - 20) % 10] || s[v] || s[0]
        }
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        const month = months[d.getMonth()]
        const year = d.getFullYear().toString().slice(-2)

        let hours = d.getHours()
        const minutes = d.getMinutes().toString().padStart(2, "0")
        const ampm = hours >= 12 ? "pm" : "am"
        hours = hours % 12
        hours = hours ? hours : 12
        const hourStr = hours.toString().padStart(2, "0")

        return `${day}${getOrdinal(day)} ${month} ${year} | ${hourStr}:${minutes} ${ampm}`
    }

    const overallStats = useMemo(
        () => ({
            completionRate: progressData?.enrollment?.completion_percentage || 0,
            totalTimeSpent: progressData?.totalTopicTimeSpentSeconds || progressData?.totalTimeSpent || getCourseTotalTime(),
            enrollmentDate: formatDateTime(progressData?.enrollment?.enrollment_date || progressData?.enrollment?.created_at),
            completedAt: formatDateTime(progressData?.enrollment?.completed_at),
        }),
        [progressData, sessions],
    )

    // -------- BACKEND CSV EXPORT --------
    const handleExportCSV = async () => {
        if (!userId || !coursePublicHash || !access_token || isExportingCsv) return
        try {
            const blob = await triggerExportCsv({ userId, courseHash: coursePublicHash, access_token }).unwrap()
            const safeTitle = (courseTitle || progressData?.course?.title || 'course').replace(/[^a-z0-9-_]+/gi, '_').toLowerCase()
            const filename = `${safeTitle}_progress_export.csv`
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
            setShowExportMenu(false)
        } catch (e) {
            toast.error(e?.data?.error || 'CSV export failed');
            console.error('CSV export failed', e)
        }
    }
    // -------- END BACKEND CSV EXPORT --------

    // -------- BACKEND PDF EXPORT (SERVER) --------
    const handleExportPDF = async () => {
        if (!userId || !coursePublicHash || !access_token || isExportingPdf) return
        setIsGeneratingPdf(true)
        try {
            const blob = await triggerExportPdf({ userId, courseHash: coursePublicHash, access_token }).unwrap()
            const safeTitle = (courseTitle || progressData?.course?.title || 'course').replace(/[^a-z0-9-_]+/gi, '_').toLowerCase()
            const filename = `${safeTitle}_progress_report.pdf`
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
            setShowExportMenu(false)
        } catch (err) {
            toast.error(err?.data?.error || 'PDF export failed');
            console.error('PDF export failed', err)
        } finally {
            setIsGeneratingPdf(false)
        }
    }
    // -------- END BACKEND PDF EXPORT --------

    if (isLoading) {
        return <AdminLoader className="h-screen" message="Loading Progress..." />
        return (
            <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading progress...</div>
        )
    }

    console.log("error ", error)
    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <XCircle className="w-10 h-10 text-red-500" />
                <p className="text-sm">Failed to load progress.</p>
            </div>
        )
    }

    return (
        <div className={`${forStudent ? "container" : "flex flex-col h-screen bg-white"}`}>
            {/* Mobile Sidebar Overlay */}
            {showMobileSidebar && (
                <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowMobileSidebar(false)}>
                    <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Course Menu</h3>
                                <button onClick={() => setShowMobileSidebar(false)} className="p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <MyLearningSidebar
                                courseId={progressData?.course?.public_hash}
                                courseIdIndx={progressData?.course?.id}
                                userId={userId}
                                courseTitle={progressData?.course?.title}
                                user_hash={progressData?.enrollment?.user_hash}
                                isCourseTracking={true}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            {!forStudent &&
                <div className="bg-white border-b pl-0 md:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
                    <div className="w-full max-w-full px-4 py-4 sm:px-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                            <div className="grid">
                                <h1 className="ml-10 md:ml-0 text-2xl font-bold  truncate text-forestGreen">
                                    {courseTitle}
                                </h1>
                                <p className="text-gray-600 mt-1 truncate">
                                    Hierarchical course progress overview
                                </p>
                            </div>

                            {/* Action Buttons - Mobile improvements */}
                            <div className="w-full flex flex-wrap lg:flex-nowrap gap-2 justify-start lg:justify-end items-center">


                                {/* Export Button - Mobile Optimized */}
                                <div className="relative flex-1 sm:flex-none" ref={exportMenuRef}>
                                    <button
                                        onClick={() => setShowExportMenu(m => !m)}
                                        className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm font-medium bg-white border border-gray-200 text-forestGreen rounded-lg hover:bg-lightGreen/10 transition-colors h-[42px] w-full sm:w-auto min-w-[160px]"
                                        aria-haspopup="menu"
                                        aria-expanded={showExportMenu}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-leafGreen inline-block rounded-sm" />
                                            <span>Export report</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showExportMenu && (
                                        <div className="absolute right-0 mt-1 w-48 sm:w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 text-xs" role="menu">
                                            <button
                                                onClick={handleExportCSV}
                                                disabled={isExportingCsv}
                                                className="w-full text-left px-3 py-2 hover:bg-lightGreen/10 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                                                role="menuitem"
                                            >
                                                <span className="w-2 h-2 bg-leafGreen rounded-sm"></span>
                                                {isExportingCsv ? 'Exporting CSV…' : 'Export CSV'}
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (!userId || !coursePublicHash || !access_token || isExportingXlsx) return
                                                    try {
                                                        const blob = await triggerExportXlsx({ userId, courseHash: coursePublicHash, access_token }).unwrap()
                                                        const safeTitle = (courseTitle || progressData?.course?.title || 'course').replace(/[^a-z0-9-_]+/gi, '_').toLowerCase()
                                                        const filename = `${safeTitle}_progress_report.xlsx`
                                                        const url = window.URL.createObjectURL(blob)
                                                        const a = document.createElement('a')
                                                        a.href = url
                                                        a.download = filename
                                                        document.body.appendChild(a)
                                                        a.click()
                                                        a.remove()
                                                        window.URL.revokeObjectURL(url)
                                                        setShowExportMenu(false)
                                                    } catch (e) {
                                                        toast.error(e?.data?.error || 'XLSX export failed');
                                                        console.error('XLSX export failed', e)
                                                    }
                                                }}
                                                disabled={isExportingXlsx}
                                                className="w-full text-left px-3 py-2 hover:bg-lightGreen/10 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                                                role="menuitem"
                                            >
                                                <span className="w-2 h-2 bg-leafGreen rounded-sm"></span>
                                                {isExportingXlsx ? 'Exporting XLSX…' : 'Export XLSX'}
                                            </button>
                                            <button
                                                onClick={handleExportPDF}
                                                disabled={isGeneratingPdf || isExportingPdf}
                                                className="w-full text-left px-3 py-2 hover:bg-lightGreen/10 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                                                role="menuitem"
                                            >
                                                <span className="w-2 h-2 bg-leafGreen rounded-sm"></span>
                                                {isGeneratingPdf || isExportingPdf ? 'Generating PDF…' : 'Export PDF'}
                                            </button>
                                        </div>
                                    )}
                                </div>


                                {/* My Learning Sidebar - Always visible but properly spaced */}
                                <div className="w-full sm:w-auto flex justify-center sm:block mt-2 sm:mt-0">
                                    <MyLearningSidebar
                                        courseId={progressData?.course?.public_hash}
                                        courseIdIndx={progressData?.course?.id}
                                        userId={userId}
                                        courseTitle={progressData?.course?.title}
                                        user_hash={progressData?.enrollment?.user_hash}
                                        isCourseTracking={true}
                                        customTrigger={
                                            <button className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-white border border-gray-200 text-forestGreen rounded-lg hover:bg-lightGreen/10 transition-colors h-[42px] w-full sm:w-auto min-w-[160px]">
                                                <BookOpen className="w-4 h-4" />
                                                <span>My Learning</span>
                                            </button>
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }

            <div className={`${forStudent ? "w-full pb-4 px-4 sm:px-6 lg:px-8 xl:px-12" : "w-full flex-1 overflow-y-auto p-4 sm:px-6"}`}>
                {/* Header Section - Mobile improvements without changing desktop */}
                {forStudent && <div className="mb-6 flex mt-6 flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0">
                    <div className="flex-1">
                        <h1 className="text-2xl lg:text-3xl font-bold text-forestGreen mb-2 break-words">
                            {courseTitle}
                        </h1>
                        <p className="text-darkSand text-sm">Hierarchical course progress overview</p>


                    </div>

                    {/* Action Buttons - Mobile improvements */}
                    <div className="flex flex-wrap gap-2 justify-start lg:justify-end items-center">


                        {/* Export Button - Mobile Optimized */}
                        <div className="relative flex-1 sm:flex-none" ref={exportMenuRef}>
                            <button
                                onClick={() => setShowExportMenu(m => !m)}
                                className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm font-medium bg-white border border-slate-200 text-forestGreen rounded-lg hover:bg-sand transition-colors h-[42px] w-full sm:w-auto min-w-[160px]"
                                aria-haspopup="menu"
                                aria-expanded={showExportMenu}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-darkSand inline-block rounded-sm" />
                                    <span>Export report</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                            </button>
                            {showExportMenu && (
                                <div className="absolute right-0 mt-1 w-48 sm:w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 text-xs" role="menu">
                                    <button
                                        onClick={handleExportCSV}
                                        disabled={isExportingCsv}
                                        className="w-full text-left px-3 py-2 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                                        role="menuitem"
                                    >
                                        <span className="w-2 h-2 bg-slate-400 rounded-sm"></span>
                                        {isExportingCsv ? 'Exporting CSV…' : 'Export CSV'}
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!userId || !coursePublicHash || !access_token || isExportingXlsx) return
                                            try {
                                                const blob = await triggerExportXlsx({ userId, courseHash: coursePublicHash, access_token }).unwrap()
                                                const safeTitle = (courseTitle || progressData?.course?.title || 'course').replace(/[^a-z0-9-_]+/gi, '_').toLowerCase()
                                                const filename = `${safeTitle}_progress_report.xlsx`
                                                const url = window.URL.createObjectURL(blob)
                                                const a = document.createElement('a')
                                                a.href = url
                                                a.download = filename
                                                document.body.appendChild(a)
                                                a.click()
                                                a.remove()
                                                window.URL.revokeObjectURL(url)
                                                setShowExportMenu(false)
                                            } catch (e) {
                                                toast.error(e?.data?.error || 'XLSX export failed');
                                                console.error('XLSX export failed', e)
                                            }
                                        }}
                                        disabled={isExportingXlsx}
                                        className="w-full text-left px-3 py-2 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                                        role="menuitem"
                                    >
                                        <span className="w-2 h-2 bg-slate-400 rounded-sm"></span>
                                        {isExportingXlsx ? 'Exporting XLSX…' : 'Export XLSX'}
                                    </button>
                                    <button
                                        onClick={handleExportPDF}
                                        disabled={isGeneratingPdf || isExportingPdf}
                                        className="w-full text-left px-3 py-2 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                                        role="menuitem"
                                    >
                                        <span className="w-2 h-2 bg-slate-400 rounded-sm"></span>
                                        {isGeneratingPdf || isExportingPdf ? 'Generating PDF…' : 'Export PDF'}
                                    </button>
                                </div>
                            )}
                        </div>


                        {/* My Learning Sidebar - Always visible but properly spaced */}
                        <div className="w-full sm:w-auto flex justify-center sm:block mt-2 sm:mt-0">
                            <button
                                onClick={() => navigate(`/course/${slugify(courseTitle || progressData?.course?.title)}/learning`, {
                                    state: {
                                        coursePublicHash: progressData?.course?.public_hash,
                                        courseId: progressData?.course?.id,
                                        userId: userId,
                                        courseTitle: progressData?.course?.title,
                                        user_hash: progressData?.enrollment?.user_hash
                                    }
                                })}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-white border border-slate-200 text-forestGreen rounded-lg hover:bg-sand transition-colors h-[42px] w-full sm:w-auto min-w-[160px]"
                            >
                                <BookOpen className="w-4 h-4" />
                                <span>My Learning</span>
                            </button>
                        </div>
                    </div>
                </div>}

                {!forStudent && admin_token !== undefined && progressData?.user && (
                    <div className="mb-4">
                        <p className="font-semibold text-forestGreen text-sm lg:text-base">Student Details</p>
                        <div className="mt-2 text-xs lg:text-xs text-gray-600 flex flex-col lg:flex-row lg:items-center lg:gap-4 space-y-1 lg:space-y-0">
                            <div><span className="font-semibold text-forestGreen">User ID:</span> {progressData.user.id}</div>
                            <div><span className="font-semibold text-forestGreen">Name:</span> {progressData.user.full_name}</div>
                            <div><span className="font-semibold text-forestGreen">Username:</span> {progressData.user.username}</div>
                            <div><span className="font-semibold text-forestGreen">Email:</span> {progressData.user.email}</div>
                        </div>
                    </div>
                )}

                {/* Stats Grid - Mobile improvements */}
                {showStats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row lg:items-center gap-7 mb-8">
                        {/* Overall Completion */}
                        <div className="lg:w-full bg-lightGreen rounded-lg p-4 border border-lightGreen">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-sand shadow-sm">
                                    <TrendingUp className="w-5 h-5 text-forestGreen" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold text-forestGreen">{overallStats.completionRate}%</p>
                                    <p className="text-xs font-semibold text-darkSand">Overall Completion</p>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="hidden lg:block w-px h-12 bg-darkSand opacity-20"></div>

                        {/* Total Time Spent */}
                        <div className="lg:w-full bg-lightGreen rounded-lg p-4 border border-lightGreen">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-sand shadow-sm">
                                    <Clock className="w-5 h-5 text-forestGreen" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold text-forestGreen">{formatDuration(overallStats.totalTimeSpent)}</p>
                                    <p className="text-xs font-semibold text-darkSand">Total Topic Time Spent</p>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="hidden lg:block w-px h-12 bg-darkSand opacity-20"></div>

                        {/* Enrolled On */}
                        <div className="lg:w-full bg-lightGreen rounded-lg p-4 border border-lightGreen">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-sand shadow-sm">
                                    <ListPlus className="w-5 h-5 text-forestGreen" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold text-forestGreen">{overallStats.enrollmentDate ? overallStats.enrollmentDate.split('|')[0] : "-"}</p>
                                    <p className="text-xs font-semibold text-darkSand">Enrolled On</p>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="hidden lg:block w-px h-12 bg-darkSand opacity-20"></div>

                        {/* Completion Date */}
                        <div className="lg:w-full bg-lightGreen rounded-lg p-4 border border-lightGreen">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-sand shadow-sm">
                                    <CheckCircle className="w-5 h-5 text-forestGreen" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold text-forestGreen">{overallStats.completedAt ? overallStats.completedAt.split('|')[0] : "In Progress"}</p>
                                    <p className="text-xs font-semibold text-darkSand">Completion Date</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Color Dot Legend */}
                <div className="mb-6 p-4  from-slate-50 to-slate-100 border border-slate-200 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-5 bg-leafGreen rounded-full"></div>
                        <p className="text-sm font-semibold text-forestGreen">Color Indicator Legend</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center gap-3 px-3 py-2 bg-white rounded border border-slate-150">
                            <span className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0"></span>
                            <span className="text-xs font-medium text-slate-600">Not Started</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 bg-white rounded border border-slate-150">
                            <span className="w-3 h-3 rounded-full bg-blue-600 flex-shrink-0"></span>
                            <span className="text-xs font-medium text-slate-600">Efficient (Fast)</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 bg-white rounded border border-slate-150">
                            <span className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0"></span>
                            <span className="text-xs font-medium text-slate-600">On Track</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 bg-white rounded border border-slate-150">
                            <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></span>
                            <span className="text-xs font-medium text-slate-600">Slow (Extra Time)</span>
                        </div>
                    </div>
                </div>

                {/* Sessions List - Desktop view completely unchanged, only mobile improvements */}
                <div className="space-y-4">
                    {sessions.map((session, sessionIdx) => {
                        const sessionStats = getSessionStats(session)
                        const isSessionOpen = openSessionId === session.id

                        return (
                            <div key={session.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                {/* Session Header - Redesigned to match image */}
                                <button
                                    onClick={() => toggleSession(session.id)}
                                    className="w-full flex flex-col md:flex-row justify-between md:items-start p-4 bg-lightGreen/10 hover:bg-lightGreen/20 transition-colors"
                                >
                                    <div className="flex-1 w-full">
                                        {/* Top Row: Icon + Title */}
                                        <div className="flex items-center gap-3 mb-1">
                                            {/* <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700">
                                                    <path d="M12 20h9" />
                                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                                </svg>
                                            </div> */}
                                            <h3 className="text-base font-semibold text-forestGreen">
                                                Session {sessionIdx + 1}: {session.title}
                                            </h3>
                                        </div>

                                        {/* Bottom Row: Stats */}
                                        <div className="flex flex-col md:flex-row flex-wrap gap-y-2 md:gap-x-8 text-xs text-slate-700 ml-0">
                                            <span className="flex items-center gap-2 text-slate-600">
                                                <BookOpen className="w-4 h-4" />
                                                {sessionStats.completedModules}/{sessionStats.totalModules} Modules Complete
                                            </span>
                                            <span className="flex items-center gap-2 text-slate-600">
                                                <Target className="w-4 h-4" />
                                                {sessionStats.completionPercentage}% Session Progress
                                            </span>
                                            <span className="flex items-center gap-2 text-slate-600">
                                                <Clock className="w-4 h-4" />
                                                {formatDuration(sessionStats.totalTime)} Total Time
                                            </span>

                                            {/* Dates - pushed to right primarily or inline if space */}
                                            <div className="flex flex-col md:flex-row gap-y-2 md:gap-x-8 md:ml-auto mt-2 md:mt-0">
                                                <span className="flex items-center gap-1 text-slate-500">
                                                    Started at: <span className="text-slate-700">{session.startedAt ? formatDateTime(session.startedAt) : "-"}</span>
                                                </span>
                                                <span className="flex items-center gap-1 text-leafGreen font-medium">
                                                    Completed at: {session.completedAt ? formatDateTime(session.completedAt) : "-"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chevron - Top Right */}
                                    <div className="ml-4 hidden md:block mt-2">
                                        {isSessionOpen ? (
                                            <ChevronUp className="w-5 h-5 text-slate-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="absolute right-4 top-4 md:hidden">
                                        {isSessionOpen ? (
                                            <ChevronUp className="w-5 h-5 text-slate-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-slate-400" />
                                        )}
                                    </div>
                                </button>

                                {/* Session Content - Modules - Desktop completely unchanged */}
                                {isSessionOpen && (
                                    <div className="border-t border-slate-100 bg-slate-50/30">
                                        {(session.modules || []).map((module, moduleIdx) => {
                                            const moduleStats = getModuleStats(module)
                                            const isModuleOpen = openModuleId === module.id

                                            return (
                                                <div key={module.id} className="border-b border-slate-100 last:border-b-0">
                                                    {/* Module Header - Desktop completely unchanged */}
                                                    <button
                                                        onClick={() => toggleModule(module.id)}
                                                        className="w-full flex flex-col md:flex-row justify-between md:items-start p-4 pl-8 bg-white transition-colors"
                                                    >
                                                        <div className="flex-1 w-full">
                                                            <div className="flex items-center gap-3 mb-1">
                                                                {/* <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                                                                    <Award className="w-4 h-4 text-emerald-600" />
                                                                </div> */}
                                                                <h4 className="text-base font-semibold text-forestGreen">Module {moduleIdx + 1}: {module.title}</h4>
                                                                {getStatusIcon(moduleStats.status)}
                                                            </div>
                                                            <div className="flex flex-col md:flex-row flex-wrap gap-y-2 md:gap-x-8 text-xs text-slate-600 ml-0">
                                                                <span className="flex items-center gap-2">
                                                                    <BookOpen className="w-4 h-4 text-slate-400" />
                                                                    {(moduleStats.topics || []).filter((t) => t.isCompleted).length}/{(module.topics || []).length} Topics
                                                                </span>
                                                                <span className="flex items-center gap-2">
                                                                    <FileQuestion className="w-4 h-4 text-slate-400" />
                                                                    {(moduleStats.quizzes || []).filter((q) => q.isCompleted).length}/{(module.quizzes || []).length}{" "}
                                                                    Quizzes
                                                                </span>
                                                                <span className="flex items-center gap-2">
                                                                    <ListPlus className="w-4 h-4 text-slate-400" />
                                                                    {(moduleStats.assignments || []).filter((a) => a.isCompleted).length}/
                                                                    {(module.assignments || []).length} Assignments
                                                                </span>
                                                                <span className="flex items-center gap-2">
                                                                    <Target className="w-4 h-4 text-slate-400" />
                                                                    {moduleStats.completionPercentage}% Complete
                                                                </span>
                                                                <span className="flex items-center gap-2">
                                                                    <Clock className="w-4 h-4 text-slate-400" />
                                                                    {formatDuration(moduleStats.totalTime)} Module Time
                                                                </span>
                                                                <div className="flex flex-col md:flex-row gap-y-2 md:gap-x-8 md:ml-auto mt-2 md:mt-0">
                                                                    <span className="flex items-center gap-1 text-slate-500">
                                                                        Started at: <span className="text-slate-700">{module.startedAt ? formatDateTime(module.startedAt) : "-"}</span>
                                                                    </span>
                                                                    <span className="flex items-center gap-1 text-leafGreen font-medium">
                                                                        Completed at: {module.completedAt ? formatDateTime(module.completedAt) : "-"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4 hidden md:block mt-2">
                                                            {isModuleOpen ? (
                                                                <ChevronUp className="w-4 h-4 text-slate-400" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                                            )}
                                                        </div>
                                                        <div className="absolute right-4 top-4 md:hidden">
                                                            {isModuleOpen ? (
                                                                <ChevronUp className="w-4 h-4 text-slate-400" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                                            )}
                                                        </div>
                                                    </button>

                                                    {/* Module Content - Topics, Quizzes, Assignments - Desktop completely unchanged */}
                                                    {isModuleOpen && (
                                                        <div className="bg-white/50 p-4 pl-8">
                                                            {/* Topics Section */}
                                                            {(module.topics || []).length > 0 && (
                                                                <div className="mb-6 mr-8 ml-1">
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <BookOpen className="w-4 h-4 text-slate-600" />
                                                                        <h5 className="text-sm font-semibold text-forestGreen">
                                                                            Topics ({module.topics.length})
                                                                        </h5>
                                                                        <span className="text-xs text-slate-500 ml-auto">
                                                                            Total Topic Time: {formatDuration(moduleStats.totalTime)}
                                                                        </span>
                                                                    </div>

                                                                    <div className="overflow-x-auto rounded-lg border border-slate-100">
                                                                        <div>
                                                                            {/* Header row (all breakpoints) */}
                                                                            <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-2 text-[11px] font-semibold tracking-wide text-forestGreen bg-lightGreen/30">
                                                                                <div className="col-span-1">#</div>
                                                                                <div className="col-span-3">Title</div>
                                                                                <div className="col-span-2 text-center">Started</div>
                                                                                <div className="col-span-2 text-center">Completed</div>
                                                                                <div className="col-span-1 text-center">Time</div>
                                                                                <div className="col-span-1 text-center">Revisions</div>
                                                                                <div className="col-span-2 text-center">Status</div>
                                                                            </div>

                                                                            <div className="divide-y divide-slate-100">
                                                                                {(module.topics || []).map((topic, topicIdx) => {
                                                                                    const topicStatus = getItemStatus(topic);
                                                                                    const isSlideTopic = topic.totalSlides > 0;
                                                                                    const isSlideOpen = openSlideTopics[topic.id];
                                                                                    return (
                                                                                        <div key={topic.id}>
                                                                                            {/* Main Topic Row */}
                                                                                            <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-2 items-center bg-white hover:bg-lightGreen/10 transition-colors">
                                                                                                {/* Index */}
                                                                                                <div className="col-span-1">
                                                                                                    <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[11px] font-medium">
                                                                                                        {topicIdx + 1}
                                                                                                    </span>
                                                                                                </div>
                                                                                                {/* Title + Toggle (if slide topic) */}
                                                                                                <div className="col-span-3 flex items-center gap-1">
                                                                                                    <span className={`w-2.5 h-2.5 rounded-full inline-block ${getColorDotClass(topic.colorDot, topicStatus)}`}></span>
                                                                                                    <span className="text-sm font-medium text-slate-700 line-clamp-1">
                                                                                                        {topic.title}
                                                                                                    </span>
                                                                                                    {isSlideTopic && (
                                                                                                        <button
                                                                                                            onClick={(e) => {
                                                                                                                e.stopPropagation();
                                                                                                                toggleSlideDetails(topic.id);
                                                                                                            }}
                                                                                                            className="ml-1 text-slate-400 hover:text-slate-600 transition-colors"
                                                                                                        >
                                                                                                            <ChevronDown
                                                                                                                className={`w-4 h-4 transition-transform ${isSlideOpen ? 'rotate-180' : ''}`}
                                                                                                            />
                                                                                                        </button>
                                                                                                    )}
                                                                                                </div>
                                                                                                {/* Started */}
                                                                                                <div className="col-span-2 text-center text-[12px] text-slate-600">
                                                                                                    {topic.startedAt ? formatDateTime(topic.startedAt) : "-"}
                                                                                                </div>
                                                                                                {/* Completed */}
                                                                                                <div className="col-span-2 text-center text-[12px] text-leafGreen">
                                                                                                    {topic.completedAt ? formatDateTime(topic.completedAt) : "-"}
                                                                                                </div>
                                                                                                {/* Time */}
                                                                                                <div className="col-span-1 flex items-center justify-center text-xs text-slate-600">
                                                                                                    <Clock className="w-3 h-3 mr-1" />
                                                                                                    {formatDuration(topic.timeSpentSeconds)}
                                                                                                </div>
                                                                                                {/* Revisions */}
                                                                                                <div className="col-span-1 text-center text-[12px] text-slate-600">
                                                                                                    {topic.revisionCount || 0}
                                                                                                </div>
                                                                                                {/* Status */}
                                                                                                <div className="col-span-2 flex items-center justify-center">
                                                                                                    {getStatusDisplay(topicStatus)}
                                                                                                </div>
                                                                                            </div>

                                                                                            {/* Mobile Card (sm and below) */}
                                                                                            <div className="sm:hidden bg-white p-4 border-b border-slate-100">
                                                                                                <div className="flex items-start justify-between mb-3">
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[11px] font-medium">
                                                                                                            {topicIdx + 1}
                                                                                                        </span>
                                                                                                        <span className={`w-2.5 h-2.5 rounded-full inline-block ${getColorDotClass(topic.colorDot, topicStatus)}`}></span>
                                                                                                        <span className="text-sm font-medium text-slate-700">
                                                                                                            {topic.title}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        {getStatusDisplay(topicStatus)}
                                                                                                        {isSlideTopic && (
                                                                                                            <button
                                                                                                                onClick={(e) => {
                                                                                                                    e.stopPropagation();
                                                                                                                    toggleSlideDetails(topic.id);
                                                                                                                }}
                                                                                                                className="text-slate-400 hover:text-slate-600 transition-colors"
                                                                                                            >
                                                                                                                <ChevronDown
                                                                                                                    className={`w-4 h-4 transition-transform ${isSlideOpen ? 'rotate-180' : ''}`}
                                                                                                                />
                                                                                                            </button>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>

                                                                                                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                                                                                                    <div>
                                                                                                        <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Started</div>
                                                                                                        <div>{topic.startedAt ? formatDateTime(topic.startedAt) : "-"}</div>
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Completed</div>
                                                                                                        <div className="text-leafGreen">{topic.completedAt ? formatDateTime(topic.completedAt) : "-"}</div>
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Time Spent</div>
                                                                                                        <div className="flex items-center">
                                                                                                            <Clock className="w-3 h-3 mr-1" />
                                                                                                            {formatDuration(topic.timeSpentSeconds)}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Revisions</div>
                                                                                                        <div>{topic.revisionCount || 0}</div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>

                                                                                            {/* Slide Details Dropdown */}
                                                                                            {isSlideTopic && isSlideOpen && topic.slides && (
                                                                                                <div>
                                                                                                    <div className="px-3 py-2 space-y-1">
                                                                                                        {topic.slides.map((slide, idx) => (
                                                                                                            <div key={slide.slide_id} className="hidden sm:grid grid-cols-12 gap-3 py-2 items-center bg-white">
                                                                                                                {/* Index */}
                                                                                                                <div className="col-span-1">
                                                                                                                    {/* <span className="w-5 h-5 bg-lightGreen text-forestGreen rounded-full flex items-center justify-center text-[10px] font-medium">
                                                                                                                        {idx + 1}
                                                                                                                    </span> */}
                                                                                                                </div>
                                                                                                                {/* Title + Toggle (if slide topic) */}
                                                                                                                <div className="col-span-3 flex items-center gap-1">
                                                                                                                    <span className={`w-2.5 h-2.5 rounded-full inline-block ${getColorDotClass(slide.colorDot, slide.status)}`}></span>
                                                                                                                    <span className="text-sm font-medium text-slate-700 line-clamp-1">
                                                                                                                        {slide.title}
                                                                                                                    </span>
                                                                                                                </div>
                                                                                                                {/* Started */}
                                                                                                                <div className="col-span-2 text-center text-[12px] text-slate-600">
                                                                                                                    {slide.createdAt ? formatDateTime(slide.createdAt) : "-"}
                                                                                                                </div>
                                                                                                                {/* Completed */}
                                                                                                                <div className="col-span-2 text-center text-[12px] text-emerald-600">
                                                                                                                    {slide.completedAt ? formatDateTime(slide.completedAt) : "-"}
                                                                                                                </div>
                                                                                                                {/* Time */}
                                                                                                                <div className="col-span-1 flex items-center justify-center text-xs text-slate-600">
                                                                                                                    <Clock className="w-3 h-3 mr-1" />
                                                                                                                    {formatDuration(slide.timeSpentSeconds)}
                                                                                                                </div>
                                                                                                                {/* Revisions */}
                                                                                                                <div className="col-span-1 text-center text-[12px] text-slate-600">
                                                                                                                    {slide.revision_count || 0}
                                                                                                                </div>
                                                                                                                {/* Status */}
                                                                                                                <div className="col-span-2 flex items-center justify-center">
                                                                                                                    {getStatusDisplay(slide.status)}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        ))}

                                                                                                        {/* Mobile Slide Cards */}
                                                                                                        {topic.slides.map((slide, idx) => (
                                                                                                            <div key={slide.slide_id} className="sm:hidden bg-white p-3 rounded border border-slate-200 mb-2">
                                                                                                                <div className="flex items-start justify-between mb-2">
                                                                                                                    <div className="flex items-center gap-2">
                                                                                                                        <span className="w-5 h-5 bg-lightGreen text-forestGreen rounded-full flex items-center justify-center text-[10px] font-medium">
                                                                                                                            {idx + 1}
                                                                                                                        </span>
                                                                                                                        <span className={`w-2.5 h-2.5 rounded-full inline-block ${getColorDotClass(slide.colorDot, slide.status)}`}></span>
                                                                                                                        <span className="text-sm font-medium text-slate-700">
                                                                                                                            {slide.title}
                                                                                                                        </span>
                                                                                                                    </div>
                                                                                                                    {getStatusDisplay(slide.status)}
                                                                                                                </div>

                                                                                                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                                                                                                    <div>
                                                                                                                        <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Started</div>
                                                                                                                        <div>{slide.createdAt ? formatDateTime(slide.createdAt) : "-"}</div>
                                                                                                                    </div>
                                                                                                                    <div>
                                                                                                                        <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Completed</div>
                                                                                                                        <div className="text-emerald-600">{slide.completedAt ? formatDateTime(slide.completedAt) : "-"}</div>
                                                                                                                    </div>
                                                                                                                    <div>
                                                                                                                        <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Time Spent</div>
                                                                                                                        <div className="flex items-center">
                                                                                                                            <Clock className="w-3 h-3 mr-1" />
                                                                                                                            {formatDuration(slide.timeSpentSeconds)}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                    <div>
                                                                                                                        <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Revisions</div>
                                                                                                                        <div>{slide.revision_count || 0}</div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}

                                                                                            {/* Quizzes Section */}
                                                                                            {topic.topicQuizzes.length > 0 && (
                                                                                                <div className="ml-4 mb-6">
                                                                                                    {/* <div className="flex items-center gap-2 mb-3">
                                                                                                        <FileQuestion className="w-4 h-4 text-slate-600" />
                                                                                                        <h5 className="text-sm font-semibold text-slate-700">
                                                                                                            Quizzes ({topic.topicQuizzes.length})
                                                                                                        </h5>
                                                                                                    </div> */}
                                                                                                    <div className="space-y-2">
                                                                                                        {topic.topicQuizzes.map((quiz, quizIdx) => {
                                                                                                            const quizStatus = getItemStatus(quiz)
                                                                                                            return (
                                                                                                                <div key={quiz.id} className="bg-white rounded-lg border border-slate-200">
                                                                                                                    <div
                                                                                                                        role="button"
                                                                                                                        tabIndex={0}
                                                                                                                        onClick={() => toggleQuizAttempts(quiz.id)}
                                                                                                                        onKeyDown={(e) => {
                                                                                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                                                                                e.preventDefault();
                                                                                                                                toggleQuizAttempts(quiz.id)
                                                                                                                            }
                                                                                                                        }}
                                                                                                                        aria-expanded={!!openQuizAttempts[quiz.id]}
                                                                                                                        className="p-3 hidden sm:flex items-center justify-between cursor-pointer select-none hover:bg-slate-50"
                                                                                                                    >
                                                                                                                        <div className="flex items-center gap-3">
                                                                                                                            <span className="w-6 h-6 bg-lightGreen rounded-full flex items-center justify-center text-xs font-medium">
                                                                                                                                Q{quizIdx + 1}
                                                                                                                            </span>
                                                                                                                            <span className="text-sm font-medium text-slate-700 line-clamp-1 max-w-[220px] sm:max-w-none">{quiz.title}</span>
                                                                                                                        </div>
                                                                                                                        <div className="flex items-center gap-3">
                                                                                                                            <span className="text-[11px] text-slate-500 hidden sm:block">
                                                                                                                                Attempts: {quiz.attempts?.length || 0}
                                                                                                                            </span>
                                                                                                                            {getStatusDisplay(quizStatus, "assessment")}
                                                                                                                            <ChevronDown
                                                                                                                                className={`w-4 h-4 text-slate-400 transition-transform ${openQuizAttempts[quiz.id] ? "rotate-180" : ""}`}
                                                                                                                            />
                                                                                                                        </div>
                                                                                                                    </div>

                                                                                                                    {/* Mobile attempts info */}
                                                                                                                    <div
                                                                                                                        role="button"
                                                                                                                        tabIndex={0}
                                                                                                                        onClick={() => toggleQuizAttempts(quiz.id)}
                                                                                                                        onKeyDown={(e) => {
                                                                                                                            if (e.key === "Enter" || e.key === " ") {
                                                                                                                                e.preventDefault();
                                                                                                                                toggleQuizAttempts(quiz.id);
                                                                                                                            }
                                                                                                                        }}
                                                                                                                        aria-expanded={!!openQuizAttempts[quiz.id]}
                                                                                                                        className="sm:hidden p-3 cursor-pointer select-none hover:bg-slate-50 border-b"
                                                                                                                    >
                                                                                                                        {/* ---------- ROW 1 (<sm): Q#, Title, Chevron ---------- */}
                                                                                                                        <div className="flex items-center justify-between">
                                                                                                                            <div className="flex items-center gap-3">
                                                                                                                                <span className="w-6 h-6 bg-lightGreen rounded-full flex items-center justify-center text-xs font-medium">
                                                                                                                                    Q{quizIdx + 1}
                                                                                                                                </span>

                                                                                                                                <span className="text-sm font-medium text-slate-700 line-clamp-1 max-w-[180px]">
                                                                                                                                    {quiz.title}
                                                                                                                                </span>
                                                                                                                            </div>

                                                                                                                            <ChevronDown
                                                                                                                                className={`w-4 h-4 text-slate-400 transition-transform ${openQuizAttempts[quiz.id] ? "rotate-180" : ""
                                                                                                                                    }`}
                                                                                                                            />
                                                                                                                        </div>

                                                                                                                        {/* ---------- ROW 2 (<sm): Expanded Details ---------- */}
                                                                                                                        <div className="mt-3 pl-9 flex items-center justify-between">
                                                                                                                            <span className="text-[12px] text-slate-600">
                                                                                                                                Attempts: {quiz.attempts?.length || 0}
                                                                                                                            </span>

                                                                                                                            <div className="flex items-center gap-2">
                                                                                                                                {getStatusDisplay(quizStatus, "assessment")}
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                    </div>

                                                                                                                    {openQuizAttempts[quiz.id] && quiz.attempts?.length > 0 && (
                                                                                                                        <div className="border-t border-slate-100 bg-slate-50 p-3 space-y-2 overflow-x-auto">
                                                                                                                            {/* Desktop Table */}
                                                                                                                            <div className="hidden sm:block">
                                                                                                                                <div className="grid grid-cols-12 gap-3 px-2 py-1 text-[11px] font-semibold tracking-wide text-slate-500 bg-slate-100 rounded">
                                                                                                                                    <div className="col-span-2">Attempt No. (#)</div>
                                                                                                                                    <div className="col-span-2 text-center">Percentage</div>
                                                                                                                                    <div className="col-span-2 text-center">Marks</div>
                                                                                                                                    <div className="col-span-2 text-center">Started Date</div>
                                                                                                                                    <div className="col-span-2 text-center">Completed Date</div>
                                                                                                                                    <div className="col-span-2 text-center">Status</div>
                                                                                                                                </div>
                                                                                                                                {quiz.attempts.map((a, idx) => {
                                                                                                                                    const pass = a.passFail === "passed"
                                                                                                                                    return (
                                                                                                                                        <div key={a.attemptId} className="hidden sm:grid grid-cols-12 gap-3 items-center text-xs px-2 py-2 bg-white border-b last:border-b-0 border-slate-100">
                                                                                                                                            <div className="col-span-2 font-medium">Attempt {idx + 1}</div>
                                                                                                                                            <div className="col-span-2 text-center">
                                                                                                                                                {a.percentage != null ? `${a.percentage}%` : '-'}
                                                                                                                                            </div>
                                                                                                                                            <div className="col-span-2 text-center">
                                                                                                                                                {a.obtainedMarks != null && a.totalMarks != null ? `${a.obtainedMarks}/${a.totalMarks}` : '-'}
                                                                                                                                            </div>
                                                                                                                                            <div className="col-span-2 text-center text-slate-600">
                                                                                                                                                {a.startedAt ? formatDateTime(a.startedAt) : '-'}
                                                                                                                                            </div>
                                                                                                                                            <div className="col-span-2 text-center text-slate-600">
                                                                                                                                                {a.completedAt ? formatDateTime(a.completedAt) : '-'}
                                                                                                                                            </div>
                                                                                                                                            <div className="col-span-2 text-center">
                                                                                                                                                <span className={`inline-flex px-2 py-0.5 rounded border ${pass ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                                                                                                                    {pass ? 'Passed' : 'Failed'}
                                                                                                                                                </span>
                                                                                                                                            </div>
                                                                                                                                        </div>
                                                                                                                                    )
                                                                                                                                })}
                                                                                                                            </div>

                                                                                                                            {/* Mobile Cards for Attempts */}
                                                                                                                            <div className="sm:hidden space-y-2">
                                                                                                                                {quiz.attempts.map((a, idx) => {
                                                                                                                                    const pass = a.passFail === "passed"
                                                                                                                                    return (
                                                                                                                                        <div key={a.attemptId} className="bg-white rounded border border-slate-200 p-3">
                                                                                                                                            <div className="flex items-center justify-between mb-2">
                                                                                                                                                <div className="font-medium text-sm">Attempt {idx + 1}</div>
                                                                                                                                                <span className={`inline-flex px-2 py-0.5 rounded text-xs border ${pass ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                                                                                                                    {pass ? 'Passed' : 'Failed'}
                                                                                                                                                </span>
                                                                                                                                            </div>

                                                                                                                                            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                                                                                                                                                <div>
                                                                                                                                                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Percentage</div>
                                                                                                                                                    <div>{a.percentage != null ? `${a.percentage}%` : '-'}</div>
                                                                                                                                                </div>
                                                                                                                                                <div>
                                                                                                                                                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Marks</div>
                                                                                                                                                    <div>{a.obtainedMarks != null && a.totalMarks != null ? `${a.obtainedMarks}/${a.totalMarks}` : '-'}</div>
                                                                                                                                                </div>
                                                                                                                                                <div>
                                                                                                                                                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Started</div>
                                                                                                                                                    <div>{a.startedAt ? formatDateTime(a.startedAt) : '-'}</div>
                                                                                                                                                </div>
                                                                                                                                                <div>
                                                                                                                                                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Completed</div>
                                                                                                                                                    <div>{a.completedAt ? formatDateTime(a.completedAt) : '-'}</div>
                                                                                                                                                </div>
                                                                                                                                            </div>
                                                                                                                                        </div>
                                                                                                                                    )
                                                                                                                                })}
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                    )}
                                                                                                                </div>
                                                                                                            )
                                                                                                        })}
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}

                                                                                            {/* Assignments Section */}
                                                                                            {(topic.topicAssignments || []).length > 0 && (
                                                                                                <div className="ml-4 mb-4">
                                                                                                    {/* <div className="flex items-center gap-2 mb-3">
                                                                                                        <Award className="w-4 h-4 text-slate-600" />
                                                                                                        <h5 className="text-sm font-semibold text-slate-700">
                                                                                                            Assignments ({topic.topicAssignments.length})
                                                                                                        </h5>
                                                                                                    </div> */}
                                                                                                    <div className="space-y-2">
                                                                                                        {(topic.topicAssignments || []).map((assignment, assignmentIdx) => {
                                                                                                            const assignmentStatus = getItemStatus(assignment)
                                                                                                            return (
                                                                                                                <div key={assignment.id} className="bg-white rounded-lg border border-slate-200">
                                                                                                                    <div
                                                                                                                        role="button"
                                                                                                                        tabIndex={0}
                                                                                                                        onClick={() => toggleAssignmentAttempts(assignment.id)}
                                                                                                                        onKeyDown={(e) => {
                                                                                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                                                                                e.preventDefault();
                                                                                                                                toggleAssignmentAttempts(assignment.id)
                                                                                                                            }
                                                                                                                        }}
                                                                                                                        aria-expanded={!!openAssignmentAttempts[assignment.id]}
                                                                                                                        className="p-3 hidden sm:flex items-center justify-between cursor-pointer select-none hover:bg-slate-50"
                                                                                                                    >
                                                                                                                        <div className="flex items-center gap-3">
                                                                                                                            <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-xs font-medium">
                                                                                                                                A{assignmentIdx + 1}
                                                                                                                            </span>
                                                                                                                            <span className="text-sm font-medium text-slate-700 line-clamp-1 max-w-[200px] sm:max-w-none">
                                                                                                                                {assignment.title}
                                                                                                                            </span>
                                                                                                                        </div>
                                                                                                                        <div className="flex items-center gap-3">
                                                                                                                            <span className="text-[11px] text-slate-500">
                                                                                                                                Attempts: {assignment.attempts?.length && assignment.attempts[0].triedAttempts != null ? `${assignment.attempts.length}` : '0'}
                                                                                                                            </span>
                                                                                                                            {getStatusDisplay(assignmentStatus, "assessment")}
                                                                                                                            <ChevronDown
                                                                                                                                className={`w-4 h-4 text-slate-400 transition-transform ${openAssignmentAttempts[assignment.id] ? "rotate-180" : ""}`}
                                                                                                                            />
                                                                                                                        </div>
                                                                                                                    </div>

                                                                                                                    {/* Mobile attempts info */}
                                                                                                                    <div
                                                                                                                        role="button"
                                                                                                                        tabIndex={0}
                                                                                                                        onClick={() => toggleAssignmentAttempts(assignment.id)}
                                                                                                                        onKeyDown={(e) => {
                                                                                                                            if (e.key === "Enter" || e.key === " ") {
                                                                                                                                e.preventDefault();
                                                                                                                                toggleAssignmentAttempts(assignment.id);
                                                                                                                            }
                                                                                                                        }}
                                                                                                                        aria-expanded={!!openAssignmentAttempts[assignment.id]}
                                                                                                                        className="p-3 sm:hidden cursor-pointer select-none hover:bg-slate-50 border-b"
                                                                                                                    >
                                                                                                                        {/* ---------- ROW 1: Index, Title, Chevron ---------- */}
                                                                                                                        <div className="flex items-center justify-between">
                                                                                                                            <div className="flex items-center gap-3">
                                                                                                                                <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-xs font-medium">
                                                                                                                                    A{assignmentIdx + 1}
                                                                                                                                </span>

                                                                                                                                <span className="text-sm font-medium text-slate-700 line-clamp-1 max-w-[180px]">
                                                                                                                                    {assignment.title}
                                                                                                                                </span>
                                                                                                                            </div>

                                                                                                                            <ChevronDown
                                                                                                                                className={`w-4 h-4 text-slate-400 transition-transform ${openAssignmentAttempts[assignment.id] ? "rotate-180" : ""
                                                                                                                                    }`}
                                                                                                                            />
                                                                                                                        </div>

                                                                                                                        {/* ---------- ROW 2: Attempts + Status ---------- */}
                                                                                                                        <div className="mt-3 pl-9 flex items-center justify-between">
                                                                                                                            <span className="text-[12px] text-slate-600">
                                                                                                                                Attempts:{" "}
                                                                                                                                {assignment.attempts?.length &&
                                                                                                                                    assignment.attempts[0].triedAttempts != null
                                                                                                                                    ? assignment.attempts.length
                                                                                                                                    : "0"}
                                                                                                                            </span>

                                                                                                                            {getStatusDisplay(assignmentStatus, "assessment")}
                                                                                                                        </div>
                                                                                                                    </div>

                                                                                                                    {openAssignmentAttempts[assignment.id] && assignment.attempts?.length > 0 && (
                                                                                                                        <div className="border-t border-slate-100 bg-slate-50 p-3 space-y-2 overflow-x-auto">
                                                                                                                            {/* Desktop Table */}
                                                                                                                            <div className="hidden sm:block min-w-[880px]">
                                                                                                                                <div className="grid grid-cols-12 gap-3 px-2 py-1 text-[11px] font-semibold tracking-wide text-slate-500 bg-slate-100 rounded">
                                                                                                                                    <div className="col-span-2">Attempt No. (#)</div>
                                                                                                                                    <div className="col-span-2 text-center">Percentage</div>
                                                                                                                                    <div className="col-span-2 text-center">Marks</div>
                                                                                                                                    <div className="col-span-2 text-center">Started Date</div>
                                                                                                                                    <div className="col-span-2 text-center">Completed Date</div>
                                                                                                                                    <div className="col-span-2 text-center">Status</div>
                                                                                                                                </div>
                                                                                                                                {assignment.attempts.map((a, idx) => {
                                                                                                                                    const pass = a.passFail === 'passed'
                                                                                                                                    return (
                                                                                                                                        <div key={a.attemptId} className="hidden sm:grid grid-cols-12 gap-3 items-center text-xs px-2 py-2 bg-white border-b last:border-b-0 border-slate-100">
                                                                                                                                            <div className="col-span-2 font-medium">Attempt {idx + 1}</div>
                                                                                                                                            <div className="col-span-2 text-center">
                                                                                                                                                {a.percentage != null ? `${a.percentage}%` : '-'}
                                                                                                                                            </div>
                                                                                                                                            <div className="col-span-2 text-center">
                                                                                                                                                {a.score != null ? a.score : '-'}/{a.max_score != null ? a.max_score : '-'}
                                                                                                                                            </div>
                                                                                                                                            <div className="col-span-2 text-center text-slate-600">
                                                                                                                                                {a.startedAt ? formatDateTime(a.startedAt) : '-'}
                                                                                                                                            </div>
                                                                                                                                            <div className="col-span-2 text-center text-slate-600">
                                                                                                                                                {a.completedAt ? formatDateTime(a.completedAt) : '-'}
                                                                                                                                            </div>
                                                                                                                                            <div className="col-span-2 text-center">
                                                                                                                                                <span className={`inline-flex px-2 py-0.5 rounded border ${pass ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                                                                                                                    {pass ? 'Passed' : 'Failed'}
                                                                                                                                                </span>
                                                                                                                                            </div>
                                                                                                                                        </div>
                                                                                                                                    )
                                                                                                                                })}
                                                                                                                            </div>

                                                                                                                            {/* Mobile Cards for Attempts */}
                                                                                                                            <div className="sm:hidden space-y-2">
                                                                                                                                {assignment.attempts.map((a, idx) => {
                                                                                                                                    const pass = a.passFail === 'passed'
                                                                                                                                    return (
                                                                                                                                        <div key={a.attemptId} className="bg-white rounded border border-slate-200 p-3">
                                                                                                                                            <div className="flex items-center justify-between mb-2">
                                                                                                                                                <div className="font-medium text-sm">Attempt {idx + 1}</div>
                                                                                                                                                <span className={`inline-flex px-2 py-0.5 rounded text-xs border ${pass ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                                                                                                                    {pass ? 'Passed' : 'Failed'}
                                                                                                                                                </span>
                                                                                                                                            </div>

                                                                                                                                            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                                                                                                                                                <div>
                                                                                                                                                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Percentage</div>
                                                                                                                                                    <div>{a.percentage != null ? `${a.percentage}%` : '-'}</div>
                                                                                                                                                </div>
                                                                                                                                                <div>
                                                                                                                                                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Marks</div>
                                                                                                                                                    <div>{a.score != null ? a.score : '-'}/{a.max_score != null ? a.max_score : '-'}</div>
                                                                                                                                                </div>
                                                                                                                                                <div>
                                                                                                                                                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Started</div>
                                                                                                                                                    <div>{a.startedAt ? formatDateTime(a.startedAt) : '-'}</div>
                                                                                                                                                </div>
                                                                                                                                                <div>
                                                                                                                                                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Completed</div>
                                                                                                                                                    <div>{a.completedAt ? formatDateTime(a.completedAt) : '-'}</div>
                                                                                                                                                </div>
                                                                                                                                            </div>
                                                                                                                                        </div>
                                                                                                                                    )
                                                                                                                                })}
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                    )}
                                                                                                                </div>
                                                                                                            )
                                                                                                        })}
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    )
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Quizzes Section */}
                                                            {(module.quizzes || []).length > 0 && (
                                                                <div className="mb-6 mr-8 ml-1">
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <FileQuestion className="w-4 h-4 text-slate-600" />
                                                                        <h5 className="text-sm font-semibold text-slate-700">
                                                                            Quizzes ({(module.quizzes || []).length})
                                                                        </h5>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {(module.quizzes || []).map((quiz, quizIdx) => {
                                                                            const quizStatus = getItemStatus(quiz)
                                                                            return (
                                                                                <div key={quiz.id} className="bg-white rounded-lg border border-slate-200">
                                                                                    <div
                                                                                        role="button"
                                                                                        tabIndex={0}
                                                                                        onClick={() => toggleQuizAttempts(quiz.id)}
                                                                                        onKeyDown={(e) => {
                                                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                                                e.preventDefault();
                                                                                                toggleQuizAttempts(quiz.id)
                                                                                            }
                                                                                        }}
                                                                                        aria-expanded={!!openQuizAttempts[quiz.id]}
                                                                                        className="p-3 hidden sm:flex items-center justify-between cursor-pointer select-none hover:bg-slate-50"
                                                                                    >
                                                                                        <div className="flex items-center gap-3">
                                                                                            <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium">
                                                                                                Q{quizIdx + 1}
                                                                                            </span>
                                                                                            <span className="text-sm font-medium text-slate-700 line-clamp-1 max-w-[220px] sm:max-w-none">{quiz.title}</span>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-3">
                                                                                            <span className="text-[11px] text-slate-500 hidden sm:block">
                                                                                                Attempts: {quiz.attempts?.length || 0}
                                                                                            </span>
                                                                                            {getStatusDisplay(quizStatus, "assessment")}
                                                                                            <ChevronDown
                                                                                                className={`w-4 h-4 text-slate-400 transition-transform ${openQuizAttempts[quiz.id] ? "rotate-180" : ""}`}
                                                                                            />
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Mobile attempts info */}
                                                                                    <div
                                                                                        role="button"
                                                                                        tabIndex={0}
                                                                                        onClick={() => toggleQuizAttempts(quiz.id)}
                                                                                        onKeyDown={(e) => {
                                                                                            if (e.key === "Enter" || e.key === " ") {
                                                                                                e.preventDefault();
                                                                                                toggleQuizAttempts(quiz.id);
                                                                                            }
                                                                                        }}
                                                                                        aria-expanded={!!openQuizAttempts[quiz.id]}
                                                                                        className="sm:hidden p-3 cursor-pointer select-none hover:bg-slate-50 border-b"
                                                                                    >
                                                                                        {/* ---------- ROW 1 (<sm): Q#, Title, Chevron ---------- */}
                                                                                        <div className="flex items-center justify-between">
                                                                                            <div className="flex items-center gap-3">
                                                                                                <span className="w-6 h-6 bg-lightGreen rounded-full flex items-center justify-center text-xs font-medium">
                                                                                                    Q{quizIdx + 1}
                                                                                                </span>

                                                                                                <span className="text-sm font-medium text-slate-700 line-clamp-1 max-w-[180px]">
                                                                                                    {quiz.title}
                                                                                                </span>
                                                                                            </div>

                                                                                            <ChevronDown
                                                                                                className={`w-4 h-4 text-slate-400 transition-transform ${openQuizAttempts[quiz.id] ? "rotate-180" : ""
                                                                                                    }`}
                                                                                            />
                                                                                        </div>

                                                                                        {/* ---------- ROW 2 (<sm): Expanded Details ---------- */}
                                                                                        <div className="mt-3 pl-9 flex items-center justify-between">
                                                                                            <span className="text-[12px] text-slate-600">
                                                                                                Attempts: {quiz.attempts?.length || 0}
                                                                                            </span>

                                                                                            <div className="flex items-center gap-2">
                                                                                                {getStatusDisplay(quizStatus, "assessment")}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    {openQuizAttempts[quiz.id] && quiz.attempts?.length > 0 && (
                                                                                        <div className="border-t border-slate-100 p-3 space-y-2 overflow-x-auto">
                                                                                            {/* Desktop Table */}
                                                                                            <div className="hidden sm:block border border-slate-200 rounded-lg overflow-hidden">
                                                                                                <div className="grid grid-cols-12 gap-3 px-4 py-3 text-[11px] font-semibold tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                                                                                                    <div className="col-span-2">Attempt No. (#)</div>
                                                                                                    <div className="col-span-2 text-center">Percentage</div>
                                                                                                    <div className="col-span-2 text-center">Marks</div>
                                                                                                    <div className="col-span-2 text-center">Started Date</div>
                                                                                                    <div className="col-span-2 text-center">Completed Date</div>
                                                                                                    <div className="col-span-2 text-center">Status</div>
                                                                                                </div>
                                                                                                {quiz.attempts.map((a, idx) => {
                                                                                                    const pass = a.passFail === "passed"
                                                                                                    return (
                                                                                                        <div key={a.attemptId} className="hidden sm:grid grid-cols-12 gap-3 items-center text-xs px-4 py-3 bg-white border-b last:border-b-0 border-slate-100 hover:bg-slate-50">
                                                                                                            <div className="col-span-2 font-medium">Attempt {idx + 1}</div>
                                                                                                            <div className="col-span-2 text-center">
                                                                                                                {a.percentage != null ? `${a.percentage}%` : '-'}
                                                                                                            </div>
                                                                                                            <div className="col-span-2 text-center">
                                                                                                                {a.obtainedMarks != null && a.totalMarks != null ? `${a.obtainedMarks}/${a.totalMarks}` : '-'}
                                                                                                            </div>
                                                                                                            <div className="col-span-2 text-center text-slate-600">
                                                                                                                {a.startedAt ? formatDateTime(a.startedAt) : '-'}
                                                                                                            </div>
                                                                                                            <div className="col-span-2 text-center text-slate-600">
                                                                                                                {a.completedAt ? formatDateTime(a.completedAt) : '-'}
                                                                                                            </div>
                                                                                                            <div className="col-span-2 text-center">
                                                                                                                <span className={`inline-flex px-2 py-0.5 rounded border ${pass ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                                                                                    {pass ? 'Passed' : 'Failed'}
                                                                                                                </span>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    )
                                                                                                })}
                                                                                            </div>

                                                                                            {/* Mobile Cards for Attempts */}
                                                                                            <div className="sm:hidden space-y-2">
                                                                                                {quiz.attempts.map((a, idx) => {
                                                                                                    const pass = a.passFail === "passed"
                                                                                                    return (
                                                                                                        <div key={a.attemptId} className="bg-white rounded border border-slate-200 p-3">
                                                                                                            <div className="flex items-center justify-between mb-2">
                                                                                                                <div className="font-medium text-sm">Attempt {idx + 1}</div>
                                                                                                                <span className={`inline-flex px-2 py-0.5 rounded text-xs border ${pass ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                                                                                    {pass ? 'Passed' : 'Failed'}
                                                                                                                </span>
                                                                                                            </div>

                                                                                                            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                                                                                                                <div>
                                                                                                                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Percentage</div>
                                                                                                                    <div>{a.percentage != null ? `${a.percentage}%` : '-'}</div>
                                                                                                                </div>
                                                                                                                <div>
                                                                                                                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Marks</div>
                                                                                                                    <div>{a.obtainedMarks != null && a.totalMarks != null ? `${a.obtainedMarks}/${a.totalMarks}` : '-'}</div>
                                                                                                                </div>
                                                                                                                <div>
                                                                                                                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Started</div>
                                                                                                                    <div>{a.startedAt ? formatDateTime(a.startedAt) : '-'}</div>
                                                                                                                </div>
                                                                                                                <div>
                                                                                                                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Completed</div>
                                                                                                                    <div>{a.completedAt ? formatDateTime(a.completedAt) : '-'}</div>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    )
                                                                                                })}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Assignments Section */}
                                                            {(module.assignments || []).length > 0 && (
                                                                <div className="mb-4 mr-8 ml-1">
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <Award className="w-4 h-4 text-slate-600" />
                                                                        <h5 className="text-sm font-semibold text-slate-700">
                                                                            Assignments ({(module.assignments || []).length})
                                                                        </h5>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {(module.assignments || []).map((assignment, assignmentIdx) => {
                                                                            const assignmentStatus = getItemStatus(assignment)
                                                                            return (
                                                                                <div key={assignment.id} className="bg-white rounded-lg border border-slate-200">
                                                                                    <div
                                                                                        role="button"
                                                                                        tabIndex={0}
                                                                                        onClick={() => toggleAssignmentAttempts(assignment.id)}
                                                                                        onKeyDown={(e) => {
                                                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                                                e.preventDefault();
                                                                                                toggleAssignmentAttempts(assignment.id)
                                                                                            }
                                                                                        }}
                                                                                        aria-expanded={!!openAssignmentAttempts[assignment.id]}
                                                                                        className="p-3 hidden sm:flex items-center justify-between cursor-pointer select-none hover:bg-slate-50"
                                                                                    >
                                                                                        <div className="flex items-center gap-3">
                                                                                            <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-xs font-medium">
                                                                                                A{assignmentIdx + 1}
                                                                                            </span>
                                                                                            <span className="text-sm font-medium text-slate-700 line-clamp-1 max-w-[200px] sm:max-w-none">
                                                                                                {assignment.title}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-3">
                                                                                            <span className="text-[11px] text-slate-500">
                                                                                                Attempts: {assignment.attempts?.length && assignment.attempts[0].triedAttempts != null ? `${assignment.attempts?.length}` : '0'}
                                                                                            </span>
                                                                                            {getStatusDisplay(assignmentStatus, "assessment")}
                                                                                            <ChevronDown
                                                                                                className={`w-4 h-4 text-slate-400 transition-transform ${openAssignmentAttempts[assignment.id] ? "rotate-180" : ""}`}
                                                                                            />
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Mobile attempts info */}
                                                                                    <div
                                                                                        role="button"
                                                                                        tabIndex={0}
                                                                                        onClick={() => toggleAssignmentAttempts(assignment.id)}
                                                                                        onKeyDown={(e) => {
                                                                                            if (e.key === "Enter" || e.key === " ") {
                                                                                                e.preventDefault();
                                                                                                toggleAssignmentAttempts(assignment.id);
                                                                                            }
                                                                                        }}
                                                                                        aria-expanded={!!openAssignmentAttempts[assignment.id]}
                                                                                        className="p-3 sm:hidden cursor-pointer select-none hover:bg-slate-50 border-b"
                                                                                    >
                                                                                        {/* ---------- ROW 1: Index, Title, Chevron ---------- */}
                                                                                        <div className="flex items-center justify-between">
                                                                                            <div className="flex items-center gap-3">
                                                                                                <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-xs font-medium">
                                                                                                    A{assignmentIdx + 1}
                                                                                                </span>

                                                                                                <span className="text-sm font-medium text-slate-700 line-clamp-1 max-w-[180px]">
                                                                                                    {assignment.title}
                                                                                                </span>
                                                                                            </div>

                                                                                            <ChevronDown
                                                                                                className={`w-4 h-4 text-slate-400 transition-transform ${openAssignmentAttempts[assignment.id] ? "rotate-180" : ""
                                                                                                    }`}
                                                                                            />
                                                                                        </div>

                                                                                        {/* ---------- ROW 2: Attempts + Status ---------- */}
                                                                                        <div className="mt-3 pl-9 flex items-center justify-between">
                                                                                            <span className="text-[12px] text-slate-600">
                                                                                                Attempts:{" "}
                                                                                                {assignment.attempts?.length &&
                                                                                                    assignment.attempts[0].triedAttempts != null
                                                                                                    ? assignment.attempts.length
                                                                                                    : "0"}
                                                                                            </span>

                                                                                            {getStatusDisplay(assignmentStatus, "assessment")}
                                                                                        </div>
                                                                                    </div>

                                                                                    {openAssignmentAttempts[assignment.id] && assignment.attempts?.length > 0 && (
                                                                                        <div className="border-t border-slate-100 p-3 space-y-2 overflow-x-auto">
                                                                                            {/* Desktop Table */}
                                                                                            <div className="hidden sm:block min-w-[880px] border border-slate-200 rounded-lg overflow-hidden">
                                                                                                <div className="grid grid-cols-12 gap-3 px-4 py-3 text-[11px] font-semibold tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                                                                                                    <div className="col-span-2">Attempt No. (#)</div>
                                                                                                    <div className="col-span-2 text-center">Percentage</div>
                                                                                                    <div className="col-span-2 text-center">Marks</div>
                                                                                                    <div className="col-span-2 text-center">Started Date</div>
                                                                                                    <div className="col-span-2 text-center">Completed Date</div>
                                                                                                    <div className="col-span-2 text-center">Status</div>
                                                                                                </div>
                                                                                                {assignment.attempts.map((a, idx) => {
                                                                                                    const pass = a.passFail === 'passed'
                                                                                                    return (
                                                                                                        <div key={a.attemptId} className="hidden sm:grid grid-cols-12 gap-3 items-center text-xs px-4 py-3 bg-white border-b last:border-b-0 border-slate-100 hover:bg-slate-50">
                                                                                                            <div className="col-span-2 font-medium">Attempt {idx + 1}</div>
                                                                                                            <div className="col-span-2 text-center">
                                                                                                                {a.percentage != null ? `${a.percentage}%` : '-'}
                                                                                                            </div>
                                                                                                            <div className="col-span-2 text-center">
                                                                                                                {a.score != null ? a.score : '-'}/{a.max_score != null ? a.max_score : '-'}
                                                                                                            </div>
                                                                                                            <div className="col-span-2 text-center text-slate-600">
                                                                                                                {a.startedAt ? formatDateTime(a.startedAt) : '-'}
                                                                                                            </div>
                                                                                                            <div className="col-span-2 text-center text-slate-600">
                                                                                                                {a.completedAt ? formatDateTime(a.completedAt) : '-'}
                                                                                                            </div>
                                                                                                            <div className="col-span-2 text-center">
                                                                                                                <span className={`inline-flex px-2 py-0.5 rounded border ${pass ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                                                                                    {pass ? 'Passed' : 'Failed'}
                                                                                                                </span>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    )
                                                                                                })}
                                                                                            </div>

                                                                                            {/* Mobile Cards for Attempts */}
                                                                                            <div className="sm:hidden space-y-2">
                                                                                                {assignment.attempts.map((a, idx) => {
                                                                                                    const pass = a.passFail === 'passed'
                                                                                                    return (
                                                                                                        <div key={a.attemptId} className="bg-white rounded border border-slate-200 p-3">
                                                                                                            <div className="flex items-center justify-between mb-2">
                                                                                                                <div className="font-medium text-sm">Attempt {idx + 1}</div>
                                                                                                                <span className={`inline-flex px-2 py-0.5 rounded text-xs border ${pass ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                                                                                    {pass ? 'Passed' : 'Failed'}
                                                                                                                </span>
                                                                                                            </div>

                                                                                                            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                                                                                                                <div>
                                                                                                                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Percentage</div>
                                                                                                                    <div>{a.percentage != null ? `${a.percentage}%` : '-'}</div>
                                                                                                                </div>
                                                                                                                <div>
                                                                                                                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Marks</div>
                                                                                                                    <div>{a.score != null ? a.score : '-'}/{a.max_score != null ? a.max_score : '-'}</div>
                                                                                                                </div>
                                                                                                                <div>
                                                                                                                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Started</div>
                                                                                                                    <div>{a.startedAt ? formatDateTime(a.startedAt) : '-'}</div>
                                                                                                                </div>
                                                                                                                <div>
                                                                                                                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Completed</div>
                                                                                                                    <div>{a.completedAt ? formatDateTime(a.completedAt) : '-'}</div>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    )
                                                                                                })}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {sessions.length === 0 && (
                    <div className="text-center py-20">
                        <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                        <p className="text-sm text-slate-500">No sessions found</p>
                    </div>
                )}
            </div>
        </div>
    )
}