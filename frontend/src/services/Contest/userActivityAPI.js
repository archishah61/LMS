import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const userActivityAPI = createApi({
    reducerPath: "userActivityAPI",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/contest/user/activity`, // 👈 base path
    }),
    tagTypes: ["UserActivity"],
    endpoints: (builder) => ({
        // ✅ Start Contest Activity
        startContestActivity: builder.mutation({
            query: (data) => ({
                url: `/start`,
                method: "POST",
                body: data,
                headers: {
                    Authorization: `Bearer ${data.access_token}`, // pass access_token
                },
            }),
            invalidatesTags: ["UserActivity"],
        }),

        // ✅ Start Contest Activity
        startContestQuiz: builder.mutation({
            query: (data) => ({
                url: `/quiz/start`,
                method: "POST",
                body: data,
                headers: {
                    Authorization: `Bearer ${data.access_token}`, // pass access_token
                },
            }),
            invalidatesTags: ["UserActivity"],
        }),

        startContestCoding: builder.mutation({
            query: (data) => ({
                url: `/coding/start`,
                method: "POST",
                body: data,
                headers: {
                    Authorization: `Bearer ${data.access_token}`, // pass access_token
                },
            }),
            invalidatesTags: ["UserActivity"],
        }),

        checkContestQuiz: builder.mutation({
            query: (data) => ({
                url: `/check`,
                method: "POST",
                body: data,
                headers: {
                    Authorization: `Bearer ${data.access_token}`, // pass access_token
                },
            }),
        }),
    }),
});

export const {
    useStartContestActivityMutation,
    useStartContestQuizMutation,
    useStartContestCodingMutation,
    useCheckContestQuizMutation
} = userActivityAPI;
