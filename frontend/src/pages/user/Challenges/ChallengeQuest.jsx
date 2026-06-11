"use client"
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */

import { useState, useEffect } from "react"
import { useNavigate, useNavigationType } from "react-router-dom"
import {
  useStartUserChallengeQuestMutation,
  useGetAllChallengeQuestsQuery,
  useGetAllChallengeByUserQuestsQuery,
  useGetRecommendedChallengesQuery,
} from "../../../services/Challenge/userChallengeQuestAPI"
import {
  AlertTriangle,
  Loader2,
  X,
  Target,
  Clock,
  CheckCircle,
  ArrowRight,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Star,
  Calendar,
  Info,
  ChevronDown,
  Code,
  Database,
  Shield,
  Zap,
  PenTool,
  Server,
  Globe,
  CornerDownRight,
  User,
  Trophy,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "react-hot-toast"
import { getStudentToken } from "../../../services/CookieService"
import { slugify } from "../../../utils/slugify"
import { useGetFeatureStatusByNameQuery } from "../../../services/Masters/featureStatusAPI"
import ComingSoonModal2 from "../../../components/modal/ComingSoonModal2"
import PrimaryLoader from "../../../components/ui/PrimaryLoader"

export default function ChallengeQuest() {
  const { access_token } = getStudentToken()
  const navigate = useNavigate()
  const navType = useNavigationType()

  // Tab State
  const [activeTab, setActiveTab] = useState("All Challenges")

  const tabs = [
    { id: "all", label: "All Challenges" },
    { id: "progress", label: "My Progress" },
    { id: "completed", label: "Completed" }
  ]

  // Feature status query
  const { data: featureData, isLoading: featureDataLoading, error: featureDataError } =
    useGetFeatureStatusByNameQuery({ name: "challenge_quest" })

  // Other data queries
  const { data: challenges, isLoading } = useGetAllChallengeQuestsQuery()
  const { data: enrolledChallenges, refetch } = useGetAllChallengeByUserQuestsQuery({ access_token })

  const { data: recommendedChallenges, isLoading: isRecommendedLoading } =
    useGetRecommendedChallengesQuery(access_token)

  const [startChallenge] = useStartUserChallengeQuestMutation()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [selectedChallenge, setSelectedChallenge] = useState(null)

  // Filtering states
  const [filteredChallenges, setFilteredChallenges] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [tagFilter, setTagFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState("grid")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage] = useState(9)

  // Filter toggle state
  const [showFilters, setShowFilters] = useState(false)

  // Calculate total pages whenever filtered challenges change
  useEffect(() => {
    setTotalPages(Math.ceil(filteredChallenges.length / itemsPerPage))
    setCurrentPage(1)
  }, [filteredChallenges.length, itemsPerPage])

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  useEffect(() => {
    if (navType === "POP") {
      refetch()
    }
  }, [navType, refetch])

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const getQuestDateStatus = (challenge) => {
    const now = new Date()
    const startDate = challenge.startDate ? new Date(challenge.startDate) : null
    const endDate = challenge.endDate ? new Date(challenge.endDate) : null

    if (startDate && endDate) {
      if (now >= startDate && now <= endDate) {
        return "running"
      } else if (now < startDate) {
        return "upcoming"
      } else {
        return "expired"
      }
    } else if (startDate && now < startDate) {
      return "upcoming"
    } else if (endDate && now > endDate) {
      return "expired"
    }

    return "running"
  }

  useEffect(() => {
    let allChallenges = [];

    // Add active challenges from the API
    if (challenges?.data && Array.isArray(challenges.data)) {
      allChallenges = [...challenges.data];
    }

    // Add inactive enrolled challenges that are not already in the list
    if (enrolledChallenges?.data && Array.isArray(enrolledChallenges.data)) {
      enrolledChallenges.data.forEach((enrolled) => {
        const challengeId = enrolled.challenge_id;
        const enrolledChallengeData = enrolled.Challenge;

        // Check if this challenge is already in allChallenges
        const exists = allChallenges.some(
          (challenge) => challenge.id === challengeId
        );

        // If not exists and we have the challenge data, add it
        if (!exists && enrolledChallengeData) {
          // Transform the Challenge object to match the format of challenges.data
          allChallenges.push({
            id: enrolledChallengeData.id,
            title: enrolledChallengeData.title,
            description: enrolledChallengeData.description,
            difficulty_level: enrolledChallengeData.difficulty_level,
            category_id: enrolledChallengeData.category_id,
            reward_points: enrolledChallengeData.reward_points,
            startDate: enrolledChallengeData.startDate,
            endDate: enrolledChallengeData.endDate,
            rules: enrolledChallengeData.rules,
            is_active: enrolledChallengeData.is_active,
            created_at: enrolledChallengeData.created_at,
            updated_at: enrolledChallengeData.updated_at,
            category_name: enrolledChallengeData.category_name,
            // Add a flag to indicate this is an inactive challenge (optional)
            is_inactive_enrolled: enrolledChallengeData.is_active === 0
          });
        }
      });
    }

    if (allChallenges.length === 0) {
      setFilteredChallenges([]);
      return;
    }

    const filtered = allChallenges.filter((challenge) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        challenge.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Difficulty filter
      const matchesDifficulty =
        difficultyFilter === "all" || challenge.difficulty_level === difficultyFilter;

      // Tag filter
      const matchesTag = tagFilter === "all" || challenge?.category_name === tagFilter;

      // Pre-calculate status
      const isEnrolled = enrolledChallenges?.data?.some(
        (enrolled) => enrolled.challenge_id === challenge.id
      );
      const isCompleted = enrolledChallenges?.data?.some(
        (enrolled) => enrolled.challenge_id === challenge.id && enrolled.is_completed === 1
      );

      // Status filter (enrollment status)
      let matchesStatus = true;
      if (statusFilter !== "all") {
        if (statusFilter === "completed") {
          matchesStatus = isCompleted;
        } else if (statusFilter === "in-progress") {
          matchesStatus = isEnrolled && !isCompleted;
        } else if (statusFilter === "todo") {
          matchesStatus = !isEnrolled;
        }
      }

      // Tab filter
      let matchesTab = true;
      if (activeTab === "My Progress") {
        matchesTab = isEnrolled && !isCompleted;
      } else if (activeTab === "Completed") {
        matchesTab = isCompleted;
      }

      return matchesSearch && matchesDifficulty && matchesTag && matchesStatus && matchesTab;
    });

    // Sort by date status: running first, then upcoming, then expired
    filtered.sort((a, b) => {
      const statusA = getQuestDateStatus(a);
      const statusB = getQuestDateStatus(b);

      const statusOrder = { running: 0, upcoming: 1, expired: 2 };

      if (statusOrder[statusA] !== statusOrder[statusB]) {
        return statusOrder[statusA] - statusOrder[statusB];
      }

      // If same status, sort by title
      return a.title.localeCompare(b.title);
    });

    setFilteredChallenges(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1);
  }, [challenges, searchQuery, difficultyFilter, tagFilter, statusFilter, enrolledChallenges, activeTab]);

  const handleInfoClick = (challenge) => {
    setSelectedChallenge(challenge)
    setShowRules(true)
  }

  const handleChallengeClick = (challenge) => {
    if (!challenge || !challenge.id) {
      toast.error("Invalid challenge selected.")
      return
    }

    const now = new Date()
    const startDate = new Date(challenge.startDate)
    const endDate = new Date(challenge.endDate)

    if (now > endDate) {
      toast.error("This challenge has expired.")
      return
    }

    if (now < startDate) {
      toast.error("This challenge has not started yet.")
      return
    }

    handleStartChallenge(challenge)
  }

  const handleStartChallenge = async (challenge) => {
    try {
      if (!access_token) {
        toast.error("Login To Start Challenge")
        return
      }

      if (!challenge || !challenge.id) {
        toast.error("Invalid challenge data")
        return
      }

      const result = await startChallenge({
        data: {
          challenge_id: challenge.id,
        },
        access_token,
      }).unwrap()

      navigate(`/challenges/${slugify(result?.challenge?.title)}`, {
        state: { userChallengeId: result.userChallenge.id },
      })

      setShowConfirmation(false)
    } catch (error) {
      console.error("Failed to start challenge:", error)
      toast.error(error?.data?.message || "Failed to start challenge")
    }
  }

  const getCategoryIcon = (category) => {
    return <img src="/assets/share.png" alt="icon" className="w-3 h-3 object-contain" />
  }

  // Get current page challenges
  const getCurrentChallenges = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredChallenges.slice(startIndex, endIndex)
  }

  // Get all unique tags/categories
  const allTags = challenges?.data ? [...new Set(challenges.data.map((c) => c?.category_name).filter(Boolean))] : []

  // Get all unique difficulties
  const allDifficulties = challenges?.data
    ? [...new Set(challenges.data.map((c) => c.difficulty_level).filter(Boolean))]
    : []

  const resetFilters = () => {
    setSearchQuery("")
    setDifficultyFilter("all")
    setTagFilter("all")
    setStatusFilter("all")
    setShowFilters(false)
  }

  // Handle navigation to My Challenges
  const handleMyChallengesClick = () => {
    navigate("/my-challenges")
  }

  // Show coming soon page if feature is not active
  if (featureData?.is_active === 0) {
    return <ComingSoonModal2 featureData={featureData} />
  }

  // Show loading state
  if (isLoading || featureDataLoading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <PrimaryLoader />
      </div>
    )

  // Show error state for feature data
  if (featureDataError)
    return (
      <div className="text-red-500 text-center p-4 bg-red-50 min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong</h2>
          <p>Error loading feature status: {featureDataError?.toString()}</p>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-white">
      {/* Container with responsive padding */}
      <div className="container px-5 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header Section with My Challenges Button */}
        <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 md:mb-10">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-bold text-megistic leading-tight">
              Challenges Explorer
            </h1>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Leaderboard Button */}
              <button
                onClick={() => navigate("/challenges/leaderboard")}
                className="flex items-center justify-center gap-1.5 sm:gap-2 bg-forestGreen text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-lg transition-all duration-300 font-medium text-xs sm:text-sm md:text-base flex-1 sm:flex-none sm:w-auto shadow-sm"
              >
                <Trophy size={14} className="sm:w-4 sm:h-4" />
                <span>Leaderboard</span>
              </button>

              {/* My Challenges Button */}
              <button
                onClick={handleMyChallengesClick}
                className="flex items-center justify-center gap-1.5 sm:gap-2 bg-primary hover:bg-primary/90 text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-lg transition-all duration-300 font-medium text-xs sm:text-sm md:text-base flex-1 sm:flex-none sm:w-auto shadow-sm whitespace-nowrap"
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                <span>My Challenges</span>
              </button>
            </div>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm md:text-lg lg:text-xl max-w-3xl lg:max-w-4xl leading-relaxed">
            Browse and take on challenges to sharpen your technical skills and climb the leaderboard.
          </p>
        </div>

        {/* Tabs - Responsive */}
        <div className="flex w-full border-b border-gray-200 mb-4 xs:mb-5 sm:mb-6 md:mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.label)}
              className={`flex-1 md:flex-none md:w-auto pb-2 xs:pb-2.5 sm:pb-3 px-1 md:px-0 text-center md:text-left text-xs xs:text-sm font-medium whitespace-nowrap transition-colors relative md:mr-8 ${activeTab === tab.label
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters Bar - Responsive Layout */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          {/* Desktop Layout (lg and above) - Horizontal with search and filters in one row */}
          <div className="hidden lg:flex lg:items-center lg:gap-4">
            {/* Search Bar - Adjusted width */}
            <div className="flex-1" style={{ maxWidth: '40rem' }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search challenges..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            {/* Difficulty Dropdown */}
            <div className="relative">
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-40 appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="all">Difficulty: All</option>
                {allDifficulties.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Category Dropdown */}
            <div className="relative">
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="w-40 appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="all">Category: All</option>
                {allTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Status Dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40 appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="all">Status: All</option>
                <option value="todo">Available</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* View Mode Toggle - On the far right */}
            <div className="flex bg-gray-100 p-1 rounded-lg gap-1 ml-auto">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile & Tablet Layout (below lg) - Original vertical layout */}
          <div className="lg:hidden">
            {/* Search Bar */}
            <div className="relative w-full mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Filter Dropdowns */}
              <div className="flex flex-wrap gap-2 sm:gap-3 flex-1">
                {/* Difficulty Dropdown */}
                <div className="relative flex-1 min-w-[140px]">
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="w-full appearance-none pl-3 sm:pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="all">Difficulty: All</option>
                    {allDifficulties.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 sm:w-4 h-3 sm:h-4 text-gray-400 pointer-events-none" />
                </div>

                {/* Category Dropdown */}
                <div className="relative flex-1 min-w-[140px]">
                  <select
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="w-full appearance-none pl-3 sm:pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="all">Category: All</option>
                    {allTags.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 sm:w-4 h-3 sm:h-4 text-gray-400 pointer-events-none" />
                </div>

                {/* Status Dropdown */}
                <div className="relative flex-1 min-w-[140px]">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full appearance-none pl-3 sm:pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="all">Status: All</option>
                    <option value="todo">Available</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 sm:w-4 h-3 sm:h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* View Mode Toggle - Hidden on mobile, visible on tablet (sm and above) */}
              <div className="hidden sm:flex items-center justify-end">
                <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {filteredChallenges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 xs:py-16 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-300">
            <div className="w-12 h-12 xs:w-16 xs:h-16 bg-white rounded-full flex items-center justify-center mb-3 xs:mb-4 shadow-sm border border-gray-100">
              <Search className="w-6 h-6 xs:w-8 xs:h-8 text-gray-400" />
            </div>
            <h3 className="text-lg xs:text-xl font-bold text-megistic mb-1 xs:mb-2">No Challenges Found</h3>
            <p className="text-gray-500 text-sm xs:text-base max-w-xs xs:max-w-md mb-4 xs:mb-6 px-4">
              We couldn't find any challenges matching your current filters.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 xs:px-6 py-2 xs:py-2.5 bg-white border border-gray-300 text-gray-700 text-sm xs:text-base font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              Clear All Filters
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 xs:gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
            {getCurrentChallenges().map((challenge) => {
              const isEnrolled = enrolledChallenges?.data?.some(e => e.challenge_id === challenge.id)
              const isCompleted = enrolledChallenges?.data?.some(e => e.challenge_id === challenge.id && e.is_completed)
              const dateStatus = getQuestDateStatus(challenge)

              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border border-gray-200 p-3 xs:p-4 transition-shadow duration-300 flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-base xs:text-lg font-bold text-megistic leading-tight flex-grow pr-2">
                      {challenge.title}
                    </h3>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleInfoClick(challenge); }}
                      className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                    >
                      <Info className="w-4 h-4 xs:w-5 xs:h-5" />
                    </button>
                  </div>

                  <p className="text-gray-500 text-xs xs:text-sm mb-3 line-clamp-3 flex-grow">
                    {challenge.description}
                  </p>

                  <div className="flex items-center justify-between mb-3 xs:mb-4">
                    <div className="flex flex-wrap gap-1 xs:gap-2">
                      {/* Difficulty Badge */}
                      <span className={`inline-flex items-center px-2 py-1 xs:px-2.5 xs:py-1 rounded-full text-[10px] xs:text-[11px] font-medium tracking-wide border ${challenge.difficulty_level === 'HARD' ? 'bg-red-50 text-red-700 border-red-200' :
                        challenge.difficulty_level === 'Medium' || challenge.difficulty_level === 'MEDIUM' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-green-50 text-green-700 border-green-200'
                        }`}>
                        {challenge.difficulty_level === 'HARD' ? <Zap className="w-2.5 h-2.5 xs:w-3 xs:h-3 mr-1" /> :
                          challenge.difficulty_level === 'Medium' || challenge.difficulty_level === 'MEDIUM' ? <Shield className="w-2.5 h-2.5 xs:w-3 xs:h-3 mr-1" /> :
                            <Star className="w-2.5 h-2.5 xs:w-3 xs:h-3 mr-1" />}
                        {challenge.difficulty_level || 'Easy'}
                      </span>

                      {/* Status Badge */}
                      <span className={`inline-flex items-center px-2 py-1 xs:px-2.5 xs:py-1 rounded-full text-[10px] xs:text-[11px] font-medium tracking-wide border ${isCompleted ? 'bg-green-50 text-green-700 border-green-200' :
                        isEnrolled ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                        {isCompleted ? <CheckCircle className="w-2.5 h-2.5 xs:w-3 xs:h-3 mr-1" /> :
                          isEnrolled ? <Clock className="w-2.5 h-2.5 xs:w-3 xs:h-3 mr-1" /> :
                            <Target className="w-2.5 h-2.5 xs:w-3 xs:h-3 mr-1" />}
                        {isCompleted ? 'Completed' : isEnrolled ? 'In Progress' : 'Available'}
                      </span>
                    </div>

                    {/* Points Display */}
                    <div className="flex items-center font-bold text-megistic">
                      <div className="flex items-center justify-center w-4 h-4 xs:w-5 xs:h-5 rounded-full bg-orange-100 mr-1 xs:mr-1.5">
                        <Star className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-orange-600" />
                      </div>
                      <div className="text-xs">
                        {challenge.reward_points || 500} PTS
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 xs:pt-4 border-t border-gray-100 mt-auto">
                    <span className="inline-flex items-center px-2 py-1 xs:px-2.5 xs:py-1 rounded-full text-[10px] xs:text-[11px] font-medium tracking-wide border bg-gray-50 text-gray-700 border-gray-200">
                      <span className="mr-1 xs:mr-1.5">{getCategoryIcon(challenge.category_name)}</span>
                      {challenge.category_name || 'GENERAL'}
                    </span>
                    <div className="flex flex-col items-end">
                      {dateStatus === "upcoming" && challenge.startDate ? (
                        <div className="text-xs text-gray-400 font-medium">
                          Starts: {new Date(challenge.startDate).toLocaleDateString()}
                        </div>
                      ) : challenge.endDate && (
                        <div className="text-xs text-gray-400 font-medium">
                          Expires: {new Date(challenge.endDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleChallengeClick(challenge)}
                    disabled={!isCompleted && (dateStatus === "upcoming" || dateStatus === "expired")}
                    className={`mt-4 xs:mt-6 w-full py-2 xs:py-2.5 rounded-lg font-semibold text-xs xs:text-sm transition-colors ${isCompleted ? "bg-gray-100 text-gray-500 cursor-default"
                      : (dateStatus === "upcoming" || dateStatus === "expired") ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-70"
                        : "bg-leafGreen text-white shadow-sm hover:bg-leafGreen/90"
                      }`}
                  >
                    {isCompleted ? "Completed"
                      : dateStatus === "upcoming" ? "Upcoming Challenge"
                        : dateStatus === "expired" ? "Expired Challenge"
                          : isEnrolled ? "Continue Challenge"
                            : "Start Challenge"}
                  </button>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3 xs:space-y-4">
            {getCurrentChallenges().map((challenge) => {
              const isEnrolled = enrolledChallenges?.data?.some(e => e.challenge_id === challenge.id)
              const isCompleted = enrolledChallenges?.data?.some(e => e.challenge_id === challenge.id && e.is_completed)
              const dateStatus = getQuestDateStatus(challenge)

              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border border-gray-200 p-3 xs:p-4 flex flex-col lg:flex-row items-start gap-4 lg:gap-6 transition-shadow"
                >
                  {/* Main Content */}
                  <div className="flex-grow min-w-0 w-full">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-base xs:text-lg font-bold text-megistic">{challenge.title}</h3>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleInfoClick(challenge); }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Info className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                      </button>
                    </div>
                    <p className="text-gray-500 text-xs xs:text-sm mb-3 xs:mb-4 line-clamp-2 max-w-3xl">
                      {challenge.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-1 xs:gap-2">
                      {/* Difficulty Badge */}
                      <span className={`inline-flex items-center px-2 py-1 xs:px-2.5 xs:py-1 rounded-full text-[10px] xs:text-[11px] font-medium tracking-wide border ${challenge.difficulty_level === 'HARD' ? 'bg-red-50 text-red-700 border-red-200' :
                        challenge.difficulty_level === 'Medium' || challenge.difficulty_level === 'MEDIUM' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-green-50 text-green-700 border-green-200'
                        }`}>
                        {challenge.difficulty_level === 'HARD' ? <Zap className="w-2.5 h-2.5 xs:w-3 xs:h-3 mr-1" /> :
                          challenge.difficulty_level === 'Medium' || challenge.difficulty_level === 'MEDIUM' ? <Shield className="w-2.5 h-2.5 xs:w-3 xs:h-3 mr-1" /> :
                            <Star className="w-2.5 h-2.5 xs:w-3 xs:h-3 mr-1" />}
                        {challenge.difficulty_level || 'Easy'}
                      </span>

                      {/* Category Badge */}
                      <span className="inline-flex items-center px-2 py-1 xs:px-2.5 xs:py-1 rounded-full text-[10px] xs:text-[11px] font-medium tracking-wide border bg-gray-50 text-gray-700 border-gray-200">
                        <span className="mr-1 xs:mr-1.5">{getCategoryIcon(challenge.category_name)}</span>
                        {challenge.category_name || 'GENERAL'}
                      </span>

                      {/* Status Badge */}
                      <span className={`inline-flex items-center px-2 py-1 xs:px-2.5 xs:py-1 rounded-full text-[10px] xs:text-[11px] font-medium tracking-wide border ${isCompleted ? 'bg-green-50 text-green-700 border-green-200' :
                        isEnrolled ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                        {isCompleted ? <CheckCircle className="w-2.5 h-2.5 xs:w-3 xs:h-3 mr-1" /> :
                          isEnrolled ? <Clock className="w-2.5 h-2.5 xs:w-3 xs:h-3 mr-1" /> :
                            <Target className="w-2.5 h-2.5 xs:w-3 xs:h-3 mr-1" />}
                        {isCompleted ? 'Completed' : isEnrolled ? 'In Progress' : 'Available'}
                      </span>

                      {/* Points Display */}
                      <div className="flex items-center font-bold text-megistic ml-1 xs:ml-2">
                        <div className="flex items-center justify-center w-4 h-4 xs:w-5 xs:h-5 rounded-full bg-orange-100 mr-1 xs:mr-1.5">
                          <Star className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-orange-600" />
                        </div>
                        <div className="text-xs">
                          {challenge.reward_points || 500} PTS
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side Actions */}
                  <div className="flex items-center gap-3 xs:gap-4 flex-shrink-0 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-gray-100 pt-3 lg:pt-0 mt-2 lg:mt-0">
                    <div className="flex items-center gap-2 xs:gap-3">
                      {/* Action Button */}
                      <button
                        onClick={() => handleChallengeClick(challenge)}
                        disabled={!isCompleted && (dateStatus === "upcoming" || dateStatus === "expired")}
                        className={`h-9 xs:h-10 px-4 xs:px-6 rounded-lg font-bold text-xs xs:text-sm transition-transform flex items-center gap-1 xs:gap-2 ${isCompleted ? 'bg-white border border-gray-200 text-gray-700'
                          : (dateStatus === "upcoming" || dateStatus === "expired") ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-70"
                            : 'bg-leafGreen text-white hover:bg-leafGreen/90 active:scale-95'
                          }`}
                      >
                        {isCompleted ? 'View Results'
                          : dateStatus === "upcoming" ? "Upcoming Challenge"
                            : dateStatus === "expired" ? "Expired Challenge"
                              : isEnrolled ? 'Continue Challenge'
                                : 'Start Challenge'}
                        {!isCompleted && dateStatus !== "upcoming" && dateStatus !== "expired" && <ArrowRight className="w-3 h-3 xs:w-4 xs:h-4" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 xs:mt-10 sm:mt-12 flex items-center justify-center gap-1 xs:gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 xs:p-2 text-gray-500 hover:text-megistic disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 xs:w-5 xs:h-5" />
            </button>

            <div className="flex items-center gap-0.5 xs:gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-7 h-7 xs:w-9 xs:h-9 rounded-lg text-xs xs:text-sm font-bold transition-all border ${currentPage === page
                    ? "bg-green-50 text-green-700 border-green-200 shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 border-transparent"
                    }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 xs:p-2 text-gray-500 hover:text-megistic disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
            >
              <ChevronRight className="w-4 h-4 xs:w-5 xs:h-5" />
            </button>
          </div>
        )}

        {/* Modals */}
        <AnimatePresence>
          {showConfirmation && selectedChallenge && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white rounded-xl shadow-2xl max-w-xs xs:max-w-sm sm:max-w-md md:max-w-lg w-full overflow-hidden">
                <div className="p-4 xs:p-5 sm:p-6">
                  <div className="flex justify-between items-start mb-3 xs:mb-4">
                    <div>
                      <span className="inline-block px-2 py-1 xs:px-2.5 xs:py-1 bg-green-100 text-green-700 text-xs font-bold rounded mb-1 xs:mb-2">
                        {selectedChallenge.difficulty_level}
                      </span>
                      <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-megistic">{selectedChallenge.title}</h2>
                    </div>
                    <button onClick={() => setShowConfirmation(false)} className="text-gray-400">
                      <X className="w-5 h-5 xs:w-6 xs:h-6" />
                    </button>
                  </div>

                  <p className="text-gray-600 text-sm xs:text-base mb-4 xs:mb-6 leading-relaxed">
                    {selectedChallenge.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3 xs:gap-4 mb-4 xs:mb-6">
                    <div className="bg-sand p-3 xs:p-4 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Points</p>
                      <p className="text-lg xs:text-xl font-bold text-forestGreen">{selectedChallenge.reward_points || 500} PTS</p>
                    </div>
                    <div className="bg-sand p-3 xs:p-4 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Category</p>
                      <p className="text-lg xs:text-xl font-bold text-forestGreen">{selectedChallenge.category_name || 'General'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 xs:gap-3">
                    <button
                      onClick={() => setShowConfirmation(false)}
                      className="flex-1 py-2.5 xs:py-3 border border-gray-200 text-gray-700 text-sm xs:text-base font-semibold rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleStartChallenge(selectedChallenge)}
                      className="flex-1 py-2.5 xs:py-3 bg-primary text-white text-sm xs:text-base font-semibold rounded-lg shadow-md transform active:scale-95 transition-all hover:bg-primary/90"
                    >
                      Start Challenge
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Rules Modal */}
          {showRules && selectedChallenge && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white rounded-xl shadow-2xl max-w-xs xs:max-w-sm sm:max-w-md w-full overflow-hidden">
                <div className="p-4 xs:p-5 sm:p-6">
                  <div className="flex justify-between items-center mb-3 xs:mb-4">
                    <h2 className="text-lg xs:text-xl font-bold text-megistic">Challenge Rules</h2>
                    <button onClick={() => setShowRules(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <X className="w-4 h-4 xs:w-5 xs:h-5" />
                    </button>
                  </div>

                  <hr className="border-gray-200 mb-3 xs:mb-4" />

                  <div className="bg-gray-50 p-3 xs:p-4 rounded-lg border border-gray-100">
                    <p className="text-gray-700 text-xs xs:text-sm leading-relaxed whitespace-pre-line">
                      {selectedChallenge.rules || "No specific rules provided for this challenge. Good luck and have fun!"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}