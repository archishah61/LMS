import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  attempts: [], // all attempts for current quiz
};

export const userContestQuizSlice = createSlice({
  name: "user_contest_quiz",
  initialState,
  reducers: {
    setAttempts: (state, action) => {
      state.attempts = action.payload;
    },
    unsetAttempts: (state) => {
      state.attempts = [];
    },
    addAttempt: (state, action) => {
      state.attempts.push(action.payload);
    },
  },
});

export const { setAttempts, unsetAttempts, addAttempt } = userContestQuizSlice.actions;

export default userContestQuizSlice.reducer;
