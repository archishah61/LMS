import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  category: null,
  role: null,
  interviewQuestions: [],
  interviewSettings: {
    limit: 3,
  },
};

export const interviewSlice = createSlice({
  name: "interview_info",
  initialState,
  reducers: {
    setInterviewInfo: (state, action) => {
      state.category = action.payload.category;
      state.role = action.payload.role;
      state.interviewQuestions = action.payload.interview_questions;
    },
    unsetInterviewInfo: (state) => {
      state.category = null;
      state.role = null;
      state.interviewQuestions = [];
    },
    setInterviewSettings: (state, action) => {
      state.interviewSettings = action.payload;
    },
  },
});

export const { setInterviewInfo, unsetInterviewInfo, setInterviewSettings } = interviewSlice.actions;

export default interviewSlice.reducer;
