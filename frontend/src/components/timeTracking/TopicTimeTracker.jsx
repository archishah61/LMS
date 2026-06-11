import React, { useState, useEffect, useRef, useCallback } from "react";
import { useUpdateTopicTimeSpentMutation } from "../../services/Learning_Progress/progressTrackingApi";

const TopicTimeTracker = ({ userId, topicId, isActive }) => {
  
  // Ensure isActive is always a boolean
  const normalizedIsActive = isActive === true;
  
  // Log the initial state
  const [updateTopicTimeSpent] = useUpdateTopicTimeSpentMutation();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden);
  const intervalRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  const lastSyncRef = useRef(Date.now());
  const pendingTimeRef = useRef(0);
  const prevIsActiveRef = useRef(normalizedIsActive);
  const topicIdRef = useRef(topicId);
  const didMountRef = useRef(false);
    // Sync interval in seconds (how often to send updates to the backend)
  const SYNC_INTERVAL = 60; // Sync every minute
  const syncWithBackend = useCallback(async (forceSync = false) => {
    // Store current values in local variables to ensure consistency even if refs change during the async call
    const pendingTime = pendingTimeRef.current;
    const currentTopicId = topicIdRef.current || topicId;
    
    // Add global flag to prevent double-counting during rapid transitions
    if (window.recentTimeTrackingEvent && !forceSync) {
      // Consider the time already accounted for
      return;
    }
    
    if ((pendingTime > 0 || forceSync) && userId && currentTopicId) {
      // Set global flag to prevent other components from sync attempts
      window.recentTimeTrackingEvent = true;
      
      
      // Make a local copy of the pending time before async operation
      const timeToSync = pendingTime;
        try {
        // Calculate any additional time that might have accumulated since this function was called
        // This helps prevent the 20s lag issue by capturing the most recent time
        const now = Date.now();
        const additionalTime = Math.max(0, (now - lastUpdateRef.current) / 1000);
        
        // Add the additional time if it's reasonable (< 30s)
        let finalTimeToSync = timeToSync;
        if (additionalTime > 0 && additionalTime < 30) {
          finalTimeToSync += additionalTime;
          // Update the lastUpdateRef to now
          lastUpdateRef.current = now;
        }
        
        // Don't sync if time is 0 unless forced
        if (finalTimeToSync <= 0 && !forceSync) {
          window.recentTimeTrackingEvent = false;
          return;
        }
        
        // Immediately reduce the pending time to prevent double-counting
        // if multiple syncs happen in parallel
        pendingTimeRef.current = Math.max(0, pendingTimeRef.current - timeToSync);
        
        
        const response = await updateTopicTimeSpent({
          userId,
          topicId: currentTopicId,
          timeSpent: Math.round(finalTimeToSync) // Round to nearest second for API call
        }).unwrap();
        
        // Update last sync timestamp after successful sync
        if (response.success) {
          lastSyncRef.current = Date.now();
        } else {
          console.error(`Update time API returned error for topic ${currentTopicId}:`, response);
          // Add the time back to pending if the request failed
          pendingTimeRef.current += timeToSync;
        }
      } catch (error) {
        console.error(`Failed to update time for topic ${currentTopicId}:`, error);
        console.error(`Error details:`, error);
        // Add the time back to pending if the request failed
        pendingTimeRef.current += timeToSync;
      } finally {
        // Clear the global flag after a short delay to allow other operations to complete
        setTimeout(() => {
          window.recentTimeTrackingEvent = false;
        }, 300);
      }
    }
  }, [userId, topicId, updateTopicTimeSpent]);  const startTimer = useCallback(() => {
    if (intervalRef.current) {
      return;
    }
    
    // Always reset the last update time when starting the timer
    // This prevents counting time when the timer was stopped
    lastUpdateRef.current = Date.now();
    
    // Use a more precise approach with requestAnimationFrame for smoother timing
    // combined with a lower interval frequency to reduce browser overhead
    const frameRate = 250; // Update every 250ms for better accuracy (down from 500ms)
    let lastFrameTime = Date.now();
    let accumulatedTime = 0; // Track sub-second accumulated time for more precise updates
    
    const timerLoop = () => {
      const now = Date.now();
      const elapsed = now - lastFrameTime;
      
      // Only process if enough time has passed (to reduce CPU usage)
      if (elapsed >= frameRate) {
        // Calculate seconds since last update with millisecond precision
        const delta = (now - lastUpdateRef.current) / 1000;
        lastUpdateRef.current = now;
        lastFrameTime = now;
        
        if (delta > 0 && delta < 30) { // Ignore unreasonable time differences (>30s)
          // Store the exact floating-point value for better accuracy
          const accurateIncrement = Math.min(delta, 5); // Cap at 5 seconds to prevent large jumps
          
          // Update elapsed time with precise floating-point increment
          setElapsedTime(prev => {
            // Use more precise math (avoid rounding errors)
            const newTime = prev + accurateIncrement;
            return parseFloat(newTime.toFixed(3)); // Keep 3 decimal places for millisecond precision
          });
          
          // Add to pending time for backend sync
          pendingTimeRef.current += accurateIncrement;
          
          // Accumulate time even between sync intervals for more accurate tracking
          accumulatedTime += accurateIncrement;
          
          // Check if it's time to sync with the backend - more aggressive sync for better accuracy
          // Either sync by time interval or when accumulated enough time
          if (now - lastSyncRef.current >= SYNC_INTERVAL * 1000 || accumulatedTime >= 15) {
            syncWithBackend();
            // Reset accumulated time after sync
            accumulatedTime = 0;
          }
        } else if (delta >= 30) {
          // Log for debugging but don't count unreasonable time increments
          // Still update lastUpdateRef.current to reset the time calculation
          lastUpdateRef.current = now;
        }
      }
      
      // Schedule next frame if interval still exists
      if (intervalRef.current) {
        intervalRef.current = requestAnimationFrame(timerLoop);
      }
    };
    
    // Start the loop
    intervalRef.current = requestAnimationFrame(timerLoop);
  }, [syncWithBackend, setElapsedTime, topicId]);
  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      
      // Calculate and add any remaining time since the last update with high precision
      const now = Date.now();
      // More precise time calculation with floating point to millisecond precision
      const delta = (now - lastUpdateRef.current) / 1000;
      
      if (delta > 0 && delta < 30) { // Ignore unreasonable time differences
        const accurateIncrement = Math.min(delta, 5); // Cap at 5 seconds for safety
        
        
        // Update with precise floating-point math
        pendingTimeRef.current += accurateIncrement;
        setElapsedTime(prev => {
          const newTime = prev + accurateIncrement;
          return parseFloat(newTime.toFixed(3)); // Keep 3 decimal places for precision
        });
      }
      
      // Cancel animation frame instead of clearInterval
      cancelAnimationFrame(intervalRef.current);
      intervalRef.current = null;
      
      // Update lastUpdateRef to now to ensure any future calculations start from this point
      lastUpdateRef.current = now;
      
      // Always force a sync when stopping the timer to prevent time loss
      // This helps mitigate the 20s lag issue by ensuring we sync immediately on stops
      syncWithBackend(true); // Force sync even if pendingTime is 0
    }
  }, [syncWithBackend, topicId, setElapsedTime]);
    // Handle document visibility changes and custom sync events
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsPageVisible((prev) => {
        // Only act if visibility actually changed
        if (prev !== visible) {
          
          if (!visible) {
            stopTimer();
            // Force a sync when page becomes hidden
            if (pendingTimeRef.current > 0) {
              syncWithBackend();
            }
          } else if (normalizedIsActive) {
            startTimer();
          }
        }
        return visible;
      });
    };
    
    // Handle custom event for topic time sync before quiz
    const handleSyncBeforeQuiz = () => {
      // Always force sync on this event, regardless of pending time
      stopTimer(); // Stop timer first
      syncWithBackend();
    };
    
    // Handle custom event for topic time sync before assignment
    const handleSyncBeforeAssignment = () => {
      stopTimer();
      syncWithBackend();
    };
    
    // Handle custom event for topic time sync before session end
    const handleSyncBeforeSessionEnd = (e) => {
      stopTimer();
      syncWithBackend();
    };
    
    // Handle custom event for topic completion
    const handleSyncOnTopicComplete = () => {
      stopTimer();
      syncWithBackend();
    };
    
    // Handle custom event for daily session limit reached
    const handleSyncOnSessionLimit = () => {
      stopTimer();
      syncWithBackend();
    };
      // Handle focus/blur events for more reliable visibility detection
    const handleFocus = () => {
      setIsPageVisible(true);
      
      // Reset the last update time when gaining focus to avoid counting time when not visible
      lastUpdateRef.current = Date.now();
      
      if (normalizedIsActive) {
        startTimer();
      }
    };
    
    const handleBlur = () => {
      setIsPageVisible(false);
      
      // First calculate any time that needs to be counted
      const now = Date.now();
      const delta = (now - lastUpdateRef.current) / 1000;
      
      if (delta > 0 && delta < 30) {
        pendingTimeRef.current += delta;
      }
      
      // Then stop the timer
      stopTimer();
      
      // Always force a sync when window loses focus to ensure we don't lose time
      syncWithBackend(true);
    };
      // Handle beforeunload event to sync time when page is closed
    const handleBeforeUnload = (e) => {
      
      // First stop the timer to calculate final time
      stopTimer();
      
      // If we have pending time, try to sync it
      if (pendingTimeRef.current > 0) {
        // Use the synchronous approach for unload events
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/learning-progress/progress/update-topic-time-spent', false);  // false makes it synchronous
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send(JSON.stringify({
            userId,
            topicId: topicIdRef.current || topicId,
            timeSpent: pendingTimeRef.current
          }));
        } catch (error) {
          console.error("Failed to sync on page unload:", error);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("SYNC_TOPIC_TIME_BEFORE_QUIZ", handleSyncBeforeQuiz);
    window.addEventListener("SYNC_TOPIC_TIME_BEFORE_ASSIGNMENT", handleSyncBeforeAssignment);
    window.addEventListener("SYNC_TOPIC_TIME_BEFORE_SESSION_END", handleSyncBeforeSessionEnd);
    window.addEventListener("SYNC_TOPIC_TIME_ON_COMPLETE", handleSyncOnTopicComplete);
    window.addEventListener("SYNC_TOPIC_TIME_ON_SESSION_LIMIT", handleSyncOnSessionLimit);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    // Initialize with current visibility state
    handleVisibilityChange();
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("SYNC_TOPIC_TIME_BEFORE_QUIZ", handleSyncBeforeQuiz);
      window.removeEventListener("SYNC_TOPIC_TIME_BEFORE_ASSIGNMENT", handleSyncBeforeAssignment);
      window.removeEventListener("SYNC_TOPIC_TIME_BEFORE_SESSION_END", handleSyncBeforeSessionEnd);
      window.removeEventListener("SYNC_TOPIC_TIME_ON_COMPLETE", handleSyncOnTopicComplete);
      window.removeEventListener("SYNC_TOPIC_TIME_ON_SESSION_LIMIT", handleSyncOnSessionLimit);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [normalizedIsActive, stopTimer, startTimer, syncWithBackend, topicId]);
    // Start/stop timer based on isActive prop with debugging
  useEffect(() => {
    // Update didMountRef on first mount
    if (!didMountRef.current) {
      didMountRef.current = true;
    }
    

    if (topicId !== topicIdRef.current || normalizedIsActive !== prevIsActiveRef.current) {
      
      // First sync any pending time for the previous topic
      if (pendingTimeRef.current > 0 && topicIdRef.current && userId) {
        // Force synchronous sync before continuing
        syncWithBackend().then(() => {
          console.log(`Sync completed for topic ${topicIdRef.current} before switching`);
        }).catch(err => {
          console.error(`Sync failed for topic ${topicIdRef.current}:`, err);
        });
      }
      
      // Reset for new topic
      if (topicId !== topicIdRef.current) {
        pendingTimeRef.current = 0;
        setElapsedTime(0);
        lastUpdateRef.current = Date.now(); // Reset the last update time for the new topic
      }
      
      // If becoming active, reset the last update time
      if (!prevIsActiveRef.current && normalizedIsActive) {
        lastUpdateRef.current = Date.now();
      }
      
      // Update refs
      topicIdRef.current = topicId;
      // Make sure we update this ref as well to prevent additional changes
      prevIsActiveRef.current = normalizedIsActive;
    }
      if (normalizedIsActive && isPageVisible) {
      startTimer();
    } else {
      stopTimer();
    }    // prevIsActiveRef is already updated above
      // Cleanup on unmount or topic change
    return () => {
      // Only do cleanup if this isn't the initial mount
      if (didMountRef.current) {
        
        // Always stop the timer first
        stopTimer();
        
        // Calculate any remaining time since the last timer tick
        const now = Date.now();
        const delta = Math.floor((now - lastUpdateRef.current) / 1000);
        
        if (delta > 0 && delta < 30) { // Ignore unreasonable time differences
          pendingTimeRef.current += delta;
        }
        
        // Then handle any pending time
        if (pendingTimeRef.current > 0) {
          
          // Use a blocking approach for unmount sync to ensure it completes
          try {
            // Set global flag to prevent double-counting
            window.recentTimeTrackingEvent = true;
            
            // Calculate final time more precisely
            const finalTimeToSync = pendingTimeRef.current;
            const timeToSend = Math.round(finalTimeToSync);
            
            // Use the synchronous version of fetch for unmount to ensure it completes
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/learning-progress/progress/update-topic-time-spent', false);  // false makes it synchronous
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify({
              userId,
              topicId: topicIdRef.current,
              timeSpent: timeToSend
            }));
            
            pendingTimeRef.current = 0;
            
            // Clear global flag after a short delay
            setTimeout(() => {
              window.recentTimeTrackingEvent = false;
            }, 300);
          } catch (error) {
            console.error(`Failed to sync on unmount for topic ${topicIdRef.current}:`, error);
            // Don't clear the flag here as we want other components to try syncing if this fails
          }
        }
      }
    };
  }, [normalizedIsActive, userId, topicId, startTimer, stopTimer, syncWithBackend, isPageVisible]);
  
  return null; // This is a non-visual component
};

export default TopicTimeTracker;