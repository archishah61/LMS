/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import {
  useGetTodaysRevenueQuery,
  useGetThisWeeksRevenueQuery,
  useGetMonthlyRevenueQuery,
  useGetYearlyRevenueQuery,
  useGetOverallRevenueQuery
} from '../../../services/Reporting/revenueFinanceAnalyticsApi';
import { getAdminToken } from '../../../services/CookieService';
import { IndianRupee } from "lucide-react";
import { motion } from "framer-motion";

// Manual implementation of Select component
const Select = ({ value, onChange, options, placeholder, className }) => (
  <select
    className={`px-3 py-2 border border-gray-300 rounded-md bg-white ${className}`}
    value={value}
    onChange={(e) => onChange(e.target.value)}
  >
    <option value="" disabled>{placeholder}</option>
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

const RevenueAnalyticsGraph = ({ userType, selectedPartner }) => {
  const [selectedView, setSelectedView] = useState('day');
  const [selectedMonth, setSelectedMonth] = useState('May');
  const [selectedYear, setSelectedYear] = useState('2025');

  const { access_token } = getAdminToken();

  const { data: todaysRevenueData } = useGetTodaysRevenueQuery({
    access_token,
    user_type: userType,
    partner_id: selectedPartner,
  });

  const { data: thisWeeksRevenueData } = useGetThisWeeksRevenueQuery(
    {
      access_token,
      user_type: userType,
      partner_id: selectedPartner,
    },
    { skip: selectedView !== 'week' }
  );

  const shortToFullMonthMap = {
    Jan: 'January',
    Feb: 'February',
    Mar: 'March',
    Apr: 'April',
    May: 'May',
    Jun: 'June',
    Jul: 'July',
    Aug: 'August',
    Sep: 'September',
    Oct: 'October',
    Nov: 'November',
    Dec: 'December',
  };

  const { data: monthlyRevenueData } = useGetMonthlyRevenueQuery(
    {
      access_token,
      month: shortToFullMonthMap[selectedMonth],
      user_type: userType,
      partner_id: selectedPartner,
    },
    { skip: selectedView !== 'month' }
  );

  const { data: yearlyRevenueData } = useGetYearlyRevenueQuery(
    {
      access_token,
      year: selectedYear,
      user_type: userType,
      partner_id: selectedPartner,
    },
    { skip: selectedView !== 'year' }
  );

  const { data: overallRevenueData } = useGetOverallRevenueQuery(
    {
      access_token,
      user_type: userType,
      partner_id: selectedPartner,
    },
    { skip: selectedView !== 'overall' }
  );

  const [chartData, setChartData] = useState([]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString());

  useEffect(() => {
    if (selectedView === 'day' && todaysRevenueData?.success) {
      setChartData(todaysRevenueData.data.map(item => ({
        hour: item.hour,
        revenue: item.revenue
      })));
    } else if (selectedView === 'week' && thisWeeksRevenueData?.success) {
      setChartData(thisWeeksRevenueData.data.map(item => ({
        day: item.day,
        revenue: item.revenue
      })));
    } else if (selectedView === 'month' && monthlyRevenueData?.success) {
      setChartData(monthlyRevenueData.data.map(item => ({
        date: `Day ${item.date}`,
        revenue: item.revenue
      })));
    } else if (selectedView === 'year' && yearlyRevenueData?.success) {
      setChartData(yearlyRevenueData.data.map(item => ({
        month: item.month,
        revenue: item.revenue
      })));
    } else if (selectedView === 'overall' && overallRevenueData?.success) {
      setChartData(overallRevenueData.data.map(item => ({
        year: item.year.toString(),
        revenue: item.revenue
      })));
    }
  }, [
    selectedView,
    todaysRevenueData,
    thisWeeksRevenueData,
    monthlyRevenueData,
    yearlyRevenueData,
    overallRevenueData,
    selectedMonth,
    selectedYear
  ]);

  const formatRevenue = (value) => {
    if (value === null || value === undefined) return 'Not available';
    return `₹${value.toLocaleString()}`;
  };

  const calculateTotalRevenue = () => {
    if (selectedView === 'day' && todaysRevenueData?.success) {
      return todaysRevenueData.data.reduce((sum, item) => sum + item.revenue, 0);
    } else if (selectedView === 'week' && thisWeeksRevenueData?.success) {
      return thisWeeksRevenueData.data.reduce((sum, item) => sum + item.revenue, 0);
    } else if (selectedView === 'month' && monthlyRevenueData?.success) {
      return monthlyRevenueData.data.reduce((sum, item) => sum + item.revenue, 0);
    } else if (selectedView === 'year' && yearlyRevenueData?.success) {
      return yearlyRevenueData.data.reduce((sum, item) => sum + item.revenue, 0);
    } else if (selectedView === 'overall' && overallRevenueData?.success) {
      return overallRevenueData.data.reduce((sum, item) => sum + item.revenue, 0);
    }
    return null;
  };

  const getAverageDailyRevenue = () => {
    const totalRevenue = calculateTotalRevenue();
    if (selectedView === 'day') {
      return formatRevenue(totalRevenue);
    } else if (selectedView === 'week') {
      return formatRevenue(Math.round(totalRevenue / 7));
    } else if (selectedView === 'month') {
      return formatRevenue(Math.round(totalRevenue / 30));
    } else if (selectedView === 'year') {
      return formatRevenue(Math.round(totalRevenue / 365));
    } else if (selectedView === 'overall') {
      return formatRevenue(Math.round(totalRevenue / 1000)); // Arbitrary for "overall"
    }
    return 'N/A';
  };

  const renderRevenueChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center justify-center h-64 text-gray-500"
        >
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 120 }}
          >
            <IndianRupee className="w-12 h-12 mb-2" />
          </motion.div>
          <p className="text-center text-md sm:text-lg">No revenue data available for this period</p>
        </motion.div>
      );
    }

    if (selectedView === 'day') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} labelFormatter={(label) => `Time: ${label}`} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#58cb9b" strokeWidth={2} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    } else if (selectedView === 'week' || selectedView === 'month' || selectedView === 'year') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={selectedView === 'week' ? 'day' : selectedView === 'month' ? 'date' : 'month'} />
            <YAxis />
            <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
            <Legend />
            <Bar dataKey="revenue" fill="#58cb9b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} labelFormatter={(label) => `Period: ${label}`} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#58cb9b" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <div className="bg-white flex flex-col rounded-2xl">
      <div className="w-full max-w-8xl bg-white mx-auto sm:px-4 rounded-2xl">
        {/* Header */}
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-leafGreen" /> Revenue Analytics
        </h2>

        <p className="text-gray-600 mb-4 sm:mb-8 ml-1 text-sm sm:text-md">Track your revenue across different time periods</p>

        {/* Controls */}
        <div className="flex justify-between items-center sm:items-start sm:justify-start sm:flex-row gap-4 mb-4 sm:mb-8">
          <Select
            className="w-full sm:w-auto"
            value={selectedView}
            onChange={setSelectedView}
            options={[
              { value: 'day', label: 'Today' },
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' },
              { value: 'overall', label: 'Overall' }
            ]}
            placeholder="Select time period"
          />
          {selectedView === 'month' && (
            <Select
              className="w-full sm:w-auto"
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={months.map((month) => ({ value: month, label: month }))}
              placeholder="Select month"
            />
          )}
          {selectedView === 'year' && (
            <Select
              className="w-full sm:w-auto"
              value={selectedYear}
              onChange={setSelectedYear}
              options={years.map((year) => ({ value: year, label: year }))}
              placeholder="Select year"
            />
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-lightGreen p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-xl md:text-2xl font-bold text-leafGreen">{formatRevenue(calculateTotalRevenue())}</p>
          </div>
          <div className="hidden md:block bg-lightGreen p-4 rounded-lg">
            <p className="text-sm text-gray-600">Time Period</p>
            <p className="text-xl font-semibold text-green-600">
              {selectedView === 'day' ? 'Today' :
                selectedView === 'week' ? 'This Week' :
                  selectedView === 'month' ? selectedMonth :
                    selectedView === 'year' ? selectedYear : 'Overall'}
            </p>
          </div>
          <div className="bg-lightGreen p-4 rounded-lg">
            <p className="text-sm text-gray-600">Average Daily</p>
            <p className="text-xl md:text-2xl font-bold text-leafGreen">{getAverageDailyRevenue()}</p>
          </div>
        </div>

        <div className="mt-4 sm:mt-6">{renderRevenueChart()}</div>
      </div>
    </div>
  );
};

export default RevenueAnalyticsGraph;