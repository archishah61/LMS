import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const userChallengeQuestApi = createApi({
  reducerPath: "userChallengeQuestApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/challenge/quest/user`,
  }),
  tagTypes: ["UserChallengeQuest"],
  endpoints: (builder) => ({
    // ✅ Start User Challenge Quest
    startUserChallengeQuest: builder.mutation({
      query: ({ data, access_token }) => ({
        url: "/start",
        method: "POST",
        body: data,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UserChallengeQuest"],
    }),

    // ✅ Get All User Challenge Quests (e.g., assigned today)
    getAllChallengeQuests: builder.query({
      query: () => ({
        url: "/",
        method: "GET",
        // headers: {
        //   Authorization: `Bearer ${access_token}`,
        // },
      }),
      providesTags: ["UserChallengeQuest"],
    }),

    getUserChallengeQuestById: builder.query({
      query: ({ id, access_token }) => ({
        url: `/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["UserChallengeQuest"],
    }),

    // ✅ Get All User Challenge Quests (e.g., assigned today)
    getAllChallengeByUserQuests: builder.query({
      query: ({ access_token }) => ({
        url: "/enrolled",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["UserChallengeQuest"],
    }),

    // ✅ Get Recommended Challenges
    getRecommendedChallenges: builder.query({
      query: (access_token) => ({
        url: "/recommend-challenge",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["UserChallengeQuest"],
    }),

    // ✅ Get Challenge Quest Leaderboard
    getChallengeQuestLeaderboard: builder.query({
      query: ({ difficulty_level, category_id, timeinterval }) => ({
        url: "/leaderboard",
        method: "GET",
        params: { difficulty_level, category_id, timeinterval },
        // headers: {
        //   Authorization: `Bearer ${access_token}`,
        // },
      }),
      providesTags: ["UserChallengeQuest"],
    }),

  }),
});

export const {
  useStartUserChallengeQuestMutation,
  useGetAllChallengeQuestsQuery,
  useGetUserChallengeQuestByIdQuery,
  useGetAllChallengeByUserQuestsQuery,
  useGetRecommendedChallengesQuery,
  useGetChallengeQuestLeaderboardQuery
} = userChallengeQuestApi;
