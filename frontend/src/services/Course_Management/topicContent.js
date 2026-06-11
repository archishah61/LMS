/* eslint-disable no-unused-vars */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";
import { assignmentApi } from "../Content_Management/assignmentApi";
import { topicApi } from "./topicApi";
import { quizApi } from "./quizApi";

export const topicContentApi = createApi({
  reducerPath: "topicContentApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/topic-content/`,
  }),
  tagTypes: ["TopicContent"],
  endpoints: (builder) => ({
    // Assign content to a topic
    assignContentToTopic: builder.mutation({
      query: ({ body, access_token }) => ({
        url: "assign",
        method: "POST",
        body,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["TopicContent"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(quizApi.util.invalidateTags(["updateQuiz", "Quizzes"]));
          dispatch(
            assignmentApi.util.invalidateTags([
              "CreateAssignment",
              "UpdateAssignment",
            ])
          );
          dispatch(topicApi.util.invalidateTags(["UpdateTopic", "CreateTopic"]));
        } catch {
          // no-op: mutation errors are handled by callers
        }
      },
    }),

    // Remove content from a topic
    removeContentFromTopic: builder.mutation({
      query: ({ topic_id, body, access_token }) => ({
        url: `remove/${topic_id}`,
        method: "DELETE",
        body,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["TopicContent"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(quizApi.util.invalidateTags(["updateQuiz", "Quizzes"]));
          dispatch(
            assignmentApi.util.invalidateTags([
              "CreateAssignment",
              "UpdateAssignment",
            ])
          );
          dispatch(topicApi.util.invalidateTags(["UpdateTopic", "CreateTopic"]));
        } catch {
          // no-op: mutation errors are handled by callers
        }
      },
    }),

    // Get topic content by topic ID
    getTopicContentByTopicId: builder.query({
      query: ({ topic_id, access_token }) => ({
        url: `topic/${topic_id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["TopicContent"],
    }),

    // Get topic content by module ID
    getTopicContentByModuleId: builder.query({
      query: ({ module_id, access_token }) => ({
        url: `module/${module_id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["TopicContent"],
    }),
  }),
});

export const {
  useAssignContentToTopicMutation,
  useRemoveContentFromTopicMutation,
  useGetTopicContentByTopicIdQuery,
  useGetTopicContentByModuleIdQuery,
} = topicContentApi;
