import { AlertTriangle } from 'lucide-react'
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  ComposedChart,
  Line,
} from "recharts"

// Professional color palette with muted tones
const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#059669", "#3b82f6", "#dc2626", "#65a30d"]

const GRADIENT_COLORS = [
  "from-slate-100 to-slate-200",
  "from-gray-100 to-gray-200",
  "bg-leafGreen to-blue-100",
  "from-indigo-50 ",
  "bg-leafGreen",
  "from-pink-50 ",
  "from-amber-50 to-amber-100",
  "from-emerald-50 to-emerald-100",
]

// Severity colors - more muted professional tones
const SEVERITY_COLORS = {
  high: "#dc2626",
  medium: "#d97706",
  low: "#059669",
  unknown: "#6b7280",
}

// Clean loading indicator component
const LoadingIndicator = () => (
  <div className="flex justify-center my-8">
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-slate-600"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-3 h-3 bg-slate-600 rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
)

const ErrorAnalysisTab = ({
  isLoadingErrorAnalysis,
  selectedCourseId,
  errorAnalysisData,
  selectedModuleId,
  selectedVersion,
}) => {
  // Helper function to check if there is valid error analysis data
  const hasValidErrorData = () => {
    // If no data is available at all or it's not an object
    if (!errorAnalysisData || typeof errorAnalysisData !== 'object') {
      return false
    }

    // If data object exists but is empty
    if (Object.keys(errorAnalysisData).length === 0) {
      return false
    }
    
    // If data object has error/status properties (probably an error object)
    if (errorAnalysisData.status && errorAnalysisData.error) {
      return false
    }

    // IMPORTANT: First check the explicit flags from the backend
    // These flags are more reliable than inferring from data structures

    // If the backend explicitly tells us there's no data for this module, trust it
    if (errorAnalysisData.noDataForModule === true) {
      return false
    }

    // If the backend explicitly tells us there's no data at all, trust it
    if (errorAnalysisData.noData === true) {
      return false
    }

    // Check if we have error patterns
    const hasErrorPatterns =
      errorAnalysisData.errorPatterns &&
      Array.isArray(errorAnalysisData.errorPatterns) &&
      errorAnalysisData.errorPatterns.length > 0

    // Check if we have error counts by type
    const hasErrorCounts =
      errorAnalysisData.errorCountByType &&
      typeof errorAnalysisData.errorCountByType === "object" &&
      Object.keys(errorAnalysisData.errorCountByType).length > 0

    // Check if we have improvement suggestions
    const hasImprovementSuggestions =
      errorAnalysisData.improvementSuggestions &&
      Array.isArray(errorAnalysisData.improvementSuggestions) &&
      errorAnalysisData.improvementSuggestions.length > 0

    // Different validation logic based on whether we have a selected module or not
    if (selectedModuleId) {
      // If a specific module is selected, we need valid data for that module
      if (!hasErrorPatterns && !hasErrorCounts && !hasImprovementSuggestions) {
        return false
      }

      // Additional check for specific cases of empty data structures that might look valid
      if (
        errorAnalysisData.errorPatterns &&
        errorAnalysisData.errorPatterns.length === 0 &&
        (!errorAnalysisData.errorCountByType || Object.keys(errorAnalysisData.errorCountByType).length === 0) &&
        (!errorAnalysisData.improvementSuggestions || errorAnalysisData.improvementSuggestions.length === 0)
      ) {
        return false
      }

      // Verify that the data we have is actually for the module we're looking at
      // This prevents showing stale data from a previous module
      if (
        errorAnalysisData.moduleId !== undefined &&
        errorAnalysisData.moduleId !== Number.parseInt(selectedModuleId)
      ) {
        return false
      }
    } else {
      // For "All Modules" view, we can show aggregate data if it exists
      // Even minimal data is acceptable for the overview
      if (!hasErrorPatterns && !hasErrorCounts && !hasImprovementSuggestions) {
        return false
      }
    }

    // Data is considered valid
    return true
  }

  return (
    <div className="min-h-screen  from-white via-gray-50 to-slate-100">
      {isLoadingErrorAnalysis ? (
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingIndicator />
          <p className="mt-4 text-lg font-medium text-slate-700">
            Analyzing Error Patterns...
          </p>
        </div>
      ) : !selectedCourseId ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white p-12 rounded-2xl shadow-lg border border-gray-200 text-center max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6  from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-sm">
              <AlertTriangle size={40} className="text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              No Course Selected
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Please select a course to view comprehensive error analysis and feedback data
            </p>
          </div>
        </div>
      ) : !hasValidErrorData() ? (
        <div className="flex items-center justify-center min-h-[60vh] p-6">
          <div className="bg-white p-12 rounded-2xl shadow-lg border border-gray-200 text-center max-w-2xl mx-auto">
            <div className="w-24 h-24 mx-auto mb-8  from-amber-100 to-orange-200 rounded-xl flex items-center justify-center shadow-sm">
              <AlertTriangle size={48} className="text-amber-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              No Feedback Available
            </h3>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              {selectedModuleId
                ? errorAnalysisData && errorAnalysisData.noDataForModule
                  ? `No feedback data is available for Module ${selectedModuleId}.`
                  : `Module ${selectedModuleId} hasn't been completed yet or no feedback has been generated.`
                : errorAnalysisData && errorAnalysisData.noData
                  ? `No error analysis data is available for this student in this course.`
                  : `No error analysis data is available for this course.`}
            </p>

            <div className=" bg-lightGreen p-8 rounded-xl border border-leafGreen/20 text-left">
              <h4 className="text-lg font-bold text-forestGreen mb-4 flex items-center">
                <div className="w-2 h-2 bg-lightGreen rounded-full mr-3"></div>
                What to do next:
              </h4>
              <ul className="space-y-3 text-gray-700">
                {selectedModuleId ? (
                  <>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-lightGreen rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Wait for the student to complete this module</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-lightGreen rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Select a different module that has been completed</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-lightGreen rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Choose another student who has completed this module</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-lightGreen rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Check if the feedback generation process is working correctly</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-lightGreen rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Wait for the student to complete some modules in this course</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-lightGreen rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Select a specific module to see if data is available for it</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-lightGreen rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Choose another student who has completed modules in this course</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-lightGreen rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Verify that error analysis is enabled for this course</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Clean Professional Header */}
            <div className=" from-violet-500   p-8">
              <h3 className="text-3xl font-bold text-white mb-2">🔍 Error Analysis Dashboard</h3>
              <p className="text-slate-300 text-lg">
                {selectedModuleId ? `Module ${selectedModuleId} Analysis` : "Comprehensive Analysis Across All Modules"}
                {selectedVersion !== "latest" ? ` • Version ${selectedVersion}` : ""}
              </p>
            </div>

            <div className="p-8">
              {/* First check if we have ANY data at all for display */}
              {!errorAnalysisData?.errorPatterns?.length &&
              !Object.keys(errorAnalysisData?.errorCountByType || {}).length &&
              !errorAnalysisData?.improvementSuggestions?.length ? (
                <div className="flex items-center justify-center py-16">
                  <div className="bg-white p-12 rounded-2xl shadow-md border border-gray-200 text-center max-w-2xl mx-auto">
                    <div className="w-20 h-20 mx-auto mb-6  from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-sm">
                      <AlertTriangle size={40} className="text-gray-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">
                      No Feedback Data
                    </h3>
                    <p className="text-gray-600 mb-8 text-lg">
                      {selectedModuleId
                        ? `Module ${selectedModuleId} doesn't have any error analysis data.`
                        : `No error analysis data is available for this course.`}
                    </p>

                    <div className=" bg-lightGreen p-8 rounded-xl border border-leafGreen/20 text-left">
                      <h4 className="text-lg font-bold text-forestGreen mb-4 flex items-center">
                        <div className="w-2 h-2 bg-lightGreen rounded-full mr-3"></div>
                        What to do next:
                      </h4>
                      <ul className="space-y-3 text-gray-700">
                        {selectedModuleId ? (
                          <>
                            <li className="flex items-start">
                              <div className="w-1.5 h-1.5 bg-lightGreen rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <span>Wait for the system to generate feedback for this module</span>
                            </li>
                            <li className="flex items-start">
                              <div className="w-1.5 h-1.5 bg-lightGreen rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <span>Check if the student has properly completed this module</span>
                            </li>
                            <li className="flex items-start">
                              <div className="w-1.5 h-1.5 bg-lightGreen rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <span>Try selecting a different module</span>
                            </li>
                            <li className="flex items-start">
                              <div className="w-1.5 h-1.5 bg-lightGreen rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <span>Check if error analysis is enabled for this module</span>
                            </li>
                          </>
                        ) : (
                          <>
                            <li className="flex items-start">
                              <div className="w-1.5 h-1.5 bg-lightGreen rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <span>Select a specific module to see if data is available</span>
                            </li>
                            <li className="flex items-start">
                              <div className="w-1.5 h-1.5 bg-lightGreen rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <span>Wait for the student to complete some modules with feedback</span>
                            </li>
                            <li className="flex items-start">
                              <div className="w-1.5 h-1.5 bg-lightGreen rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <span>Check if error analysis is enabled for this course</span>
                            </li>
                            <li className="flex items-start">
                              <div className="w-1.5 h-1.5 bg-lightGreen rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <span>Try selecting a different student or course</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Professional Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="group relative  from-white to-red-50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-red-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">🚨</span>
                        </div>
                        <div className="w-2 h-2 bg-red-300 rounded-full"></div>
                      </div>
                      <p className="text-red-700 font-semibold text-sm mb-1 uppercase tracking-wide">Total Errors</p>
                      <p className="text-3xl font-bold text-gray-800 mb-1">
                        {errorAnalysisData?.errorPatterns?.length || 0}
                      </p>
                      <div className="w-full bg-red-100 rounded-full h-2 mt-3">
                        <div className="bg-red-500 h-2 rounded-full w-3/4 transition-all duration-1000 ease-out"></div>
                      </div>
                    </div>

                    <div className="group relative  from-white to-amber-50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-amber-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">📊</span>
                        </div>
                        <div className="w-2 h-2 bg-amber-300 rounded-full"></div>
                      </div>
                      <p className="text-amber-700 font-semibold text-sm mb-1 uppercase tracking-wide">Error Types</p>
                      <p className="text-3xl font-bold text-gray-800 mb-1">
                        {errorAnalysisData?.errorCountByType
                          ? Object.keys(errorAnalysisData.errorCountByType).length
                          : new Set(errorAnalysisData?.errorPatterns?.map((p) => p.type) || []).size}
                      </p>
                      <div className="w-full bg-amber-100 rounded-full h-2 mt-3">
                        <div className="bg-amber-500 h-2 rounded-full w-2/3 transition-all duration-1000 ease-out"></div>
                      </div>
                    </div>

                    <div className="group relative  from-white to-orange-50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-orange-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">⚠️</span>
                        </div>
                        <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                      </div>
                      <p className="text-orange-700 font-semibold text-sm mb-1 uppercase tracking-wide">
                        High Severity
                      </p>
                      <p className="text-3xl font-bold text-gray-800 mb-1">
                        {errorAnalysisData?.errorPatterns?.filter((p) => p.severity === "high")?.length || 0}
                      </p>
                      <div className="w-full bg-orange-100 rounded-full h-2 mt-3">
                        <div className="bg-orange-500 h-2 rounded-full w-1/2 transition-all duration-1000 ease-out"></div>
                      </div>
                    </div>

                    <div className="group relative  from-white to-blue-50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-leafGreen/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 bg-lightGreen rounded-lg flex items-center justify-center">
                          <span className="text-2xl">💡</span>
                        </div>
                        <div className="w-2 h-2 bg-lightGreen rounded-full"></div>
                      </div>
                      <p className="text-forestGreen font-semibold text-sm mb-1 uppercase tracking-wide">
                        Improvement Areas
                      </p>
                      <p className="text-3xl font-bold text-gray-800 mb-1">
                        {errorAnalysisData?.improvementSuggestions?.length || 0}
                      </p>
                      <div className="w-full bg-lightGreen rounded-full h-2 mt-3">
                        <div className="bg-lightGreen h-2 rounded-full w-4/5 transition-all duration-1000 ease-out"></div>
                      </div>
                    </div>
                  </div>

                  {/* Clean Chart Visualization */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Professional Bar Chart */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                      <div className=" from-violet-500 to-purple-500 p-6">
                        <h4 className="text-xl font-bold text-white mb-2 flex items-center">
                          📊 Error Types Distribution
                        </h4>
                        <p className="text-slate-300 text-sm">Frequency analysis of error patterns</p>
                      </div>

                      <div className="p-6">
                        <div className="h-80">
                          {(() => {
                            // Prepare data for chart
                            let chartData = []

                            if (
                              errorAnalysisData?.errorCountByType &&
                              Object.keys(errorAnalysisData.errorCountByType).length > 0
                            ) {
                              // Use direct error count by type
                              chartData = Object.entries(errorAnalysisData.errorCountByType)
                                .map(([type, count]) => ({
                                  name: type.length > 12 ? type.substring(0, 12) + "..." : type,
                                  fullName: type,
                                  value: count,
                                }))
                                .sort((a, b) => b.value - a.value)
                                .slice(0, 6) // Limit to top 6 for readability
                            } else if (
                              errorAnalysisData?.errorPatterns &&
                              Array.isArray(errorAnalysisData.errorPatterns) &&
                              errorAnalysisData.errorPatterns.length > 0
                            ) {
                              // Generate count from patterns
                              const typeCounts = {}
                              errorAnalysisData.errorPatterns.forEach((pattern) => {
                                const type = pattern.type || "Unknown"
                                typeCounts[type] = (typeCounts[type] || 0) + 1
                              })

                              chartData = Object.entries(typeCounts)
                                .map(([type, count]) => ({
                                  name: type.length > 12 ? type.substring(0, 12) + "..." : type,
                                  fullName: type,
                                  value: count,
                                }))
                                .sort((a, b) => b.value - a.value)
                                .slice(0, 6) // Limit to top 6
                            }

                            return chartData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
                                  <defs>
                                    {chartData.map((entry, index) => (
                                      <linearGradient
                                        key={`gradient-${index}`}
                                        id={`gradient-${index}`}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                      >
                                        <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.7} />
                                        <stop
                                          offset="100%"
                                          stopColor={COLORS[index % COLORS.length]}
                                          stopOpacity={0.3}
                                        />
                                      </linearGradient>
                                    ))}
                                  </defs>
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e2e8f0"
                                    vertical={false}
                                    opacity={0.5}
                                  />
                                  <XAxis
                                    dataKey="name"
                                    angle={-45}
                                    textAnchor="end"
                                    height={70}
                                    tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                                    axisLine={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                                  />
                                  <YAxis
                                    tick={{ fill: "#64748b", fontWeight: 500, fontSize: 12 }}
                                    axisLine={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                                  />
                                  <RechartsTooltip
                                    formatter={(value, name, props) => [
                                      `${value} occurrences`,
                                      props.payload.fullName || props.payload.name,
                                    ]}
                                    labelFormatter={(label) => "Error Type"}
                                    cursor={{ fill: "rgba(148, 163, 184, 0.1)", radius: 4 }}
                                    contentStyle={{
                                      backgroundColor: "rgba(255, 255, 255, 0.98)",
                                      border: "1px solid #e2e8f0",
                                      borderRadius: "8px",
                                      boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.1)",
                                      padding: "12px 16px",
                                    }}
                                  />
                                  <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]} strokeWidth={1}>
                                    {chartData.map((entry, index) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={`url(#gradient-${index})`}
                                        stroke={COLORS[index % COLORS.length]}
                                      />
                                    ))}
                                  </Bar>
                                  <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    dot={{ fill: "#6366f1", strokeWidth: 2, r: 3 }}
                                    activeDot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                                  />
                                </ComposedChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                  <div className="w-16 h-16 mx-auto mb-4  from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                                    <span className="text-2xl">📊</span>
                                  </div>
                                  <p className="text-gray-500 text-lg font-medium">No error type data available</p>
                                  <p className="text-gray-400 text-sm mt-2">
                                    Data will appear here once errors are analyzed
                                  </p>
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Pie Chart for Error Severity */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 overflow-hidden">
                      <div className=" bg-leafGreen  p-6">
                        <h4 className="text-xl font-bold text-white mb-2 flex items-center">
                          🎯 Error Severity Analysis
                        </h4>
                        <p className="text-leafGreen text-sm">Distribution by severity levels</p>
                      </div>

                      <div className="p-6">
                        <div className="h-80">
                          {(() => {
                            // Prepare severity data
                            let severityData = []

                            if (errorAnalysisData?.errorPatterns && errorAnalysisData.errorPatterns.length > 0) {
                              const severityCounts = {
                                high: 0,
                                medium: 0,
                                low: 0,
                                unknown: 0,
                              }

                              errorAnalysisData.errorPatterns.forEach((pattern) => {
                                const severity = pattern.severity || "unknown"
                                severityCounts[severity] = (severityCounts[severity] || 0) + 1
                              })

                              severityData = Object.entries(severityCounts)
                                .filter(([_, count]) => count > 0)
                                .map(([severity, count]) => ({
                                  name: severity.charAt(0).toUpperCase() + severity.slice(1),
                                  value: count,
                                  color: SEVERITY_COLORS[severity] || SEVERITY_COLORS.unknown,
                                }))
                            }

                            return severityData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <defs>
                                    {severityData.map((entry, index) => (
                                      <linearGradient
                                        key={`pie-gradient-${index}`}
                                        id={`pie-gradient-${index}`}
                                        x1="0"
                                        y1="0"
                                        x2="1"
                                        y2="1"
                                      >
                                        <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
                                        <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                                      </linearGradient>
                                    ))}
                                  </defs>
                                  <Pie
                                    data={severityData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    innerRadius={40}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="#fff"
                                    strokeWidth={2}
                                  >
                                    {severityData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={`url(#pie-gradient-${index})`} />
                                    ))}
                                  </Pie>
                                  <RechartsTooltip
                                    formatter={(value, name) => [`${value} errors`, name]}
                                    contentStyle={{
                                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                                      border: "1px solid #e2e8f0",
                                      borderRadius: "12px",
                                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                                      backdropFilter: "blur(10px)",
                                      padding: "12px 16px",
                                    }}
                                  />
                                  <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    wrapperStyle={{
                                      fontSize: "14px",
                                      fontWeight: "600",
                                      color: "#64748b",
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                  <div className="w-16 h-16 mx-auto mb-4  bg-leafGreen  rounded-xl flex items-center justify-center">
                                    <span className="text-2xl">🎯</span>
                                  </div>
                                  <p className="text-gray-500 text-lg font-medium">No severity data available</p>
                                  <p className="text-gray-400 text-sm mt-2">Severity analysis will appear here</p>
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clean Progress Visualization */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className=" from-emerald-500 to-teal-500 p-6">
                      <h4 className="text-2xl font-bold text-white mb-2 flex items-center">
                        📈 Module Progress & Error Trends
                      </h4>
                      <p className="text-slate-300">Professional progress visualization with clean design</p>
                    </div>

                    <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Error Resolution Progress */}
                        <div className=" from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-bold text-green-800">Error Resolution</h5>
                            <span className="text-2xl">✅</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-green-700">Resolved</span>
                              <span className="font-semibold text-green-800">
                                {Math.max(
                                  0,
                                  (errorAnalysisData?.errorPatterns?.length || 0) -
                                    (errorAnalysisData?.errorPatterns?.filter((p) => p.severity === "high")?.length ||
                                      0),
                                )}
                              </span>
                            </div>
                            <div className="w-full bg-green-200 rounded-full h-3 overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (errorAnalysisData?.errorPatterns?.length || 0) > 0
                                      ? (((errorAnalysisData?.errorPatterns?.length || 0) -
                                          (errorAnalysisData?.errorPatterns?.filter((p) => p.severity === "high")
                                            ?.length || 0)) /
                                          (errorAnalysisData?.errorPatterns?.length || 1)) *
                                          100
                                      : 0,
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {/* Critical Issues Progress */}
                        <div className=" from-red-50  p-6 rounded-xl border border-red-100">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-bold text-red-800">Critical Issues</h5>
                            <span className="text-2xl">🚨</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-red-700">High Severity</span>
                              <span className="font-semibold text-red-800">
                                {errorAnalysisData?.errorPatterns?.filter((p) => p.severity === "high")?.length || 0}
                              </span>
                            </div>
                            <div className="w-full bg-red-200 rounded-full h-3 overflow-hidden">
                              <div
                                className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-out"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (errorAnalysisData?.errorPatterns?.length || 0) > 0
                                      ? ((errorAnalysisData?.errorPatterns?.filter((p) => p.severity === "high")
                                          ?.length || 0) /
                                          (errorAnalysisData?.errorPatterns?.length || 1)) *
                                          100
                                      : 0,
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {/* Improvement Opportunities */}
                        <div className=" bg-lightGreen p-6 rounded-xl border border-leafGreen/20">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-bold text-forestGreen">Improvements</h5>
                            <span className="text-2xl">💡</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-forestGreen">Suggestions</span>
                              <span className="font-semibold text-forestGreen">
                                {errorAnalysisData?.improvementSuggestions?.length || 0}
                              </span>
                            </div>
                            <div className="w-full bg-lightGreen rounded-full h-3 overflow-hidden">
                              <div
                                className="h-full bg-lightGreen rounded-full transition-all duration-1000 ease-out"
                                style={{
                                  width: `${Math.min(100, (errorAnalysisData?.improvementSuggestions?.length || 0) * 20)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ErrorAnalysisTab
