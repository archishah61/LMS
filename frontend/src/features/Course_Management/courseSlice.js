import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  courses: null,
  activeCourseId: null,
};

export const courseSlice = createSlice({
  name: "course_info",
  initialState,
  reducers: {
    setCourseInfo: (state, action) => {
      state.courses = action.payload.courses;
      state.activeCourseId = action.payload.activeCourseId;
    },
    unsetCourseInfo: (state) => {
      state.courses = action.payload.courses;
      state.activeCourseId = action.payload.activeCourseId;
    },
  },
});

export const { setCourseInfo, unsetCourseInfo } = courseSlice.actions;

export default courseSlice.reducer;
