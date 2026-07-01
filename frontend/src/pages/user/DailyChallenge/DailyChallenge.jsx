import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import {
  useIsChallengeAssignedTodayQuery,
  useAssignChallengeToUserMutation,
  useStartChallengeByIdMutation,
  useGetUserChallengeByIdQuery,
  useGetChallengeByDateQuery,
  useGetCompleteChallengeDateByIdQuery,
  useGetUserStreakByIdQuery,
  useGetUserPointsByIdQuery,
} from "../../../services/Challenge/userChallenge"
import { useGetAllChallengeCategoriesQuery } from "../../../services/Masters/challengeCategoryApi"
import { useGetQuizAttemptsQuery } from "../../../services/Challenge/challengeResponseAPI"
import {
  Loader2,
  AlertTriangle,
  Trophy,
  X,
  ChevronRight,
  CheckCircle,
  Calendar,
  Star,
  Flame,
  Award,
  Crown,
  Medal,
  TrendingUp,
  Clock,
  Target,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Info,
  Puzzle,
  HelpCircle,
  CloudCog,
  Sparkles,
} from "lucide-react"
import { toast } from "react-hot-toast"
import { getStudentToken } from "../../../services/CookieService"
import { useGetDailyChallengeRankQuery, useGetTopUsersAndUserRankQuery } from "../../../services/Reporting/leaderboardAnalyticsApi"
import { slugify } from "../../../utils/slugify"
import { useSelector } from "react-redux"
import SupportModal from "../../../components/modal/SupportModal"
import { useGetFeatureStatusByNameQuery } from "../../../services/Masters/featureStatusAPI"
import ComingSoonModal2 from "../../../components/modal/ComingSoonModal2"
import PrimaryLoader from "../../../components/ui/PrimaryLoader" // Import the reusable component

