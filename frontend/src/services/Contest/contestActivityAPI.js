import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const contestActivityAPI = createApi({
  reducerPath: "contestActivityAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/contest/activity`,
    prepareHeaders: (headers) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["ContestActivity"],
  endpoints: (builder) => ({
    // ✅ Create Activity
    createActivity: builder.mutation({
      query: (data) => ({
        url: "/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ContestActivity"],
    }),

    // ✅ Update Activity
    updateActivity: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["ContestActivity"],
    }),

    // ✅ Delete Activity
    deleteActivity: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ContestActivity"],
    }),

    // ✅ Toggle Activity
    toggleActivityStatus: builder.mutation({
      query: (id) => ({
        url: `/${id}/toggle`,
        method: "PATCH",
      }),
      invalidatesTags: ["ContestActivity"],
    }),

    // ✅ Get Activities by Contest ID
    getActivitiesByContest: builder.query({
      query: ({ contestId, sortBy, type, difficulty }) => ({
        url: `/contest/${contestId}`,
        params: { sortBy, type, difficulty },
        method: "GET",
      }),
      providesTags: ["ContestActivity"],
    }),

    // ✅ Get Activity by ID (optional)
    getActivityById: builder.query({
      query: (id) => ({
        url: `/${id}`,
        method: "GET",
      }),
      providesTags: ["ContestActivity"],
    }),
  }),
});

export const {
  useCreateActivityMutation,
  useUpdateActivityMutation,
  useDeleteActivityMutation,
  useToggleActivityStatusMutation,
  useGetActivitiesByContestQuery,
  useGetActivityByIdQuery,
} = contestActivityAPI;
