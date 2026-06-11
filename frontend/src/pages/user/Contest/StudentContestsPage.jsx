"use client"

import { useState, useEffect } from "react"
import { Users, Clock, Trophy, Calendar, ArrowRight, Star, Menu, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useGetActiveTemplatesQuery } from "../../../services/Contest/contestTemplateAPI"
import { useGetActiveContestsQuery } from "../../../services/Contest/contestAPI"
import { slugify } from "../../../utils/slugify"
import { useGetUserAllEnrollmentQuery } from "../../../services/Contest/userContestAPI"
import { getStudentToken } from "../../../services/CookieService"
import { useGetFeatureStatusByNameQuery } from "../../../services/Masters/featureStatusAPI"
import ComingSoonModal2 from "../../../components/modal/ComingSoonModal2"
import PrimaryLoader from "../../../components/ui/PrimaryLoader"

export default function StudentContestsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("all")
  const [filteredContests, setFilteredContests] = useState([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedMobileTab, setSelectedMobileTab] = useState("all")

  const { access_token } = getStudentToken();

  const { data: templatesData, isLoading: templatesLoading, error: templatesError } = useGetActiveTemplatesQuery()
  const { data: contestsData, isLoading: contestsLoading, error: contestsError } = useGetActiveContestsQuery()
  const { data: enrolledContestsData, isLoading: enrolledContestsLoading, error: enrolledContestsError } =
    useGetUserAllEnrollmentQuery(
      { access_token },
      { skip: !access_token }
    )

  const { data: featureData, isLoading: featureDataLoading, error: featureDataError } =
    useGetFeatureStatusByNameQuery(
      { name: "contest" }
    )

  const templates = templatesData?.success ? templatesData.data : []
  const contests = contestsData?.success ? contestsData.data : []
  const enrolledContests = enrolledContestsData?.success ? enrolledContestsData.data : []

  useEffect(() => {
    if (activeTab === "all") {
      setFilteredContests(contests)
    } else if (activeTab === "enrolled") {
      setFilteredContests(enrolledContests)
    } else if (activeTab === "completed") {
      setFilteredContests(enrolledContests.filter((contest) => contest.is_completed))
    } else {
      const statusMap = {
        live: "active",
        upcoming: "upcoming",
        ended: "ended",
      }
      const apiStatus = statusMap[activeTab] || activeTab
      setFilteredContests(contests.filter((contest) => getContestStatus(contest) === apiStatus))
    }
  }, [activeTab, contests])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatDisplayTime = (timeString) => {
    if (timeString === "00:00:00:00") return "LIVE NOW!"

    const [days, hours, minutes, seconds] = timeString.split(':').map(Number)

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else {
      return `${minutes}m ${seconds}s`
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDateMobile = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const getContestStatus = (contest) => {
    const now = new Date().getTime()
    const startTime = new Date(contest?.start_time).getTime()
    const endTime = new Date(contest?.end_time).getTime()

    if (now < startTime) return "upcoming"
    if (now >= startTime && now < endTime) return "active"
    return "ended"
  }

  const handleContestClick = (contest) => {
    const contestTitle = contest.title || contest.name || "contest"
    navigate(`/contests/${slugify(contestTitle)}`, {
      state: { id: contest.id },
    })
  }

  const handleTemplateClick = (template) => {
    navigate(`/template/${slugify(template.title)}/contests`, {
      state: { template },
    })
  }

  const getNextContestTime = (template) => {
    const { created_at, recurrence_pattern, recurrence_interval, recurrence_days_of_week } = template;
    const createdAt = new Date(created_at);
    const now = new Date();

    if (!recurrence_pattern) {
      return null;
    }

    let nextDate = new Date(createdAt);

    const daysMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    if (createdAt > now) {
      return createdAt.toISOString();
    }

    if (recurrence_pattern === "day") {
      const daysSinceStart = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
      const occurrences = Math.floor(daysSinceStart / recurrence_interval);
      nextDate.setDate(createdAt.getDate() + (occurrences + 1) * recurrence_interval);

      while (nextDate <= now) {
        nextDate.setDate(nextDate.getDate() + recurrence_interval);
      }
      return nextDate.toISOString();
    }

    if (recurrence_pattern === "week") {
      const targetDays = (recurrence_days_of_week || []).map(day => daysMap[day]).sort((a, b) => a - b);

      if (targetDays.length === 0) {
        targetDays.push(createdAt.getDay());
      }

      let currentDate = new Date(createdAt);

      while (true) {
        for (let day of targetDays) {
          const candidate = new Date(currentDate);
          const daysToAdd = (day - candidate.getDay() + 7) % 7;
          candidate.setDate(candidate.getDate() + daysToAdd);

          if (candidate > now) {
            return candidate.toISOString();
          }
        }

        currentDate.setDate(currentDate.getDate() + 7 * recurrence_interval);
      }
    }

    if (recurrence_pattern === "month") {
      nextDate = new Date(createdAt);
      while (nextDate <= now) {
        nextDate.setMonth(nextDate.getMonth() + recurrence_interval);
      }
      return nextDate.toISOString();
    }

    if (recurrence_pattern === "year") {
      nextDate = new Date(createdAt);
      while (nextDate <= now) {
        nextDate.setFullYear(nextDate.getFullYear() + recurrence_interval);
      }
      return nextDate.toISOString();
    }

    return null;
  };

  const getTemplateType = (template) => {
    const t = (template?.type || template?.template_type || template?.contest_type || template?.category || "")
      ?.toString()
      .toLowerCase()
    return t
  }

  const getNextOccurrenceISO = (template) => {
    return (
      template?.next_occurrence_at ||
      template?.next_occurrence ||
      template?.next_start_time ||
      template?.start_time ||
      getNextContestTime(template)
    );
  };

  const getTemplateTimeRemaining = (dateString) => {
    const now = currentTime
    const target = new Date(dateString)
    const diff = target.getTime() - now.getTime()

    if (diff <= 0) return "00:00:00:00"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return `${days.toString().padStart(2, "0")}:${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const getTemplateTimerLabel = (template) => {
    const t = getTemplateType(template)

    if (["on_demand", "on-demand", "ondemand", "demand", "ndemand"].some((k) => t.includes(k))) {
      return "On Demand"
    }

    if (t.includes("recurring") || template.recurrence_pattern) {
      const nextOccurrence = getNextOccurrenceISO(template)
      if (nextOccurrence) {
        const timeRemaining = getTemplateTimeRemaining(nextOccurrence)
        return formatDisplayTime(timeRemaining)
      }
      return "Starts Soon"
    }

    const next = getNextOccurrenceISO(template)
    return next ? formatDisplayTime(getTemplateTimeRemaining(next)) : "Schedule TBD"
  }

  // Show coming soon page if feature is not active
  if (featureData?.is_active === 0) {
    return <ComingSoonModal2 featureData={featureData} />;
  }

  if (templatesLoading || contestsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <PrimaryLoader />
      </div>
    )
  }

  if (templatesError || contestsError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 p-6 rounded-xl mb-6">
            <p className="text-red-800 text-lg font-medium">Error loading contests</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium"
          >
            Retry Loading
          </button>
        </div>
      </div>
    )
  }

  const handleShowLeaderboard = async () => {
    navigate(`/contests/global/leaderboard`)
  }

  const handleMobileTabSelect = (tab) => {
    setSelectedMobileTab(tab)
    setActiveTab(tab)
    setIsMobileMenuOpen(false)
  }

  const hasTemplates = templates && templates.length > 0
  const hasFeaturedContests = contests && contests.length > 0 && contests.some(c => Number.isFinite(c?.max_participants) && c.max_participants > 0)
  const hasContests = contests && contests.length > 0

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header Section - Responsive */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 mb-8 md:mb-12">
          <div className="w-full md:w-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-forestGreen mb-1 md:mb-2">Contest Hub</h1>
            <p className="text-black text-sm md:text-base">Discover challenges, compete globally, and showcase your skills</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="text-right hidden md:block">
              <p className="text-sm text-gray-500 font-medium">Ready to compete?</p>
              <p className="text-md text-gray-500">View rankings and achievements</p>
            </div>
            <button
              onClick={() => handleShowLeaderboard()}
              className="flex items-center justify-center gap-2 bg-forestGreen text-white px-4 md:px-6 py-2 rounded-lg transition-all duration-300 font-medium text-sm md:text-base w-full sm:w-auto shadow-sm"
            >
              <Trophy size={16} />
              <span>Global Leaderboard</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Section - Responsive Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
          {/* Active Contests */}
          <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4 md:gap-6 lg:gap-10 relative overflow-hidden group">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-12 md:h-16 w-1 bg-purple-500 rounded-r-full"></div>
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 ml-3 md:ml-4">
              <Clock className="w-5 h-5 md:w-7 md:h-7 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-black text-xs md:text-sm font-medium mb-1 truncate">Active Contests</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 leading-none">
                {contests.filter(c => getContestStatus(c) === "active").length}
              </p>
            </div>
          </div>

          {/* Upcoming */}
          <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4 md:gap-6 lg:gap-10 relative overflow-hidden group">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-12 md:h-16 w-1 bg-red-500 rounded-r-full"></div>
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 ml-3 md:ml-4">
              <Calendar className="w-5 h-5 md:w-7 md:h-7 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-black text-xs md:text-sm font-medium mb-1 truncate">Upcoming</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 leading-none">
                {contests.filter(c => getContestStatus(c) === "upcoming").length}
              </p>
            </div>
          </div>

          {/* Total Participants */}
          <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4 md:gap-6 lg:gap-10 relative overflow-hidden group col-span-1 xs:col-span-2 md:col-span-1">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-12 md:h-16 w-1 bg-primary rounded-r-full"></div>
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-lightGreen flex items-center justify-center flex-shrink-0 ml-3 md:ml-4">
              <Users className="w-5 h-5 md:w-7 md:h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-black text-xs md:text-sm font-medium mb-1 truncate">Total Participants</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 leading-none">
                {contests.reduce((acc, c) => acc + (c.total_participants || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Contest Templates Section */}
        {hasTemplates && (
          <section className="mb-8 md:mb-12">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-forestGreen mb-1">Contest Series</h2>
                <p className="text-black text-xs md:text-sm">Regular programming challenges and competitions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-10">
              {templates.map((template) => {
                const templateTitle = template.title
                return (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateClick(template)}
                    className="group bg-white rounded-xl border border-gray-200 p-3 md:p-4 transition-all duration-300 cursor-pointer flex flex-col"
                  >
                    <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl bg-gray-100 mb-2">
                      <img
                        src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${template.banner_url ? template.banner_url : '/assets/placeholder1.png'}`}
                        alt={templateTitle}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/assets/placeholder2.png'
                        }}
                      />
                      <div className="absolute inset-0 bg-black/5" />

                      {/* Timer Badge - Compact */}
                      <div className="absolute top-2 right-2">
                        <div className="bg-white/95 backdrop-blur-sm shadow-sm border border-black/5 flex items-center gap-1.5 rounded-md px-2 py-1">
                          <Clock className="w-3 h-3 text-primary" />
                          <span className={`text-xs font-bold tabular-nums leading-none ${getTemplateTimerLabel(template) === "LIVE NOW!" ? "text-green-700" : "text-slate-700"
                            }`}>
                            {getTemplateTimerLabel(template)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col flex-1 mt-2">
                      <h3 className="text-sm md:text-base font-bold text-black mb-1 line-clamp-2">
                        {templateTitle}
                      </h3>
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <span className="text-xs md:text-sm text-black/70 font-medium">Regular Series</span>
                        <ArrowRight className="h-4 w-4 text-black" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Featured Contests Section */}
        {hasFeaturedContests && (
          <section className="mb-8 md:mb-12">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-forestGreen mb-1">Featured Contests</h2>
                <p className="text-black text-xs md:text-sm">Spotlight challenges you shouldn't miss</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {contests
                .filter(c => Number.isFinite(c?.max_participants) && c.max_participants > 0)
                .slice(0, 2)
                .map(contest => {
                  const status = getContestStatus(contest)
                  return (
                    <div
                      key={contest.id}
                      onClick={() => handleContestClick(contest)}
                      className="group bg-white rounded-xl border border-gray-100 p-4 md:p-6 flex flex-col cursor-pointer relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between mb-3 md:mb-4">
                        <div className="p-2 md:p-3 bg-lightGreen rounded-lg">
                          <Star className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                        </div>
                        <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium ${status === 'active' ? 'bg-red-50 text-red-600' :
                          status === 'upcoming' ? 'bg-blue-50 text-blue-600' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                          {status === 'active' ? 'Live' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 line-clamp-2">{contest.title}</h3>
                      {/* <p className="text-gray-500 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">{contest.description}</p> */}
                      <div
                        className="text-gray-500 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: contest?.description }}
                      />

                      <div className="mt-auto flex items-center gap-3 md:gap-4 text-xs text-gray-500 font-medium">
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <Clock size={12} className="flex-shrink-0" />
                          <span className="truncate">
                            {status === 'active' ? 'Ends in ' + formatDisplayTime(getTemplateTimeRemaining(contest.end_time)) : formatDateMobile(contest.start_time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Users size={12} />
                          <span>{contest.total_participants || 0} enrolled</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </section>
        )}

        {/* All Contests Section */}
        {hasContests && (
          <section>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-forestGreen mb-1">All Contests</h2>
                <p className="text-black text-xs md:text-sm">Browse and join programming contests</p>
              </div>

              {/* Mobile Filter Dropdown */}
              <div className="md:hidden relative">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="flex items-center gap-2 bg-lightGreen text-forestGreen px-3 py-2 rounded-lg text-sm font-medium"
                >
                  {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
                  <span>
                    {selectedMobileTab === "all" ? "All" :
                      selectedMobileTab === "live" ? "Live" :
                        selectedMobileTab === "upcoming" ? "Upcoming" :
                          selectedMobileTab === "completed" ? "Completed" :
                            selectedMobileTab === "ended" ? "Ended" : "Enrolled"}
                  </span>
                </button>

                {isMobileMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {["all", "live", "upcoming", "ended", "enrolled", "completed"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => handleMobileTabSelect(tab)}
                        className={`w-full text-left px-4 py-3 text-sm font-medium ${selectedMobileTab === tab
                          ? "bg-forestGreen text-white"
                          : "text-gray-700 hover:bg-gray-50"
                          } ${tab !== "all" ? "border-t border-gray-100" : ""}`}
                      >
                        {tab === "all" ? "All" :
                          tab === "live" ? "Live" :
                            tab === "upcoming" ? "Upcoming" :
                              tab === "completed" ? "Completed" :
                                tab === "ended" ? "Ended" : "Enrolled"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Filter Tabs - Desktop Only */}
            <div className="hidden md:flex bg-lightGreen rounded-lg mb-6 md:mb-8 overflow-hidden w-full">
              {[
                { key: "all", label: "All" },
                { key: "live", label: "Live" },
                { key: "upcoming", label: "Upcoming" },
                { key: "ended", label: "Ended" },
                { key: "enrolled", label: "Enrolled" },
                { key: "completed", label: "Completed" }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-3 md:py-4 text-sm font-medium transition-all duration-300 relative ${activeTab === tab.key
                    ? "text-forestGreen"
                    : "text-black"
                    }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1 bg-primary rounded-t-full"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Mobile Filter Indicator */}
            <div className="md:hidden mb-4">
              <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                <span className="text-xs font-medium text-gray-600">Filter:</span>
                <span className="text-sm font-semibold text-forestGreen">
                  {selectedMobileTab === "all" ? "All" :
                    selectedMobileTab === "live" ? "Live" :
                      selectedMobileTab === "upcoming" ? "Upcoming" :
                        selectedMobileTab === "completed" ? "Completed" :
                          selectedMobileTab === "ended" ? "Ended" : "Enrolled"}
                </span>
              </div>
            </div>

            {/* Contest List - Responsive */}
            <div className="space-y-3 md:space-y-4">
              {filteredContests.map((contest) => {
                const title = contest.title || contest.name || "Contest"
                const desc = contest.description || contest.short_description || ""
                const status = getContestStatus(contest)
                return (
                  <div
                    key={contest.id}
                    className="group bg-white rounded-xl border border-gray-100 p-3 md:p-4 transition-all duration-300 cursor-pointer"
                    onClick={() => handleContestClick(contest)}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-6">
                      {/* Image - Mobile Stack, Desktop Side */}
                      <div className="w-full sm:w-24 md:w-28 h-16 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        <img
                          src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${contest?.banner_url ? contest?.banner_url : '/assets/placeholder2.png'}`}
                          alt={title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/assets/placeholder2.png'
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <h3 className="text-sm md:text-base font-bold text-gray-900 line-clamp-2 sm:line-clamp-1">
                            {title}
                          </h3>
                          {/* Status - Mobile Top Right, Desktop Side */}
                          <div className="self-start sm:self-center flex-shrink-0">
                            <div className={`px-2 md:px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${status === 'active' ? 'bg-red-50 text-red-600' :
                              status === 'ended' ? 'bg-gray-50 text-gray-600' :
                                'bg-blue-50 text-blue-600'
                              }`}>
                              <span>{status === 'active' ? 'Live' : status === 'ended' ? 'Ended' : 'Upcoming'}</span>
                              <ArrowRight size={12} className="md:hidden" />
                              <ArrowRight size={14} className="hidden md:block" />
                            </div>
                          </div>
                        </div>

                        {/* <p className="text-black text-xs mb-3 line-clamp-2 hidden sm:block">
                          {desc || "Test your coding skills with this challenge"}
                        </p> */}
                        <div
                          className="text-gray-600 text-sm mb-2 line-clamp-1"
                          dangerouslySetInnerHTML={{ __html: desc || "Test your coding skills with this challenge" }}
                        />

                        {/* Mobile Description */}
                        {/* <p className="text-black text-xs mb-3 line-clamp-2 sm:hidden">
                          {desc ? desc.substring(0, 80) + (desc.length > 80 ? "..." : "") : "Test your coding skills with this challenge"}
                        </p> */}

                        <div className="flex flex-col gap-2 text-xs text-gray-500">
                          {/* Contest Duration - Responsive */}
                          <div className="flex flex-wrap gap-y-1.5 gap-x-3">
                            <div className="flex items-center gap-1.5 min-w-0 bg-gray-50 px-2 py-1.5 rounded flex-1 sm:flex-none">
                              <Clock size={12} className="text-gray-400 flex-shrink-0" />
                              <span className="flex items-center gap-1.5 min-w-0">
                                <span className="truncate">Start: {formatDateMobile(contest.start_time)}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 min-w-0 bg-gray-50 px-2 py-1.5 rounded flex-1 sm:flex-none">
                              <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                              <span className="flex items-center gap-1.5 min-w-0">
                                <span className="truncate">End: {formatDateMobile(contest.end_time)}</span>
                              </span>
                            </div>
                          </div>

                          {/* Metadata - Stack on mobile, inline on tablet+ */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-1">
                            <div className="flex items-center gap-1.5">
                              <Users size={12} className="text-gray-400" />
                              <span>{contest.total_participants || 0} participants</span>
                            </div>
                            <div className="hidden sm:flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                              <span>{contest.category_name || "General"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Empty State - Responsive */}
        {!hasTemplates && !hasFeaturedContests && !hasContests && (
          <div className="text-center py-8 md:py-12 lg:py-20">
            <div className="bg-slate-100 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Trophy className="h-5 w-5 md:h-7 md:w-7 lg:h-8 lg:w-8 text-slate-400" />
            </div>
            <h3 className="text-base md:text-lg lg:text-xl font-semibold text-slate-900 mb-2">No Contests Available</h3>
            <p className="text-slate-600 max-w-md mx-auto text-xs md:text-sm lg:text-base px-4">
              We're preparing exciting programming contests for you. Check back soon for new challenges and competitions!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}