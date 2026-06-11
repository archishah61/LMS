export const formatHistogramData = (overall) => {
  return overall?.data[0].scoreHistogram
    ? {
      labels: ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-99", "100"],
      datasets: [
        {
          label: "Number of Interviews",
          data: overall?.data[0].scoreHistogram,
          backgroundColor: "rgba(99, 102, 241, 0.8)",
          borderColor: "rgba(99, 102, 241, 1)",
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    }
    : null
}

export const formatCategoryBarData = (categoryRole) => {
  return categoryRole?.avgByCategory
    ? {
      labels: categoryRole.avgByCategory.map((c) => c.category),
      datasets: [
        {
          label: "Average Score",
          data: categoryRole.avgByCategory.map((c) => Number(c.avgScore)),
          backgroundColor: "rgba(16, 185, 129, 0.8)",
          borderColor: "rgba(16, 185, 129, 1)",
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    }
    : null
}

export const formatRoleBarData = (categoryRole) => {
  return categoryRole?.avgByRole
    ? {
      labels: categoryRole.avgByRole.map((r) => r.role),
      datasets: [
        {
          label: "Average Score",
          data: categoryRole.avgByRole.map((r) => Number(r.avgScore)),
          backgroundColor: "rgba(59, 130, 246, 0.8)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    }
    : null
}

export const formatTimeLineData = (timeBased) => {
  if (!timeBased?.data || !Array.isArray(timeBased.data) || timeBased.data.length === 0) {
    return null;
  }

  const { period, data } = timeBased;
  let labels = [];
  let dataPoints = [];

  switch (true) {
    case period === "today":
      // Format: { "slot": "13-14", "count": 3 }
      labels = data.map(item => {
        const [startHour, endHour] = item.slot.split('-').map(Number);
        const startPeriod = startHour >= 12 ? 'PM' : 'AM';
        const endPeriod = endHour >= 12 ? 'PM' : 'AM';
        const displayStartHour = startHour === 0 ? 12 : startHour > 12 ? startHour - 12 : startHour;
        const displayEndHour = endHour === 0 ? 12 : endHour > 12 ? endHour - 12 : endHour;

        // For same period, show as "1-2 PM", for different periods show as "11 AM-1 PM"
        if (startPeriod === endPeriod) {
          return `${displayStartHour}-${displayEndHour} ${endPeriod}`;
        } else {
          return `${displayStartHour} ${startPeriod}-${displayEndHour} ${endPeriod}`;
        }
      });
      dataPoints = data.map(item => item.count);
      break;

    case period === "week":
      // Format: { "date": "2025-06-25", "count": 4 }
      labels = data.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
      });
      dataPoints = data.map(item => item.count);
      break;

    case period.startsWith("month="):
      // Format: { "date": "2025-06-25", "count": 4 }
      labels = data.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      });
      dataPoints = data.map(item => item.count);
      break;

    case period.startsWith("year="):
      // Format: { "month": "2025-03", "count": 1 }
      labels = data.map(item => {
        const [year, month] = item.month.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short'
        });
      });
      dataPoints = data.map(item => item.count);
      break;

    case period === "overall":
      // Format: { "year": 2025, "count": 10 }
      labels = data.map(item => item.year.toString());
      dataPoints = data.map(item => item.count);
      break;

    default:
      // Fallback for any other format
      if (data[0].month) {
        // Monthly data format
        labels = data.map(item => {
          const [year, month] = item.month.split('-');
          const date = new Date(year, month - 1);
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short'
          });
        });
        dataPoints = data.map(item => item.count);
      } else if (data[0].date) {
        // Daily data format
        labels = data.map(item => {
          const date = new Date(item.date);
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });
        });
        dataPoints = data.map(item => item.count);
      } else if (data[0].slot) {
        // Hourly slot data format for today
        labels = data.map(item => {
          const [startHour, endHour] = item.slot.split('-').map(Number);
          const startPeriod = startHour >= 12 ? 'PM' : 'AM';
          const endPeriod = endHour >= 12 ? 'PM' : 'AM';
          const displayStartHour = startHour === 0 ? 12 : startHour > 12 ? startHour - 12 : startHour;
          const displayEndHour = endHour === 0 ? 12 : endHour > 12 ? endHour - 12 : endHour;

          if (startPeriod === endPeriod) {
            return `${displayStartHour}-${displayEndHour} ${endPeriod}`;
          } else {
            return `${displayStartHour} ${startPeriod}-${displayEndHour} ${endPeriod}`;
          }
        });
        dataPoints = data.map(item => item.count);
      } else if (data[0].year !== undefined) {
        // Yearly data format for overall
        labels = data.map(item => item.year.toString());
        dataPoints = data.map(item => item.count);
      }
      break;
  }

  return {
    labels,
    datasets: [
      {
        label: 'Interview Count',
        data: dataPoints,
        borderColor: 'rgb(79, 70, 229)', // indigo-600
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(79, 70, 229)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: 'rgb(99, 102, 241)', // indigo-500
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 3,
      }
    ]
  };
};

export const formatResponseBarData = (responseQuality) => {
  return responseQuality
    ? {
      labels: ["User Answer", "Original Answer"],
      datasets: [
        {
          label: "Average Length",
          data: [+responseQuality.avgUserAnswerLength, +responseQuality.avgOriginalAnswerLength],
          backgroundColor: ["rgba(99, 102, 241, 0.8)", "rgba(16, 185, 129, 0.8)"],
          borderColor: ["rgba(99, 102, 241, 1)", "rgba(16, 185, 129, 1)"],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    }
    : null
}

export const formatCommonCategoriesPie = (categoryRole) => {
  return categoryRole?.commonCategories
    ? {
      labels: categoryRole.commonCategories.map((c) => c.category),
      datasets: [
        {
          data: categoryRole.commonCategories.map((c) => c.count),
          backgroundColor: ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"],
          borderWidth: 3,
          borderColor: "#ffffff",
          hoverBorderWidth: 4,
        },
      ],
    }
    : null
}

export const formatCommonRolesPie = (categoryRole) => {
  return categoryRole?.commonRoles
    ? {
      labels: categoryRole.commonRoles.map((r) => r.role),
      datasets: [
        {
          data: categoryRole.commonRoles.map((r) => r.count),
          backgroundColor: ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"],
          borderWidth: 3,
          borderColor: "#ffffff",
          hoverBorderWidth: 4,
        },
      ],
    }
    : null
}

// Base chart options for common styling
export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
      labels: {
        usePointStyle: true,
        padding: (ctx) => {
          const width = ctx.chart.width;
          return width < 640 ? 8 : 20; // small screens → 8, bigger → 20
        },
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
};

// Specific options for pie charts
export const pieChartOptions = {
  ...baseChartOptions,
  elements: {
    arc: {
      backgroundColor: 'transparent',
    },
  },
  scales: {
    x: {
      display: false, // Hide x-axis for pie charts
    },
    y: {
      display: false, // Hide y-axis for pie charts
    },
  },
};

// Specific options for bar and line charts
export const barLineChartOptions = {
  ...baseChartOptions,
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
        callback: function (value, index, ticks) {
          const label = this.getLabelForValue(value);

          // Mobile breakpoint (<640px)
          const isMobile = window.innerWidth < 640;

          if (isMobile) {
            // truncate to 6 chars + …
            return label.length > 6 ? label.slice(0, 6) + "…" : label;
          }

          return label; // desktop view full label
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
