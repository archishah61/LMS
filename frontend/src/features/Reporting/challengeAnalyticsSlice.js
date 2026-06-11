import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  completionStats: null,
  learningOverview: null,
  attemptsStats: null,
};

export const challengeAnalyticsSlice = createSlice({
  name: "challenge_analytics",
  initialState,
  reducers: {
    setCompletionStats: (state, action) => {
      state.completionStats = action.payload.completionStats;
    },
    unsetCompletionStats: (state) => {
      state.completionStats = null;
    },

    setLearningOverview: (state, action) => {
      state.learningOverview = action.payload.learningOverview;
    },
    unsetLearningOverview: (state) => {
      state.learningOverview = null;
    },

    setAttemptsStats: (state, action) => {
      state.attemptsStats = action.payload.attemptsStats;
    },
    unsetAttemptsStats: (state) => {
      state.attemptsStats = null;
    },
  },
});

export const {
  setCompletionStats,
  unsetCompletionStats,
  setLearningOverview,
  unsetLearningOverview,
  setAttemptsStats,
  unsetAttemptsStats,
} = challengeAnalyticsSlice.actions;

export default challengeAnalyticsSlice.reducer;
