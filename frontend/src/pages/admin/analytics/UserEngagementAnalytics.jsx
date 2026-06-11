/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect, useState, useRef } from "react";
import {
  Users,
  ArrowLeft,
  BookOpen,
  GraduationCap,
  UserCheck,
  PieChart,
  HelpCircle,
  Clock,
  CircleHelp,
  CheckCircle,
  ClipboardList,
} from "lucide-react";
import {
  useGetCourseCompletionAnalyticsQuery,
  useGetAverageTimeSpentAnalyticsQuery,
  useGetRecentEnrollmentsQuery,
  useGetStudentFAQAnalyticsQuery,
} from "../../../services/Reporting/userEngagementAnalyticsApi";
import { getAdminToken } from "../../../services/CookieService";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Doughnut } from "react-chartjs-2";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  BarElement,
} from "chart.js";
import AverageSessionLengthsGraph from "../../../components/admin/Analytics/AverageSessionLengthsGraph";
import FAQPieChart from "../../../components/admin/Analytics/FAQPieChart";
import { useGetPartnersQuery } from "../../../services/Become_partner/becomePartnerApi";
import AdminLoader from "../../../components/admin/AdminLoader";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  BarElement
);

// Custom tooltip position to avoid overlapping center
Tooltip.positioners.custom = (elements, eventPosition) => {
  if (!elements.length) return false;
  const { x, y } = elements[0].element.tooltipPosition();

  // Adjust position based on tooltip width to prevent overflow
  return {
    x: x,
    y: y - 70, // Position above the donut segment
  };
};

