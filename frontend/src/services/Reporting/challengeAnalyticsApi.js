import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const challengeAnalyticsApi = createApi({
  reducerPath: "challengeAnalyticsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/challenge-analytics/`,
  }),
  endpoints: (builder) => ({
    getCompletionStatsAcrossAllChallenges: builder.query({
      query: ({ access_token, type }) => ({
        url: "comletion-stats-all-challenge",
        params: { type },
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["ChallengeAnalytics"],
    }),

    getUserLearningOverview: builder.query({
      query: ({ access_token }) => ({
        url: "learning-overview",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["ChallengeAnalytics"],
    }),

    getAttemptsRequiredToCompleteChallenges: builder.query({
      query: ({ access_token }) => ({
        url: "average-attempts-per-challenge",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["ChallengeAnalytics"],
    }),

    getContestOverviewStats: builder.query({
      query: ({ access_token }) => ({
        url: "contests",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["ChallengeAnalytics"],
    }),

    getContestAttemptAnalytics: builder.query({
      query: ({ access_token }) => ({
        url: "/contests/attempts",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["ChallengeAnalytics"],
    }),
  }),
});

export const {
  useGetCompletionStatsAcrossAllChallengesQuery,
  useGetUserLearningOverviewQuery,
  useGetAttemptsRequiredToCompleteChallengesQuery,
  useGetContestOverviewStatsQuery,
  useGetContestAttemptAnalyticsQuery
} = challengeAnalyticsApi;
