import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const userContestCodingAPI = createApi({
    reducerPath: "userContestCodingAPI",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/contest/user/activity/coding`,
    }),
    tagTypes: ["UserContestCoding"],
    endpoints: (builder) => ({
        // ✅ Save User Coding Attempt
        saveUserContestCodingAttempt: builder.mutation({
            query: ({ access_token, ...body }) => ({
                url: `/attempt`,
                method: "POST",
                body,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["UserContestCoding"],
        }),

        // ✅ Get all attempts for a coding
        getUserContestCodingAttempts: builder.query({
            query: ({ coding_id, access_token }) => ({
                url: `/attempts/${coding_id}`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ["UserContestCoding"],
        }),
    }),
});

export const {
    useSaveUserContestCodingAttemptMutation,
    useGetUserContestCodingAttemptsQuery,
} = userContestCodingAPI;
