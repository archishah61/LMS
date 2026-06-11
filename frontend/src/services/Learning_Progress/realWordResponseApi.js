import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const realWordResponseApi = createApi({
  reducerPath: "realWordResponseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/real-word-response/`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.user?.access_token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["RealWordResponse"],
  endpoints: (builder) => ({
    // ✅ Submit student response
    submitRealWordResponse: builder.mutation({
      query: (data) => ({
        url: "submit",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["RealWordResponse"],
    }),

    // ✅ Get all responses by the logged-in student
    getMyRealWordResponses: builder.query({
      query: () => ({
        url: "my-responses",
        method: "GET",
      }),
      providesTags: ["RealWordResponse"],
    }),

    // ✅ Get all responses for a specific Real Word question
    getResponsesByRealWordQuestionId: builder.query({
      query: (question_id) => ({
        url: `question/${question_id}`,
        method: "GET",
      }),
      providesTags: ["RealWordResponse"],
    }),
  }),
});

export const {
  useSubmitRealWordResponseMutation,
  useGetMyRealWordResponsesQuery,
  useGetResponsesByRealWordQuestionIdQuery,
} = realWordResponseApi;
