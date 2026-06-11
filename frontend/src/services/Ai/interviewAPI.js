import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define a service using a base URL and expected endpoints
export const interviewApi = createApi({
  reducerPath: "interviewApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/interview`, // Adjust the base URL as needed
  }),
  endpoints: (builder) => ({
    generateInterviewQuestions: builder.mutation({
      query: ({ category, role, access_token }) => ({
        url: "gen-que",
        method: "POST",
        body: { category, role },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),
    evaluateInterviewAnswers: builder.mutation({
      query: ({ questionAnswers, access_token }) => ({
        url: "evaluate",
        method: "POST",
        body: { questionAnswers },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),
    createCompleteEvaluation: builder.mutation({
      query: ({ data, access_token }) => ({
        url: "complete-evaluation",
        method: "POST",
        body: data,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),
    getCompleteEvaluationByUser: builder.query({
      query: ({ access_token }) => ({
        url: `complete-evaluation`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),
    getCompleteEvaluationsByCategoryAndRole: builder.query({
      query: ({ category, role, access_token }) => ({
        url: `evaluations/full-filtered?category=${encodeURIComponent(category)}&role=${encodeURIComponent(role)}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),
    getAttemptsToday: builder.query({
      query: ({ access_token }) => ({
        url: `attempts-today`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),
    getFeatureSettingsAdmin: builder.query({
      query: ({ access_token }) => ({
        url: `../feature-settings`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),
    updateFeatureSettings: builder.mutation({
      query: ({ limit, type, access_token }) => ({
        url: `../feature-settings`,
        method: "POST",
        body: { limit, type },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),
    getUserDailyFeatureCount: builder.query({
      query: ({ access_token, type }) => ({
        url: `../feature-settings/user-daily-count`,
        params: { type },
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),
    getFeatureSettingsUser: builder.query({
      query: ({ access_token, type }) => ({
        url: `../feature-settings/user`,
        params: { type },
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),
    logInterviewDownload: builder.mutation({
      query: ({ evaluation_result_id, download_date, access_token }) => ({
        url: `log-download`,
        method: "POST",
        body: { evaluation_result_id, download_date },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),
  }),
});

export const {
  useGenerateInterviewQuestionsMutation,
  useEvaluateInterviewAnswersMutation,
  useCreateCompleteEvaluationMutation,
  useGetCompleteEvaluationByUserQuery,
  useGetCompleteEvaluationsByCategoryAndRoleQuery,
  useGetAttemptsTodayQuery,
  useGetFeatureSettingsAdminQuery,
  useUpdateFeatureSettingsMutation,
  useLogInterviewDownloadMutation,
  useGetUserDailyFeatureCountQuery,
  useGetFeatureSettingsUserQuery,
} = interviewApi;