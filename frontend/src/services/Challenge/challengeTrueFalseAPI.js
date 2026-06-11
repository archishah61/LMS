import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const trueFalseChallengeApi = createApi({
  reducerPath: "trueFalseChallengeApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/challenge/true-false`,
    prepareHeaders: (headers, { getState }) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["TrueFalseChallenge"],
  endpoints: (builder) => ({
    // ✅ Create True/False Challenge
    createTrueFalseChallenge: builder.mutation({
      query: (data) => ({
        url: "/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["TrueFalseChallenge"],
    }),

    // ✅ Update True/False Challenge
    updateTrueFalseChallenge: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["TrueFalseChallenge"],
    }),

    // ✅ Toggle True/False Challenge Status
    toggleTrueFalseChallengeStatus: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["TrueFalseChallenge"],
    }),

    // ✅ Delete True/False Challenge
    deleteTrueFalseChallenge: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TrueFalseChallenge"],
    }),
  }),
});

export const {
  useCreateTrueFalseChallengeMutation,
  useUpdateTrueFalseChallengeMutation,
  useToggleTrueFalseChallengeStatusMutation,
  useDeleteTrueFalseChallengeMutation,
} = trueFalseChallengeApi;