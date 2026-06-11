import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  topEnrolledCourses: null,
  topRatedCourses: null,
  categoriesWithMostEnrollments: null,
  averageTimeToCompleteCourse: null,
};

export const coursePerformanceAnalyticsSlice = createSlice({
  name: "course_performance_analytics",
  initialState,
  reducers: {
    setTopEnrolledCourses: (state, action) => {
      state.topEnrolledCourses = action.payload.topEnrolledCourses;
    },
    unsetTopEnrolledCourses: (state) => {
      state.topEnrolledCourses = null;
    },

    setTopRatedCourses: (state, action) => {
      state.topRatedCourses = action.payload.topRatedCourses;
    },
    unsetTopRatedCourses: (state) => {
      state.topRatedCourses = null;
    },

    setCategoriesWithMostEnrollments: (state, action) => {
      state.categoriesWithMostEnrollments = action.payload.categoriesWithMostEnrollments;
    },
    unsetCategoriesWithMostEnrollments: (state) => {
      state.categoriesWithMostEnrollments = null;
    },

    setAverageTimeToCompleteCourse: (state, action) => {
      state.averageTimeToCompleteCourse = action.payload.averageTimeToCompleteCourse;
    },
    unsetAverageTimeToCompleteCourse: (state) => {
      state.averageTimeToCompleteCourse = null;
    },
  },
});

export const {
  setTopEnrolledCourses,
  unsetTopEnrolledCourses,
  setTopRatedCourses,
  unsetTopRatedCourses,
  setCategoriesWithMostEnrollments,
  unsetCategoriesWithMostEnrollments,
  setAverageTimeToCompleteCourse,
  unsetAverageTimeToCompleteCourse,
} = coursePerformanceAnalyticsSlice.actions;

export default coursePerformanceAnalyticsSlice.reducer;
