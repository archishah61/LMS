/* eslint-disable no-unused-vars */
// import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
// import { getAdminToken } from "../CookieService";

// // Define the API service
// export const preDefinedQuestionsApi = createApi({
//   reducerPath: "preDefinedQuestionsApi",
//   baseQuery: fetchBaseQuery({
//     baseUrl: `${import.meta.env.VITE_BACKEND_URL}/pre-defined-questions/`,
//     prepareHeaders: (headers, { getState }) => {
//       const token = getAdminToken();
//       if (token) {
//         headers.set("Authorization", `Bearer ${token.access_token}`);
//       }
//       return headers;
//     },
//   }),
//   endpoints: (builder) => ({
//     createPreDefinedQuestion: builder.mutation({
//       query: ({ formData, access_token }) => ({
//         url: "create",
//         method: "POST",
//         body: formData,
//         headers: {
//           Authorization: `Bearer ${access_token}`,
//         },
//       }),
//       invalidatesTags: ["CreateQuestion"],
//     }),

//     getPreDefinedQuestions: builder.query({
//       query: () => "/",
//       providesTags: ["CreateQuestion", "UpdateQuestion", "DeleteQuestion"],
//     }),

//     getPreDefinedQuestionById: builder.query({
//       query: (id) => `/${id}`,
//     }),

//     updatePreDefinedQuestion: builder.mutation({
//       query: ({ id, formData }) => ({
//         url: `update/${id}`,
//         method: "PUT",
//         body: formData,
//       }),
//       invalidatesTags: ["UpdateQuestion"],
//     }),

//     deletePreDefinedQuestion: builder.mutation({
//       query: (id) => ({
//         url: `delete/${id}`,
//         method: "DELETE",
//       }),
//       invalidatesTags: ["DeleteQuestion"],
//     }),

//     // ✅ New API for Updating Question Sequence
//     updatePreDefinedQuestionSequence: builder.mutation({
//       query: ({ updatedSequence }) => ({
//         url: "update-sequence",
//         method: "POST",
//         body: { updatedSequence }, // Correct payload name
//       }),
//       invalidatesTags: ["UpdateQuestion"],
//     }),
//   }),
// });

// // Export hooks for usage in components
// export const {
//   useCreatePreDefinedQuestionMutation,
//   useGetPreDefinedQuestionsQuery,
//   useGetPreDefinedQuestionByIdQuery,
//   useUpdatePreDefinedQuestionMutation,
//   useDeletePreDefinedQuestionMutation,
//   useUpdatePreDefinedQuestionSequenceMutation,
// } = preDefinedQuestionsApi;

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { getAdminToken } from "../CookieService";

export const preDefinedQuestionsApi = createApi({
  reducerPath: "preDefinedQuestionsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/pre-defined-questions/`,
    prepareHeaders: (headers, { getState }) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    createQuestionWithOptions: builder.mutation({
      query: ({ formData, access_token }) => ({
        url: "/create",
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["CreateQuestion"],
    }),
    getAllQuestionsWithOptions: builder.query({
      query: ({ search = "", page = 1, limit = 10, questionType, status }) => ({
        url: ``,
        params: { search, page, limit, questionType, status }
      }),
      providesTags: ["CreateQuestion", "UpdateQuestion", "DeleteQuestion"],
    }),
    getPreDefinedQuestions: builder.query({
      query: () => "/",
      providesTags: ["CreateQuestion", "UpdateQuestion", "DeleteQuestion"],
    }),
    getQuestionWithOptionsById: builder.query({
      query: (id) => `/${id}`,
    }),
    updateQuestionWithOptions: builder.mutation({
      query: ({ id, formData, access_token }) => ({
        url: `/update/${id}`,
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UpdateQuestion"],
    }),
    deleteQuestionWithOptions: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `/delete/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["DeleteQuestion"],
    }),
    toggleQuestionStatus: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `/toggle/${id}`,
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["ToggleQuestion"],
    }),
    updateQuestionSequence: builder.mutation({
      query: ({ data, access_token }) => ({
        url: "/update-sequence",
        method: "POST",
        body: data,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UpdateQuestion"],
    }),
  }),
})

export const {
  useCreateQuestionWithOptionsMutation,
  useGetAllQuestionsWithOptionsQuery,
  useGetQuestionWithOptionsByIdQuery,
  useUpdateQuestionWithOptionsMutation,
  useDeleteQuestionWithOptionsMutation,
  useToggleQuestionStatusMutation,
  useUpdateQuestionSequenceMutation,
  useGetPreDefinedQuestionsQuery
} = preDefinedQuestionsApi
