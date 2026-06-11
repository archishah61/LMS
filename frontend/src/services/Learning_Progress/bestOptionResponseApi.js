import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const bestOptionResponseApi = createApi({
  reducerPath: "bestOptionResponseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/best-option-response/`,
  }),
  tagTypes: ["BestOptionResponse"],
  endpoints: (builder) => ({
    // ✅ Create Response
    createBestOptionResponse: builder.mutation({
      query: ({ data, access_token }) => ({
        url: "create",
        method: "POST",
        body: data,
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: ["BestOptionResponse"],
    }),

    // ✅ Get All Responses (for admin)
    getAllBestOptionResponses: builder.query({
      query: () => ({
        url: "",
        method: "GET",
      }),
      providesTags: ["BestOptionResponse"],
    }),

    // ✅ Get Responses by Question ID
    getBestOptionResponsesByQuestionId: builder.query({
      query: (questionId) => ({
        url: `question/${questionId}`,
        method: "GET",
      }),
      providesTags: ["BestOptionResponse"],
    }),

    // ✅ Get Responses by Student ID
    getBestOptionResponsesByStudentId: builder.query({
      query: (studentId) => ({
        url: `student/${studentId}`,
        method: "GET",
      }),
      providesTags: ["BestOptionResponse"],
    }),

    // ✅ Update Response
    updateBestOptionResponse: builder.mutation({
      query: ({ id, data, access_token }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: data,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["BestOptionResponse"],
    }),

    // ✅ Delete Response by ID
    deleteBestOptionResponse: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `delete/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["BestOptionResponse"],
    }),
  }),
});

export const {
  useCreateBestOptionResponseMutation,
  useGetAllBestOptionResponsesQuery,
  useGetBestOptionResponsesByQuestionIdQuery,
  useGetBestOptionResponsesByStudentIdQuery,
  useUpdateBestOptionResponseMutation,
  useDeleteBestOptionResponseMutation,
} = bestOptionResponseApi;
