/* eslint-disable react/prop-types */
"use client";

import { useState, useEffect } from "react";
import {
  useGetRevenueByCourseCategoryQuery,
  useGetCustomerLifetimeValueQuery,
  useGetOverallRevenueQuery,
} from "../../../services/Reporting/revenueFinanceAnalyticsApi";
import { getAdminToken } from "../../../services/CookieService";
import {
  IndianRupee,
  TrendingUp,
  Users,
  CreditCard,
  PieChart,
  UserCheck,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import RevenueAnalyticsGraph from "../../../components/admin/Analytics/RevenueAnalyticsGraph";
import { useGetPartnersQuery } from '../../../services/Become_partner/becomePartnerApi'
import AdminLoader from "../../../components/admin/AdminLoader";

const MetricCard = ({ title, value, icon, color }) => (
  <div
    className={`bg-white rounded-xl shadow-md p-4 sm:p-5 border border-${color}-100 hover:shadow-lg transition-all`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{value}</h3>
      </div>
      <div className={`bg-${color}-100 p-2 rounded-lg`}>{icon}</div>
    </div>
    <div className="mt-2 text-xs text-gray-500">
      {title === "Revenue Growth" ? "Coming soon" : ""}
    </div>
  </div>
);

const CategoryRevenueCard = ({ category, enrollments, revenue, index }) => {
  const colors = ["indigo", "blue", "purple", "green", "orange", "red"];

  const color = colors[index % colors.length];

  return (
    <div
      className={`bg-white rounded-xl shadow-md p-4 sm:p-5 border border-${color}-100 hover:shadow-lg transition-all`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{category}</h3>
        <div className={`bg-${color}-100 p-2 rounded-lg`}>
          <PieChart className="w-5 h-5 text-${color}-600" />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Enrollments</p>
          <p className="text-xl font-bold text-gray-800">{enrollments}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-xl font-bold text-gray-800">
            ₹{revenue.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

const CustomerValueCard = ({ name, email, revenue, index }) => {
  const colors = ["blue", "purple", "pink", "emerald", "indigo", "yellow"];

  const color = colors[index % colors.length];

  return (
    <div
      className={`bg-white border border-gray-300 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full  from-${color}-500 to-${color}-600 flex items-center justify-center text-white font-bold`}
          >
            {name.charAt(0)}
          </div>
          <div className="ml-3">
            <h3 className="font-medium text-gray-900">{name}</h3>
            <p className="text-sm text-gray-600">{email}</p>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full  from-${color}-500 to-${color}-600 text-white text-sm font-medium`}
        >
          ₹{revenue.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

const RevenueAnalytics = () => {
  const { access_token } = getAdminToken();
  const [isLoadings, setIsLoading] = useState(true);
  const [animateContent, setAnimateContent] = useState(false);
  const [animateHeader, setAnimateHeader] = useState(false);
  const navigate = useNavigate();
  const { id, role } = useSelector((state) => state.user);

  const [userType, setUserType] = useState("all");
  const [selectedPartner, setSelectedPartner] = useState("all");
  const { data: partnersData, isLoading: loadingPartners } = useGetPartnersQuery({ limit: 'all', access_token });

  useEffect(() => {
    window.scrollTo(0, 0);

    // if (!id) {
    //   navigate("/dashboard");
    // }

    // Initial loading state
    setTimeout(() => {
      setIsLoading(false);
      // Start header animation
      setTimeout(() => setAnimateHeader(true), 100);
      // Start content animation
      setTimeout(() => setAnimateContent(true), 300);
    }, 500);
  }, [id, navigate]);

  const { data: overallRevenueData } = useGetOverallRevenueQuery({
    access_token,
    user_type: userType,
    partner_id: selectedPartner,
  });

  const {
    data: revenueByCategory,
    isLoading: loadingCategory,
    error: errorCategory,
  } = useGetRevenueByCourseCategoryQuery({
    access_token,
    user_type: userType,
    partner_id: selectedPartner,
  });

  const {
    data: customerLifetimeValue,
    isLoading: loadingCLV,
    error: errorCLV,
  } = useGetCustomerLifetimeValueQuery({
    access_token,
    user_type: userType,
    partner_id: selectedPartner
  });

  const isLoading = loadingCategory || loadingCLV || isLoadings;

  const error = errorCategory || errorCLV;

  const formatRevenue = (value) => {
    if (value === null || value === undefined) return "Not available";
    return `₹${value.toLocaleString()}`;
  };

  if (isLoading) {
    return <AdminLoader className="h-screen" message="Analyzing revenue data..." />;
  }

  if (error) {
    return (
      <div className="p-6 max-w-full mx-10 bg-white min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600 shadow-lg max-w-3xl mx-auto">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Error Loading Data
          </h2>
          <p>{error.message || "Failed to load revenue analytics"}</p>
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

  // Extract and structure data
  const totalRevenue = overallRevenueData.data.reduce((sum, item) => sum + item.revenue, 0) || 0;

  const totalEnrollments =
    revenueByCategory?.data.reduce(
      (sum, item) => sum + item.total_enrollments,
      0
    ) || 0;
  const avgRevenuePerUser =
    customerLifetimeValue?.data.length > 0
      ? customerLifetimeValue?.data.reduce(
        (sum, item) => sum + item.total_revenue,
        0
      ) / customerLifetimeValue?.data.length
      : 0;

  // Calculate revenue growth (placeholder - would need historical data)
  const revenueGrowth = "Coming soon";

  // Sort categories by revenue for display
  const sortedCategories = [...(revenueByCategory?.data || [])].sort(
    (a, b) => b.total_revenue - a.total_revenue
  );

  // Sort customers by lifetime value
  const topCustomers = [...(customerLifetimeValue?.data || [])].sort(
    (a, b) => b.total_revenue - a.total_revenue
  );

  return (
    <div className="flex flex-col h-screen w-screen lg:w-[calc(100vw-80px)] bg-white">
      {/* Header */}
      <div className="bg-white border-b pl-0 md:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full p-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 mx-2">
              <h1 className="text-xl text-center md:text-start md:text-2xl font-bold  text-forestGreen">
                Revenue & Finance Analytics
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

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Summary Cards */}
        <div className={`w-full mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-500 ease-out ${animateContent
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-10"
          }`}
          style={{ transitionDelay: "100ms" }}
        >
          <MetricCard
            title="Total Revenue"
            value={formatRevenue(totalRevenue)}
            icon={<IndianRupee className="w-5 h-5 text-indigo-600" />}
            color="indigo"
          />
          <MetricCard
            title="Total Enrollments"
            value={totalEnrollments}
            icon={<Users className="w-5 h-5 text-forestGreen" />}
            color="blue"
          />
          <MetricCard
            title="Avg. Revenue/User"
            value={formatRevenue(avgRevenuePerUser)}
            icon={<CreditCard className="w-5 h-5 text-leafGreen" />}
            color="purple"
          />
          <MetricCard
            title="Revenue Growth"
            value={revenueGrowth}
            icon={<TrendingUp className="w-5 h-5 text-green-600" />}
            color="green"
          />
        </div>

        {/* Revenue by Category */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-300 transform">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-500" /> Revenue by Category
          </h2>

          {/* Horizontally scrollable container with single row */}
          <div className="overflow-x-auto pb-4 scrollbar-hide">
            {sortedCategories.length > 0 ? (
              <div
                className="flex gap-4 min-w-full"
                style={{ display: "flex", flexWrap: "nowrap" }}
              >
                {sortedCategories.map((category, index) => (
                  <div
                    className="min-w-[300px] flex-shrink-0"
                    key={category.category_id}
                  >
                    <CategoryRevenueCard
                      category={category.category_name}
                      enrollments={category.total_enrollments}
                      revenue={category.total_revenue}
                      index={index}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full text-gray-500">
                <PieChart className="w-12 h-12 mb-2" />
                <p>No revenue data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Customers by Lifetime Value */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-300 transform">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-500" /> Top Customers by Lifetime Value
          </h2>

          {/* Scrollable container with fixed height for 2 rows */}
          <div className="overflow-x-auto pb-4 scrollbar-hide">
            {topCustomers.length > 0 ? (
              <div
                className="grid grid-flow-col auto-cols-max gap-4"
                style={{
                  display: "grid",
                  gridTemplateRows: "repeat(2, 1fr)",
                  gridAutoFlow: "column",
                  gridAutoColumns: "minmax(300px, 1fr)",
                }}
              >
                {topCustomers.map((customer, index) => (
                  <CustomerValueCard
                    key={customer.user_id}
                    name={customer.full_name}
                    email={customer.email}
                    revenue={customer.total_revenue}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full text-gray-500">
                <UserCheck className="w-12 h-12 mb-2" />
                <p>No customer data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Revenue Analytics */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-300 transform">
          <RevenueAnalyticsGraph
            userType={userType}
            selectedPartner={selectedPartner}
          />
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalytics;
