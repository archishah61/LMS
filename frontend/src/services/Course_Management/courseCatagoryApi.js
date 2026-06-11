import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken, getStudentToken } from "../CookieService";

export const courseCategoryApi = createApi({
  reducerPath: "courseCategoryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/course-catagory/`,
  }),
  endpoints: (builder) => ({
    createCourseCategory: builder.mutation({
      query: ({ category, created_by, access_token }) => ({
        url: "create/",
        method: "POST",
        body: { category, created_by }, // ✅ Now sending created_by
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["CourseCategory"],
    }),

    getCourseCategories: builder.query({
      query: ({ access_token, status, sort }) => ({
        url: ``,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: {
          status: status || "all",
          sort: sort || "created_at",
        },
      }),
      providesTags: ["CourseCategory"],
    }),

    getActiveCourseCategories: builder.query({
      query: ({ access_token }) => ({
        url: "/active",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["CourseCategory"],
    }),

    getCourseCategoryById: builder.query({
      query: ({ id, access_token, status, sort }) => ({
        url: `/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: {
          ...(status && { status }),
          ...(sort && { sort }),
        },
      }),
      providesTags: ["CourseCategory"],
    }),

    updateCourseCategory: builder.mutation({
      query: ({ id, category, updated_by, access_token }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: { category, updated_by }, // ✅ Now sending updated_by
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["CourseCategory"],
    }),

    updateCourseCategoryStatus: builder.mutation({
      query: ({ id, status, updated_by, access_token }) => ({
        url: `${id}/status`,
        method: "PUT",
        body: { status, updated_by },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["CourseCategory"],
    }),
  }),
});

export const {
  useCreateCourseCategoryMutation,
  useGetCourseCategoriesQuery,
  useGetActiveCourseCategoriesQuery,
  useGetCourseCategoryByIdQuery,
  useUpdateCourseCategoryMutation,
  useUpdateCourseCategoryStatusMutation,
} = courseCategoryApi;
