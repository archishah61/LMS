/* eslint-disable no-unused-vars */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

// Define a service for assignment completion data CRUD operations
export const assignmentCompletionApi = createApi({
  reducerPath: "assignmentCompletionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/assignment-completions/`, // Ensure the correct endpoint path
  }),
  endpoints: (builder) => ({
    createAssignmentCompletion: builder.mutation({
      query: ({ completionData, access_token }) => ({
        url: "",
        method: "POST",
        body: completionData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["CreateAssignment"],
    }),

    createDueDateOfAssignments: builder.mutation({
      query: ({ dueDateData, access_token }) => ({
        url: "/due-date",
        method: "POST",
        body: dueDateData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["CreateAssignment"],
    }),


    getAssignmentCompletionById: builder.query({
      query: ({ id, access_token }) => ({
        url: `${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),

    getAssignmentCompletionByStudentId: builder.query({
      query: ({ studentId, access_token }) => ({
        url: `student/${studentId}`, // Ensure route matches your backend
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: [
        "CreateAssignment",
        "UpdateAssignment",
        "DeleteAssignment",
      ],
    }),

    updateAssignmentCompletion: builder.mutation({
      query: ({ id, completionData, access_token }) => ({
        url: `${id}`,
        method: "PUT",
        body: completionData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UpdateAssignment"],
    }),

    getAssignmentCompletionByAssignmentId: builder.query({
      query: ({ userId, assignmentId }) => ({
        url: `/assignment/${assignmentId}/${userId}`, // Ensure route matches your backend
        method: "GET",
      }),

    }),

    evaluateAssignment: builder.mutation({
      query: ({ submissionData, access_token }) => ({
        url: `/submit-assignment/`,
        method: "POST",
        body: submissionData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["CreateAssignment"],
    }),
  }),
});

export const {
  useCreateAssignmentCompletionMutation,
  useGetAssignmentCompletionByIdQuery,
  useGetAssignmentCompletionByStudentIdQuery,
  useUpdateAssignmentCompletionMutation,
  useLazyGetAssignmentCompletionByAssignmentIdQuery,
  useCreateDueDateOfAssignmentsMutation,
  useEvaluateAssignmentMutation
} = assignmentCompletionApi;
