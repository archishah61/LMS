import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

// Define the API service for Reviews
export const reviewApi = createApi({
  reducerPath: "reviewApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/review/`,
  }),
  endpoints: (builder) => ({
    // Create a Review
    createReview: builder.mutation({
      query: ({ reviewData, access_token }) => ({
        url: "create/",
        method: "POST",
        body: reviewData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["CreateReview"],
    }),

    // Get all Reviews
    getAllReviews: builder.query({
      query: ({ access_token, course_id, rating, username, search_term, page = 1, limit = 10 }) => ({
        url: "",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: {
          course_id,
          rating,
          username,
          search_term,
          page,
          limit,
        },
      }),
      providesTags: ["CreateReview", "UpdateReview"],
    }),

    // Get a Review by ID
    getReviewById: builder.query({
      query: ({ id, access_token }) => ({
        url: `/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["UpdateReview"],
    }),
    // Get review by Course ID
    getReviewsByCourseId: builder.query({
      query: ({ courseId, page, limit, exclude_user_id }) => ({
        url: `/course/${courseId}`,
        method: "GET",
        params: {
          page,
          limit,
          exclude_user_id
        }
      }),
      providesTags: ["CreateReview", "UpdateReview", "DeleteReview"],
    }),
    // Get User Review for a Course
    getUserReview: builder.query({
      query: ({ courseId, userId, access_token }) => ({
        url: "user-review",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: {
          courseId,
          userId
        }
      }),
      providesTags: ["CreateReview", "UpdateReview", "DeleteReview"],
    }),
    // Update a Review by ID
    updateReview: builder.mutation({
      query: ({ id, reviewData, access_token }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: reviewData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UpdateReview"],
    }),

    // Delete a Review by ID
    deleteReview: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `delete/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["DeleteReview"],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useCreateReviewMutation,
  useGetAllReviewsQuery,
  useGetReviewByIdQuery,
  useGetReviewsByCourseIdQuery,
  useGetUserReviewQuery,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} = reviewApi;
