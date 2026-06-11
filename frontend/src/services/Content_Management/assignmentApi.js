import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

// Define a service using a base URL and expected endpoints
export const assignmentApi = createApi({
  reducerPath: "assignmentApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/assignments/`,
  }),
  tagTypes: ["CreateAssignment", "UpdateAssignment"],
  endpoints: (builder) => ({
    createAssignment: builder.mutation({
      query: ({ assignment, access_token }) => {
        return {
          url: "create/",
          method: "POST",
          body: assignment,
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: ["CreateAssignment"],
    }),
    getAssignmentModuleById: builder.query({
      query: ({ moduleId, access_token }) => {
        return {
          url: `/module/${moduleId}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      providesTags: ["CreateAssignment", "UpdateAssignment"],
    }),

    getActiveAssignmentModuleById: builder.query({
      query: ({ moduleId, access_token }) => {
        return {
          url: `/active-assignment/module/${moduleId}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      providesTags: ["CreateAssignment", "UpdateAssignment"],
    }),

    getAssignmentById: builder.query({
      query: ({ id, access_token }) => {
        return {
          url: `/${id}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
    }),

    updateAssignment: builder.mutation({
      query: ({ id, formData, access_token }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UpdateAssignment"],
    }),

    getAssignmentByAssignmentId: builder.query({
      query: ({ assignmentId, access_token }) => {
        return {
          url: `byId/${assignmentId}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
    }),

    createTrueFalseQuestion: builder.mutation({
      query: ({ body, access_token }) => {
        return {
          url: "/truefalse/create",
          method: "POST",
          body: body,
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: ["CreateAssignment"],
    }),

    editTrueFalseQuestion: builder.mutation({
      query: ({ questionId, body, access_token }) => {
        return {
          url: `/truefalse/update/${questionId}`,
          method: "PUT",
          body: body,
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: ["CreateAssignment"],
    }),

    deleteTrueFalseQuestion: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `/truefalse/delete/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["CreateAssignment"],
    }),

    createFillBlanksQuestion: builder.mutation({
      query: ({ body, access_token }) => {
        return {
          url: "/filltheblanks/create",
          method: "POST",
          body: body,
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: ["CreateAssignment"],
    }),

    editFillBlanksQuestion: builder.mutation({
      query: ({ questionId, body, access_token }) => {
        return {
          url: `/filltheblanks/update/${questionId}`,
          method: "PUT",
          body: body,
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: ["CreateAssignment"],
    }),

    deleteFillBlanksQuestion: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `/filltheblanks/delete/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["CreateAssignment"],
    }),

    createMatchingQuestion: builder.mutation({
      query: ({ formData, access_token }) => {
        return {
          url: "/matching/create",
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: ["CreateAssignment"],
    }),

    editMatchingQuestion: builder.mutation({
      query: ({ questionId, formData, access_token }) => {
        return {
          url: `/matching/update/${questionId}`,
          method: "PUT",
          body: formData,
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: ["CreateAssignment"],
    }),

    deleteMatchingQuestion: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `/matching/delete/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["CreateAssignment"],
    }),
  }),
});

export const {
  useCreateAssignmentMutation,
  useGetAssignmentModuleByIdQuery,
  useGetActiveAssignmentModuleByIdQuery,
  useGetAssignmentByIdQuery,
  useUpdateAssignmentMutation,
  useGetAssignmentByAssignmentIdQuery,
  useCreateTrueFalseQuestionMutation,
  useEditTrueFalseQuestionMutation,
  useDeleteTrueFalseQuestionMutation,
  useCreateFillBlanksQuestionMutation,
  useEditFillBlanksQuestionMutation,
  useDeleteFillBlanksQuestionMutation,
  useCreateMatchingQuestionMutation,
  useEditMatchingQuestionMutation,
  useDeleteMatchingQuestionMutation
} = assignmentApi;
