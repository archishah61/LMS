import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const studentFAQResponseApi = createApi({
  reducerPath: "studentFAQResponseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/student-faq-response/`,
  }),
  endpoints: (builder) => ({
    // ✅ Create a new student response
    createStudentFAQResponse: builder.mutation({
      query: ({
        user_id,
        course_id,
        faq_id,
        selected_option_id,
        created_by,
        access_token,
      }) => ({
        url: "create",
        method: "POST",
        body: { user_id, course_id, faq_id, selected_option_id, created_by },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["StudentFAQResponse"],
    }),

    // ✅ Get all student responses
    getAllStudentFAQResponses: builder.query({
      query: ({ search_term = "", limit = "10", offset = 0, createdBy, createdById, access_token }) => ({
        url: "all",
        method: "GET",
        params: { search_term, limit, offset, createdBy, createdById },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["StudentFAQResponse"],
    }),

    // ✅ Get responses by Student ID
    getStudentFAQResponsesByStudentId: builder.query({
      query: ({ user_id, access_token }) => ({
        url: `student/${user_id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["StudentFAQResponse"],
    }),

    // ✅ Get responses by Course ID
    getStudentFAQResponsesByCourseId: builder.query({
      query: ({ course_id, access_token }) => ({
        url: `course/${course_id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["StudentFAQResponse"],
    }),

    // ✅ Update a response by ID
    updateStudentFAQResponse: builder.mutation({
      query: ({ id, selected_option_id, updated_by, access_token }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: { selected_option_id, updated_by },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["StudentFAQResponse"],
    }),

    // ✅ Delete a response by ID
    deleteStudentFAQResponse: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `delete/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["StudentFAQResponse"],
    }),
  }),
});

export const {
  useCreateStudentFAQResponseMutation,
  useGetAllStudentFAQResponsesQuery,
  useGetStudentFAQResponsesByStudentIdQuery,
  useGetStudentFAQResponsesByCourseIdQuery,
} = studentFAQResponseApi;
