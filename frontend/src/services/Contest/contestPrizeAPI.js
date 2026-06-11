import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const contestPrizeAPI = createApi({
  reducerPath: "contestPrizeAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/contest/prize`,
    prepareHeaders: (headers) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["ContestPrize"],
  endpoints: (builder) => ({
    // ✅ Create Prize
    createPrize: builder.mutation({
      query: (data) => ({
        url: "/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ContestPrize"],
    }),

    // ✅ Update Prize
    updatePrize: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["ContestPrize"],
    }),

    // ✅ Toggle Prize Status
    togglePrizeStatus: builder.mutation({
      query: (id) => ({
        url: `/${id}/toggle`,
        method: "PATCH",
      }),
      invalidatesTags: ["ContestPrize"],
    }),

    // ✅ Delete Prize
    deletePrize: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ContestPrize"],
    }),

    // ✅ Get Prizes by Contest ID
    getPrizesByContest: builder.query({
      query: (contestId) => ({
        url: `/${contestId}`,
        method: "GET",
      }),
      providesTags: ["ContestPrize"],
    }),
  }),
});

export const {
  useCreatePrizeMutation,
  useUpdatePrizeMutation,
  useTogglePrizeStatusMutation,
  useDeletePrizeMutation,
  useGetPrizesByContestQuery,
} = contestPrizeAPI;
