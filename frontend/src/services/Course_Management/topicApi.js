import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { assignmentApi } from "../Content_Management/assignmentApi";
import { quizApi } from "./quizApi";

// Define a service using a base URL and expected endpoints
export const topicApi = createApi({
  reducerPath: "topicApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/topics/`,
  }),
  tagTypes: ["CreateTopic", "UpdateTopic"],
  endpoints: (builder) => ({
    createTopic: builder.mutation({
      query: ({ topic, access_token }) => {
        return {
          url: "create/",
          method: "POST",
          body: topic,
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: ["CreateTopic"],
    }),
    getTopicsByModuleId: builder.query({
      query: ({ id, access_token }) => {
        return {
          url: `module/${id}`,
          method: "GET",
        };
      },
      providesTags: ["CreateTopic", "UpdateTopic"],
    }),
    getLazyTopicsByModuleId: builder.query({
      query: ({ id, access_token }) => {
        return {
          url: `module/${id}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      providesTags: ["CreateTopic", "UpdateTopic"],
    }),
    getTopicById: builder.query({
      query: ({ id, access_token }) => {
        return {
          url: `/${id}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      providesTags: (result, error, arg) => [
        { type: "UpdateTopic", id: arg.id },
      ],
    }),
    updateTopic: builder.mutation({
      query: ({ id, formData, access_token }) => {
        return {
          url: `update/${id}`,
          method: "PUT",
          body: formData,
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: (result, error, arg) => [
        "UpdateTopic",
        { type: "UpdateTopic", id: arg.id },
      ],
    }),
    updateTopicSequence: builder.mutation({
      query: ({ sequence, access_token }) => ({
        url: "/sequence",
        method: "PUT",
        body: { sequence },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UpdateTopic"], // Refresh topic data after updating
    }),
    updateTopicStatus: builder.mutation({
      query: ({ topicId, status, access_token }) => ({
        url: `/${topicId}/status`,
        method: "PATCH",
        body: { status },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["UpdateTopic"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;

          // Topic status cascades to linked quizzes/assignments; invalidate their caches globally.
          dispatch(quizApi.util.invalidateTags(["updateQuiz", "Quizzes"]));
          dispatch(
            assignmentApi.util.invalidateTags([
              "CreateAssignment",
              "UpdateAssignment",
            ])
          );
        } catch {
          // no-op: keep existing error handling in components
        }
      },
    }),
  }),
});

export const {
  useCreateTopicMutation,
  useGetTopicsByModuleIdQuery,
  useLazyGetTopicsByModuleIdQuery,
  useGetTopicByIdQuery,
  useUpdateTopicMutation,
  useUpdateTopicSequenceMutation,
  useUpdateTopicStatusMutation,
} = topicApi;
