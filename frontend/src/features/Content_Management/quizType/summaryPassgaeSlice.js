import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  summarizePassageQuestions: [], // Store all summarize-passage questions
  selectedQuestion: null,        // Store a selected question if needed
};

export const summarizePassageSlice = createSlice({
  name: "summarizePassage",
  initialState,
  reducers: {
    setSummarizePassageQuestions: (state, action) => {
      state.summarizePassageQuestions = action.payload;
    },
    addSummarizePassageQuestion: (state, action) => {
      state.summarizePassageQuestions.push(action.payload);
    },
    updateSummarizePassageQuestion: (state, action) => {
      const index = state.summarizePassageQuestions.findIndex(
        (question) => question.id === action.payload.id
      );
      if (index !== -1) {
        state.summarizePassageQuestions[index] = action.payload;
      }
    },
    deleteSummarizePassageQuestion: (state, action) => {
      state.summarizePassageQuestions = state.summarizePassageQuestions.filter(
        (question) => question.id !== action.payload.id
      );
    },
    setSelectedSummarizePassageQuestion: (state, action) => {
      state.selectedQuestion = action.payload;
    },
    clearSelectedSummarizePassageQuestion: (state) => {
      state.selectedQuestion = null;
    },
  },
});

export const {
  setSummarizePassageQuestions,
  addSummarizePassageQuestion,
  updateSummarizePassageQuestion,
  deleteSummarizePassageQuestion,
  setSelectedSummarizePassageQuestion,
  clearSelectedSummarizePassageQuestion,
} = summarizePassageSlice.actions;

export default summarizePassageSlice.reducer;
