/* eslint-disable no-unused-vars */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const courseFAQApi = createApi({
  reducerPath: "courseFAQApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/course-faqs/`,
  }),
  endpoints: (builder) => ({
    // Create a new FAQ
    createCourseFAQ: builder.mutation({
      query: ({ question, course_id, created_by, access_token }) => ({
        url: "",
        method: "POST",
        body: { question, course_id, created_by },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["CourseFAQ"],
    }),

    // // Get all FAQs
    // getCourseFAQs: builder.query({
    //   query: () => ({
    //     url: "",
    //     method: "GET",
    //   }),
    //   providesTags: ["CourseFAQ"],
    // }),

    // Get FAQs by Course ID
    getCourseFAQsByCourseId: builder.query({
      query: ({ course_id, access_token }) => ({
        url: `course/${course_id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["CourseFAQ"],
    }),

    // Update an FAQ
    updateCourseFAQ: builder.mutation({
      query: ({ id, question, is_active, updated_by, access_token }) => ({
        url: `${id}`,
        method: "PUT",
        body: { question, is_active, updated_by },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["CourseFAQ"],
    }),

    // Delete an FAQ
    deleteCourseFAQ: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["CourseFAQ"],
    }),
  }),
});

export const {
  useCreateCourseFAQMutation,
  // useGetCourseFAQsQuery,
  useGetCourseFAQsByCourseIdQuery,
  useLazyGetCourseFAQsByCourseIdQuery,
  useUpdateCourseFAQMutation,
  useDeleteCourseFAQMutation,
} = courseFAQApi;
