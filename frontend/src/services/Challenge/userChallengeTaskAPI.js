import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const userChallengeTaskApi = createApi({
  reducerPath: "userChallengeTaskApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/challenge/task/user`,
  }),
  tagTypes: ["UserChallengeTask"],
  endpoints: (builder) => ({
    // ✅ Start a User Challenge Task
    startUserChallengeTask: builder.mutation({
      query: ({ data, access_token }) => ({
        url: "/start",
        method: "POST",
        body: data,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UserChallengeTask"],
    }),

    // ✅ Check Answers for a Task
    checkUserChallengeTaskAnswers: builder.mutation({
      query: ({ data, access_token }) => ({
        url: "/check",
        method: "POST",
        body: data,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UserChallengeTask"],
    }),

    // ✅ Complete Task Manually (if needed)
    completeUserChallengeTask: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `/complete/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UserChallengeTask"],
    }),
  }),
});

export const {
  useStartUserChallengeTaskMutation,
  useCheckUserChallengeTaskAnswersMutation,
  useCompleteUserChallengeTaskMutation,
} = userChallengeTaskApi;
