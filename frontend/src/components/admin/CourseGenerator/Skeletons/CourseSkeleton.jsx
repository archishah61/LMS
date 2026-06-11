"use client";

import { memo } from "react";
import SessionSkeleton from "./SessionSkeleton";

const CourseSkeleton = memo(({ sessionCount = 3, showHeader = true }) => {
  return (
    <div className="space-y-4 md:space-y-6 animate-pulse">
      {/* Course Header Skeleton */}
      {showHeader && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-80"></div>
              <div className="flex items-center space-x-2">
                <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
          </div>

          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Course Title and Description */}
            <div className="space-y-4">
              <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-64"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>

            {/* Course Thumbnail Skeleton */}
            <div className="space-y-4">
              <div className="h-5 bg-gray-200 rounded w-32"></div>
              <div className="relative w-full max-w-md mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden shadow-md">
                <div className="w-full h-48 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 animate-shimmer"></div>
                <div className="absolute top-2 left-2">
                  <div className="h-6 w-20 bg-white/70 rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <div className="h-8 w-24 bg-gray-200 rounded-md"></div>
                <div className="h-8 w-20 bg-gray-200 rounded-md"></div>
                <div className="h-8 w-28 bg-gray-200 rounded-md"></div>
              </div>
            </div>

            {/* Course Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="h-5 bg-gray-200 rounded w-20"></div>
              <div className="h-5 bg-gray-200 rounded w-24"></div>
              <div className="h-5 bg-gray-200 rounded w-28"></div>
            </div>

            {/* Tabs Skeleton */}
            <div>
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <div className="h-4 w-32 bg-gray-200 rounded py-2"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded py-2"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded py-2"></div>
                </nav>
              </div>
              <div className="pt-6 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                <div className="h-4 bg-gray-200 rounded w-3/5"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Structure Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-48"></div>
          <div className="h-5 bg-gray-200 rounded w-72"></div>
        </div>
        <div className="h-12 w-32 bg-gradient-to-r from-emerald-200 to-teal-200 rounded-xl"></div>
      </div>

      {/* Sessions Skeleton */}
      <div className="space-y-6">
        {Array.from({ length: sessionCount }, (_, index) => (
          <SessionSkeleton key={index} moduleCount={2 + (index % 2)} />
        ))}
      </div>
    </div>
  );
});

CourseSkeleton.displayName = "CourseSkeleton";

export default CourseSkeleton;
