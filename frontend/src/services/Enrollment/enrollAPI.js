import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

// Define a service using a base URL and expected endpoints
export const enrollApi = createApi({
  reducerPath: "enrollApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/enroll/`,
  }),
  endpoints: (builder) => ({
    createEnrollment: builder.mutation({
      query: ({ enrollment, access_token }) => {
        return {
          url: "enrollments",
          method: "POST",
          body: enrollment,
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: ["Enrollments"],
    }),
    getEnrollments: builder.query({
      query: ({ searchTerm, status, dateFrom, dateTo, access_token }) => {
        return {
          url: "enrollments",
          method: "GET",
          params: { searchTerm, status, dateFrom, dateTo },
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      providesTags: ["Enrollments"],
    }),
    getEnrollmentById: builder.query({
      query: ({ id, access_token }) => {
        return {
          url: `enrollments/${id}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      providesTags: ["Enrollments"],
    }),
    // New query for getting user courses
    getUserCourses: builder.query({
      query: ({ userId, access_token, status }) => {
        return {
          url: `users/${userId}/courses`,
          method: "GET",
          params: { status }, // Pass status as query param
          headers: access_token
            ? {
              Authorization: `Bearer ${access_token}`,
            }
            : {},
        };
      },
      providesTags: ["Enrollments"],
    }),
    // New query for getting user courses
    getUserCourse: builder.query({
      query: ({ userId, courseId, access_token }) => {
        return {
          url: `users/${userId}/courses/${courseId}`,
          method: "GET",
          headers: access_token
            ? {
              Authorization: `Bearer ${access_token}`,
            }
            : {},
        };
      },
      providesTags: ["Enrollments"],
    }),
    getUserCourseByHashId: builder.query({
      query: ({ hashId, userId, access_token }) => {
        return {
          url: `/user/${userId}/course-content/${hashId}`,
          method: "GET",
          headers: access_token
            ? {
              Authorization: `Bearer ${access_token}`,
            }
            : {},
        };
      },
      providesTags: ["Enrollments"],
    }),
    getUserCourseProgress: builder.query({
      query: ({ userId, courseHash, access_token }) => ({
        url: `users/${userId}/course-progress/${courseHash}`,
        method: "GET",
        headers: access_token
          ? {
            Authorization: `Bearer ${access_token}`,
          }
          : {},
      }),
      providesTags: ["CourseProgress"],
    }),
    exportUserCourseProgressCsv: builder.query({
      query: ({ userId, courseHash, access_token }) => ({
        url: `users/${userId}/course-progress/${courseHash}/export-csv`,
        method: 'GET',
        responseHandler: async (response) => {
          // Return blob for caller to handle download
          const blob = await response.blob();
          return blob;
        },
        headers: access_token ? { Authorization: `Bearer ${access_token}` } : {},
      }),
    }),
    exportUserCourseProgressXlsx: builder.query({
      query: ({ userId, courseHash, access_token }) => ({
        url: `users/${userId}/course-progress/${courseHash}/export-xlsx`,
        method: 'GET',
        responseHandler: async (response) => {
          const blob = await response.blob();
          return blob;
        },
        headers: access_token ? { Authorization: `Bearer ${access_token}` } : {},
      }),
    }),
    exportUserCourseProgressPdf: builder.query({
      query: ({ userId, courseHash, access_token }) => ({
        url: `users/${userId}/course-progress/${courseHash}/export-pdf`,
        method: 'GET',
        responseHandler: async (response) => {
          const blob = await response.blob();
          return blob;
        },
        headers: access_token ? { Authorization: `Bearer ${access_token}` } : {},
      }),
    }),

    createPayment: builder.mutation({
      query: ({ payment, access_token }) => {
        return {
          url: "payments",
          method: "POST",
          body: payment,
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: ["Payments"],
    }),

    getPayments: builder.query({
      query: ({ access_token, payment_type, search_term, limit, offset }) => {
        return {
          url: `/payments?payment_type=${payment_type}&search_term=${search_term}&offset=${offset}&limit=${limit}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      providesTags: ["Payments"],
    }),
    getPaymentById: builder.query({
      query: ({ id, access_token }) => {
        return {
          url: `payments/${id}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      providesTags: ["Payments"],
    }),
    getPaymentByUserId: builder.query({
      query: ({ id, access_token }) => {
        return {
          url: `payments/user/${id}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      providesTags: ["Payments"],
    }),
    updatePayment: builder.mutation({
      query: ({ id, formData, access_token }) => ({
        url: `payments/${id}`,
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["Payments"],
    }),
    deletePayment: builder.mutation({
      query: ({ id, access_token }) => {
        return {
          url: `payments/${id}`,
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: ["Payments"],
    }),

  }),
});

export const {
  useCreateEnrollmentMutation,
  useGetEnrollmentsQuery,
  useGetEnrollmentByIdQuery,
  useGetUserCoursesQuery, // Export the new hook
  useGetUserCourseQuery, // Export the new hook
  useGetUserCourseByHashIdQuery, // Export the new hook
  useCreatePaymentMutation,
  useGetPaymentsQuery,
  useGetPaymentByIdQuery,
  useGetPaymentByUserIdQuery,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
  useGetUserCourseProgressQuery,
  useExportUserCourseProgressCsvQuery,
  useLazyExportUserCourseProgressCsvQuery
  , useExportUserCourseProgressXlsxQuery
  , useLazyExportUserCourseProgressXlsxQuery
  , useExportUserCourseProgressPdfQuery
  , useLazyExportUserCourseProgressPdfQuery
} = enrollApi;
