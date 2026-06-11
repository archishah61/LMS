import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  overallPerformance: null,
  categoryRoleAnalytics: null,
  questionLevelInsights: null,
  timeBasedAnalytics: null,
  responseQualityMetrics: null,
  adminDashboardVisualizations: null,
  userPerformanceSummary: null,        // /user-performance-summary
  topBottomUsersByCategory: null,      // /top-bottom-users-by-category
  overallTopBottomPerformers: null,    // /overall-top-bottom-performers
};

export const aiInterviewAnalyticsSlice = createSlice({
  name: "ai_interview_analytics",
  initialState,
  reducers: {
    setOverallPerformance: (state, action) => {
      state.overallPerformance = action.payload;
    },
    unsetOverallPerformance: (state) => {
      state.overallPerformance = null;
    },
    setCategoryRoleAnalytics: (state, action) => {
      state.categoryRoleAnalytics = action.payload;
    },
    unsetCategoryRoleAnalytics: (state) => {
      state.categoryRoleAnalytics = null;
    },
    setQuestionLevelInsights: (state, action) => {
      state.questionLevelInsights = action.payload;
    },
    unsetQuestionLevelInsights: (state) => {
      state.questionLevelInsights = null;
    },
    setTimeBasedAnalytics: (state, action) => {
      state.timeBasedAnalytics = action.payload;
    },
    unsetTimeBasedAnalytics: (state) => {
      state.timeBasedAnalytics = null;
    },
    setResponseQualityMetrics: (state, action) => {
      state.responseQualityMetrics = action.payload;
    },
    unsetResponseQualityMetrics: (state) => {
      state.responseQualityMetrics = null;
    },
    setAdminDashboardVisualizations: (state, action) => {
      state.adminDashboardVisualizations = action.payload;
    },
    unsetAdminDashboardVisualizations: (state) => {
      state.adminDashboardVisualizations = null;
    },
    setUserPerformanceSummary: (state, { payload }) => {
      state.userPerformanceSummary = payload;
    },
    unsetUserPerformanceSummary: (state) => {
      state.userPerformanceSummary = null;
    },

    setTopBottomUsersByCategory: (state, { payload }) => {
      state.topBottomUsersByCategory = payload;
    },
    unsetTopBottomUsersByCategory: (state) => {
      state.topBottomUsersByCategory = null;
    },

    setOverallTopBottomPerformers: (state, { payload }) => {
      state.overallTopBottomPerformers = payload;
    },
    unsetOverallTopBottomPerformers: (state) => {
      state.overallTopBottomPerformers = null;
    },
  },
});

export const {
  setOverallPerformance,
  unsetOverallPerformance,
  setCategoryRoleAnalytics,
  unsetCategoryRoleAnalytics,
  setQuestionLevelInsights,
  unsetQuestionLevelInsights,
  setTimeBasedAnalytics,
  unsetTimeBasedAnalytics,
  setResponseQualityMetrics,
  unsetResponseQualityMetrics,
  setAdminDashboardVisualizations,
  unsetAdminDashboardVisualizations,
  setUserPerformanceSummary,
  unsetUserPerformanceSummary,
  setTopBottomUsersByCategory,
  unsetTopBottomUsersByCategory,
  setOverallTopBottomPerformers,
  unsetOverallTopBottomPerformers,
} = aiInterviewAnalyticsSlice.actions;

export default aiInterviewAnalyticsSlice.reducer; 