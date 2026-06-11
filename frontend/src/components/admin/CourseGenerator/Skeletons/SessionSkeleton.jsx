"use client";

import { memo } from "react";
import ModuleSkeleton from "./ModuleSkeleton";

const SessionSkeleton = memo(({ moduleCount = 3, isExpanded = true }) => {
  return (
    <div className="group bg-white border-2 border-slate-200 rounded-2xl shadow-lg overflow-hidden animate-pulse">
      {/* Session Header */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex items-center space-x-5 flex-1 min-w-0">
          {/* Expand Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 shadow-md"></div>
          </div>

          {/* Session Icon and Content */}
          <div className="flex items-center space-x-5 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-6 bg-gradient-to-r from-emerald-200 to-teal-200 rounded-lg w-64 mb-3"></div>
              <div className="flex items-center space-x-4">
                <div className="h-6 w-20 bg-emerald-100 rounded-full"></div>
                <div className="h-6 w-16 bg-emerald-100 rounded-full"></div>
                <div className="h-5 w-14 bg-gray-200 rounded-full"></div>
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-100 rounded-xl"></div>
          <div className="w-12 h-12 bg-gray-100 rounded-xl"></div>
          <div className="w-12 h-12 bg-gray-100 rounded-xl"></div>
          <div className="w-12 h-12 bg-gray-100 rounded-xl"></div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50">
          <div className="p-8 space-y-8">
            {/* Session Fields */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-10 bg-white border border-gray-200 rounded-lg"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-10 bg-white border border-gray-200 rounded-lg"></div>
              </div>
            </div>

            {/* Modules Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-32"></div>
                <div className="h-px bg-gradient-to-r from-slate-300 via-slate-200 to-transparent flex-1"></div>
              </div>
              <div className="space-y-4 pl-6">
                {Array.from({ length: moduleCount }, (_, index) => (
                  <ModuleSkeleton key={index} topicCount={2 + (index % 3)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

SessionSkeleton.displayName = "SessionSkeleton";

export default SessionSkeleton;
