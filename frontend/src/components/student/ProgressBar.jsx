/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
// src/components/student/ProgressBar.js
import React from "react";

const ProgressBar = ({ completionPercentage }) => {
  // Format percentage to 2 decimal places
  const formattedPercentage = parseFloat(completionPercentage).toFixed(0);

  // Determine the color based on completion percentage
  const getColorGradient = () => {
    if (completionPercentage < 25) return "from-rose-400 to-red-300";
    if (completionPercentage < 50) return "from-amber-300 to-orange-300";
    if (completionPercentage < 75) return "from-blue-300 to-indigo-400";
    return "from-green-400 to-emerald-500";
  };

  // Calculate the status text
  const getStatusText = () => {
    if (completionPercentage < 25) return "Just Started";
    if (completionPercentage < 50) return "In Progress";
    if (completionPercentage < 75) return "Almost There";
    if (completionPercentage < 100) return "Nearly Complete";
    return "Completed";
  };

  // Get icon based on progress
  const getStatusIcon = () => {
    if (completionPercentage < 25) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      );
    } else if (completionPercentage < 50) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    } else if (completionPercentage < 100) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
  };

  return (
    <div className="w-full mb-6">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center text-sm font-medium">
          {getStatusIcon()}
          <span className="text-gray-700">{getStatusText()}</span>
        </div>
        <span className="text-sm text-gray-500 font-medium">
          {formattedPercentage}% Complete
        </span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${getColorGradient()} transition-all duration-500 rounded-full`}
          style={{ width: `${completionPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;