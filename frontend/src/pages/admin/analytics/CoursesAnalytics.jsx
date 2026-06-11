/* eslint-disable react/prop-types */

"use client"

/* eslint-disable no-unused-vars */

import { useState } from "react"
import { useSelector } from "react-redux"

import {
    useGetCourseEnrollmentAnalyticsQuery,
    useGetCourseModuleAnalyticsQuery,
    useGetCourseTopicStrengthAnalyticsQuery,
    useGetCourseErrorAnalyticsAverageQuery,
    useGetAllCoursesModuleAnalyticsQuery,
    useGetAllCoursesTopicStrengthAnalyticsQuery,
    useGetAllCoursesErrorAnalyticsAverageQuery,
} from "../../../services/Ai_performace_tracking/allCoursesAnalyticsApi"

import { getAdminToken } from "../../../services/CookieService"

import { useGetCoursesQuery } from "../../../services/Course_Management/courseApi"
import AdminLoader from "../../../components/admin/AdminLoader"

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ComposedChart,
} from "recharts"

import {
    BarChart3,
    Users,
    BookOpen,
    TrendingUp,
    AlertTriangle,
    Clock,
    Target,
    PieChartIcon,
    Download,
    Filter,
    RefreshCw,
    Activity,
    Award,
    MoreHorizontal,
    ChevronDown,
    Search,
    ArrowUp,
    Brain,
    CheckCircle,
    XCircle,
} from "lucide-react"
import { useEffect } from "react"

// Enhanced color palette with gradients and modern colors
const COLORS = {
    primary: "#0f172a",
    secondary: "#475569",
    accent: "#3b82f6",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    purple: "#8b5cf6",
    pink: "#ec4899",
    indigo: "#6366f1",
    teal: "#14b8a6",
    gray: {
        50: "#f8fafc",
        100: "#f1f5f9",
        200: "#e2e8f0",
        300: "#cbd5e1",
        400: "#94a3b8",
        500: "#64748b",
        600: "#475569",
        700: "#334155",
        800: "#1e293b",
        900: "#0f172a",
    },
}

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6", "#6366f1"]

