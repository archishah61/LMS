"use client";

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { useGetEstimatedVsActualCompletionTimesQuery } from "../../../services/Reporting/timeBasedAnalyticsApi";
import { getAdminToken } from "../../../services/CookieService";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";
import { useGetPartnersQuery } from "../../../services/Become_partner/becomePartnerApi";
import AdminLoader from "../../../components/admin/AdminLoader";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TimeBasedAnalytics = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [animateContent, setAnimateContent] = useState(false);
  const [activeTab, setActiveTab] = useState("chart"); // 'chart' or 'table'
  const navigate = useNavigate();
  const { access_token } = getAdminToken();
  const { id, role } = useSelector((state) => state.user);

  const [userType, setUserType] = useState("all");
  const [selectedPartner, setSelectedPartner] = useState("all");
  const { data: partnersData, isLoading: loadingPartners } = useGetPartnersQuery({ limit: 'all', access_token });

  useEffect(() => {
    window.scrollTo(0, 0);

    // if (!id) {
    //   navigate("/admin/login");
    // }

    // Initial loading state
    setTimeout(() => {
      setIsLoading(false);
      // Start content animation
      setTimeout(() => setAnimateContent(true), 100);
    }, 500);
  }, [id, navigate]);

  const {
    data,
    isLoading: isDataLoading,
    error,
  } = useGetEstimatedVsActualCompletionTimesQuery({
    access_token,
    user_type: userType,
    partner_id: selectedPartner,
  });

  if (isLoading || isDataLoading) {
    return <AdminLoader className="h-screen" message="Loading time-based analytics..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen  bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <button
            className="flex items-center gap-1 px-3 py-2 bg-white rounded-md shadow-sm hover:bg-lightGreen transition-all hover:shadow-md mb-6"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 text-forestGreen" />
            <span className="text-forestGreen text-sm">Back</span>
          </button>

          <div className="bg-white border border-red-200 rounded-xl p-8 text-red-600 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-bold">Error Loading Data</h2>
            </div>
            <p className="text-gray-700">
              {error.message || "Failed to load time-based analytics"}
            </p>
            <button
              className="mt-6 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // if (
  //   !data ||
  //   !data.data ||
  //   !Array.isArray(data.data) ||
  //   data.data.length === 0
  // ) {
  //   return (
  //     <div className="min-h-screen  bg-lightGreen p-8">
  //       <div className="max-w-4xl mx-auto">
  //         <button
  //           className="flex items-center gap-1 px-3 py-2 bg-white rounded-md shadow-sm hover:bg-lightGreen transition-all hover:shadow-md mb-6"
  //           onClick={() => navigate(-1)}
  //         >
  //           <ArrowLeft className="w-4 h-4 text-forestGreen" />
  //           <span className="text-forestGreen text-sm">Back</span>
  //         </button>

  //         <div className="bg-white border border-yellow-200 rounded-xl p-8 shadow-lg">
  //           <div className="flex items-center gap-3 mb-4">
  //             <div className="bg-yellow-100 p-3 rounded-full">
  //               <Info className="w-6 h-6 text-yellow-500" />
  //             </div>
  //             <h2 className="text-xl font-bold text-yellow-700">
  //               No Data Available
  //             </h2>
  //           </div>
  //           <p className="text-gray-700">
  //             There are no time-based analytics records to display at the
  //             moment.
  //           </p>
  //           <button
  //             className="mt-6 px-4 py-2 bg-lightGreen text-forestGreen rounded-lg hover:bg-lightGreen transition-colors"
  //             onClick={() => navigate(-1)}
  //           >
  //             Return to Dashboard
  //           </button>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  // Calculate insights
  const totalCourses = data.data.length;
  const totalStudents = data.data.reduce(
    (sum, course) => sum + course.student_count,
    0
  );

  // Find courses with biggest time differences
  const coursesWithDifference = [...data.data].map((course) => ({
    ...course,
    difference: course.average_actual_hours - course.estimated_hours,
    percentageDiff:
      ((course.average_actual_hours - course.estimated_hours) /
        course.estimated_hours) *
      100,
  }));

  // Sort by absolute difference
  const sortedByDifference = [...coursesWithDifference].sort(
    (a, b) => Math.abs(b.difference) - Math.abs(a.difference)
  );

  const mostUnderestimated = sortedByDifference.find(
    (course) => course.difference > 0
  );
  const mostOverestimated = sortedByDifference.find(
    (course) => course.difference < 0
  );

  // Calculate average difference
  const averageDifference =
    coursesWithDifference.reduce((sum, course) => sum + course.difference, 0) /
    totalCourses;
  const averagePercentageDiff =
    coursesWithDifference.reduce(
      (sum, course) => sum + course.percentageDiff,
      0
    ) / totalCourses;

  const chartData = {
    labels: data.data.map((item) => item.course_title),
    datasets: [
      {
        label: "Estimated Hours",
        data: data.data.map((item) => (item.estimated_hours / 60).toFixed(2)),
        borderColor: "rgba(0, 157, 92, 1)", // leafGreen
        backgroundColor: "rgba(0, 157, 92, 0.1)",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: "rgba(0, 157, 92, 1)",
        pointBorderColor: "white",
        pointBorderWidth: 2,
      },
      {
        label: "Average Actual Hours",
        data: data.data.map((item) => (item.average_actual_hours / 60).toFixed(2)),
        borderColor: "rgba(2, 138, 59, 1)", // experience2 (blue)
        backgroundColor: "rgba(32, 169, 28, 0.1)",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: "rgba(46, 104, 43, 1)",
        pointBorderColor: "white",
        pointBorderWidth: 2,
      },
    ],
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: "top",       // right align on mobile
        labels: {
          usePointStyle: true,
          padding: isMobile ? 6 : 20,               // smaller padding on mobile
          font: {
            size: isMobile ? 10 : 14,               // smaller font
            weight: isMobile ? "500" : "600",
          },
        },
      },

      title: { display: false },

      tooltip: {
        backgroundColor: "rgba(255,255,255,0.9)",
        titleColor: "#1F2937",
        bodyColor: "#4B5563",
        borderColor: "#E5E7EB",
        borderWidth: 1,
        padding: isMobile ? 8 : 12,                 // mobile padding
        cornerRadius: 8,
        titleFont: {
          size: isMobile ? 12 : 14,
          weight: "bold",
        },
        bodyFont: {
          size: isMobile ? 11 : 13,
        },
        callbacks: {
          label: function (tooltipItem) {
            const course = data.data[tooltipItem.dataIndex];
            const label = tooltipItem.dataset.label;
            const value = tooltipItem.raw;
            return [
              `${label}: ${value} hours`,
              `Students: ${course.student_count}`,
            ];
          },
        },
      },
    },

    scales: {
      x: {
        title: {
          display: true,
          text: "Course Titles",
          font: { size: isMobile ? 10 : 14, weight: "bold" },
          padding: { top: isMobile ? 2 : 10 },
        },
        grid: { display: false },
        ticks: {
          maxRotation: isMobile ? 0 : 45,
          minRotation: isMobile ? 0 : 45,
          font: {
            size: isMobile ? 9 : 12,                // smaller font for mobile
          },
          padding: isMobile ? 4 : 10,               // less space
          callback: function (value) {
            const label = this.getLabelForValue(value);
            if (isMobile) return "";                // hide labels on mobile
            return label;
          },
        },
      },

      y: {
        title: {
          display: true,
          text: "Hours",
          font: { size: isMobile ? 10 : 14, weight: "bold" },
          padding: { bottom: isMobile ? 2 : 10 },
        },
        grid: {
          color: "rgba(226, 232, 240, 0.6)",
        },
        ticks: {
          font: { size: isMobile ? 9 : 12 },
          padding: isMobile ? 4 : 10,
        },
        beginAtZero: true,
      },
    },

    interaction: { mode: "index", intersect: false },

    elements: {
      line: {
        borderJoinStyle: "round",
      },
      point: {
        radius: isMobile ? 3 : 6,                  // smaller dots on mobile
        hoverRadius: isMobile ? 5 : 8,
      },
    },
  };

  const formatMinutesToHM = (minutes) => {
    if (!minutes || isNaN(minutes)) return "00:00";

    const totalMinutes = Math.floor(Number(minutes));
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b pl-0 md:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full p-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 mx-2">
              <h1 className="text-xl text-center md:text-start md:text-2xl font-bold  text-forestGreen">
                Time-Based Analytics
              </h1>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {role == "admin" && (
                <div className="hidden sm:inline-flex flex gap-4">
                  <select
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
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
                onClick={() => navigate("/admin/dashboard")}
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
                className="w-full flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
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
        {
          !data ||
            !data.data ||
            !Array.isArray(data.data) ||
            data.data.length === 0 ? (
            <div className="bg-white border border-yellow-200 rounded-xl p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Info className="w-6 h-6 text-yellow-500" />
                </div>
                <h2 className="text-xl font-bold text-yellow-700">
                  No Data Available
                </h2>
              </div>
              <p className="text-gray-700">
                There are no time-based analytics records to display at the
                moment.
              </p>
              <button
                className="mt-6 px-4 py-2 bg-lightGreen text-forestGreen rounded-lg hover:bg-lightGreen transition-colors"
                onClick={() => navigate(-1)}
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 gap-8">
              {/* Insights Cards */}
              <div
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-500 ease-out ${animateContent
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
                  }`}
                style={{ transitionDelay: "50ms" }}
              >
                {/* Total Courses */}
                <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border border-leafGreen/20 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Total Courses
                      </p>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">
                        {totalCourses}
                      </h3>
                    </div>
                    <div className="bg-lightGreen p-2 rounded-lg">
                      <Clock className="w-6 h-6 text-leafGreen" />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Courses with time data
                  </div>
                </div>

                {/* Total Students */}
                <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border border-leafGreen/20 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Total Students
                      </p>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">
                        {totalStudents}
                      </h3>
                    </div>
                    <div className="bg-lightGreen p-2 rounded-lg">
                      <Users className="w-6 h-6 text-leafGreen" />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Students across all courses
                  </div>
                </div>

                {/* Average Time Difference */}
                <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border border-leafGreen/20 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Avg. Time Difference
                      </p>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">
                        {formatMinutesToHM(Math.abs(averageDifference))} hrs
                      </h3>
                    </div>
                    <div
                      className={`p-2 rounded-lg ${averageDifference > 0 ? "bg-red-100" : "bg-lightGreen"
                        }`}
                    >
                      {averageDifference > 0 ? (
                        <TrendingUp className="w-6 h-6 text-red-600" />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-leafGreen" />
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {averageDifference > 0
                      ? "Courses take longer than estimated"
                      : "Courses take less time than estimated"}
                  </div>
                </div>

                {/* Percentage Difference */}
                <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border border-leafGreen/20 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Avg. % Difference
                      </p>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">
                        {Math.abs(averagePercentageDiff).toFixed(1)}%
                      </h3>
                    </div>

                    <div
                      className={`p-2 rounded-lg ${averagePercentageDiff > 0 ? "bg-red-100" : "bg-green-100"
                        }`}
                    >
                      {averagePercentageDiff > 0 ? (
                        <TrendingUp className="w-6 h-6 text-red-600" />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Average percentage difference from estimates
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div
                className={`transition-all duration-500 ease-out ${animateContent
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
                  }`}
                style={{ transitionDelay: "100ms" }}
              >
                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                  <button
                    className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === "chart"
                      ? "text-leafGreen border-b-2 border-leafGreen"
                      : "text-gray-500 hover:text-gray-700"
                      }`}
                    onClick={() => setActiveTab("chart")}
                  >
                    Chart View
                  </button>
                  <button
                    className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === "table"
                      ? "text-leafGreen border-b-2 border-leafGreen"
                      : "text-gray-500 hover:text-gray-700"
                      }`}
                    onClick={() => setActiveTab("table")}
                  >
                    Table View
                  </button>
                </div>

                {/* Chart View */}
                {activeTab === "chart" && (
                  <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-all">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                      <div>
                        <h2 className="text-md sm:text-xl font-bold text-gray-800">
                          Estimated vs Actual Completion Times
                        </h2>
                        <p className="text-gray-500 text-xs sm:text-sm mt-1">
                          Comparison of estimated course hours versus average actual
                          completion times
                        </p>
                      </div>
                    </div>
                    <div className="h-[400px] w-full">
                      <Line data={chartData} options={options} />
                    </div>
                  </div>
                )}

                {/* Table View */}
                {activeTab === "table" && (
                  <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-md sm:text-xl font-bold text-gray-800">
                          Course Completion Times
                        </h2>
                        <p className="text-gray-500 text-xs sm:text-sm mt-1">
                          Detailed breakdown of all courses
                        </p>
                      </div>
                    </div>
                    <div
                      className="overflow-y-auto custom-scrollbar"
                      style={{ height: "400px", width: "inherit" }}
                    >
                      {/* Desktop Table */}
                      <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Course Title
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Estimated Hours
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Actual Hours
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Difference
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Students
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {coursesWithDifference.map((course, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 grid">
                                <span className="truncate">{course.course_title}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatMinutesToHM(Math.abs(course.estimated_hours))} hrs
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatMinutesToHM(Math.abs(course.average_actual_hours))} hrs
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${course.difference > 0
                                    ? "bg-red-100 text-red-800"
                                    : course.difference < 0
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                    }`}
                                >
                                  {formatMinutesToHM(Math.abs(course.difference))} hrs (
                                  {Math.abs(course.percentageDiff).toFixed(1)}%)
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {course.student_count}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Mobile Grid */}
                      <div className="sm:hidden space-y-4">
                        {coursesWithDifference.map((course, index) => (
                          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                            {/* Course Name Row */}
                            <div className="text-sm font-medium text-gray-900">
                              {course.course_title}
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <div className="text-xs text-gray-500 uppercase">Estimated Hours</div>
                                <div className="text-gray-700">{formatMinutesToHM(Math.abs(course.estimated_hours))} hrs</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 uppercase">Actual Hours</div>
                                <div className="text-gray-700">{formatMinutesToHM(Math.abs(course.average_actual_hours))} hrs</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 uppercase">Difference</div>
                                <span
                                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${course.difference > 0
                                    ? "bg-red-100 text-red-800"
                                    : course.difference < 0
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                    }`}
                                >
                                  {formatMinutesToHM(Math.abs(course.difference))} hrs (
                                  {Math.abs(course.percentageDiff).toFixed(1)}%)
                                </span>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 uppercase">Students</div>
                                <div className="text-gray-700">{course.student_count}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <style >{`
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
                )}
              </div>

              {/* Insights Section */}
              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-500 ease-out ${animateContent
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
                  }`}
                style={{ transitionDelay: "150ms" }}
              >
                {/* Most Underestimated Course */}
                {mostUnderestimated && (
                  <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-green-100 hover:shadow-lg transition-all">
                    <div className="flex items-start gap-4">
                      <div className="bg-green-100 p-3 rounded-full">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                          Most Underestimated Course
                        </h3>
                        <p className="text-gray-500 text-xs sm:text-sm mt-1">
                          This course took significantly longer than estimated
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">
                          {mostUnderestimated.course_title}
                        </h4>
                        <div className="grid grid-cols-2 gap-4 mt-3 text-sm sm:text-md">
                          <div>
                            <p className="text-sm text-gray-500">Estimated</p>
                            <p className="text-md sm:text-lg font-medium text-leafGreen">
                              {formatMinutesToHM(Math.abs(mostUnderestimated.estimated_hours))} hrs
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Actual</p>
                            <p className="text-md sm:text-lg font-medium text-leafGreen">
                              {formatMinutesToHM(Math.abs(mostUnderestimated.average_actual_hours))} hrs
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Difference</p>
                            <p className="text-md sm:text-lg font-medium text-leafGreen">
                              {formatMinutesToHM(Math.abs(mostUnderestimated.difference))}{" "}hrs
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">Students</p>
                            <p className="text-md sm:text-lg font-medium text-gray-700">
                              {mostUnderestimated.student_count}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Most Overestimated Course */}
                {mostOverestimated && (
                  <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-green-100 hover:shadow-lg transition-all">
                    <div className="flex items-start gap-4">
                      <div className="bg-green-100 p-3 rounded-full">
                        <TrendingDown className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                          Most Overestimated Course
                        </h3>
                        <p className="text-gray-500 text-xs sm:text-sm mt-1">
                          This course took significantly less time than estimated
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">
                          {mostOverestimated.course_title}
                        </h4>
                        <div className="grid grid-cols-2 gap-4 mt-3 text-sm sm:text-md">
                          <div>
                            <p className="text-sm text-gray-500">Estimated</p>
                            <p className="text-md sm:text-lg font-medium text-leafGreen">
                              {formatMinutesToHM(Math.abs(mostOverestimated.estimated_hours))} hrs
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Actual</p>
                            <p className="text-md sm:text-lg font-medium text-leafGreen">
                              {formatMinutesToHM(Math.abs(mostOverestimated.average_actual_hours))} hrs
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Difference</p>
                            <p className="text-md sm:text-lg font-medium text-green-600">
                              {formatMinutesToHM(Math.abs(mostOverestimated.difference))}{" "}hrs
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">Students</p>
                            <p className="text-md sm:text-lg font-medium text-gray-700">
                              {mostOverestimated.student_count}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        }
      </div>
    </div>
  );
};

export default TimeBasedAnalytics;
