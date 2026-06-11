/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */

import { useState } from "react"
import { Check, AlertCircle } from "lucide-react"
import rightSidebarData from "../../data/rightSidebarData"

export default function RightSidebar({ selectedEndpoint, selectedCategoryId, onCategoryChange }) {
  const [activeTab, setActiveTab] = useState(rightSidebarData.defaultTab)
  const [response, setResponse] = useState(null)
  const endpoint = rightSidebarData.getEndpoint(selectedEndpoint)
  const categories = rightSidebarData.getCategories()
  const questions = rightSidebarData.getQuestions()

  if (!endpoint) return null

  const handleSendRequest = () => {
    const resp = rightSidebarData.getResponse(selectedEndpoint, selectedCategoryId)
    setResponse(resp)
  }

  const defaultJson = endpoint.parameters?.reduce((acc, param) => {
    if (param.name !== 'id') {
      acc[param.name] = param.example;
    }
    return acc;
  }, {});

  return (
    <div className="w-96 h-full flex flex-col overflow-hidden bg-white shadow-lg rounded-2xl border border-gray-200">
      <div className="p-5 border-b border-gray-100 bg-white rounded-t-2xl">
        <div className="flex items-center">
          <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg shadow-md mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
              <path d="M5 16V9h14V2H5l14 14h-7m-7 0l7 7v-7m-7 0h7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">
            Request Tester
          </h2>
        </div>
        <p className="text-xs text-gray-500 mt-1 ml-1">Try out API endpoints</p>
      </div>

      <div className="border-b border-gray-100 bg-white">
        <div className="flex px-4">
          {rightSidebarData.tabs.map(tab => (
            <button
              key={tab}
              className={`px-4 py-3 text-sm font-medium transition-all duration-200 ${activeTab === tab
                  ? 'text-indigo-700 border-b-2 border-indigo-500 font-semibold'
                  : 'text-gray-500 hover:text-indigo-600'
                }`}
              onClick={() => setActiveTab(tab)}
            >
              {rightSidebarData.codeExamples[tab].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-hide"
        style={{
          scrollbarWidth: 'none',  /* Firefox */
          msOverflowStyle: 'none',  /* IE and Edge */
        }}>
        {/* Custom CSS for WebKit browsers (Chrome, Safari, etc.) */}
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        <h3 className="text-sm font-medium text-gray-700 mb-2">API Request</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm border border-gray-800 shadow-md">
          {rightSidebarData.codeExamples[activeTab].template(endpoint)}
        </pre>

        {/* Try It Section */}
        <div className="mt-6 mb-2">
          <div className="flex mb-3">
            <span className={`inline-flex items-center px-3 py-2 rounded-l-lg border text-sm font-semibold shadow-sm ${endpoint.method === "GET"
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : endpoint.method === "POST"
                  ? "bg-green-100 text-green-700 border-green-200"
                  : endpoint.method === "PUT"
                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                    : endpoint.method === "DELETE"
                      ? "bg-red-100 text-red-700 border-red-200"
                      : "bg-gray-100 text-gray-700 border-gray-200"
              }`}>
              {endpoint.method}
            </span>
            <input
              type="text"
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-r-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white shadow-sm"
              value={endpoint.url.replace('{id}', selectedCategoryId || '1')}
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Request Body (JSON)
            </label>
            <textarea
              rows={7}
              className="w-full p-3 text-sm font-mono border border-indigo-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-300 transition-all duration-200"
              disabled
              defaultValue={JSON.stringify(defaultJson, null, 2)}
            />
          </div>

          <button
            className="w-full mt-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 shadow-md"
            onClick={handleSendRequest}
            disabled={!selectedEndpoint}
          >
            Send Request
          </button>
        </div>

        {/* Response Section */}
        {response && (
          <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-2">
              <div className="flex items-center justify-center bg-green-100 text-green-700 h-6 w-6 rounded-full mr-2">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-green-700">200 OK</span>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm border border-gray-800 shadow-md">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Bottom tooltip/hint */}
      <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
        <div className="flex items-center text-xs text-gray-500">
          <div className="flex-shrink-0 mr-2 p-1 bg-indigo-100 rounded-md">
            <AlertCircle className="h-3.5 w-3.5 text-indigo-600" />
          </div>
          <span>This is a sandbox environment. No real API calls are made.</span>
        </div>
      </div>
    </div>
  )
}