import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const userContestAPI = createApi({
    reducerPath: "userContestAPI",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/contest/user`, // 👈 adjust as per your router prefix
    }),
    tagTypes: ["UserContest"],
    endpoints: (builder) => ({
        // ✅ Enroll User in Contest
        enrollUserInContest: builder.mutation({
            query: (data) => ({
                url: `/enroll`,
                method: "POST",
                body: data,
                headers: {
                    Authorization: `Bearer ${data.access_token}`,
                },
            }),
            invalidatesTags: ["UserContest"],
        }),

        // ✅ Get User Enrollment by Contest
        getUserEnrollment: builder.query({
            query: ({ contest_id, access_token }) => ({
                url: `/enrolled?contest_id=${contest_id}`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ["UserContest"],
        }),

        getUserAllEnrollment: builder.query({
            query: ({ access_token }) => ({
                url: `/enrolled-all`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ["UserContest"],
        }),

        getLeaderboard: builder.query({
            query: ({ contest_id, time_filter, category_filter, limit = 10, offset = 0, user_id, access_token }) => ({
                url: `/leaderboard`,
                method: "GET",
                params: {
                    contest_id,
                    time_filter,
                    ...(category_filter != null && { category_filter }),
                    ...(user_id != null && { user_id }),
                    limit,
                    offset
                },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ["UserContest"],
        }),
    }),
});

export const {
    useEnrollUserInContestMutation,
    useGetUserEnrollmentQuery,
    useGetUserAllEnrollmentQuery,
    useGetLeaderboardQuery
} = userContestAPI;
