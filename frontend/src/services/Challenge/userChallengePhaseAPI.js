import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const userChallengePhaseApi = createApi({
  reducerPath: "userChallengePhaseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/challenge/phase/user`,
  }),
  tagTypes: ["UserChallengePhase"],
  endpoints: (builder) => ({
    // ✅ Start User Challenge Phase
    startUserChallengePhase: builder.mutation({
      query: ({ data, access_token }) => ({
        url: "/start",
        method: "POST",
        body: data,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UserChallengePhase"],
    }),

    // ✅ Complete User Challenge Phase
    completeUserChallengePhase: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `/complete/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UserChallengePhase", "UserChallenge"], // Optional: also refresh parent challenge data
    }),
  }),
});

export const {
  useStartUserChallengePhaseMutation,
  useCompleteUserChallengePhaseMutation,
} = userChallengePhaseApi;
