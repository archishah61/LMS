import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const leaderboardAnalyticsApi = createApi({
  reducerPath: "leaderboardAnalyticsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/leaderboard-gamification/`,
  }),
  endpoints: (builder) => ({
    getTopPerformersByChallengeCategory: builder.query({
      query: ({ access_token }) => ({
        url: "top-performers-by-category",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["LeaderboardAnalytics"],
    }),

    getUsersWithHighestPoints: builder.query({
      query: ({ access_token }) => ({
        url: "users-with-highest-points",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["LeaderboardAnalytics"],
    }),

    getTopUsersAndUserRank: builder.query({
      query: ({ access_token, id }) => ({
        url: `points-rank/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["LeaderboardAnalytics"],
    }),

    getDailyChallengeRank: builder.query({
      query: ({ access_token }) => ({
        url: `points-rank`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["LeaderboardAnalytics"],
    }),
  }),
});

export const {
  useGetTopPerformersByChallengeCategoryQuery,
  useGetUsersWithHighestPointsQuery,
  useGetTopUsersAndUserRankQuery,
  useGetDailyChallengeRankQuery
} = leaderboardAnalyticsApi;
