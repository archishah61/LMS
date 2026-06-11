/* eslint-disable react/prop-types */
"use client"
import { useState } from "react"
import { useGetCoursePerformanceTrackingQuery } from "../../services/Ai_performace_tracking/coursePerformanceTrackingApi"
import { useSelector } from "react-redux"
import { useLocation } from "react-router-dom"
import { getStudentToken } from "../../services/CookieService"
import {
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  AlertCircle,
  MessageSquare,
  Target,
  Star,
  ChevronRight,
  Play,
  Pause,
  ArrowLeft,
  GraduationCap,
  BarChart3,
  Zap,
} from "lucide-react"
import FeedbackModal from "../courseContent/QuizContent/FeedBackModal"
import StudentsAnalytics from "../../pages/admin/analytics/StudentsAnalytics"
import StudentCourseTracking from "../../pages/admin/analytics/StudentCourseTracking"

// Professional Loading Styles with Blue/Purple Theme
const LoadingStyles = () => (
  <style>{`
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    @keyframes skeleton {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slide-up {
      from { 
        opacity: 0; 
        transform: translateY(20px); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0); 
      }
    }
    
    @keyframes fade-in-up {
      from { 
        opacity: 0; 
        transform: translateY(30px); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0); 
      }
    }
    
    @keyframes loading-bar {
      0% { width: 0%; }
      50% { width: 75%; }
      100% { width: 50%; }
    }
    
    @keyframes loading-bar-slow {
      0% { width: 0%; }
      50% { width: 65%; }
      100% { width: 40%; }
    }
    
    @keyframes pulse-glow {
      0%, 100% { 
        opacity: 1; 
        box-shadow: 0 4px 20px rgba(99, 102, 241, 0.15);
      }
      50% { 
        opacity: 0.9; 
        box-shadow: 0 8px 25px rgba(139, 92, 246, 0.2);
      }
    }
    
    .animate-shimmer {
      animation: shimmer 2.5s infinite;
    }
    
    .animate-skeleton {
      animation: skeleton 2s ease-in-out infinite;
    }
    
    .animate-fade-in {
      animation: fade-in 0.6s ease-out forwards;
      opacity: 0;
    }
    
    .animate-slide-up {
      animation: slide-up 0.6s ease-out forwards;
      opacity: 0;
    }
    
    .animate-fade-in-up {
      animation: fade-in-up 0.8s ease-out forwards;
      opacity: 0;
    }
    
    .animate-loading-bar {
      animation: loading-bar 2.5s ease-in-out infinite;
    }
    
    .animate-loading-bar-slow {
      animation: loading-bar-slow 3.5s ease-in-out infinite;
    }
    
    .animate-pulse-glow {
      animation: pulse-glow 3s ease-in-out infinite;
    }
  `}</style>
)

