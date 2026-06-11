import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../../CookieService";

export const dragDropQuestionApi = createApi({
  reducerPath: "dragDropQuestionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/dragdrop-questions`,
  }),
  endpoints: (builder) => ({
    getAllDragDropQuestions: builder.query({
      query: (access_token) => ({
        url: `/`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),

    getDragDropQuestionsByQuizId: builder.query({
      query: ({ quizId, access_token }) => ({
        url: `/quiz/${quizId}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: [
        "CreateDragDropQuestion",
        "UpdateDragDropQuestion",
        "DeleteDragDropQuestion",
      ],
    }),

    getDragDropQuestionById: builder.query({
      query: ({ id, access_token }) => ({
        url: `/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),

    createDragDropQuestion: builder.mutation({
      query: ({ payload, access_token }) => ({
        url: "/create",
        method: "POST",
        body: payload,
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: ["CreateDragDropQuestion"],
    }),

    updateDragDropQuestion: builder.mutation({
      query: ({ id, payload, access_token }) => ({
        url: `/update/${id}`,
        method: "PUT",
        body: payload,
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: ["UpdateDragDropQuestion"],
    }),

    deleteDragDropQuestion: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `/delete/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["DeleteDragDropQuestion"],
    }),
  }),
});

export const {
  useGetAllDragDropQuestionsQuery,
  useGetDragDropQuestionsByQuizIdQuery,
  useGetDragDropQuestionByIdQuery,
  useCreateDragDropQuestionMutation,
  useUpdateDragDropQuestionMutation,
  useDeleteDragDropQuestionMutation,
} = dragDropQuestionApi;
