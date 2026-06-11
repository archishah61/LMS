import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const aiInterviewAnalyticsApi = createApi({
  reducerPath: "aiInterviewAnalyticsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/ai-interview-analytics/`,
  }),
  endpoints: (builder) => ({
    getOverallPerformance: builder.query({
      query: ({ access_token, ...params }) => ({
        url: "overall-performance",
        method: "GET",
        headers: { Authorization: `Bearer ${access_token}` },
        params,
      }),
      providesTags: ["AIInterviewAnalytics"],
    }),
    getCategoryRoleAnalytics: builder.query({
      query: ({ access_token, ...params }) => ({
        url: "category-role-analytics",
        method: "GET",
        headers: { Authorization: `Bearer ${access_token}` },
        params,
      }),
      providesTags: ["AIInterviewAnalytics"],
    }),
    getQuestionLevelInsights: builder.query({
      query: ({ access_token, ...params }) => ({
        url: "question-level-insights",
        method: "GET",
        headers: { Authorization: `Bearer ${access_token}` },
        params,
      }),
      providesTags: ["AIInterviewAnalytics"],
    }),
    getTimeBasedAnalytics: builder.query({
      query: ({ access_token, ...params }) => ({
        url: "time-based-analytics",
        method: "GET",
        headers: { Authorization: `Bearer ${access_token}` },
        params,
      }),
      providesTags: ["AIInterviewAnalytics"],
    }),
    getResponseQualityMetrics: builder.query({
      query: ({ access_token, ...params }) => ({
        url: "response-quality-metrics",
        method: "GET",
        headers: { Authorization: `Bearer ${access_token}` },
        params,
      }),
      providesTags: ["AIInterviewAnalytics"],
    }),
    getAdminDashboardVisualizations: builder.query({
      query: ({ access_token, ...params }) => ({
        url: "admin-dashboard-visualizations",
        method: "GET",
        headers: { Authorization: `Bearer ${access_token}` },
        params,
      }),
      providesTags: ["AIInterviewAnalytics"],
    }),
    getUserPerformanceSummary: builder.query({
      query: ({ access_token, ...params }) => ({
        url: "user-performance-summary",
        method: "GET",
        headers: { Authorization: `Bearer ${access_token}` },
        params,
      }),
      providesTags: ["AIInterviewAnalytics"],
    }),

    // 8. /top-bottom-users-by-category  ➜  GET
    getTopBottomUsersByCategory: builder.query({
      query: ({ access_token, ...params }) => ({
        url: "top-bottom-users-by-category",
        method: "GET",
        headers: { Authorization: `Bearer ${access_token}` },
        params,
      }),
      providesTags: ["AIInterviewAnalytics"],
    }),

    // 9. /overall-top-bottom-performers  ➜  GET
    getOverallTopBottomPerformers: builder.query({
      query: ({ access_token, ...params }) => ({
        url: "overall-top-bottom-performers",
        method: "GET",
        headers: { Authorization: `Bearer ${access_token}` },
        params,
      }),
      providesTags: ["AIInterviewAnalytics"],
    }),
  }),
});

export const {
  useGetOverallPerformanceQuery,
  useGetCategoryRoleAnalyticsQuery,
  useGetQuestionLevelInsightsQuery,
  useGetTimeBasedAnalyticsQuery,
  useGetResponseQualityMetricsQuery,
  useGetAdminDashboardVisualizationsQuery,
  useGetUserPerformanceSummaryQuery,
  useGetTopBottomUsersByCategoryQuery,
  useGetOverallTopBottomPerformersQuery,
} = aiInterviewAnalyticsApi; 