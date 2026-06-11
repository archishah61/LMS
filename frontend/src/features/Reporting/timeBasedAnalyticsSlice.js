import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  estimatedVsActualCompletion: null,
};

export const timeBasedAnalyticsSlice = createSlice({
  name: "time_based_analytics",
  initialState,
  reducers: {
    setEstimatedVsActualCompletion: (state, action) => {
      state.estimatedVsActualCompletion = action.payload.estimatedVsActualCompletion;
    },
    unsetEstimatedVsActualCompletion: (state) => {
      state.estimatedVsActualCompletion = null;
    },
  },
});

export const {
  setEstimatedVsActualCompletion,
  unsetEstimatedVsActualCompletion,
} = timeBasedAnalyticsSlice.actions;

export default timeBasedAnalyticsSlice.reducer;
