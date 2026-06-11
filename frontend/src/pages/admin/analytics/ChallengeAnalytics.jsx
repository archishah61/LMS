/* eslint-disable react/no-unknown-property */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Trophy,
  Users,
  Clock,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowLeft,
  Info,
  AlertTriangle,
  ChevronRight,
  Award,
  Star,
  User,
  Check,
  Activity,
} from "lucide-react";
import {
  useGetCompletionStatsAcrossAllChallengesQuery,
  useGetUserLearningOverviewQuery,
  useGetAttemptsRequiredToCompleteChallengesQuery,
  useGetContestOverviewStatsQuery,
  useGetContestAttemptAnalyticsQuery,
} from "../../../services/Reporting/challengeAnalyticsApi";
import { getAdminToken } from "../../../services/CookieService";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";

import { motion } from "framer-motion";
import { useGetLeaderboardQuery } from "../../../services/Contest/userContestAPI";
import LeaderboardModal from "./LeaderboardModal";
import AdminLoader from "../../../components/admin/AdminLoader";

const ContestStateCard = ({ contest }) => {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [timeFilter, setTimeFilter] = useState("daily"); // Default to daily

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "from-green-500 to-emerald-600";
      case "draft":
        return "from-yellow-500 to-orange-600";
      case "ended":
        return "from-gray-500 to-slate-600";
      case "cancelled":
        return "from-red-500 to-rose-600";
      default:
        return "from-gray-500 to-slate-600";
    }
  };

  // Get access token from your store/context
  const access_token = localStorage.getItem("access_token"); // Update based on your auth implementation
  const role = localStorage.getItem("role"); // Update based on your auth implementation
  const userId = localStorage.getItem("user_id"); // Update based on your auth implementation

  const { data: leaderboardData, isLoading, refetch } = useGetLeaderboardQuery({
    access_token,
    time_filter: timeFilter,
    limit: 10,
    offset: 0,
    contest_id: contest.contest_id,
    user_id: role === "user" ? userId : 0,
  });

  const handleOpenLeaderboard = () => {
    setShowLeaderboard(true);
    refetch(); // Fetch fresh data when opening
  };

  return (
    <>
      <motion.div
        whileHover={{
          y: -5,
          boxShadow:
            "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
        }}
        className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 transition-all duration-300"
      >
        {/* HEADER */}
        <div
          className={`bg-gradient-to-r ${getStatusColor(
            contest.contest_status
          )} p-4 relative`}
        >
          {/* Banner Background */}
          {contest.banner_url && (
            <div className="absolute inset-0 opacity-20">
              <img
                src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${contest.banner_url}`}
                alt={contest.contest_name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="relative z-10">
            {/* Status and Top Rankers Button */}
            <div className="flex justify-between items-start">
              <div className="bg-white/20 backdrop-blur-md rounded-lg px-3 py-1 text-xs font-medium text-white inline-block">
                {contest.contest_status.toUpperCase()}
              </div>

              {/* Top Rankers Button */}
              <button
                onClick={handleOpenLeaderboard}
                className="bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all rounded-lg px-3 py-1 text-xs font-medium text-white inline-flex items-center gap-1"
              >
                <Trophy size={14} />
                Top Rankers
              </button>
            </div>

            {/* Title */}
            <h3
              className="text-xl font-bold text-white mt-2 line-clamp-2 min-h-[56px]"
              title={contest.contest_name}
            >
              {contest.contest_name}
            </h3>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-1">
            {/* Participants */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center text-gray-500 text-xs mb-1">
                <Users size={16} className="mr-1" />
                Participants
              </div>
              <p className="text-base font-bold text-gray-800">
                {contest.total_participants || 0}
              </p>
            </div>

            {/* Completion Rate */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center text-gray-500 text-xs mb-1">
                <TrendingUp size={16} className="mr-1" />
                Completion
              </div>
              <p className="text-base font-bold text-gray-800">
                {contest.completion_rate ? `${contest.completion_rate}%` : "NA"}
              </p>
            </div>

            {/* Avg Score */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center text-gray-500 text-xs mb-1">
                <Award size={16} className="mr-1" />
                Avg Score
              </div>
              <p className="text-base font-bold text-gray-800">
                {contest.avg_score || 0}
              </p>
            </div>

            {/* Drop-off Rate */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center text-gray-500 text-xs mb-1">
                <Activity size={16} className="mr-1" />
                Drop-off
              </div>
              <p className="text-base font-bold text-red-500">
                {contest.drop_off_rate ? `${contest.drop_off_rate}%` : "NA"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        contest={contest}
        leaderboardData={leaderboardData}
        isLoading={isLoading}
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        onRefetch={refetch}
      />
    </>
  );
};

const ChallengeAnalytics = () => {
  const [timeRange, setTimeRange] = useState("month");
  const [challengeType, setChallengeType] = useState("all");
  const { access_token } = getAdminToken();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [animateContent, setAnimateContent] = useState(false);
  const [animateHeader, setAnimateHeader] = useState(false);
  const navigate = useNavigate();
  const { id } = useSelector((state) => state.user);

  useEffect(() => {
    window.scrollTo(0, 0);

    // if (!id) {
    //   navigate("/dashboard");
    // }

    // Initial loading state
    setTimeout(() => {
      setIsInitialLoading(false);
      // Start header animation
      setTimeout(() => setAnimateHeader(true), 100);
      // Start content animation
      setTimeout(() => setAnimateContent(true), 300);
    }, 500);
  }, [id, navigate]);

  const {
    data: contestStats,
    isLoading: loadingContest,
    error: errorContest,
  } = useGetContestOverviewStatsQuery({ access_token });

  const {
    data: contestAttemptsData,
    isLoading: loadingContestAttempts,
    error: errorContestAttempts,
  } = useGetContestAttemptAnalyticsQuery({ access_token })

  // Fetch different challenge analytics data
  const {
    data: completionStats,
    isLoading: loadingCompletion,
    error: errorCompletion
  } = useGetCompletionStatsAcrossAllChallengesQuery({ access_token, type: challengeType });
  const {
    data: learningOverview,
    isLoading: loadingOverview,
    error: errorOverview,
  } = useGetUserLearningOverviewQuery({ access_token });

  const {
    data: attemptsStats,
    isLoading: loadingAttempts,
    error: errorAttempts,
  } = useGetAttemptsRequiredToCompleteChallengesQuery({ access_token });

  const isLoading =
    loadingCompletion || loadingOverview || loadingAttempts || isInitialLoading;
  const error = errorCompletion || errorOverview || errorAttempts;

  // Calculate summary metrics
  const totalChallenges = completionStats?.data?.length || 0;
  const totalParticipants = learningOverview?.data?.length || 0;
  const avgCompletionRate =
    completionStats?.data?.reduce(
      (acc, curr) => acc + curr.completion_rate,
      0
    ) / totalChallenges || 0;

  const avgAttempts = attemptsStats?.data?.length
    ? attemptsStats.data.reduce(
      (acc, curr) => acc + Number(curr.average_attempts || 0),
      0
    ) / attemptsStats.data.length
    : 0;

  const COLORS = [
    "#4F46E5",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];

  // Add helper function for safe number formatting
  const formatNumber = (value, decimals = 1) => {
    if (value === null || value === undefined) return "0";
    return Number(value).toFixed(decimals);
  };

  if (isLoading) {
    return <AdminLoader className="h-screen" message="Analyzing challenge data..." />;
  }

  if (error) {
    return (
      <div className="p-6 max-w-full mx-10 bg-white min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600 shadow-lg max-w-3xl mx-auto">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Error Loading Data
          </h2>
          <p>{error.message || "Failed to load challenge analytics"}</p>
          <button
            className="mt-4 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen lg:w-[calc(100vw-80px)] bg-white">
      {/* Header */}
      <div className="bg-white border-b pl-0 md:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full p-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 mx-2">
              <h1 className="text-xl text-center md:text-start md:text-2xl font-bold  text-forestGreen">
                Challenge Analytics
              </h1>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="flex items-center gap-2 sm:px-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Back</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-8xl mx-auto space-y-4 sm:space-y-6">
          {/* Summary Cards - 1 per row on mobile, 4 on lg+ */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-500 ease-out ${animateContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
            style={{ transitionDelay: "100ms" }}
          >
            {/* Total Challenges */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border border-indigo-100 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Challenges</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{totalChallenges || 0}</h3>
                </div>
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <Trophy className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">Active challenges in the system</div>
            </div>

            {/* Total Participants */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border border-leafGreen/20 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Participants</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{totalParticipants || 0}</h3>
                </div>
                <div className="bg-lightGreen p-2 rounded-lg">
                  <Users className="w-6 h-6 text-leafGreen" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">Active users in challenges</div>
            </div>

            {/* Average Completion Rate */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border border-green-100 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Avg. Completion Rate</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{formatNumber(avgCompletionRate)}%</h3>
                </div>
                <div className="bg-green-100 p-2 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">Average challenge completion rate</div>
            </div>

            {/* Average Attempts */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border border-yellow-100 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Avg. Attempts</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{formatNumber(avgAttempts)}</h3>
                </div>
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">Average attempts to complete challenge</div>
            </div>
          </div>

          {/* Main Grid: Stacked on mobile, side-by-side on lg+ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left: Challenge Performance (Full width on mobile) */}
            <div
              className={`lg:col-span-2 transition-all duration-500 ease-out ${animateContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
              style={{ transitionDelay: "200ms" }}
            >
              <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  {/* Left Side - Title */}
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-leafGreen" />
                    Challenge Performance
                  </h2>

                  {/* Right Side - Dropdown */}
                  <select
                    value={challengeType}
                    onChange={(e) => setChallengeType(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-leafGreen"
                  >
                    <option value="all">All</option>
                    <option value="contest">Contest</option>
                    <option value="daily_challenge">Daily Challenge</option>
                    <option value="challenge_quest">Challenge Quest</option>
                  </select>
                </div>

                {/* Bar Chart - Responsive Height */}
                <div className="h-[300px] sm:h-[400px] lg:h-[500px]">
                  {completionStats?.data?.filter(c => c.completion_rate > 0)?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={completionStats.data.filter(c => c.completion_rate > 0)}
                        margin={{ top: 5, right: 5, left: 5, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="challenge_name"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          interval={0}
                          tick={{ fontSize: 12 }}
                          tickFormatter={(v) => v.length > 15 ? `${v.slice(0, 12)}...` : v}
                        />
                        <YAxis width={30} />
                        <Tooltip />
                        <Bar dataKey="completion_rate" fill="#58cb9b" radius={[4, 4, 0, 0]}>
                          <LabelList
                            dataKey="completion_rate"
                            position="top"
                            formatter={(v) => `${formatNumber(v)}%`}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <Trophy className="w-12 h-12 mb-2" />
                      <p>No challenges available</p>
                    </div>
                  )}
                </div>

                {/* Table - Horizontal Scroll on Mobile */}
                <div className="mt-6 sm:mx-0">
                  <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                      <div className="h-[300px] overflow-y-auto custom-scrollbar">
                        <table className="min-w-full bg-white">
                          <thead className="bg-lightGreen sticky top-0 z-10">
                            <tr>
                              <th className="sm:px-4 p-3 text-left text-xs font-medium text-forestGreen uppercase tracking-wider">Challenge</th>
                              <th className="sm:px-4 p-3 text-left text-xs font-medium text-forestGreen uppercase tracking-wider">Completed<span className="hidden sm:inline"> Users</span></th>
                              <th className="sm:px-4 p-3 text-left text-xs font-medium text-forestGreen uppercase tracking-wider">Total<span className="hidden sm:inline"> Users</span></th>
                              <th className="sm:px-4 p-3 text-left text-xs font-medium text-forestGreen uppercase tracking-wider hidden sm:block">Completion Rate</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {completionStats?.data?.filter(c => c.completion_rate > 0).map((challenge) => (
                              <tr key={`${challenge.challenge_id}-${challenge.challenge_name}`} className="hover:bg-indigo-50 transition-colors">
                                <td className="sm:px-4 p-3">
                                  <div className="flex items-center">
                                    <div className="hidden sm:inline-flex w-8 h-8 rounded-full  from-indigo-500  flex items-center justify-center text-white font-bold text-sm mr-3">
                                      {challenge.challenge_name?.[0] || "?"}
                                    </div>
                                    <span className="text-sm font-medium text-gray-800 truncate max-w-[100px] sm:max-w-none">
                                      {challenge.challenge_name || "Unnamed"}
                                    </span>
                                  </div>
                                </td>
                                <td className="sm:px-4 p-3 text-sm text-gray-600">{challenge.completed_users || 0}</td>
                                <td className="sm:px-4 p-3 text-sm text-gray-600">{challenge.total_users || 0}</td>
                                <td className="sm:px-4 p-3 hidden sm:block">
                                  <div className="flex items-center">
                                    <span className="text-sm font-medium text-leafGreen">
                                      {formatNumber(challenge.completion_rate)}%
                                    </span>
                                    <div className="ml-2 w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-[#58cb9b] rounded-full"
                                        style={{ width: `${challenge.completion_rate}%` }}
                                      />
                                    </div>
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
              </div>
            </div>

            {/* Right: User Performance - Full width on mobile */}
            <div
              className={`transition-all duration-500 ease-out ${animateContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
              style={{ transitionDelay: "300ms" }}
            >
              <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100 h-full min-h-[600px] lg:h-[917px]">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-leafGreen" /> Users Performance
                </h2>
                <div className="space-y-3 h-full max-h-[800px] overflow-y-auto custom-scrollbar">
                  {(learningOverview?.data || []).length > 0 ? (
                    learningOverview.data.slice(0, 10).map((user, index) => (
                      <div key={user.user_id} className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-lightGreen transition-colors">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-lightGreen text-leafGreen font-semibold text-sm mr-4">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">{user.user_name || "Anonymous User"}</h3>
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-leafGreen" />
                              <span className="text-sm text-gray-500">
                                {user.total_challenges_completed || 0} / {user.total_challenges_attempted || 0} quest completed
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-leafGreen" />
                              <span className="text-sm text-gray-500">
                                {user.total_daily_challenges_completed || 0} / {user.total_daily_challenges_attempted || 0} completed
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm text-gray-500">{(user.total_points_earned || 0) + (user.daily_challenge_points_earned || 0)} points</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-green-400" />
                              <span className="text-sm text-gray-500">
                                {formatNumber(user.average_progress_percentage)}% progress
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <User className="w-12 h-12 mb-2" />
                      No user data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Attempts Table - Full Width */}
          <div className="mt-6">
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-leafGreen" /> Challenge Attempts
              </h2>
              <div className="sm:overflow-x-auto sm:mx-6 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="h-[500px] overflow-y-auto custom-scrollbar">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="sm:px-6 sm:p-3 p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Challenge</th>
                          <th className="sm:px-6 sm:p-3 p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:block">Average<span className="hidden sm:inline"> Attempts</span></th>
                          <th className="sm:px-6 sm:p-3 p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="sm:px-6 sm:p-3 p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="sm:px-6 sm:p-3 p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(attemptsStats?.data || []).length > 0 ? (
                          attemptsStats.data.map((challenge) => (
                            <tr key={challenge.challenge_id} className="hover:bg-indigo-50/50 transition-colors">
                              <td className="sm:px-6 sm:p-3 p-2">
                                <div className="flex items-center">
                                  <div className="hidden sm:inline-flex w-10 h-10 rounded-full  from-indigo-500 to-purple-500 flex items-center justify-center shadow-sm">
                                    <Clock className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {challenge.challenge_name || "Unnamed Challenge"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="sm:px-6 sm:p-3 p-2 hidden sm:block">
                                <div className="text-sm text-gray-900 font-medium">
                                  {formatNumber(challenge.average_attempts)}
                                </div>
                              </td>
                              <td className="sm:px-6 sm:p-3 p-2">
                                <span
                                  className={`px-3 py-1 inline-flex whitespace-nowrap text-xs leading-5 font-semibold rounded-full ${challenge.challenge_type == "daily_challenge"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                    }`}
                                >
                                  {challenge.challenge_type == "daily_challenge" ? "Daily Challenge" : "Challenge Quest"}
                                </span>
                              </td>
                              <td className="sm:px-6 sm:p-3 p-2">
                                <span
                                  className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${challenge.average_attempts <= 3
                                    ? "bg-green-100 text-green-800"
                                    : challenge.average_attempts <= 5
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                    }`}
                                >
                                  {challenge.average_attempts <= 3 ? "Easy" : challenge.average_attempts <= 5 ? "Moderate" : "Challenging"}
                                </span>
                              </td>
                              <td className="sm:px-6 sm:p-3 p-2">
                                <div className="sm:hidden relative ml-2 flex items-center">
                                  <div className="group relative flex items-center justify-center">
                                    <Info
                                      size={18}
                                      className="text-forestGreen hover:text-forestGreen cursor-pointer transition-colors duration-200"
                                    />

                                    <div
                                      className="absolute top-1/2 right-full mt-1 -translate-y-2 z-50 w-64 max-w-[50vw]
                                           bg-lightGreen text-gray-700 text-sm 
                                          rounded-lg shadow-md p-3 opacity-0 scale-95 
                                          group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none"
                                    >
                                      <p>
                                        Users typically need{" "}
                                        <span className="font-medium text-indigo-600">
                                          {formatNumber(challenge.average_attempts)}
                                        </span>{" "}
                                        attempts to complete this challenge
                                      </p>
                                    </div>
                                  </div>
                                </div>


                                <div className="hidden sm:block text-sm text-gray-600 max-w-md">
                                  <div className="flex items-start gap-2">
                                    <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                                    <p>
                                      Users typically need{" "}
                                      <span className="font-medium text-indigo-600">
                                        {formatNumber(challenge.average_attempts)}
                                      </span>{" "}
                                      attempts to complete this challenge
                                    </p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                              No challenge attempts data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto pb-4 scrollbar-hide">
            {contestStats?.data?.length > 0 ? (
              <div
                className="flex gap-4 min-w-full"
                style={{ display: "flex", flexWrap: "nowrap" }}
              >
                {contestStats?.data?.map((contest, index) => (
                  <div
                    className="w-[300px] flex-shrink-0"
                    key={contest.contest_id}
                  >
                    <ContestStateCard contest={contest} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full text-gray-500">
                <PieChart className="w-12 h-12 mb-2" />
                <p>No Contest data available</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-leafGreen" /> Contest Attempts
              </h2>
              <div className="sm:overflow-x-auto sm:mx-6 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="h-[500px] overflow-y-auto custom-scrollbar">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-lightGreen sticky top-0 z-10">
                        <tr>
                          <th className="sm:px-6 sm:p-3 p-2 text-left text-xs font-medium text-forestGreen uppercase tracking-wider">
                            Contest Quiz/Coding
                          </th>
                          <th className="sm:px-6 sm:p-3 p-2 text-left text-xs font-medium text-forestGreen uppercase tracking-wider hidden sm:table-cell">
                            Avg Attempts
                          </th>
                          <th className="sm:px-6 sm:p-3 p-2 text-left text-xs font-medium text-forestGreen uppercase tracking-wider">
                            Type
                          </th>
                          <th className="sm:px-6 sm:p-3 p-2 text-left text-xs font-medium text-forestGreen uppercase tracking-wider">
                            Completion %
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {!loadingContestAttempts && contestAttemptsData?.data?.length > 0 ? (
                          contestAttemptsData.data.map((item) => (
                            <tr key={item.item_id} className="hover:bg-indigo-50/50 transition-colors">
                              <td className="sm:px-6 sm:p-3 p-2">
                                <div className="flex items-center">
                                  <div className="hidden sm:inline-flex w-10 h-10 rounded-full bg-leafGreen items-center justify-center shadow-sm">
                                    <Clock className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="sm:px-6 sm:p-3 p-2 hidden sm:table-cell">
                                <div className="text-sm text-gray-900 font-medium">
                                  {item.avg_attempts_per_user}
                                </div>
                              </td>
                              <td className="sm:px-6 sm:p-3 p-2">
                                <span
                                  className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${item.type == "quiz"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                    }`}
                                >
                                  {item.type}
                                </span>
                              </td>
                              <td className="sm:px-6 sm:p-3 p-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                      className="bg-[#58cb9b] h-2.5 rounded-full transition-all duration-300"
                                      style={{ width: `${item.completion_percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium text-leafGreen min-w-[45px]">
                                    {item.completion_percentage}%
                                  </span>
                                </div>

                                {/* Mobile view: Show avg attempts in tooltip */}
                                <div className="sm:hidden relative mt-2 flex items-center">
                                  <div className="group relative flex items-center justify-center">
                                    <Info
                                      size={18}
                                      className="text-blue-500 hover:text-blue-700 cursor-pointer transition-colors duration-200"
                                    />
                                    <div
                                      className="absolute top-1/2 right-full mt-1 -translate-y-2 z-50 w-64 max-w-[50vw]
                              bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-700 text-sm 
                              rounded-lg shadow-md p-3 opacity-0 scale-95 
                              group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none"
                                    >
                                      <p>
                                        Users typically need{" "}
                                        <span className="font-medium text-indigo-600">
                                          {item.avg_attempts_per_user}
                                        </span>{" "}
                                        attempts to complete
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : loadingContestAttempts ? (
                          <tr>
                            <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                              Loading contest attempts data...
                            </td>
                          </tr>
                        ) : (
                          <tr>
                            <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                              No contest attempts data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Custom Scrollbar */}
      <style jsx>{`
      .custom-scrollbar {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .custom-scrollbar::-webkit-scrollbar {
        display: none;
      }
    `}</style>
    </div>
  );
};

export default ChallengeAnalytics;
