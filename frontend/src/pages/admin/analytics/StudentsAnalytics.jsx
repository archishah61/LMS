/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
"use client"

import { useState, useEffect } from "react"

import { useDispatch, useSelector } from "react-redux"

import {
  useGetEnrolledStudentsQuery,
  useGetStudentEnrollmentsQuery,
  useGetStudentAnalyticsQuery,
  useGetStudentVersionsQuery,
  useGetTopicStrengthAnalysisQuery,
  useGetTimeSpentAnalysisQuery,
  useGetModuleCompletionQuery,
  useGetModulesByCourseQuery,
  useGetVersionComparisonQuery,
  useGetErrorAnalysisQuery,
} from "../../../services/Ai_performace_tracking/adminStudentPerformanceAnalyticsApi"

import ErrorAnalysisTab from "./ErrorAnalysisTab"

import { formatTimeDisplay, secondsToMinutes } from "../../../utils/timeFormatting"
import { Filter as FilterIcon } from "lucide-react"

import {
  setSelectedStudent,
  setStudentEnrollments,
  setSelectedCourseId,
  setCurrentAnalytics,
  setAvailableVersions,
  setModules,
  setSelectedModuleId,
  toggleFilterPanel,
  setVersionComparison,
  setErrorAnalysisData,
} from "../../../features/Ai_performance_tracking/adminStudentPerformanceAnalyticsSlice"

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  Area,
  AreaChart,
} from "recharts"

import {
  Clock,
  TrendingUp,
  ClipboardList,
  Filter,
  X,
  GitCompare,
  AlertTriangle,
  BookOpen,
  Target,
  Award,
  Activity,
  BarChart3,
  PieChartIcon,
  TrendingDown,
  Calendar,
  Timer,
  Brain,
  Zap,
  Star,
  Trophy,
  Flame,
  Sparkles,
  ChevronRight,
  Users,
  GraduationCap,
  BookMarked,
  ChevronDown,
} from "lucide-react"

// Enhanced color palette for charts with gradients

const CHART_COLORS = {
  primary: ["#667eea", "#764ba2", "#f093fb", "#f5576c"],

  success: ["#11998e", "#38ef7d", "#00b09b", "#96c93d"],

  warning: ["#f093fb", "#f5576c", "#4facfe", "#00f2fe"],

  danger: ["#ff9a9e", "#fecfef", "#ffecd2", "#fcb69f"],

  info: ["#667eea", "#764ba2", "#a8edea", "#fed6e3"],

  purple: ["#667eea", "#764ba2", "#f093fb", "#f5576c"],

  gradients: {
    blue: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",

    green: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",

    orange: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",

    purple: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",

    pink: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",

    cyan: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  },
}

const ENHANCED_COLORS = [
  "#667eea",

  "#764ba2",

  "#f093fb",

  "#f5576c",

  "#4facfe",

  "#00f2fe",

  "#11998e",

  "#38ef7d",

  "#ff9a9e",

  "#fecfef",

  "#a8edea",

  "#fed6e3",
]

// Custom Card Components with enhanced styling

const Card = ({ children, className = "", gradient = false, ...props }) => (
  <div
    className={`bg-white rounded-lg shadow-lg border-0 overflow-hidden transition-all duration-200 hover:shadow-xl ${gradient ? " from-white via-blue-50 " : ""
      } ${className}`}
    {...props}
  >
    {children}
  </div>
)

const CardHeader = ({ children, className = "", ...props }) => (
  <div className={`px-8 py-6 border-b border-gray-100  from-gray-50 to-white ${className}`} {...props}>
    {children}
  </div>
)

const CardContent = ({ children, className = "", ...props }) => (
  <div className={`sm:px-8 sm:py-6 p-4 ${className}`} {...props}>
    {children}
  </div>
)

const CardTitle = ({ children, className = "", gradient = false, ...props }) => (
  <h3
    className={`text-xl font-bold ${gradient
      ? " text-forestGreen"
      : "text-gray-900"
      } ${className}`}
    {...props}
  >
    {children}
  </h3>
)

const CardDescription = ({ children, className = "", ...props }) => (
  <p className={`text-sm text-gray-600 mt-2 leading-relaxed ${className}`} {...props}>
    {children}
  </p>
)

// Enhanced Badge Component with more styles

