import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  courseCompletionAnalytics: null,
  averageTimeSpentAnalytics: null,
  averageSessionLengths: null,
  recentEnrollments: null, // Add this line
};

export const userEngagementAnalyticsSlice = createSlice({
  name: "user_engagement_analytics",
  initialState,
  reducers: {
    setCourseCompletionAnalytics: (state, action) => {
      state.courseCompletionAnalytics = action.payload.courseCompletionAnalytics;
    },
    unsetCourseCompletionAnalytics: (state) => {
      state.courseCompletionAnalytics = null;
    },

    setAverageTimeSpentAnalytics: (state, action) => {
      state.averageTimeSpentAnalytics = action.payload.averageTimeSpentAnalytics;
    },
    unsetAverageTimeSpentAnalytics: (state) => {
      state.averageTimeSpentAnalytics = null;
    },

    setAverageSessionLengths: (state, action) => {
      state.averageSessionLengths = action.payload.averageSessionLengths;
    },
    unsetAverageSessionLengths: (state) => {
      state.averageSessionLengths = null;
    },

    setRecentEnrollments: (state, action) => {
      state.recentEnrollments = action.payload.recentEnrollments;
    },
    unsetRecentEnrollments: (state) => {
      state.recentEnrollments = null;
    },
  },
});

export const {
  setCourseCompletionAnalytics,
  unsetCourseCompletionAnalytics,
  setAverageTimeSpentAnalytics,
  unsetAverageTimeSpentAnalytics,
  setAverageSessionLengths,
  unsetAverageSessionLengths,
  setRecentEnrollments, // Add this line
  unsetRecentEnrollments, // Add this line
} = userEngagementAnalyticsSlice.actions;

export default userEngagementAnalyticsSlice.reducer;
