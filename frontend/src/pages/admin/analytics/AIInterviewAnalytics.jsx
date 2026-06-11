"use client";

import { useState, useEffect } from "react";
import {
  useGetOverallPerformanceQuery,
  useGetCategoryRoleAnalyticsQuery,
  useGetQuestionLevelInsightsQuery,
  useGetTimeBasedAnalyticsQuery,
  useGetResponseQualityMetricsQuery,
  useGetAdminDashboardVisualizationsQuery,
  useGetUserPerformanceSummaryQuery,
  useGetTopBottomUsersByCategoryQuery,
  useGetOverallTopBottomPerformersQuery,
} from "../../../services/Reporting/aiInterviewAnalyticsApi";
import { getAdminToken } from "../../../services/CookieService";
import { Bar, Line, Pie } from "react-chartjs-2";
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
import { useNavigate } from "react-router-dom";
import Modal from "./Modal";
import Table from "./Table";
import MetricCard from "./MetricCard";
import Section from "./Section";
import ChartContainer from "./ChartContainer";
import TabNavigation from "./TabNavigation";
import {
  formatHistogramData,
  formatCategoryBarData,
  formatRoleBarData,
  formatTimeLineData,
  formatResponseBarData,
  formatCommonCategoriesPie,
  formatCommonRolesPie,
  barLineChartOptions,
  pieChartOptions
} from "./helpers";
import AdminLoader from "../../../components/admin/AdminLoader";
import { AlertTriangle, ArrowLeft, Award, BarChart3, Calendar, MessageSquare, PieChart, Star, Target, Users } from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, BarElement);

