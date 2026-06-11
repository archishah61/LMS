import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

// Define a service using a base URL and expected endpoints
export const cheatSheetApi = createApi({
  reducerPath: "cheatSheetApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/cheat-sheets/`,
    // prepareHeaders: (headers, { getState }) => {
    //   const token = getAdminToken();
    //   if (token) {
    //     headers.set("Authorization", `Bearer ${token.access_token}`);
    //   }
    //   return headers;
    // },
  }),
  endpoints: (builder) => ({
    createCheatSheet: builder.mutation({
      query: ({ cheatSheet, access_token }) => {
        return {
          url: "create/",
          method: "POST",
          body: cheatSheet,
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: ["CheatSheet"],
    }),
    getCheatSheets: builder.query({
      query: ({ createdBy = 'all', createdById, search_term = '', limit = 10, offset = 0, access_token }) => {
        return {
          url: "",
          method: "GET",
          params: { createdBy, createdById, search_term, limit, offset },
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      providesTags: ["CheatSheet"],
    }),
    getActiveCheatSheets: builder.query({
      query: ({ search_term, filter, page = 1, limit = 12, access_token } = {}) => {
        const headers = {};
        if (access_token) {
          headers.Authorization = `Bearer ${access_token}`;
        }
        
        const params = { page, limit };
        if (search_term) params.search_term = search_term;
        if (filter && filter !== 'all') params.filter = filter;

        return {
          url: "/active",
          method: "GET",
          params,
          headers,
        };
      },
      providesTags: ["CheatSheet"],
      keepUnusedDataFor: 0, 
    }),
    getCheatSheetById: builder.query({
      query: (id) => {
        return {
          url: `/${id}`,
          method: "GET",
        };
      },
      providesTags: ["CheatSheet"],
    }),
    updateCheatSheet: builder.mutation({
      query: ({ id, formData, access_token }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["CheatSheet"],
    }),
    deleteCheatSheet: builder.mutation({
      query: ({ id, access_token }) => {
        return {
          url: `delete/${id}`,
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: ["CheatSheet"],
    }),

    UpdateCheatSheetSectionStatus: builder.mutation({
      query: ({ cheatSheetId, status, access_token }) => ({
        url: `/${cheatSheetId}/status`,
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        body: { status },
      }),
      invalidatesTags: ["UpdateModule"],
    }),

    // - Cheat Sheet Payment
    payCheatSheet: builder.mutation({
      query: ({ purchase, access_token }) => {
        return {
          url: "pay/",
          method: "POST",
          body: purchase,
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: ["CheatSheet"],
    }),
    getPaidCheatSheets: builder.query({
      query: ({ access_token }) => {
        return {
          url: "get-paid/",
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      providesTags: ["CheatSheet"],
    }),
  }),
});

export const {
  useCreateCheatSheetMutation,
  useGetCheatSheetsQuery,
  useGetActiveCheatSheetsQuery,
  useGetCheatSheetByIdQuery,
  useUpdateCheatSheetMutation,
  useDeleteCheatSheetMutation,
  useUpdateCheatSheetSectionStatusMutation,
  usePayCheatSheetMutation,
  useGetPaidCheatSheetsQuery,
} = cheatSheetApi;
