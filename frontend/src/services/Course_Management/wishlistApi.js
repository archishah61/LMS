import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

// Define the API service for Wishlist
export const wishlistApi = createApi({
  reducerPath: "wishlistApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/wishlist/`,
  }),
  endpoints: (builder) => ({
    // Add Course to Wishlist
    addToWishlist: builder.mutation({
      query: ({ wishlistData, access_token }) => ({
        url: "add/",
        method: "POST",
        body: wishlistData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["Wishlist"],
    }),

    // Get Wishlist Items by User ID
    getWishlistByUserId: builder.query({
      query: ({ user_id, limit = 10, offset = 0, access_token }) => ({
        url: `/${user_id}`,
        method: "GET",
        params: { limit, offset },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["Wishlist"],
    }),

    // Remove Course from Wishlist
    removeFromWishlist: builder.mutation({
      query: ({ course_id, user_id, access_token }) => ({
        url: `remove/`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: { course_id, user_id }, // Send course_id and user_id in the body
      }),
      invalidatesTags: ["Wishlist"],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useAddToWishlistMutation,
  useGetWishlistByUserIdQuery,
  useRemoveFromWishlistMutation,
} = wishlistApi;
