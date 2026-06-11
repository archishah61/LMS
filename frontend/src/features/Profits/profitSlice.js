import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  metrics: null,
};

export const profitsSlice = createSlice({
  name: "profits_info",
  initialState,
  reducers: {
    setProfitMetrics: (state, action) => {
      state.metrics = action.payload.metrics;
    },
    unsetProfitMetrics: (state) => {
      state.metrics = null;
    },
  },
});

export const { setProfitMetrics, unsetProfitMetrics } = profitsSlice.actions;

export default profitsSlice.reducer;
