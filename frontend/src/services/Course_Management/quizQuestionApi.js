import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define a service for quiz questions CRUD operations
export const quizQuestionApi = createApi({
    reducerPath: "quizQuestionApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/quiz-question/`,
    }),
    endpoints: (builder) => ({
        createQuizQuestion: builder.mutation({
            query: ({ questionData, access_token }) => ({
                url: "create/",
                method: "POST",
                body: questionData,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["QuizQuestions"],
        }),

        getQuizQuestionByQuizId: builder.query({
            query: ({ id, access_token }) => ({
                url: `quiz/${id}/`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
        }),

        getQuizQuestionById: builder.query({
            query: ({ id, access_token }) => ({
                url: `quiz/${id}/`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
        }),

        updateQuizQuestion: builder.mutation({
            query: ({ id, questionData, access_token }) => ({
                url: `update/${id}/`,
                method: "PUT",
                body: questionData,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["QuizQuestions"],
        }),

        deleteQuizQuestion: builder.mutation({
            query: ({ id, access_token }) => ({
                url: `delete/${id}/`,
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["QuizQuestions"],
        }),

        toggleQuizQuestion: builder.mutation({
            query: ({ id, access_token }) => ({
                url: `toggle/${id}/`,
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["QuizQuestions"],
        }),
    }),
});

export const {
    useCreateQuizQuestionMutation,
    useGetQuizQuestionByQuizIdQuery,
    useGetQuizQuestionByIdQuery,
    useUpdateQuizQuestionMutation,
    useDeleteQuizQuestionMutation,
    useToggleQuizQuestionMutation,
} = quizQuestionApi;
