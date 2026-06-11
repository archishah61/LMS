"use client";

import { memo } from "react";
import TopicSkeleton from "./TopicSkeleton";

const ModuleSkeleton = memo(({ topicCount = 4, isExpanded = true }) => {
  return (
    <div className="group bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-pulse">
      {/* Module Header */}
      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {/* Expand Icon */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 shadow-sm"></div>
          </div>

          {/* Module Icon and Content */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 shadow-sm"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-5 bg-gradient-to-r from-blue-200 to-cyan-200 rounded w-48 mb-2"></div>
              <div className="flex items-center space-x-4">
                <div className="h-5 w-18 bg-blue-100 rounded-full"></div>
                <div className="h-5 w-12 bg-blue-100 rounded-full"></div>
                <div className="h-4 w-12 bg-gray-200 rounded-full"></div>
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gray-100 rounded-lg"></div>
          <div className="w-10 h-10 bg-gray-100 rounded-lg"></div>
          <div className="w-10 h-10 bg-gray-100 rounded-lg"></div>
          <div className="w-10 h-10 bg-gray-100 rounded-lg"></div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/30">
          <div className="p-6 space-y-6">
            {/* Module Fields */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-12"></div>
                <div className="h-10 bg-white border border-gray-200 rounded-lg"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-10 bg-white border border-gray-200 rounded-lg"></div>
              </div>
            </div>

            {/* Topics Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-24"></div>
                <div className="h-px bg-gradient-to-r from-slate-200 to-transparent flex-1 ml-4"></div>
              </div>
              <div className="space-y-3 pl-4">
                {Array.from({ length: topicCount }, (_, index) => (
                  <TopicSkeleton key={index} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ModuleSkeleton.displayName = "ModuleSkeleton";

export default ModuleSkeleton;
