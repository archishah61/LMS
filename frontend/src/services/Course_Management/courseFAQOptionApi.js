import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const courseFAQOptionApi = createApi({
  reducerPath: "courseFAQOptionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/course-faq-options/`,
  }),
  endpoints: (builder) => ({
    // Create multiple FAQ options for a specific FAQ
    createFAQOptions: builder.mutation({
      query: ({ faq_id, options, access_token }) => ({
        url: "",
        method: "POST",
        body: { faq_id, options },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["CourseFAQOption"],
    }),

    // Get all FAQ options
    getAllFAQOptions: builder.query({
      query: ({ access_token }) => ({
        url: "",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["CourseFAQOption"],
    }),

    // Get all options for a specific FAQ question
    getFAQOptionsByFAQId: builder.query({
      query: ({ faq_id, access_token }) => ({
        url: `faq/${faq_id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["CourseFAQOption"],
    }),

    // Get options for multiple FAQ questions in bulk
    getFAQOptionsByFAQIds: builder.query({
      query: ({ faq_ids, access_token }) => ({
        url: "faq-options/bulk",
        method: "POST",
        body: { faq_ids }, // Send list of FAQ IDs in the request body
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["CourseFAQOption"],
    }),

    // Update an FAQ option
    updateFAQOption: builder.mutation({
      query: ({ id, option_text, access_token }) => ({
        url: `${id}`,
        method: "PUT",
        body: { option_text },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["CourseFAQOption"],
    }),

    // Delete an FAQ option
    deleteFAQOption: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["CourseFAQOption"],
    }),
  }),
});

export const {
  useCreateFAQOptionsMutation,
  useGetAllFAQOptionsQuery,
  useGetFAQOptionsByFAQIdQuery,
  useGetFAQOptionsByFAQIdsQuery, // New Hook for bulk fetching
  useUpdateFAQOptionMutation,
  useDeleteFAQOptionMutation,
} = courseFAQOptionApi;
