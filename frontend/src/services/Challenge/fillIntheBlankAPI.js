import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const fillInTheBlanksApi = createApi({
  reducerPath: "fillInTheBlanksApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/challenge`,
    prepareHeaders: (headers, { getState }) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["FillInTheBlanks"],
  endpoints: (builder) => ({
    // ✅ Create Fill in the Blanks Challenge
    createFillInTheBlanksChallenge: builder.mutation({
      query: (data) => ({
        url: "/fill-in-the-blanks",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["FillInTheBlanks"],
    }),

    // ✅ Get All Fill in the Blanks Challenges
    getAllFillInTheBlanksChallenges: builder.query({
      query: () => ({
        url: "/fill-in-the-blanks/all",
        method: "GET",
      }),
      providesTags: ["FillInTheBlanks"],
    }),

    // ✅ Get Single Fill in the Blanks Challenge by ID
    getFillInTheBlanksChallengeById: builder.query({
      query: (id) => ({
        url: `/fill-in-the-blanks/${id}`,
        method: "GET",
      }),
      providesTags: ["FillInTheBlanks"],
    }),

    // ✅ Update Fill in the Blanks Challenge
    updateFillInTheBlanksChallenge: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/fill-in-the-blanks/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["FillInTheBlanks"],
    }),

    // ✅ Toggle Fill in the Blanks Challenge Status
    toggleFillInTheBlanksChallengeStatus: builder.mutation({
      query: (id) => ({
        url: `/fill-in-the-blanks/${id}/toggle`,
        method: "PATCH",
      }),
      invalidatesTags: ["FillInTheBlanks"],
    }),

    // ✅ Delete Fill in the Blanks Challenge
    deleteFillInTheBlanksChallenge: builder.mutation({
      query: (id) => ({
        url: `/fill-in-the-blanks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["FillInTheBlanks"],
    }),
  }),
});

export const {
  useCreateFillInTheBlanksChallengeMutation,
  useUpdateFillInTheBlanksChallengeMutation,
  useToggleFillInTheBlanksChallengeStatusMutation,
  useDeleteFillInTheBlanksChallengeMutation,
} = fillInTheBlanksApi;
