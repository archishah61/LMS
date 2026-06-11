import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  topPerformersByCategory: null,
  usersWithHighestPoints: null,
};

export const leaderboardAnalyticsSlice = createSlice({
  name: "leaderboard_analytics",
  initialState,
  reducers: {
    setTopPerformersByCategory: (state, action) => {
      state.topPerformersByCategory = action.payload.topPerformersByCategory;
    },
    unsetTopPerformersByCategory: (state) => {
      state.topPerformersByCategory = null;
    },

    setUsersWithHighestPoints: (state, action) => {
      state.usersWithHighestPoints = action.payload.usersWithHighestPoints;
    },
    unsetUsersWithHighestPoints: (state) => {
      state.usersWithHighestPoints = null;
    },
  },
});

export const {
  setTopPerformersByCategory,
  unsetTopPerformersByCategory,
  setUsersWithHighestPoints,
  unsetUsersWithHighestPoints,
} = leaderboardAnalyticsSlice.actions;

export default leaderboardAnalyticsSlice.reducer;
