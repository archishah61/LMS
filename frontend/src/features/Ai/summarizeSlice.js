import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  summary: null,
  bulletPoints: [],
  flashcards: [],
};

export const summarizeSlice = createSlice({
  name: "summarize_info",
  initialState,
  reducers: {
    setSummarizeInfo: (state, action) => {
      state.summary = action.payload.summary;
      state.bulletPoints = action.payload.bullet_points;
      state.flashcards = action.payload.flash_cards;
    },
    unsetSummarizeInfo: (state) => {
      state.summary = null;
      state.bulletPoints = [];
      state.flashcards = [];
    },
  },
});

export const { setSummarizeInfo, unsetSummarizeInfo } = summarizeSlice.actions;

export default summarizeSlice.reducer;
