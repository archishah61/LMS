/* eslint-disable no-unused-vars */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

// Define a service for quizzes CRUD operations
export const quizApi = createApi({
  reducerPath: "quizApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/quizzes/`,
  }),
  tagTypes: ["Quizzes", "updateQuiz"],
  endpoints: (builder) => ({
    createQuiz: builder.mutation({
      query: ({ quizData, access_token }) => ({
        url: "create/",
        method: "POST",
        body: quizData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["Quizzes"],
    }),

    getQuizByModuleId: builder.query({
      query: ({ id, access_token }) => ({
        url: `quiz/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: (result, error, arg) => [
        "updateQuiz",
        { type: "Quizzes", id: arg.id },
      ],
    }),

    getActiveQuizByModuleId: builder.query({
      query: ({ id, access_token }) => ({
        url: `active-quiz/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: (result, error, arg) => [
        "updateQuiz",
        { type: "Quizzes", id: `active-${arg.id}` },
      ],
    }),

    updateQuiz: builder.mutation({
      query: ({ id, quizData, access_token }) => ({
        url: `update/${id}/`,
        method: "PUT",
        body: quizData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["updateQuiz"],
    }),

    updateQuizStatus: builder.mutation({
      query: ({ quizId, status, access_token }) => ({
        url: `/${quizId}/status`,
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        body: { status },
      }),
      invalidatesTags: ["updateQuiz"],
    }),

    // You can add more endpoints as needed
    getQuizByQuizId: builder.query({
      query: ({ id, access_token }) => ({
        url: `quizById/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: (result, error, arg) => [
        "updateQuiz",
        { type: "Quizzes", id: arg.id },
      ],
    }),
  }),
});

export const {
  useCreateQuizMutation,
  useUpdateQuizMutation,
  useGetQuizByModuleIdQuery,
  useGetActiveQuizByModuleIdQuery,
  useUpdateQuizStatusMutation,
  useGetQuizByQuizIdQuery,
} = quizApi;