const AIInterviewAnalytics = () => {
  const { access_token } = getAdminToken();
  const [role, setRole] = useState("");
  const [category, setCategory] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedModal, setSelectedModal] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const navigate = useNavigate();

  const { data: overall, isLoading: loadingOverall } = useGetOverallPerformanceQuery({ access_token });
  const { data: categoryRole, isLoading: loadingCategoryRole } = useGetCategoryRoleAnalyticsQuery({ access_token });
  const { data: questionInsights, isLoading: loadingQuestionInsights } = useGetQuestionLevelInsightsQuery({ access_token });
  const { data: timeBased, isLoading: loadingTimeBased } = useGetTimeBasedAnalyticsQuery({
    access_token,
    period: selectedMonth || selectedYear || selectedPeriod
  });

  const { data: responseQuality, isLoading: loadingResponseQuality } = useGetResponseQualityMetricsQuery({ access_token });
  const { data: adminDashboard, isLoading: loadingAdminDashboard } = useGetAdminDashboardVisualizationsQuery({
    access_token,
    role,
    category,
    startDate: dateRange.start,
    endDate: dateRange.end,
  });
  const { data: userSummary, isLoading: loadingUserSummary } = useGetUserPerformanceSummaryQuery({ access_token });
  const { data: topBottomByCat, isLoading: loadingTopBottomCat } = useGetTopBottomUsersByCategoryQuery({ access_token });
  const { data: overallTopBottom, isLoading: loadingOverallTB } = useGetOverallTopBottomPerformersQuery({ access_token });

  const isLoading = [
    loadingOverall,
    loadingCategoryRole,
    loadingQuestionInsights,
    loadingTimeBased,
    loadingResponseQuality,
    loadingAdminDashboard,
    loadingUserSummary,
    loadingTopBottomCat,
    loadingOverallTB,
  ].some(Boolean);

  const histogramData = formatHistogramData(overall);
  const categoryBarData = formatCategoryBarData(categoryRole);
  const roleBarData = formatRoleBarData(categoryRole);
  const timeLineData = formatTimeLineData(timeBased);
  const responseBarData = formatResponseBarData(responseQuality);
  const commonCategoriesPie = formatCommonCategoriesPie(categoryRole);
  const commonRolesPie = formatCommonRolesPie(categoryRole);

  const topPerformersTable = adminDashboard?.topPerformers?.map((p) => ({
    full_name: p.user?.full_name ?? "-",
    avgScore: (+p.avgScore).toFixed(2),
  }));

  const bottomPerformersTable = adminDashboard?.bottomPerformers?.map((p) => ({
    full_name: p.user?.full_name ?? "-",
    avgScore: (+p.avgScore).toFixed(2),
  }));

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 10,
          font: {
            size: 12,
            family: "Inter, sans-serif",
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.95)",
        titleColor: "#F9FAFB",
        bodyColor: "#F9FAFB",
        borderColor: "#374151",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(156, 163, 175, 0.1)",
        },
        ticks: {
          color: "#6B7280",
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: "rgba(156, 163, 175, 0.1)",
        },
        ticks: {
          color: "#6B7280",
          font: {
            size: 11,
          },
        },
      },
    },
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    setSelectedMonth(null);
    setSelectedYear(null);
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(`month=${month}`);
  };

  const handleYearChange = (year) => {
    setSelectedYear(`year=${year}`);
  };

  if (isLoading) {
    return <AdminLoader className="h-screen" message="Analyzing AI interview data..." />;
  }

  return (
    <div className="flex flex-col h-screen w-screen lg:w-[calc(100vw-80px)] bg-white">
      {/* Header */}
      <div className="bg-white border-b pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full p-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 mx-2">
              <h1 className="text-xl text-center md:text-start md:text-2xl font-bold  text-forestGreen">
                AI Interview<span className="hidden sm:inline"> Analytics</span>
              </h1>
              <p className="text-sm text-center md:text-start md:text-lg text-gray-600 mt-1">
                Comprehensive performance insights<span className="hidden sm:inline"> and metrics</span>
              </p>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 sm:px-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Back</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-4">
            <MetricCard
              title="Total Interviews"
              value={overall?.data[0].totalInterviews ?? 0}
              icon={MessageSquare}
              color="indigo"
            />
            <MetricCard
              title="Average Score"
              value={overall?.data[0].averageScore ?? 0}
              icon={Target}
              color="green"
            />
            <MetricCard
              title="Pass Rate"
              value={overall?.data[0].passRate ?? "0%"}
              icon={Award}
              color="blue"
            />
            <MetricCard
              title="Fail Rate"
              value={
                overall && overall.data[0].totalInterviews > 0
                  ? (100 - parseFloat(overall.data[0].passRate)).toFixed(2) + "%"
                  : "0%"
              } icon={AlertTriangle}
              color="orange"
            />
            <MetricCard
              title="Top Category"
              value={categoryRole?.commonCategories?.[0]?.category ?? "-"}
              icon={Star}
              color="purple"
            />
            <MetricCard
              title="Total Users"
              value={userSummary?.users?.length ?? 0}
              icon={Users}
              color="teal"
            />
          </div>
        )}

        {(activeTab === "overview" || activeTab === "performance") && (
          <Section title="Score Distribution" icon={BarChart3} className="mb-4 sm:mb-6">
            <ChartContainer>
              {histogramData ? (
                <Bar data={histogramData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No histogram data available</p>
                  </div>
                </div>
              )}
            </ChartContainer>
          </Section>
        )}

        {(activeTab === "overview" || activeTab === "performance") && (
          <Section title="Category & Role Performance" icon={PieChart} className="mb-4 sm:mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Average Score by Category</h4>
                <ChartContainer height="300px">
                  {categoryBarData ? (
                    <Bar data={categoryBarData} options={barLineChartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">No category data</div>
                  )}
                </ChartContainer>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Average Score by Role</h4>
                <ChartContainer height="300px">
                  {roleBarData ? (
                    <Bar data={roleBarData} options={barLineChartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">No role data</div>
                  )}
                </ChartContainer>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Most Common Categories</h4>
                <ChartContainer height="300px">
                  {commonCategoriesPie ? (
                    <Pie data={commonCategoriesPie} options={pieChartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No category distribution data
                    </div>
                  )}
                </ChartContainer>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Most Common Roles</h4>
                <ChartContainer height="300px">
                  {commonRolesPie ? (
                    <Pie data={commonRolesPie} options={pieChartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No role distribution data
                    </div>
                  )}
                </ChartContainer>
              </div>
            </div>
          </Section>
        )}

        {activeTab === "insights" && (
          <Section title="Question-Level Insights" icon={MessageSquare} className="mb-4 sm:mb-8">
            <div className="space-y-4 sm:space-y-6">
              <Table
                data={questionInsights?.mostChallenging}
                columns={["question", "avgScore", "count"]}
                title="Most Challenging Questions"
                showModal={true}
                setSelectedModal={setSelectedModal}
              />
              <Table
                data={questionInsights?.bestPerforming}
                columns={["question", "avgScore", "count"]}
                title="Best Performing Questions"
                showModal={true}
                setSelectedModal={setSelectedModal}
              />
            </div>
          </Section>
        )}

        {(activeTab === "overview" || activeTab === "insights") && (
          <Section title="Interview Trends Over Time" icon={Calendar} className={activeTab === "insights" ? `mb-4 sm:mb-6` : ""}>
            <div className="flex justify-between items-center sm:items-start sm:justify-start sm:flex-row gap-4 mb-4 sm:mb-8">
              <select
                onChange={(e) => handlePeriodChange(e.target.value)}
                value={selectedPeriod}
                className="p-2 border rounded w-full sm:w-auto"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
                <option value="overall">Overall</option>
              </select>
              {selectedPeriod === "month" && (
                <select
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="p-2 border rounded ml-2 w-full sm:w-auto"
                >
                  <option value="">Select a Month</option>
                  <option value="jan">January</option>
                  <option value="feb">February</option>
                  <option value="mar">March</option>
                  <option value="apr">April</option>
                  <option value="may">May</option>
                  <option value="jun">June</option>
                  <option value="jul">July</option>
                  <option value="aug">August</option>
                  <option value="sep">September</option>
                  <option value="oct">October</option>
                  <option value="nov">November</option>
                  <option value="dec">December</option>
                </select>
              )}
              {selectedPeriod === "year" && (
                <select
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="p-2 border rounded ml-2 w-full sm:w-auto"
                >
                  <option value="">Select a Year</option>
                  {Array.from({ length: 31 }, (_, i) => 2020 + i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <ChartContainer>
              {timeLineData ? (
                <Line data={timeLineData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No time-based data available</p>
                  </div>
                </div>
              )}
            </ChartContainer>
          </Section>
        )}

        {activeTab === "insights" && (
          <Section title="Response Quality Metrics" icon={Target}>
            <ChartContainer>
              {responseBarData ? (
                <Bar data={responseBarData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No response quality data</div>
              )}
            </ChartContainer>
          </Section>
        )}

        {activeTab === "performance" && (
          <Section title="Top & Bottom Performers" icon={Award}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Table
                data={topPerformersTable}
                columns={["full_name", "avgScore"]}
                title="Top Performers"
                showModal={true}
                setSelectedModal={setSelectedModal}
              />
              <Table
                data={bottomPerformersTable}
                columns={["full_name", "avgScore"]}
                title="Bottom Performers"
                showModal={true}
                setSelectedModal={setSelectedModal}
              />
            </div>
          </Section>
        )}

        {activeTab === "users" && (
          <div className="space-y-4 sm:space-y-6">
            <Section title="User Performance Summary" icon={Users}>
              <Table
                data={userSummary?.users?.map((u) => ({
                  full_name: u.user.full_name,
                  averageScore: (+u.averageScore).toFixed(2),
                  bestScore: u.bestScore,
                  bestScoreCategory: u.bestScoreCategory,
                  worstScore: u.worstScore,
                  worstScoreCategory: u.worstScoreCategory,
                }))}
                columns={[
                  "full_name",
                  "averageScore",
                  "bestScore",
                  "bestScoreCategory",
                  "worstScore",
                  "worstScoreCategory",
                ]}
                title="Detailed User Statistics"
                showModal={true}
                setSelectedModal={setSelectedModal}
              />
            </Section>

            <Section title="Category-wise Performance Leaders" icon={Star}>
              <Table
                data={topBottomByCat?.categoryWiseTopBottom?.map((c) => ({
                  category: c.category,
                  topPerformer: c.topPerformer?.full_name ?? "-",
                  topAvg: c.topPerformer ? (+c.topPerformer.avgScore).toFixed(2) : "-",
                  bottomPerformer: c.bottomPerformer?.full_name ?? "-",
                  bottomAvg: c.bottomPerformer ? (+c.bottomPerformer.avgScore).toFixed(2) : "-",
                }))}
                columns={["category", "topPerformer", "topAvg", "bottomPerformer", "bottomAvg"]}
                title="Best & Worst Performers by Category"
                showModal={true}
                setSelectedModal={setSelectedModal}
              />
            </Section>

            <Section title="Overall Rankings" icon={Award}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Table
                  data={overallTopBottom?.topPerformers?.map((u) => ({
                    user: u.user.full_name,
                    avgScore: (+u.avgScore).toFixed(2),
                    rank: "🏆 Top",
                  }))}
                  columns={["user", "avgScore", "rank"]}
                  title="Overall Top Performers"
                  showModal={true}
                  setSelectedModal={setSelectedModal}
                />
                <Table
                  data={overallTopBottom?.bottomPerformers?.map((u) => ({
                    user: u.user.full_name,
                    avgScore: (+u.avgScore).toFixed(2),
                    rank: "📉 Bottom",
                  }))}
                  columns={["user", "avgScore", "rank"]}
                  title="Overall Bottom Performers"
                  showModal={true}
                  setSelectedModal={setSelectedModal}
                />
              </div>
            </Section>
          </div>
        )}
      </div>

      <Modal
        isOpen={selectedModal !== null}
        onClose={() => setSelectedModal(null)}
        title={selectedModal?.title || "Details"}
      >
        {selectedModal?.type === "table" && (
          <Table data={selectedModal.data} columns={selectedModal.columns} title="" />
        )}
      </Modal>
    </div>
  );
};

export default AIInterviewAnalytics;