export default function CoursePerformance() {
  const user = useSelector((state) => state.user)
  const locState = useLocation().state || {}
  const { courseId, coursePublicHash, courseTitle, userId: navUserId } = locState
  const access_token = getStudentToken().access_token

  const { data, error, isLoading, isError, refetch } = useGetCoursePerformanceTrackingQuery(
    {
      userId: navUserId || user.id,
      courseId: courseId,
      access_token,
    },
    {
      skip: !access_token,
    },
  )

  const [activeModuleId, setActiveModuleId] = useState(null)
  const [activeTab, setActiveTab] = useState("CourseTracking")

  const openFeedbackModal = (module) => {
    if (module.status?.toLowerCase() === "completed") {
      setActiveModuleId(module.id)
    } else {
      alert("Please complete this module first to view feedback.")
    }
  }

  const closeFeedbackModal = () => {
    setActiveModuleId(null)
  }

  const handleBack = () => {
    window.history.back()
  }

  if (isLoading) {
    return (
      <div className="container">
        <div >
          {/* Tab Buttons Loading State */}
          <div className="flex gap-4 mb-8">
            <div className="h-10 w-32 bg-gradient-to-r from-blue-200 to-purple-200 rounded animate-skeleton"></div>
            <div className="h-10 w-48 bg-gradient-to-r from-blue-200 to-purple-200 rounded animate-skeleton"></div>
          </div>
          {/* Back Button Loading State */}
          <div className="mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-3 w-44">
              <div className="w-9 h-9 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg animate-pulse-glow"></div>
              <div className="h-4 w-28 bg-gradient-to-r from-blue-200 to-purple-200 rounded animate-skeleton"></div>
            </div>
          </div>

          {/* Professional Loading Header */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/50 p-8 mb-8 relative overflow-hidden animate-fade-in">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/3 via-purple-500/3 to-indigo-500/3"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/8 to-purple-400/8 rounded-full -translate-y-32 translate-x-32"></div>

            {/* Shimmer Effect */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            <div className="relative z-10">
              <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-4">

                    <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg animate-pulse-glow shadow-lg"></div>
                    <div>
                      <div className="h-10 w-80 bg-gradient-to-r from-blue-200 via-purple-200 to-indigo-200 rounded-lg mb-3 animate-skeleton"></div>
                      <div
                        className="h-5 w-64 bg-gradient-to-r from-blue-200 via-purple-200 to-indigo-200 rounded animate-skeleton"
                        style={{ animationDelay: "0.3s" }}
                      ></div>
                    </div>
                  </div>
                  <div
                    className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 rounded-lg animate-pulse-glow border border-blue-100/50"
                    style={{ animationDelay: "0.4s" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-300 to-purple-300 rounded-lg animate-pulse"></div>
                      <div>
                        <div className="h-3 w-16 bg-blue-200 rounded mb-2"></div>
                        <div className="h-6 w-24 bg-blue-300 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar Loading */}
                <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.5s" }}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="h-6 w-32 bg-gradient-to-r from-blue-200 to-purple-200 rounded animate-skeleton"></div>
                    <div className="h-8 w-16 bg-gradient-to-r from-blue-200 to-purple-200 rounded animate-skeleton"></div>
                  </div>
                  <div className="w-full bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg h-4 shadow-inner overflow-hidden">
                    <div className="h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg animate-loading-bar shadow-sm"></div>
                  </div>
                </div>

                {/* Stats Cards Loading */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="bg-gradient-to-br from-white/90 to-blue-50/30 backdrop-blur-sm p-6 rounded-lg border border-white/60 shadow-lg animate-fade-in-up relative overflow-hidden"
                      style={{ animationDelay: `${0.6 + i * 0.1}s` }}
                    >
                      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-300 to-purple-300 rounded-lg animate-pulse-glow shadow-lg"></div>
                          <div className="w-5 h-5 bg-blue-200 rounded animate-pulse"></div>
                        </div>
                        <div>
                          <div className="h-4 w-20 bg-blue-200 rounded mb-2 animate-skeleton"></div>
                          <div className="h-8 w-16 bg-gradient-to-r from-blue-200 to-purple-200 rounded animate-skeleton"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Session Cards Loading */}
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/50 p-8 mb-8 relative overflow-hidden animate-fade-in-up"
              style={{ animationDelay: `${1.0 + i * 0.2}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/2 to-purple-500/2"></div>
              <div
                className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/15 to-transparent"
                style={{ animationDelay: `${i * 0.5}s` }}
              ></div>

              <div className="relative z-10">
                <div className="animate-slide-up" style={{ animationDelay: `${1.1 + i * 0.2}s` }}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-lg animate-pulse-glow shadow-lg"></div>
                      <div>
                        <div className="h-8 w-64 bg-gradient-to-r from-blue-200 via-purple-200 to-indigo-200 rounded mb-2 animate-skeleton"></div>
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-20 bg-blue-300 rounded-full animate-pulse"></div>
                          <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
                          <div className="h-4 w-32 bg-blue-300 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-10 w-16 bg-gradient-to-r from-blue-200 to-purple-200 rounded mb-1 animate-skeleton"></div>
                      <div className="h-4 w-24 bg-blue-300 rounded animate-pulse"></div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="w-full bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg h-3 shadow-inner overflow-hidden">
                      <div className="h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg animate-loading-bar-slow shadow-sm"></div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {[1, 2, 3].map((j) => (
                      <div
                        key={j}
                        className="bg-gradient-to-r from-blue-50/60 to-purple-50/60 backdrop-blur-sm rounded-lg border border-blue-100/40 p-6 relative overflow-hidden animate-fade-in-up"
                        style={{ animationDelay: `${1.3 + i * 0.2 + j * 0.1}s` }}
                      >
                        <div
                          className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent"
                          style={{ animationDelay: `${j * 0.3}s` }}
                        ></div>
                        <div className="relative z-10">
                          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg animate-pulse-glow shadow-sm"></div>
                              <div className="flex-1">
                                <div className="h-6 w-48 bg-gradient-to-r from-blue-200 to-purple-200 rounded mb-3 animate-skeleton"></div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <div className="h-6 w-20 bg-blue-300 rounded-full animate-pulse"></div>
                                  <div
                                    className="h-6 w-24 bg-purple-300 rounded-full animate-pulse"
                                    style={{ animationDelay: "0.1s" }}
                                  ></div>
                                  <div
                                    className="h-6 w-18 bg-indigo-300 rounded-full animate-pulse"
                                    style={{ animationDelay: "0.2s" }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-32 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg animate-pulse-glow shadow-sm"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Professional Loading Indicator */}
        <div className="fixed bottom-8 right-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-xl border border-white/50">
            <div className="w-6 h-6 border-3 border-blue-500 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Tab Buttons Error State */}
          <div className="flex gap-4 mb-8">
            <button className="px-6 py-2 rounded-t-lg font-semibold bg-gray-100 cursor-not-allowed">Feedback</button>
            <button className="px-6 py-2 rounded-t-lg font-semibold bg-gray-100 cursor-not-allowed">Progress Analytics</button>
          </div>
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="group flex items-center gap-3 px-5 py-3 bg-white/95 backdrop-blur-sm rounded-lg border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm group-hover:from-blue-600 group-hover:to-purple-700 transition-all duration-300">
                <ArrowLeft className="text-white h-4 w-4" />
              </div>
              <span className="font-semibold text-gray-700">Back to Course</span>
            </button>
          </div>

          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-white/95 backdrop-blur-sm border border-red-200/50 rounded-xl shadow-xl p-10 text-center max-w-md">
              <div className="w-20 h-20 bg-gradient-to-r from-red-100 to-red-200 rounded-lg flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
                Something went wrong
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {error?.data?.message || "We couldn't load your course performance data. Please try again."}
              </p>
              <button
                onClick={() => refetch()}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Calculate overall course progress
  const safeSessions = Array.isArray(data?.sessions) ? data.sessions : [];
  const totalModules = safeSessions.reduce((acc, session) => acc + (session.modules?.length || 0), 0)
  const completedModules = safeSessions.reduce(
    (acc, session) => acc + (session.modules?.filter((module) => module.status === "completed").length || 0),
    0,
  )
  const overallPercentage = totalModules ? Math.round((completedModules / totalModules) * 100) : 0

  return (
    <>
      <LoadingStyles />
      <div className="container">
        {/* Tab Buttons */}
        {/* <button
              className={`px-6 py-2 rounded-t-lg font-semibold transition-all duration-200 border-b-2 ${activeTab === "feedback" ? "bg-white shadow border-blue-500 text-blue-700" : "bg-gray-100 border-transparent text-gray-500"}`}
              onClick={() => setActiveTab("feedback")}
            >
              Feedback
            </button>
            <button
              className={`px-6 py-2 rounded-t-lg font-semibold transition-all duration-200 border-b-2 ${activeTab === "analytics" ? "bg-white shadow border-purple-500 text-purple-700" : "bg-gray-100 border-transparent text-gray-500"}`}
              onClick={() => setActiveTab("analytics")}
            >
              Progress Analytics
            </button> */}

        {/* <button
              className={`px-6 py-2 rounded-t-lg font-semibold transition-all duration-200 border-b-2 ${activeTab === "CourseTracking" ? "bg-white shadow border-purple-500 text-purple-700" : "bg-gray-100 border-transparent text-gray-500"}`}
              onClick={() => setActiveTab("CourseTracking")}
            >
              Course Tracking
            </button> */}

      </div>

      {/* Tab Content */}
      {activeTab === "feedback" ? (
        <>
          {/* Progress Analytics content moved to top of Feedback tab */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/50 p-8 mb-8 relative overflow-hidden animate-fade-in-up">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/3 via-purple-500/3 to-indigo-500/3"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/8 to-purple-400/8 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                      <GraduationCap className="text-white h-7 w-7" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                        {data.courseTitle}
                      </h1>
                      <p className="text-gray-500 mt-1 text-lg font-medium">Performance Analytics Dashboard</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 rounded-lg border border-blue-100/50 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                      <Target className="text-white h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 font-semibold mb-1">Overall Progress</div>
                      <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {completedModules} of {totalModules} modules
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Professional Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-bold text-gray-700">Course Completion</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {overallPercentage}%
                  </span>
                </div>
                <div className="relative">
                  <div className="w-full bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg h-4 shadow-inner">
                    <div
                      className={`h-4 rounded-lg transition-all duration-1000 ease-out relative overflow-hidden shadow-sm ${overallPercentage < 30
                        ? "bg-gradient-to-r from-red-400 to-red-500"
                        : overallPercentage < 70
                          ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                          : "bg-gradient-to-r from-green-400 to-emerald-500"
                        }`}
                      style={{ width: `${overallPercentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Professional Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: BarChart3,
                    label: "Sessions",
                    value: data.sessions.length,
                    color: "from-purple-500 to-pink-500",
                    bg: "from-purple-50 to-pink-50",
                    border: "border-purple-100/50",
                  },
                  {
                    icon: BookOpen,
                    label: "Total Modules",
                    value: totalModules,
                    color: "from-blue-500 to-cyan-500",
                    bg: "from-blue-50 to-cyan-50",
                    border: "border-blue-100/50",
                  },
                  {
                    icon: CheckCircle,
                    label: "Module Completed for feedback",
                    value: completedModules,
                    color: "from-green-500 to-emerald-500",
                    bg: "from-green-50 to-emerald-50",
                    border: "border-green-100/50",
                  },
                  {
                    icon: Zap,
                    label: "Progress",
                    value: `${overallPercentage}%`,
                    color: "from-indigo-500 to-purple-500",
                    bg: "from-indigo-50 to-purple-50",
                    border: "border-indigo-100/50",
                  },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className={`bg-gradient-to-br ${stat.bg} backdrop-blur-sm p-6 rounded-lg border ${stat.border} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}
                      >
                        <stat.icon className="text-white h-6 w-6" />
                      </div>
                      <ChevronRight className="text-gray-400 h-5 w-5 group-hover:text-gray-600 transition-colors duration-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Feedback Section (sessions/modules/feedback modal) */}
          <div className="space-y-8">
            {data.sessions.map((session, sessionIndex) => {
              const totalSessionModules = session.modules.length
              const completedSessionModules = session.modules.filter((module) => module.status === "completed").length
              const sessionPercentage = Math.round((completedSessionModules / totalSessionModules) * 100) || 0

              return (
                <div
                  key={session.id}
                  className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${0.3 + sessionIndex * 0.1}s` }}
                >
                  <div className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">{sessionIndex + 1}</span>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-1">
                            {session.title}
                          </h2>
                          <div className="flex items-center gap-3">
                            <ProfessionalStatusBadge status={session.status} />
                            <span className="text-gray-400">•</span>
                            <span className="text-sm font-semibold text-gray-600">
                              {completedSessionModules} of {totalSessionModules} modules completed
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
                          {sessionPercentage}%
                        </div>
                        <div className="text-sm text-gray-500 font-medium">Session Progress</div>
                      </div>
                    </div>

                    {/* Professional Session Progress Bar */}
                    <div className="mb-8">
                      <div className="w-full bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg h-3 shadow-inner">
                        <div
                          className={`h-3 rounded-lg transition-all duration-1000 ease-out relative overflow-hidden shadow-sm ${sessionPercentage < 30
                            ? "bg-gradient-to-r from-red-400 to-red-500"
                            : sessionPercentage < 70
                              ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                              : "bg-gradient-to-r from-green-400 to-emerald-500"
                            }`}
                          style={{ width: `${sessionPercentage}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    {/* Professional Modules Grid */}
                    <div className="grid gap-4">
                      {session.modules.map((module, moduleIndex) => (
                        <div
                          key={module.id}
                          className="bg-gradient-to-r from-blue-50/60 to-purple-50/60 backdrop-blur-sm rounded-lg border border-blue-100/40 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 group"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                                <span className="text-gray-700 font-bold">{moduleIndex + 1}</span>
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                                  {module.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-3">
                                  <ProfessionalStatusBadge status={module.status} />
                                  {module.progressTracking ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 shadow-sm">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Progress Tracked
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-slate-100 text-gray-600 border border-gray-200 shadow-sm">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Pending
                                    </span>
                                  )}
                                  {module.quizCompleted ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200 shadow-sm">
                                      <Star className="w-3 h-3 mr-1" />
                                      Quiz Completed
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border border-orange-200 shadow-sm">
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Quiz Pending
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => openFeedbackModal(module)}
                                className={`inline-flex items-center px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${module.status?.toLowerCase() === "completed"
                                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-700"
                                  : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-400 cursor-not-allowed border border-gray-200"
                                  }`}
                                disabled={module.status?.toLowerCase() !== "completed"}
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                {module.status?.toLowerCase() === "completed" ? "View Feedback" : "Complete First"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Feedback Modal */}
          {activeModuleId && (
            <FeedbackModal
              userId={user.id}
              moduleId={activeModuleId}
              isOpen={!!activeModuleId}
              onClose={closeFeedbackModal}
            />
          )}
        </>
      ) : activeTab === "analytics" ? (
        // Progress Analytics Tab: now empty/placeholder
        <StudentsAnalytics />
      ) : activeTab === "CourseTracking" ? (
        <StudentCourseTracking state={{
          courseId,
          coursePublicHash,
          courseTitle,
          userId: navUserId || user.id,
          forStudent: true
        }} />
      ) : null}
    </>
  )
}

// Professional Status Badge Component
function ProfessionalStatusBadge({ status }) {
  switch (status?.toLowerCase()) {
    case "completed":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 shadow-sm">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </span>
      )
    case "in progress":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200 shadow-sm">
          <Play className="w-3 h-3 mr-1" />
          In Progress
        </span>
      )
    case "not started":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200 shadow-sm">
          <Pause className="w-3 h-3 mr-1" />
          Not Started
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-slate-100 text-gray-600 border border-gray-200 shadow-sm">
          <Clock className="w-3 h-3 mr-1" />
          {status || "Unknown"}
        </span>
      )
  }
}
