import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

// Define the API service for challenge categories
export const challengeCategoryApi = createApi({
  reducerPath: "challengeCategoryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/challenge/category`,
  }),
  tagTypes: ["ChallengeCategory"],
  endpoints: (builder) => ({
    // ✅ Create Challenge Category
    createChallengeCategory: builder.mutation({
      query: (arg) => ({
        url: "/",
        method: "POST",
        body: arg.data || {},
        headers: {
          Authorization: `Bearer ${arg.access_token}`,
        },
      }),
      invalidatesTags: ["ChallengeCategory"],
    }),

    // ✅ Get All Challenge Categories
    getAllChallengeCategories: builder.query({
      query: ({ sortBy, filterStatus, access_token }) => ({
        url: "/",
        method: "GET",
        params: { sortBy, filterStatus },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["ChallengeCategory"],
    }),

    // ✅ Get Challenge Category by ID
    getChallengeCategoryById: builder.query({
      query: (arg) => ({
        url: `/${arg.id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${arg.access_token}`,
        },
      }),
      providesTags: ["ChallengeCategory"],
    }),

    // ✅ Update Challenge Category
    updateChallengeCategory: builder.mutation({
      query: (arg) => ({
        url: `/${arg.id}`,
        method: "PUT",
        body: arg.data || {},
        headers: {
          Authorization: `Bearer ${arg.access_token}`,
        },
      }),
      invalidatesTags: ["ChallengeCategory"],
    }),

    // ✅ Delete Challenge Category
    deleteChallengeCategory: builder.mutation({
      query: (arg) => ({
        url: `/${arg.id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${arg.access_token}`,
        },
      }),
      invalidatesTags: ["ChallengeCategory"],
    }),

    // ✅ Toggle Challenge Category Status
    toggleChallengeCategoryStatus: builder.mutation({
      query: (arg) => ({
        url: `/${arg.id}`,
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${arg.access_token}`,
        },
      }),
      invalidatesTags: ["ChallengeCategory"],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useCreateChallengeCategoryMutation,
  useGetAllChallengeCategoriesQuery,
  useGetChallengeCategoryByIdQuery,
  useUpdateChallengeCategoryMutation,
  useDeleteChallengeCategoryMutation,
  useToggleChallengeCategoryStatusMutation,
} = challengeCategoryApi;
