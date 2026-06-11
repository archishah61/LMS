import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
// import { getAdminToken } from "../../CookieService";

export const bestOptionQuestionApi = createApi({
  reducerPath: "bestOptionQuestionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/best-option-questions/`,
  }),
  tagTypes: ["BestOptionQuestion"],
  endpoints: (builder) => ({
    // ✅ Create
    createBestOptionQuestion: builder.mutation({
      query: ({ data, access_token }) => ({
        url: "create",
        method: "POST",
        body: data,
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: ["BestOptionQuestion"],
    }),

    // ✅ Get all
    getAllBestOptionQuestions: builder.query({
      query: ({ access_token }) => ({
        url: "",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      }),
      providesTags: ["BestOptionQuestion"],
    }),

    // ✅ Get by quiz_id
    getBestOptionQuestionsByQuizId: builder.query({
      query: ({ quizId, access_token }) => ({
        url: `quiz/${quizId}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      }),
      providesTags: ["BestOptionQuestion"],
    }),

    // ✅ Update
    updateBestOptionQuestion: builder.mutation({
      query: ({ id, data, access_token }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: data,
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: ["BestOptionQuestion"],
    }),

    // ✅ Delete by question id
    deleteBestOptionQuestionById: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `delete/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["BestOptionQuestion"],
    }),
  }),
});

export const {
  useCreateBestOptionQuestionMutation,
  useGetAllBestOptionQuestionsQuery,
  useGetBestOptionQuestionsByQuizIdQuery,
  useUpdateBestOptionQuestionMutation,
  useDeleteBestOptionQuestionByIdMutation,
} = bestOptionQuestionApi;
