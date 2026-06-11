import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

// Define a service for assignment response data CRUD operations
export const assignmentResponseApi = createApi({
  reducerPath: "assignmentResponseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/assignment-responses/`, // Ensure the correct endpoint path
    prepareHeaders: (headers, { getState }) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    createAssignmentResponse: builder.mutation({
      query: ({ responseData, access_token }) => ({
        url: "",
        method: "POST",
        body: responseData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),

    getAssignmentResponses: builder.query({
      query: () => ({
        url: "",
        method: "GET",
      }),
    }),

    getAssignmentResponseById: builder.query({
      query: (id) => ({
        url: `${id}`,
        method: "GET",
      }),
    }),

    getAssignmentResponseByStudentId: builder.query({
      query: (studentId) => ({
        url: `student/${studentId}`, // Ensure route matches your backend
        method: "GET",
      }),
    }),

    getAssignmentResponsesByCompletionId: builder.query({
      query: ({ completionId, access_token }) => ({
        url: `completion/${completionId}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["AssignmentResponse"],
    }),

    updateAssignmentResponse: builder.mutation({
      query: ({ id, responseData, access_token }) => ({
        url: `${id}`,
        method: "PUT",
        body: responseData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),

    deleteAssignmentResponse: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),
  }),
});

export const {
  useCreateAssignmentResponseMutation,
  useGetAssignmentResponsesByCompletionIdQuery,
} = assignmentResponseApi;