export default function DailyChallenge() {
  const { access_token } = getStudentToken()
  const navigate = useNavigate()
  const [showSelectionModal, setShowSelectionModal] = useState(false)
  const [showAttemptModal, setShowAttemptModal] = useState(false)
  const [selectedAttempt, setSelectedAttempt] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedDifficulty, setSelectedDifficulty] = useState("Beginner")
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [historicalView, setHistoricalView] = useState(false)
  const [completedDates, setCompletedDates] = useState([])
  const [notCompletedDates, setNotCompletedDates] = useState([])
  const [isSupportModalOpen, setSupportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("leaderboard")
  const [showAttemptsHistory, setShowAttemptsHistory] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)

  const { id: userId } = useSelector((state) => state.user)

  // Add feature status query
  const { data: featureData, isLoading: featureDataLoading, error: featureDataError } =
    useGetFeatureStatusByNameQuery(
      { name: "daily_challenge" }
    )

  const formatDateForApi = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const returnDate = `${year}-${month}-${day}`
    return returnDate
  }

  // Check if selected date is today
  const isSelectedDateToday = () => {
    const today = new Date()
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    )
  }

  // Fetch challenge categories from API
  const { data: categoriesData, isLoading: loadingCategories } = useGetAllChallengeCategoriesQuery(
    { access_token },
    { skip: !access_token },
  )

  // RTK Query hooks
  const { data: assignedChallenge, isLoading: isCheckingAssignment } = useIsChallengeAssignedTodayQuery({
    access_token,
  })

  const { data: streakDetails } = useGetUserStreakByIdQuery({ access_token })
  const { data: pointsDetails } = useGetUserPointsByIdQuery(
    { access_token },
    {
      skip: !access_token,
    },
  )

  const { data: completedDatesDetails } = useGetCompleteChallengeDateByIdQuery({ access_token })

  // Add the leaderboard query
  // const { data: leaderboardData, isLoading: isLoadingLeaderboard, refetch: refetchLeaderboard } = useGetTopUsersAndUserRankQuery(
  //   { access_token, id: userId },
  //   { skip: !access_token },
  // )

  const { data: leaderboardData, isLoading: isLoadingLeaderboard, refetch: refetchLeaderboard } = useGetDailyChallengeRankQuery(
    { access_token, id: userId },
    { skip: !access_token },
  )

  // Call this when navigation happens or when you want to fetch data
  useEffect(() => {
    if (access_token) {
      refetchLeaderboard();
    }
  }, [access_token, refetchLeaderboard]);

  // Format date before passing
  const formattedDate = formatDateForApi(selectedDate)
  const {
    data: selectedDateChallenge,
    isLoading: isLoadingSelectedChallenge,
    refetch: refetchSelectedDateChallenge,
  } = useGetChallengeByDateQuery(
    {
      access_token,
      date: formattedDate,
    },
    { skip: !access_token },
  )

  // Get current challenge ID for attempts
  const currentChallengeId = historicalView
    ? selectedDateChallenge?.userChallenge?.id
    : assignedChallenge?.userChallenge?.id

  // Fetch quiz attempts
  const { data: quizAttemptsData, isLoading: isLoadingAttempts } = useGetQuizAttemptsQuery(
    { user_challenge_id: Number.parseInt(currentChallengeId) },
    { skip: !currentChallengeId },
  )

  // Process completed dates when the data is available
  useEffect(() => {
    if (completedDatesDetails?.success && Array.isArray(completedDatesDetails.completed)) {
      setCompletedDates(completedDatesDetails.completed)
      setNotCompletedDates(completedDatesDetails.not_completed)
    }
  }, [completedDatesDetails])

  const [assignChallenge, { isLoading: isAssigning }] = useAssignChallengeToUserMutation()
  const [startChallenge] = useStartChallengeByIdMutation()

  // Fetch user challenge details if assigned
  const { data: userChallengeData } = useGetUserChallengeByIdQuery(
    {
      id: historicalView
        ? selectedDateChallenge?.userChallenge?.challenge_id
        : assignedChallenge?.userChallenge?.challenge_id,
      access_token,
    },
    {
      skip: historicalView
        ? !selectedDateChallenge?.userChallenge?.challenge_id
        : !assignedChallenge?.userChallenge?.challenge_id,
    },
  )

  // Set default category when categories are loaded
  useEffect(() => {
    if (categoriesData?.length > 0 && !selectedCategory) {
      setSelectedCategory(categoriesData[0].id.toString())
    }
  }, [categoriesData, selectedCategory])

  useEffect(() => {
    // If challenge is assigned, check if we should show selection modal
    if (!isCheckingAssignment && !assignedChallenge?.assigned && !historicalView) {
      setShowSelectionModal(true)
    }
  }, [assignedChallenge, isCheckingAssignment, historicalView])

  // Refetch selected date challenge when the date changes
  useEffect(() => {
    if (selectedDate && access_token) {
      refetchSelectedDateChallenge()
    }
  }, [selectedDate, access_token, refetchSelectedDateChallenge])

  // Process leaderboard data
  const getLeaderboardDisplay = () => {
    if (!leaderboardData) return { displayUsers: [], showCurrentUser: false, currentUser: null }

    const { topRankers, userRank } = leaderboardData
    const currentUser = userRank[0]

    // Check if current user is in top 10
    const userInTop10 = topRankers.some((user) => user.user_id === currentUser?.user_id)

    if (userInTop10) {
      // User is in top 10, just show top 10
      return {
        displayUsers: topRankers.slice(0, 10),
        showCurrentUser: false,
        currentUser: null,
      }
    } else {
      // User is not in top 10, show top 10 + current user
      return {
        displayUsers: topRankers.slice(0, 10),
        showCurrentUser: true,
        currentUser: currentUser,
      }
    }
  }

  const { displayUsers, showCurrentUser, currentUser } = getLeaderboardDisplay()

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
      case 3:
        return <Medal className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
      default:
        return <span className="text-xs md:text-sm font-bold text-gray-600">{rank}</span>
    }
  }

  // Helper function to get best attempt
  const getBestAttempt = () => {
    if (!quizAttemptsData?.success || !quizAttemptsData.attempts?.length) return null
    return quizAttemptsData.attempts.reduce((best, current) =>
      current.total_correct / current.total_questions > best.total_correct / best.total_questions ? current : best,
    )
  }

  // Helper function to check if user ever passed
  const hasEverPassed = () => {
    if (!quizAttemptsData?.success || !quizAttemptsData.attempts?.length) return false
    return quizAttemptsData.attempts.some((attempt) => attempt.is_passed === 1)
  }

  const handleAssignChallenge = async () => {
    try {
      if (!selectedCategory) {
        toast.error("Please select a category")
        return
      }

      const result = await assignChallenge({
        data: {
          category: Number.parseInt(selectedCategory),
          difficulty_level: selectedDifficulty,
        },
        access_token: access_token,
      }).unwrap()

      if (result.message === "Challenge assigned successfully!") {
        toast.success("Challenge assigned successfully!")
        setShowSelectionModal(false)
        setHistoricalView(false)
      }
    } catch (error) {
      console.error("Failed to assign challenge:", error)
      toast.error(error.data?.message || "Failed to assign challenge")
    }
  }

  const handleStartChallenge = async (challengeId) => {
    try {
      // Only allow starting challenges for today, not past challenges
      if (historicalView && !isSelectedDateToday()) {
        toast.info("This is a past challenge and cannot be started again")
        return
      }

      const result = await startChallenge({ id: challengeId || 1, access_token }).unwrap()

      if (result.success) {
        // Navigate to the challenge page with the challenge data
        navigate(`/daily-challenge/${slugify(result.challenge.title)}`, { state: { challengeId: currentChallengeId, challenge: result.challenge } })
      } else {
        toast.error(result.message || "Failed to start challenge")
      }
    } catch (error) {
      console.error("Failed to start challenge:", error)
      toast.error(error.data?.message || "Failed to start challenge")
    }
  }

  const handleViewAttempt = (attempt) => {
    setSelectedAttempt(attempt)
    setShowAttemptModal(true)
  }

  // Calendar functions
  const getMonthDays = (year, month) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getMonthFirstDay = (year, month) => {
    return new Date(year, month, 1).getDay()
  }

  const generateCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getMonthDays(year, month)
    const firstDayOfMonth = getMonthFirstDay(year, month)

    // Create placeholder for empty days
    const days = Array(firstDayOfMonth).fill(null)

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  const nextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const prevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleDateClick = (day) => {
    if (!day) return // Skip empty cells

    // Create a new date object for the selected day
    const newSelectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)

    // Check if the date is in the past or present (not future)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time portion for comparison

    if (newSelectedDate <= today) {
      setSelectedDate(newSelectedDate)
      // If selected date is today, show current challenge
      const isToday = newSelectedDate.toDateString() === today.toDateString()
      setHistoricalView(!isToday)
    }
  }

  // Function to check if a date is selectable (past or present)
  const isDateSelectable = (day) => {
    if (!day) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date <= today
  }

  const isToday = (day) => {
    if (!day) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Function to check if a challenge was completed on a specific day
  const isCompletedDay = (day) => {
    if (!day || !Array.isArray(completedDates)) return false
    // Create date string in the format 'YYYY-MM-DD' from the day
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    // Check if this date exists in the completedDates array
    return completedDates.includes(dateStr)
  }

  // Function to check if a challenge was completed on a specific day
  const isNotCompletedDay = (day) => {
    if (!day || !Array.isArray(notCompletedDates)) return false
    // Create date string in the format 'YYYY-MM-DD' from the day
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    // Check if this date exists in the completedDates array
    return notCompletedDates.includes(dateStr)
  }

  // Show coming soon page if feature is not active
  if (featureData?.is_active === 0) {
    return <ComingSoonModal2 featureData={featureData} />;
  }

  if (isCheckingAssignment && !historicalView) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PrimaryLoader />
      </div>
    )
  }

  // Determine which challenge data to use based on view mode
  const currentChallengeData = historicalView ? selectedDateChallenge : assignedChallenge
  const isLoadingChallenge = historicalView ? isLoadingSelectedChallenge : isCheckingAssignment

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6 lg:py-8">
      {/* Header Section */}
      <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8 border-b border-slate-100 pb-4 sm:pb-5 md:pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-forestGreen tracking-tight">
              {historicalView ? "Challenge History" : "Daily Challenge"}
            </h1>
            <p className="text-slate-500 mt-1 sm:mt-2 text-xs sm:text-sm md:text-base">
              Complete your daily task to maintain your streak and earn XP.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Daily Streak Tag */}
            <div className="flex items-center px-3 sm:px-4 py-1 sm:py-1.5 bg-white border border-gray-100 rounded-full shadow-sm">
              <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-experience4 mr-1.5 sm:mr-2 fill-experience4" />
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase leading-none">Streak</span>
                <span className="text-xs sm:text-sm font-bold text-gray-700 leading-none mt-0.5">
                  {streakDetails?.userStreak?.current_streak || 0} Days
                </span>
              </div>
            </div>

            {/* Current Points Tag */}
            <div className="flex items-center px-3 sm:px-4 py-1 sm:py-1.5 bg-white border border-gray-100 rounded-full shadow-sm">
              <div className="bg-primary rounded-full p-0.5 mr-1.5 sm:mr-2">
                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white fill-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase leading-none">Current</span>
                <span className="text-xs sm:text-sm font-bold text-gray-700 leading-none mt-0.5">
                  {pointsDetails?.userPoints?.points
                    ? pointsDetails.userPoints.points.toLocaleString()
                    : 0}{" "}
                  XP
                </span>
              </div>
            </div>

            {/* Total Points Tag */}
            <div className="flex items-center px-3 sm:px-4 py-1 sm:py-1.5 bg-white border border-gray-100 rounded-full shadow-sm">
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-primary mr-1.5 sm:mr-2" />
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase leading-none">Total</span>
                <span className="text-xs sm:text-sm font-bold text-gray-700 leading-none mt-0.5">
                  {pointsDetails?.userPoints?.total_earned
                    ? pointsDetails.userPoints.total_earned.toLocaleString()
                    : 0}{" "}
                  XP
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* First Row: Challenge Details | Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-4 sm:mb-5 md:mb-6 lg:mb-8">
        {/* Challenge Details Column */}
        <div className="lg:col-span-2">
          {/* Challenge Box */}
          <div className="bg-white rounded-lg sm:rounded-xl border border-gray-100 overflow-hidden h-auto max-h-[400px] sm:max-h-[420px] md:max-h-[450px] relative">
            {/* Content Swapping with Animation */}
            <AnimatePresence mode="wait">
              {!showAttemptsHistory ? (
                <motion.div
                  key="challenge-details"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full flex flex-col"
                >
                  {isLoadingChallenge ? (
                    <div className="h-full flex items-center justify-center py-6 sm:py-8 md:py-12">
                      <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 animate-spin text-indigo-600" />
                    </div>
                  ) : historicalView ? (
                    // Historical view for selected date
                    <div className="relative h-full flex flex-col">
                      <div className="p-3 sm:p-4 border-b flex justify-between items-center bg-lightGreen">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-1 sm:mr-2" />
                          <h3 className="font-semibold text-forestGreen text-sm sm:text-base">
                            <span className="sm:hidden">
                              {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="hidden sm:inline">
                              {selectedDate.toDateString()}
                            </span>
                          </h3>
                        </div>
                        {selectedDateChallenge?.userChallenge?.is_completed && (
                          <div className="bg-lightGreen text-forestGreen rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-medium flex items-center">
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-primary" />
                            <span className="hidden xs:inline">Completed</span>
                            <span className="xs:hidden">Done</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 sm:p-4 md:p-6 flex-grow overflow-y-auto custom-scrollbar">
                        {selectedDateChallenge?.success ? (
                          <div className="h-full flex flex-col">
                            <div className="mb-3 sm:mb-4 md:mb-6 flex-grow">
                              <div className="flex whitespace-nowrap items-center justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
                                <h3 className="text-sm sm:text-base md:text-lg font-medium text-gray-800 truncate line-clamp-1">
                                  {selectedDateChallenge.userChallenge.DailyChallenge?.title || "Challenge Title"}
                                </h3>
                                {selectedDateChallenge.userChallenge.is_completed && (
                                  <div className="bg-lightGreen px-2 sm:px-3 py-0.5 sm:py-1 rounded-full flex items-center gap-0.5 sm:gap-1">
                                    <span className="text-xs text-primary font-medium">Points:</span>
                                    <span className="text-xs sm:text-sm font-bold text-forestGreen">
                                      {selectedDateChallenge.userChallenge.points_earned}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-2">
                                {selectedDateChallenge.userChallenge.DailyChallenge?.description ||
                                  "This was your challenge for this day."}
                              </p>
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-3">
                                {selectedDateChallenge.userChallenge.DailyChallenge?.categoryDetails && (
                                  <div className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-lightGreen text-primary truncate">
                                    {selectedDateChallenge.userChallenge.DailyChallenge.categoryDetails.category}
                                  </div>
                                )}
                                {selectedDateChallenge.userChallenge.DailyChallenge?.difficulty_level && (
                                  <div className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-primary/10 text-forestGreen">
                                    {selectedDateChallenge.userChallenge.DailyChallenge.difficulty_level}
                                  </div>
                                )}
                              </div>
                            </div>
                            {selectedDateChallenge.userChallenge.is_completed ? (
                              <div className="text-center py-3 sm:py-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-lightGreen rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                                  <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary" />
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1 sm:mb-2">Challenge Completed!</h3>
                                <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4">
                                  You successfully completed this challenge.
                                </p>
                                {/* Show retry button only if it's today's challenge */}
                                {isSelectedDateToday() &&
                                  userChallengeData?.userChallenge?.attempts <
                                  userChallengeData?.userChallenge?.DailyChallenge.max_attempt && (
                                    <button
                                      onClick={() =>
                                        handleStartChallenge(selectedDateChallenge.userChallenge.DailyChallenge.id)
                                      }
                                      className="w-full px-4 py-2 sm:px-5 sm:py-2.5 bg-primary text-white rounded-lg hover:bg-leafGreen transition-all duration-300 shadow-md flex items-center justify-center mt-2 sm:mt-3 text-sm sm:text-base"
                                    >
                                      <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                      <span>Try Again</span>
                                    </button>
                                  )}
                              </div>
                            ) : (
                              <div className="text-center py-3 sm:py-4 md:py-6">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-yellow-600" />
                                </div>
                                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-1 sm:mb-2">Challenge Not Completed</h3>
                                <p className="text-gray-600 text-xs sm:text-sm md:text-base mb-3 sm:mb-4 max-w-sm mx-auto">
                                  You didn't complete this challenge on{" "}
                                  <span className="font-medium">{selectedDate.toLocaleDateString()}</span>.
                                </p>
                                {/* Show retry button only if it's today's challenge and attempts remain */}
                                {isSelectedDateToday() &&
                                  userChallengeData?.userChallenge?.attempts <
                                  userChallengeData?.userChallenge?.DailyChallenge.max_attempt && (
                                    <button
                                      onClick={() =>
                                        handleStartChallenge(selectedDateChallenge.userChallenge.DailyChallenge.id)
                                      }
                                      className="w-full px-4 py-2 sm:px-5 sm:py-2.5 bg-primary text-white rounded-lg transition-all duration-300 shadow-md flex items-center justify-center text-sm sm:text-base"
                                    >
                                      <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                      <span>Start Challenge</span>
                                    </button>
                                  )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-3 sm:py-4 md:py-6">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-yellow-600" />
                            </div>
                            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-1 sm:mb-2">No Challenge Found</h3>
                            <p className="text-gray-600 text-xs sm:text-sm md:text-base mb-3 sm:mb-4">
                              No challenge for {selectedDate.toLocaleDateString()}.
                            </p>
                          </div>
                        )}
                      </div>
                      {selectedDateChallenge?.success &&
                        <div className="absolute bottom-3 right-3 flex items-center justify-end">
                          <button
                            onClick={() => setShowAttemptsHistory(true)}
                            className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-2 flex-1 xs:flex-none"
                          >
                            History
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      }
                    </div>
                  ) : currentChallengeData?.assigned ? (
                    userChallengeData ? (
                      // Today's Challenge - New Design
                      <div className="p-3 sm:p-4 relative flex flex-col h-full overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-start gap-4 md:gap-6 flex-1">
                            {/* Image - Hidden on mobile and tablet, visible on desktop (lg and above) */}
                            <div className="hidden lg:flex md:flex sm:flex flex-shrink-0">
                              <img
                                src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${userChallengeData.userChallenge.DailyChallenge.image_url || "/placeholder.png"}`}
                                alt="Challenge"
                                className="
                                w-32 h-16 rounded-lg          
                                xl:w-64 xl:h-32               
                                lg:w-48 lg:h-24              
                                object-cover                  
                              "
                              />
                            </div>

                            {/* Title & Description */}
                            <div className="flex flex-col flex-1 min-w-0">
                              <h3 className="text-lg xs:text-xl md:text-2xl font-extrabold text-forestGreen tracking-tight leading-tight line-clamp-2">
                                {userChallengeData.userChallenge.DailyChallenge.title || "Challenge Title"}
                              </h3>
                              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed line-clamp-2 mt-2 sm:mt-3 mb-2">
                                {userChallengeData.userChallenge.DailyChallenge.description ||
                                  "Complete this challenge to earn points and maintain your daily streak!"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Points Sentence */}
                        <div className="mb-3 sm:mb-4">
                          <p className="text-xs sm:text-sm font-bold text-primary flex items-center gap-1">
                            <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                            {userChallengeData.userChallenge.DailyChallenge.is_per_question_reward
                              ? `Get ${userChallengeData.userChallenge.DailyChallenge.per_question_reward} XP per correct answer`
                              : `Earn ${userChallengeData.userChallenge.DailyChallenge.points_reward || 0} XP total`}
                          </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4 border-t border-slate-100 pt-3 sm:pt-4">
                          <div>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Time
                            </p>
                            <p className="text-xs sm:text-sm font-bold text-slate-900">
                              {userChallengeData.userChallenge.DailyChallenge.time_limit > 0 ? `${userChallengeData.userChallenge.DailyChallenge.time_limit} min` : "No Limit"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Attempts
                            </p>
                            <p className="text-xs sm:text-sm font-bold text-slate-900">
                              {userChallengeData.userChallenge.attempts}/{userChallengeData.userChallenge.DailyChallenge.max_attempt}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Difficulty
                            </p>
                            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {userChallengeData.userChallenge.DailyChallenge.difficulty_level}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Qualify
                            </p>
                            <p className="text-xs sm:text-sm font-bold text-slate-900">
                              {userChallengeData.userChallenge.DailyChallenge.qualify_percentage ?? 0}%
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col xs:flex-row xs:items-center justify-end gap-2 sm:gap-3 border-t border-slate-100 pt-3 sm:pt-4 w-full">
                          <div className="flex gap-2 w-full xs:w-auto">
                            <button
                              onClick={() => setSupportModalOpen(true)}
                              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-2 flex-1 xs:flex-none"
                              title="Get Help"
                            >
                              <span className="hidden xs:inline">Help</span>
                              <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <button
                              onClick={() => setShowAttemptsHistory(true)}
                              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-2 flex-1 xs:flex-none"
                            >
                              <span className="hidden sm:inline">History</span>
                              <span className="sm:hidden">History</span>
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <button
                              onClick={() => handleStartChallenge(userChallengeData.userChallenge.DailyChallenge.id)}
                              className="px-4 py-2.5 sm:px-6 sm:py-3 bg-leafGreen text-white font-bold rounded-lg transition-all text-xs sm:text-sm flex-1 xs:flex-none min-w-[100px] sm:min-w-[150px]"
                            >
                              {userChallengeData.userChallenge.is_completed === 1 ? "Try Again" : "Start"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center py-6 sm:py-8 md:py-12">
                        <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 animate-spin text-indigo-600" />
                      </div>
                    )
                  ) : (
                    // Show message when no challenge is assigned
                    <div className="h-full flex flex-col">
                      <div className="p-3 sm:p-4 border-b bg-lightGreen">
                        <h3 className="font-semibold text-forestGreen flex items-center text-sm sm:text-base">
                          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-1 sm:mr-2" />
                          Daily Challenge
                        </h3>
                      </div>
                      <div className="text-center py-4 sm:py-6 px-3 sm:px-4 flex-grow flex flex-col items-center justify-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                          <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                        </div>
                        <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-1 sm:mb-2">No Challenge Assigned</h3>
                        <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 max-w-sm mx-auto">
                          Choose a category and difficulty to get today's challenge.
                        </p>
                        <button
                          onClick={() => setShowSelectionModal(true)}
                          className="px-4 py-2 sm:px-5 sm:py-2.5 bg-primary text-white rounded-lg hover:bg-leafGreen transition-all duration-300 shadow-md flex items-center justify-center mx-auto text-xs sm:text-sm"
                        >
                          <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span>Get Today's Challenge</span>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="attempts-history"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  style={{ height: '400px' }} // or whatever height you need
                  className="h-full bg-white flex flex-col"
                >
                  <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1 sm:gap-2">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      Attempts History
                    </h3>
                    <button
                      onClick={() => setShowAttemptsHistory(false)}
                      className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                    >
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  <div className="p-3 sm:p-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                    {isLoadingAttempts ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" />
                      </div>
                    ) : quizAttemptsData?.success && quizAttemptsData.attempts?.length > 0 ? (
                      <div className="space-y-2 sm:space-y-3">
                        {quizAttemptsData.attempts.map((attempt, index) => {
                          const accuracy = ((attempt.total_correct / attempt.total_questions) * 100).toFixed(0);
                          const isPassed = attempt.is_passed === 1;

                          return (
                            <div
                              key={attempt.id}
                              className="p-2 sm:p-3 rounded-lg border border-gray-100 bg-white flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="hidden xs:flex w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-50 text-emerald-600 font-bold items-center justify-center text-xs sm:text-sm shadow-sm">
                                  #{attempt.attempt_number}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1 sm:gap-2 mb-0.5">
                                    <span className="font-bold text-gray-900 text-xs sm:text-sm">Attempt {attempt.attempt_number}</span>
                                    <span className="text-[10px] sm:text-xs text-slate-400 font-medium hidden sm:inline-block">•</span>
                                    <span className="text-[10px] sm:text-xs text-slate-500 font-medium hidden sm:inline-block">{new Date(attempt.created_at).toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500 font-medium">
                                    <span className="flex items-center gap-0.5">
                                      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400" />
                                      {Math.floor(attempt.time_used_seconds / 60)}m {attempt.time_used_seconds % 60}s
                                    </span>
                                    <span className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-slate-300"></span>
                                    <span className={`${isPassed ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}`}>
                                      {accuracy}% Score
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${isPassed
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                  : "bg-red-50 text-red-600 border border-red-100"
                                  }`}>
                                  {isPassed ? "Passed" : "Failed"}
                                </div>

                                {Boolean(currentChallengeData?.userChallenge?.DailyChallenge?.show_answer) && <button
                                  onClick={() => handleViewAttempt(attempt)}
                                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-2"
                                >
                                  View
                                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 sm:py-8 flex flex-col items-center justify-center h-full">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                          <Target className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">No Attempts Yet</h3>
                        <p className="text-gray-500 text-xs sm:text-sm max-w-xs mx-auto">
                          Start the challenge to see your history here.
                        </p>
                        <button
                          onClick={() => setShowAttemptsHistory(false)}
                          className="mt-4 sm:mt-6 px-4 py-1.5 sm:px-6 sm:py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all text-xs sm:text-sm"
                        >
                          Go Back
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg sm:rounded-xl border border-gray-100 overflow-hidden h-full flex flex-col">
            {/* Tab Headers */}
            <div className="flex border-b border-gray-100">
              <button
                className={`flex-1 py-2 sm:py-3 text-xs sm:text-sm font-bold text-center transition-colors ${activeTab === "leaderboard"
                  ? "text-primary border-b-2 border-primary bg-lightGreen/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                onClick={() => setActiveTab("leaderboard")}
              >
                <span className="hidden xs:inline">Top Competitors</span>
                <span className="xs:hidden">Leaderboard</span>
              </button>
              <button
                className={`flex-1 py-2 sm:py-3 text-xs sm:text-sm font-bold text-center transition-colors ${activeTab === "calendar"
                  ? "text-primary border-b-2 border-primary bg-lightGreen/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                onClick={() => setActiveTab("calendar")}
              >
                Calendar
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-grow flex flex-col h-[320px] sm:h-[350px] md:h-[400px]">
              {activeTab === "calendar" ? (
                <div className="p-2 sm:p-3 md:p-4 h-full">
                  {/* Month Display */}
                  <div className="flex justify-between items-center mb-3 sm:mb-4 pl-1">
                    <p className="text-sm sm:text-base font-bold text-slate-800 truncate">
                      {currentMonth.toLocaleString("default", { month: "short", year: "numeric" })}
                    </p>
                    <div className="flex gap-0.5 sm:gap-1">
                      <button onClick={prevMonth} className="p-1 sm:p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 rotate-180" />
                      </button>
                      <button onClick={nextMonth} className="p-1 sm:p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-x-0.5 sm:gap-x-1 gap-y-1.5 sm:gap-y-2 place-items-center">
                    {/* Day names */}
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                      <div key={index} className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 sm:pb-2">
                        {day}
                      </div>
                    ))}

                    {/* Calendar days */}
                    {generateCalendar().map((day, index) => {
                      // Check if this is today
                      const dayIsToday = isToday(day)
                      // Check if this is the selected date
                      const isSelected =
                        day === selectedDate.getDate() &&
                        currentMonth.getMonth() === selectedDate.getMonth() &&
                        currentMonth.getFullYear() === selectedDate.getFullYear()
                      // Check if challenge was completed on this day
                      const isCompleted = isCompletedDay(day)
                      // Check if this date is selectable (not future date)
                      const selectable = isDateSelectable(day)

                      // Styling logic
                      let cellClasses = "bg-white text-slate-300 border border-transparent" // Default empty/past state

                      if (isCompleted) {
                        cellClasses = "bg-primary text-white shadow-sm shadow-primary/30 border-transparent"
                      } else if (dayIsToday) {
                        cellClasses = "bg-white text-primary border-2 border-primary font-bold"
                      } else if (isSelected) {
                        cellClasses = "bg-lightGreen text-forestGreen border border-primary/20"
                      } else if (!selectable && day) {
                        // Future dates
                        cellClasses = "bg-white text-gray-300 border border-gray-100"
                      } else if (day) {
                        // Past/Selectable but not done
                        cellClasses = "bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100"
                      }

                      if (!day) return <div key={index}></div>

                      return (
                        <div
                          key={index}
                          className={`relative h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 flex items-center justify-center text-xs sm:text-sm rounded-md sm:rounded-lg transition-all duration-200 ${cellClasses} ${selectable ? "cursor-pointer" : "cursor-default"}`}
                          onClick={() => selectable && handleDateClick(day)}
                        >
                          {day}
                        </div>
                      )
                    })}
                  </div>

                  {/* Quick navigation back to today */}
                  {!isToday(selectedDate.getDate()) && (
                    <button
                      onClick={() => {
                        setSelectedDate(new Date())
                        setHistoricalView(false)
                        setCurrentMonth(new Date())
                      }}
                      className="w-full mt-2 sm:mt-3 md:mt-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-lightGreen text-forestGreen rounded-lg hover:bg-primary/20 transition-all duration-200"
                    >
                      Back to Today
                    </button>
                  )}
                </div>
              ) : (
                <div className="h-full overflow-hidden flex flex-col">
                  {/* Leaderboard Content */}
                  <div className="flex-grow flex flex-col h-full overflow-hidden">
                    {isLoadingLeaderboard ? (
                      <div className="flex items-center justify-center py-6 sm:py-8">
                        <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="flex flex-col h-full">
                        {/* Table Header */}
                        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-b border-gray-100 z-10">
                          <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">RANK</span>
                          <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">XP</span>
                        </div>

                        {/* Scrollable List container - Fills remaining space */}
                        <div className="overflow-y-auto custom-scrollbar flex-grow">
                          {/* Top 10 Users */}
                          {displayUsers.map((user, index) => {
                            const isCurrentUser = leaderboardData?.userRank?.[0]?.user_id === user.user_id
                            return (
                              <div
                                key={user.user_id}
                                className={`flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2.5 border-b border-gray-100 last:border-0 ${isCurrentUser ? "bg-lightGreen" : "bg-white"}`}
                              >
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <span className={`text-xs sm:text-sm font-bold w-3 sm:w-4 text-center ${isCurrentUser ? "text-forestGreen" : "text-gray-900"}`}>
                                    {user.user_rank}
                                  </span>
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                      {user.full_name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col max-w-[80px] sm:max-w-none">
                                      <span className={`text-xs sm:text-sm font-medium truncate ${isCurrentUser ? "text-forestGreen font-bold" : "text-gray-900"}`}>
                                        {isCurrentUser ? "You" : user.full_name}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs sm:text-sm font-bold text-primary">
                                    {user.total_earned.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            )
                          })}

                        </div>

                        {/* Current User Sticky Footer - Outside scrollable area */}
                        {showCurrentUser && Boolean(currentUser) && (
                          <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 bg-lightGreen border-t border-gray-100 z-20">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <span className="text-xs sm:text-sm font-bold w-3 sm:w-4 text-center text-forestGreen">{currentUser.user_rank}</span>
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                  {currentUser.full_name.charAt(0)}
                                </div>
                                <span className="text-xs sm:text-sm font-bold text-forestGreen truncate">You</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs sm:text-sm font-bold text-primary">
                                {currentUser.total_earned.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selection Modal */}
      <AnimatePresence>
        {showSelectionModal && access_token && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-3 md:p-4 z-50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-sm sm:max-w-md mx-2 sm:mx-3 border border-gray-100"
            >
              <div className="flex justify-between items-start mb-4 sm:mb-5 md:mb-6">
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 tracking-tight">Choose Your Challenge</h3>
                  <p className="text-gray-500 mt-0.5 sm:mt-1 text-xs sm:text-sm font-light">Select difficulty and category to begin.</p>
                </div>
                <button onClick={() => setShowSelectionModal(false)} className="text-gray-400 transition-colors">
                  <X size={20} sm:size={24} strokeWidth={1.5} />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* Difficulty Level Tabs */}
                <div>
                  <label className="block text-xs sm:text-sm text-black/80 mb-1 sm:mb-2 font-bold"> Level</label>
                  <div className="flex p-0.5 sm:p-1 bg-gray-50 border border-gray-100 rounded-lg gap-0.5 sm:gap-1">
                    {["Beginner", "Intermediate", "Advanced"].map((level) => (
                      <button
                        key={level}
                        onClick={() => setSelectedDifficulty(level)}
                        className={`flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-300 rounded-md ${selectedDifficulty === level
                          ? "bg-white text-leafGreen border border-gray-200"
                          : "text-gray-500"
                          }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <div className="flex justify-between items-center mb-2 sm:mb-3">
                    <label className="block text-xs sm:text-sm text-black/80 font-bold">Category</label>
                  </div>

                  {/* Top 5 Categories - Icon View */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
                    {categoriesData &&
                      categoriesData
                        .filter((cat) => cat.is_active)
                        .slice(0, showAllCategories ? categoriesData.length : 4)
                        .map((category) => (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id.toString())}
                            className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all duration-200 h-20 sm:h-24 ${selectedCategory === category.id.toString()
                              ? "bg-primary/5 border-primary"
                              : "bg-white border-gray-200"
                              }`}
                          >
                            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center mb-1 sm:mb-2 transition-colors ${selectedCategory === category.id.toString()
                              ? "bg-white text-primary border border-primary/10"
                              : "bg-gray-50 text-black/60"
                              }`}>
                              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
                            </div>
                            <span className={`text-xs sm:text-sm text-center leading-tight font-bold truncate w-full ${selectedCategory === category.id.toString() ? "text-primary" : "text-black/70"
                              }`}>
                              {category.category}
                            </span>
                          </button>
                        ))}
                  </div>

                  {/* View All / Show Less Toggle */}
                  {categoriesData?.filter(c => c.is_active).length > 4 && (
                    <button
                      onClick={() => setShowAllCategories(!showAllCategories)}
                      className="w-full mt-1 sm:mt-2 py-1.5 sm:py-2 text-gray-400 text-xs sm:text-sm transition-colors flex items-center justify-center gap-0.5 sm:gap-1 hover:text-primary"
                    >
                      <span className="decoration-1 underline-offset-4 font-bold text-[10px] sm:text-xs uppercase tracking-wide">
                        {showAllCategories ? "Show Less" : "View All"}
                      </span>
                      <ChevronRight
                        className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 ${showAllCategories ? "-rotate-90" : "rotate-90"}`}
                      />
                    </button>
                  )}
                </div>

                <button
                  onClick={handleAssignChallenge}
                  disabled={isAssigning || !selectedCategory}
                  className="w-full py-2.5 sm:py-3 bg-forestGreen text-white rounded-md transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.99] font-bold"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span className="text-xs sm:text-sm ml-1 sm:ml-2">Assigning...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs sm:text-sm">Start Challenge</span>
                      <Trophy className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attempt Details Modal */}
      <AnimatePresence>
        {showAttemptModal && selectedAttempt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl sm:rounded-xl shadow-2xl border border-gray-100 w-full max-w-4xl max-h-[90vh] sm:max-h-[90vh] overflow-hidden flex flex-col mx-2 sm:mx-0"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-3 sm:p-5 border-b border-gray-100 bg-white z-10">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-forestGreen flex items-center gap-2 truncate">
                    Attempt Details
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                    Attempt #{selectedAttempt.attempt_number} • {new Date(selectedAttempt.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowAttemptModal(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 sm:p-2 rounded-full transition-colors ml-2 flex-shrink-0"
                >
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto p-3 sm:p-6 bg-gray-50/30 flex-1">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Total Questions</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-forestGreen">
                      {selectedAttempt.total_questions}
                    </p>
                  </div>

                  <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Correct Answers</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                      {selectedAttempt.total_correct}
                    </p>
                  </div>

                  <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Accuracy</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-experience1">
                      {((selectedAttempt.total_correct / selectedAttempt.total_questions) * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Points Earned</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-experience4">
                      {selectedAttempt.total_reward_points}
                    </p>
                  </div>
                </div>

                {/* Questions and Answers */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                    Question Details
                  </h3>

                  {JSON.parse(selectedAttempt.results_details).map((result, index) => (
                    <div
                      key={result.question_id}
                      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                    >
                      {/* Question Header */}
                      <div className={`p-3 sm:p-4 border-l-4 ${result.isCorrect ? 'border-primary' : 'border-red-400'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs sm:text-sm font-medium text-gray-500">
                                Question {index + 1}
                              </span>
                              {result.isCorrect ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-lightGreen px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Correct
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                  <XCircle className="w-3 h-3" />
                                  Incorrect
                                </span>
                              )}
                            </div>
                            <p className="text-sm sm:text-base text-gray-900 font-medium">
                              {result.question_text_stored}
                            </p>
                          </div>
                          <div className="ml-3 flex-shrink-0">
                            <span className={`inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium ${result.isCorrect
                              ? 'bg-lightGreen text-primary'
                              : 'bg-red-50 text-red-600'
                              }`}>
                              {result.rewardPoints} pts
                            </span>
                          </div>
                        </div>

                        {/* Answers */}
                        <div className="space-y-2 mt-3">
                          <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                            <p className="text-xs font-medium text-gray-500 mb-1">Your Answer:</p>
                            <p className={`text-xs sm:text-sm p-2 rounded-lg ${result.isCorrect
                              ? 'bg-lightGreen/50 text-forestGreen'
                              : 'bg-red-50 text-red-700'
                              }`}>
                              {result.userAnswer}
                            </p>
                          </div>

                          {result?.correctAnswer && !result.isCorrect && (
                            <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                              <p className="text-xs font-medium text-gray-500 mb-1">Correct Answer:</p>
                              <p className="text-xs sm:text-sm p-2 rounded-lg bg-lightGreen/50 text-forestGreen">
                                {result.correctAnswer}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        defaultCategory={"Content"}
        relatedId={selectedDateChallenge?.userChallenge?.DailyChallenge?.id}
        relatedName={selectedDateChallenge?.userChallenge?.DailyChallenge?.title}
        defaultRelatedType={'daily-challenge'}
      />
    </div>
  )
}