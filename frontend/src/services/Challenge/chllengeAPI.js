import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const dailyChallengeApi = createApi({
  reducerPath: "dailyChallengeApi",
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
  tagTypes: ["Challenge"],
  endpoints: (builder) => ({
    // ✅ Create Challenge with Fill in the Blanks
    createChallenge: builder.mutation({
      query: (data) => ({
        url: "/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Challenge"],
    }),

    // ✅ Get All Challenges (with search and pagination)
    getAllChallenges: builder.query({
      query: ({ search_term, category, difficulty, status, limit = "9", offset = "0" }) => ({
        url: "/",
        method: "GET",
        params: { search_term, category, difficulty, status, limit, offset },
      }),
      providesTags: ["Challenge"],
    }),

    // ✅ Get Challenge by ID with Fill in the Blanks
    getChallengeById: builder.query({
      query: (id) => ({
        url: `/${id}`,
        method: "GET",
      }),
      providesTags: ["Challenge"],
    }),

    // ✅ Get Challenge by ID with Active Fill in the Blanks (Excluding Answers)
    startChallengeById: builder.query({
      query: (id) => ({
        url: `/start/${id}`,
        method: "GET",
      }),
      providesTags: ["Challenge"],
    }),

    // ✅ Check Challenge Answers
    checkChallenge: builder.mutation({
      query: (data) => ({
        url: "/check",
        method: "POST",
        body: data,
      }),
    }),

    // ✅ Update Challenge by ID
    updateChallenge: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Challenge"],
    }),

    // ✅ Toggle Challenge Status by ID
    toggleChallengeStatus: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Challenge"],
    }),

    // ✅ Delete Challenge by ID
    deleteChallenge: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Challenge"],
    }),

    // ✅ Get Challenge by ID with Fill in the Blanks
    getTaskChallengeById: builder.query({
      query: (id) => ({
        url: `/task/${id}`,
        method: "GET",
      }),
      providesTags: ["Challenge"],
    }),
  }),
});

export const {
  useCreateChallengeMutation,
  useGetAllChallengesQuery,
  useGetChallengeByIdQuery,
  useStartChallengeByIdQuery,
  useCheckChallengeMutation,
  useUpdateChallengeMutation,
  useToggleChallengeStatusMutation,
  useDeleteChallengeMutation,
  useGetTaskChallengeByIdQuery,
} = dailyChallengeApi;
