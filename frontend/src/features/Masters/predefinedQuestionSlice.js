import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  preDefinedQuestions: null,
};

export const preDefinedQuestionsSlice = createSlice({
  name: "preDefinedQuestions",
  initialState,
  reducers: {
    setPreDefinedQuestions: (state, action) => {
      state.preDefinedQuestions = action.payload.preDefinedQuestions;
    },
    unsetPreDefinedQuestions: (state) => {
      state.preDefinedQuestions = null;
    },
  },
});

export const { setPreDefinedQuestions, unsetPreDefinedQuestions } = preDefinedQuestionsSlice.actions;

export default preDefinedQuestionsSlice.reducer;
