/* eslint-disable react/no-unknown-property */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Clock,
  BookOpen,
  Trophy,
  IndianRupee,
  Users,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { useSelector } from "react-redux";
import { useGetTopEnrolledCoursesQuery } from "../../../services/Reporting/coursePerformanceAnalyticsApi";
import { useGetRecentEnrollmentsQuery } from "../../../services/Reporting/userEngagementAnalyticsApi";
import {
  useGetTodaysRevenueQuery,
  useGetThisWeeksRevenueQuery,
  useGetMonthlyRevenueQuery,
  useGetYearlyRevenueQuery,
  useGetOverallRevenueQuery,
} from "../../../services/Reporting/revenueFinanceAnalyticsApi";
import { useGetPartnerByIdQuery } from '../../../services/Become_partner/becomePartnerApi';
import { getAdminToken } from "../../../services/CookieService";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import RevenueAnalytics from "../../../components/admin/Analytics/RevenueAnalyticsGraph";
import ChangePasswordModal from "../../../components/admin/Partners/ChangePasswordModal";
import AdminLoader from "../../../components/admin/AdminLoader";

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const AnalyticsOverview = () => {
  const { access_token } = getAdminToken();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { id, role } = useSelector((state) => state.user);

  const [selectedTimePeriod, setSelectedTimePeriod] = useState("today");
  const [selectedMonth, setSelectedMonth] = useState("April");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [userType, setUserType] = useState("all");
  const [selectedPartner, setSelectedPartner] = useState("all");

  // Animation states
  const [animateHeader, setAnimateHeader] = useState(false);
  const [animateCards, setAnimateCards] = useState(false);
  const [animateCharts, setAnimateCharts] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Fetch partner data only if the role is "partner"
  const { data: partnerData, isLoading: loadingPartnerData } = useGetPartnerByIdQuery(
    { id, access_token },
    { skip: role !== "partner" }
  );

  useEffect(() => {
    if (partnerData?.mustChangePassword) {
      setShowChangePassword(true);
    }
  }, [partnerData]);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Staggered animations
    setTimeout(() => setIsLoading(false), 800);
    setTimeout(() => setAnimateHeader(true), 200);
    setTimeout(() => setAnimateCards(true), 500);
    setTimeout(() => setAnimateCharts(true), 800);
  }, [id, navigate]);

  // Queries
  const { data: courseEnrollments, isLoading: loadingEnrollments } =
    useGetTopEnrolledCoursesQuery({
      access_token,
    });

  const { data: recentEnrollmentsData, isLoading: loadingRecent } =
    useGetRecentEnrollmentsQuery({
      access_token,
    });

  // Revenue queries with conditional fetching
  const { data: todaysRevenueData, isLoading: loadingTodaysRevenue } =
    useGetTodaysRevenueQuery({
      access_token,
    });

  const { data: thisWeeksRevenueData, isLoading: loadingWeekRevenue } =
    useGetThisWeeksRevenueQuery(
      {
        access_token,
      },
      { skip: selectedTimePeriod !== "thisWeek" }
    );

  const { data: monthlyRevenueData, isLoading: loadingMonthlyRevenue } =
    useGetMonthlyRevenueQuery(
      {
        access_token,
        month: selectedMonth,
      },
      { skip: selectedTimePeriod !== "month" }
    );

  const { data: yearlyRevenueData, isLoading: loadingYearlyRevenue } =
    useGetYearlyRevenueQuery(
      {
        access_token,
        year: selectedYear,
      },
      { skip: selectedTimePeriod !== "year" }
    );

  const { data: overallRevenueData, isLoading: loadingOverallRevenue } =
    useGetOverallRevenueQuery(
      {
        access_token,
      },
      { skip: selectedTimePeriod !== "overall" }
    );

  // Get the active query based on selection
  let revenueQuery;
  let loadingRevenueData = false;

  switch (selectedTimePeriod) {
    case "today":
      revenueQuery = { data: todaysRevenueData };
      loadingRevenueData = loadingTodaysRevenue;
      break;
    case "thisWeek":
      revenueQuery = { data: thisWeeksRevenueData };
      loadingRevenueData = loadingWeekRevenue;
      break;
    case "month":
      revenueQuery = { data: monthlyRevenueData };
      loadingRevenueData = loadingMonthlyRevenue;
      break;
    case "year":
      revenueQuery = { data: yearlyRevenueData };
      loadingRevenueData = loadingYearlyRevenue;
      break;
    case "overall":
      revenueQuery = { data: overallRevenueData };
      loadingRevenueData = loadingOverallRevenue;
      break;
    default:
      revenueQuery = { data: todaysRevenueData };
      loadingRevenueData = loadingTodaysRevenue;
  }

  const isLoadingData =
    loadingEnrollments || loadingRecent || loadingRevenueData;

  const recentEnrollments = Array.isArray(recentEnrollmentsData?.data)
    ? recentEnrollmentsData?.data
    : [];

  const enrollmentChartData =
    courseEnrollments?.data?.map((course) => ({
      name: course.title,
      value: course.enrollmentCount,
    })) || [];

  if (isLoading) {
    return <AdminLoader className="h-screen" message="Loading analytics dashboard..." />;
  }

  // Filter analyticsCards based on role
  const filteredAnalyticsCards = analyticsCards.filter(card => {
    if (role === "partner") {
      return !["Challenge Analytics", "Leaderboard & Gamification", "AI Interview Analytics"].includes(card.title);
    }
    return true;
  });

  return (
    <>
      <div className="sm:p-6 p-4 max-w-full bg-white mx-auto min-h-screen">
        {showChangePassword && (
          <ChangePasswordModal
            onClose={() => setShowChangePassword(false)}
            userId={id}
            mustChangePassword={partnerData?.mustChangePassword}
          />
        )}

        <div className="pt-4 sm:pt-2">
          {/* Header */}
          <div
            className="mb-4 sm:mb-8 transition-all duration-700 ease-out transform"
            style={{
              opacity: animateHeader ? 1 : 0,
              transform: animateHeader ? "translateY(0)" : "translateY(-20px)",
            }}
          >
            <div className=" bg-leafGreen rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                    Analytics Dashboard
                  </h1>
                  <p className="text-white/80 text-sm sm:text-md">
                    Comprehensive insights into your LMS platform&apos;s performance
                  </p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <TrendingUp className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-8">
            {filteredAnalyticsCards.map((card, index) => (
              <Link
                key={index}
                to={card.link}
                className="group relative"
                style={{
                  opacity: animateCards ? 1 : 0,
                  transform: animateCards
                    ? "translateY(0)"
                    : "translateY(20px)",
                  transition: `all 0.5s ease-out ${0.1 * index}s`,
                }}
              >
                <div
                  className={`${card.color} rounded-xl shadow-md p-5 hover:shadow-lg transition-all h-[150px]`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <p className="text-xl font-bold text-gray-800">
                        {card.title}
                      </p>
                      <ArrowRight className="w-6 h-6 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    </div>
                    <div className={`${card.iconBg} p-2 rounded-lg`}>
                      {card.icon}
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500 mt-1">
                    {card.description}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {isLoadingData ? (
          <AdminLoader className="h-screen" message="Fetching data..." />
        ) : (
          <>
            {/* Two Columns: Course Enrollment Distribution and Recent Enrollments */}
            <div className="lg:pl-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 sm:mb-8">
                {/* Course Enrollment Distribution */}
                <div
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  style={{
                    opacity: animateCharts ? 1 : 0,
                    transform: animateCharts
                      ? "translateY(0)"
                      : "translateY(30px)",
                    transition: "all 0.7s ease-out 0.2s",
                  }}
                >
                  <h2 className="text-md sm:text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-leafGreen" /> Course Enrollment Distribution
                  </h2>
                  <div className="h-[300px] overflow-hidden">
                    {enrollmentChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={enrollmentChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ percent }) =>
                              `${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            innerRadius={40}
                            fill="#8884d8"
                            dataKey="value"
                            animationBegin={300}
                            animationDuration={1500}
                          >
                            {enrollmentChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                stroke="white"
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => `${value} enrollments`}
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "0.5rem",
                              padding: "0.75rem",
                              boxShadow:
                                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <BookOpen className="w-12 h-12 mb-2" />
                        <p>No enrollments in courses</p>
                      </div>
                    )}
                  </div>

                  {/* Course list with invisible scrollbar */}
                  <div className="mt-4 max-h-[150px] overflow-y-auto custom-scrollbar">
                    {enrollmentChartData.length > 0 ? (
                      enrollmentChartData.map((entry, index) => (
                        <div
                          key={index}
                          className="flex items-center p-2 rounded-lg hover:bg-lightGreen/20 transition-colors"
                        >
                          <div
                            className="w-3 h-3 rounded-full mr-3"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {entry.name}
                            </p>
                          </div>
                          <div className="text-sm font-semibold text-gray-700">
                            {entry.value} enrollments
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        {/* <BookOpen className="w-12 h-12 mb-2" />
                        <p>No enrollments in courses</p> */}
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Enrollments */}
                <div
                  className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  style={{
                    opacity: animateCharts ? 1 : 0,
                    transform: animateCharts
                      ? "translateY(0)"
                      : "translateY(30px)",
                    transition: "all 0.7s ease-out 0.4s",
                  }}
                >
                  <h2 className="text-md sm:text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-leafGreen" /> Recent Enrollments
                  </h2>
                  {recentEnrollments.length > 0 ? (
                    <div className="space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar">
                      {recentEnrollments.map((enrollment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-lightGreen/20 transition-all duration-200 ease-in-out"
                          style={{
                            animationDelay: `${index * 0.1}s`,
                            animationName: "fadeIn",
                            animationDuration: "0.5s",
                            animationFillMode: "both",
                          }}
                        >
                          <div className="flex items-center">
                            <div className="p-2 bg-lightGreen/30 rounded-lg mr-4">
                              <BookOpen className="w-5 h-5 text-leafGreen" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {enrollment.course_title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {enrollment.user_name}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {enrollment.enrollment_date}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                      <Users className="w-12 h-12 mb-2" />
                      <p>No recent enrollment data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Full Width Revenue Analytics */}
        <div
          className={`
        w-full
        transition-all duration-700 ease-out mt-4 lg:pl-4
        ${animateCharts ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
      `}
        >
          {/* 1. Inner container that limits the max width on large screens
       2. Adds horizontal padding on mobile (px-4) and larger on md+ (px-6)
       3. Keeps the chart 100% of the container width */}
          <div className="max-w-8xl rounded-2xl shadow-lg pt-6 bg-white">
            <RevenueAnalytics
              userType={userType}
              selectedPartner={selectedPartner}
            />
          </div>
        </div>

        {/* Global styles for animations and scrollbars */}
        <style global>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .custom-scrollbar {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* Internet Explorer 10+ */
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none; /* Safari and Chrome */
          }
        `}</style>
      </div>
    </>
  );
};

const analyticsCards = [
  {
    title: "Challenge Analytics",
    description:
      "Track challenge completion rates, popular challenges, and user performance",
    icon: <BarChart3 className="w-6 h-6 text-leafGreen" />,
    color: "bg-white border border-leafGreen/20",
    iconBg: "bg-lightGreen",
    link: "/admin/dashboard/analytics/challenges",
  },
  {
    title: "Time-Based Analytics",
    description:
      "Monitor user activity patterns, course completion time and engagement trends",
    icon: <Clock className="w-6 h-6 text-yellow-500" />,
    color: "bg-white border border-yellow-100",
    iconBg: "bg-yellow-100",
    link: "/admin/dashboard/analytics/time-based",
  },
  {
    title: "Course Performance",
    description:
      "Analyze course completion rates, student progress, and content effectiveness",
    icon: <BookOpen className="w-6 h-6 text-green-600" />,
    color: "bg-white border border-green-100",
    iconBg: "bg-green-100",
    link: "/admin/dashboard/analytics/course-performance",
  },
  {
    title: "Leaderboard & Gamification",
    description: "View top performers, achievements, and gamification metrics",
    icon: <Trophy className="w-6 h-6 text-leafGreen" />,
    color: "bg-white border border-leafGreen/20",
    iconBg: "bg-lightGreen",
    link: "/admin/dashboard/analytics/leaderboard",
  },
  {
    title: "Revenue & Finance",
    description:
      "Track revenue streams, subscription metrics, and financial performance",
    icon: <IndianRupee className="w-6 h-6 text-forestGreen" />,
    color: "bg-white border border-leafGreen/20",
    iconBg: "bg-lightGreen",
    link: "/admin/dashboard/analytics/revenue",
  },
  {
    title: "User Engagement",
    description:
      "Monitor user activity, retention rates, and platform interaction",
    icon: <Users className="w-6 h-6 text-rose-600" />,
    color: "bg-white border border-rose-100",
    iconBg: "bg-rose-100",
    link: "/admin/dashboard/analytics/user-engagement",
  },
  {
    title: "AI Interview Analytics",
    description:
      "Analyze AI-powered interview performance, trends, and question insights",
    icon: <TrendingUp className="w-6 h-6 text-cyan-600" />,
    color: "bg-white border border-cyan-100",
    iconBg: "bg-cyan-100",
    link: "/admin/dashboard/analytics/ai-interview",
  },
  // {
  //   title: "Course Performance Tracking of Student",
  //   description: "Track individual student progress and performance across courses",
  //   icon: <TrendingUp className="w-6 h-6 text-pink-600" />,
  //   color: "bg-white border border-pink-100",
  //   iconBg: "bg-pink-100",
  //   link: "/admin/dashboard/analytics/student-course-performance",
  // },
];

export default AnalyticsOverview;