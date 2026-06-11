/* eslint-disable no-unused-vars */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

// Define a service for text-based quiz questions CRUD operations
export const textBasedQuizTextApi = createApi({
  reducerPath: "textBasedQuizTextApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/text-based-quiz-text/`,
  }),
  endpoints: (builder) => ({
    createTextBasedQuizText: builder.mutation({
      query: ({ questionData, access_token }) => ({
        url: "create/",
        method: "POST",
        body: questionData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["TextBasedQuizText"],
    }),

    getTextBasedQuizTextById: builder.query({
      query: ({ id, access_token }) => ({
        url: `${id}/`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),

    updateTextBasedQuizText: builder.mutation({
      query: ({ id, questionData, access_token }) => ({
        url: `update/${id}/`,
        method: "PUT",
        body: questionData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["TextBasedQuizText"],
    }),

    deleteTextBasedQuizText: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `delete/${id}/`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["TextBasedQuizText"],
    }),
  }),
});

export const {
  useCreateTextBasedQuizTextMutation,
  useGetTextBasedQuizTextByIdQuery,
  useUpdateTextBasedQuizTextMutation,
  useDeleteTextBasedQuizTextMutation,
} = textBasedQuizTextApi;
