import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const userEngagementAnalyticsApi = createApi({
  reducerPath: "userEngagementAnalyticsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/user-engagement/`,
  }),
  endpoints: (builder) => ({
    getCourseCompletionAnalytics: builder.query({
      query: ({ user_type, partner_id, access_token }) => ({
        url: "course-completion",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: { user_type, partner_id },
      }),
      providesTags: ["UserEngagementAnalytics"],
    }),

    getAverageTimeSpentAnalytics: builder.query({
      query: ({ user_type, partner_id, access_token }) => ({
        url: "average-time-spent",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: { user_type, partner_id },
      }),
      providesTags: ["UserEngagementAnalytics"],
    }),

    getAverageSessionLengths: builder.query({
      query: ({ user_type, partner_id, access_token }) => ({
        url: "average-session-length",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: { user_type, partner_id },
      }),
      providesTags: ["UserEngagementAnalytics"],
    }),

    getRecentEnrollments: builder.query({
      query: ({ user_type, partner_id, access_token }) => ({
        url: "recent-enrollments",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: { user_type, partner_id },
      }),
      providesTags: ["UserEngagementAnalytics"],
    }),

    getStudentFAQAnalytics: builder.query({
      query: ({ user_type, partner_id, access_token, course_id }) => ({
        url: "faq-response",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: { course_id, user_type, partner_id, },
      }),
      providesTags: ["UserEngagementAnalytics"],
    }),
  }),
});

export const {
  useGetCourseCompletionAnalyticsQuery,
  useGetAverageTimeSpentAnalyticsQuery,
  useGetAverageSessionLengthsQuery,
  useGetRecentEnrollmentsQuery,
  useGetStudentFAQAnalyticsQuery, // Add this line
} = userEngagementAnalyticsApi;
