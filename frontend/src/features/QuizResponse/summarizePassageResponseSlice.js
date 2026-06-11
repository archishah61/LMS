import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  summarizePassageResponses: [], // All responses
  selectedSummarizeResponse: null, // One selected response (for view/edit)
};

export const summarizePassageResponseSlice = createSlice({
  name: "summarizePassageResponse",
  initialState,
  reducers: {
    setSummarizePassageResponses: (state, action) => {
      state.summarizePassageResponses = action.payload;
    },
    addSummarizePassageResponse: (state, action) => {
      state.summarizePassageResponses.push(action.payload);
    },
    updateSummarizePassageResponse: (state, action) => {
      const index = state.summarizePassageResponses.findIndex(
        (res) => res.id === action.payload.id
      );
      if (index !== -1) {
        state.summarizePassageResponses[index] = action.payload;
      }
    },
    deleteSummarizePassageResponse: (state, action) => {
      state.summarizePassageResponses = state.summarizePassageResponses.filter(
        (res) => res.id !== action.payload.id
      );
    },
    setSelectedSummarizeResponse: (state, action) => {
      state.selectedSummarizeResponse = action.payload;
    },
    clearSelectedSummarizeResponse: (state) => {
      state.selectedSummarizeResponse = null;
    },
  },
});

export const {
  setSummarizePassageResponses,
  addSummarizePassageResponse,
  updateSummarizePassageResponse,
  deleteSummarizePassageResponse,
  setSelectedSummarizeResponse,
  clearSelectedSummarizeResponse,
} = summarizePassageResponseSlice.actions;

export default summarizePassageResponseSlice.reducer;
