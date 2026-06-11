/* eslint-disable no-unused-vars */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { courseProgressRootApi } from "../RootApi/courseProgressRootApi";

// Define the API service for predefined options
export const progressTrackingApi = courseProgressRootApi.injectEndpoints({
  // reducerPath: "progressTrackingApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Progress"],
  endpoints: (builder) => ({
    checkTopicCompletion: builder.query({
      query: ({ userId, topicId }) => ({
        url: `/progress/check-topic-completion`,
        method: "GET",
        params: { userId, topicId },
      }),
    }),
    checkSlideCompletion: builder.query({
      query: ({ userId, topicId }) => ({
        url: `/progress/check-slide-completion`,
        method: "GET",
        params: { userId, topicId },
      }),
    }),
    checkModuleCompletion: builder.query({
      query: ({ userId, moduleId }) => ({
        url: `/progress/check-module-completion`,
        method: "GET",
        params: { userId, moduleId },
      }),
    }),
    getAccessibleModules: builder.query({
      query: ({ userId, courseId }) => ({
        url: `/progress/get-accessible-modules`,
        method: "GET",
        params: { userId, courseId },
      }),
    }),
    handleTopicCompletion: builder.mutation({
      query: ({ userId, topicId, slideId, courseId }) => ({
        url: `/progress/complete-content`,
        method: "POST",
        body: { userId, topicId, slideId },
      }),
      invalidatesTags: (result, error, arg) =>
        arg?.userId && arg?.courseId
          ? [
            {
              type: "CheckCourseCompletion",
              id: `${arg.userId}-${arg.courseId}`,
            },
          ]
          : [],
    }),
    handleTopicSlideCompletion: builder.mutation({
      query: ({ userId, topicId, slideId }) => ({
        url: `/progress/complete-topic-slide`,
        method: "POST",
        body: { userId, topicId, slideId },
      }),
    }),
    checkCourseCompletion: builder.query({
      query: ({ userId, courseId }) => ({
        url: `/progress/check-course-completion`,
        method: "GET",
        params: { userId, courseId },
      }),
      providesTags: (result, error, arg) =>
        arg?.userId && arg?.courseId
          ? [
            {
              type: "CheckCourseCompletion",
              id: `${arg.userId}-${arg.courseId}`,
            },
          ]
          : [],
    }),
    getBasicAccessibleTopics: builder.query({
      query: ({ userId, moduleId }) => ({
        url: `/progress/getBasicAccessibleTopics/${userId}/${moduleId}`,
        method: "GET",
      }),
      providesTags: ["Progress"],
    }),
    getDetailedTopicInfo: builder.query({
      query: ({ userId, topicId }) => ({
        url: `/progress/getDetailedTopicInfo/${userId}/${topicId}`,
        method: "GET",
      }),
      providesTags: ["Progress"],
    }),
    getTopicSlides: builder.query({
      query: (topicId) => ({
        url: `/progress/topic/${topicId}/slides`,
        method: "GET",
      }),
    }),
    getSlideContent: builder.query({
      query: (slideId) => ({
        url: `/progress/slide/${slideId}/content`,
        method: "GET",
      }),
    }),
    updateTopicTimeSpent: builder.mutation({
      query: ({ userId, topicId, timeSpent }) => ({
        url: `/progress/update-topic-time-spent`,
        method: "POST",
        body: { userId, topicId, timeSpent },
      }),
    }),
    getStudentTopicDetails: builder.query({
      query: ({ moduleId, topicIds }) => ({
        url: `/progress/topicDetail`,
        method: "POST",
        body: { moduleId, topicIds }
      }),
    }),
    getQuizzesIdByModuleId: builder.query({
      query: (moduleId) => ({
        url: `/progress/quizzesId/${moduleId}`,
        method: "GET",
      }),
    }),
    getAssignmentIdByModuleId: builder.query({
      query: (moduleId) => ({
        url: `/progress/assignmentId/${moduleId}`,
        method: "GET",
      }),
    }),
  }),
  overrideExisting: false,
});

// Export hooks for usage in components
export const {
  useLazyCheckTopicCompletionQuery,
  useLazyCheckSlideCompletionQuery,
  useLazyCheckModuleCompletionQuery,
  useGetAccessibleModulesQuery,
  useHandleTopicCompletionMutation,
  useHandleTopicSlideCompletionMutation,
  useCheckCourseCompletionQuery,
  useGetBasicAccessibleTopicsQuery,
  useGetDetailedTopicInfoQuery,
  useGetTopicSlidesQuery,
  useGetSlideContentQuery,
  useUpdateTopicTimeSpentMutation,
  useLazyGetStudentTopicDetailsQuery,
  useLazyGetQuizzesIdByModuleIdQuery,
  useLazyGetAssignmentIdByModuleIdQuery,
} = progressTrackingApi;
