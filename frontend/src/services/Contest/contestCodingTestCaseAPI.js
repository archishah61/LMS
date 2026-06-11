import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const contestCodingTestCaseAPI = createApi({
  reducerPath: "contestCodingTestCaseAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/contest/activity/coding/test-case`,
    prepareHeaders: (headers) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["ContestCodingTestCase"],
  endpoints: (builder) => ({
    // ✅ Create Test Case
    createTestCase: builder.mutation({
      query: (data) => ({
        url: "/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ContestCodingTestCase"],
    }),

    // ✅ Get Test Cases by Coding ID
    getTestCases: builder.query({
      query: (coding_id) => ({
        url: `/${coding_id}`,
        method: "GET",
      }),
      providesTags: ["ContestCodingTestCase"],
    }),

    // ✅ Update Test Case
    updateTestCase: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["ContestCodingTestCase"],
    }),

    // ✅ Toggle Test Case Status
    toggleTestCaseStatus: builder.mutation({
      query: (id) => ({
        url: `/${id}/toggle`,
        method: "PATCH",
      }),
      invalidatesTags: ["ContestCodingTestCase"],
    }),

    // ✅ Delete Test Case
    deleteTestCase: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ContestCodingTestCase"],
    }),
  }),
});

export const {
  useCreateTestCaseMutation,
  useGetTestCasesQuery,
  useUpdateTestCaseMutation,
  useToggleTestCaseStatusMutation,
  useDeleteTestCaseMutation,
} = contestCodingTestCaseAPI;