const Badge = ({ children, variant = "default", className = "", glow = false, ...props }) => {
  const variants = {
    default: " from-gray-100 to-gray-200 text-gray-800 border border-gray-300",

    secondary: " from-slate-100 to-slate-200 text-slate-800 border border-slate-300",

    success: " from-emerald-100 to-green-200 text-emerald-800 border border-emerald-300",

    destructive: " from-red-100 to-rose-200 text-red-800 border border-red-300",

    warning: " from-amber-100 to-yellow-200 text-amber-800 border border-amber-300",

    info: " bg-lightGreen text-forestGreen border border-leafGreen/30",

    outline: "border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50",

    premium: " bg-leafGreen text-white shadow-lg",
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${glow ? "shadow-md shadow-current/20" : ""
        } ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

// Enhanced Progress Component with gradient

const Progress = ({ value = 0, className = "", gradient = true, ...props }) => (
  <div className={`w-full bg-gray-200 rounded-md h-3 overflow-hidden shadow-inner ${className}`} {...props}>
    <div
      className={`h-full transition-all duration-500 ease-out ${gradient ? " bg-leafGreen" : "bg-lightGreen"
        } shadow-sm`}
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
)

// Enhanced Button Component

const Button = ({
  children,

  variant = "default",

  size = "default",

  className = "",

  disabled = false,

  glow = false,

  ...props
}) => {
  const variants = {
    default:
      " bg-leafGreen text-white shadow-md hover:shadow-lg",

    outline:
      "border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm hover:shadow-md",

    secondary:
      " from-gray-100 to-gray-200 text-gray-900 hover:from-gray-200 hover:to-gray-300 shadow-sm hover:shadow-md",

    premium:
      " bg-leafGreen text-white shadow-md hover:shadow-lg",
  }

  const sizes = {
    default: "px-6 py-3 text-sm",

    sm: "px-4 py-2 text-xs",

    lg: "px-8 py-4 text-base",
  }

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md font-semibold transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-leafGreen/25 disabled:opacity-50 disabled:pointer-events-none ${glow ? "shadow-lg shadow-current/20" : ""
        } ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

// Enhanced Tabs Components

const Tabs = ({ children, value, onValueChange, className = "", ...props }) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
)

const TabsList = ({ children, className = "", ...props }) => (
  <div
    className={`inline-flex items-center justify-center rounded-lg  from-gray-100 via-white to-gray-100 p-2 shadow-md border border-gray-200 ${className}`}
    {...props}
  >
    {children}
  </div>
)

const TabsTrigger = ({ children, value, isActive, onClick, className = "", ...props }) => (
  <button
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leafGreen focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isActive
      ? " bg-leafGreen text-white shadow-md"
      : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm"
      } ${className}`}
    onClick={() => onClick(value)}
    {...props}
  >
    {children}
  </button>
)

const TabsContent = ({ children, value, activeValue, className = "", ...props }) => (
  <div
    className={`mt-6 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leafGreen focus-visible:ring-offset-2 ${value === activeValue ? "block animate-in fade-in-50 slide-in-from-bottom-2 duration-200" : "hidden"
      } ${className}`}
    {...props}
  >
    {children}
  </div>
)

// Enhanced placeholder component

const NoStudentSelected = () => (
  <Card className="h-[60vh] flex items-center justify-center" gradient>
    <CardContent className="text-center p-12">
      <div className="w-32 h-32 mx-auto mb-8  bg-leafGreen rounded-lg flex items-center justify-center shadow-lg">
        <Users size={64} className="text-white" />
      </div>

      <CardTitle className="text-2xl mb-4" gradient>
        Select a Student to Begin
      </CardTitle>

      <CardDescription className="text-lg max-w-md mx-auto">
        Choose a student from the dropdown above to explore their comprehensive performance analytics, learning
        insights, and progress tracking.
      </CardDescription>

      <div className="flex justify-center mt-8 space-x-4">
        <div className="flex items-center space-x-2 text-forestGreen">
          <BarChart3 size={20} />

          <span className="text-sm font-medium">Performance Analytics</span>
        </div>

        <div className="flex items-center space-x-2 text-leafGreen">
          <Brain size={20} />

          <span className="text-sm font-medium">Learning Insights</span>
        </div>

        <div className="flex items-center space-x-2 text-indigo-600">
          <Trophy size={20} />

          <span className="text-sm font-medium">Progress Tracking</span>
        </div>
      </div>
    </CardContent>
  </Card>
)

// Enhanced loading indicator

const LoadingIndicator = () => (
  <div className="flex justify-center items-center py-12">
    <div className="relative">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-leafGreen/20"></div>

      <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-600 absolute top-0"></div>

      <div className="absolute inset-0 flex items-center justify-center">
        <Sparkles size={24} className="text-forestGreen animate-pulse" />
      </div>
    </div>
  </div>
)

// Enhanced metric card component

const MetricCard = ({ title, value, icon: Icon, trend, color = "blue", description, premium = false }) => (
  <Card
    className={`relative overflow-hidden border-l-4 ${premium ? "border-l-purple-500" : `border-l-${color}-500`} group`}
    gradient={premium}
  >
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">{title}</p>

          <p
            className={`text-3xl font-bold ${premium ? " bg-leafGreen  bg-clip-text text-transparent" : `text-${color}-600`} mb-1`}
          >
            {value}
          </p>

          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>

        <div
          className={`p-4 ${premium ? " bg-leafGreen " : `bg-${color}-100`} rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-200`}
        >
          <Icon size={28} className={premium ? "text-white" : `text-${color}-600`} />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center">
          <Badge variant={trend > 0 ? "success" : "destructive"} className="text-xs font-bold" glow>
            {trend > 0 ? "+" : ""}
            {trend}%
          </Badge>
        </div>
      )}

      {premium && (
        <div className="absolute top-2 right-2">
          <Star size={16} className="text-yellow-400 fill-current" />
        </div>
      )}
    </CardContent>
  </Card>
)

// Custom Chart Tooltip

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>

        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span> {entry.value}
            {entry.name.includes("Score") && "%"}
            {entry.name.includes("Time") && " min"}
          </p>
        ))}
      </div>
    )
  }

  return null
}

// Main component

function StudentsAnalytics() {
  const dispatch = useDispatch()

  const user = useSelector((state) => state.user)
  // const role = user?.role;

  const [currentTab, setCurrentTab] = useState(0)

  // Helper functions

  const getInitial = (name) => {
    return name && name.length > 0 ? name.charAt(0).toUpperCase() : "?"
  }

  const formatTime = (timeValue, unit = "seconds") => {
    if (timeValue === undefined || timeValue === null) return "N/A"

    const timeInMinutes = unit === "seconds" ? secondsToMinutes(timeValue) : timeValue

    return formatTimeDisplay(timeInMinutes)
  }

  // Redux state

  const selectedStudent = useSelector((state) => state.adminStudentPerformanceAnalytics.selectedStudent)

  const studentEnrollments = useSelector((state) => state.adminStudentPerformanceAnalytics.studentEnrollments)

  const selectedCourseId = useSelector((state) => state.adminStudentPerformanceAnalytics.selectedCourseId)

  const currentAnalytics = useSelector((state) => state.adminStudentPerformanceAnalytics.currentAnalytics)

  const availableVersions = useSelector((state) => state.adminStudentPerformanceAnalytics.availableVersions)

  const modules = useSelector((state) => state.adminStudentPerformanceAnalytics.modules)

  const selectedModuleId = useSelector((state) => state.adminStudentPerformanceAnalytics.selectedModuleId)

  const isFilterOpen = useSelector((state) => state.adminStudentPerformanceAnalytics.isFilterOpen)

  const errorAnalysisData = useSelector((state) => state.adminStudentPerformanceAnalytics.errorAnalysisData)

  // State for version filter

  const [selectedVersion, setSelectedVersion] = useState("latest")

  const [compareVersion1, setCompareVersion1] = useState("")

  const [compareVersion2, setCompareVersion2] = useState("")

  const versionComparison = useSelector((state) => state.adminStudentPerformanceAnalytics.versionComparison)

  // State for creator type filter (admin, partner, all)
  const [creatorTypeFilter, setCreatorTypeFilter] = useState("all")

  // Extract summary metrics function

  const extractSummaryMetrics = () => {
    if (!currentAnalytics || !currentAnalytics.data) {
      return { averageModuleScore: 0, strongTopicsCount: 0, weakTopicsCount: 0, totalTimeSpent: "0 min" }
    }

    const moduleAnalysis = currentAnalytics.data.moduleAnalysis || []

    if (moduleAnalysis.length > 0) {
      const completedModules = moduleAnalysis.filter((module) => {
        if (module.status === "completed") return true

        return (module.latestScore || module.score || 0) > 0
      })

      const totalScore = completedModules.reduce((sum, module) => {
        const score = module.latestScore || module.score || 0

        return sum + score
      }, 0)

      const averageScore = completedModules.length > 0 ? Math.round(totalScore / completedModules.length) : 0

      let strongTopicsCount = 0

      let weakTopicsCount = 0

      moduleAnalysis.forEach((module) => {
        strongTopicsCount +=
          module.versions?.[module.versions ? Object.keys(module.versions)[0] : ""]?.strongTopicsCount || 0

        weakTopicsCount +=
          module.versions?.[module.versions ? Object.keys(module.versions)[0] : ""]?.weakTopicsCount || 0
      })

      let totalMinutes = 0

      moduleAnalysis.forEach((module) => {
        if (module.timeSpent !== undefined) {
          totalMinutes += secondsToMinutes(module.timeSpent || 0)
        } else if (module.studentTimeSpent !== undefined) {
          totalMinutes += secondsToMinutes(module.studentTimeSpent || 0)
        } else {
          Object.values(module.topicScores || {}).forEach((topicScores) => {
            topicScores.forEach((topic) => {
              totalMinutes += secondsToMinutes(topic.timeSpent || 0)
            })
          })
        }
      })

      const totalTimeSpent = formatTimeDisplay(totalMinutes)

      return {
        averageModuleScore: averageScore,

        strongTopicsCount,

        weakTopicsCount,

        totalTimeSpent,
      }
    }

    return {
      averageModuleScore: 0,

      strongTopicsCount: 0,

      weakTopicsCount: 0,

      totalTimeSpent: "0 min",
    }
  }

  // Get user role and ID from Redux state
  const { id: userId, role } = useSelector((state) => state.user);

  // API queries
  const {
    data: enrolledStudentsData,

    isLoading: isLoadingStudents,

    error: enrolledStudentsError,
  } = useGetEnrolledStudentsQuery({
    role,
    userId,
    creatorType: role === 'admin' && creatorTypeFilter !== 'all' ? creatorTypeFilter : undefined
  })

  const {
    data: studentEnrollmentsData,
    isLoading: isLoadingEnrollments,
    error: studentEnrollmentsError
  } = useGetStudentEnrollmentsQuery(
    {
      studentId: selectedStudent?.id,
      role,
      userId,
      creatorType: role === 'admin' && creatorTypeFilter !== 'all' ? creatorTypeFilter : undefined
    },
    {
      skip: !selectedStudent,
    },
  )

  const {
    data: studentAnalyticsData,
    isLoading: isLoadingAnalytics,
    error: studentAnalyticsError
  } = useGetStudentAnalyticsQuery(
    {
      studentId: selectedStudent?.id,
      courseId: selectedCourseId,
      moduleId: selectedModuleId,
      version: selectedVersion,
    },
    {
      skip: !selectedStudent || isLoadingEnrollments,
    },
  )

  const { data: versionsData, isLoading: isLoadingVersions } = useGetStudentVersionsQuery(
    {
      studentId: selectedStudent?.id,

      courseId: selectedCourseId,

      moduleId: selectedModuleId,
    },

    {
      skip: !selectedStudent,
    },
  )

  const { data: topicStrengthData, isLoading: isLoadingTopics } = useGetTopicStrengthAnalysisQuery(
    {
      studentId: selectedStudent?.id,

      courseId: selectedCourseId,

      moduleId: selectedModuleId,

      version: selectedVersion,
    },

    {
      skip: !selectedStudent,
    },
  )

  const { data: timeSpentData, isLoading: isLoadingTimeSpent } = useGetTimeSpentAnalysisQuery(
    {
      studentId: selectedStudent?.id,

      courseId: selectedCourseId,

      moduleId: selectedModuleId,

      version: selectedVersion,
    },

    {
      skip: !selectedStudent,
    },
  )

  const { data: modulesData, isLoading: isLoadingModules } = useGetModulesByCourseQuery(selectedCourseId, {
    skip: !selectedCourseId,
  })

  const { data: moduleCompletionData, isLoading: isLoadingModuleCompletion } = useGetModuleCompletionQuery(
    {
      studentId: selectedStudent?.id,

      courseId: selectedCourseId,
    },

    {
      skip: !selectedStudent || !selectedCourseId,
    },
  )

  const { data: versionComparisonData, isLoading: isLoadingVersionComparison } = useGetVersionComparisonQuery(
    {
      studentId: selectedStudent?.id,

      version1: compareVersion1,

      version2: compareVersion2,

      courseId: selectedCourseId,

      moduleId: selectedModuleId,
    },

    {
      skip: !selectedStudent || !compareVersion1 || !compareVersion2 || !selectedCourseId || !selectedModuleId,
    },
  )

  const {
    data: errorAnalysisResponseData,
    isLoading: isLoadingErrorAnalysis,
    error: errorAnalysisError
  } = useGetErrorAnalysisQuery(
    {
      studentId: selectedStudent?.id,
      courseId: selectedCourseId,
      moduleId: selectedModuleId,
      version: selectedVersion,
    },
    {
      skip: !selectedStudent,
    },
  )

  // Effects

  useEffect(() => {
    if (studentEnrollmentsData && !studentEnrollmentsError) {
      dispatch(setStudentEnrollments(studentEnrollmentsData.enrollments || []))
    }
  }, [studentEnrollmentsData, studentEnrollmentsError, dispatch])

  useEffect(() => {
    if (studentAnalyticsData && !studentAnalyticsError) {
      dispatch(setCurrentAnalytics(studentAnalyticsData))
    }
  }, [studentAnalyticsData, studentAnalyticsError, dispatch])

  useEffect(() => {
    if (versionsData) {
      dispatch(setAvailableVersions(versionsData.availableVersions))
    }
  }, [versionsData, dispatch])

  useEffect(() => {
    if (modulesData) {
      dispatch(setModules(modulesData.modules))
    }
  }, [modulesData, dispatch])

  useEffect(() => {
    if (versionComparisonData) {
      dispatch(setVersionComparison(versionComparisonData))
    }
  }, [versionComparisonData, dispatch])

  useEffect(() => {
    // Skip if it's an error object with status/error properties
    if (errorAnalysisResponseData && !errorAnalysisError) {

      // Check if the response is an error object with status/error keys
      if (errorAnalysisResponseData.status && errorAnalysisResponseData.error) {
        dispatch(setErrorAnalysisData({}));
        return;
      }

      let normalizedData = {}

      if (errorAnalysisResponseData.errorAnalysis) {
        normalizedData = { ...errorAnalysisResponseData.errorAnalysis }
      } else if (errorAnalysisResponseData.errorPatterns || errorAnalysisResponseData.improvementSuggestions) {
        normalizedData = {
          ...errorAnalysisResponseData,

          errorPatterns: [...(errorAnalysisResponseData.errorPatterns || [])],

          improvementSuggestions: [...(errorAnalysisResponseData.improvementSuggestions || [])],

          errorCountByType: { ...(errorAnalysisResponseData.errorCountByType || {}) },
        }
      } else {
        normalizedData = {
          errorPatterns: [],

          improvementSuggestions: [],

          summary: {
            totalErrors: 0,

            totalImprovementSuggestions: 0,
          },
        }
      }

      normalizedData = {
        ...normalizedData,

        noDataForModule: errorAnalysisResponseData.noDataForModule === true,

        noData: errorAnalysisResponseData.noData === true,

        moduleId: errorAnalysisResponseData.moduleId !== undefined ? errorAnalysisResponseData.moduleId : undefined,

        summary: normalizedData.summary || {
          totalErrors: normalizedData.errorPatterns?.length || 0,

          totalImprovementSuggestions: normalizedData.improvementSuggestions?.length || 0,

          modulesCovered: 0,
        },
      }

      dispatch(setErrorAnalysisData(normalizedData))
    }
  }, [errorAnalysisResponseData, dispatch])

  const [manuallyClosedFilter, setManuallyClosedFilter] = useState(false)

  useEffect(() => {
    if (selectedStudent && !isFilterOpen && !manuallyClosedFilter) {
      dispatch(toggleFilterPanel())
    }
  }, [selectedStudent, isFilterOpen, manuallyClosedFilter, dispatch])

  // Event handlers

  const handleStudentSelect = (student) => {
    dispatch(setSelectedStudent(student))

    dispatch(setSelectedCourseId(null))

    dispatch(setSelectedModuleId(null))

    setSelectedVersion("latest")

    setManuallyClosedFilter(false)
  }

  const handleCourseSelect = (event) => {
    const courseId = event.target.value ? Number.parseInt(event.target.value) : null

    dispatch(setSelectedCourseId(courseId))

    dispatch(setSelectedModuleId(null))

    setSelectedVersion("latest")
  }

  const handleModuleSelect = (event) => {
    const moduleId = event.target.value ? Number.parseInt(event.target.value) : null

    dispatch(setSelectedModuleId(moduleId))

    setCompareVersion1("")

    setCompareVersion2("")
  }

  const handleToggleFilter = () => {
    if (isFilterOpen) {
      setManuallyClosedFilter(true)
    } else {
      setManuallyClosedFilter(false)
    }

    dispatch(toggleFilterPanel())
  }

  const handleVersionSelect = (event) => {
    setSelectedVersion(event.target.value)
  }

  const handleCompareVersion1Select = (event) => {
    const newVersion = event.target.value

    setCompareVersion1(newVersion)

    if (newVersion === compareVersion2) {
      setCompareVersion2("")
    }
  }

  const handleCompareVersion2Select = (event) => {
    const newVersion = event.target.value

    setCompareVersion2(newVersion)

    if (newVersion === compareVersion1) {
      setCompareVersion1("")
    }
  }

  const handleTabChange = (tabIndex) => {
    setCurrentTab(tabIndex)
  }

  // Handler for creator type filter change
  const handleCreatorTypeFilterChange = (value) => {
    setCreatorTypeFilter(value)
    // When filter changes, clear selected student to avoid showing data from previous filter
    dispatch(setSelectedStudent(null))
    dispatch(setStudentEnrollments([]))
  }

  // Auto-select current user as student if role is 'user'
  useEffect(() => {
    if (role === "user" && user?.id) {
      dispatch(setSelectedStudent(user));
    }
  }, [role, user, dispatch]);

  // Handle API error
  if (enrolledStudentsError) {
    // Get error message safely without directly rendering the error object
    let errorMessage = "Unknown error";
    if (typeof enrolledStudentsError === 'object') {
      if (enrolledStudentsError?.message) {
        errorMessage = enrolledStudentsError.message;
      } else if (enrolledStudentsError?.error) {
        errorMessage = enrolledStudentsError.error;
      } else if (enrolledStudentsError?.status) {
        errorMessage = `Error status: ${enrolledStudentsError.status}`;
      }
    } else if (typeof enrolledStudentsError === 'string') {
      errorMessage = enrolledStudentsError;
    }

    return (
      <Card className="m-4">
        <CardContent className="p-8">
          <div className="text-center text-red-600">
            <AlertTriangle size={64} className="mx-auto mb-6" />

            <h3 className="text-xl font-bold mb-4">Error Loading Data</h3>

            <p className="text-gray-600">
              Error loading student data: {errorMessage}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen  from-slate-50 via-blue-50 ">
      <div className="container mx-auto space-y-4 sm:space-y-8">
        {/* Enhanced Header */}

        <Card className="border-0 shadow-lg  bg-leafGreen text-white">
          <CardContent className="p-4 sm:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-white/20 rounded-lg backdrop-blur-sm">
                  <GraduationCap size={40} className="text-white" />
                </div>

                <div>
                  <h1 className="text-3xl font-bold mb-2">Student Analytics Dashboard</h1>

                  <p className="text-forestGreen text-lg">Comprehensive performance insights and learning analytics</p>
                </div>
              </div>

              <div className="w-full lg:w-96 space-y-3">
                {/* Creator Type Filter - Only visible for admin users */}
                {role === 'admin' && (
                  <div className="relative">
                    <select
                      value={creatorTypeFilter}
                      onChange={(e) => handleCreatorTypeFilterChange(e.target.value)}
                      className="block w-full px-4 py-3 border-0 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-white/25 bg-white/90 backdrop-blur-sm text-gray-900 font-medium appearance-none cursor-pointer hover:bg-white transition-colors duration-150"
                    >
                      <option value="all">All Courses</option>
                      <option value="admin">Admin Courses</option>
                      <option value="partner">Partner Courses</option>
                    </select>
                    <FilterIcon
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
                      size={20}
                    />
                  </div>
                )}

                {/* Student Dropdown - Only for non-user roles */}
                {role !== 'user' && (
                  isLoadingStudents ? (
                    <LoadingIndicator />
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedStudent?.id?.toString() || ""}
                        onChange={(e) => {
                          const student = enrolledStudentsData?.students?.find((s) => s.id.toString() === e.target.value)

                          if (student) {
                            handleStudentSelect(student)
                          }
                        }}
                        className="block w-full px-4 py-3 border-0 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-white/25 bg-white/90 backdrop-blur-sm text-gray-900 font-medium appearance-none cursor-pointer hover:bg-white transition-colors duration-150"
                      >
                        <option value="" disabled>
                          🎓 Select a student to analyze
                        </option>

                        {enrolledStudentsData?.students?.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.name} - {student.email}
                          </option>
                        ))}
                      </select>

                      <ChevronRight
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
                        size={20}
                      />
                    </div>
                  )
                )}

                {enrolledStudentsData?.students?.length === 0 && (
                  <p className="mt-3 text-center text-forestGreen text-sm">No enrolled students found.</p>
                )}

                {role === 'admin' && creatorTypeFilter !== 'all' && enrolledStudentsData?.students?.length > 0 && (
                  <p className="mt-3 text-center text-forestGreen text-sm">
                    Showing students enrolled in {creatorTypeFilter === 'admin' ? 'admin' : 'partner'} created courses only.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main content */}

        {!selectedStudent ? (
          <NoStudentSelected />
        ) : (
          <>
            {/* Enhanced Student Profile Card */}

            <Card className="shadow-lg border-0" gradient>
              <CardContent className="p-4 sm:p-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
                  <div className="flex items-center space-x-4 sm:space-x-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-lg  bg-leafGreen flex items-center justify-center text-white font-bold shadow-lg">
                        {selectedStudent.profileImage ? (
                          <img
                            src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${selectedStudent.profileImage || "/placeholder.png"}`}
                            alt={selectedStudent.name}
                            className="w-full h-full rounded-lg object-cover"
                          />
                        ) : (
                          <span className="text-2xl">{getInitial(selectedStudent.name)}</span>
                        )}
                      </div>

                      <div className="absolute -bottom-2 -right-2 w-8 h-8  from-green-400 to-emerald-500 rounded-lg border-4 border-white flex items-center justify-center shadow-md">
                        <div className="w-3 h-3 bg-white rounded-sm animate-pulse"></div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedStudent.name}</h2>

                      <p className="text-gray-600 mb-3">{selectedStudent.email}</p>

                      <Badge variant="premium" glow>
                        <BookMarked size={14} className="mr-1" />
                        {studentEnrollments.length} enrolled course{studentEnrollments.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    variant={isFilterOpen ? "premium" : "outline"}
                    onClick={handleToggleFilter}
                    className="flex items-center gap-2"
                    glow={isFilterOpen}
                  >
                    {isFilterOpen ? <X size={18} /> : <Filter size={18} />}

                    {isFilterOpen ? "Close Filters" : "Open Filters"}
                  </Button>
                </div>

                {/* Enhanced Filter Panel */}

                {isFilterOpen && (
                  <div className="mt-8">
                    <Card className=" from-gray-50 to-white border border-gray-200">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                          <Sparkles size={20} />
                          Analytics Filters
                          <ChevronDown size={18} className="ml-1 text-gray-600" />
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4gap-6">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                              Course
                            </label>

                            <div className="relative">
                              <select
                                value={selectedCourseId?.toString() || ""}
                                onChange={handleCourseSelect}
                                disabled={isLoadingEnrollments}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen/20 bg-white disabled:bg-gray-100 font-medium cursor-pointer hover:border-gray-400 transition-colors duration-150 pr-10 appearance-none"
                              >
                                <option value="">🎯 All Courses</option>

                                {studentEnrollments.map((enrollment) => (
                                  <option key={enrollment.courseId} value={enrollment.courseId.toString()}>
                                    📚 {enrollment.courseTitle}
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-600">
                                <ChevronDown size={18} />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                              Module
                            </label>

                            <div className="relative">
                              <select
                                value={selectedModuleId?.toString() || ""}
                                onChange={handleModuleSelect}
                                disabled={!selectedCourseId || isLoadingModules}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen/20 bg-white disabled:bg-gray-100 font-medium cursor-pointer hover:border-gray-400 transition-colors duration-150 pr-10 appearance-none"
                              >
                                <option value="">📖 All Modules</option>

                                {modules.map((module) => (
                                  <option key={module.id} value={module.id.toString()}>
                                    📝 {module.title}
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-600">
                                <ChevronDown size={18} />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                              Version
                            </label>

                            <div className="relative">
                              <select
                                value={selectedVersion}
                                onChange={handleVersionSelect}
                                disabled={isLoadingVersions || !selectedModuleId}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen/20 bg-white disabled:bg-gray-100 font-medium cursor-pointer hover:border-gray-400 transition-colors duration-150 pr-10 appearance-none"
                              >
                                <option value="latest">⭐ Latest Only</option>

                                {availableVersions?.map((v) => (
                                  <option key={`${v.moduleId}-${v.version}`} value={v.version}>
                                    🔄 Version {v.version} {v.isCurrent && "(Current)"} -{" "}
                                    {new Date(v.created_at).toLocaleDateString()}
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-600">
                                <ChevronDown size={18} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Analytics Tabs */}

            <Tabs value={currentTab.toString()} onValueChange={handleTabChange} className="space-y-4 sm:space-y-8">
              <Card className="shadow-lg border-0">
                <CardContent className="p-2">
                  <TabsList className="grid w-full grid-cols-6 h-auto p-2">
                    <TabsTrigger
                      value="0"
                      isActive={currentTab === 0}
                      onClick={() => handleTabChange(0)}
                      className="flex items-center gap-2 py-4"
                    >
                      <TrendingUp size={18} />

                      <span className="hidden sm:inline font-semibold">Performance</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="1"
                      isActive={currentTab === 1}
                      onClick={() => handleTabChange(1)}
                      className="flex items-center gap-2 py-4"
                    >
                      <Brain size={18} />

                      <span className="hidden sm:inline font-semibold">Topics</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="2"
                      isActive={currentTab === 2}
                      onClick={() => handleTabChange(2)}
                      className="flex items-center gap-2 py-4"
                    >
                      <Clock size={18} />

                      <span className="hidden sm:inline font-semibold">Time</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="3"
                      isActive={currentTab === 3}
                      onClick={() => handleTabChange(3)}
                      className="flex items-center gap-2 py-4"
                    >
                      <ClipboardList size={18} />

                      <span className="hidden sm:inline font-semibold">Modules</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="4"
                      isActive={currentTab === 4}
                      onClick={() => handleTabChange(4)}
                      className="flex items-center gap-2 py-4"
                    >
                      <GitCompare size={18} />

                      <span className="hidden sm:inline font-semibold">Compare</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="5"
                      isActive={currentTab === 5}
                      onClick={() => handleTabChange(5)}
                      className="flex items-center gap-2 py-4"
                    >
                      <AlertTriangle size={18} />

                      <span className="hidden sm:inline font-semibold">Errors</span>
                    </TabsTrigger>
                  </TabsList>
                </CardContent>
              </Card>

              {/* Performance Overview Tab */}

              <TabsContent value="0" activeValue={currentTab.toString()} className="space-y-8">
                {isLoadingAnalytics ? (
                  <Card>
                    <CardContent className="p-12">
                      <LoadingIndicator />
                    </CardContent>
                  </Card>
                ) : !selectedCourseId ? (
                  <Card className="border-0 shadow-lg  bg-leafGreen via-indigo-50 to-purple-50">
                    <CardContent className="p-12 text-center">
                      <div className="w-24 h-24 mx-auto mb-8  bg-leafGreen rounded-lg flex items-center justify-center shadow-lg">
                        <TrendingUp size={48} className="text-white" />
                      </div>

                      <CardTitle className="text-2xl mb-4" gradient>
                        Overall Student Performance
                      </CardTitle>

                      <CardDescription className="text-lg mb-8 max-w-2xl mx-auto">
                        You are viewing overall performance across all courses. Select a specific course to dive deeper
                        into detailed analytics.
                      </CardDescription>

                      {studentEnrollments && studentEnrollments.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                          {studentEnrollments.map((enrollment) => (
                            <Card
                              key={enrollment.courseId}
                              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 bg-white/80 backdrop-blur-sm"
                              onClick={() => dispatch(setSelectedCourseId(enrollment.courseId))}
                            >
                              <CardContent className="p-8">
                                <div className="flex items-start justify-between mb-6">
                                  <div className="p-3  bg-lightGreen rounded-md shadow-md">
                                    <BookOpen size={28} className="text-white" />
                                  </div>

                                  <Badge variant="premium" glow>
                                    {enrollment.completionPercentage || 0}%
                                  </Badge>
                                </div>

                                <CardTitle className="text-lg mb-3">{enrollment.courseTitle}</CardTitle>

                                <CardDescription className="text-sm mb-4">
                                  📅 Enrolled: {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                                </CardDescription>

                                <Progress value={enrollment.completionPercentage || 0} className="h-3" />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : currentAnalytics ? (
                  <>
                    {/* Enhanced Summary Cards */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <MetricCard
                        title="Average Module Score"
                        value={
                          extractSummaryMetrics()?.averageModuleScore > 0
                            ? `${extractSummaryMetrics()?.averageModuleScore}%`
                            : "No Data"
                        }
                        icon={Target}
                        color="blue"
                        description="Overall performance"
                      />

                      <MetricCard
                        title="Strong Topics"
                        value={extractSummaryMetrics()?.strongTopicsCount || 0}
                        icon={Award}
                        color="green"
                        description="Mastered concepts"
                        premium
                      />

                      <MetricCard
                        title="Weak Topics"
                        value={extractSummaryMetrics()?.weakTopicsCount || 0}
                        icon={TrendingDown}
                        color="red"
                        description="Need improvement"
                      />

                      <MetricCard
                        title="Total Time Spent"
                        value={(() => {
                          if (timeSpentData?.summary?.totalTimeSpentFormatted) {
                            return timeSpentData.summary.totalTimeSpentFormatted
                          }

                          if (timeSpentData?.timeAnalysis && selectedCourseId) {
                            const courseData = timeSpentData.timeAnalysis.find(
                              (course) => course.courseId === Number.parseInt(selectedCourseId),
                            )

                            if (courseData?.totalTimeSpentFormatted) {
                              return courseData.totalTimeSpentFormatted
                            }
                          } else if (timeSpentData?.timeAnalysis && !selectedCourseId) {
                            let totalSeconds = 0

                            timeSpentData.timeAnalysis.forEach((course) => {
                              totalSeconds += course.totalTimeSpent || 0
                            })

                            return formatTime(totalSeconds, "seconds")
                          }

                          return extractSummaryMetrics()?.totalTimeSpent || "N/A"
                        })()}
                        icon={Timer}
                        color="purple"
                        description="Learning duration"
                      />
                    </div>

                    {/* Enhanced Performance Charts */}

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      <Card className="shadow-lg border-0" gradient>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-3" gradient>
                            <div className="p-2  bg-lightGreen rounded-md">
                              <BarChart3 size={24} className="text-white" />
                            </div>
                            Module Performance
                          </CardTitle>

                          <CardDescription className="text-base">
                            Performance scores across different modules
                          </CardDescription>
                        </CardHeader>

                        <CardContent>
                          <div className="h-96">
                            {currentAnalytics?.data?.moduleAnalysis?.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={currentAnalytics.data.moduleAnalysis.map((module, index) => ({
                                    moduleTitle: module.moduleTitle,

                                    scorePercentage: module.latestScore || 0,

                                    moduleId: module.moduleId,

                                    fill: ENHANCED_COLORS[index % ENHANCED_COLORS.length],
                                  }))}
                                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                                >
                                  <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#667eea" stopOpacity={1} />

                                      <stop offset="100%" stopColor="#764ba2" stopOpacity={0.8} />
                                    </linearGradient>
                                  </defs>

                                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />

                                  <XAxis
                                    dataKey="moduleTitle"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    fontSize={12}
                                    stroke="#64748b"
                                    fontWeight="500"
                                  />

                                  <YAxis fontSize={12} stroke="#64748b" fontWeight="500" />

                                  <RechartsTooltip content={<CustomTooltip />} />

                                  <Legend />

                                  <Bar
                                    dataKey="scorePercentage"
                                    name="Score %"
                                    fill="url(#barGradient)"
                                    radius={[4, 4, 0, 0]}
                                    stroke="#667eea"
                                    strokeWidth={2}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="flex justify-center items-center h-full">
                                <div className="text-center text-gray-500">
                                  <BarChart3 size={64} className="mx-auto mb-6 opacity-50" />

                                  <p className="text-lg font-medium">No module data available</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="shadow-lg border-0" gradient>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-3" gradient>
                            <div className="p-2  bg-leafGreen  rounded-md">
                              <PieChartIcon size={24} className="text-white" />
                            </div>
                            Topic Strength Distribution
                          </CardTitle>

                          <CardDescription className="text-base">Ratio of strong vs weak topics</CardDescription>
                        </CardHeader>

                        <CardContent>
                          <div className="h-96">
                            {extractSummaryMetrics() ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <defs>
                                    <linearGradient id="strongGradient" x1="0" y1="0" x2="1" y2="1">
                                      <stop offset="0%" stopColor="#11998e" />

                                      <stop offset="100%" stopColor="#38ef7d" />
                                    </linearGradient>

                                    <linearGradient id="weakGradient" x1="0" y1="0" x2="1" y2="1">
                                      <stop offset="0%" stopColor="#ff9a9e" />

                                      <stop offset="100%" stopColor="#fecfef" />
                                    </linearGradient>
                                  </defs>

                                  <Pie
                                    data={[
                                      {
                                        name: "Strong Topics",

                                        value: extractSummaryMetrics().strongTopicsCount,

                                        fill: "url(#strongGradient)",
                                      },

                                      {
                                        name: "Weak Topics",

                                        value: extractSummaryMetrics().weakTopicsCount,

                                        fill: "url(#weakGradient)",
                                      },
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={120}
                                    paddingAngle={8}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                    stroke="#fff"
                                    strokeWidth={3}
                                  />

                                  <RechartsTooltip content={<CustomTooltip />} />

                                  <Legend />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="flex justify-center items-center h-full">
                                <div className="text-center text-gray-500">
                                  <PieChartIcon size={64} className="mx-auto mb-6 opacity-50" />

                                  <p className="text-lg font-medium">No topic data available</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="text-gray-500">
                        <Activity size={64} className="mx-auto mb-6 opacity-50" />

                        <p className="text-lg font-medium">
                          {selectedCourseId
                            ? "No analytics data available for this course"
                            : "Please select a course to view analytics"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Topics & Skills Tab */}

              <TabsContent value="1" activeValue={currentTab.toString()} className="space-y-8">
                {isLoadingTopics ? (
                  <Card>
                    <CardContent className="p-12">
                      <LoadingIndicator />
                    </CardContent>
                  </Card>
                ) : !selectedCourseId ? (
                  <Card className="border-0 shadow-lg  from-green-50 via-emerald-50 to-teal-50">
                    <CardContent className="p-12 text-center">
                      <div className="w-24 h-24 mx-auto mb-8  from-green-500 via-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg">
                        <Brain size={48} className="text-white" />
                      </div>

                      <CardTitle className="text-2xl mb-4" gradient>
                        Please Select a Course
                      </CardTitle>

                      <CardDescription className="text-lg max-w-2xl mx-auto">
                        Select a specific course from the filter panel to view comprehensive topic strength analysis and
                        learning insights.
                      </CardDescription>
                    </CardContent>
                  </Card>
                ) : topicStrengthData ? (
                  <>
                    {/* Topic Strength Overview */}

                    <Card className="shadow-lg border-0  from-white via-blue-50 ">
                      <CardHeader>
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                          <div>
                            <CardTitle className="flex items-center gap-3 text-2xl" gradient>
                              <div className="p-3  bg-lightGreen rounded-md shadow-md">
                                <Brain size={32} className="text-white" />
                              </div>
                              Topic Strength Analysis
                            </CardTitle>

                            <CardDescription className="text-base mt-2">
                              Comprehensive analysis of topic mastery and learning progress
                            </CardDescription>
                          </div>

                          <Badge variant="premium" className="text-xl px-6 py-3" glow>
                            <Trophy size={20} className="mr-2" />
                            {topicStrengthData.stats?.strongTopicsPercentage || 0}% Strong
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="text-center p-6  from-white to-gray-50 rounded-lg shadow-md border border-gray-100">
                            <div className="text-3xl font-bold text-gray-900 mb-2">
                              {topicStrengthData.stats?.totalTopics || 0}
                            </div>

                            <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                              Total Topics
                            </div>
                          </div>

                          <div className="text-center p-6  from-green-50 to-emerald-100 rounded-lg shadow-md border border-green-200">
                            <div className="text-3xl font-bold text-green-600 mb-2">
                              {topicStrengthData.stats?.strongTopicsCount || 0}
                            </div>

                            <div className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                              Strong Topics
                            </div>
                          </div>

                          <div className="text-center p-6  from-red-50 to-rose-100 rounded-lg shadow-md border border-red-200">
                            <div className="text-3xl font-bold text-red-600 mb-2">
                              {topicStrengthData.stats?.weakTopicsCount || 0}
                            </div>

                            <div className="text-sm font-semibold text-red-700 uppercase tracking-wide">
                              Weak Topics
                            </div>
                          </div>

                          <div className="text-center p-6  bg-lightGreen rounded-lg shadow-md border border-leafGreen/20">
                            <div className="text-3xl font-bold text-forestGreen mb-2">
                              {topicStrengthData.stats?.averageStrongScore || 0}%
                            </div>

                            <div className="text-sm font-semibold text-forestGreen uppercase tracking-wide">
                              Avg. Strong Score
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Enhanced Topic Details Table */}

                    <Card className="shadow-lg border-0">
                      <CardHeader>
                        <CardTitle className="text-xl" gradient>
                          Topic Performance Details
                        </CardTitle>

                        <CardDescription className="text-base">
                          Detailed breakdown of performance across all topics
                        </CardDescription>
                      </CardHeader>

                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b-2 border-gray-200  from-gray-50 to-white">
                                <th className="text-left p-6 font-bold text-gray-800 uppercase tracking-wide">Topic</th>

                                <th className="text-center p-6 font-bold text-gray-800 uppercase tracking-wide">
                                  Score
                                </th>

                                <th className="text-center p-6 font-bold text-gray-800 uppercase tracking-wide">
                                  Status
                                </th>

                                <th className="text-center p-6 font-bold text-gray-800 uppercase tracking-wide">
                                  Skill Level
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {[...(topicStrengthData.weakTopics || []), ...(topicStrengthData.strongTopics || [])].map(
                                (topic, index) => (
                                  <tr
                                    key={topic.topicTitle}
                                    className={`border-b border-gray-100 hover: hover:bg-leafGreen hover: transition-all duration-150 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                                      }`}
                                  >
                                    <td className="p-6 font-semibold text-gray-900">{topic.topicTitle}</td>

                                    <td className="p-6 text-center">
                                      <div className="flex items-center justify-center gap-3">
                                        <span className="font-bold text-lg">{topic.score}%</span>

                                        <div className="w-20 h-3 bg-gray-200 rounded-md overflow-hidden">
                                          <div
                                            className={`h-3 rounded-md transition-all duration-300 ${topic.score >= 70
                                              ? " from-green-400 to-emerald-500"
                                              : topic.score >= 40
                                                ? " from-yellow-400 to-orange-500"
                                                : " from-red-400 to-rose-500"
                                              }`}
                                            style={{ width: `${topic.score}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    </td>

                                    <td className="p-6 text-center">
                                      <Badge
                                        variant={
                                          topicStrengthData.strongTopics?.some((t) => t.topicTitle === topic.topicTitle)
                                            ? "success"
                                            : "destructive"
                                        }
                                        glow
                                      >
                                        {topicStrengthData.strongTopics?.some((t) => t.topicTitle === topic.topicTitle)
                                          ? "💪 Strong"
                                          : "📈 Weak"}
                                      </Badge>
                                    </td>

                                    <td className="p-6 text-center">
                                      <Badge variant="outline" className="font-semibold">
                                        {topic.skill || "Not Assessed"}
                                      </Badge>
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Enhanced Charts */}

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      <Card className="shadow-lg border-0" gradient>
                        <CardHeader>
                          <CardTitle className="text-xl" gradient>
                            Score Distribution
                          </CardTitle>

                          <CardDescription className="text-base">
                            Distribution of topics across score ranges
                          </CardDescription>
                        </CardHeader>

                        <CardContent>
                          <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={
                                  topicStrengthData.graphData?.distributionByScore?.labels.map((label, index) => ({
                                    range: label,

                                    count: topicStrengthData.graphData.distributionByScore.datasets[index],
                                  })) || []
                                }
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                              >
                                <defs>
                                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#667eea" stopOpacity={0.8} />

                                    <stop offset="100%" stopColor="#764ba2" stopOpacity={0.1} />
                                  </linearGradient>
                                </defs>

                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />

                                <XAxis dataKey="range" fontSize={12} stroke="#64748b" fontWeight="500" />

                                <YAxis allowDecimals={false} fontSize={12} stroke="#64748b" fontWeight="500" />

                                <RechartsTooltip content={<CustomTooltip />} />

                                <Legend />

                                <Area
                                  type="monotone"
                                  dataKey="count"
                                  name="Topics"
                                  stroke="#667eea"
                                  strokeWidth={3}
                                  fill="url(#areaGradient)"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="shadow-lg border-0" gradient>
                        <CardHeader>
                          <CardTitle className="text-xl" gradient>
                            Topic Performance Radar
                          </CardTitle>

                          <CardDescription className="text-base">Comprehensive view of topic mastery</CardDescription>
                        </CardHeader>

                        <CardContent>
                          <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart
                                outerRadius={120}
                                data={[
                                  ...(topicStrengthData.weakTopics || []),

                                  ...(topicStrengthData.strongTopics || []),
                                ]

                                  .slice(0, 8)

                                  .map((topic) => ({
                                    title:
                                      topic.topicTitle.length > 15
                                        ? topic.topicTitle.substring(0, 15) + "..."
                                        : topic.topicTitle,

                                    score: topic.score,
                                  }))}
                              >
                                <defs>
                                  <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#667eea" stopOpacity={0.6} />

                                    <stop offset="100%" stopColor="#764ba2" stopOpacity={0.2} />
                                  </linearGradient>
                                </defs>

                                <PolarGrid stroke="#e2e8f0" strokeWidth={1} />

                                <PolarAngleAxis dataKey="title" fontSize={11} fontWeight="500" stroke="#64748b" />

                                <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={10} stroke="#64748b" />

                                <Radar
                                  name="Score"
                                  dataKey="score"
                                  stroke="#667eea"
                                  fill="url(#radarGradient)"
                                  strokeWidth={3}
                                  dot={{ fill: "#667eea", strokeWidth: 2, r: 4 }}
                                />

                                <RechartsTooltip content={<CustomTooltip />} />

                                <Legend />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Module Performance Grid */}

                    <Card className="shadow-lg border-0">
                      <CardHeader>
                        <CardTitle className="text-xl" gradient>
                          Performance by Module
                        </CardTitle>

                        <CardDescription className="text-base">
                          Topic performance breakdown across different modules
                        </CardDescription>
                      </CardHeader>

                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {topicStrengthData.graphData?.moduleDistribution?.map((module, index) => (
                            <Card
                              key={module.moduleId}
                              className="border-2 border-gray-200 hover:border-leafGreen/20 transition-all duration-200 hover:shadow-lg"
                              gradient
                            >
                              <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                  <div
                                    className={`p-2 rounded-md  ${index % 4 === 0
                                      ? "bg-lightGreen"
                                      : index % 4 === 1
                                        ? "bg-leafGreen "
                                        : index % 4 === 2
                                          ? "from-green-500 to-emerald-600"
                                          : "from-orange-500 to-red-600"
                                      }`}
                                  >
                                    <BookOpen size={20} className="text-white" />
                                  </div>

                                  <h4 className="font-bold text-gray-900">{module.moduleTitle}</h4>
                                </div>

                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                                      Average Score
                                    </span>

                                    <span className="font-bold text-2xl text-forestGreen">{module.averageScore}%</span>
                                  </div>

                                  <Progress value={module.averageScore} className="h-3" />

                                  <div className="grid grid-cols-3 gap-3 text-sm">
                                    <div className="text-center p-3 bg-gray-50 rounded-md">
                                      <div className="font-bold text-lg text-gray-900">{module.totalTopics}</div>

                                      <div className="text-gray-600 font-medium">Total</div>
                                    </div>

                                    <div className="text-center p-3 bg-green-50 rounded-md">
                                      <div className="font-bold text-lg text-green-600">{module.strongTopics}</div>

                                      <div className="text-green-700 font-medium">Strong</div>
                                    </div>

                                    <div className="text-center p-3 bg-red-50 rounded-md">
                                      <div className="font-bold text-lg text-red-600">{module.weakTopics}</div>

                                      <div className="text-red-700 font-medium">Weak</div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="text-gray-500">
                        <Brain size={64} className="mx-auto mb-6 opacity-50" />

                        <p className="text-lg font-medium">No topic data available for this course</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Time Analysis Tab */}

              <TabsContent value="2" activeValue={currentTab.toString()} className="space-y-8">
                {isLoadingTimeSpent ? (
                  <Card>
                    <CardContent className="p-12">
                      <LoadingIndicator />
                    </CardContent>
                  </Card>
                ) : timeSpentData?.timeAnalysis && timeSpentData.timeAnalysis.length > 0 ? (
                  (() => {
                    if (!selectedCourseId) {
                      return (
                        <Card className="shadow-lg border-0" gradient>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-2xl" gradient>
                              <div className="p-3  bg-leafGreen  rounded-md shadow-md">
                                <Clock size={32} className="text-white" />
                              </div>
                              Overall Time Analysis
                            </CardTitle>

                            <CardDescription className="text-base">
                              Time spent across all enrolled courses
                            </CardDescription>
                          </CardHeader>

                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                              {timeSpentData.timeAnalysis.map((course, index) => (
                                <Card
                                  key={course.courseId}
                                  className="border-2 border-gray-200 hover:border-leafGreen/20 hover:shadow-lg transition-all duration-200"
                                  gradient
                                >
                                  <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                      <div
                                        className={`p-3 rounded-md shadow-md  ${index % 3 === 0
                                          ? "bg-lightGreen"
                                          : index % 3 === 1
                                            ? "bg-leafGreen "
                                            : "from-green-500 to-emerald-600"
                                          }`}
                                      >
                                        <Timer size={24} className="text-white" />
                                      </div>

                                      <h4 className="font-bold text-gray-900">{course.courseTitle}</h4>
                                    </div>

                                    <div className="space-y-3">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                                          Total time:
                                        </span>

                                        <span className="font-bold text-lg text-leafGreen">
                                          {formatTime(course.totalTimeSpent, "seconds")}
                                        </span>
                                      </div>

                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                                          Modules:
                                        </span>

                                        <Badge variant="premium">{course.modules?.length || 0}</Badge>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    }

                    const courseData = timeSpentData.timeAnalysis.find(
                      (course) => course.courseId === Number.parseInt(selectedCourseId),
                    )

                    if (!courseData) {
                      return (
                        <Card>
                          <CardContent className="p-12 text-center">
                            <div className="text-gray-500">
                              <Clock size={64} className="mx-auto mb-6 opacity-50" />

                              <p className="text-lg font-medium">No time data available for this course</p>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    }

                    const moduleData = courseData.modules.map((module, index) => {
                      const timeSpentSeconds = module.timeSpent || 0

                      const timeSpentMinutes = secondsToMinutes(timeSpentSeconds)

                      return {
                        moduleId: module.id,

                        moduleTitle: module.title,

                        timeSpentMinutes: timeSpentMinutes,

                        timeSpentFormatted: module.timeSpentFormatted || formatTimeDisplay(timeSpentMinutes),

                        timeSpentSeconds: timeSpentSeconds,

                        fill: ENHANCED_COLORS[index % ENHANCED_COLORS.length],
                      }
                    })

                    let topicData = []

                    if (timeSpentData?.correlation?.topics && timeSpentData.correlation.topics.length > 0) {
                      topicData = timeSpentData.correlation.topics.map((topic) => {
                        const timeSpentMinutes =
                          topic.timeSpentMinutes !== undefined
                            ? topic.timeSpentMinutes
                            : secondsToMinutes(topic.timeSpent || 0)

                        return {
                          topicId: topic.topicId,

                          topicTitle: topic.topicTitle,

                          moduleId: topic.moduleId,

                          moduleTitle: topic.moduleTitle,

                          timeSpent: topic.timeSpent || 0,

                          timeSpentMinutes: timeSpentMinutes,

                          formattedTime: formatTimeDisplay(timeSpentMinutes),

                          score: topic.score || 0,

                          status: topic.status || "unknown",
                        }
                      })
                    } else {
                      courseData.modules.forEach((module) => {
                        if (module.topics && module.topics.length > 0) {
                          module.topics.forEach((topic) => {
                            const timeSpentMinutes = secondsToMinutes(topic.timeSpent || 0)

                            topicData.push({
                              topicId: topic.id,

                              topicTitle: topic.title,

                              moduleId: module.id,

                              moduleTitle: module.title,

                              timeSpent: topic.timeSpent || 0,

                              timeSpentMinutes: timeSpentMinutes,

                              formattedTime: topic.timeSpentFormatted || formatTimeDisplay(timeSpentMinutes),

                              score: topic.score || 0,

                              status: topic.status || "unknown",
                            })
                          })
                        }
                      })
                    }

                    topicData.sort((a, b) => b.timeSpentMinutes - a.timeSpentMinutes)

                    return (
                      <>
                        {/* Time by Module Chart */}

                        <Card className="shadow-lg border-0" gradient>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-2xl" gradient>
                              <div className="p-3  from-orange-500 to-red-600 rounded-md shadow-md">
                                <Timer size={32} className="text-white" />
                              </div>
                              Time Spent by Module
                            </CardTitle>

                            <CardDescription className="text-base">
                              Learning time distribution across modules
                            </CardDescription>
                          </CardHeader>

                          <CardContent>
                            <div className="h-[500px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={moduleData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                                  <defs>
                                    <linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#f093fb" stopOpacity={1} />

                                      <stop offset="100%" stopColor="#f5576c" stopOpacity={0.8} />
                                    </linearGradient>
                                  </defs>

                                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />

                                  <XAxis
                                    dataKey="moduleTitle"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    fontSize={12}
                                    stroke="#64748b"
                                    fontWeight="500"
                                  />

                                  <YAxis
                                    label={{ value: "Minutes", angle: -90, position: "insideLeft" }}
                                    fontSize={12}
                                    stroke="#64748b"
                                    fontWeight="500"
                                  />

                                  <RechartsTooltip
                                    content={<CustomTooltip />}
                                    formatter={(value, name) => {
                                      return [formatTimeDisplay(value), "Time Spent"]
                                    }}
                                    labelFormatter={(label) => `${label}`}
                                  />

                                  <Legend />

                                  <Bar
                                    dataKey="timeSpentMinutes"
                                    name="Time Spent"
                                    fill="url(#timeGradient)"
                                    radius={[4, 4, 0, 0]}
                                    stroke="#f093fb"
                                    strokeWidth={2}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Time vs Performance Correlation */}

                        {topicData.length > 0 && (
                          <Card className="shadow-lg border-0" gradient>
                            <CardHeader>
                              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                <div>
                                  <CardTitle className="flex items-center gap-3 text-2xl" gradient>
                                    <div className="p-3  from-cyan-500 to-blue-600 rounded-md shadow-md">
                                      <Activity size={32} className="text-white" />
                                    </div>
                                    Time vs Performance Correlation
                                  </CardTitle>

                                  <CardDescription className="text-base mt-2">
                                    Analysis of how time spent relates to performance scores
                                  </CardDescription>
                                </div>

                                <Badge variant="premium" className="text-lg px-4 py-2" glow>
                                  <Flame size={18} className="mr-2" />
                                  {topicData.length} Topics
                                </Badge>
                              </div>

                              {timeSpentData?.correlation?.explanation && (
                                <CardDescription className="italic text-base bg-lightGreen p-4 rounded-md border border-leafGreen/20 mt-4">
                                  💡 {timeSpentData.correlation.explanation}
                                </CardDescription>
                              )}
                            </CardHeader>

                            <CardContent>
                              <div className="h-[500px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <defs>
                                      <linearGradient id="scatterGradient" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#667eea" />

                                        <stop offset="100%" stopColor="#764ba2" />
                                      </linearGradient>
                                    </defs>

                                    <CartesianGrid stroke="#e2e8f0" strokeOpacity={0.5} />

                                    <XAxis
                                      type="number"
                                      dataKey="timeSpentMinutes"
                                      name="Time Spent"
                                      unit=" min"
                                      label={{
                                        value: "Time Spent (minutes)",

                                        position: "bottom",
                                      }}
                                      domain={[0, "dataMax"]}
                                      fontSize={12}
                                      stroke="#64748b"
                                      fontWeight="500"
                                    />

                                    <YAxis
                                      type="number"
                                      dataKey="score"
                                      name="Score"
                                      unit="%"
                                      label={{
                                        value: "Score (%)",

                                        angle: -90,

                                        position: "left",
                                      }}
                                      domain={[0, 100]}
                                      fontSize={12}
                                      stroke="#64748b"
                                      fontWeight="500"
                                    />

                                    <RechartsTooltip
                                      content={<CustomTooltip />}
                                      formatter={(value, name, props) => {
                                        if (name === "Score") return [`${value}%`, name]

                                        if (name === "Time Spent") return [formatTimeDisplay(value), name]

                                        return [value, name]
                                      }}
                                      labelFormatter={(index) => {
                                        const topic = topicData[index]

                                        if (!topic) return ""

                                        return `${topic.topicTitle} (${topic.moduleTitle})`
                                      }}
                                    />

                                    <Legend />

                                    <Scatter
                                      name="Topics"
                                      data={topicData}
                                      fill="url(#scatterGradient)"
                                      stroke="#667eea"
                                      strokeWidth={2}
                                    />
                                  </ScatterChart>
                                </ResponsiveContainer>
                              </div>

                              {/* Time Distribution Summary */}

                              {timeSpentData?.correlation?.metadata && (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                                  <div className=" bg-leafGreen to-blue-100 text-forestGreen rounded-lg p-6 text-center border border-leafGreen/20 shadow-md">
                                    <div className="text-2xl font-bold mb-2">
                                      {timeSpentData.correlation.metadata.lessThan5Min}
                                    </div>

                                    <div className="text-sm font-semibold uppercase tracking-wide">{"< 5 min"}</div>
                                  </div>

                                  <div className=" from-green-50 to-green-100 text-green-700 rounded-lg p-6 text-center border border-green-200 shadow-md">
                                    <div className="text-2xl font-bold mb-2">
                                      {timeSpentData.correlation.metadata.between5And30Min}
                                    </div>

                                    <div className="text-sm font-semibold uppercase tracking-wide">5-30 min</div>
                                  </div>

                                  <div className=" from-yellow-50 to-yellow-100 text-yellow-700 rounded-lg p-6 text-center border border-yellow-200 shadow-md">
                                    <div className="text-2xl font-bold mb-2">
                                      {timeSpentData.correlation.metadata.between30And60Min}
                                    </div>

                                    <div className="text-sm font-semibold uppercase tracking-wide">30-60 min</div>
                                  </div>

                                  <div className=" from-red-50 to-red-100 text-red-700 rounded-lg p-6 text-center border border-red-200 shadow-md">
                                    <div className="text-2xl font-bold mb-2">
                                      {timeSpentData.correlation.metadata.moreThan60Min}
                                    </div>

                                    <div className="text-sm font-semibold uppercase tracking-wide">{"> 60 min"}</div>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}

                        {/* Topic Time Distribution Table */}

                        <Card className="shadow-lg border-0">
                          <CardHeader>
                            <CardTitle className="text-xl" gradient>
                              Topic Time Distribution
                            </CardTitle>

                            <CardDescription className="text-base">Detailed time breakdown by topic</CardDescription>
                          </CardHeader>

                          <CardContent>
                            {topicData.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b-2 border-gray-200  from-gray-50 to-white">
                                      <th className="text-left p-6 font-bold text-gray-800 uppercase tracking-wide">
                                        Topic
                                      </th>

                                      <th className="text-left p-6 font-bold text-gray-800 uppercase tracking-wide">
                                        Module
                                      </th>

                                      <th className="text-right p-6 font-bold text-gray-800 uppercase tracking-wide">
                                        Time Spent
                                      </th>

                                      <th className="text-right p-6 font-bold text-gray-800 uppercase tracking-wide">
                                        Score
                                      </th>
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {topicData.map((topic, index) => (
                                      <tr
                                        key={index}
                                        className={`border-b border-gray-100 hover: hover:bg-leafGreen hover: transition-all duration-150 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                                          }`}
                                      >
                                        <td className="p-6 font-semibold text-gray-900">{topic.topicTitle}</td>

                                        <td className="p-6 text-gray-600 font-medium">{topic.moduleTitle}</td>

                                        <td className="p-6 text-right font-bold text-leafGreen">
                                          {topic.formattedTime || formatTimeDisplay(secondsToMinutes(topic.timeSpent))}
                                        </td>

                                        <td className="p-6 text-right">
                                          <Badge
                                            variant={
                                              topic.score >= 70
                                                ? "success"
                                                : topic.score >= 40
                                                  ? "warning"
                                                  : "destructive"
                                            }
                                            glow
                                          >
                                            {topic.score}%
                                          </Badge>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-center py-12 text-gray-500">
                                <Clock size={64} className="mx-auto mb-6 opacity-50" />

                                <p className="text-lg font-medium">No topic time data available</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </>
                    )
                  })()
                ) : (
                  <Card className="border-0 shadow-lg  bg-leafGreen via-pink-50 to-rose-50">
                    <CardContent className="p-12 text-center">
                      <div className="w-24 h-24 mx-auto mb-8  bg-leafGreen via-pink-500 to-rose-600 rounded-lg flex items-center justify-center shadow-lg">
                        <Clock size={48} className="text-white" />
                      </div>

                      <CardTitle className="text-2xl mb-4" gradient>
                        No Time Data Available
                      </CardTitle>

                      <CardDescription className="text-lg max-w-2xl mx-auto">
                        {selectedCourseId
                          ? "No time data is available for this course."
                          : "Please select a course to view detailed time analysis."}
                      </CardDescription>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Module Completion Tab */}

              <TabsContent value="3" activeValue={currentTab.toString()} className="space-y-8">
                {isLoadingModuleCompletion ? (
                  <Card>
                    <CardContent className="p-12">
                      <LoadingIndicator />
                    </CardContent>
                  </Card>
                ) : !selectedCourseId ? (
                  <Card className="border-0 shadow-lg  from-orange-50 via-red-50 ">
                    <CardContent className="p-12 text-center">
                      <div className="w-24 h-24 mx-auto mb-8  from-orange-500 via-red-500  rounded-lg flex items-center justify-center shadow-lg">
                        <ClipboardList size={48} className="text-white" />
                      </div>

                      <CardTitle className="text-2xl mb-4" gradient>
                        No Course Selected
                      </CardTitle>

                      <CardDescription className="text-lg max-w-2xl mx-auto">
                        Please select a course to view comprehensive module completion data and progress tracking.
                      </CardDescription>
                    </CardContent>
                  </Card>
                ) : moduleCompletionData?.modules ? (
                  <>
                    {/* Course Info Banner */}

                    <Card className="shadow-lg border-0  bg-leafGreen text-white">
                      <CardContent className="p-8">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className="p-4 bg-white/20 rounded-lg backdrop-blur-sm">
                              <GraduationCap size={32} className="text-white" />
                            </div>

                            <div>
                              <CardTitle className="text-2xl text-white mb-2">
                                {moduleCompletionData.course.title}
                              </CardTitle>

                              <CardDescription className="text-forestGreen text-base">
                                📅 Enrolled: {new Date(moduleCompletionData.enrollment.enrolledAt).toLocaleDateString()}
                              </CardDescription>
                            </div>
                          </div>

                          <Badge
                            variant="premium"
                            className="text-lg px-6 py-3 bg-white/20 backdrop-blur-sm border-white/30"
                            glow
                          >
                            <Star size={18} className="mr-2" />

                            {moduleCompletionData.enrollment.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Module Progress Cards */}

                    <div className="space-y-6">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <h3 className="text-2xl font-bold text-gray-900">Module Completion Progress</h3>

                        <Badge variant="premium" className="text-lg px-4 py-2" glow>
                          <BookMarked size={18} className="mr-2" />
                          {moduleCompletionData.modules.length} Modules
                        </Badge>
                      </div>

                      <div className="grid gap-6">
                        {moduleCompletionData.modules.map((module, index) => (
                          <Card
                            key={module.id}
                            className="shadow-lg border-0 hover:shadow-xl transition-all duration-200"
                            gradient
                          >
                            <CardContent className="p-8">
                              <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                                <div className="flex-1">
                                  <div className="flex items-center gap-4 mb-4">
                                    <div
                                      className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md  ${index % 4 === 0
                                        ? "bg-lightGreen"
                                        : index % 4 === 1
                                          ? "bg-leafGreen "
                                          : index % 4 === 2
                                            ? "from-green-500 to-emerald-600"
                                            : "from-orange-500 to-red-600"
                                        }`}
                                    >
                                      {module.sequenceNo}
                                    </div>

                                    <div>
                                      <h4 className="text-xl font-bold text-gray-900 mb-1">{module.title}</h4>

                                      <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <Badge
                                          variant={
                                            module.status === "completed"
                                              ? "success"
                                              : module.status === "in_progress"
                                                ? "warning"
                                                : "secondary"
                                          }
                                          glow
                                        >
                                          {module.status === "not_started"
                                            ? "🚀 Not Started"
                                            : module.status === "in_progress"
                                              ? "⚡ In Progress"
                                              : "✅ Completed"}
                                        </Badge>

                                        <span className="flex items-center gap-2 font-medium">
                                          <Clock size={16} />
                                          {module.durationHours}h duration
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-center lg:text-right">
                                  <div className="text-4xl font-bold  text-forestGreen mb-2">
                                    {module.score}%
                                  </div>

                                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                                    Score
                                  </div>
                                </div>
                              </div>

                              {/* Progress Bar */}

                              <div className="mb-6">
                                <Progress value={module.score} className="h-4" />
                              </div>

                              {/* Module Details Grid */}

                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-6">
                                <div className="p-4  bg-leafGreen to-blue-100 rounded-md border border-leafGreen/20">
                                  <span className="block text-forestGreen mb-2 font-semibold uppercase tracking-wide">
                                    Time Spent
                                  </span>

                                  <span className="font-bold text-forestGreen">
                                    {module.timeSpentFormatted || formatTime(module.timeSpent, "seconds")}
                                  </span>
                                </div>

                                <div className="p-4  from-green-50 to-green-100 rounded-md border border-green-200">
                                  <span className="block text-green-700 mb-2 font-semibold uppercase tracking-wide">
                                    Last Accessed
                                  </span>

                                  <span className="font-bold text-green-900">
                                    {module.lastAccessed ? new Date(module.lastAccessed).toLocaleDateString() : "N/A"}
                                  </span>
                                </div>

                                <div className="p-4  bg-leafGreen rounded-md border border-leafGreen/20">
                                  <span className="block text-leafGreen mb-2 font-semibold uppercase tracking-wide">
                                    Completed
                                  </span>

                                  <span className="font-bold text-leafGreen">
                                    {module.completedAt ? new Date(module.completedAt).toLocaleDateString() : "Not yet"}
                                  </span>
                                </div>

                                <div className="p-4  from-orange-50 to-orange-100 rounded-md border border-orange-200">
                                  <span className="block text-orange-700 mb-2 font-semibold uppercase tracking-wide">
                                    Skill Level
                                  </span>

                                  <Badge variant="premium" className="font-bold">
                                    {module.skillLevel}
                                  </Badge>
                                </div>
                              </div>

                              {/* Topic Performance Summary */}

                              {module.feedback?.available && (
                                <div className="pt-6 border-t border-gray-200">
                                  <div className="flex items-center justify-between mb-4">
                                    <span className="text-base font-bold text-gray-800 flex items-center gap-2">
                                      <Brain size={18} />
                                      Topics Performance
                                    </span>

                                    <span className="text-base font-bold text-green-600 flex items-center gap-2">
                                      <Trophy size={16} />
                                      {module.feedback.strongTopicsPercentage || 0}% Strong Topics
                                    </span>
                                  </div>

                                  <Progress value={module.feedback.strongTopicsPercentage || 0} className="h-3 mb-4" />

                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-md border border-green-200">
                                      <div className="w-4 h-4 rounded-sm  from-green-400 to-emerald-500"></div>

                                      <span className="text-green-700 font-semibold">
                                        Strong: {module.feedback.strongTopicsCount || 0}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-md border border-red-200">
                                      <div className="w-4 h-4 rounded-sm  from-red-400 to-rose-500"></div>

                                      <span className="text-red-700 font-semibold">
                                        Weak: {module.feedback.weakTopicsCount || 0}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Course Completion Summary */}

                    <Card className="shadow-lg border-0" gradient>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-2xl" gradient>
                          <div className="p-3  from-yellow-500 to-orange-600 rounded-md shadow-md">
                            <Award size={32} className="text-white" />
                          </div>
                          Course Completion Summary
                        </CardTitle>

                        <CardDescription className="text-base">
                          Overall progress and performance metrics
                        </CardDescription>
                      </CardHeader>

                      <CardContent>
                        {(() => {
                          const modules = moduleCompletionData?.modules || []

                          const totalModules = modules.length

                          const selectedEnrollment = studentEnrollments.find(
                            (enrollment) => enrollment.courseId === Number.parseInt(selectedCourseId),
                          )

                          const overallPercentage =
                            selectedEnrollment?.completionPercentage !== undefined
                              ? selectedEnrollment.completionPercentage
                              : totalModules
                                ? Math.round(
                                  (modules.filter((m) => m.status === "completed").length / totalModules) * 100,
                                )
                                : 0

                          const completedModules = modules.filter((m) => m?.status === "completed")

                          const completedModulesCount = completedModules.length

                          const inProgressModules = modules.filter((m) => m?.status === "in_progress").length

                          const notStartedModules = modules.filter((m) => m?.status === "not_started").length

                          return (
                            <div className="space-y-8">
                              <div className="text-center">
                                <div className="text-6xl font-bold  text-forestGreen mb-4">
                                  {overallPercentage}%
                                </div>

                                <div className="text-xl font-bold text-gray-700 mb-6">Overall Course Completion</div>

                                <Progress value={overallPercentage} className="h-6 max-w-md mx-auto" />
                              </div>

                              <div className="grid grid-cols-3 gap-6">
                                <Card className="text-center border-2 border-green-300  from-green-50 to-emerald-100 shadow-lg">
                                  <CardContent className="p-6">
                                    <div className="text-3xl font-bold text-green-600 mb-2">
                                      {completedModulesCount}
                                    </div>

                                    <div className="text-sm font-bold text-green-700 uppercase tracking-wide">
                                      Completed
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card className="text-center border-2 border-yellow-300  from-yellow-50 to-orange-100 shadow-lg">
                                  <CardContent className="p-6">
                                    <div className="text-3xl font-bold text-yellow-600 mb-2">{inProgressModules}</div>

                                    <div className="text-sm font-bold text-yellow-700 uppercase tracking-wide">
                                      In Progress
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card className="text-center border-2 border-gray-300  from-gray-50 to-slate-100 shadow-lg">
                                  <CardContent className="p-6">
                                    <div className="text-3xl font-bold text-gray-600 mb-2">{notStartedModules}</div>

                                    <div className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                      Not Started
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="border-2 border-leafGreen/20  bg-lightGreen shadow-lg">
                                  <CardContent className="p-6 text-center">
                                    <div className="text-3xl font-bold text-forestGreen mb-3">
                                      {completedModules.length
                                        ? Math.round(
                                          completedModules.reduce((sum, m) => sum + (m?.score || 0), 0) /
                                          completedModules.length,
                                        )
                                        : 0}
                                      %
                                    </div>

                                    <div className="text-sm font-bold text-forestGreen uppercase tracking-wide">
                                      Average Module Score
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card className="border-2 border-leafGreen/20  bg-leafGreen  shadow-lg">
                                  <CardContent className="p-6 text-center">
                                    <div className="text-3xl font-bold text-leafGreen mb-3">
                                      {completedModules.length
                                        ? Math.round(
                                          (completedModules.filter((m) => m?.isQuizCompleted).length /
                                            completedModules.length) *
                                          100,
                                        )
                                        : 0}
                                      %
                                    </div>

                                    <div className="text-sm font-bold text-leafGreen uppercase tracking-wide">
                                      Quiz Completion
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                          )
                        })()}
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="text-gray-500">
                        <ClipboardList size={64} className="mx-auto mb-6 opacity-50" />

                        <p className="text-lg font-medium">No module completion data available</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Version Comparison Tab */}

              <TabsContent value="4" activeValue={currentTab.toString()} className="space-y-8">
                {!selectedStudent ? (
                  <Card className="border-0 shadow-lg  from-indigo-50  ">
                    <CardContent className="p-12 text-center">
                      <div className="w-24 h-24 mx-auto mb-8  from-indigo-500   rounded-lg flex items-center justify-center shadow-lg">
                        <GitCompare size={48} className="text-white" />
                      </div>

                      <CardTitle className="text-2xl mb-4" gradient>
                        Student Selection Required
                      </CardTitle>

                      <CardDescription className="text-lg max-w-2xl mx-auto">
                        Please select a student first to begin comprehensive version comparison analysis.
                      </CardDescription>
                    </CardContent>
                  </Card>
                ) : !selectedCourseId ? (
                  <Card className="border-0 shadow-lg  from-indigo-50  ">
                    <CardContent className="p-12 text-center">
                      <div className="w-24 h-24 mx-auto mb-8  from-indigo-500   rounded-lg flex items-center justify-center shadow-lg">
                        <GitCompare size={48} className="text-white" />
                      </div>

                      <CardTitle className="text-2xl mb-4" gradient>
                        Course Selection Required
                      </CardTitle>

                      <CardDescription className="text-lg max-w-2xl mx-auto">
                        Please select a course to continue with detailed version comparison.
                      </CardDescription>
                    </CardContent>
                  </Card>
                ) : !selectedModuleId ? (
                  <Card className="border-0 shadow-lg  from-indigo-50  ">
                    <CardContent className="p-12 text-center">
                      <div className="w-24 h-24 mx-auto mb-8  from-indigo-500   rounded-lg flex items-center justify-center shadow-lg">
                        <GitCompare size={48} className="text-white" />
                      </div>

                      <CardTitle className="text-2xl mb-4" gradient>
                        Module Selection Required
                      </CardTitle>

                      <CardDescription className="text-lg max-w-2xl mx-auto">
                        Please select a module to compare different versions and track progress.
                      </CardDescription>
                    </CardContent>
                  </Card>
                ) : availableVersions?.length < 2 ? (
                  <Card className="border-0 shadow-lg  from-indigo-50  ">
                    <CardContent className="p-12 text-center">
                      <div className="w-24 h-24 mx-auto mb-8  from-indigo-500   rounded-lg flex items-center justify-center shadow-lg">
                        <GitCompare size={48} className="text-white" />
                      </div>

                      <CardTitle className="text-2xl mb-4" gradient>
                        Not Enough Versions
                      </CardTitle>

                      <CardDescription className="text-lg max-w-2xl mx-auto">
                        At least 2 versions are required for comparison. This module has only{" "}
                        {availableVersions?.length || 0} version(s).
                      </CardDescription>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Version Selection Panel */}

                    <Card className="shadow-lg border-0  bg-leafGreen via-indigo-50 to-purple-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-2xl" gradient>
                          <div className="p-3  bg-lightGreen rounded-md shadow-md">
                            <GitCompare size={32} className="text-white" />
                          </div>
                          Select Versions to Compare
                        </CardTitle>

                        <CardDescription className="text-base">
                          Choose two different versions to analyze performance changes and improvements
                        </CardDescription>
                      </CardHeader>

                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                              Version 1
                            </label>

                            <select
                              value={compareVersion1}
                              onChange={handleCompareVersion1Select}
                              disabled={isLoadingVersions}
                              className="block w-full px-4 py-4 border-2 border-gray-300 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-leafGreen/25 focus:border-leafGreen/20 bg-white disabled:bg-gray-100 font-medium text-gray-900 appearance-none cursor-pointer hover:border-gray-400 transition-colors duration-150"
                            >
                              <option value="">🎯 Select first version</option>

                              {availableVersions

                                ?.filter((v) => v.moduleId === Number.parseInt(selectedModuleId))

                                .map((v) => (
                                  <option
                                    key={`v1-${v.moduleId}-${v.version}`}
                                    value={v.version}
                                    disabled={v.version === compareVersion2}
                                  >
                                    🔄 Version {v.version} {v.isCurrent && "(Current)"} -{" "}
                                    {new Date(v.created_at).toLocaleDateString()}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                              Version 2
                            </label>

                            <select
                              value={compareVersion2}
                              onChange={handleCompareVersion2Select}
                              disabled={isLoadingVersions || !compareVersion1}
                              className="block w-full px-4 py-4 border-2 border-gray-300 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-leafGreen/25 focus:border-leafGreen/20 bg-white disabled:bg-gray-100 font-medium text-gray-900 appearance-none cursor-pointer hover:border-gray-400 transition-colors duration-150"
                            >
                              <option value="">🎯 Select second version</option>

                              {availableVersions

                                ?.filter((v) => v.moduleId === Number.parseInt(selectedModuleId))

                                .map((v) => (
                                  <option
                                    key={`v2-${v.moduleId}-${v.version}`}
                                    value={v.version}
                                    disabled={v.version === compareVersion1}
                                  >
                                    🔄 Version {v.version} {v.isCurrent && "(Current)"} -{" "}
                                    {new Date(v.created_at).toLocaleDateString()}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {isLoadingVersionComparison ? (
                      <Card>
                        <CardContent className="p-12">
                          <LoadingIndicator />
                        </CardContent>
                      </Card>
                    ) : !compareVersion1 || !compareVersion2 ? (
                      <Card>
                        <CardContent className="p-12 text-center">
                          <div className="text-gray-500">
                            <GitCompare size={64} className="mx-auto mb-6 opacity-50" />

                            <p className="text-lg font-medium">
                              {!compareVersion1
                                ? "Select Version 1 to begin comparison"
                                : "Select Version 2 to complete comparison"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ) : versionComparisonData && versionComparisonData.comparison ? (
                      <>
                        {/* Comparison Summary */}

                        <Card className="shadow-lg border-0" gradient>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-2xl" gradient>
                              <div className="p-3  from-yellow-500 to-orange-600 rounded-md shadow-md">
                                <Zap size={32} className="text-white" />
                              </div>
                              Comparison Summary: Version {compareVersion1} vs Version {compareVersion2}
                            </CardTitle>

                            <CardDescription className="text-base">
                              Performance improvement analysis between selected versions
                            </CardDescription>
                          </CardHeader>

                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                              <Card className="border-2 border-gray-300 shadow-md" gradient>
                                <CardContent className="p-6 text-center">
                                  <Calendar size={32} className="mx-auto mb-4 text-gray-600" />

                                  <div className="text-2xl font-bold text-gray-900 mb-2">
                                    {versionComparisonData.comparison.improvement?.timeDifference || 0}
                                  </div>

                                  <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                                    Days Between
                                  </div>
                                </CardContent>
                              </Card>

                              <Card
                                className={`border-2 shadow-md ${versionComparisonData.comparison.improvement?.scoreChange >= 0
                                  ? "border-green-300  from-green-50 to-emerald-100"
                                  : "border-red-300  from-red-50 to-rose-100"
                                  }`}
                              >
                                <CardContent className="p-6 text-center">
                                  <TrendingUp
                                    size={32}
                                    className={`mx-auto mb-4 ${versionComparisonData.comparison.improvement?.scoreChange >= 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                      }`}
                                  />

                                  <div
                                    className={`text-2xl font-bold mb-2 ${versionComparisonData.comparison.improvement?.scoreChange >= 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                      }`}
                                  >
                                    {versionComparisonData.comparison.improvement?.scoreChange >= 0 ? "+" : ""}
                                    {versionComparisonData.comparison.improvement?.scoreChange || 0}%
                                  </div>

                                  <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                                    Score Change
                                  </div>
                                </CardContent>
                              </Card>

                              <Card
                                className={`border-2 shadow-md ${versionComparisonData.comparison.improvement?.strongTopicsChange >= 0
                                  ? "border-green-300  from-green-50 to-emerald-100"
                                  : "border-red-300  from-red-50 to-rose-100"
                                  }`}
                              >
                                <CardContent className="p-6 text-center">
                                  <Award
                                    size={32}
                                    className={`mx-auto mb-4 ${versionComparisonData.comparison.improvement?.strongTopicsChange >= 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                      }`}
                                  />

                                  <div
                                    className={`text-2xl font-bold mb-2 ${versionComparisonData.comparison.improvement?.strongTopicsChange >= 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                      }`}
                                  >
                                    {versionComparisonData.comparison.improvement?.strongTopicsChange >= 0 ? "+" : ""}

                                    {versionComparisonData.comparison.improvement?.strongTopicsChange || 0}
                                  </div>

                                  <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                                    Strong Topics
                                  </div>
                                </CardContent>
                              </Card>

                              <Card
                                className={`border-2 shadow-md ${versionComparisonData.comparison.improvement?.weakTopicsChange <= 0
                                  ? "border-green-300  from-green-50 to-emerald-100"
                                  : "border-red-300  from-red-50 to-rose-100"
                                  }`}
                              >
                                <CardContent className="p-6 text-center">
                                  <TrendingDown
                                    size={32}
                                    className={`mx-auto mb-4 ${versionComparisonData.comparison.improvement?.weakTopicsChange <= 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                      }`}
                                  />

                                  <div
                                    className={`text-2xl font-bold mb-2 ${versionComparisonData.comparison.improvement?.weakTopicsChange <= 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                      }`}
                                  >
                                    {versionComparisonData.comparison.improvement?.weakTopicsChange >= 0 ? "+" : ""}

                                    {versionComparisonData.comparison.improvement?.weakTopicsChange || 0}
                                  </div>

                                  <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                                    Weak Topics
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Topic Comparison Table */}

                        <Card className="shadow-lg border-0">
                          <CardHeader>
                            <CardTitle className="text-xl" gradient>
                              Topic-by-Topic Comparison
                            </CardTitle>

                            <CardDescription className="text-base">
                              Detailed performance changes across all topics
                            </CardDescription>
                          </CardHeader>

                          <CardContent>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b-2 border-gray-200  from-gray-50 to-white">
                                    <th className="text-left p-6 font-bold text-gray-800 uppercase tracking-wide">
                                      Topic
                                    </th>

                                    <th className="text-center p-6 font-bold text-gray-800 uppercase tracking-wide">
                                      Version {compareVersion1}
                                    </th>

                                    <th className="text-center p-6 font-bold text-gray-800 uppercase tracking-wide">
                                      Version {compareVersion2}
                                    </th>

                                    <th className="text-center p-6 font-bold text-gray-800 uppercase tracking-wide">
                                      Change
                                    </th>

                                    <th className="text-center p-6 font-bold text-gray-800 uppercase tracking-wide">
                                      Status
                                    </th>

                                    <th className="text-center p-6 font-bold text-gray-800 uppercase tracking-wide">
                                      Skill Level
                                    </th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {versionComparisonData.comparison.improvement?.topicComparison?.map(
                                    (topic, index) => (
                                      <tr
                                        key={index}
                                        className={`border-b border-gray-100 hover: hover:bg-leafGreen hover: transition-all duration-150 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                                          }`}
                                      >
                                        <td className="p-6 font-semibold text-gray-900">{topic.title}</td>

                                        <td className="p-6 text-center">
                                          {topic.v1Score !== undefined && topic.v1Score !== null ? (
                                            <Badge variant="outline" className="font-bold">
                                              {topic.v1Score}%
                                            </Badge>
                                          ) : (
                                            <Badge variant="secondary">
                                              {topic.onlyInVersion === 2 ? "🚀 Not started" : "N/A"}
                                            </Badge>
                                          )}
                                        </td>

                                        <td className="p-6 text-center">
                                          {topic.v2Score !== undefined && topic.v2Score !== null ? (
                                            <Badge variant="outline" className="font-bold">
                                              {topic.v2Score}%
                                            </Badge>
                                          ) : (
                                            <Badge variant="secondary">
                                              {topic.onlyInVersion === 1 ? "🚀 Not started" : "N/A"}
                                            </Badge>
                                          )}
                                        </td>

                                        <td className="p-6 text-center">
                                          {topic.scoreDifference !== null ? (
                                            <Badge
                                              variant={
                                                topic.scoreDifference > 0
                                                  ? "success"
                                                  : topic.scoreDifference < 0
                                                    ? "destructive"
                                                    : "secondary"
                                              }
                                              glow
                                            >
                                              {topic.scoreDifference > 0
                                                ? `📈 +${topic.scoreDifference}%`
                                                : `📉 ${topic.scoreDifference}%`}
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline">
                                              {topic.onlyInVersion ? `Only in v${topic.onlyInVersion}` : "-"}
                                            </Badge>
                                          )}
                                        </td>

                                        <td className="p-6 text-center">
                                          {topic.statusChanged ? (
                                            <Badge variant="warning" glow>
                                              🔄 Changed
                                            </Badge>
                                          ) : topic.v1Status === topic.v2Status && topic.v1Status ? (
                                            <Badge variant="secondary">{topic.v1Status}</Badge>
                                          ) : (
                                            <span>-</span>
                                          )}
                                        </td>

                                        <td className="p-6 text-center">
                                          {topic.v1Skill && topic.v2Skill ? (
                                            topic.skillChanged ? (
                                              <Badge variant="info" glow>
                                                {topic.v1Skill} → {topic.v2Skill}
                                              </Badge>
                                            ) : (
                                              <Badge variant="outline">{topic.v1Skill}</Badge>
                                            )
                                          ) : topic.v2Skill ? (
                                            <Badge variant="success" glow>
                                              ✨ {topic.v2Skill}
                                            </Badge>
                                          ) : topic.v1Skill ? (
                                            <Badge variant="destructive">{topic.v1Skill}</Badge>
                                          ) : (
                                            <span>-</span>
                                          )}
                                        </td>
                                      </tr>
                                    ),
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Performance Summary */}

                        <Card className="shadow-lg border-0" gradient>
                          <CardHeader>
                            <CardTitle className="text-xl" gradient>
                              Performance Summary
                            </CardTitle>

                            <CardDescription className="text-base">Overall improvement statistics</CardDescription>
                          </CardHeader>

                          <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              <Card className="border-2 border-green-300  from-green-50 to-emerald-100 shadow-lg">
                                <CardContent className="p-8 text-center">
                                  <TrendingUp size={40} className="mx-auto mb-4 text-green-600" />

                                  <div className="text-3xl font-bold text-green-600 mb-2">
                                    {versionComparisonData.comparison.improvement?.topicComparison?.filter(
                                      (t) => t.scoreDifference > 0,
                                    ).length || 0}
                                  </div>

                                  <div className="text-sm font-bold text-green-700 uppercase tracking-wide">
                                    Improved Topics
                                  </div>
                                </CardContent>
                              </Card>

                              <Card className="border-2 border-red-300  from-red-50 to-rose-100 shadow-lg">
                                <CardContent className="p-8 text-center">
                                  <TrendingDown size={40} className="mx-auto mb-4 text-red-600" />

                                  <div className="text-3xl font-bold text-red-600 mb-2">
                                    {versionComparisonData.comparison.improvement?.topicComparison?.filter(
                                      (t) => t.scoreDifference < 0,
                                    ).length || 0}
                                  </div>

                                  <div className="text-sm font-bold text-red-700 uppercase tracking-wide">
                                    Declined Topics
                                  </div>
                                </CardContent>
                              </Card>

                              <Card className="border-2 border-gray-300  from-gray-50 to-slate-100 shadow-lg">
                                <CardContent className="p-8 text-center">
                                  <Activity size={40} className="mx-auto mb-4 text-gray-600" />

                                  <div className="text-3xl font-bold text-gray-600 mb-2">
                                    {versionComparisonData.comparison.improvement?.topicComparison?.filter(
                                      (t) => t.scoreDifference === 0 && t.onlyInVersion === undefined,
                                    ).length || 0}
                                  </div>

                                  <div className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                    Unchanged Topics
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      <Card>
                        <CardContent className="p-12 text-center">
                          <div className="text-gray-500">
                            <GitCompare size={64} className="mx-auto mb-6 opacity-50" />

                            <p className="text-lg font-medium">No version comparison data available</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Error Analysis Tab */}

              <TabsContent value="5" activeValue={currentTab.toString()} className="space-y-8">
                <ErrorAnalysisTab
                  isLoadingErrorAnalysis={isLoadingErrorAnalysis}
                  selectedCourseId={selectedCourseId}
                  errorAnalysisData={errorAnalysisData && !errorAnalysisData.status ? errorAnalysisData : {}}
                  selectedModuleId={selectedModuleId}
                  selectedVersion={selectedVersion}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}

export default StudentsAnalytics
