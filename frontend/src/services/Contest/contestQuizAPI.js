import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const contestQuizAPI = createApi({
    reducerPath: "contestQuizAPI",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/contest/activity/quiz`,
        prepareHeaders: (headers) => {
            const token = getAdminToken();
            if (token) {
                headers.set("Authorization", `Bearer ${token.access_token}`);
            }
            return headers;
        },
    }),
    tagTypes: ["ContestQuiz"],
    endpoints: (builder) => ({
        // ✅ Create Quiz
        createQuiz: builder.mutation({
            query: (data) => ({
                url: "/",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["ContestQuiz"],
        }),

        // ✅ Update Quiz
        updateQuiz: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["ContestQuiz"],
        }),

        // ✅ Toggle Quiz Status
        toggleQuizStatus: builder.mutation({
            query: (id) => ({
                url: `/${id}/toggle`,
                method: "PATCH",
            }),
            invalidatesTags: ["ContestQuiz"],
        }),

        // ✅ Delete Quiz
        deleteQuiz: builder.mutation({
            query: (id) => ({
                url: `/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["ContestQuiz"],
        }),

        // ✅ Get Quizzes by Activity ID
        getQuizzesByActivity: builder.query({
            query: ({ activityId, sortBy, status }) => ({
                url: `/${activityId}`,
                params: { sortBy, status },
                method: "GET",
            }),
            providesTags: ["ContestQuiz"],
        }),

        // ✅ Get Quiz Question By Id
        getQuizzQuestionById: builder.query({
            query: (quizId) => ({
                url: `/questions/${quizId}`,
                method: "GET",
            }),
            providesTags: ["ContestQuiz"],
        }),
    }),
});

export const {
    useCreateQuizMutation,
    useUpdateQuizMutation,
    useToggleQuizStatusMutation,
    useDeleteQuizMutation,
    useGetQuizzesByActivityQuery,
    useGetQuizzQuestionByIdQuery
} = contestQuizAPI;
