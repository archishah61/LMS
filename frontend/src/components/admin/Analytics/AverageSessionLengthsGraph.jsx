import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useGetAverageSessionLengthsQuery } from '../../../services/Reporting/userEngagementAnalyticsApi';
import { getAdminToken } from '../../../services/CookieService';
import { BookOpen, Users } from "lucide-react";
import { motion } from "framer-motion";

// Manual implementation of Select component
const Select = ({ value, onChange, options, placeholder }) => (
  <select
    className="px-3 py-2 border border-gray-300 rounded-md bg-white"
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

const AverageSessionLengthsGraph = ({ userType, selectedPartner }) => {
  const [selectedView, setSelectedView] = useState('user');
  const { access_token } = getAdminToken();

  const { data: sessionData, isLoading } = useGetAverageSessionLengthsQuery({
    access_token,
    user_type: userType,
    partner_id: selectedPartner
  });

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (sessionData?.success) {
      let data = [];
      if (selectedView === 'user') {
        data = sessionData.data.averageSessionPerUser.map(item => ({
          name: item.userName,
          averageSessionLength: parseFloat(item.averageSessionLength),
          totalSessions: item.totalSessions,
          totalDuration: item.totalDuration
        }));
      } else if (selectedView === 'course') {
        data = sessionData.data.averageSessionPerCourse.map(item => ({
          name: item.courseTitle,
          averageSessionLength: parseFloat(item.averageSessionLength),
          totalSessions: item.totalSessions,
          totalDuration: item.totalDuration
        }));
      } else if (selectedView === 'userCourse') {
        data = sessionData.data.averageSessionPerUserCourse.map(item => ({
          name: `${item.userName} - ${item.courseTitle}`,
          averageSessionLength: parseFloat(item.averageSessionLength),
          totalSessions: item.totalSessions,
          totalDuration: item.totalDuration
        }));
      } else if (selectedView === 'overallCourse') {
        data = sessionData.data.overallAverageSessionPerCourse.map(item => ({
          name: item.courseTitle,
          averageSessionLength: parseFloat(item.averageSessionLength),
          totalSessions: item.totalSessions,
          totalDuration: item.totalDuration
        }));
      }

      // Filter out entries with zero session length
      setChartData(data.filter(entry => entry.averageSessionLength > 0));
    }
  }, [selectedView, sessionData]);

  const formatSecondsToMS = (seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00";

    const totalSeconds = Math.floor(Number(seconds));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const renderChart = () => {
    if (isLoading || !chartData || chartData.length === 0) {
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
            <BookOpen className="w-12 h-12 mb-2" />
          </motion.div>
          <p className="text-lg">No session data available for this view</p>
        </motion.div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45}
            textAnchor="end"
            interval={0}
            height={0}
            tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
          />
          <YAxis width={30} tick={{ fontSize: 14 }} />
          <Tooltip formatter={(value) => [`${formatSecondsToMS(value)} min`, 'Average Session Length']} />
          <Bar dataKey="averageSessionLength" fill="#58cb9b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="mt-10 flex flex-col">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-300 transform">
        <h2 className="text-lg font-bold mb-2 sm:mb-4 text-gray-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-leafGreen" /> Average Session Lengths
        </h2>

        <p className="text-gray-600 mb-4 sm:mb-8 ml-1 text-sm sm:text-lg">Track average session lengths across different views</p>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4 sm:mb-8">
          <Select
            value={selectedView}
            onChange={setSelectedView}
            options={[
              { value: 'user', label: 'By User' },
              { value: 'course', label: 'By Course' },
              { value: 'userCourse', label: 'By User and Course' },
              { value: 'overallCourse', label: 'Overall By Course' }
            ]}
            placeholder="Select view"
          />
        </div>

        {/* Chart */}
        <div className="mt-4">{renderChart()}</div>
      </div>
    </div>
  );
};

export default AverageSessionLengthsGraph;
