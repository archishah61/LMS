import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  enrollments: null,
};

export const enrollmentSlice = createSlice({
  name: "enrollment_info",
  initialState,
  reducers: {
    setEnrollmentInfo: (state, action) => {
      state.enrollments = action.payload.enrollments;
    },
    unsetEnrollmentInfo: (state) => {
      state.enrollments = null;
    },
  },
});

export const { setEnrollmentInfo, unsetEnrollmentInfo } = enrollmentSlice.actions;

export default enrollmentSlice.reducer;
