"use client";

import { memo } from "react";

const TopicSkeleton = memo(({ isExpanded = false }) => {
  return (
    <div className="group bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-pulse">
      {/* Topic Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {/* Expand Icon */}
          <div className="flex-shrink-0">
            <div divclassName="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200"></div>
          </div>

          {/* Topic Icon and Content */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-500"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-gradient-to-r from-purple-200 to-indigo-200 rounded w-40 mb-2"></div>
              <div className="flex items-center space-x-3">
                <div className="h-4 w-12 bg-purple-100 rounded-full"></div>
                <div className="h-4 w-14 bg-gray-200 rounded-full"></div>
                <div className="h-3 w-16 bg-gray-200 rounded"></div>
                <div className="h-3 w-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
          <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
          <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/50">
          <div className="p-6 space-y-6">
            {/* Topic Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-300 rounded w-20"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-300 rounded w-24"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-12"></div>
                <div className="h-10 bg-white border border-gray-200 rounded-lg"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-20 bg-white border border-gray-200 rounded-lg"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-10 bg-white border border-gray-200 rounded-lg"></div>
              </div>
            </div>

            {/* Content Preview Skeleton */}
            <div className="border-t border-slate-200 pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                </div>
                <div className="pl-6 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/5"></div>
                </div>

                {/* Audio Preview Skeleton */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="w-6 h-6 bg-gray-200 rounded"></div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full w-1/3"></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <div className="h-3 bg-gray-200 rounded w-8"></div>
                      <div className="h-3 bg-gray-200 rounded w-8"></div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-200 rounded"></div>
                      <div className="w-20 h-2 bg-gray-200 rounded-lg"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

TopicSkeleton.displayName = "TopicSkeleton";

export default TopicSkeleton;
