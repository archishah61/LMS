import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

// Define the API service for predefined options
export const preDefinedOptionsApi = createApi({
  reducerPath: "preDefinedOptionsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/pre-defined-options/`,
    prepareHeaders: (headers, { getState }) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    createPreDefinedOption: builder.mutation({
      query: (formData) => ({
        url: "create",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["CreatePreDefinedOptions"],
    }),

    getPreDefinedOptions: builder.query({
      query: () => "/",
    }),

    getPreDefinedOptionsByQuestionId: builder.query({
      query: (questionId) => `/${questionId}`,
      providesTags: ["CreatePreDefinedOptions", "UpdatePreDefinedOptions"],
    }),

    updatePreDefinedOption: builder.mutation({
      query: ({ id, formData }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["UpdatePreDefinedOptions"],
    }),

    deletePreDefinedOption: builder.mutation({
      query: (id) => ({
        url: `delete/${id}`,
        method: "DELETE",
      }),
    }),
    deletePreDefinedOptionsByQuestionId: builder.mutation({
      query: (questionId) => ({
        url: `/delete/options/${questionId}`,
        method: "DELETE",
      }),
    }),
  }),
});

// Export hooks for usage in components
export const {
  useCreatePreDefinedOptionMutation,
  useGetPreDefinedOptionsQuery,
  useGetPreDefinedOptionsByQuestionIdQuery,
  useUpdatePreDefinedOptionMutation,
  useDeletePreDefinedOptionMutation,
  useDeletePreDefinedOptionsByQuestionIdMutation,
} = preDefinedOptionsApi;
