/* eslint-disable no-unused-vars */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../../CookieService";

export const realWordQuestionApi = createApi({
  reducerPath: "realWordQuestionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/real-word/`,
  }),
  tagTypes: ["RealWordQuestion"],
  endpoints: (builder) => ({
    // ✅ Generate 10 shuffled real/fake words for quiz (student)
    getGeneratedRealWordQuiz: builder.query({
      query: ({ access_token }) => ({
        url: "random-real-word-quiz",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),

    // ✅ Bulk create real/fake questions (admin)
    createRealWordQuestion: builder.mutation({
      query: ({ formData, access_token }) => ({
        url: "",
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["RealWordQuestion"],
    }),

    // ✅ Get all real word questions (admin)
    // getAllRealWordQuestions: builder.query({
    //   query: ({ access_token }) => ({
    //     url: "",
    //     method: "GET",
    //     headers: {
    //       Authorization: `Bearer ${access_token}`,
    //     },
    //   }),
    //   providesTags: ["RealWordQuestion"],
    // }),

    // ✅ Get questions by quiz ID (admin)
    getRealWordQuestionByQuizId: builder.query({
      query: ({ quiz_id, access_token }) => ({
        url: `quiz/${quiz_id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["RealWordQuestion"],
    }),

    // ✅ Update a word in words[] by index (admin)
    updateRealWordQuestionById: builder.mutation({
      query: ({ id, formData, access_token }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: formData, // expects { wordIndex, newWord, updated_by }
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["RealWordQuestion"],
    }),

    // ✅ Delete one word from a RealWordQuestion (by index)
    deleteWordFromRealWordQuestion: builder.mutation({
      query: ({ id, wordIndex, updated_by, access_token }) => ({
        url: `delete-word/${id}`,
        method: "DELETE",
        body: { wordIndex, updated_by },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["RealWordQuestion"],
    }),
  }),
});

export const {
  useGetGeneratedRealWordQuizQuery,
  useCreateRealWordQuestionMutation,
  useGetRealWordQuestionByQuizIdQuery,
  useDeleteWordFromRealWordQuestionMutation,
} = realWordQuestionApi;
