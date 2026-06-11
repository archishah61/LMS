import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const termsOfServiceApi = createApi({
  reducerPath: "termsOfServiceApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/terms/`,
  }),
  tagTypes: ["TermsOfService"],
  endpoints: (builder) => ({
    // Create Terms of Service
    createTermsOfService: builder.mutation({
      query: ({ data, access_token }) => ({
        url: "",
        method: "POST",
        body: data,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["TermsOfService"],
    }),
    // Update Terms of Service
    updateTermsOfService: builder.mutation({
      query: ({ id, data, access_token }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: data,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["TermsOfService"],
    }),
    // Get All Terms of Service
    getAllTermsOfService: builder.query({
      query: (access_token) => ({
        url: "",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["TermsOfService"],
    }),
    // Get by Category
    getTermsOfServiceByCategory: builder.query({
      query: ({ category, access_token }) => ({
        url: `category/${category}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["TermsOfService"],
    }),
    // Toggle Terms of Service Status
    toggleTermsOfServiceStatus: builder.mutation({
      query: ({ id, data, access_token }) => ({
        url: `toggle-status/${id}`,
        method: "PATCH",
        body: data,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["TermsOfService"],
    }),
  }),
});

export const {
  useCreateTermsOfServiceMutation,
  useUpdateTermsOfServiceMutation,
  useGetAllTermsOfServiceQuery,
  useGetTermsOfServiceByCategoryQuery,
  useToggleTermsOfServiceStatusMutation,
} = termsOfServiceApi;