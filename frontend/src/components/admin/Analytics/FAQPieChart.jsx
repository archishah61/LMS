import React from "react";
import { Doughnut } from "react-chartjs-2";

const FAQPieChart = ({ question, options }) => {
  const data = {
    labels: options.map((option) => option.optionText),
    datasets: [
      {
        data: options.map((option) => option.percentage),
        backgroundColor: [
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
        ],
        borderWidth: 1,
      },
    ],
  };

  const optionsConfig = {
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 20,
          usePointStyle: true, // Use point style for legend items to save space
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.raw || 0;
            return `${label}: ${value}%`;
          },
        },
      },
    },
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10,
      },
    },
    maintainAspectRatio: false, // This allows the chart to not maintain aspect ratio and use the given dimensions
  };

  return (
    <div className="bg-white p-4 sm:p-6 border border-gray-100">
      <h3 className="text-sm sm:text-lg font-semibold mb-4">{question}</h3>
      <div className="w-full h-64"> {/* Fixed height and width */}
        <Doughnut data={data} options={optionsConfig} />
      </div>
    </div>
  );
};

export default FAQPieChart;