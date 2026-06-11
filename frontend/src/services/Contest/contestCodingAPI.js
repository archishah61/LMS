import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const contestCodingAPI = createApi({
  reducerPath: "contestCodingAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/contest/activity/coding`,
    prepareHeaders: (headers) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["ContestCoding"],
  endpoints: (builder) => ({
    // ✅ Create Contest Coding
    createContestCoding: builder.mutation({
      query: (data) => ({
        url: "/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ContestCoding"],
    }),

    // ✅ Get Contest Coding by Activity
    getContestCodingByActivity: builder.query({
      query: (activity_id) => ({
        url: `/activity/${activity_id}`,
        method: "GET",
      }),
      providesTags: ["ContestCoding"],
    }),

    // ✅ Get Contest Coding by Id
    getContestCodingById: builder.query({
      query: (coding_id) => ({
        url: `/${coding_id}`,
        method: "GET",
      }),
      providesTags: ["ContestCoding"],
    }),

    // ✅ Update Contest Coding
    updateContestCoding: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["ContestCoding"],
    }),

    // ✅ Toggle Contest Coding Status
    toggleContestCodingStatus: builder.mutation({
      query: (id) => ({
        url: `/${id}/toggle`,
        method: "PATCH",
      }),
      invalidatesTags: ["ContestCoding"],
    }),

    // ✅ Delete Contest Coding
    deleteContestCoding: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ContestCoding"],
    }),
  }),
});

export const {
  useCreateContestCodingMutation,
  useGetContestCodingByActivityQuery,
  useGetContestCodingByIdQuery,
  useUpdateContestCodingMutation,
  useToggleContestCodingStatusMutation,
  useDeleteContestCodingMutation,
} = contestCodingAPI;
