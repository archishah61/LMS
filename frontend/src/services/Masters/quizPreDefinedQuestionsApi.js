import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

// Define the API service
export const quizPreDefinedQuestionsApi = createApi({
  reducerPath: "quizPreDefinedQuestionsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/quiz-predefined-questions/`,
    prepareHeaders: (headers, { getState }) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    assignPredefinedQuestionToQuiz: builder.mutation({
      query: (data) => ({
        url: "assign",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["AssignPredefinedQuestionToQuiz"],
    }),

    getAllQuizPreDefinedMappings: builder.query({
      query: () => "/",
    }),

    getQuizPreDefinedMappingById: builder.query({
      query: (id) => `/${id}`,
    }),

    getPredefinedQuestionsByQuizId: builder.query({
      query: (quiz_id) => `quiz/${quiz_id}`,
      providesTags: [
        "AssignPredefinedQuestionToQuiz",
        "RemovePredefinedQuestionFromQuiz",
      ],
    }),

    updateQuizPreDefinedMapping: builder.mutation({
      query: ({ id, data }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: data,
      }),
    }),

    removePredefinedQuestionFromQuiz: builder.mutation({
      query: (id) => ({
        url: `remove/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["RemovePredefinedQuestionFromQuiz"],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useAssignPredefinedQuestionToQuizMutation,
  useGetAllQuizPreDefinedMappingsQuery,
  useGetQuizPreDefinedMappingByIdQuery,
  useGetPredefinedQuestionsByQuizIdQuery, // New hook
  useUpdateQuizPreDefinedMappingMutation,
  useRemovePredefinedQuestionFromQuizMutation,
} = quizPreDefinedQuestionsApi;
