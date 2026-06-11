/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

export default function ContentTimer({
  topicId,
  moduleId,
  completionTime,
  onCompletion,
  isCompleted,
  contentChanged,
  setContentChanged,
  userId,
  access_token,
  slideId,
  activeSlide,
  setActiveSlide,
}) {
  const [timeSpent, setTimeSpent] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);

  const timerRef = useRef(null);
  const lastSaveTimeRef = useRef(0);
  const saveIntervalRef = useRef(null);
  const pendingSaveRef = useRef(false);
  const timeSpentRef = useRef(0);
  const activeSlideRef = useRef(activeSlide);

  
  // Track timeSpent in ref for access inside intervals
  useEffect(() => {
    timeSpentRef.current = timeSpent;
  }, [timeSpent]);

  // Fetch initial time spent
  useEffect(() => {
    const fetchTimeSpent = async () => {
      try {
        const params = slideId ? { slideId } : {};
        const response = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/progress/topic/${topicId}/get-time`,
          {
            params,
            headers: { Authorization: `Bearer ${access_token}` },
          }
        );
        setTimeSpent(response.data.time_spent);
        lastSaveTimeRef.current = response.data.time_spent;
      } catch (error) {
        console.error("Error fetching time spent:", error);
      }
    };

    fetchTimeSpent();

    // Setup visibility listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(saveIntervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      if (pendingSaveRef.current) updateTimeSpent(timeSpentRef.current);
    };
  }, [topicId, slideId, access_token]);

  // Handle content change
  useEffect(() => {
    if (
      contentChanged &&
      timeSpentRef.current > lastSaveTimeRef.current &&
      !isCompleted
    ) {
      updateTimeSpent(timeSpentRef.current);
      setContentChanged(false);
    }
  }, [contentChanged, isCompleted]);

  // Track actual slide change
  useEffect(() => {
    if (
      activeSlide !== activeSlideRef.current &&
      timeSpentRef.current > lastSaveTimeRef.current &&
      !isCompleted
    ) {
      updateTimeSpent(timeSpentRef.current);
      activeSlideRef.current = activeSlide;
    }
  }, [activeSlide, isCompleted]);

  // Timer logic based on visibility and completion
  useEffect(() => {
    if (!isCompleted && isPageVisible) {
      startTimer();
    } else {
      pauseTimer();
    }
    return () => clearInterval(timerRef.current);
  }, [isCompleted, isPageVisible]);

  // Save every 30 seconds
  useEffect(() => {
    if (!isCompleted) {
      saveIntervalRef.current = setInterval(() => {
        if (timeSpentRef.current > lastSaveTimeRef.current) {
          updateTimeSpent(timeSpentRef.current);
          lastSaveTimeRef.current = timeSpentRef.current;
        }
      }, 30000);
    }

    return () => clearInterval(saveIntervalRef.current);
  }, [isCompleted]);

  // Completion checker
  useEffect(() => {
    if (completionTime && timeSpent >= completionTime && !isCompleted) {
      handleCompletion();
    }
  }, [timeSpent, completionTime, isCompleted]);

  const handleVisibilityChange = () => setIsPageVisible(!document.hidden);
  const handleFocus = () => setIsPageVisible(true);
  const handleBlur = () => setIsPageVisible(false);

  const handleBeforeUnload = () => {
    if (timeSpentRef.current > lastSaveTimeRef.current) {
      const data = new FormData();
      data.append("userId", userId);
      data.append("topicId", topicId);
      data.append("moduleId", moduleId);
      data.append("timeSpent", timeSpentRef.current);
      if (slideId) data.append("slideId", slideId);

      navigator.sendBeacon(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/progress/topic/${topicId}/update-time`,
        data
      );
    }
  };

  const startTimer = () => {
    if (!isTimerActive) {
      setIsTimerActive(true);
      timerRef.current = setInterval(() => {
        setTimeSpent((prev) => prev + 1);
        pendingSaveRef.current = true;
      }, 1000);
    }
  };

  const pauseTimer = () => {
    setIsTimerActive(false);
    clearInterval(timerRef.current);
    if (pendingSaveRef.current) {
      updateTimeSpent(timeSpentRef.current);
      pendingSaveRef.current = false;
    }
  };

  const handleCompletion = async () => {
    clearInterval(timerRef.current);
    await updateTimeSpent(timeSpentRef.current);
    onCompletion(topicId, moduleId);
  };

  const updateTimeSpent = async (time) => {
    try {
      const payload = {
        userId,
        topicId,
        moduleId,
        timeSpent: time,
      };
      if (slideId) payload.slideId = slideId;

      await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/progress/topic/${topicId}/update-time`,
        payload,
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      lastSaveTimeRef.current = time;
      pendingSaveRef.current = false;
    } catch (error) {
      console.error("❌ Error saving time:", error);
      pendingSaveRef.current = true;
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const progressPercentage = Math.min(
    (timeSpent / completionTime) * 100,
    100
  ).toFixed(0);

  return (
    <div className="sticky bottom-3 left-0 right-0 z-5">
      <div className="container mx-auto px-4 py-2 bg-white shadow-md rounded-lg border border-gray-200">
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              {isTimerActive ? (
                <div className="flex items-center text-green-600">
                  <svg
                    className="w-5 h-5 mr-2 animate-pulse"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">Timer Active</span>
                </div>
              ) : (
                <div className="flex items-center text-amber-600">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">
                    {!isPageVisible
                      ? "Tab Inactive - Timer Paused"
                      : "Timer Paused"}
                  </span>
                </div>
              )}
            </div>

            <div className="text-base font-medium">
              <div className="flex items-center bg-gray-100 px-3 py-1 rounded-lg">
                <span className="text-blue-700">{formatTime(timeSpent)}</span>
                <span className="mx-1 text-gray-500">/</span>
                <span className="text-gray-700">
                  {formatTime(completionTime)}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                progressPercentage >= 100
                  ? "bg-green-500"
                  : progressPercentage > 50
                  ? "bg-blue-600"
                  : "bg-blue-400"
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              {isPageVisible
                ? `Keep this tab open to complete this topic (${progressPercentage}% complete)`
                : "⚠️ Timer paused - return to tab to continue progress"}
            </p>

            <div className="text-sm font-medium text-blue-600">
              {progressPercentage}% Complete
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
