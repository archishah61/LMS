/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React from "react";
import { FaFileAlt } from "react-icons/fa";

const RegularAssignment = ({ assignmentData, showPreview, setShowPreview }) => {
  if (!assignmentData.file) return null;

  const fileName = assignmentData.file.split("/").pop();
  const fileExtension = fileName.split(".").pop().toLowerCase();

  let fileIcon;
  let iconBgColor;

  if (["jpg", "jpeg", "png", "gif", "svg"].includes(fileExtension)) {
    iconBgColor = "bg-gradient-to-br from-blue-50 to-indigo-100";
    fileIcon = (
      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${iconBgColor} rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm`}>
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  } else if (fileExtension === "pdf") {
    iconBgColor = "bg-gradient-to-br from-red-50 to-pink-100";
    fileIcon = (
      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${iconBgColor} rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm`}>
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  } else if (["doc", "docx"].includes(fileExtension)) {
    iconBgColor = "bg-gradient-to-br from-blue-50 to-cyan-100";
    fileIcon = (
      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${iconBgColor} rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm`}>
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
    );
  } else if (["xls", "xlsx"].includes(fileExtension)) {
    iconBgColor = "bg-gradient-to-br from-green-50 to-emerald-100";
    fileIcon = (
      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${iconBgColor} rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm`}>
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-green-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V6a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
    );
  } else {
    iconBgColor = "bg-gradient-to-br from-gray-50 to-slate-100";
    fileIcon = (
      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${iconBgColor} rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm`}>
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.585a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          />
        </svg>
      </div>
    );
  }

  const renderFilePreview = () => {
    const fileUrl = assignmentData.file;
    if (!fileUrl) return null;

    if (["jpg", "jpeg", "png", "gif", "svg"].includes(fileExtension)) {
      return (
        <div className="mt-2 sm:mt-4 border-2 border-dashed border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-slate-50">
          <div className="bg-white/80 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200/50 flex items-center">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="text-gray-700 font-semibold text-sm sm:text-base truncate">{fileName}</span>
          </div>
          <div className="flex justify-center p-2 sm:p-4">
            <div className="relative max-w-full">
              <img
                src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${fileUrl || "/placeholder.png"}`}
                alt="Assignment preview"
                className="w-full h-auto max-h-64 sm:max-h-80 md:max-h-96 object-contain shadow-md rounded-lg border border-gray-200"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </div>
      );
    }

    if (fileExtension === "pdf") {
      return (
        <div className="border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-slate-50">
          <div className="p-1 sm:p-2">
            <iframe
              src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${fileUrl}#view=FitH`}
              title="PDF Preview"
              className="w-full h-[350px] sm:h-[400px] md:h-[500px] border border-gray-200 rounded-lg shadow-sm"
            />
          </div>
        </div>
      );
    }

    if (["txt", "md", "html", "css", "js", "jsx", "json"].includes(fileExtension)) {
      return (
        <div className="mt-4 sm:mt-6 border-2 border-dashed border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-slate-50">
          <div className="bg-white/80 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200/50 flex items-center">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-gray-50 to-slate-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span className="text-gray-700 font-semibold text-sm sm:text-base truncate">{fileName}</span>
          </div>
          <div className="p-4 sm:p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-4 sm:p-6">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium text-sm sm:text-base">Text File Preview</p>
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-3 sm:p-4 rounded-lg border border-gray-200/50">
                <p className="text-gray-600 text-sm sm:text-base">Content preview requires API implementation.</p>
                <p className="text-gray-600 text-sm sm:text-base mt-1">The complete file can be viewed after download.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-4 sm:mt-6 border-2 border-dashed border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-slate-50">
        <div className="bg-white/80 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200/50 flex items-center">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-gray-50 to-slate-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <span className="text-gray-700 font-semibold text-sm sm:text-base truncate">{fileName}</span>
        </div>
        <div className="p-4 sm:p-6 md:p-8">
          <div className="flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl sm:rounded-2xl border border-amber-200/50">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-100 to-yellow-200 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-sm">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-amber-800 font-semibold text-sm sm:text-base">Preview not available</p>
              <p className="text-amber-700 mt-1 text-xs sm:text-sm">
                File type ({fileExtension}) cannot be previewed. Please download to view.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4 sm:mt-6 px-3 sm:px-4 md:px-0">
      {/* Header Section - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <FaFileAlt className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800 flex-shrink-0" />
          <h3 className="text-lg sm:text-xl font-bold text-slate-800">Regular Assignment</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="px-2 sm:px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs sm:text-sm font-medium text-slate-600">
            Marks: {assignmentData.max_score}
          </div>
          <div className="px-2 sm:px-3 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-xs sm:text-sm font-medium text-emerald-700">
            Passing Score: {assignmentData.passing_score}
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mt-6">
        <div className="p-3 sm:p-4">
          <div className="flex items-start sm:items-center mb-4 sm:mb-6">
            <div className="flex-shrink-0">
              {fileIcon}
            </div>
            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-2 sm:gap-3">
                <span className="text-gray-900 font-semibold text-base sm:text-lg truncate max-w-[200px] sm:max-w-[300px] md:max-w-full">
                  {fileName}
                </span>
                <span className="inline-flex self-start sm:self-center items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200/50 w-fit">
                  {fileExtension.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <a
              href={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${assignmentData.file}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center sm:justify-start px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 shadow-sm text-sm sm:text-base"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download File
            </a>

            <button
              className="inline-flex items-center justify-center sm:justify-start px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 shadow-sm border border-gray-300 text-sm sm:text-base"
              onClick={() => setShowPreview(!showPreview)}
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 mr-2 transition-transform duration-200 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                style={{ transform: showPreview ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
          </div>
        </div>

        {showPreview && (
          <div className="mt-3 sm:mt-4 border-t border-gray-100 pt-3 sm:pt-4">
            {renderFilePreview()}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegularAssignment;