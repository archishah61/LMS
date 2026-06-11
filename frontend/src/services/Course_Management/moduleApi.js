import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

// Define a service using a base URL and expected endpoints
export const moduleApi = createApi({
  reducerPath: "moduleApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/modules/`,
  }),
  tagTypes: ["CreateModule", "UpdateModule"],
  endpoints: (builder) => ({
    createModule: builder.mutation({
      query: ({ module, access_token }) => {
        return {
          url: "create/",
          method: "POST",
          body: module,
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: ["CreateModule"],
    }),
    getModulesByCourseId: builder.query({
      query: ({ id, access_token }) => {
        return {
          url: `course/${id}`,
          method: "GET",
        };
      },
      providesTags: ["CreateModule", "UpdateModule"],
    }),
    getModulesBySessionId: builder.query({
      query: ({ id, searchTerm, dateFrom, dateTo, statusFilter, access_token }) => {
        return {
          url: `session/${id}`,
          params: { searchTerm, dateFrom, dateTo, statusFilter },
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      providesTags: ["CreateModule", "UpdateModule"],
    }),
    getModuleById: builder.query({
      query: ({ id, access_token }) => {
        return {
          url: `/${id}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      providesTags: (result, error, arg) => [
        { type: "UpdateModule", id: arg.id },
      ],
    }),
    updateModule: builder.mutation({
      query: ({ id, formData, access_token }) => {
        return {
          url: `update/${id}`,
          method: "PUT",
          body: formData,
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: (result, error, arg) => [
        "UpdateModule",
        { type: "UpdateModule", id: arg.id },
      ],
    }),

    updateModuleSequence: builder.mutation({
      query: ({ sequence, access_token }) => ({
        url: "/module/sequence", // Endpoint for updating modules
        method: "PUT",
        body: { sequence },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UpdateModule"], // Refresh module data after updating
    }),
    updateModuleStatus: builder.mutation({
      query: ({ moduleId, status, access_token }) => ({
        url: `/${moduleId}/status`,
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        body: { status },
      }),
      invalidatesTags: ["UpdateModule"],
    }),
    getLazyModulesBySessionId: builder.query({
      query: ({ id, access_token }) => {
        return {
          url: `session/${id}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      providesTags: ["CreateModule", "UpdateModule"],
    }),
  }),
});

export const {
  useCreateModuleMutation,
  useGetModulesByCourseIdQuery,
  useGetModulesBySessionIdQuery,
  useGetModuleByIdQuery,
  useUpdateModuleMutation,
  useUpdateModuleSequenceMutation,
  useUpdateModuleStatusMutation,
  useLazyGetModulesBySessionIdQuery
} = moduleApi;
