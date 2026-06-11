// slices/summarySlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  summaries: null, // Store all summaries
};

export const summarySlice = createSlice({
  name: "summary",
  initialState,
  reducers: {
    setSummaries: (state, action) => {
      state.summaries = action.payload.summaries;
    },
    unsetSummaries: (state) => {
      state.summaries = null;
    },
  },
});

export const { setSummaries, unsetSummaries } = summarySlice.actions;

export default summarySlice.reducer;
