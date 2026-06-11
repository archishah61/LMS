import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const coursePerformanceAnalyticsApi = createApi({
  reducerPath: "coursePerformanceAnalyticsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/course-performance/`,
  }),
  endpoints: (builder) => ({
    getTopEnrolledCourses: builder.query({
      query: ({ user_type, partner_id, access_token }) => ({
        url: "top-enrolled-courses",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: { user_type, partner_id },

      }),
      providesTags: ["CoursePerformance"],
    }),

    getTopRatedCourses: builder.query({
      query: ({ user_type, partner_id, access_token }) => ({
        url: "top-rated-courses",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: { user_type, partner_id },

      }),
      providesTags: ["CoursePerformance"],
    }),

    getCategoriesWithMostEnrollments: builder.query({
      query: ({ user_type, partner_id, access_token }) => ({
        url: "categories-most-enrollments",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: { user_type, partner_id },

      }),
      providesTags: ["CoursePerformance"],
    }),

    getAverageTimeToCompleteCourse: builder.query({
      query: ({ user_type, partner_id, access_token }) => ({
        url: "average-time-completion-per-course",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: { user_type, partner_id },

      }),
      providesTags: ["CoursePerformance"],
    }),
  }),
});

export const {
  useGetTopEnrolledCoursesQuery,
  useGetTopRatedCoursesQuery,
  useGetCategoriesWithMostEnrollmentsQuery,
  useGetAverageTimeToCompleteCourseQuery,
} = coursePerformanceAnalyticsApi;
