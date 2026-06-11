import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  enrollment: null, // current enrollment info
};

export const userContestSlice = createSlice({
  name: "user_contest",
  initialState,
  reducers: {
    setEnrollmentInfo: (state, action) => {
      state.enrollment = action.payload;
    },
    unsetEnrollmentInfo: (state) => {
      state.enrollment = null;
    },
  },
});

export const { setEnrollmentInfo, unsetEnrollmentInfo } = userContestSlice.actions;

export default userContestSlice.reducer;
