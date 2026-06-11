import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  quizzes: null, // All quizzes for an activity
};

export const contestQuizSlice = createSlice({
  name: "contest_quiz",
  initialState,
  reducers: {
    // ✅ Set All Quizzes
    setQuizzesInfo: (state, action) => {
      state.quizzes = action.payload.quizzes;
    },
    unsetQuizzesInfo: (state) => {
      state.quizzes = null;
    },
  },
});

export const { setQuizzesInfo, unsetQuizzesInfo } = contestQuizSlice.actions;

export default contestQuizSlice.reducer;
