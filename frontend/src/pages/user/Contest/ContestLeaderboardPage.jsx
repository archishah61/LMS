"use client"

import { useState, useEffect, useCallback } from "react"
import { Trophy, X, Crown, Award, Star, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowLeft, Calendar } from "lucide-react"
import { useGetLeaderboardQuery } from "../../../services/Contest/userContestAPI"
import { getStudentToken } from "../../../services/CookieService"
import { useLocation, useParams, useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import PrimaryLoader from "../../../components/ui/PrimaryLoader"
import { useGetAllChallengeCategoriesQuery } from "../../../services/Masters/challengeCategoryApi"

export default function ContestLeaderboardPage() {
  const location = useLocation()?.state
  const contest_id = location?.contest_id;
  const navigate = useNavigate();

  const { contestSlag } = useParams();
  const { access_token } = getStudentToken()

  const [timeFilter, setTimeFilter] = useState("weekly")
  const [categoryFilter, setCategoryFilter] = useState(null)
  const [leaderboardData, setLeaderboardData] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [showMyPlacePopup, setShowMyPlacePopup] = useState(false)
  const [expandedPlayer, setExpandedPlayer] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showPageSizeOptions, setShowPageSizeOptions] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const { id, role } = useSelector((state) => state.user);

  const { data: categoriesData, isLoading: loadingCategories } = useGetAllChallengeCategoriesQuery(
    { access_token },
    { skip: !access_token },
  )

  const { data: responseData, isLoading, refetch } = useGetLeaderboardQuery({
    access_token,
    time_filter: timeFilter,
    category_filter: categoryFilter,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
    ...(contest_id ? { contest_id } : {}),
    user_id: role == 'user' ? id : 0
  })

  useEffect(() => {
    if (responseData?.success) {
      setLeaderboardData(responseData.leaderboard)
      setCurrentUser(responseData.user)
      setTotalCount(responseData.total_count || responseData.leaderboard.length)
      setHasMore(responseData.leaderboard.length === pageSize)
    }
  }, [responseData, pageSize])

  const handleTimeFilterChange = (filter) => {
    const filterMap = {
      "24h": "daily",
      "7D": "weekly",
      "30D": "monthly",
      "1Year": "yearly",
      Seasonal: "monthly",
    }
    setTimeFilter(filterMap[filter] || "weekly")
    setCurrentPage(1)
    setShowFilters(false)
  }

  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setCurrentPage(1)
    setShowPageSizeOptions(false)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    setExpandedPlayer(null)
  }

  const handleBackToContests = () => {
    navigate("/contests");
  }

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-500 fill-yellow-500" />
      case 2:
        return <Award className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400 fill-gray-400" />
      case 3:
        return <Star className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-orange-500 fill-orange-500" />
      default:
        return <span className="text-xs sm:text-xs md:text-sm font-medium">{rank}</span>
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCurrentTimeFilterDisplay = () => {
    const reverseMap = {
      daily: "24h",
      weekly: "7D",
      monthly: "30D",
      yearly: "1Year"
    }
    return reverseMap[timeFilter] || "7D"
  }

  const togglePlayerDetails = (userId) => {
    if (expandedPlayer === userId) {
      setExpandedPlayer(null)
    } else {
      setExpandedPlayer(userId)
    }
  }

  // Calculate pagination values
  const totalPages = Math.ceil(totalCount / pageSize)
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalCount)

  // Generate page numbers for pagination with tablet optimization
  const getPageNumbers = () => {
    const pages = []
    const width = window.innerWidth
    let maxVisiblePages = 5

    if (width < 640) maxVisiblePages = 3 // Mobile
    else if (width < 1024) maxVisiblePages = 4 // Tablet
    else maxVisiblePages = 5 // Desktop

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always include first page
      pages.push(1)

      // Calculate start and end of visible pages
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if we're near the beginning
      if (currentPage <= 2) {
        end = maxVisiblePages - 1
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 1) {
        start = totalPages - (maxVisiblePages - 2)
      }

      // Add ellipsis if needed
      if (start > 2) {
        pages.push('...')
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push('...')
      }

      // Always include last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 text-gray-900 min-h-screen flex items-center justify-center">
        <PrimaryLoader />
      </div>
    )
  }

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <div className="container mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6">


        {/* ── Header Section ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 sm:mb-6 md:mb-8 gap-3 sm:gap-4 md:gap-6">

          {/* Title */}
          <div className="w-full sm:w-auto">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-bold text-forestGreen">Contest Leaderboard</h1>
              <button
                onClick={handleBackToContests}
                className="flex items-center justify-center flex-shrink-0 gap-1.5 px-3 py-2 bg-white text-primary text-xs sm:text-xs md:text-sm font-medium rounded-md border border-gray-200 transition-all hover:border-gray-300 hover:shadow-sm active:scale-95 whitespace-nowrap group sm:hidden"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 transition-transform group-hover:-translate-x-0.5" />
                <span className="hidden sm:inline">Back</span>
              </button>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm md:text-sm lg:text-base mt-1 hidden sm:block">
              Track your performance and compete with others
            </p>
          </div>

          {/* Actions row — unified across all breakpoints */}
          <div className="flex items-center gap-2 w-full sm:w-auto">

            {/* My Position Button */}
            {access_token && currentUser && (
              <button
                onClick={() => setShowMyPlacePopup(true)}
                className="flex items-center justify-center flex-shrink-0 gap-1.5 px-3 py-2 bg-white text-gray-900 text-xs sm:text-xs md:text-sm font-medium rounded-md border border-gray-200 transition-all hover:border-gray-300 hover:shadow-sm active:scale-95 whitespace-nowrap"
              >
                <Trophy className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-gray-500 flex-shrink-0" />
                <span className="hidden xs:inline sm:hidden md:inline">My Position</span>
                {/* On narrow mobile show nothing but icon; on xs+ show text */}
                <span className="xs:hidden">My Rank</span>
              </button>
            )}

            {/* Time Filter */}
            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-between w-full sm:w-auto gap-1.5 sm:gap-2 px-3 py-2 bg-white text-gray-700 rounded-md border border-gray-200 text-xs sm:text-xs md:text-sm font-medium hover:border-gray-300 transition-colors active:scale-95"
              >
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-600">
                    <span className="sm:hidden">Filter: </span>
                    <span className="hidden sm:inline">Time: </span>
                  </span>
                  <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                    {getCurrentTimeFilterDisplay()}
                  </span>
                </div>
                <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ml-1 ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {showFilters && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowFilters(false)}
                  />
                  <div className="absolute top-full right-0 mt-1.5 bg-white rounded-md border border-gray-200 shadow-lg z-50 min-w-[130px] overflow-hidden animate-in fade-in slide-in-from-top-5 duration-200">
                    <div className="p-1.5">
                      {["24h", "7D", "30D", "1Year"].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => handleTimeFilterChange(filter)}
                          className={`w-full text-left px-3 py-2.5 rounded-md transition-colors flex items-center justify-between ${getCurrentTimeFilterDisplay() === filter
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                          <span className="text-xs sm:text-xs md:text-sm">{filter}</span>
                          {getCurrentTimeFilterDisplay() === filter && (
                            <div className="w-1.5 h-1.5 bg-primary rounded-full ml-2 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative flex-1 sm:flex-none min-w-[140px]">
              <select
                value={categoryFilter || "all"}
                onChange={(e) => setCategoryFilter(e.target.value === "all" ? null : parseInt(e.target.value))}
                className="w-full appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-md text-xs sm:text-xs md:text-sm text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categoriesData?.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.category}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Back Button */}
            <button
              onClick={handleBackToContests}
              className="hidden sm:flex items-center justify-center flex-shrink-0 gap-1.5 px-3 py-2 bg-white text-primary text-xs sm:text-xs md:text-sm font-medium rounded-md border border-gray-200 transition-all hover:border-gray-300 hover:shadow-sm active:scale-95 whitespace-nowrap group"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>
        </div>

        {/* ── Results count + page-size selector ────────────────────────── */}
        <div className="flex flex-row justify-between items-center mb-3 sm:mb-4 md:mb-5 gap-2">
          <p className="text-xs sm:text-xs md:text-sm text-gray-500 font-medium">
            Showing <span className="font-semibold">{startItem}–{endItem}</span> of <span className="font-semibold">{totalCount}</span>
          </p>

          <div className="relative">
            <button
              onClick={() => setShowPageSizeOptions(!showPageSizeOptions)}
              className="flex items-center justify-between gap-1.5 px-3 py-1.5 bg-white text-gray-600 rounded-md border border-gray-200 text-xs sm:text-xs md:text-sm hover:border-gray-300"
            >
              <span>Show: {pageSize}</span>
              {showPageSizeOptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showPageSizeOptions && (
              <div className="absolute top-full right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-100 z-10 min-w-[120px] p-1">
                {[10, 20, 50].map((size) => (
                  <button
                    key={size}
                    onClick={() => handlePageSizeChange(size)}
                    className={`w-full text-left px-3 py-2 text-xs sm:text-xs md:text-sm rounded-md ${pageSize === size
                      ? "bg-primary/5 text-primary font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    {size} per page
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Leaderboard Table - Tablet Optimized */}
        <div className="bg-white rounded-lg sm:rounded-md md:rounded-lg overflow-hidden border border-gray-200 shadow-sm mb-5 sm:mb-6 md:mb-8">
          {/* Desktop Table Header (Tablet + Desktop) */}
          <div className="hidden sm:grid grid-cols-12 gap-3 sm:gap-2 md:gap-3 lg:gap-4 px-4 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-3 md:py-4 bg-sand text-xs sm:text-xs md:text-sm font-medium text-gray-500 border-b border-gray-100">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-5 sm:col-span-5 md:col-span-5">Player</div>
            <div className="col-span-3 sm:col-span-3 md:col-span-3 text-center">Score</div>
            {/* <div className="col-span-2 sm:col-span-2 md:col-span-2 text-center">Activities</div> */}
            {contest_id && <div className="col-span-3 sm:col-span-3 md:col-span-3 text-center">Status</div>}
            {/* <div className="col-span-1"></div> */}
          </div>

          {/* Mobile Table Header (Mobile Only) */}
          <div className="sm:hidden grid grid-cols-12 gap-1 px-3 py-2 bg-sand text-[10px] xs:text-xs font-medium text-gray-500 border-b border-gray-100">
            <div className="col-span-2 text-center">Rank</div>
            <div className="col-span-6">Player</div>
            <div className="col-span-2 text-center">Score</div>
            {/* <div className="col-span-2 text-center">Actions</div> */}
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-100">
            {leaderboardData.length > 0 ? (
              leaderboardData.map((player, index) => (
                <div key={player.user_id} className="group transition-colors hover:bg-gray-50/30">
                  {/* Desktop/Tablet Row */}
                  <div className="hidden sm:grid grid-cols-12 gap-3 sm:gap-2 md:gap-3 lg:gap-4 px-4 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-3 md:py-4 items-center"
                    onClick={() => togglePlayerDetails(player.user_id)}
                  >
                    <div className="col-span-1 flex items-center justify-center">
                      <div className={`w-7 h-7 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full ${index === 0 ? "bg-yellow-50" : index === 1 ? "bg-gray-100" : index === 2 ? "bg-orange-50" : "bg-gray-50"
                        }`}>
                        {getRankIcon(player.user_rank)}
                      </div>
                    </div>

                    <div className="col-span-5 sm:col-span-5 md:col-span-5 flex items-center space-x-2 sm:space-x-2 md:space-x-3">
                      <div className="w-8 h-8 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 overflow-hidden flex-shrink-0">
                        {player.profile_image ? (
                          <img
                            src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${player.profile_image || "/assets/placeholder2.png"}`}
                            alt={player.full_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = "/assets/placeholder2.png"
                            }}
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-sand flex items-center justify-center text-gray-500 text-xs sm:text-xs md:text-sm font-semibold">
                            {player.full_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-gray-900 font-medium truncate flex items-center gap-1.5 text-xs sm:text-xs md:text-sm">
                          <span className="truncate">{player.username}</span>
                          {player.user_id === currentUser?.user_id && (
                            <span className="bg-primary/10 text-primary text-[9px] sm:text-[9px] md:text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 tracking-wide">You</span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs truncate hidden md:block">
                          {player.full_name}
                        </p>
                      </div>
                    </div>

                    <div className="col-span-3 sm:col-span-3 md:col-span-3 text-gray-900 font-bold text-center text-xs sm:text-xs md:text-sm">
                      {player.total_score}
                    </div>

                    {/* <div className="col-span-2 sm:col-span-2 md:col-span-2 text-gray-600 text-center text-xs sm:text-xs md:text-sm">
                      {player.activities.length}
                    </div> */}
                    {contest_id && <div className="col-span-3 sm:col-span-3 md:col-span-3 flex justify-center">
                      <span
                        className={`text-[10px] sm:text-[10px] md:text-xs font-medium px-2 py-1 rounded-full capitalize ${player.activities?.length &&
                          player.activities.every(a => a.status === "completed")
                          ? "bg-green-100 text-green-700"
                          : player.activities?.some(a => a.status === "pending")
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                          }`}
                      >
                        {
                          player.activities?.length &&
                            player.activities.every(a => a.status === "completed")
                            ? "completed"
                            : player.activities?.some(a => a.status === "pending")
                              ? "pending"
                              : "unknown"
                        }
                      </span>
                    </div>}

                    {/* <div className="col-span-1 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlayerDetails(player.user_id);
                        }}
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
                      >
                        {expandedPlayer === player.user_id ? (
                          <ChevronUp className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                        )}
                      </button>
                    </div> */}
                  </div>

                  {/* Mobile Row */}
                  <div className="sm:hidden grid grid-cols-12 gap-1 px-3 py-2.5 items-center cursor-pointer active:bg-gray-50/50"
                    onClick={() => togglePlayerDetails(player.user_id)}
                  >
                    <div className="col-span-2 flex items-center justify-center">
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full ${index === 0 ? "bg-yellow-50" : index === 1 ? "bg-gray-100" : index === 2 ? "bg-orange-50" : "bg-gray-50"
                        }`}>
                        {getRankIcon(player.user_rank)}
                      </div>
                    </div>

                    <div className="col-span-6 flex items-center space-x-2">
                      <div className="w-7 h-7 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 overflow-hidden flex-shrink-0">
                        {player.profile_image ? (
                          <img
                            src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${player.profile_image || "/placeholder.png"}`}
                            alt={player.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-sand flex items-center justify-center text-gray-500 text-xs font-semibold">
                            {player.full_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-gray-900 font-medium truncate text-xs flex items-center gap-1">
                          <span className="truncate">{player.username}</span>
                          {player.user_id === currentUser?.user_id && (
                            <span className="bg-primary/10 text-primary text-[9px] font-bold px-1 py-0.5 rounded-full flex-shrink-0">You</span>
                          )}
                        </div>
                        <div className="text-gray-500 text-xs truncate">
                          Score: {player.total_score}
                        </div>
                      </div>
                    </div>

                    {/* <div className="col-span-2 text-gray-600 font-medium text-center text-xs">
                      {player.activities.length}
                    </div>

                    <div className="col-span-2 flex justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlayerDetails(player.user_id);
                        }}
                        className="p-1 rounded-full text-gray-400"
                      >
                        {expandedPlayer === player.user_id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div> */}
                  </div>

                  {/* Expanded Details - Responsive for all screens */}
                  {/* {expandedPlayer === player.user_id && (
                    <div className="px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-3 md:py-4 border-t border-gray-100 bg-gray-50/30">
                      <h4 className="font-medium text-forestGreen mb-2 sm:mb-2 md:mb-3 text-xs sm:text-xs md:text-sm">Recent Activities</h4>
                      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-2 md:gap-3">
                        {player.activities.slice(0, window.innerWidth < 768 ? 2 : 3).map((activity, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-2 sm:p-2 md:p-3 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between">
                            <div className="flex-1 min-w-0 mb-1 sm:mb-0">
                              <span className={`text-[9px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-1.5 md:px-2 py-0.5 rounded-full mb-1 inline-block ${activity.status === 'completed' ? 'bg-green-100 text-green-700' :
                                activity.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                {activity.status}
                              </span>
                              <div className="text-[10px] sm:text-[10px] md:text-xs text-gray-400 truncate">
                                {new Date(activity.submitted_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                            <span className="font-bold text-primary text-xs sm:text-xs md:text-sm">+{activity.score} pts</span>
                          </div>
                        ))}
                      </div>
                      {player.activities.length > (window.innerWidth < 768 ? 2 : 3) && (
                        <div className="text-center mt-2 sm:mt-2">
                          <span className="text-xs text-gray-400">
                            +{player.activities.length - (window.innerWidth < 768 ? 2 : 3)} more activities
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  */}
                </div>
              ))
            ) : (
              <div className="py-10 sm:py-12 md:py-16 text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-3 md:mb-4">
                  <Trophy className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-300" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1 text-sm sm:text-sm md:text-base">No Results</h3>
                <p className="text-gray-500 text-xs sm:text-xs md:text-sm max-w-xs mx-auto px-4">
                  Be the first to join the leaderboard!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination Controls - Tablet Optimized */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-t border-gray-200 pt-4 sm:pt-4 md:pt-6">
            <div className="text-xs sm:text-xs md:text-sm text-gray-500 order-2 sm:order-1">
              Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center gap-1 sm:gap-1 md:gap-1.5 order-1 sm:order-2 mb-3 sm:mb-0">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-1.5 sm:p-1.5 md:p-2 rounded-lg border transition-colors ${currentPage === 1
                  ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
              </button>

              <div className="flex items-center gap-0.5 sm:gap-0.5 md:gap-1">
                {getPageNumbers().map((page, index) => (
                  <button
                    key={index}
                    onClick={() => typeof page === 'number' ? handlePageChange(page) : null}
                    disabled={page === '...'}
                    className={`min-w-[32px] sm:min-w-[32px] md:min-w-[36px] lg:min-w-[40px] h-8 sm:h-8 md:h-9 lg:h-10 flex items-center justify-center rounded-lg border text-xs sm:text-xs md:text-sm font-medium transition-colors ${page === currentPage
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : page === '...'
                        ? 'bg-transparent text-gray-400 border-transparent cursor-default'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                      }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-1.5 sm:p-1.5 md:p-2 rounded-lg border transition-colors ${currentPage === totalPages
                  ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* My Position Popup */}
      {showMyPlacePopup && currentUser && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowMyPlacePopup(false)}
        >
          <div
            className="
        bg-white w-full
        rounded-t-xl sm:rounded-xl
        max-h-[80vh] sm:max-h-[75vh]
        sm:max-w-xs md:max-w-sm lg:max-w-md
        overflow-hidden flex flex-col shadow-xl
        animate-in fade-in slide-in-from-bottom sm:zoom-in duration-200
      "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle — mobile only */}
            <div className="flex justify-center pt-2 pb-1 sm:hidden flex-shrink-0">
              <div className="w-8 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-sand/30 flex-shrink-0">
              <h2 className="text-sm sm:text-base font-semibold text-forestGreen">
                Your Position
              </h2>
              <button
                onClick={() => setShowMyPlacePopup(false)}
                className="text-gray-400 p-1 rounded-full hover:bg-gray-100 active:scale-95 transition-transform"
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 overscroll-contain">
              <div className="p-4 text-center">

                {/* Avatar */}
                <div className="
                  w-14 h-14 sm:w-16 sm:h-16
                  bg-gray-50 rounded-full flex items-center justify-center
                  mb-2.5 mx-auto border-2 border-white shadow-md relative
                ">
                  {currentUser.profile_image ? (
                    <img
                      src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${currentUser.profile_image || "/placeholder.png"}`}
                      alt={currentUser.full_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-sand flex items-center justify-center text-gray-500 text-base sm:text-lg font-bold">
                      {currentUser.full_name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                    {getRankIcon(currentUser.user_rank)}
                  </div>
                </div>

                {/* Name & rank */}
                <h3 className="text-gray-900 font-semibold text-sm truncate px-2">
                  {currentUser.username}
                </h3>
                <p className="text-gray-400 text-xs mb-3">
                  Rank #{currentUser.user_rank}
                </p>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-sand/50 rounded-lg p-2.5 border border-gray-100">
                    <div className="text-lg sm:text-xl font-bold text-primary mb-0.5">
                      {currentUser.total_score}
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                      Total Score
                    </div>
                  </div>
                  <div className="bg-sand/50 rounded-lg p-2.5 border border-gray-100">
                    <div className="text-lg sm:text-xl font-bold text-gray-900 mb-0.5">
                      {currentUser.activities.length}
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                      Activities
                    </div>
                  </div>
                </div>

                {/* Recent Activities */}
                {/* {currentUser.activities.length > 0 && (
                  <div className="mt-2.5 border-t border-gray-100 pt-2.5 text-left">
                    <h4 className="font-medium text-forestGreen mb-2 text-xs">
                      Recent Activities
                    </h4>
                    <div className="space-y-1.5 max-h-36 sm:max-h-44 overflow-y-auto pr-0.5 overscroll-contain">
                      {currentUser.activities.slice(0, 3).map((activity, idx) => (
                        <div
                          key={idx}
                          className="bg-white rounded-lg p-2 border border-gray-100 shadow-sm flex justify-between items-center gap-2"
                        >
                          <div className="min-w-0">
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full inline-block ${activity.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                              }`}>
                              {activity.status}
                            </span>
                            <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                              {new Date(activity.submitted_at).toLocaleDateString()}
                            </div>
                          </div>
                          <span className="font-bold text-primary text-xs flex-shrink-0">
                            +{activity.score} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )} */}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-2.5 text-center border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => setShowMyPlacePopup(false)}
                className="text-xs font-medium text-gray-400 hover:text-gray-600 px-4 py-1.5 rounded-lg hover:bg-gray-100 active:scale-95 transition-transform w-full sm:w-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
