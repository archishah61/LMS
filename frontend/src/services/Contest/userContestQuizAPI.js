import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const userContestQuizAPI = createApi({
  reducerPath: "userContestQuizAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/contest/user/activity/quiz`, // 👈 adjust as per your router prefix
  }),
  tagTypes: ["UserContestQuiz"],
  endpoints: (builder) => ({
    // ✅ Save User Quiz Attempt
    saveUserContestQuizAttempt: builder.mutation({
      query: ({ access_token, ...body }) => ({
        url: `/attempt`,
        method: "POST",
        body,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UserContestQuiz"],
    }),

    // ✅ Get all attempts for a quiz
    getUserContestQuizAttempts: builder.query({
      query: ({ quiz_id, access_token }) => ({
        url: `/attempts/${quiz_id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["UserContestQuiz"],
    }),
  }),
});

export const {
  useSaveUserContestQuizAttemptMutation,
  useGetUserContestQuizAttemptsQuery,
} = userContestQuizAPI;
