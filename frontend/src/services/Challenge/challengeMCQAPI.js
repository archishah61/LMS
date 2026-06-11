import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const mcqChallengeApi = createApi({
  reducerPath: "mcqChallengeApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/challenge/mcq`,
    prepareHeaders: (headers, { getState }) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["MCQChallenge"],
  endpoints: (builder) => ({
    // ✅ Create MCQ Challenge
    createMCQChallenge: builder.mutation({
      query: (data) => ({
        url: "/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["MCQChallenge"],
    }),

    // ✅ Update MCQ Challenge
    updateMCQChallenge: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["MCQChallenge"],
    }),

    // ✅ Toggle MCQ Challenge
    toggleMCQChallengeStatus: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["MCQChallenge"],
    }),

    // ✅ Delete MCQ Challenge
    deleteMCQChallenge: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["MCQChallenge"],
    }),

    // ✅ Create MCQ Option Challenge
    createMCQOptionChallenge: builder.mutation({
      query: (data) => ({
        url: "/options",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["MCQChallenge"],
    }),

    // ✅ Update MCQ Option Challenge
    updateMCQOptionChallenge: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/options/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["MCQChallenge"],
    }),

    // ✅ Toggle MCQ Option Challenge
    toggleMCQOptionChallengeStatus: builder.mutation({
      query: (id) => ({
        url: `/options/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["MCQChallenge"],
    }),

    // ✅ Delete MCQ Option Challenge
    deleteMCQOptionChallenge: builder.mutation({
      query: (id) => ({
        url: `/options/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["MCQChallenge"],
    }),
  }),
});

export const {
  useCreateMCQChallengeMutation,
  useUpdateMCQChallengeMutation,
  useToggleMCQChallengeStatusMutation,
  useDeleteMCQChallengeMutation,
  useCreateMCQOptionChallengeMutation,
  useUpdateMCQOptionChallengeMutation,
  useToggleMCQOptionChallengeStatusMutation,
  useDeleteMCQOptionChallengeMutation,
} = mcqChallengeApi;
