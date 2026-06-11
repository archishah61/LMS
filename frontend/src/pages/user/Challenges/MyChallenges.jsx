/* eslint-disable react/prop-types */
"use client"
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useGetAllChallengeByUserQuestsQuery } from "../../../services/Challenge/userChallengeQuestAPI"
import { useGetQuizAttemptsQuery } from "../../../services/Challenge/challengeResponseAPI"
import {
  Trophy,
  Clock,
  CheckCircle,
  Check,
  XCircle,
  Eye,
  Filter,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Play,
  BookOpen,
  AlertCircle,
  Loader2,
  BarChart3,
  CheckSquare,
  Lock,
  Unlock,
  TrendingUp,
  Timer,
  Target,
  Award,
  Activity,
  RefreshCw,
  ArrowLeft,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getStudentToken } from "../../../services/CookieService"
import { slugify } from "../../../utils/slugify"
import { useGetFeatureStatusByNameQuery } from "../../../services/Masters/featureStatusAPI"
import ComingSoonModal2 from "../../../components/modal/ComingSoonModal2"
import PrimaryLoader from "../../../components/ui/PrimaryLoader"

export default function MyChallenges() {
  const navigate = useNavigate()

  // Token state management
  const [accessToken, setAccessToken] = useState(null)
  const [tokenLoading, setTokenLoading] = useState(true)

  // Add feature status query
  const { data: featureData, isLoading: featureDataLoading, error: featureDataError } =
    useGetFeatureStatusByNameQuery(
      { name: "challenge_quest" }
    )

  // Initialize token
  useEffect(() => {
    const initializeToken = async () => {
      try {
        const tokenData = getStudentToken()
        setAccessToken(tokenData?.access_token || null)
      } catch (error) {
        console.error("Error getting token:", error)
        setAccessToken(null)
      } finally {
        setTokenLoading(false)
      }
    }

    initializeToken()
  }, [])

  const {
    data: userChallenges,
    isLoading: challengesLoading,
    error: challengesError,
    refetch,
  } = useGetAllChallengeByUserQuestsQuery(
    { access_token: accessToken },
    {
      skip: !accessToken,
      refetchOnMountOrArgChange: true,
    },
  )

  // State management
  const [filteredChallenges, setFilteredChallenges] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showTaskAttempts, setShowTaskAttempts] = useState(false)
  const [expandedCards, setExpandedCards] = useState(new Set())
  const [expandedPhases, setExpandedPhases] = useState(new Set())

  // Apply filters
  useEffect(() => {
    if (!userChallenges?.data) {
      setFilteredChallenges([])
      return
    }

    let result = [...userChallenges.data]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.Challenge?.title?.toLowerCase().includes(query) || c.Challenge?.description?.toLowerCase().includes(query),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "completed") {
        result = result.filter((c) => c.is_completed === true || c.is_completed === 1)
      } else if (statusFilter === "in-progress") {
        result = result.filter((c) => c.is_completed === false || c.is_completed === 0)
      }
    }

    setFilteredChallenges(result)
  }, [userChallenges?.data, searchQuery, statusFilter])

  // Show coming soon page if feature is not active
  if (!featureDataLoading && featureData?.is_active === 0) {
    return <ComingSoonModal2 featureData={featureData} />;
  }

  const getDifficultyColor = (level) => {
    switch (level?.toLowerCase()) {
      case "easy":
      case "beginner":
        return "bg-green-100 text-green-800 border-green-200"
      case "medium":
      case "moderate":
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "hard":
      case "advanced":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-indigo-100 text-indigo-800 border-indigo-200"
    }
  }

  const getStatusBadge = (challenge) => {
    if (challenge.is_completed === 1 || challenge.is_completed === true) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" /> Completed
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
          <Clock className="w-3 h-3 mr-1" /> In Progress
        </span>
      )
    }
  }

  const toggleCardExpansion = (userChallenge) => {
    const challengeId = userChallenge.id
    const newExpanded = new Set(expandedCards)
    const newExpandedPhases = new Set(expandedPhases)

    if (newExpanded.has(challengeId)) {
      newExpanded.delete(challengeId)
    } else {
      newExpanded.add(challengeId)
      // Automatically expand the first phase when opening challenge
      const phases = userChallenge.UserChallengePhases || []
      if (phases.length > 0) {
        newExpandedPhases.add(phases[0].id)
      }
    }
    setExpandedCards(newExpanded)
    setExpandedPhases(newExpandedPhases)
  }

  const togglePhaseExpansion = (phaseId) => {
    const newExpanded = new Set(expandedPhases)
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId)
    } else {
      newExpanded.add(phaseId)
    }
    setExpandedPhases(newExpanded)
  }

  const handleViewTaskAttempts = (task) => {
    setSelectedTask(task)
    setShowTaskAttempts(true)
  }

  const handleContinueChallenge = (challenge) => {
    navigate(`/challenges/${slugify(challenge?.Challenge?.title)}`, {
      state: { userChallengeId: challenge.id },
    })
  }

  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setShowFilters(false)
  }

  const handleRefresh = () => {
    // Try to refresh token from storage
    const tokenData = getStudentToken()
    if (tokenData?.access_token) {
      setAccessToken(tokenData.access_token)
    }
    refetch()
  }

  // Calculate statistics
  const stats = {
    total: userChallenges?.data?.length || 0,
    completed: userChallenges?.data?.filter((c) => c.is_completed === 1 || c.is_completed === true).length || 0,
    inProgress: userChallenges?.data?.filter((c) => c.is_completed === 0 || c.is_completed === false).length || 0,
    totalPoints: userChallenges?.data?.reduce((sum, c) => sum + (c.points_earned || 0), 0) || 0,
  }

  // Loading state for token
  if (tokenLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <PrimaryLoader />
      </div>
    )
  }

  // No token available
  if (!accessToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600">Please log in to view your challenges.</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:opacity-90"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // Loading state for challenges
  if (challengesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <PrimaryLoader />
      </div>
    )
  }

  // Handle specific error cases
  if (challengesError) {
    // If unauthorized (401), the token might be expired or invalid.
    // Clear it to trigger the "Login Required" view or allow re-login.
    if (challengesError.status === 401) {
      setAccessToken(null)
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Challenges</h2>
          <p className="text-gray-600 mb-4">
            {challengesError?.data?.message || "Failed to load challenges. Please try again."}
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90 flex items-center mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Container with responsive padding - UPDATED to match ChallengeQuest */}
      <div className="container px-5 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="w-full mx-auto rounded-2xl overflow-hidden shadow-sm mb-6">
          <div
            className="px-4 sm:px-6 md:px-8 py-6 sm:py-7 md:py-8 relative bg-cover bg-center text-white"
            style={{ backgroundImage: "url('/assets/My_Profile_Heading_Background.png')" }}
          >
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                    My Challenges
                    <Award className="inline ml-1 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white text-opacity-80" />
                  </h1>
                </div>
                <p className="text-indigo-100 text-xs sm:text-sm md:text-base opacity-90 font-light max-w-xl">
                  Track your progress and view detailed attempt history for each task
                </p>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-200
                max-sm:px-2 max-sm:py-1.5 max-sm:gap-1.5
                sm:px-3 sm:py-1.5 sm:gap-1.5
                md:px-3.5 md:py-2 md:gap-2"
              >
                <ArrowLeft className="w-5 h-5 max-sm:w-4 max-sm:h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline max-sm:hidden">Back</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 max-[425px]:grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex items-start gap-4 relative overflow-hidden max-[425px]:p-3 max-[425px]:gap-3"
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-16 max-[425px]:h-12 bg-purple-500 rounded-r-full"></div>
            <div className="p-4 bg-purple-50 rounded-2xl max-[425px]:p-3">
              <BookOpen className="w-6 h-6 max-[425px]:w-5 max-[425px]:h-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-1 max-[425px]:text-xs">Current Balance</p>
              <p className="text-2xl font-bold text-gray-900 max-[425px]:text-xl">{stats.total}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex items-start gap-4 relative overflow-hidden max-[425px]:p-3 max-[425px]:gap-3"
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-16 max-[425px]:h-12 bg-red-500 rounded-r-full"></div>
            <div className="p-4 bg-red-50 rounded-2xl max-[425px]:p-3">
              <Trophy className="w-6 h-6 max-[425px]:w-5 max-[425px]:h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-1 max-[425px]:text-xs">Total Earned</p>
              <p className="text-2xl font-bold text-gray-900 max-[425px]:text-xl">{stats.totalPoints}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex items-start gap-4 relative overflow-hidden max-[425px]:p-3 max-[425px]:gap-3"
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-16 max-[425px]:h-12 bg-green-500 rounded-r-full"></div>
            <div className="p-4 bg-green-50 rounded-2xl max-[425px]:p-3">
              <CheckCircle className="w-6 h-6 max-[425px]:w-5 max-[425px]:h-5 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-1 max-[425px]:text-xs">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 max-[425px]:text-xl">{stats.completed}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex items-start gap-4 relative overflow-hidden max-[425px]:p-3 max-[425px]:gap-3"
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-16 max-[425px]:h-12 bg-yellow-500 rounded-r-full"></div>
            <div className="p-4 bg-yellow-50 rounded-2xl max-[425px]:p-3">
              <Clock className="w-6 h-6 max-[425px]:w-5 max-[425px]:h-5 text-yellow-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-1 max-[425px]:text-xs">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 max-[425px]:text-xl">{stats.inProgress}</p>
            </div>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-end mb-4">
            <div className="flex w-full gap-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search your challenges..."
                  className="block w-full pl-9 md:pl-10 pr-4 py-2 text-sm md:text-base rounded-md focus:outline-none bg-sand"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-md border ${showFilters ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'} flex items-center justify-center transition-colors h-full`}
                >
                  <Filter className="w-4 h-4 md:w-5 md:h-5" />
                </button>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden"
                    >
                      <div className="py-1">
                        <button
                          onClick={() => { setStatusFilter("all"); setShowFilters(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${statusFilter === 'all' ? 'text-primary font-medium bg-green-50/50' : 'text-gray-700'}`}
                        >
                          All Status
                          {statusFilter === 'all' && <Check className="w-4 h-4 text-primary" />}
                        </button>
                        <button
                          onClick={() => { setStatusFilter("completed"); setShowFilters(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${statusFilter === 'completed' ? 'text-primary font-medium bg-green-50/50' : 'text-gray-700'}`}
                        >
                          Completed
                          {statusFilter === 'completed' && <Check className="w-4 h-4 text-primary" />}
                        </button>
                        <button
                          onClick={() => { setStatusFilter("in-progress"); setShowFilters(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${statusFilter === 'in-progress' ? 'text-primary font-medium bg-green-50/50' : 'text-gray-700'}`}
                        >
                          In Progress
                          {statusFilter === 'in-progress' && <Check className="w-4 h-4 text-primary" />}
                        </button>

                        {(statusFilter !== 'all' || searchQuery) && (
                          <div className="border-t border-gray-100 mt-1 pt-1">
                            <button
                              onClick={() => { resetFilters(); setShowFilters(false); }}
                              className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 flex items-center gap-2"
                            >
                              <X className="w-3 h-3" />
                              Clear Filters
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Challenge Cards */}
        {filteredChallenges.length > 0 ? (
          <div className="space-y-4 md:space-y-6">
            {filteredChallenges.map((userChallenge) => (
              <ChallengeCard
                key={userChallenge.id}
                userChallenge={userChallenge}
                isExpanded={expandedCards.has(userChallenge.id)}
                onToggleExpansion={() => toggleCardExpansion(userChallenge)}
                onContinueChallenge={() => handleContinueChallenge(userChallenge)}
                getDifficultyColor={getDifficultyColor}
                getStatusBadge={getStatusBadge}
                expandedPhases={expandedPhases}
                onTogglePhaseExpansion={togglePhaseExpansion}
                onViewTaskAttempts={handleViewTaskAttempts}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg p-6 md:p-8 text-center shadow-sm border border-gray-200"
          >
            <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-lightGreen rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">No challenges found</h3>
            <p className="text-gray-600 text-sm md:text-base mb-4">
              {userChallenges?.data?.length === 0
                ? "You haven't started any challenges yet."
                : "No challenges match your current filters."}
            </p>
            {userChallenges?.data?.length === 0 ? (
              <button
                onClick={() => navigate("/challenges")}
                className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90 font-medium text-sm md:text-base"
              >
                Browse Challenges
              </button>
            ) : (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90 font-medium text-sm md:text-base"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        )}

        {/* Task Attempts Modal */}
        <TaskAttemptsModal isOpen={showTaskAttempts} onClose={() => setShowTaskAttempts(false)} task={selectedTask} />
      </div>
    </div>
  )
}

// Challenge Card Component
function ChallengeCard({
  userChallenge,
  isExpanded,
  onToggleExpansion,
  onContinueChallenge,
  getDifficultyColor,
  getStatusBadge,
  expandedPhases,
  onTogglePhaseExpansion,
  onViewTaskAttempts,
}) {
  const challenge = userChallenge.Challenge
  const phases = userChallenge.UserChallengePhases || []

  // Calculate overall progress
  const totalTasks = phases.reduce((sum, phase) => sum + (phase.ChallengePhase?.tasks_count || 0), 0)
  const completedTasks = phases.reduce((sum, phase) => sum + (phase.completed_tasks || 0), 0)
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-shadow duration-300"
    >
      {/* Card Header */}
      <div className="p-5 cursor-pointer" onClick={onToggleExpansion}>
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex flex-row items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-lg font-bold text-gray-900">{challenge?.title}</h3>
              {getStatusBadge(userChallenge)}
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getDifficultyColor(challenge?.difficulty_level)}`}>
                {challenge?.difficulty_level}
              </span>
            </div>

            {(userChallenge.is_completed === false || userChallenge.is_completed === 0) && (
              <button
                onClick={onContinueChallenge}
                className="flex-shrink-0 bg-primary text-white hover:bg-primary/90 px-3 py-1 md:px-4 md:py-1.5 rounded-md font-bold text-[10px] md:text-xs flex items-center gap-1.5 md:gap-2 transition-all active:scale-95 whitespace-nowrap"
              >
                <Play className="w-2.5 h-2.5 md:w-3 md:h-3 fill-current" />
                Continue
              </button>
            )}
          </div>
          <p className="text-gray-600 text-xs">{challenge?.description}</p>
        </div>

        {/* Stats Row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-2">
          <div className="flex-1 max-w-md">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-500 font-medium">Overall Progress</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-8 text-xs">
            <div>
              <div className="text-gray-500 text-[10px] mb-0.5">Points</div>
              <div className="font-bold text-gray-900 text-sm">{userChallenge.points_earned || 0}</div>
            </div>
            <div>
              <div className="text-gray-500 text-[10px] mb-0.5">Tasks</div>
              <div className="font-bold text-gray-900 text-sm">{completedTasks}/{totalTasks}</div>
            </div>
            <div>
              <div className="text-gray-500 text-[10px] mb-0.5">Started</div>
              <div className="font-bold text-gray-900 text-sm">
                {userChallenge.assigned_at
                  ? new Date(userChallenge.assigned_at).toLocaleDateString('en-GB')
                  : "N/A"
                }
              </div>
            </div>
            <button
              // onClick={onToggleExpansion}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content - Timeline */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 bg-white"
          >
            <div className="p-5 md:p-6">
              <h4 className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-6">
                <Activity className="w-3 h-3" />
                Challenge Phases & Tasks
              </h4>

              <div className="relative">
                {/* Vertical Timeline Line */}
                <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gray-100" />

                <div className="space-y-6">
                  {phases.map((phase) => (
                    <PhaseTimelineItem
                      key={phase.id}
                      phase={phase}
                      isExpanded={expandedPhases.has(phase.id)}
                      onToggleExpansion={() => onTogglePhaseExpansion(phase.id)}
                      getDifficultyColor={getDifficultyColor}
                      onViewTaskAttempts={onViewTaskAttempts}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Phase Timeline Item without Card styling
function PhaseTimelineItem({ phase, isExpanded, onToggleExpansion, getDifficultyColor, onViewTaskAttempts }) {
  const challengePhase = phase.ChallengePhase
  const tasks = phase.UserChallengeTasks || []
  const totalTasks = challengePhase?.tasks_count || 0
  const completedTasks = phase.completed_tasks || 0
  const phaseProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  const isCompleted = phase.is_completed

  return (
    <div className="relative">
      <div className="flex items-start gap-2 md:gap-4 z-10 relative">
        {/* Phase Icon Marker */}
        <button
          onClick={onToggleExpansion}
          className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center border-[2px] z-10 transition-colors bg-white flex-shrink-0 ${isCompleted
            ? "border-green-500 text-green-500"
            : phase.is_lock
              ? "border-gray-200 text-gray-300"
              : "border-primary text-primary"
            }`}
        >
          {isCompleted ? (
            <CheckCircle className="w-3 h-3 md:w-4 md:h-4 fill-current text-white stroke-green-500" />
          ) : phase.is_lock ? (
            <Lock className="w-2.5 h-2.5 md:w-3 md:h-3" />
          ) : (
            <Play className="w-2.5 h-2.5 md:w-3 md:h-3 fill-current ml-0.5" />
          )}
        </button>

        {/* Phase Header Content */}
        <div className="flex-1 pt-0.5 md:pt-1">
          <div
            className="flex items-start justify-between cursor-pointer gap-2"
            onClick={onToggleExpansion}
          >
            <div>
              <div className="flex items-center gap-2 md:gap-3 mb-1 flex-wrap">
                <h5 className={`text-sm md:text-base font-bold transition-colors ${phase.is_lock ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                  Phase {challengePhase?.phase_number}: {challengePhase?.title}
                </h5>
                <span className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-semibold rounded-md">
                  {challengePhase?.phase_type || 'Moderate'}
                </span>
                {!!isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
              </div>
              <p className="text-gray-500 text-xs">{challengePhase?.description}</p>
            </div>

            <div className="flex text-right">
              {!!phase.is_lock && <Lock className="w-3 h-3 text-gray-300 inline-block mb-1" />}
              {!phase.is_lock && (
                <div className={`text-xs font-bold ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                  {Math.round(phaseProgress)}% Complete
                </div>
              )}
              <button
                className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Tasks List */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mt-4 space-y-2"
              >
                {tasks.map((task) => (
                  <TaskTimelineCard
                    key={task.id}
                    task={task}
                    getDifficultyColor={getDifficultyColor}
                    onViewAttempts={() => onViewTaskAttempts(task)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// Stats Components used inside Task
const TaskStat = ({ label, value, icon: Icon, unit }) => (
  <div className="text-center px-2 md:px-4 py-1">
    <div className="text-[9px] md:text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">{label}</div>
    <div className="flex items-center justify-center gap-0.5 md:gap-1 font-bold text-gray-900 text-xs md:text-sm">
      {value}
      <span className="text-[10px] md:text-xs font-normal text-gray-500">{unit}</span>
    </div>
  </div>
)

// Task Card
function TaskTimelineCard({ task, getDifficultyColor, onViewAttempts }) {
  const challengeTask = task.ChallengeTask
  const isCompleted = task.is_completed
  const hasAttempts = (task.total_attempts_made || 0) > 0

  return (
    <div className={`bg-white rounded-md p-2.5 md:p-3 border flex flex-col md:flex-row gap-2.5 md:gap-3 items-center ${isCompleted ? 'border-green-200 bg-green-50/10' : 'border-gray-200'
      }`}>
      {/* Icon */}
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-400 border border-gray-100'
        }`}>
        {isCompleted ? <CheckCircle className="w-4 h-4" /> : <div className="w-2.5 h-2.5 rounded-full border-2 border-current" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-2 mb-0.5">
          <h6 className="font-semibold text-gray-900 text-sm">{challengeTask?.title}</h6>
          {!!challengeTask?.is_mandatory ? (
            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wide rounded">
              Required
            </span>
          ) : !!isCompleted && (
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wide rounded">
              Passed
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 line-clamp-1">{challengeTask?.description}</p>
      </div>

      {/* Stats & Action */}
      <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-center md:justify-end border-t md:border-t-0 border-gray-100 pt-2 md:pt-0">
        <div className="flex divide-x divide-gray-100">
          <TaskStat
            label="Best"
            value={task.best_score || "0"}
            unit="%"
          />
          <TaskStat
            label="Time"
            value={task.average_time ? Math.round(task.average_time) : "0"}
            unit="s"
          />
        </div>

        {hasAttempts && (
          <button
            onClick={onViewAttempts}
            className="px-4 py-1.5 rounded-md font-bold text-xs transition-all bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            View
          </button>
        )}
      </div>
    </div>
  )
}


// Task Attempts Modal Component
function TaskAttemptsModal({ isOpen, onClose, task }) {
  const { data: attemptsData, isLoading } = useGetQuizAttemptsQuery(
    { user_challenge_task_id: task?.id },
    { skip: !task?.id || !isOpen },
  )

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden"
        >

          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
            <div className="min-w-0 pr-2">
              <h2 className="text-xl font-semibold text-gray-900 truncate">
                {task?.ChallengeTask?.title}
              </h2>
              <p className="text-xs md:text-sm opacity-90 mt-1 truncate">Task Attempt Details</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:!hidden [-ms-overflow-style:none!important] [scrollbar-width:none!important]">
            {/* Task Overview Stats */}
            {task && (
              <div className="bg-gray-50 px-4 md:px-6 py-3 md:py-4 border-b">
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
                  <div className="text-center">
                    <div className="text-sm md:text-lg font-bold text-gray-900">{task.total_attempts_made || 0}</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm md:text-lg font-bold text-green-600">{task.passed_attempts || 0}</div>
                    <div className="text-xs text-gray-500">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm md:text-lg font-bold text-indigo-600">{task.best_score || 0}%</div>
                    <div className="text-xs text-gray-500">Best</div>
                  </div>
                  <div className="hidden md:block text-center">
                    <div className="text-sm md:text-lg font-bold text-purple-600">{task.points_earned || 0}</div>
                    <div className="text-xs text-gray-500">Points</div>
                  </div>
                  <div className="hidden md:block text-center">
                    <div className="text-sm md:text-lg font-bold text-orange-600">
                      {task.total_correct_answers || 0}/{task.total_questions_attempted || 0}
                    </div>
                    <div className="text-xs text-gray-500">Correct</div>
                  </div>
                  <div className="hidden md:block text-center">
                    <div className="text-sm md:text-lg font-bold text-blue-600">
                      {Math.floor((task.average_time || 0) / 60)}m {Math.floor((task.average_time || 0) % 60)}s
                    </div>
                    <div className="text-xs text-gray-500">Avg Time</div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Content */}
            <div className="p-4 md:p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-6 md:py-8">
                  <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-indigo-600" />
                  <span className="ml-2 text-gray-600 text-sm md:text-base">Loading attempts...</span>
                </div>
              ) : attemptsData?.attempts?.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Attempt History</h4>
                  {attemptsData.attempts.map((attempt, index) => (
                    <AttemptCard key={attempt.id} attempt={attempt} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 md:py-8">
                  <AlertCircle className="w-8 h-8 md:w-12 md:h-12 text-gray-400 mx-auto mb-3 md:mb-4" />
                  <h4 className="text-base md:text-lg font-medium text-gray-900 mb-2">No Attempts Yet</h4>
                  <p className="text-gray-600 text-sm md:text-base">You haven't made any attempts on this task yet.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Enhanced Attempt Card Component
function AttemptCard({ attempt, index }) {
  const [showDetails, setShowDetails] = useState(false)

  let resultsDetails = []
  try {
    resultsDetails = JSON.parse(attempt.results_details || "[]")
  } catch (e) {
    console.error("Error parsing results details:", e)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const accuracy = attempt.total_questions > 0 ? Math.round((attempt.total_correct / attempt.total_questions) * 100) : 0

  return (
    <div className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Side: Attempt Info & Status */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${attempt.is_passed
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
              } flex-shrink-0`}
          >
            {index + 1}
          </div>
          <div className="min-w-0 flex flex-col">
            <div className="flex items-center gap-2">
              <h5 className="font-semibold text-gray-900 text-sm truncate">Attempt #{attempt.attempt_number}</h5>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500 truncate">{new Date(attempt.created_at).toLocaleString()}</span>
            </div>

            {/* Inline Stats Badges for mobile - or wrapped below title */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${attempt.is_passed ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                }`}>
                {attempt.is_passed ? "Passed" : "Failed"}
              </span>

              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-200">
                <Target className="w-3 h-3" />
                {accuracy}% Acc.
              </span>

              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-200">
                <CheckSquare className="w-3 h-3" />
                {attempt.total_correct}/{attempt.total_questions}
              </span>

              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-200">
                <Trophy className="w-3 h-3" />
                {attempt.total_reward_points} pts
              </span>

              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-200">
                <Clock className="w-3 h-3" />
                {formatTime(attempt.time_used_seconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Action */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`self-start sm:self-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex-shrink-0 flex items-center gap-1 ${showDetails
            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
        >
          {showDetails ? "Hide Details" : "View Details"}
          {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Detailed Results */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-100 pt-3 mt-3"
          >
            <h6 className="font-semibold text-gray-900 mb-3 flex items-center text-xs uppercase tracking-wider">
              <CheckSquare className="w-3 h-3 mr-2" />
              Question Analysis
            </h6>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 [&::-webkit-scrollbar]:!hidden [-ms-overflow-style:none!important] [scrollbar-width:none!important]">
              {resultsDetails.map((result, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-2.5 border relative ${result.isCorrect ? "bg-white border-green-200" : "bg-white border-red-200"
                    } shadow-sm overflow-hidden`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${result.isCorrect ? "bg-green-500" : "bg-red-500"}`}></div>

                  <div className="flex items-start justify-between gap-3 pl-2">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Question {idx + 1}</span>
                        <p className="text-sm font-medium text-gray-900 leading-snug">{result.question_text_stored}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${result.isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          }`}>
                          <span className="opacity-70 mr-1">Your Answer:</span>
                          <span>{result.userAnswer}</span>
                        </div>
                        {!result.isCorrect && result?.correctAnswer && (
                          <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700">
                            <span className="opacity-70 mr-1">Correct Answer:</span>
                            <span>{Array.isArray(result.correctAnswer) ? result.correctAnswer.join(", ") : result.correctAnswer}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 pt-0.5">
                      {result.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500 fill-green-50" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 fill-red-50" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}