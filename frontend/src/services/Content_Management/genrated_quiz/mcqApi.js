import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../../CookieService";

export const mcqApi = createApi({
  reducerPath: "mcqApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/generated-quiz/mcq/`, // Base URL for MCQs
  }),
  endpoints: (builder) => ({
    createMCQ: builder.mutation({
      query: ({ mcq, access_token }) => ({
        url: "create",
        method: "POST",
        body: mcq,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["MCQ"],
    }),
    deleteMCQ: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `delete/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["MCQ"],
    }),
  }),
});

export const {
  useCreateMCQMutation,
  useDeleteMCQMutation,
} = mcqApi;
