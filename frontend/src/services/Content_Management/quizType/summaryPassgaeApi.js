import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../../CookieService";

export const summarizePassageApi = createApi({
  reducerPath: "summarizePassageApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/summary/`,
  }),
  tagTypes: ["SummarizePassage"],
  endpoints: (builder) => ({
    // ✅ Create
    createSummarizePassageQuestion: builder.mutation({
      query: ({ payload, access_token }) => ({
        url: "create",
        method: "POST",
        body: payload,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["SummarizePassage"],
    }),

    // // ✅ Get All
    // getAllSummarizePassageQuestions: builder.query({
    //   query: () => ({
    //     url: "",
    //     method: "GET",
    //   }),
    //   providesTags: ["SummarizePassage"],
    // }),

    // ✅ Get by Quiz ID
    getSummarizePassageByQuizId: builder.query({
      query: ({ quiz_id, access_token }) => ({
        url: `quiz/${quiz_id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["SummarizePassage"],
    }),

    // ✅ Update
    updateSummarizePassageQuestion: builder.mutation({
      query: ({ id, payload, access_token }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: payload,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["SummarizePassage"],
    }),

    // ✅ Delete
    deleteSummarizePassageQuestion: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `delete/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["SummarizePassage"],
    }),
  }),
});

export const {
  useCreateSummarizePassageQuestionMutation,
  // useGetAllSummarizePassageQuestionsQuery,
  useGetSummarizePassageByQuizIdQuery,
  useUpdateSummarizePassageQuestionMutation,
  useDeleteSummarizePassageQuestionMutation,
} = summarizePassageApi;
