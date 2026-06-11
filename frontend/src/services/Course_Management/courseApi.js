import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define a service using a base URL and expected endpoints
export const courseApi = createApi({
  reducerPath: "courseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/courses/`,
  }),
  tagTypes: ["CreateCourse", "UpdateCourse"],
  endpoints: (builder) => ({
    createCourse: builder.mutation({
      query: ({ course, access_token }) => {
        return {
          url: "create/",
          method: "POST",
          body: course,
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: ["CreateCourse"],
    }),
    certificateGenerate: builder.mutation({
      query: ({ courseId, access_token }) => {
        return {
          url: "certificate/",
          method: "POST",
          body: { courseId },
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: ["CreateCourse"],
    }),
    getCourses: builder.query({
      query: (params) => {
        // If no params passed, return all courses (for student view)
        if (!params) {
          return {
            url: "",
            method: "GET",
          };
        }

        // If params passed, extract them and add to query
        const { access_token, searchTerm, categoryId, limit, offset, creatorType, role, userId } = params;
        const queryParams = new URLSearchParams();

        if (searchTerm) queryParams.append("searchTerm", searchTerm);
        if (categoryId) queryParams.append("categoryId", categoryId);
        if (limit) queryParams.append("limit", limit);
        if (offset) queryParams.append("offset", offset);
        if (creatorType) queryParams.append("creatorType", creatorType);
        if (role) queryParams.append("role", role);
        if (userId) queryParams.append("userId", userId);

        const queryString = queryParams.toString();

        return {
          url: queryString ? `?${queryString}` : "",
          method: "GET",
          headers: access_token ? {
            Authorization: `Bearer ${access_token}`,
          } : {},
        };
      },
      providesTags: ["CreateCourse", "UpdateCourse"],
    }),
    getAdminCourses: builder.query({
      query: ({ creatorType = 'all', createdById, createdFrom, createdTo, search_term = '', limit = 10, offset = 0, access_token }) => {
        return {
          url: `/admin`,
          method: "GET",
          params: { creatorType, createdById, createdFrom, createdTo, search_term, limit, offset },
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      providesTags: ["CreateCourse", "UpdateCourse"],
    }),
    getUserGeneratedCourses: builder.query({
      query: ({ access_token }) => {
        return {
          url: "/user-generated",
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      providesTags: ["CreateCourse", "UpdateCourse"],
    }),
    getCourseById: builder.query({
      query: ({ id, access_token }) => ({
        url: `/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: (result, error, arg) => [
        { type: "UpdateCourse", id: arg.id },
      ],
    }),
    exportCourse: builder.query({
      query: ({ id, access_token }) => ({
        url: `export/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),
    updateCourse: builder.mutation({
      query: ({ id, formData, access_token }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        "UpdateCourse",
        { type: "UpdateCourse", id: arg.id },
      ],
    }),
    // ✅ New: Update Course Status Only
    updateCourseStatus: builder.mutation({
      query: ({ id, status, access_token }) => ({
        url: `update-status/${id}`,
        method: "PUT",
        body: { status },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UpdateCourse"],
    }),

    // deleteCourse: builder.mutation({
    //   query: ({ id, access_token }) => ({
    //     url: `delete/${id}`,
    //     method: "DELETE",
    //     headers: {
    //       Authorization: `Bearer ${access_token}`,
    //     },
    //   }),
    //   invalidatesTags: (result, error, arg) => [
    //     "UpdateCourse",
    //     { type: "UpdateCourse", id: arg.id },
    //   ],
    // }),

    updateCourseSequence: builder.mutation({
      query: ({ sequence, access_token }) => ({
        url: "/sequence", // Endpoint to update all courses at once
        method: "PUT",
        body: { sequence }, // Sending the new order of course IDs
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UpdateCourse"], // This will refresh course data after updating
    }),

    getAllCourseName: builder.query({
      query: ({ access_token, search_term }) => ({
        url: `getAllCourse`,
        method: "GET",
        params: { search_term },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["CreateCourse", "UpdateCourse"],
    }),
    getTrendingCourses: builder.query({
      query: ({ limit = 12, offset = 0 } = {}) => {
        return {
          url: "trending",
          method: "GET",
          params: { limit, offset }, // Send limit and offset as query params
        };
      },
      // Cache the result for 5 minutes (300 seconds) to avoid frequent re-fetching
      keepUnusedDataFor: 300,
      providesTags: ["UpdateCourse"],
    }),

  }),
});

export const {
  useCreateCourseMutation,
  useCertificateGenerateMutation,
  useGetCoursesQuery,
  useGetAdminCoursesQuery,
  useGetUserGeneratedCoursesQuery,
  useGetCourseByIdQuery,
  useExportCourseQuery,
  useUpdateCourseMutation,
  useUpdateCourseStatusMutation,
  // useDeleteCourseMutation,
  useUpdateCourseSequenceMutation,
  useGetAllCourseNameQuery,
  useGetTrendingCoursesQuery
} = courseApi;
