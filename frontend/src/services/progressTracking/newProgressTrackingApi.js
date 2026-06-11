import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const newProgressTrackingApi = createApi({
    reducerPath: 'progressTrackingApi',
    baseQuery: fetchBaseQuery({ baseUrl: `${import.meta.env.VITE_BACKEND_URL}` }),
    tagTypes: ['ProgressTracking'],
    endpoints: (builder) => ({
        // Get accessible sessions for a course
        getAccessibleSessions: builder.query({
            query: ({ userId, courseId, access_token }) => ({
                url: '/newProgress/sessions/accessible',
                params: { userId, courseId },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),

            providesTags: ['ProgressTracking']
        }),

        // Get accessible modules for a session
        getAccessibleModules: builder.query({
            query: ({ userId, courseId, sessionId, access_token }) => ({
                url: '/newProgress/modules/accessible',
                params: { userId, courseId, sessionId },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ['ProgressTracking']
        }),

        // Get accessible topics for a module
        getAccessibleTopics: builder.query({
            query: ({ userId, courseId, moduleId, access_token }) => ({
                url: '/newProgress/topics/accessible',
                params: { userId, courseId, moduleId },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ['ProgressTracking']
        }),

        // Get accessible quizzes for a module
        getAccessibleQuizzes: builder.query({
            query: ({ userId, courseId, moduleId, access_token }) => ({
                url: '/newProgress/quizzes/accessible',
                params: { userId, courseId, moduleId },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ['ProgressTracking']
        }),

        // Get accessible assignments for a module
        getAccessibleAssignments: builder.query({
            query: ({ userId, courseId, moduleId, access_token }) => ({
                url: '/newProgress/assignments/accessible',
                params: { userId, courseId, moduleId },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ['ProgressTracking']
        }),

        // Mark topic as completed
        markTopicCompleted: builder.mutation({
            query: ({ userId, courseId, topicId, access_token }) => ({
                url: '/newProgress/topics/complete',
                method: 'POST',
                params: { userId, courseId, topicId },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },

            }),
            invalidatesTags: ['ProgressTracking']
        }),

        // Get topic type by ID
        getTopicTypeById: builder.query({
            query: ({ topicId, access_token }) => ({
                url: '/newProgress/topics/type',
                params: { topicId },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ['ProgressTracking']
        }),

        // Get detailed topic by ID
        getDetailedTopicById: builder.query({
            query: ({ topicId, access_token }) => ({
                url: '/newProgress/topics/details',
                params: { topicId },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ['ProgressTracking']
        }),

        // Get slide IDs and titles by topic ID
        getSlideIdAndTitleByTopicId: builder.query({
            query: ({ topicId, access_token }) => ({
                url: '/newProgress/topics/slides',
                params: { topicId },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ['ProgressTracking']
        }),

        // Get slide content by slide ID
        getSlideContentBySlideId: builder.query({
            query: ({ slideId, access_token }) => ({
                url: '/newProgress/topics/slide-content',
                params: { slideId },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ['ProgressTracking']
        }),

        // Track student time spent on topic
        trackStudentTimeSpentOnTopic: builder.mutation({
            query: ({ userId, courseId, sessionId, moduleId, topicId, accordianId, slideId, timeSpent, timer_time, access_token, completion_status, include_in_first_completion, finalize_first_completion }) => ({
                url: '/newProgress/track-time',
                method: 'POST',
                body: {
                    user_id: userId,
                    course_id: courseId,
                    session_id: sessionId,
                    module_id: moduleId,
                    topic_id: topicId,
                    accordian_id: accordianId,
                    slide_id: slideId,
                    time_spent: timeSpent,
                    timer_time: timer_time,
                    completion_status: completion_status,
                    include_in_first_completion,
                    finalize_first_completion,
                },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                },
            }),
            invalidatesTags: ['ProgressTracking']
        }),

        // New endpoints for accordian status
        createAccordianProgressRecordsForTopic: builder.mutation({
            query: ({ userId, courseId, sessionId, moduleId, topicId, accordianId, slideId, timeSpent, timer_time, access_token, completion_status }) => ({
                url: '/newProgress/create-accordian-status',
                method: 'POST',
                body: {
                    user_id: userId,
                    course_id: courseId,
                    session_id: sessionId,
                    module_id: moduleId,
                    topic_id: topicId,
                    accordian_id: accordianId,
                    slide_id: slideId,
                    time_spent: timeSpent,
                    timer_time: timer_time,
                    completion_status: completion_status,
                },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                },
            }),
            invalidatesTags: ['ProgressTracking']
        }),

        getAccordianStatusByTopicId: builder.query({
            query: ({ userId, topicId, access_token }) => ({
                url: '/newProgress/accordian-status',
                params: { topicId, userId },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ['ProgressTracking']
        }),

        updateAccrodianCompletionStatus: builder.mutation({
            query: ({ userId, topicId, accordianId, completionStatus, access_token }) => ({
                url: '/newProgress/update-accordian-status',
                method: 'POST',
                body: {
                    user_id: userId,
                    topic_id: topicId,
                    accordian_id: accordianId,
                    completion_status: completionStatus,
                },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                },
            }),
            invalidatesTags: ['ProgressTracking']
        }),

        createSlideProgressRecordsForTopic: builder.mutation({
            query: ({ userId, courseId, sessionId, moduleId, topicId, slideId, timeSpent, timer_time, access_token, completion_status }) => ({
                url: '/newProgress/create-slide-status',
                method: 'POST',
                body: {
                    user_id: userId,
                    course_id: courseId,
                    session_id: sessionId,
                    module_id: moduleId,
                    topic_id: topicId,
                    slide_id: slideId,
                    time_spent: timeSpent,
                    timer_time: timer_time,
                    completion_status: completion_status,
                },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                },
            }),
            invalidatesTags: ['ProgressTracking']
        }),

        getSlideStatusByTopicId: builder.query({
            query: ({ userId, topicId, access_token }) => ({
                url: '/newProgress/slide-status',
                params: { topicId, userId },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ['ProgressTracking']
        }),

        updateSlideCompletionStatus: builder.mutation({
            query: ({ userId, topicId, slideId, completionStatus, access_token }) => ({
                url: '/newProgress/update-slide-status',
                method: 'POST',
                body: {
                    user_id: userId,
                    topic_id: topicId,
                    slide_id: slideId,
                    completion_status: completionStatus,
                },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                },
            }),
            invalidatesTags: ['ProgressTracking']
        }),

        getCourseCompletionProgress: builder.query({
            query: ({ userId, courseId }) => ({
                url: '/newProgress/course-progress',
                params: { userId, courseId },
            }),
            providesTags: ['ProgressTracking']
        }),

        getCourseFullDetails: builder.query({
            query: ({ userId, courseId }) => ({
                url: 'newProgress/course-full-details',
                params: { userId, courseId },
            }),
            providesTags: ['ProgressTracking']
        })
    })
});

export const {
    useGetAccessibleSessionsQuery,
    useGetAccessibleModulesQuery,
    useGetAccessibleTopicsQuery,
    useGetAccessibleQuizzesQuery,
    useGetAccessibleAssignmentsQuery,
    useMarkTopicCompletedMutation,
    useGetTopicTypeByIdQuery,
    useGetDetailedTopicByIdQuery,
    useGetSlideIdAndTitleByTopicIdQuery,
    useGetSlideContentBySlideIdQuery,
    useTrackStudentTimeSpentOnTopicMutation,
    useCreateAccordianProgressRecordsForTopicMutation,
    useGetAccordianStatusByTopicIdQuery,
    useUpdateAccrodianCompletionStatusMutation,
    useCreateSlideProgressRecordsForTopicMutation,
    useGetSlideStatusByTopicIdQuery,
    useUpdateSlideCompletionStatusMutation,
    useGetCourseCompletionProgressQuery,
    useGetCourseFullDetailsQuery
} = newProgressTrackingApi;