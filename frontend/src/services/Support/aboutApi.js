import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define the API service for About entries
export const aboutApi = createApi({
  reducerPath: "aboutApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/about`,
  }),
  tagTypes: ['About'],
  endpoints: (builder) => ({
    // Create an About entry
    createAbout: builder.mutation({
      query: ({ aboutData, access_token }) => ({
        url: "/",
        method: "POST",
        body: aboutData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ['About'],
    }),

    // Update an About entry by ID
    updateAbout: builder.mutation({
      query: ({ id, aboutData, access_token }) => ({
        url: `/${id}`,
        method: "PUT",
        body: aboutData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ['About'],
    }),

    // Update About status by ID
    updateAboutStatus: builder.mutation({
      query: ({ id, status, access_token }) => ({
        url: `/update-status/${id}`,
        method: "PATCH",
        body: { status },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ['About'],
    }),

    // Get all About entries
    getAllAbout: builder.query({
      query: ({ searchTerm = '', all = true, status, limit, offset } = {}) => {
        const params = { searchTerm, all };

        if (status !== undefined && status !== null && status !== '') {
          params.status = status;
        }

        if (limit !== undefined && limit !== null && limit !== '') {
          params.limit = limit;
        }

        if (offset !== undefined && offset !== null && offset !== '') {
          params.offset = offset;
        }

        return {
          url: "/",
          params,
          method: "GET",
        };
      },
      providesTags: ['About'],
    }),

    // Delete an About entry by ID
    deleteAboutById: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ['About'],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useCreateAboutMutation,
  useUpdateAboutMutation,
  useUpdateAboutStatusMutation,
  useGetAllAboutQuery,
  useDeleteAboutByIdMutation,
} = aboutApi;
