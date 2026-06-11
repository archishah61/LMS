import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define the API service for Contacts
export const contactApi = createApi({
  reducerPath: "contactApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/contacts`,
  }),
  tagTypes: ['Contact'],
  endpoints: (builder) => ({
    // Create a Contact
    createContact: builder.mutation({
      query: (contactData) => ({
        url: "/",
        method: "POST",
        body: contactData,
      }),
      invalidatesTags: ['Contact'],
    }),

    // Get all Contacts
    getAllContacts: builder.query({
      query: ({ search_term = '', limit = 10, offset = 0, read, access_token }) => ({
        url: "/",
        method: "GET",
        params: { search_term, limit, offset, read },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ['Contact'],
    }),

    // Delete a Contact by ID
    deleteContactById: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ['Contact'],
    }),

    // Delete all Contacts
    deleteAllContacts: builder.mutation({
      query: (access_token) => ({
        url: "/",
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ['Contact'],
    }),

    // Mark a Contact as read by ID
    markContactAsReadById: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `/${id}/read`,
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ['Contact'],
    }),

    // Mark all Contacts as read
    markAllContactsAsRead: builder.mutation({
      query: (access_token) => ({
        url: "/read-all",
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ['Contact'],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useCreateContactMutation,
  useGetAllContactsQuery,
  useDeleteContactByIdMutation,
  useDeleteAllContactsMutation,
  useMarkContactAsReadByIdMutation,
  useMarkAllContactsAsReadMutation,
} = contactApi;
