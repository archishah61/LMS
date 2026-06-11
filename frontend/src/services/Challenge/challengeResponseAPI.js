import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const challengeResponseApi = createApi({
  reducerPath: "challengeResponseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/challenge-response`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState()?.auth?.user?.access_token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ["ChallengeResponse"],
  endpoints: (builder) => ({

    // ✅ Create a new quiz attempt
    createQuizAttempt: builder.mutation({
      query: (data) => ({
        url: "/create",
        method: "POST",
        body: data
      }),
      invalidatesTags: ["ChallengeResponse"]
    }),

    // ✅ Get quiz attempts by either user_challenge_id or user_challenge_task_id
    getQuizAttempts: builder.query({
      query: (params) => ({
        url: "/",
        method: "GET",
        params
      }),
      providesTags: ["ChallengeResponse"]
    })
  })
});

export const {
  useCreateQuizAttemptMutation,
  useGetQuizAttemptsQuery
} = challengeResponseApi;
