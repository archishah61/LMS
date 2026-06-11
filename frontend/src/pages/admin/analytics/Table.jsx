import { BarChart3, Eye, AlertTriangle } from "lucide-react"

const Table = ({ data, columns, title, showModal = false, setSelectedModal }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
    <div className="sm:px-6 p-4  from-gray-50 to-gray-100 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          {title}
        </h3>
        {showModal && (
          <button
            onClick={() => setSelectedModal({ type: "table", title, data, columns })}
            className="flex items-center gap-1 sm:px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">View<span className="hidden md:inline"> Details</span></span>
          </button>
        )}
      </div>
    </div>
    <div className="overflow-x-auto hidden md:block">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data?.length > 0 ? (
            data.slice(0, showModal ? 5 : data.length).map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors duration-150">
                {columns.map((col) => (
                  <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {typeof row[col] === "number" && col.includes("Score") ? (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row[col] >= 80
                          ? "bg-green-100 text-green-800"
                          : row[col] >= 60
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                          }`}
                      >
                        {row[col]}
                      </span>
                    ) : (
                      row[col]
                    )}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <AlertTriangle className="w-8 h-8 text-gray-300" />
                  No data available
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    {/* Mobile & Tablet View (Cards) */}
    <div className="md:hidden">
      {data?.length > 0 ? (
        data.slice(0, showModal ? 5 : data.length).map((row, idx) => (
          <div
            key={idx}
            className="border-b border-gray-200 p-4 bg-white shadow-sm"
          >
            {columns.map((col) => (
              <div key={col} className="flex justify-between py-1">
                <span className="text-xs font-semibold text-gray-500">
                  {col.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                </span>

                <span className="text-sm text-gray-800">
                  {typeof row[col] === "number" && col.includes("Score") ? (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${row[col] >= 80
                        ? "bg-green-100 text-green-800"
                        : row[col] >= 60
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                        }`}
                    >
                      {row[col]}
                    </span>
                  ) : (
                    row[col]
                  )}
                </span>
              </div>
            ))}
          </div>
        ))
      ) : (
        <div className="text-center py-10 text-gray-400 flex flex-col items-center">
          <AlertTriangle className="w-8 h-8 text-gray-300" />
          No data available
        </div>
      )}
    </div>
    {showModal && data?.length > 5 && (
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-center">
        <span className="text-sm text-gray-500">Showing 5 of {data.length} entries</span>
      </div>
    )}
  </div>
)

export default Table
