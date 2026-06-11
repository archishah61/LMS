"use client";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Users,
  Clock,
  Star,
  ArrowLeft,
  BarChart2,
  Trophy,
  Award,
  ChevronRight,
  Info,
  AlertTriangle,
} from "lucide-react";
import {
  useGetTopEnrolledCoursesQuery,
  useGetTopRatedCoursesQuery,
  useGetCategoriesWithMostEnrollmentsQuery,
  useGetAverageTimeToCompleteCourseQuery,
} from "../../../services/Reporting/coursePerformanceAnalyticsApi";
import { getAdminToken } from "../../../services/CookieService";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import { useGetPartnersQuery } from "../../../services/Become_partner/becomePartnerApi";
import AdminLoader from "../../../components/admin/AdminLoader";

const CoursePerformanceAnalytics = () => {
  const { access_token } = getAdminToken();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [animateContent, setAnimateContent] = useState(false);
  const [animateHeader, setAnimateHeader] = useState(false);
  const [activeTab, setActiveTab] = useState("enrolled");
  const navigate = useNavigate();
  const { id, role } = useSelector((state) => state.user);
  const [userType, setUserType] = useState("all");
  const [selectedPartner, setSelectedPartner] = useState("all");
  const { data: partnersData, isLoading: loadingPartners } = useGetPartnersQuery({ limit: 'all', access_token });

  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => {
      setIsInitialLoading(false);
      setTimeout(() => setAnimateHeader(true), 100);
      setTimeout(() => setAnimateContent(true), 300);
    }, 500);
  }, [id, navigate]);

  const {
    data: topEnrolledCourses,
    isLoading: loadingEnrolled,
    error: errorEnrolled,
  } = useGetTopEnrolledCoursesQuery({
    access_token,
    user_type: userType,
    partner_id: selectedPartner,
  });
  const {
    data: topRatedCourses,
    isLoading: loadingRated,
    error: errorRated,
  } = useGetTopRatedCoursesQuery({
    access_token,
    user_type: userType,
    partner_id: selectedPartner,
  });
  const {
    data: categoriesMostEnrollments,
    isLoading: loadingCategories,
    error: errorCategories,
  } = useGetCategoriesWithMostEnrollmentsQuery({
    access_token,
    user_type: userType,
    partner_id: selectedPartner,
  });
  const {
    data: avgTimeToComplete,
    isLoading: loadingAvgTime,
    error: errorAvgTime,
  } = useGetAverageTimeToCompleteCourseQuery({
    access_token,
    user_type: userType,
    partner_id: selectedPartner,
  });

  const isLoading =
    loadingEnrolled ||
    loadingRated ||
    loadingCategories ||
    loadingAvgTime ||
    isInitialLoading;
  const error = errorEnrolled || errorRated || errorCategories || errorAvgTime;

  const pieChartData =
    avgTimeToComplete?.data?.slice(0, 5).map((course) => ({
      name: course.title,
      value: Number.parseFloat(course.averageTimeSpent),
    })) || [];

  const barChartData =
    topEnrolledCourses?.data?.slice(0, 5).map((course) => ({
      name:
        course.title.length > 15
          ? course.title.substring(0, 15) + "..."
          : course.title,
      enrollments: course.enrollmentCount,
      fullName: course.title,
    })) || [];

  const totalEnrollments =
    topEnrolledCourses?.data?.reduce(
      (sum, course) => sum + course.enrollmentCount,
      0
    ) || 0;

  const averageRating =
    topRatedCourses?.data?.reduce(
      (sum, course) => sum + course.averageRating,
      0
    ) / (topRatedCourses?.data?.length || 1);

  const totalCategories = categoriesMostEnrollments?.data?.length || 0;

  const averageCompletionTime =
    avgTimeToComplete?.data?.reduce(
      (sum, course) => sum + Number.parseFloat(course.averageTimeSpent),
      0
    ) / (avgTimeToComplete?.data?.length || 1) || 0;

  const COLORS = [
    "#4F46E5",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];

  const RATING_COLORS = {
    low: "#EF4444",
    medium: "#F59E0B",
    high: "#10B981",
  };

  const getRatingColor = (rating) => {
    if (rating < 3.5) return RATING_COLORS.low;
    if (rating < 4.5) return RATING_COLORS.medium;
    return RATING_COLORS.high;
  };

  const renderStarRating = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star
            key={`full-${i}`}
            className="w-3 h-3 md:w-4 md:h-4 fill-yellow-400 text-yellow-400"
          />
        ))}
        {hasHalfStar && (
          <div className="relative w-3 h-3 md:w-4 md:h-4">
            <Star className="absolute w-3 h-3 md:w-4 md:h-4 text-yellow-400" />
            <div className="absolute w-1.5 h-3 md:w-2 md:h-4 overflow-hidden">
              <Star className="w-3 h-3 md:w-4 md:h-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="w-3 h-3 md:w-4 md:h-4 text-gray-300" />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return <AdminLoader className="h-screen" message="Analyzing course performance..." />;
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 max-w-full mx-2 md:mx-10 bg-white min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 md:p-6 text-red-600 shadow-lg max-w-3xl mx-auto">
          <h2 className="text-lg md:text-xl font-bold mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
            Error Loading Data
          </h2>
          <p className="text-sm md:text-base">
            {error.message || "Failed to load course performance analytics"}
          </p>
          <button
            className="mt-4 px-3 py-2 md:px-4 md:py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm md:text-base"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b pl-0 md:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full p-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 mx-2">
              <h1 className="text-xl text-center md:text-start md:text-2xl font-bold  text-forestGreen">
                Course Performance Analytics
              </h1>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {role === "admin" && (
                <div className="hidden sm:inline-flex flex gap-4">
                  <select
                    className="w-full md:w-auto px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm border border-gray-300 rounded-lg shadow-sm transition-colors"
                    value={userType}
                    onChange={(e) => {
                      setUserType(e.target.value);
                      setSelectedPartner("all");
                    }}
                  >
                    <option value="all">All</option>
                    <option value="admin">Admin</option>
                    <option value="partner">Partner</option>
                  </select>
                  {userType === "partner" && (
                    <select
                      className="w-full md:w-auto px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm border border-gray-300 rounded-md bg-white"
                      value={selectedPartner}
                      onChange={(e) => setSelectedPartner(e.target.value)}
                    >
                      <option value="all">All Partners</option>
                      {!loadingPartners &&
                        partnersData?.partners?.map((partner) => (
                          <option key={partner.id} value={partner.id}>
                            {partner.name}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              )}

              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 sm:px-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Back</span>
              </button>
            </div>
          </div>
          {role === "admin" && (
            <div className="sm:hidden flex gap-4 justify-between items-center mt-4">
              <select
                className="w-full md:w-auto px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm border border-gray-300 rounded-lg shadow-sm transition-colors"
                value={userType}
                onChange={(e) => {
                  setUserType(e.target.value);
                  setSelectedPartner("all");
                }}
              >
                <option value="all">All</option>
                <option value="admin">Admin</option>
                <option value="partner">Partner</option>
              </select>
              {userType === "partner" && (
                <select
                  className="w-full md:w-auto px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm border border-gray-300 rounded-md bg-white"
                  value={selectedPartner}
                  onChange={(e) => setSelectedPartner(e.target.value)}
                >
                  <option value="all">All Partners</option>
                  {!loadingPartners &&
                    partnersData?.partners?.map((partner) => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name}
                      </option>
                    ))}
                </select>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Summary Cards */}
        <div
          className={`w-full max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-500 ease-out ${animateContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          style={{ transitionDelay: "100ms" }}
        >
          {/* Total Enrollments */}
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-5 border border-indigo-100 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">
                  Total Enrollments
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">
                  {totalEnrollments.toLocaleString()}
                </h3>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <div className="mt-1.5 text-xs text-gray-500">Across all courses</div>
          </div>
          {/* Average Rating */}
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-5 border border-yellow-100 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">
                  Average Rating
                </p>
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mt-1">
                  {averageRating.toFixed(1)}
                </h3>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
            <div className="mt-1.5 flex items-center gap-1">
              {renderStarRating(averageRating)}
              <span className="text-xs text-gray-500 ml-1">
                (
                {topRatedCourses?.data?.reduce(
                  (sum, course) => sum + course.reviewCount,
                  0
                ) || 0}{" "}
                reviews)
              </span>
            </div>
          </div>
          {/* Total Categories */}
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-5 border border-leafGreen/20 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">
                  Course Categories
                </p>
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mt-1">
                  {totalCategories}
                </h3>
              </div>
              <div className="bg-lightGreen p-3 rounded-lg">
                <BarChart2 className="w-5 h-5 text-leafGreen" />
              </div>
            </div>
            <div className="mt-1.5 text-xs text-gray-500">
              Active categories with enrollments
            </div>
          </div>
          {/* Average Completion Time */}
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-5 border border-green-100 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">
                  Avg. Completion Time
                </p>
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mt-1">
                  {(averageCompletionTime / 3600).toFixed(2)} hrs
                </h3>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="mt-1.5 text-xs text-gray-500">
              Average time to complete courses
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 md:gap-6 mt-4 md:mt-6">
          {/* Left Column - Course Rankings */}
          <div
            className={`flex-1 transition-all duration-500 ease-out ${animateContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 h-auto">
              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-4 md:mb-6 overflow-x-auto">
                <button
                  className={`px-2.5 py-1.5 md:px-4 md:py-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === "enrolled"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                  onClick={() => setActiveTab("enrolled")}
                >
                  Top Enrolled
                </button>
                <button
                  className={`px-2.5 py-1.5 md:px-4 md:py-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === "rated"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                  onClick={() => setActiveTab("rated")}
                >
                  Top Rated
                </button>
                <button
                  className={`px-2.5 py-1.5 md:px-4 md:py-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === "categories"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                  onClick={() => setActiveTab("categories")}
                >
                  Categories
                </button>
              </div>

              {/* Top Enrolled Courses */}
              {activeTab === "enrolled" && (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                    <h2 className="text-md md:text-lg font-semibold text-gray-800 flex items-center gap-1.5">
                      <Trophy className="w-5 h-5 text-indigo-500" /> Top Enrolled Courses
                    </h2>
                    <span className="text-xs md:text-sm text-gray-500">
                      {topEnrolledCourses?.data?.length || 0} courses ranked by enrollment
                    </span>
                  </div>

                  {/* Bar Chart */}
                  <div className="h-[250px] md:h-[300px] mb-3 md:mb-6">
                    {topEnrolledCourses?.data?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={barChartData}
                          layout="vertical"
                          margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={true}
                            vertical={false}
                          />
                          <XAxis type="number" />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={70}
                            tick={{ fontSize: 10 }}
                            tickFormatter={(value) =>
                              value.length > 15
                                ? value.substring(0, 15) + "..."
                                : value
                            }
                          />
                          <Tooltip
                            formatter={(value, name, props) => [
                              value,
                              "Enrollments",
                            ]}
                            labelFormatter={(label, props) => {
                              if (props.payload && props.payload.length > 0) {
                                return props.payload[0].fullName;
                              }
                              return label;
                            }}
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "0.5rem",
                              padding: "0.5rem",
                              fontSize: "0.75rem",
                            }}
                          />
                          <Bar
                            dataKey="enrollments"
                            fill="#4F46E5"
                            radius={[0, 4, 4, 0]}
                            barSize={15}
                            animationDuration={1500}
                          >
                            <LabelList
                              dataKey="enrollments"
                              position="right"
                              fill="#4F46E5"
                              fontSize={10}
                              fontWeight={600}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Trophy className="w-8 h-8 md:w-12 md:h-12 mb-1 md:mb-2" />
                        <p className="text-xs md:text-sm">No enrolled courses available</p>
                      </div>
                    )}
                  </div>

                  {/* Course List */}
                  {topEnrolledCourses?.data?.length > 0 && (
                    <div className="space-y-2 md:space-y-3 mt-2 md:mt-4 h-[250px] md:h-[300px] overflow-y-auto custom-scrollbar">
                      {topEnrolledCourses.data.map((course, index) => (
                        <div
                          key={course.course_id}
                          className="flex items-center p-2 md:p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                          <div className="hidden sm:inline-flex w-8 h-8 md:w-10 md:h-10 rounded-full  from-indigo-500  flex items-center justify-center text-white font-bold text-sm md:text-lg mr-2 md:mr-4 shadow-sm">
                            {course.title.charAt(0).toUpperCase()}
                          </div>
                          <div className="sm:hidden mr-2 flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-indigo-100 text-indigo-600 font-semibold text-xs">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-xs md:text-sm text-gray-800 max-w-[240px] sm:max-w-none truncate">
                              {course.title}
                            </h3>
                            <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
                              <Users className="w-3 h-3 md:w-4 md:h-4 text-indigo-400" />
                              <span className="text-xs text-gray-500">
                                {course.enrollmentCount} enrollments
                              </span>
                            </div>
                          </div>
                          <div className="hidden sm:inline-flex flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-indigo-100 text-indigo-600 font-semibold text-xs">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Top Rated Courses */}
              {activeTab === "rated" && (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                    <h2 className="text-md md:text-lg font-semibold text-gray-800 flex items-center gap-1.5">
                      <Award className="w-5 h-5 text-yellow-500" /> Top Rated Courses
                    </h2>
                    <span className="text-xs md:text-sm text-gray-500">
                      {topRatedCourses?.data?.length || 0} courses ranked by rating
                    </span>
                  </div>
                  <div className="space-y-2 md:space-y-3 h-[300px] md:h-[465px] overflow-y-auto custom-scrollbar">
                    {topRatedCourses?.data?.length > 0 ? (
                      topRatedCourses.data.map((course, index) => (
                        <div
                          key={course.course_id}
                          className="flex items-center p-2 md:p-4 bg-gray-50 rounded-lg hover:bg-yellow-50 transition-colors"
                        >
                          <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-yellow-100 text-yellow-600 font-semibold text-xs md:text-sm mr-2 md:mr-4">
                            {index + 1}
                          </div>
                          <div className="hidden sm:inline-flex w-8 h-8 md:w-10 md:h-10 rounded-full  from-yellow-400 to-yellow-500 flex items-center justify-center text-white font-bold text-sm md:text-lg mr-2 md:mr-4 shadow-sm">
                            {course.title.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-xs md:text-sm text-gray-800 max-w-[240px] sm:max-w-none truncate">
                              {course.title}
                            </h3>
                            <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
                              {renderStarRating(course.averageRating)}
                              <span
                                className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: `${getRatingColor(course.averageRating)}20`,
                                  color: getRatingColor(course.averageRating),
                                }}
                              >
                                {course.averageRating.toFixed(1)}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({course.reviewCount} reviews)
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Award className="w-8 h-8 md:w-12 md:h-12 mb-1 md:mb-2" />
                        <p className="text-xs md:text-sm">No rated courses available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Categories with Most Enrollments */}
              {activeTab === "categories" && (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                    <h2 className="text-md md:text-lg font-semibold text-gray-800 flex items-center gap-1.5">
                      <BarChart2 className="w-5 h-5 text-leafGreen" /> Top Categories
                    </h2>
                    <span className="text-xs md:text-sm text-gray-500">
                      {categoriesMostEnrollments?.data?.length || 0} categories ranked by enrollment
                    </span>
                  </div>
                  <div className="space-y-2 md:space-y-3 h-[300px] md:h-[465px] overflow-y-auto custom-scrollbar">
                    {categoriesMostEnrollments?.data?.length > 0 ? (
                      categoriesMostEnrollments.data.map((category, index) => (
                        <div
                          key={category.category_id}
                          className="flex items-center p-2 md:p-4 bg-gray-50 rounded-lg hover:bg-lightGreen transition-colors"
                        >
                          <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-lightGreen text-leafGreen font-semibold text-xs md:text-sm mr-2 md:mr-4">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-xs md:text-sm text-gray-800 truncate">
                              {category.category_name}
                            </h3>
                            <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
                              <Users className="w-3 h-3 md:w-4 md:h-4 text-leafGreen" />
                              <span className="text-xs text-gray-500">
                                {category.enrollmentCount} enrollments
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {category.courseCount} courses
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <BarChart2 className="w-8 h-8 md:w-12 md:h-12 mb-1 md:mb-2" />
                        <p className="text-xs md:text-sm">No categories available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Completion Time */}
          <div
            className={`w-full lg:w-[350px] transition-all duration-500 ease-out ${animateContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
            style={{ transitionDelay: "300ms" }}
          >
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-1.5">
                <Clock className="w-5 h-5 text-green-500" /> Average Completion Time
              </h2>
              {pieChartData.length > 0 ? (
                <div className="flex flex-col">
                  <div className="h-[250px] md:h-[300px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData.map((entry) => ({
                            ...entry,
                            value: entry.value / 3600,
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          innerRadius={50}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                          animationDuration={1500}
                          animationBegin={300}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                              stroke="white"
                              strokeWidth={1}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value.toFixed(2)} hours`, "Average Time"]}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "0.5rem",
                            padding: "0.5rem",
                            fontSize: "0.75rem",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 md:mt-4">
                    <div className="space-y-1.5 md:space-y-2 h-[200px] md:h-[250px] overflow-y-auto custom-scrollbar">
                      {pieChartData.map((entry, index) => (
                        <div
                          key={entry.name}
                          className="flex items-center p-1.5 md:p-2 rounded-lg hover:bg-gray-50"
                        >
                          <div
                            className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full mr-2"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs md:text-sm font-medium text-gray-800 max-w-[192px] sm:max-w-none truncate">
                              {entry.name}
                            </p>
                          </div>
                          <div className="text-xs md:text-sm font-semibold text-gray-700">
                            {(entry.value / 3600).toFixed(2)} hrs
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 md:mt-6 p-3 md:p-4 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-start gap-2 md:gap-3">
                        <div className="bg-green-100 p-1 rounded-full">
                          <Info className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="text-xs md:text-sm font-medium text-green-800">
                            Completion Time Insights
                          </h4>
                          <p className="text-xs text-green-700 mt-1">
                            The average completion time across all courses is {(averageCompletionTime / 3600).toFixed(2)} hours.
                            {pieChartData[0] && pieChartData[0].value / 3600 > averageCompletionTime / 3600 && (
                              <span>
                                {" "}{pieChartData[0].name} takes the longest to complete at {(pieChartData[0].value / 3600).toFixed(2)} hours.
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[250px] md:h-[300px] text-gray-500">
                  <Clock className="w-8 h-8 md:w-12 md:h-12 mb-1 md:mb-2" />
                  <p className="text-xs md:text-sm">No completion time data available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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

export default CoursePerformanceAnalytics;
