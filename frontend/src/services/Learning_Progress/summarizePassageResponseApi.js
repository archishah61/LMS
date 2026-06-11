import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const summarizePassageResponseApi = createApi({
  reducerPath: "summarizePassageResponseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/summary-passage-response/`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.user?.access_token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["SummarizePassageResponse"],
  endpoints: (builder) => ({
    // ✅ Create Response
    createSummarizePassageResponse: builder.mutation({
      query: ({ data, access_token }) => ({
        url: "create",
        method: "POST",
        body: data,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["SummarizePassageResponse"],
    }),

    // ✅ Get All Responses
    getAllSummarizePassageResponses: builder.query({
      query: () => ({
        url: "",
        method: "GET",
      }),
      providesTags: ["SummarizePassageResponse"],
    }),

    // ✅ Get by Question ID
    getResponsesByQuestionId: builder.query({
      query: (question_id) => ({
        url: `question/${question_id}`,
        method: "GET",
      }),
      providesTags: ["SummarizePassageResponse"],
    }),

    // ✅ Get by Student ID
    getResponsesByStudentId: builder.query({
      query: (student_id) => ({
        url: `student/${student_id}`,
        method: "GET",
      }),
      providesTags: ["SummarizePassageResponse"],
    }),

    // ✅ Update Response
    updateSummarizePassageResponse: builder.mutation({
      query: ({ id, data }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["SummarizePassageResponse"],
    }),

    // ✅ Delete Response
    deleteSummarizePassageResponse: builder.mutation({
      query: (id) => ({
        url: `delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SummarizePassageResponse"],
    }),
  }),
});

export const {
  useCreateSummarizePassageResponseMutation,
  useGetAllSummarizePassageResponsesQuery,
  useGetResponsesByQuestionIdQuery,
  useGetResponsesByStudentIdQuery,
  useUpdateSummarizePassageResponseMutation,
  useDeleteSummarizePassageResponseMutation,
} = summarizePassageResponseApi;
