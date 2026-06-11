/* eslint-disable no-unused-vars */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";
import { courseProgressRootApi } from "../RootApi/courseProgressRootApi";

// Define a service for quiz completion data CRUD operations
export const quizCompletionApi = courseProgressRootApi.injectEndpoints({
  endpoints: (builder) => ({
    createQuizCompletion: builder.mutation({
      query: ({ completionData, access_token }) => ({
        url: `/quiz-completions/`,
        method: "POST",
        body: completionData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        {
          type: "CheckCourseCompletion",
          id: `${arg.completionData.userId}-${arg.completionData.courseId}`,
        },
        {
          type: "QuizCompletion",
          id: `${arg.completionData.userId}-${arg.completionData.courseId}`,
        },
      ],
    }),

    getQuizCompletionById: builder.query({
      query: (id) => ({
        url: `/quiz-completions/${id}`,
        method: "GET",
      }),
    }),

    getQuizCompletionByStudentId: builder.query({
      query: ({ userId, courseId }) => ({
        url: `/quiz-completions/student/${userId}`, // Ensure route matches your backend
        method: "GET",
      }),
      providesTags: (result, error, arg) => [
        { type: "QuizCompletion", id: `${arg.userId}-${arg.courseId}` },
      ],
    }),

    getQuizCompletionByQuizId: builder.query({
      query: ({ userId, quizId }) => ({
        url: `/quiz-completions/quiz/${quizId}/${userId}`, // Ensure route matches your backend
        method: "GET",
      }),
      providesTags: (result, error, arg) => [
        { type: "QuizCompletion" },
      ],
    }),

    evaluateQuiz: builder.mutation({
      query: ({ submissionData, access_token }) => ({
        url: `/quiz-completions/submit-quiz/`,
        method: "POST",
        body: submissionData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["QuizCompletion"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateQuizCompletionMutation,
  useGetQuizCompletionByIdQuery,
  useGetQuizCompletionByStudentIdQuery,
  useLazyGetQuizCompletionByQuizIdQuery,
  useGetQuizCompletionByQuizIdQuery,
  useEvaluateQuizMutation
} = quizCompletionApi;