function CoursesAnalytics({ selectedCourse }) {

    // Get access_token from cookie service
    const { access_token } = getAdminToken()

    // Fetch courses for dropdown using RTK Query with filtering
    // const { data: coursesData, isLoading: loading, error } = useGetCoursesQuery({
    //     access_token,
    //     role,
    //     userId,
    //     // Only apply creatorType filter if user is admin and filter is not 'all'
    //     creatorType: role === 'admin' && creatorTypeFilter !== 'all' ? creatorTypeFilter : undefined
    // })

    // Single course queries
    const {
        data: enrollmentSummary,
        isLoading: isLoadingEnroll,
        error: errorEnroll,
    } = useGetCourseEnrollmentAnalyticsQuery(
        { courseId: selectedCourse, access_token },
        { skip: selectedCourse === "all" },
    )

    const {
        data: moduleAnalytics,
        isLoading: isLoadingModule,
        error: errorModule,
    } = useGetCourseModuleAnalyticsQuery({ courseId: selectedCourse, access_token }, { skip: selectedCourse === "all" })

    const {
        data: topicStrength,
        isLoading: isLoadingTopic,
        error: errorTopic,
    } = useGetCourseTopicStrengthAnalyticsQuery(
        { courseId: selectedCourse, access_token },
        { skip: selectedCourse === "all" },
    )

    const {
        data: errorAnalytics,
        isLoading: isLoadingError,
        error: errorError,
    } = useGetCourseErrorAnalyticsAverageQuery(
        { courseId: selectedCourse, access_token },
        { skip: selectedCourse === "all" },
    )

    // All courses queries
    const {
        data: allModuleAnalytics,
        isLoading: isLoadingAllModule,
        error: errorAllModule,
    } = useGetAllCoursesModuleAnalyticsQuery(access_token, { skip: selectedCourse !== "all" })

    const {
        data: allTopicStrength,
        isLoading: isLoadingAllTopic,
        error: errorAllTopic,
    } = useGetAllCoursesTopicStrengthAnalyticsQuery(access_token, { skip: selectedCourse !== "all" })

    const {
        data: allErrorAnalytics,
        isLoading: isLoadingAllError,
        error: errorAllError,
    } = useGetAllCoursesErrorAnalyticsAverageQuery(access_token, { skip: selectedCourse !== "all" })

    // Enhanced tooltip with better styling
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-xl">
                    <p className="font-semibold text-gray-900 mb-2 text-sm">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-gray-600">{entry.name}:</span>
                            <span className="font-medium text-gray-900">{entry.value}</span>
                        </div>
                    ))}
                </div>
            )
        }
        return null
    }

    // Enhanced loading component
    const LoadingCard = ({ className = "" }) => (
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`}>
            <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10  from-gray-200 to-gray-300 rounded-xl animate-pulse" />
                    <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-1/3" />
                        <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="h-32  from-gray-100 to-gray-200 rounded-xl animate-pulse" />
                    <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )

    // Render helpers
    const renderEnrollmentSummary = () => {
        if (!enrollmentSummary) return null

        const { course_info, summary } = enrollmentSummary.data || {}

        if (!course_info || !summary) return null

        // Prepare data for charts
        const enrollmentData = [
            { name: "Total", value: summary.total_enrollments, color: CHART_COLORS[0] },
            { name: "Completed", value: summary.completed_enrollments, color: CHART_COLORS[2] },
            { name: "Active", value: summary.active_enrollments, color: CHART_COLORS[1] },
        ]

        const completionData = [
            { name: "Completed", value: summary.completion_rate, color: CHART_COLORS[2] },
            { name: "Remaining", value: 100 - summary.completion_rate, color: COLORS.gray[300] },
        ]

        return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 mb-8">
                {/* Enhanced header with gradient */}
                <div className=" bg-lightGreen border-b border-gray-200 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3  bg-lightGreen rounded-xl shadow-lg">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-1">Enrollment Overview</h3>
                                <div className="space-y-1">
                                    <div className="font-semibold text-gray-800">{course_info.title}</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="p-6">
                    {/* Enhanced stats cards with gradients */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="group relative overflow-hidden  bg-leafGreen to-blue-100 border border-leafGreen/20 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-forestGreen uppercase tracking-wider mb-1">Total Students</p>
                                    <p className="text-3xl font-bold text-forestGreen">{summary.total_enrollments}</p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <ArrowUp className="h-4 w-4 text-green-500" />
                                        <span className="text-sm text-green-600 font-medium">+12%</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-lightGreen rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <Users className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="group relative overflow-hidden  from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-1">Completed</p>
                                    <p className="text-3xl font-bold text-green-900">{summary.completed_enrollments}</p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span className="text-sm text-green-600 font-medium">Success</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-green-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <Award className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="group relative overflow-hidden  bg-leafGreen border border-leafGreen/20 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-leafGreen uppercase tracking-wider mb-1">Active</p>
                                    <p className="text-3xl font-bold text-leafGreen">{summary.active_enrollments}</p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <Activity className="h-4 w-4 text-leafGreen" />
                                        <span className="text-sm text-leafGreen font-medium">Learning</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-lightGreen rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <Activity className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="group relative overflow-hidden  from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-1">COMPLETION Rate</p>
                                    <p className="text-3xl font-bold text-orange-900">{summary.completion_rate}%</p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <Target className="h-4 w-4 text-orange-500" />
                                        <span className="text-sm text-orange-600 font-medium">Target</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-orange-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <Target className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced charts with better styling */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Enhanced bar chart */}
                        <div className=" from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                    <div className="p-2  bg-lightGreen rounded-lg">
                                        <BarChart3 className="h-5 w-5 text-white" />
                                    </div>
                                    Enrollment Distribution
                                </h4>

                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={enrollmentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.6} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }}
                                        axisLine={{ stroke: "#e2e8f0" }}
                                    />
                                    <YAxis tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }} axisLine={{ stroke: "#e2e8f0" }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar
                                        dataKey="value"
                                        fill="url(#barGradient)"
                                        radius={[8, 8, 0, 0]}
                                        stroke="#1d4ed8"
                                        strokeWidth={1}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Enhanced pie chart */}
                        <div className=" from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                    <div className="p-2  from-green-500 to-emerald-600 rounded-lg">
                                        <PieChartIcon className="h-5 w-5 text-white" />
                                    </div>
                                    Completion Rate
                                </h4>
                                <div className="text-right  from-green-50 to-emerald-50 p-3 rounded-xl border border-green-200">
                                    <div className="text-2xl font-bold text-green-900">{summary.completion_rate}%</div>
                                    <div className="text-sm text-green-600 font-medium">Completion Rate</div>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <PieChart>
                                    <defs>
                                        <linearGradient id="pieGradient1" x1="0" y1="0" x2="1" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                                        </linearGradient>
                                        <linearGradient id="pieGradient2" x1="0" y1="0" x2="1" y2="1">
                                            <stop offset="0%" stopColor="#e2e8f0" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#cbd5e1" stopOpacity={1} />
                                        </linearGradient>
                                    </defs>
                                    <Pie
                                        data={completionData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value }) => `${name}: ${value}%`}
                                        outerRadius={110}
                                        innerRadius={50}
                                        fill="#10b981"
                                        dataKey="value"
                                        stroke="#fff"
                                        strokeWidth={3}
                                    >
                                        {completionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? "url(#pieGradient1)" : "url(#pieGradient2)"} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const renderModuleAnalytics = () => {
        const data = selectedCourse === "all" ? allModuleAnalytics : moduleAnalytics

        if (!data) return null

        const analytics = data.data || data

        if (selectedCourse === "all") {
            // Prepare data for charts
            const chartData = analytics.map((course) => ({
                name: course.title.length > 15 ? course.title.substring(0, 15) + "..." : course.title,
                fullName: course.title,
                score: course.average_module_score,
                skill: course.average_module_skill,
                time: course.average_time_spent_on_module,
                modules: course.module_count,
            }))

            return (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 mb-8">
                    {/* Enhanced header */}
                    <div className=" bg-leafGreen  border-b border-gray-200 p-4 sm:p-6 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3  bg-leafGreen  rounded-xl shadow-lg">
                                    <BookOpen className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Module Analytics</h3>
                                    <p className="text-gray-500 text-xs sm:text-sm mt-1">Performance insights across all modules</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right bg-white/50 p-3 rounded-xl border border-leafGreen/20">
                                    <div className="text-xs sm:text-sm text-leafGreen font-medium"><span className="hidden sm:inline">Total </span>Courses</div>
                                    <div className="text-lg sm:text-xl font-bold text-leafGreen">{analytics.length}</div>
                                </div>
                                {/* <div className="flex gap-2">
                                    <button className="p-3 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-xl transition-all duration-200">
                                        <Filter className="h-4 w-4" />
                                    </button>
                                    <button className="p-3 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-xl transition-all duration-200">
                                        <Download className="h-4 w-4" />
                                    </button>
                                </div> */}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6">
                        {/* Enhanced charts */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-8 mb-4 sm:mb-8">
                            {/* Enhanced composed chart */}
                            <div className=" from-gray-50 to-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
                                {/* Header */}
                                <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-indigo-500" /> Performance Analysis
                                </h2>
                                <ResponsiveContainer width="100%" height={320}>
                                    <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="barGradient2" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
                                                <stop offset="100%" stopColor="#4338ca" stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                                            axisLine={{ stroke: "#e2e8f0" }}
                                        />
                                        <YAxis tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} axisLine={{ stroke: "#e2e8f0" }} width={30} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Bar
                                            dataKey="score"
                                            fill="url(#barGradient2)"
                                            name="Avg Score"
                                            radius={[4, 4, 0, 0]}
                                            stroke="#4338ca"
                                            strokeWidth={1}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="skill"
                                            stroke="#8b5cf6"
                                            strokeWidth={3}
                                            name="Avg Skill"
                                            dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6, stroke: "#8b5cf6", strokeWidth: 2 }}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Enhanced area chart */}
                            <div className=" from-gray-50 to-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
                                {/* Header */}
                                <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-indigo-500" /> Time Investment
                                </h2>
                                <ResponsiveContainer width="100%" height={320}>
                                    <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                                                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                                            axisLine={{ stroke: "#e2e8f0" }}
                                        />
                                        <YAxis tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} axisLine={{ stroke: "#e2e8f0" }} width={30} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="time"
                                            stroke="#f59e0b"
                                            fill="url(#areaGradient)"
                                            name="Time (min)"
                                            strokeWidth={3}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Enhanced table */}
                        <div className=" from-gray-50 to-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                            <div className=" from-gray-100 to-gray-50 sm:px-6 p-4 border-b border-gray-200">
                                {/* Header */}
                                <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-indigo-500" /> Course Details
                                </h2>
                            </div>
                            {/* Card layout for <md */}
                            <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto max-h-[480px] custom-scrollbar">
                                {analytics.map((course) => (
                                    <div
                                        key={course.course_id}
                                        className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
                                    >
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="font-semibold text-gray-600">Avg Score</span>
                                                <span className="px-3 py-1 bg-lightGreen text-forestGreen rounded-lg font-medium">
                                                    {course.average_module_score}
                                                </span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="font-semibold text-gray-600">Avg Skill</span>
                                                <span className="px-3 py-1 bg-lightGreen text-leafGreen rounded-lg font-medium">
                                                    {course.average_module_skill}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-gray-600">Time Spent</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1 bg-orange-100 rounded">
                                                        <Clock className="h-4 w-4 text-orange-600" />
                                                    </div>
                                                    <span className="font-medium text-gray-800">{course.average_time_spent_on_module} min</span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="font-semibold text-gray-600">Modules</span>
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg font-medium">
                                                    {course.module_count}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Table layout for ≥md */}
                            <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[480px] custom-scrollbar">
                                <table className="w-full">
                                    <thead className=" from-gray-50 to-gray-100">
                                        <tr>
                                            <th className="text-left p-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Course</th>
                                            <th className="text-left p-4 text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                Avg Score
                                            </th>
                                            <th className="text-left p-4 text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                Avg Skill
                                            </th>
                                            <th className="text-left p-4 text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                Time Spent
                                            </th>
                                            <th className="text-left p-4 text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                Modules
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {analytics.map((course, index) => (
                                            <tr
                                                key={course.course_id}
                                                className="hover: hover:bg-leafGreen hover: transition-all duration-200"
                                            >
                                                <td className="p-4 font-semibold text-gray-900">{course.title}</td>
                                                <td className="p-4">
                                                    <span className="px-3 py-2  bg-leafGreen to-blue-200 text-forestGreen rounded-lg text-sm font-semibold">
                                                        {course.average_module_score}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="px-3 py-2  bg-leafGreen text-leafGreen rounded-lg text-sm font-semibold">
                                                        {course.average_module_skill}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <div className="p-1 bg-orange-100 rounded">
                                                            <Clock className="h-4 w-4 text-orange-600" />
                                                        </div>
                                                        <span className="font-medium">{course.average_time_spent_on_module} min</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="px-3 py-2  from-green-100 to-green-200 text-green-800 rounded-lg text-sm font-semibold">
                                                        {course.module_count}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )
        } else {
            // Single course module analytics
            const moduleData = [
                { name: "Score", value: analytics.average_module_score, max: 100 },
                { name: "Skill", value: analytics.average_module_skill, max: 100 },
                { name: "Time", value: analytics.average_time_spent_on_module, max: 120 },
                { name: "Modules", value: analytics.module_count, max: 20 },
            ]

            return (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 mb-8">
                    <div className=" bg-leafGreen  border-b border-gray-200 p-6 rounded-t-2xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3  bg-leafGreen  rounded-xl shadow-lg">
                                <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-1">Module Performance</h3>
                                <p className="text-gray-600">Detailed performance metrics</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Enhanced stats grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className=" bg-leafGreen to-blue-100 border border-leafGreen/20 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
                                    <p className="text-sm font-semibold text-forestGreen mb-2">Average Score</p>
                                    <p className="text-3xl font-bold text-forestGreen mb-3">{analytics.average_module_score}</p>
                                    <div className="w-full bg-lightGreen rounded-full h-3">
                                        <div
                                            className=" bg-leafGreen to-blue-600 h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${analytics.average_module_score}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className=" bg-leafGreen border border-leafGreen/20 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
                                    <p className="text-sm font-semibold text-leafGreen mb-2">Average Skill</p>
                                    <p className="text-3xl font-bold text-leafGreen mb-3">{analytics.average_module_skill}</p>
                                    <div className="w-full bg-lightGreen rounded-full h-3">
                                        <div
                                            className=" bg-leafGreen h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${analytics.average_module_skill}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className=" from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
                                    <p className="text-sm font-semibold text-orange-600 mb-2">Time Spent (min)</p>
                                    <p className="text-3xl font-bold text-orange-900 flex items-center gap-2">
                                        <Clock className="h-6 w-6 text-orange-600" />
                                        {analytics.average_time_spent_on_module}
                                    </p>
                                </div>

                                <div className=" from-green-50 to-green-100 border border-green-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
                                    <p className="text-sm font-semibold text-green-600 mb-2">Module Count</p>
                                    <p className="text-3xl font-bold text-green-900">{analytics.module_count}</p>
                                </div>
                            </div>

                            {/* Enhanced radar chart */}
                            <div className=" from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Brain className="h-5 w-5 text-indigo-600" />
                                    Performance Overview
                                </h4>
                                <ResponsiveContainer width="100%" height={280}>
                                    <RadarChart data={moduleData}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }} />
                                        <PolarRadiusAxis
                                            angle={90}
                                            domain={[0, "dataMax"]}
                                            tick={{ fontSize: 10, fill: "#64748b", fontWeight: 500 }}
                                        />
                                        <Radar
                                            name="Performance"
                                            dataKey="value"
                                            stroke="#6366f1"
                                            fill="#6366f1"
                                            fillOpacity={0.2}
                                            strokeWidth={3}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    }

    const renderTopicStrength = () => {
        const data = selectedCourse === "all" ? allTopicStrength : topicStrength

        if (!data) return null

        const analytics = data.data || data

        if (selectedCourse != "all") {
            const weakTopics = analytics.most_weak_topics || []
            const strongTopics = analytics.most_strong_topics || []

            const topicComparisonData = [
                {
                    category: "Weak Topics",
                    average: weakTopics.reduce((acc, t) => acc + t.average_score, 0) / weakTopics.length || 0,
                },
                {
                    category: "Strong Topics",
                    average: strongTopics.reduce((acc, t) => acc + t.average_score, 0) / strongTopics.length || 0,
                },
            ]

            return (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 mb-8">
                    <div className=" from-emerald-50 to-teal-50 border-b border-gray-200 p-6 rounded-t-2xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3  from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                                <TrendingUp className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-1">Topic Performance</h3>
                                <p className="text-gray-600">Strengths and areas for improvement</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Enhanced comparison chart */}
                            <div className=" from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                                    Average Performance
                                </h4>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={topicComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="weakGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                                                <stop offset="100%" stopColor="#dc2626" stopOpacity={1} />
                                            </linearGradient>
                                            <linearGradient id="strongGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                                                <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="category"
                                            tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                                            axisLine={{ stroke: "#e2e8f0" }}
                                        />
                                        <YAxis tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} axisLine={{ stroke: "#e2e8f0" }} width={30} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="average" radius={[8, 8, 0, 0]} stroke="#fff" strokeWidth={2}>
                                            {topicComparisonData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={index === 0 ? "url(#weakGradient)" : "url(#strongGradient)"}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Enhanced topic lists */}
                            <div>
                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <div className="p-1 bg-red-100 rounded">
                                        <AlertTriangle className="h-4 w-4 text-red-600" />
                                    </div>
                                    Areas for Improvement
                                </h4>
                                <div className="space-y-3">
                                    {weakTopics.map((t, i) => (
                                        <div
                                            key={i}
                                            className="flex justify-between items-center p-4  from-red-50 to-red-100 rounded-xl border border-red-200 hover:shadow-md transition-all duration-200"
                                        >
                                            <span className="text-sm font-semibold text-gray-900">{t.title}</span>
                                            <span className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-bold shadow-sm">
                                                {t.average_score}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <div className="p-1 bg-green-100 rounded">
                                        <Award className="h-4 w-4 text-green-600" />
                                    </div>
                                    Strong Performers
                                </h4>
                                <div className="space-y-3">
                                    {strongTopics.map((t, i) => (
                                        <div
                                            key={i}
                                            className="flex justify-between items-center p-4  from-green-50 to-green-100 rounded-xl border border-green-200 hover:shadow-md transition-all duration-200"
                                        >
                                            <span className="text-sm font-semibold text-gray-900">{t.title}</span>
                                            <span className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-bold shadow-sm">
                                                {t.average_score}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    }

    const renderErrorAnalytics = () => {
        const data = selectedCourse === "all" ? allErrorAnalytics : errorAnalytics

        if (!data) return null

        const analytics = data.data || data

        if (selectedCourse === "all") {
            const errorChartData = analytics.map((course) => {
                const errorEntries = Object.entries(course.error_analytics_avg || {})
                const avgError =
                    errorEntries.reduce((acc, [key, val]) => acc + Number.parseFloat(val || 0), 0) / errorEntries.length || 0

                return {
                    name: course.title.length > 15 ? course.title.substring(0, 15) + "..." : course.title,
                    fullName: course.title,
                    avgError: avgError.toFixed(2),
                    ...course.error_analytics_avg,
                }
            })

            return (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 mb-4 sm:mb-8">
                    <div className=" from-red-50 to-orange-50 border-b border-gray-200 p-4 sm:p-6 rounded-t-2xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3  from-red-500 to-orange-600 rounded-xl shadow-lg">
                                <AlertTriangle className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Error Analytics</h3>
                                <p className="text-gray-500 text-xs sm:text-sm mt-1">Track and analyze error patterns</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6">
                        {/* Enhanced error trend chart */}
                        <div className=" from-gray-50 to-white border border-gray-200 rounded-xl p-4 sm:p-6 mb-4 sm:mb-8 hover:shadow-lg transition-all duration-300">
                            {/* Header */}
                            <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-500" /> Error Rate Trends
                            </h2>
                            <ResponsiveContainer width="100%" height={320}>
                                <LineChart data={errorChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="errorGradient" x1="0" y1="0" x2="1" y2="1">
                                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#dc2626" stopOpacity={1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                                        axisLine={{ stroke: "#e2e8f0" }}
                                    />
                                    <YAxis tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} axisLine={{ stroke: "#e2e8f0" }} width={30} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line
                                        type="monotone"
                                        dataKey="avgError"
                                        stroke="url(#errorGradient)"
                                        strokeWidth={3}
                                        name="Avg Error Rate"
                                        dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Enhanced table */}
                        <div className=" from-gray-50 to-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                            <div className=" from-gray-100 to-gray-50 px-6 py-4 border-b border-gray-200">
                                {/* Header */}
                                <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                                    Error Details
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className=" from-gray-50 to-gray-100">
                                        <tr>
                                            <th className="text-left p-4 text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">Course</th>
                                            <th className="text-left p-4 text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                Error Analytics
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {analytics.map((course) => (
                                            <tr
                                                key={course.course_id}
                                                className="hover: hover:from-red-50 hover:to-orange-50 transition-all duration-200"
                                            >
                                                <td className="p-4 text-sm sm:text-md font-semibold text-gray-900">{course.title}</td>
                                                <td className="p-4 text-sm sm:text-md ">
                                                    <div className="flex flex-wrap gap-2">
                                                        {course.error_analytics_avg &&
                                                            Object.entries(course.error_analytics_avg).map(([key, val]) => (
                                                                <div
                                                                    key={key}
                                                                    className="flex items-center gap-2 text-sm  from-red-100 to-orange-100 px-3 py-2 rounded-lg border border-red-200"
                                                                >
                                                                    <span className="text-gray-700 font-medium">{key}:</span>
                                                                    <span className="px-2 py-1 bg-red-500 text-white rounded text-xs font-bold">
                                                                        {val}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )
        } else {
            const errorEntries = Object.entries(analytics || {})

            const errorData = errorEntries.map(([key, val]) => ({
                name: key,
                value: Number.parseFloat(val || 0),
            }))

            return (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 mb-8">
                    <div className=" from-red-50 to-orange-50 border-b border-gray-200 p-6 rounded-t-2xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3  from-red-500 to-orange-600 rounded-xl shadow-lg">
                                <AlertTriangle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-1">Error Analysis</h3>
                                <p className="text-gray-600">Detailed error breakdown and insights</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Enhanced error distribution chart */}
                            <div className=" from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <div className="p-2  from-red-500 to-orange-600 rounded-lg">
                                        <PieChartIcon className="h-5 w-5 text-white" />
                                    </div>
                                    Error Distribution
                                </h4>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <defs>
                                            {CHART_COLORS.map((color, index) => (
                                                <linearGradient key={index} id={`errorPieGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                                                    <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                                                    <stop offset="100%" stopColor={color} stopOpacity={1} />
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <Pie
                                            data={errorData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value }) => `${name}: ${value}`}
                                            outerRadius={90}
                                            innerRadius={30}
                                            fill="#ef4444"
                                            dataKey="value"
                                            stroke="#fff"
                                            strokeWidth={3}
                                        >
                                            {errorData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={`url(#errorPieGradient${index % CHART_COLORS.length})`} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Enhanced error details */}
                            <div className="space-y-4">
                                <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <XCircle className="h-5 w-5 text-red-600" />
                                    Error Breakdown
                                </h4>
                                {errorEntries.map(([key, val], index) => (
                                    <div
                                        key={key}
                                        className="flex justify-between items-center p-4  from-red-50 to-orange-50 border border-red-200 rounded-xl hover:shadow-md transition-all duration-200"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                                            />
                                            <span className="font-semibold text-gray-900">{key}</span>
                                        </div>
                                        <span className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold shadow-sm">
                                            {val}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    }

    // Loading and error states for analytics
    const analyticsLoading =
        selectedCourse === "all"
            ? isLoadingAllModule || isLoadingAllTopic || isLoadingAllError
            : isLoadingEnroll || isLoadingModule || isLoadingTopic || isLoadingError

    const analyticsError =
        selectedCourse === "all"
            ? errorAllModule || errorAllTopic || errorAllError
            : errorEnroll || errorModule || errorTopic || errorError

    return (
        <div className="min-h-screen bg-white">
            {/* Enhanced header with gradient background */}
            {/* <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200  top-0 z-10 shadow-sm">
                <div className="container mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3  bg-lightGreen rounded-xl shadow-lg">
                                <BarChart3 className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold  from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                    Analytics Dashboard
                                </h1>
                                <p className="text-gray-600 mt-1 text-lg">Comprehensive course analytics and insights</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-xl transition-all duration-200 border border-gray-200">
                                <Filter className="h-5 w-5" />
                            </button>
                            <button className="px-6 py-3  bg-lightGreen text-white rounded-xl hover:bg-leafGreen hover: transition-all duration-200 shadow-lg font-semibold">
                                <Download className="h-5 w-5 inline mr-2" />
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            </div> */}

            <div className="container mx-auto space-y-8">
                {/* Enhanced course selection */}
                {/* <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="p-4 sm:p-6">
                        {loading ? (
                            <div className="space-y-4">
                                <div className="h-4  from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
                                <div className="h-12  from-gray-100 to-gray-200 rounded-xl animate-pulse"></div>
                            </div>
                        ) : error ? (
                            <div className="flex items-center p-6  from-red-50 to-red-100 border border-red-200 rounded-xl">
                                <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                                <div>
                                    <h4 className="font-semibold text-red-800">Failed to load courses</h4>
                                    <p className="text-red-700 text-sm">{error}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {role == "admin" && (
                                    <div className="hidden sm:inline-flex flex gap-4">
                                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Creator Type</label>
                                        <select
                                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                                            value={creatorTypeFilter}
                                            onChange={handleCreatorTypeChange}
                                        >
                                            <option value="all">All</option>
                                            <option value="admin">Admin</option>
                                            <option value="partner">Partner</option>
                                        </select>
                                    </div>
                                )}

                                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Select Course</label>
                                <div className="relative">
                                    <select
                                        value={selectedCourse}
                                        onChange={handleCourseChange}
                                        className="w-full p-4 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm text-gray-900 font-medium appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                                    >
                                        <option value="all">🌟 All Courses Overview</option>
                                        {courses.map((course) => (
                                            <option key={course.id} value={course.id}>
                                                📚 {course.title}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        )}
                    </div>
                </div> */}

                {/* Analytics content */}
                {analyticsLoading ? (
                    <AdminLoader className="h-screen" message="Analyzing course data..." />
                ) : analyticsError ? (
                    <div className="bg-white rounded-2xl border border-red-200 shadow-sm">
                        <div className="p-12 text-center">
                            <div className="p-4 bg-red-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                                <AlertTriangle className="h-10 w-10 text-red-600" />
                            </div>
                            <h4 className="text-2xl font-bold text-gray-900 mb-3">Unable to fetch analytics data</h4>
                            <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                We&apos;re having trouble loading your analytics. Please check your connection and try again.
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3  from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg font-semibold"
                            >
                                <RefreshCw className="h-5 w-5 inline mr-2" />
                                Retry Loading
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {renderEnrollmentSummary()}
                        {renderModuleAnalytics()}
                        {renderTopicStrength()}
                        {renderErrorAnalytics()}
                    </div>
                )}
            </div>
        </div>
    )
}

export default CoursesAnalytics
