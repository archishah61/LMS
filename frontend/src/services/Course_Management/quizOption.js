import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

// Define a service for quiz options CRUD operations
export const quizOptionApi = createApi({
  reducerPath: "quizOptionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/quiz-options/`,
  }),
  endpoints: (builder) => ({
    createQuizOption: builder.mutation({
      query: ({ optionData, access_token }) => ({
        url: "create/",
        method: "POST",
        body: optionData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["QuizOptions"],
    }),

    getQuizOptions: builder.query({
      query: () => ({
        url: "",
        method: "GET",
      }),
      providesTags: ["QuizOptions"],
    }),

    getQuizOptionById: builder.query({
      query: ({ id, access_token }) => ({
        url: `${id}/`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["QuizOptions"],
    }),

    updateQuizOption: builder.mutation({
      query: ({ id, optionData, access_token }) => ({
        url: `update/${id}/`,
        method: "PUT",
        body: optionData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["QuizOptions"],
    }),

    deleteQuizOption: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `delete/${id}/`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["QuizOptions"],
    }),
    deleteOptionsByQuestionId: builder.mutation({
      query: (questionId) => ({
        url: `delete/options/${questionId}/`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useCreateQuizOptionMutation,
  useGetQuizOptionsQuery,
  useGetQuizOptionByIdQuery,
  useUpdateQuizOptionMutation,
  useDeleteQuizOptionMutation,
  useDeleteOptionsByQuestionIdMutation,
} = quizOptionApi;
