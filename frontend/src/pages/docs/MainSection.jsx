/* eslint-disable react/prop-types */

import { useState } from "react";
import mainData from "../../data/mainData";

export default function MainSection({ selectedEndpoint, response, onGetStarted }) {
  const [openResponseIdx, setOpenResponseIdx] = useState(null);
  const endpoint = mainData.endpoints.find(e => e.id === selectedEndpoint);

  if (!endpoint) {
    // Render Introduction with enhanced styling
    const { introduction } = mainData;
    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-indigo-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section with Animation */}
          <div className="flex items-center mb-6 transform hover:scale-102 transition-transform duration-300">
            <span className="text-5xl mr-4">{introduction.icon}</span>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              {introduction.title}
            </h1>
          </div>

          {/* Subtitle with enhanced styling */}
          <h2 className="text-2xl text-gray-700 mb-8 font-light italic border-l-4 border-indigo-400 pl-3">
            {introduction.subtitle}
          </h2>

          {/* Content Sections */}
          <div className="space-y-12">
            {introduction.sections.map((section, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-xl font-bold text-indigo-700 mb-4 flex items-center">
                  <span className="inline-block w-2 h-8 bg-indigo-500 mr-3 rounded-md"></span>
                  {section.title}
                </h3>
                <p className="text-gray-700 mb-4 leading-relaxed">{section.content}</p>
                {section.list && (
                  <ul className="space-y-3 mt-6">
                    {section.list.map((item, i) => (
                      <li key={i} className="flex bg-indigo-50 rounded-lg p-4 hover:bg-indigo-100 transition-colors duration-200">
                        <div className="flex-shrink-0 mt-1">
                          <span className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-indigo-600 text-white">
                            {i + 1}
                          </span>
                        </div>
                        <div className="ml-4">
                          <h4 className="font-semibold text-indigo-800">{item.title}</h4>
                          <p className="text-gray-600 mt-1">{item.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Footer Call to Action */}
          <div className="mt-10 text-center">
            <div className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 p-0.5 rounded-lg">
              <button
                className="bg-white px-8 py-3 rounded-md font-medium text-indigo-800 hover:bg-transparent hover:text-white transition-colors duration-300"
                onClick={onGetStarted}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{endpoint.name}</h1>
      <p className="text-gray-600 mb-4">{endpoint.description}</p>
      <div className="mb-8">
        <span className="font-mono bg-gray-200 px-2 py-1 rounded">{endpoint.method} {endpoint.url}</span>
      </div>
      {endpoint.parameters && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Parameters</h2>
          <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg border border-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Required</th>
                <th className="px-4 py-2 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              {endpoint.parameters.map((param, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 font-mono font-bold text-gray-900">{param.name}</td>
                  <td className="px-4 py-2 text-purple-700 underline cursor-pointer">{param.type}</td>
                  <td className="px-4 py-2 text-red-600 font-semibold">{param.required ? "Yes" : "No"}</td>
                  <td className="px-4 py-2">{param.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Responses</h2>
        <div className="space-y-4">
          {endpoint.responses.map((resp, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-200`}
            >
              <button
                className={`flex items-center justify-between w-full p-4 text-left focus:outline-none ${resp.status === 200 ? "bg-green-50 hover:bg-green-100" : "bg-red-50 hover:bg-red-100"}`}
                onClick={() => setOpenResponseIdx(openResponseIdx === idx ? null : idx)}
              >
                <div className="flex items-center">
                  <span
                    className={`inline-flex items-center justify-center px-3 py-1 rounded-md text-sm font-medium mr-3 ${resp.status === 200 ? "bg-green-100 text-green-800 border border-green-300" : "bg-red-100 text-red-800 border border-red-300"}`}
                  >
                    {resp.status}
                  </span>
                  <span className="text-gray-700">{resp.description}</span>
                </div>
                <svg
                  className={`w-5 h-5 ml-2 transition-transform duration-200 ${openResponseIdx === idx ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {openResponseIdx === idx && resp.example && (
                <div className="bg-gray-50 border-t border-gray-200 p-4">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-sm border border-gray-800">
                    {JSON.stringify(resp.example, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Show response below, styled like the reference image */}
      {response && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-200 text-green-900 mr-2">Response</span>
            <span className="text-xs font-semibold text-green-700">200 OK</span>
          </div>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-sm border border-gray-800">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
