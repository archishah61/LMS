import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  trackingData: null, // Store all course time tracking data
  selectedEnrollmentStats: null, // Store statistics for a specific enrollment
  courseAccessStatus: null, // Store course access status information
  activeSession: null, // Store information about the current active session
};

export const courseTimeTrackingSlice = createSlice({
  name: "course_time_tracking",
  initialState,
  reducers: {
    // ✅ Set All Tracking Data
    setTrackingData: (state, action) => {
      state.trackingData = action.payload.trackingData;
    },
    // ✅ Unset All Tracking Data
    unsetTrackingData: (state) => {
      state.trackingData = null;
    },
    // ✅ Set Selected Enrollment Stats
    setSelectedEnrollmentStats: (state, action) => {
      state.selectedEnrollmentStats = action.payload.stats;
    },
    // ✅ Unset Selected Enrollment Stats
    unsetSelectedEnrollmentStats: (state) => {
      state.selectedEnrollmentStats = null;
    },
    // ✅ Set Course Access Status
    setCourseAccessStatus: (state, action) => {
      state.courseAccessStatus = action.payload.accessStatus;
    },
    // ✅ Unset Course Access Status
    unsetCourseAccessStatus: (state) => {
      state.courseAccessStatus = null;
    },
    // ✅ Set Active Session
    setActiveSession: (state, action) => {
      state.activeSession = action.payload.session;
    },
    // ✅ Unset Active Session
    unsetActiveSession: (state) => {
      state.activeSession = null;
    },
  },
});

export const {
  setTrackingData,
  unsetTrackingData,
  setSelectedEnrollmentStats,
  unsetSelectedEnrollmentStats,
  setCourseAccessStatus,
  unsetCourseAccessStatus,
  setActiveSession,
  unsetActiveSession,
} = courseTimeTrackingSlice.actions;

export default courseTimeTrackingSlice.reducer;