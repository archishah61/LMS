import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  categories: null, // Store all course categories
};

export const courseCategorySlice = createSlice({
  name: "course_category",
  initialState,
  reducers: {
    setCourseCategoryInfo: (state, action) => {
      state.categories = action.payload.categories;
    },
    unsetCourseCategoryInfo: (state) => {
      state.categories = null;
    },
  },
});

export const { setCourseCategoryInfo, unsetCourseCategoryInfo } = courseCategorySlice.actions;

export default courseCategorySlice.reducer;