const DonutChart = ({ course, color }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const chartRef = useRef(null);
  const tooltipRef = useRef(null);
  const value = Number.parseFloat(course.completionRate);

  const data = {
    datasets: [
      {
        data: [value, 100 - value],
        backgroundColor: [color, "#e5e7eb"],
        borderWidth: 0,
        cutout: "75%",
      },
    ],
    labels: [course.courseTitle, "Remaining"],
  };

  const options = {
    cutout: "75%",
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false, // Disable the default tooltip
      },
    },
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleMouseMove = () => {
      if (tooltipRef.current && showTooltip && chartRef.current) {
        const rect = chartRef.current.getBoundingClientRect();

        // Position the tooltip above the center of the chart
        tooltipRef.current.style.left = `${rect.left + rect.width / 2 - tooltipRef.current.offsetWidth / 2
          }px`;
        tooltipRef.current.style.top = `${rect.top - tooltipRef.current.offsetHeight - 10
          }px`; // Adjust the 10px value as needed
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [showTooltip]);

  return (
    <div
      className={`flex-shrink-0 w-56`}
      style={{ minWidth: course.courseTitle.length > 15 ? "16rem" : "14rem" }}
    >
      <div className="flex flex-col items-center">
        <div
          className="relative w-44 h-44"
          ref={chartRef}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Doughnut data={data} options={options} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-800">{value}%</span>
          </div>

          {showTooltip && (
            <div
              ref={tooltipRef}
              className="fixed z-50 p-3 rounded-md shadow-lg transition-opacity duration-200"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.85)",
                color: "white",
                minWidth: "220px",
                maxWidth: "300px",
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <div className="font-semibold border-b border-gray-600 pb-2 mb-2">
                Course: {course.courseTitle}
              </div>
              <div className="space-y-1 text-sm">
                <div>Completion Rate: {course.completionRate}</div>
                <div>Total Enrollments: {course.totalEnrollments}</div>
                <div>Completed By: {course.completed}</div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-2 text-center w-full px-2">
          <p className="text-sm font-medium text-gray-700 line-clamp-2">
            {course.courseTitle}
          </p>
        </div>
      </div>
    </div>
  );
};

const UserEngagementAnalytics = () => {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [animateContent, setAnimateContent] = useState(false);
  const navigate = useNavigate();
  const { access_token } = getAdminToken();
  const { id, role } = useSelector((state) => state.user);
  const [userType, setUserType] = useState("all");
  const [selectedPartner, setSelectedPartner] = useState("all");
  const { data: partnersData, isLoading: loadingPartners } = useGetPartnersQuery({ limit: 'all', access_token });


  useEffect(() => {
    // if (!id) {
    //   navigate("/dashboard");
    // }
    setTimeout(() => {
      setIsPageLoading(false);
      setTimeout(() => setAnimateContent(true), 100);
    }, 500);
  }, [id, navigate]);

  const { data: completionData, isLoading: loadingCompletion } =
    useGetCourseCompletionAnalyticsQuery({
      access_token,
      user_type: userType,
      partner_id: selectedPartner,
    });
  const { data: timeSpentData, isLoading: loadingTime } =
    useGetAverageTimeSpentAnalyticsQuery({
      access_token,
      user_type: userType,
      partner_id: selectedPartner,
    });
  const { data: enrollmentData, isLoading: loadingEnrollments } =
    useGetRecentEnrollmentsQuery({
      access_token,
      user_type: userType,
      partner_id: selectedPartner,
    });

  const { data: faqAnalyticsData, isLoading: loadingFAQAnalytics } =
    useGetStudentFAQAnalyticsQuery({
      access_token,
      user_type: userType,
      partner_id: selectedPartner,
    });

  const isDataLoading =
    loadingCompletion ||
    loadingTime ||
    loadingEnrollments ||
    loadingFAQAnalytics;

  if (isPageLoading || isDataLoading) {
    return <AdminLoader className="h-screen" message="Analyzing user engagement..." />;
  }

  // Calculate overall completion rate
  const overallCompletionRate =
    completionData?.data?.courseCompletionRates?.reduce((acc, course) => {
      return acc + Number.parseFloat(course.completionRate);
    }, 0) / (completionData?.data?.courseCompletionRates?.length || 1);

  // Prepare data for course completion pie chart
  const courseCompletionRates =
    completionData?.data?.courseCompletionRates || [];

  // Prepare data for average time spent bar chart
  const averageTimePerCourse = timeSpentData?.data?.averageTimePerCourse || [];

  const formatSecondsToMS = (seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00";

    const totalSeconds = Math.floor(Number(seconds));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Ensure the chart resizes with its container
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const idx = context.dataIndex;
            const course = averageTimePerCourse[idx];
            if (!course) return "";
            return [
              `Average Time Spent: ${formatSecondsToMS(Number.parseFloat(course.averageTimeSpent))} min`,
              `Total Time: ${formatSecondsToMS(course.totalTime)} min`,
              `Sessions: ${course.sessions}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Courses",
          font: { size: 14, weight: "bold" },
        },
        ticks: {
          font: { size: 0 },
          color: "#64748b",
          autoSkip: false, // Ensure all labels are shown
          maxRotation: 45,    // Rotate labels 45 degrees
          minRotation: 45,    // Rotate labels 45 degrees
          padding: 10
        },
        grid: {
          display: false,
        },
      },
      y: {
        title: {
          display: true,
          text: "Average Time Spent (min)",
          font: { size: 14, weight: "bold" },
        },
        beginAtZero: true,
        ticks: {
          font: { size: 12 },
          color: "#64748b",
        },
      },
    },
  };

  // Dynamically adjust bar thickness based on the number of courses
  const dynamicBarThickness = Math.max(10, 70 / averageTimePerCourse.length);

  const barChartData = {
    labels: averageTimePerCourse.map((course) => course.courseTitle),
    datasets: [
      {
        label: "Average Time Spent (min)",
        data: averageTimePerCourse.map((course) =>
          Number.parseFloat(course.averageTimeSpent) / 60
        ),
        backgroundColor: "rgba(0, 157, 92, 0.7)",
        borderColor: "rgba(0, 157, 92, 1)",
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: dynamicBarThickness, // Use dynamic bar thickness
      },
    ],
  };

  // User completion stats
  const userCompletionRates = completionData?.data?.userCompletionRates || [];

  return (
    <div className="flex flex-col h-screen w-screen lg:w-[calc(100vw-80px)] bg-white">
      {/* Header */}
      <div className="bg-white border-b pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full p-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 mx-2">
              <h1 className="text-xl text-center md:text-start md:text-2xl font-bold  text-forestGreen">
                User Engagement<span className="hidden sm:inline"> Analytics</span>
              </h1>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {role == "admin" && (
                <div className="hidden sm:inline-flex flex gap-4">
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md bg-white"
                    value={userType}
                    onChange={(e) => {
                      setUserType(e.target.value);
                      setSelectedPartner("all"); // Reset partner when user type changes
                    }}
                  >
                    <option value="all">All</option>
                    <option value="admin">Admin</option>
                    <option value="partner">Partner</option>
                  </select>

                  {userType === "partner" && (
                    <select
                      className="px-3 py-2 border border-gray-300 rounded-md bg-white"
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
          {role == "admin" && (
            <div className="sm:hidden flex gap-4 justify-between items-center mt-4">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                value={userType}
                onChange={(e) => {
                  setUserType(e.target.value);
                  setSelectedPartner("all"); // Reset partner when user type changes
                }}
              >
                <option value="all">All</option>
                <option value="admin">Admin</option>
                <option value="partner">Partner</option>
              </select>

              {userType === "partner" && (
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
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

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="w-full mx-auto space-y-4 sm:space-y-6">
          {/* Key Metrics */}
          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-all duration-500 ease-out ${animateContent
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
              }`}
          >
            <MetricCard
              title="Overall Completion Rate"
              value={`${overallCompletionRate.toFixed(1)}%`}
              icon={<GraduationCap />}
              color="border-leafGreen/20"
              iconColor="text-leafGreen"
            />
            <MetricCard
              title="Active Users"
              value={userCompletionRates.length || 0}
              icon={<Users />}
              color="border-leafGreen/20"
              iconColor="text-leafGreen"
            />
            <MetricCard
              title="Total Courses"
              value={courseCompletionRates.length || 0}
              icon={<BookOpen />}
              color="border-leafGreen/20"
              iconColor="text-forestGreen"
            />
          </div>

          {/* Bar Chart for Average Time Spent Per Course */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-300 transform">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-leafGreen" /> Average Time Spent per course
            </h2>
            <div className="w-full" style={{ height: 420 }}>
              <Bar
                data={barChartData}
                options={{
                  ...barChartOptions,
                  maintainAspectRatio: false,
                  scales: {
                    ...barChartOptions.scales,
                    x: {
                      ...barChartOptions.scales.x,
                      grid: {
                        display: false,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Average Session length per course */}
          <AverageSessionLengthsGraph userType={userType} selectedPartner={selectedPartner} />

          {/* Course Completion Chart */}
          <div
            className={`bg-white rounded-xl mt-[30px] shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-700 ease-out ${animateContent
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
              }`}
          >
            <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 text-gray-800 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-leafGreen" /> Course Completion Rates
            </h2>

            <div className="relative overflow-x-auto scrollbar-hide">
              {courseCompletionRates.length > 0 ? (
                <div className="flex gap-8" style={{ minWidth: "100%" }}>
                  {courseCompletionRates.map((course, idx) => (
                    <DonutChart
                      key={course.courseTitle}
                      course={course}
                      color={
                        [
                          "rgba(0, 157, 92, 0.8)", // leafGreen
                          "rgba(6, 103, 217, 0.8)", // experience2 (blue)
                          "rgba(139, 4, 92, 0.8)",  // experience1 (magenta)
                          "rgba(0, 187, 110, 0.8)", // primary
                          "rgba(219, 51, 8, 0.8)",  // experience4 (orange)
                          "rgba(2, 105, 62, 0.8)",  // experience3 (dark green)
                          "rgba(0, 35, 34, 0.8)",   // forestGreen
                          "rgba(71, 71, 71, 0.8)",  // darkSand
                          "rgba(17, 24, 39, 0.8)",  // megistic
                          "rgba(249, 248, 246, 0.8)", // sand
                        ][idx % 10]
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full text-gray-500">
                  <PieChart className="w-12 h-12 mb-2" />
                  <p>No course completion data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Student FAQ Analytics */}
          <div
            className={`bg-white rounded-xl mt-[30px] shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-700 ease-out ${animateContent
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
              }`}
          >
            <h2 className="text-lg sm:text-xl sm:text-xl font-bold mb-2 sm:mb-4 text-gray-800 flex items-center gap-2">
              <CircleHelp className="w-5 h-5 text-leafGreen" /> Student FAQ Analytics
            </h2>
            {faqAnalyticsData?.data?.length > 0 ? (
              <div className="space-y-8">
                {faqAnalyticsData.data.map((course) => (
                  <div key={course.courseId} className="mb-6">
                    <h3 className="text-md sm:text-lg font-semibold mb-4">
                      {course.courseTitle}
                    </h3>
                    <div className="relative overflow-x-auto scrollbar-hide">
                      <div className="flex gap-8" style={{ minWidth: "100%" }}>
                        {Object.values(course.questions).map((question) => (
                          <FAQPieChart
                            key={`${course.courseId}-${question.questionId}`}
                            question={question.questionText}
                            options={question.options}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                <HelpCircle className="w-12 h-12 mb-2" />
                <p>No FAQ analytics data available</p>
              </div>
            )}
          </div>

          {/* User Completion Stats */}
          <div
            className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-300 transform"
            style={{ maxHeight: 450, display: "flex", flexDirection: "column" }}
          >
            <h2 className="text-lg sm:text-xl sm:text-xl font-bold mb-2 sm:mb-4 text-gray-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-leafGreen" /> User Completion Stats
            </h2>
            <div
              className="space-y-4 custom-scrollbar"
              style={{ maxHeight: "calc(100% - 4rem)", overflowY: "auto" }}
            >
              {userCompletionRates.length > 0 ? (
                userCompletionRates.map((user, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    {/* LEFT SIDE — User info */}
                    <div className="flex items-center sm:items-center sm:w-auto">
                      <div className="p-2 bg-lightGreen rounded-lg mr-4">
                        <UserCheck className="w-5 h-5 text-leafGreen" />
                      </div>

                      {/* Mobile: Username on row 1, course info + percent on row 2 */}
                      <div className="w-full">
                        {/* Row 1: Username */}
                        <p className="text-sm font-medium text-gray-900">{user.userName}</p>

                        {/* Row 2: Course progress + percentage (only visible on mobile) */}
                        <div className="flex justify-between sm:hidden mt-1">
                          <p className="text-xs text-gray-500">
                            {user.completedCourses} of {user.totalCourses} courses completed
                          </p>
                          <p className="text-xs text-gray-500">{user.completionRate}</p>
                        </div>

                        {/* Desktop: original text line */}
                        <p className="hidden sm:block text-xs text-gray-500">
                          {user.completedCourses} of {user.totalCourses} courses completed
                        </p>
                      </div>
                    </div>

                    {/* RIGHT SIDE — Percentage + bar */}
                    <div className="sm:text-right sm:w-40 mt-3 sm:mt-0">
                      {/* Desktop percentage (original position) */}
                      <p className="hidden sm:block text-xs text-gray-500 mb-1">
                        {user.completionRate}
                      </p>

                      {/* Row 3: Progress Bar */}
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-[#58cb9b] rounded-full"
                          style={{ width: user.completionRate }}
                        ></div>
                      </div>

                      {/* Mobile percentage (moved inside row 2 above) */}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <UserCheck className="w-12 h-12 mb-2" />
                  <p>No user completion data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Enrollments */}
          <div
            className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-300 transform"
            style={{ maxHeight: 608, display: "flex", flexDirection: "column" }}
          >
            <h2 className="text-lg sm:text-xl sm:text-xl font-bold mb-2 sm:mb-4 text-gray-800 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-leafGreen" /> Recent Enrollments
            </h2>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrollment Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {enrollmentData?.data?.length > 0 ? (
                    enrollmentData.data.map((enrollment, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {enrollment.user_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {enrollment.course_title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {enrollment.course_category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {enrollment.enrollment_date}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No recent enrollments available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 overflow-y-auto custom-scrollbar">
              {enrollmentData?.data?.length > 0 ? (
                enrollmentData.data.map((enrollment, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    {/* First Row: User name on left, date on right */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900">{enrollment.user_name}</div>
                      <div className="text-xs text-gray-500">{enrollment.enrollment_date}</div>
                    </div>

                    {/* Second Row: Course name */}
                    <div className="text-sm text-gray-700 mb-1">{enrollment.course_title}</div>

                    {/* Third Row: Category */}
                    <div className="text-xs text-gray-500">{enrollment.course_category}</div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No recent enrollments available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`
            .custom-scrollbar {
              scrollbar-width: none; /* Firefox */
              -ms-overflow-style: none; /* Internet Explorer 10+ */
            }
            .custom-scrollbar::-webkit-scrollbar {
              /* WebKit browsers */
              width: 0;
              height: 0;
            }
          `}</style>
    </div>
  );
};

const MetricCard = ({ title, value, icon, color, iconColor }) => (
  <div
    className={`bg-white rounded-xl p-4 sm:p-6 text-gray-800 shadow-lg border ${color}`}
  >
    <div className="flex items-center justify-between mb-1">
      <p className="text-xs md:text-sm font-medium text-gray-500">{title}</p>
      <div className="p-2 bg-gray-100 rounded-lg">
        {React.cloneElement(icon, { className: `w-5 h-5 ${iconColor}` })}
      </div>
    </div>
    <p className="text-xl sm:text-2xl font-bold">{value}</p>
  </div>
);

export default UserEngagementAnalytics;
