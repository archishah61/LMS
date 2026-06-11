/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BookOpen,
  Star,
  MessageSquare,
  Clock,
  AlertCircle,
  LifeBuoy,
  Lock,
  CheckCircle,
  Timer,
  Download,
  BarChart2,
  GraduationCap,
  PlayCircle,
  ChevronRight,
  TrendingUp,
  List,
  MoreVertical,
  X,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import SupportModal from "../modal/SupportModal";
import PrimaryLoader from "../ui/PrimaryLoader";
import { getStudentToken } from "../../services/CookieService";
import ProgressBar from "./ProgressBar";
import { useGetEnrollmentsQuery } from "../../services/Enrollment/enrollAPI";
import { useGetCourseCategoryByIdQuery } from "../../services/Course_Management/courseCatagoryApi";
import { useCheckCourseAccessQuery } from "../../services/Learning_Progress/courseTimeTrackingAPI";
import { slugify } from "../../utils/slugify";
import { useAuthModal } from "../../context/AuthModalContext";

const CourseList = ({ courses, userId, viewMode = 'list' }) => {
  return (
    <div>
      <div className={viewMode === 'grid'
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6"
        : "flex flex-col gap-4 sm:gap-5 lg:gap-6"
      }>
        {courses.map((course) => (
          <CourseItem
            key={course.user_hash}
            user_hash={course.user_hash}
            course={course.course}
            userId={userId}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  );
};

const CourseItem = ({ course, user_hash, userId, viewMode = 'list' }) => {
  const navigate = useNavigate();
  const [isGridMenuOpen, setGridMenuOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isAccessModalOpen, setAccessModalOpen] = useState(false);
  const [isSupportModalOpen, setSupportModalOpen] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const { access_token } = getStudentToken();
  const {
    data: enrollments,
    error: enrollmentsError,
    isLoading: isEnrollmentsLoading,
    refetch: refetchEnrollments,
  } = useGetEnrollmentsQuery(
    { access_token },
    {
      skip: !access_token,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );
  const { data: categoryData } = useGetCourseCategoryByIdQuery({
    id: course.category_id,
    access_token,
  });
  // Find the enrollment for this course
  const courseEnrollment = enrollments?.find(
    (enrollment) =>
      enrollment.course_id === course.id && enrollment.user_id === userId
  );
  const enrollmentId = courseEnrollment?.id;
  // Course access check query - will run when enrollment ID is available
  const {
    data: accessData,
    refetch: refetchAccessStatus,
    isLoading: isAccessLoading,
  } = useCheckCourseAccessQuery(enrollmentId, {
    skip: !enrollmentId,
    refetchOnMountOrArgChange: true,
  });

  const { openLogin } = useAuthModal();
  useEffect(() => {
    if (!access_token) {
      navigate("/");
      openLogin();
    }
  }, [access_token, navigate, openLogin]);

  // Ensure user is authenticated
  if (!access_token) {
    return null;
  }

  if (isEnrollmentsLoading && !enrollments) {
    return (
        <PrimaryLoader className="h-10 w-10" />
    );
  }

  // Extract the completion percentage correctly
  const completionPercentage = courseEnrollment?.completion_percentage ?? 0;
  // Format expiry date
  const expiryDate = courseEnrollment?.expiry_date
    ? new Date(courseEnrollment.expiry_date).toLocaleDateString("en-GB")
    : "No expiration";
  // Access control logic
  const canAccess = accessData?.data?.canAccess ?? true;
  const hasActiveSession = accessData?.data?.hasActiveSession ?? false;
  const todaySecondsSpent = accessData?.data?.todaySecondsSpent || 0;
  const maxAllowedDailySeconds = accessData?.data?.maxAllowedDailySeconds || 0;
  const todayMinutesSpent = accessData?.data?.todayMinutesSpent || 0;
  const maxAllowedDailyHours = accessData?.data?.maxAllowedDailyHours;
  const minRequiredDailyHours = accessData?.data?.minRequiredDailyHours;
  const maxAllowedDailyMinutes = accessData?.data?.maxAllowedDailyMinutes;
  const accessReason = accessData?.data?.reason;
  
  const isCompleted = courseEnrollment?.is_completed === 1 || courseEnrollment?.is_completed === true;
  const getStatusTextAndStyle = () => {
    if (isCompleted) {
      return {
        label: 'Completed',
        style: 'bg-blue-50 text-blue-600 border border-blue-200/50'
      };
    }
    if (!canAccess) {
      return {
        label: 'Restricted',
        style: 'bg-amber-50 text-amber-600 border border-amber-200/50'
      };
    }
    if (completionPercentage === 0) {
      return {
        label: 'Not Started',
        style: 'bg-gray-100 text-gray-500 border border-gray-200/50'
      };
    }
    return {
      label: 'In Progress',
      style: 'bg-lightGreen text-leafGreen border border-primary/20'
    };
  };
  const statusInfo = getStatusTextAndStyle();

  // Determine access status and styling
  const getAccessStatus = () => {
    if (isAccessLoading) {
      return {
        status: "loading",
        color: "text-gray-500",
        icon: Timer,
        message: "Checking access...",
      };
    }
    if (!canAccess) {
      if (maxAllowedDailySeconds && todaySecondsSpent >= maxAllowedDailySeconds) {
        return {
          status: "exceeded",
          color: "text-red-600",
          icon: Lock,
          message: `Daily limit reached`,
        };
      }
      return {
        status: "restricted",
        color: "text-amber-600",
        icon: AlertCircle,
        message: accessReason || "Access restricted",
      };
    }
    if (hasActiveSession) {
      return {
        status: "active",
        color: "text-green-600",
        icon: CheckCircle,
        message: "Session active",
      };
    }
    return {
      status: "available",
      color: "text-blue-600",
      icon: BookOpen,
      message: "Ready to learn",
    };
  };
  const accessStatus = getAccessStatus();
  const getThumbnailUrl = () => {
    if (course.thumbnail) {
      return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${course.thumbnail || "/placeholder.png"}`;
    }
    return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`;
  };
  // Enhanced Continue Learning handler with access control
  const handleContinueLearning = async () => {
    setIsCheckingAccess(true);
    try {
      if (!accessData) {
        // Either the query was skipped or hasn't run yet.
        toast.error("Access status not yet available. Please try again.");
        return;
      }
      const { data: latestAccessData } = await refetchAccessStatus();
      if (!latestAccessData?.data?.canAccess) {
        setAccessModalOpen(true);
        return;
      }
      // Access is allowed, navigate to course content
      navigate(`/course-content/${slugify(course.title)}`, {
        state: { courseID: user_hash }
      });
    } catch (error) {
      console.error("Error checking access:", error);
      toast.error("Failed to check course access. Please try again.");
    } finally {
      setIsCheckingAccess(false);
    }
  };
  const closeAccessModal = () => {
    setAccessModalOpen(false);
  };
  // Format time for display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };
  // Mobile optimized format time
  const formatTimeMobile = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${secs}s`;
    }
  };
  // Calculate remaining time for today
  const getRemainingTime = () => {
    if (!maxAllowedDailySeconds) return null;
    const remaining = maxAllowedDailySeconds - todaySecondsSpent;
    return remaining > 0 ? remaining : 0;
  };
  const remainingTime = getRemainingTime();
  const mediaBase = import.meta.env.VITE_BACKEND_MEDIA_URL || ""
  const fullUrl = courseEnrollment?.certificate_url ? `${mediaBase}${courseEnrollment.certificate_url}` : null
  const chartData = [
    { name: 'Time Spent', value: todaySecondsSpent, color: '#00BB6E' },
    { name: 'Remaining', value: maxAllowedDailySeconds ? Math.max(0, maxAllowedDailySeconds - todaySecondsSpent) : 0, color: '#f3f4f6' }
  ];

  return (
    <div className={`w-full bg-white rounded-[0.60rem] p-3 sm:p-4 border border-gray-100 transition-all duration-300 flex flex-col h-full`}>
      {viewMode === 'list' ? (
        // LIST VIEW - Responsive 60/40 SPLIT
        <div className="flex flex-col lg:flex-row h-auto w-full gap-4 lg:gap-6">
          {/* Left Section (Mobile: 100%, Tablet: 100%, Desktop: 70%) */}
          <div className="w-full lg:w-[70%] p-2 lg:p-3 flex flex-col gap-3 lg:gap-4 relative lg:border-r border-gray-100">

            {/* Top Row: Thumbnail + Info - Responsive stacking */}
            <div className="flex flex-col sm:flex-row gap-4 lg:gap-5">
              {/* Thumbnail - Responsive sizing */}
              <div className="w-full sm:w-48 lg:w-56 h-32 sm:h-36 lg:h-36 shrink-0 relative bg-sand rounded-lg overflow-hidden shadow-sm">
                {course.thumbnail ? (
                  <img
                    src={getThumbnailUrl() || "/assets/placeholder2.png"}
                    alt={course.title}
                    onError={(e) => { e.target.onerror = null; e.target.src = "/assets/placeholder2.png"; }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img src="/assets/placeholder2.png" alt="Placeholder" className="w-full h-full object-cover" />
                )}
                <div className="absolute top-2 left-2">
                  <span className="bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-megistic shadow-sm border border-white/20">
                    {categoryData?.category || "Course"}
                  </span>
                </div>
              </div>

              {/* Info Column */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-megistic leading-tight mb-2 line-clamp-2">{course.title}</h3>
                  <div className="text-gray-500 text-xs sm:text-sm line-clamp-2 lg:line-clamp-2 mb-2 lg:mb-3" dangerouslySetInnerHTML={{ __html: course.description || "Start mastering this subject today." }} />
                </div>

                {/* Stats Row - Responsive layout */}
                <div className="w-full flex flex-wrap sm:flex-nowrap items-center justify-between border-t border-b border-gray-100 py-2 lg:py-3 mt-auto">
                  {/* Daily Limit - Hide on mobile if too small */}
                  <div className="w-1/3 sm:w-auto flex-1 flex flex-col items-center px-1 sm:px-0">
                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Daily Limit</span>
                    <span className="text-xs sm:text-sm font-bold text-megistic truncate w-full text-center">
                      {maxAllowedDailyHours ? formatTime(maxAllowedDailySeconds) : 'None'}
                    </span>
                  </div>
                  <div className="hidden sm:block h-8 w-px bg-gray-200"></div>
                  <div className="w-1/3 sm:w-auto flex-1 flex flex-col items-center px-1 sm:px-0">
                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Time Spent</span>
                    <span className={`text-xs sm:text-sm font-bold ${todaySecondsSpent > 0 ? 'text-leafGreen' : 'text-gray-800'} truncate w-full text-center`}>
                      {window.innerWidth < 640 ? formatTimeMobile(todaySecondsSpent) : formatTime(todaySecondsSpent)}
                    </span>
                  </div>
                  <div className="hidden sm:block h-8 w-px bg-gray-200"></div>
                  <div className="w-1/3 sm:w-auto flex-1 flex flex-col items-center px-1 sm:px-0">
                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Remaining</span>
                    <span className="text-xs sm:text-sm font-bold text-gray-800 truncate w-full text-center">
                      {remainingTime != null ?
                        (window.innerWidth < 640 ? formatTimeMobile(remainingTime) : formatTime(remainingTime))
                        : 'Unlimited'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar Row */}
            <div className="w-full">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-xs font-bold text-megistic">{Math.round(completionPercentage)}% Complete</span>
                <div className="flex flex-col items-end gap-1">
                  <span className={`inline-flex items-center px-2 lg:px-3 py-0.5 lg:py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${statusInfo.style}`}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2 overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${completionPercentage}%` }} />
              </div>
            </div>

            {/* Actions Row - Responsive button sizing and wrapping */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-auto">
              <button
                onClick={handleContinueLearning}
                disabled={isCheckingAccess}
                className="bg-primary text-white font-bold py-2.5 px-4 sm:px-6 rounded-md flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed group w-full sm:w-auto flex-grow sm:flex-grow-0 min-w-0 sm:min-w-[180px]"
              >
                {isCheckingAccess ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="hidden sm:inline">Loading...</span>
                  </span>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 fill-white/20" />
                    <span className="truncate">Continue Learning</span>
                  </>
                )}
              </button>

              {/* Action Buttons - Responsive sizing */}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                <button
                  onClick={() => navigate(`/course/${slugify(course.title)}/learning`, {
                    state: {
                      coursePublicHash: course.public_hash,
                      courseId: course.id,
                      userId: userId,
                      courseTitle: course.title,
                      user_hash: user_hash
                    }
                  })}
                  className="h-8 sm:h-10 px-2.5 sm:px-3 flex items-center justify-center gap-1.5 sm:gap-2 rounded-md border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors whitespace-nowrap"
                >
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                  <span className="text-[10px] sm:text-xs font-semibold">My Learning</span>
                </button>
                <button
                  onClick={() => navigate(`/course/${slugify(course.title)}/performance`, { state: { courseId: course.id, coursePublicHash: course.public_hash, courseTitle: course.title, userId } })}
                  className="h-8 sm:h-10 px-2.5 sm:px-3 flex items-center justify-center gap-1.5 sm:gap-2 rounded-md border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors whitespace-nowrap"
                >
                  <BarChart2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                  <span className="text-[10px] sm:text-xs font-semibold">Performance</span>
                </button>
                {fullUrl && (
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(fullUrl, { mode: "cors" });
                        const blob = await response.blob();
                        const blobUrl = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = blobUrl;
                        a.download = `Certificate-${course.title}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(blobUrl);
                      } catch (e) { toast.error("Failed"); }
                    }}
                    className="h-8 sm:h-10 px-2.5 sm:px-3 flex items-center justify-center gap-1.5 sm:gap-2 rounded-md border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors whitespace-nowrap"
                  >
                    <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
                    <span className="text-[10px] sm:text-xs font-semibold">Certificate</span>
                  </button>
                )}
                <button
                  onClick={() => setSupportModalOpen(true)}
                  className="h-8 sm:h-10 px-2.5 sm:px-3 flex items-center justify-center gap-1.5 sm:gap-2 rounded-md border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors whitespace-nowrap"
                >
                  <LifeBuoy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                  <span className="text-[10px] sm:text-xs font-semibold">Support</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Section (Mobile: 100%, Tablet: 100%, Desktop: 30%) */}
          <div className="w-full lg:w-[30%] bg-gray-50/50 p-3 lg:p-4 flex flex-col items-center justify-center relative rounded-xl lg:rounded-l-none">
            <h4 className="absolute top-3 lg:top-4 left-3 lg:left-4 text-[9px] lg:text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3" /> <span className="hidden sm:inline">Daily Limit</span>
            </h4>

            {maxAllowedDailyHours ? (
              <>
                {/* Pie Chart - Responsive sizing */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 mt-6 lg:mt-2 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={window.innerWidth < 640 ? 35 : 45} outerRadius={window.innerWidth < 640 ? 50 : 60} startAngle={90} endAngle={-270} dataKey="value" stroke="none" cornerRadius={4} paddingAngle={5}>
                        {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-md font-semibold text-gray-800">
                      {formatTime(todaySecondsSpent)}
                    </span>
                    <span className="text-[8px] lg:text-[10px] text-gray-400 uppercase font-medium">Spent</span>
                  </div>
                </div>

                {/* Detailed Stats - Responsive text sizing */}
                <div className="w-full mt-3 lg:mt-4 space-y-1.5 lg:space-y-2 px-1 lg:px-2 text-[10px] sm:text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>Spent</span>
                    </span>
                    <span className="font-semibold text-gray-800 truncate pl-1">
                      {window.innerWidth < 640 ? formatTimeMobile(todaySecondsSpent) : formatTime(todaySecondsSpent)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                      <span>Remaining</span>
                    </span>
                    <span className={`font-semibold ${remainingTime != null && remainingTime <= 1800 ? 'text-orange-500' : 'text-gray-800'} truncate pl-1`}>
                      {remainingTime != null ?
                        (window.innerWidth < 640 ? formatTimeMobile(remainingTime) : formatTime(remainingTime))
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="pt-1.5 lg:pt-2 border-t border-gray-200 flex justify-between items-center mt-1 lg:mt-2">
                    <span className="text-gray-400 font-medium">Limit</span>
                    <span className="font-bold text-gray-700">
                      {window.innerWidth < 640 ? formatTimeMobile(maxAllowedDailySeconds) : formatTime(maxAllowedDailySeconds)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4 lg:py-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900">No Daily Limit</p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1 px-2 lg:px-4">Learn as much as you want!</p>
              </div>
            )}

            {/* Bottom Stats Grid - Mobile Only */}
            <div className="grid grid-cols-2 gap-2 border-t border-lightGreen border-b py-2 mt-3 w-full sm:hidden">
              <div className="border-r border-lightGreen px-1 text-center">
                <p className="text-[8px] text-darkSand/70 font-bold uppercase tracking-wider mb-0.5">Time Spent</p>
                <p className={`text-sm font-bold ${todaySecondsSpent > 0 ? 'text-leafGreen' : 'text-megistic'}`}>
                  {formatTimeMobile(todaySecondsSpent)}
                </p>
              </div>
              <div className="px-1 text-center">
                <p className="text-[8px] text-darkSand/70 font-bold uppercase tracking-wider mb-0.5">Remaining</p>
                <p className={`text-sm font-bold ${remainingTime != null && remainingTime <= 1800 ? 'text-orange-500' : 'text-megistic'}`}>
                  {remainingTime != null ? formatTimeMobile(remainingTime) : <span className="text-darkSand/50 text-xs">Unl.</span>}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // GRID VIEW - Responsive
        <div className="flex flex-col gap-3 sm:gap-4 h-full relative">
          {/* Thumbnail - Responsive sizing */}
          <div className="w-full aspect-video h-40 sm:h-48 lg:h-52 shrink-0 relative bg-sand rounded-xl overflow-hidden">
            {course.thumbnail ? (
              <img
                src={getThumbnailUrl() || "/assets/placeholder2.png"}
                alt={course.title}
                onError={(e) => { e.target.onerror = null; e.target.src = "/assets/placeholder2.png"; }}
                className="w-full h-full object-cover"
              />
            ) : (
              <img src="/assets/placeholder2.png" alt="Placeholder" className="w-full h-full object-cover" />
            )}
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
              <span className="bg-white/90 backdrop-blur-md px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider text-megistic shadow-sm border border-white/20">
                {categoryData?.category || "Course"}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-1 sm:mt-2 mb-2">
            <div className="flex justify-between items-end mb-1 sm:mb-1.5">
              <span className="text-xs font-bold text-megistic">{Math.round(completionPercentage)}% Complete</span>
              <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${statusInfo.style}`}>
                {statusInfo.label}
              </span>
            </div>
            <div className="w-full bg-sand rounded-full h-1.5 sm:h-2 overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${completionPercentage}%` }} />
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-1 sm:mb-2">
              <div className="flex-1 pr-1 sm:pr-2">
                <h3 className="text-base sm:text-lg font-bold text-megistic mb-1 sm:mb-2 leading-tight line-clamp-2 h-10 sm:h-12 overflow-hidden">{course.title}</h3>
                <div className="text-gray-500 text-xs sm:text-sm line-clamp-2 mb-2 sm:mb-3" dangerouslySetInnerHTML={{ __html: course.description || "Start mastering this subject today." }} />
              </div>
            </div>

            {/* Actions Row - Grid View Modified */}
            <div className="relative mt-auto">
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  onClick={handleContinueLearning}
                  disabled={isCheckingAccess}
                  className="bg-leafGreen text-white font-bold py-2 sm:py-2.5 px-4 sm:px-6 rounded-xl flex-1 flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed group text-xs sm:text-sm"
                >
                  {isCheckingAccess ? (
                    <span className="animate-pulse text-xs">Loading...</span>
                  ) : (
                    <>
                      <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="truncate">Continue</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowStats(true)}
                  className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl border border-gray-200 text-darkSand transition-all"
                >
                  <Clock className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
                </button>

                <button
                  onClick={() => setGridMenuOpen(!isGridMenuOpen)}
                  className={`w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl border transition-all ${isGridMenuOpen ? 'border-primary bg-green-50 text-primary' : 'border-gray-200 text-darkSand'}`}
                >
                  <MoreVertical className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
                </button>
              </div>

              {/* Dropdown Menu - Responsive positioning */}
              {isGridMenuOpen && (
                <div className="absolute bottom-full right-0 mb-1.5 sm:mb-2 w-44 sm:w-52 md:w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 sm:p-2 z-20 animate-in fade-in zoom-in-95 duration-200 origin-bottom-right">
                  <div className="flex flex-col gap-0.5 sm:gap-1">
                    <button
                      onClick={() => navigate(`/course/${slugify(course.title)}/learning`, {
                        state: {
                          coursePublicHash: course.public_hash,
                          courseId: course.id,
                          userId: userId,
                          courseTitle: course.title,
                          user_hash: user_hash
                        }
                      })}
                      className="flex items-center gap-2 sm:gap-3 w-full p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm font-medium text-gray-700 text-left transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                      <span className="truncate">My Learning</span>
                    </button>

                    <button
                      onClick={() => navigate(`/course/${slugify(course.title)}/performance`, { state: { courseId: course.id, coursePublicHash: course.public_hash, courseTitle: course.title, userId } })}
                      className="flex items-center gap-2 sm:gap-3 w-full p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm font-medium text-gray-700 text-left transition-colors"
                    >
                      <BarChart2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                      <span className="truncate">Performance</span>
                    </button>

                    {fullUrl && (
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(fullUrl, { mode: "cors" });
                            const blob = await response.blob();
                            const blobUrl = window.URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = blobUrl;
                            a.download = `Certificate-${course.title}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(blobUrl);
                          } catch (e) { toast.error("Failed"); }
                        }}
                        className="flex items-center gap-2 sm:gap-3 w-full p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm font-medium text-gray-700 text-left transition-colors"
                      >
                        <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
                        <span className="truncate">Certificate</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSupportModalOpen(true)}
                      className="flex items-center gap-2 sm:gap-3 w-full p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm font-medium text-gray-700 text-left transition-colors"
                    >
                      <LifeBuoy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                      <span className="truncate">Get Support</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Overlay for Grid View - Responsive sizing */}
          {showStats && (
            <div className="absolute inset-0 bg-gray-50 z-30 flex flex-col p-3 sm:p-4 animate-in fade-in zoom-in-95 duration-200 rounded-[0.60rem]">
              <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                <h4 className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Daily Limit
                </h4>
                <button
                  onClick={() => setShowStats(false)}
                  className="p-0.5 sm:p-1 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center">
                {maxAllowedDailyHours ? (
                  <>
                    <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartData} cx="50%" cy="50%" innerRadius={window.innerWidth < 640 ? 35 : 45} outerRadius={window.innerWidth < 640 ? 50 : 60} startAngle={90} endAngle={-270} dataKey="value" stroke="none" cornerRadius={4} paddingAngle={5}>
                            {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">
                          {formatTimeMobile(todaySecondsSpent)}
                        </span>
                        <span className="text-[8px] sm:text-[10px] text-gray-400 uppercase font-medium">Spent</span>
                      </div>
                    </div>

                    <div className="w-full mt-3 sm:mt-4 lg:mt-6 space-y-1.5 sm:space-y-2 lg:space-y-3 px-1 sm:px-2 text-[10px] sm:text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 flex items-center gap-1 sm:gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>Spent</span>
                        </span>
                        <span className="font-semibold text-gray-800">
                          {window.innerWidth < 640 ? formatTimeMobile(todaySecondsSpent) : formatTime(todaySecondsSpent)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 flex items-center gap-1 sm:gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                          <span>Remaining</span>
                        </span>
                        <span className={`font-semibold ${remainingTime != null && remainingTime <= 1800 ? 'text-orange-500' : 'text-gray-800'}`}>
                          {remainingTime != null ?
                            (window.innerWidth < 640 ? formatTimeMobile(remainingTime) : formatTime(remainingTime))
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="pt-1 sm:pt-1.5 lg:pt-2 border-t border-gray-200 flex justify-between items-center mt-1 sm:mt-2">
                        <span className="text-gray-400 font-medium">Limit</span>
                        <span className="font-bold text-gray-700">
                          {window.innerWidth < 640 ? formatTimeMobile(maxAllowedDailySeconds) : formatTime(maxAllowedDailySeconds)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">No Daily Limit</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 px-2 sm:px-4">Learn as much as you want!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <SupportModal
        isOpen={isSupportModalOpen}
        isCourseSupport={true}
        onClose={() => setSupportModalOpen(false)}
        defaultCategory={'Content'}
        relatedId={course.id}
        relatedName={course.title}
        defaultRelatedType={'course'}
      />
      {/* Access Restricted Modal - Responsive */}
      {isAccessModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 lg:p-6 max-w-sm sm:max-w-md w-full mx-2">

            {/* Icon */}
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-amber-50 rounded-full flex items-center justify-center border-4 border-amber-100">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-amber-600" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg sm:text-xl lg:text-xl font-bold text-megistic text-center mb-3 sm:mb-4">
              Access Restricted
            </h3>

            {/* Daily Limit Notice */}
            {maxAllowedDailySeconds && todaySecondsSpent >= maxAllowedDailySeconds && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-amber-900 mb-0.5 sm:mb-1">Daily limit reached</p>
                    <p className="text-[10px] sm:text-xs text-amber-700 leading-relaxed">
                      You can continue learning tomorrow. Progress saved.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Section */}
            <div className="bg-gradient-to-br from-lightGreen to-white rounded-lg border border-primary/20 p-3 sm:p-4 mb-4 sm:mb-5">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Today's Session</span>
              </div>

              {/* Time Display */}
              <div className="flex items-center justify-center gap-1 mb-2 sm:mb-3">
                <span className="text-xl sm:text-2xl font-bold text-primary tabular-nums">
                  {formatTimeMobile(todaySecondsSpent)}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-gray-400 mx-0.5 sm:mx-1">
                  /
                </span>
                <span className="text-xl sm:text-2xl font-bold text-gray-400 tabular-nums">
                  {maxAllowedDailyHours ? formatTimeMobile(maxAllowedDailySeconds) : '∞'}
                </span>
              </div>

              {/* Progress Bar */}
              {maxAllowedDailySeconds && (
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5 overflow-hidden">
                    <div
                      className={`h-2 sm:h-2.5 rounded-full transition-all duration-500 ${todaySecondsSpent >= maxAllowedDailySeconds
                          ? "bg-primary"
                          : "bg-leafGreen"
                        }`}
                      style={{
                        width: `${Math.min((todaySecondsSpent / maxAllowedDailySeconds) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 sm:mt-2">
                    <span className="text-xs font-medium text-gray-500">
                      {Math.min(Math.round((todaySecondsSpent / maxAllowedDailySeconds) * 100), 100)}% Used
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                      {Math.max(0, maxAllowedDailySeconds - todaySecondsSpent) > 0
                        ? formatTimeMobile(Math.max(0, maxAllowedDailySeconds - todaySecondsSpent)) + ' left'
                        : 'Limit reached'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Button */}
            <button
              onClick={closeAccessModal}
              className="w-full py-2.5 sm:py-3 px-4 bg-forestGreen text-white text-xs sm:text-sm font-bold rounded-lg"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default CourseList;