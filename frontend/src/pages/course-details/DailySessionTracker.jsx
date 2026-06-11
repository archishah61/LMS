/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Clock,
  Timer,
  Power,
  AlertTriangle,
  Eye,
  EyeOff,
  PlayCircle,
  Ban,
  Loader,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useCheckCourseAccessQuery,
  useEndCourseSessionMutation,
  useStartCourseSessionMutation,
  useUpdateCourseSessionMutation,
} from "../../services/Learning_Progress/courseTimeTrackingAPI";
import { motion, AnimatePresence } from 'framer-motion';

const DailySessionTracker = ({
  enrollmentId,
  userId,
  showEndSessionModal,
  setShowEndSessionModal,
  activeTopic,
  onSessionStateChange,
  isRightSidebarOpen,
  pauseDueToMedia = false,
  onClose,
}) => {
  const navigate = useNavigate();

  // State management
  const [isExpanded, setIsExpanded] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionTimeSpent, setSessionTimeSpent] = useState(0);
  const [dailyTimeSpent, setDailyTimeSpent] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [maxDailyTime, setMaxDailyTime] = useState(0);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [showTimeLimitModal, setShowTimeLimitModal] = useState(false);
  const [isNavigatingAway, setIsNavigatingAway] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Update session time in parent component through data attribute
  useEffect(() => {
    const trackerElement = document.getElementById('daily-session-tracker');
    if (trackerElement) {
      trackerElement.setAttribute('data-session-time', sessionTimeSpent.toString());
    }
  }, [sessionTimeSpent]);

  // REORGANIZED REF DECLARATIONS - ALL TOGETHER BEFORE API HOOKS  // Refs to prevent duplicate calls and manage state
  const timerRef = useRef(null);
  const updateIntervalRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  const sessionStartTime = useRef(null);
  const autoStartAttemptedRef = useRef(false);
  const isStartingSessionRef = useRef(false);

  // NEW: Ref to track actual session time for API calls
  const actualSessionTimeRef = useRef(0);
  // API hooks
  const [startSession] = useStartCourseSessionMutation();
  const [endSession] = useEndCourseSessionMutation();
  const [updateSession] = useUpdateCourseSessionMutation();
  const { data: accessData, refetch: refetchAccess } =
    useCheckCourseAccessQuery(enrollmentId, { skip: !enrollmentId });

  const autoNavigateTimeoutRef = useRef(null);

  // Format time utility
  const formatTime = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  }, []);

  // Pause timer function - moved up to avoid initialization errors
  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, []);

  // Update backend with current session time - using state for consistency
  const updateBackend = useCallback(async () => {
    try {
      await updateSession({
        enrollment_id: enrollmentId,
        userId: userId,
        seconds_spent: sessionTimeSpent, // Use state value for consistency
      }).unwrap();
    } catch (error) {
      console.error("Failed to update session:", error);
    }
  }, [updateSession, enrollmentId, userId, sessionTimeSpent]);

  // UPDATED: Start timer function ensuring ref and state stay in sync
  const startTimer = useCallback(() => {
    if (timerRef.current) return;

    timerRef.current = setInterval(() => {
      if (isPageVisible) {
        // Update both the state and ref to ensure they remain in sync
        setSessionTimeSpent((prev) => {
          const newValue = prev + 1;
          // Ensure the ref matches the state exactly
          actualSessionTimeRef.current = newValue;
          // Update the data attribute
          const trackerElement = document.getElementById('daily-session-tracker');
          if (trackerElement) {
            trackerElement.setAttribute('data-session-time', newValue.toString());
          }
          return newValue;
        });
        // Only decrement timeRemaining if it's finite (not Infinity)
        setTimeRemaining((prev) => {
          if (prev === Infinity) return Infinity;
          return Math.max(0, prev - 1);
        });
      }
    }, 1000);

    // Update backend every minute
    updateIntervalRef.current = setInterval(() => {
      if (isPageVisible && sessionActive) {
        updateBackend();
      }
    }, 60000);
  }, [isPageVisible, sessionActive, updateBackend, setSessionTimeSpent, setTimeRemaining]);

  const exitFullScreen = () => {
    // Check if currently in fullscreen mode and exit if true
    if (document.fullscreenElement ||
      document.mozFullScreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement) {

      (document.exitFullscreen ||
        document.mozCancelFullScreen ||
        document.webkitExitFullscreen ||
        document.msExitFullscreen)?.call(document);
    }
  };

  const clearAllQuizStorage = () => {
    // Also remove activeCourseContent
    localStorage.removeItem('activeCourseContent');

    // Always take a snapshot of the keys first
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('activeCourseContent') || key.startsWith('quiz-state') || key.startsWith('assignment-state') || key.startsWith('audio-time') || key.startsWith('video-time'))) {
        keysToRemove.push(key);
      }
    }
    
    exitFullScreen();

    // Now remove them
    keysToRemove.forEach(key => localStorage.removeItem(key));
  };

  // UPDATED: End session handler using session time state for consistency
  const handleEndSession = useCallback(async (customTimeSpent = null) => {
    try {
      // Pause timer immediately to prevent time from incrementing
      pauseTimer();

      // Use custom time or current session time state (not the ref) for consistency
      const timeToSend = customTimeSpent !== null ? customTimeSpent : sessionTimeSpent;

      clearAllQuizStorage();

      const response = await endSession({
        enrollment_id: enrollmentId,
        userId: userId,
        actual_time_spent: timeToSend, // Use the time from state
      }).unwrap();

      // Reset the session state
      setSessionActive(false);

      // Don't reset actualSessionTimeRef here as we need it for the modal
      // We'll reset it after showing the modal in handleEndSessionConfirm

      // Notify parent component of session state change after state is updated
      setTimeout(() => {
        if (onSessionStateChange) onSessionStateChange(false);
      }, 0);
    } catch (error) {
      console.error("Failed to end session:", error);
    }
  }, [endSession, enrollmentId, userId, sessionTimeSpent]);

  // Auto-start session handler with improved guards
  const handleAutoStartSession = useCallback(async () => {
    // Multiple guards to prevent duplicate calls
    if (autoStartAttemptedRef.current || isStartingSessionRef.current) {
      return;
    }

    try {
      // Set flags immediately to prevent race conditions
      autoStartAttemptedRef.current = true;
      isStartingSessionRef.current = true;

      const response = await startSession({
        enrollment_id: enrollmentId,
        userId: userId,
      }).unwrap();

      if (response.success) {
        setSessionActive(true);
        sessionStartTime.current = Date.now();
        lastUpdateRef.current = Date.now();
        // Reset the actual session time counter
        actualSessionTimeRef.current = 0;
        startTimer();

        // Notify parent component of session state change after state is updated
        // This avoids React detecting state changes during render
        setTimeout(() => {
          if (onSessionStateChange) onSessionStateChange(true);
        }, 0);
        setIsInitializing(false);
      }
    } catch (error) {
      console.error("Failed to auto-start session:", error);
      setIsInitializing(false);
      // Reset flag on error to allow retry if needed
      autoStartAttemptedRef.current = false;
    } finally {
      isStartingSessionRef.current = false;
    }
  }, [startSession, enrollmentId, userId, startTimer]);

  // Initialize session data and handle auto-start
  useEffect(() => {
    if (!accessData?.data) return;

    const data = accessData.data;

    // Update state with fetched data (already in seconds now)
    setDailyTimeSpent(data.todaySecondsSpent);
    setMaxDailyTime(data.maxAllowedDailyMinutes || 0);

    // Check if there's no time limit (maxAllowedDailySeconds is 0 or undefined)
    const hasNoTimeLimit = !data.maxAllowedDailySeconds || data.maxAllowedDailySeconds === 0;

    setTimeRemaining(
      hasNoTimeLimit ? Infinity : Math.max(0, data.maxAllowedDailySeconds - data.todaySecondsSpent)
    );

    // Handle session state based on backend data
    if (data.hasActiveSession) {
      setSessionActive(true);
      sessionStartTime.current = Date.now();
      setSessionTimeSpent(0);
      actualSessionTimeRef.current = 0; // Reset counter for existing session

      setTimeout(() => {
        if (onSessionStateChange) {
          onSessionStateChange(true);
        }
      }, 50);
      startTimer();
      setIsInitializing(false);
      autoStartAttemptedRef.current = true;
    } else if (data.canAccess && !autoStartAttemptedRef.current) {
      // Auto-start session if user can access and no session is active
      handleAutoStartSession();
    } else if (!data.canAccess) {
      // User cannot access (time limit reached, etc.)
      setIsInitializing(false);
      autoStartAttemptedRef.current = true;
      if (data.reason && data.reason.includes("Maximum")) {
        setShowTimeLimitModal(true);
        // Set timeout for auto navigation after 5 seconds
        autoNavigateTimeoutRef.current = setTimeout(() => {
          handleTimeLimitConfirm();
        }, 3000);
      }
    } else {
      setIsInitializing(false);
      autoStartAttemptedRef.current = true;
    }
  }, [accessData]);


  // // Page visibility handler - enhanced for better synchronization (old Use Effect)
  // useEffect(() => {
  //   const handleVisibilityChange = () => {
  //     const isVisible = !document.hidden;
  //     setIsPageVisible(isVisible);

  //     if (isVisible && sessionActive) {
  //       // When becoming visible again, ensure we're properly synchronized
  //       // But don't count time while page was invisible
  //       lastUpdateRef.current = Date.now();

  //       // Make sure the ref is synced with the state when visibility changes
  //       actualSessionTimeRef.current = sessionTimeSpent;

  //       startTimer();
  //     } else if (!isVisible && sessionActive) {
  //       pauseTimer();
  //     }
  //   };

  //   document.addEventListener("visibilitychange", handleVisibilityChange);
  //   return () =>
  //     document.removeEventListener("visibilitychange", handleVisibilityChange);
  // }, [sessionActive, sessionTimeSpent, pauseTimer, startTimer]);

  // Page visibility handler - enhanced for better synchronization (New Use Effect For Resume on tab change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;

      setIsPageVisible(isVisible);

      if (sessionActive) {
        if (isVisible) {

          // More aggressive approach: always clear and restart
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          if (updateIntervalRef.current) {
            clearInterval(updateIntervalRef.current);
            updateIntervalRef.current = null;
          }

          // Reset timing reference
          lastUpdateRef.current = Date.now();
          actualSessionTimeRef.current = sessionTimeSpent;

          // Start fresh timer
          timerRef.current = setInterval(() => {
            if (document.hidden) return; // Double-check visibility

            setSessionTimeSpent((prev) => {
              const newValue = prev + 1;
              actualSessionTimeRef.current = newValue;
              return newValue;
            });
            setTimeRemaining((prev) => Math.max(0, prev - 1));
          }, 1000);

          // Restart backend update interval
          updateIntervalRef.current = setInterval(() => {
            if (!document.hidden && sessionActive) {
              updateBackend();
            }
          }, 60000);

        } else {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          if (updateIntervalRef.current) {
            clearInterval(updateIntervalRef.current);
            updateIntervalRef.current = null;
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [sessionActive, sessionTimeSpent, updateBackend]);

  // Pause/resume driven by external video pause control
  useEffect(() => {
    const shouldPause = pauseDueToMedia
    if (shouldPause) {
      // immediate pause when media paused
      pauseTimer();
    } else {
      // resume only if session is active and page visible
      if (sessionActive && !timerRef.current && !document.hidden) {
        startTimer();
      }
    }
    // do not include pauseTimer/startTimer in deps to avoid re-creating
  }, [pauseDueToMedia, sessionActive, isPageVisible]);

  useEffect(() => {
    let navigationBlocked = false;

    const handleEndSessionEvent = (event) => {
      handleEndSession(event.detail?.sessionTime);
    };

    const handleSessionStateChange = (event) => {
      if (event.detail?.active === false) {
        setSessionActive(false);
        pauseTimer();
      }
    };

    const handleBeforeUnload = async (e) => {
      // Only show warning if session is active and not ending through modal
      if (sessionActive && !showTimeLimitModal && !showEndSessionModal) {
        // e.preventDefault();
        // e.returnValue = "";
        pauseTimer();

        // Dispatch event to sync topic time before unload
        window.dispatchEvent(new CustomEvent('SYNC_TOPIC_TIME_BEFORE_SESSION_END', {
          detail: { reason: 'page_unload' }
        }));

        const sessionData = {
          enrollment_id: enrollmentId,
          userId: userId,
          actual_time_spent: sessionTimeSpent,
        };

        // Send data using sendBeacon
        const blob = new Blob([JSON.stringify(sessionData)], { type: 'application/json' });

        navigator.sendBeacon(
          `${import.meta.env.VITE_BACKEND_URL
          }/track-course/end-session`,
          blob
        );
      }
    };

    // Add event listeners
    const tracker = document.getElementById('daily-session-tracker');
    if (tracker) {
      tracker.addEventListener('sessionStateChange', handleSessionStateChange);
      tracker.addEventListener('endSession', handleEndSessionEvent);
    }

    const handlePopState = (e) => {
      if (sessionActive && !showTimeLimitModal && !navigationBlocked) {
        // Set flag to prevent infinite loops
        navigationBlocked = true;

        // Show the modal
        setIsNavigatingAway(true);
        setShowEndSessionModal(true);

        // Add a new entry to history to "cancel" the back navigation
        setTimeout(() => {
          window.history.go(1);
          navigationBlocked = false;
        }, 0);
      }
    };

    // Reset navigation block when session ends
    const resetNavigationBlock = () => {
      navigationBlocked = false;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    // Custom event to reset navigation block
    window.addEventListener('resetNavigationBlock', resetNavigationBlock);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener('resetNavigationBlock', resetNavigationBlock);
      const tracker = document.getElementById('daily-session-tracker');
      if (tracker) {
        tracker.removeEventListener('sessionStateChange', handleSessionStateChange);
        tracker.removeEventListener('endSession', handleEndSessionEvent);
      }
    };
  }, [sessionActive, showTimeLimitModal, showEndSessionModal, pauseTimer, handleEndSession, sessionTimeSpent]);

  // Auto-collapse widget
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setIsExpanded(false);
  //   }, 3000);
  //   return () => clearTimeout(timer);
  // }, []);

  // Manual start session handler (fallback) with duplicate prevention
  const handleManualStartSession = async () => {
    if (isStartingSessionRef.current) {
      return;
    }

    try {
      isStartingSessionRef.current = true;

      const response = await startSession({
        enrollment_id: enrollmentId,
        userId: userId,
      }).unwrap();

      if (response.success) {
        setSessionActive(true);
        sessionStartTime.current = Date.now();
        lastUpdateRef.current = Date.now();
        actualSessionTimeRef.current = 0; // Reset counter

        // Notify parent component of session state change after state is updated
        setTimeout(() => {
          if (onSessionStateChange) onSessionStateChange(true);
        }, 0);
        startTimer();
        autoStartAttemptedRef.current = true;
      }
    } catch (error) {
      console.error("Failed to start session:", error);
    } finally {
      isStartingSessionRef.current = false;
    }
  };

  // UPDATED: Handle time limit reached with proper time capture  

  const handleTimeLimitReached = useCallback(async () => {
    // Step 1: Capture the current session time from state for consistency with UI
    const currentSessionTime = sessionTimeSpent;

    // Step 2: Immediately pause the session timer
    pauseTimer();

    // Step 2.5: Dispatch custom event for topic time tracking to handle session limit
    window.dispatchEvent(new CustomEvent('SYNC_TOPIC_TIME_ON_SESSION_LIMIT'));

    // Wait a small delay to ensure the event is processed
    await new Promise(resolve => setTimeout(resolve, 100));

    // Step 3: End the session in the backend with captured time
    await handleEndSession(currentSessionTime);

    // Step 4: Show the modal
    setShowTimeLimitModal(true);

    // Step 5: Disable scrolling and interactions
    document.body.style.overflow = "hidden";

    // Set timeout for auto navigation after 5 seconds
    autoNavigateTimeoutRef.current = setTimeout(() => {
      handleTimeLimitConfirm();
    }, 3000);

  }, [pauseTimer, handleEndSession, sessionTimeSpent]);

  // Handle time limit modal confirm
  const handleTimeLimitConfirm = () => {

    // Clear the auto-navigation timeout if it exists
    if (autoNavigateTimeoutRef.current) {
      clearTimeout(autoNavigateTimeoutRef.current);
      autoNavigateTimeoutRef.current = null;
    }

    // Re-enable scrolling
    document.body.style.overflow = "unset";

    setShowTimeLimitModal(false);

    // Navigate to dashboard
    navigate("/student-dashboard");
  };

  // Add cleanup for the timeout in a useEffect
  useEffect(() => {
    return () => {
      if (autoNavigateTimeoutRef.current) {
        clearTimeout(autoNavigateTimeoutRef.current);
      }
    };
  }, []);

  // Modified modal handlers
  // const handleEndSession = async () => {
  //   pauseTimer();
  //   const currentSessionTime = sessionTimeSpent;
  //   await handleEndSession(currentSessionTime);
  //   actualSessionTimeRef.current = 0;

  //   // Dispatch event to reset navigation block
  //   window.dispatchEvent(new CustomEvent('resetNavigationBlock'));

  //   navigate("/student-dashboard");
  // };

  // Check if session should auto-end due to time limit
  useEffect(() => {
    if (timeRemaining !== Infinity && timeRemaining <= 0 && sessionActive && !showTimeLimitModal) {
      handleTimeLimitReached();
    }
  }, [
    timeRemaining,
    sessionActive,
    showTimeLimitModal,
    handleTimeLimitReached,
  ]);

  // Calculate progress percentage - handle unlimited time case
  const progressPercentage = timeRemaining === Infinity
    ? 0 // Or any other visual indicator for unlimited
    : Math.min(100, (((dailyTimeSpent + sessionTimeSpent) * 100) / (maxDailyTime * 60)));
  // (138 + 0) / 5400 * 100 ≈ 2.56%

  // We'll handle session state changes only in specific places,
  // not in a useEffect to avoid infinite loops

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-4 border border-gray-200/50 w-80">
          <div className="flex items-center justify-center space-x-3">
            <Loader className="h-5 w-5 text-blue-500 animate-spin" />
            <span className="text-gray-600 font-medium">
              Starting session...
            </span>
          </div>
        </div>
      </div>
    );
  }


  return (
    <>
      {/* Main Widget */}
      <AnimatePresence>
        <motion.div
          className="fixed top-16 right-6 z-[1000] overflow-y-auto custom-scrollbar "
          initial={{ opacity: 0, y: -20 }}
          animate={isRightSidebarOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            display: isRightSidebarOpen ? "block" : "none",
          }}
        >
          <div className="p-4">
            <div className="rounded-2xl shadow-lg bg-white border border-gray-200 p-4 w-full max-w-[310px]">
              <div className="flex flex-col space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                    <Timer className="h-4 w-4 mr-1 text-blue-500" />
                    Course Session
                  </h3>
                  <div
                    className={`flex items-center space-x-1 px-1 py-0.5 rounded-full text-xs font-medium mr-2 ml-14 ${sessionActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 mr-1 rounded-full ${sessionActive ? "bg-green-500 animate-pulse" : "bg-gray-400"
                        }`}
                    />
                    {sessionActive ? "Active" : "Inactive"}
                  </div>
                  {/* Show pause badge when paused due to video */}
                  {pauseDueToMedia && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 border border-yellow-200 text-yellow-800">
                      <span className="text-sm">⏸</span>
                      <span>Timer Paused</span>
                    </div>
                  )}

                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors ml-auto"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Time Stats */}
                <div className="space-y-2">
                  <div className="bg-blue-50 rounded-lg p-5">
                    <div className="flex items-center justify-between">
                      {/* Group icon + time */}
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-blue-500" />
                        <div className="text-sm font-bold text-blue-700">
                          {formatTime(dailyTimeSpent + sessionTimeSpent)}
                        </div>
                      </div>
                      <span className="text-xs text-blue-600 font-medium">Today</span>
                    </div>
                  </div>

                  <div
                    className={`rounded-lg p-5 ${timeRemaining !== Infinity && timeRemaining <= 300 ? "bg-red-50" : "bg-green-50"}`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Group icon + time */}
                      <div className="flex items-center space-x-1">
                        <Timer
                          className={`h-3 w-3 ${timeRemaining !== Infinity && timeRemaining <= 300 ? "text-red-500" : "text-green-500"}`}
                        />
                        <div
                          className={`text-sm font-bold ${timeRemaining !== Infinity && timeRemaining <= 300 ? "text-red-700" : "text-green-700"}`}
                        >
                          {timeRemaining === Infinity ? "Unlimited" : formatTime(timeRemaining)}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-medium ${timeRemaining !== Infinity && timeRemaining <= 300 ? "text-red-600" : "text-green-600"}`}
                      >
                        Remaining
                      </span>
                    </div>
                  </div>
                </div>

                {/* Daily Progress */}
                {timeRemaining !== Infinity && <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Daily Progress</span>
                    <span>{Math.min(100, Math.round(progressPercentage))}%</span>
                  </div>
                  <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${timeRemaining <= 300 ? "bg-gradient-to-r from-red-400 to-red-600" : "bg-gradient-to-r from-blue-400 to-blue-600"
                        }`}
                      style={{ width: `${Math.min(100, progressPercentage)}%` }}
                    />
                  </div>
                </div>}

                {/* Page Visibility Indicator */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1">
                    {isPageVisible ? (
                      <Eye className="h-3 w-3 text-green-500" />
                    ) : (
                      <EyeOff className="h-3 w-3 text-gray-400" />
                    )}
                    <span className={isPageVisible ? "text-green-600" : "text-gray-500"}>
                      {isPageVisible ? "Page Active" : "Page Hidden"}
                    </span>
                  </div>
                  {!isPageVisible && sessionActive && (
                    <span className="text-orange-500 text-xs font-medium">Timer Paused</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence >

      {/* Time Limit Reached Modal */}
      {
        showTimeLimitModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 transform transition-all animate-pulse-once">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <Ban className="h-8 w-8 text-orange-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center justify-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    Time&apos;s Up!
                  </h2>
                  <p className="text-gray-600 text-base">
                    You&apos;ve reached your daily time limit for this course.
                  </p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 border border-orange-200">
                  <p className="text-orange-800 font-medium">
                    Please come back tomorrow to continue learning.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <h4 className="font-semibold text-gray-700 text-sm">Today&apos;s Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Total Time Spent</p>
                      <p className="font-bold text-gray-800">{formatTime(dailyTimeSpent)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">This Session</p>
                      <p className="font-bold text-gray-800">{formatTime(sessionTimeSpent)}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleTimeLimitConfirm}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-semibold text-base hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <span>Return to Dashboard (Auto in 5s)</span>
                </button>
              </div>
            </div>
          </div>
        )
      }

    </>
  );
};

export default DailySessionTracker;