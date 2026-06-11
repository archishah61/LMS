import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const userChallengeApi = createApi({
  reducerPath: "userChallengeApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/user/challenge`,
  }),
  tagTypes: ["UserChallenge"],
  endpoints: (builder) => ({
    // ✅ Start Challenge by ID
    startChallengeById: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `/start/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UserChallenge"],
    }),

    // ✅ Check Challenge
    checkChallenge: builder.mutation({
      query: ({ data, access_token }) => ({
        url: "/check",
        method: "POST",
        body: data,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UserChallenge"],
    }),

    // ✅ Assign Challenge to User
    assignChallengeToUser: builder.mutation({
      query: ({ data, access_token }) => ({
        url: "/assign",
        method: "POST",
        body: data,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UserChallenge"],
    }),

    // ✅ Check if Challenge is Assigned Today
    isChallengeAssignedToday: builder.query({
      query: ({ access_token }) => ({
        url: "/check-assigned",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["UserChallenge"],
    }),

    // ✅ Get Challenge by Date
    getChallengeByDate: builder.query({
      query: ({ access_token, date }) => ({
        url: `/?date=${date}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["UserChallenge"],
    }),

    // ✅ Get User Challenge by ID
    getUserChallengeById: builder.query({
      query: ({ id, access_token }) => ({
        url: `/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["UserChallenge"],
    }),

    // ✅ Get User Streak by ID
    getUserStreakById: builder.query({
      query: ({ access_token }) => ({
        url: `/streak`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["UserChallenge"],
    }),

    // ✅ Get User Points by ID
    getUserPointsById: builder.query({
      query: ({ access_token, limit, offset, timeFilter, startDate, endDate }) => {
        // Build query params dynamically
        const params = new URLSearchParams()

        if (limit !== undefined && limit !== null) params.append("limit", limit)
        if (offset !== undefined && offset !== null) params.append("offset", offset)
        if (timeFilter) params.append("time_filter", timeFilter)
        if (timeFilter === 'custom') {
            if (startDate) params.append("start_date", startDate)
            if (endDate) params.append("end_date", endDate)
        }

        return {
          url: `/points${params.toString() ? `?${params.toString()}` : ""}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      },
      providesTags: ["UserChallenge"],
    }),

    // ✅ Update Fill in the Blanks Challenge
    updateUserPoints: builder.mutation({
      query: ({ access_token, data }) => ({
        url: `/points`,
        method: "PUT",
        body: data,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UserChallenge"],
    }),

    // ✅ Get User Challenge by ID
    getCompleteChallengeDateById: builder.query({
      query: ({ access_token }) => ({
        url: `/complete-dates`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["UserChallenge"],
    }),

  }),
});

export const {
  useStartChallengeByIdMutation,
  useCheckChallengeMutation,
  useAssignChallengeToUserMutation,
  useIsChallengeAssignedTodayQuery,
  useGetChallengeByDateQuery,
  useGetUserChallengeByIdQuery,
  useGetUserStreakByIdQuery,
  useGetUserPointsByIdQuery,
  useUpdateUserPointsMutation,
  useGetCompleteChallengeDateByIdQuery,
} = userChallengeApi;
