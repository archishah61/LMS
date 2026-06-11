import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const sessionApi = createApi({
  reducerPath: "sessionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/sessions/`,
  }),
  tagTypes: ["CreateSession", "UpdateSession"],
  endpoints: (builder) => ({
    // Create a new session
    createSession: builder.mutation({
      query: ({ session, access_token }) => ({
        url: "create",
        method: "POST",
        body: session,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["CreateSession"],
    }),

    // Get all sessions (optionally by course_id)
    // add access token
    // getAllSessions: builder.query({
    //   query: () => ({
    //     url: "all",
    //     method: "GET",
    //   }),
    //   providesTags: ["CreateSession", "UpdateSession"],
    // }),

    getSessionsByCourseId: builder.query({
      query: ({ courseId, searchTerm, dateFrom, dateTo, statusFilter, access_token }) => ({
        url: `course/${courseId}`,
        params: { searchTerm, dateFrom, dateTo, statusFilter },
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["CreateSession", "UpdateSession"],
    }),

    getActiveSessionsByCourseId: builder.query({
      query: ({ courseId, access_token }) => ({
        url: `active/${courseId}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["CreateSession", "UpdateSession"],
    }),

    // Get a session by ID
    getSessionById: builder.query({
      query: ({ id, access_token }) => ({
        url: `${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: (result, error, arg) => [
        { type: "UpdateSession", id: arg.id },
      ],
    }),

    // Update a session
    updateSession: builder.mutation({
      query: ({ id, formData, access_token }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        "UpdateSession",
        { type: "UpdateSession", id: arg.id },
      ],
    }),

    updateSessionSequence: builder.mutation({
      query: ({ sequence, access_token }) => ({
        url: "session/sequence", // Endpoint for updating modules
        method: "PUT",
        body: { sequence },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UpdateSession"], // Refresh module data after updating
    }),

    // Update session status
    updateSessionStatus: builder.mutation({
      query: ({ sessionId, status, access_token }) => ({
        url: `${sessionId}/status`,
        method: "PATCH",
        body: { status },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UpdateSession"],
    }),
  }),
});

export const {
  useCreateSessionMutation,
  useGetSessionsByCourseIdQuery,
  useGetActiveSessionsByCourseIdQuery,
  useGetSessionByIdQuery,
  useUpdateSessionMutation,
  useUpdateSessionSequenceMutation,
  useUpdateSessionStatusMutation,
} = sessionApi;
