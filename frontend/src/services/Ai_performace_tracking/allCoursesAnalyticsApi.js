import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const allCoursesAnalyticsApi = createApi({
    reducerPath: "allCoursesAnalyticsApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/course-analytics`,
    }),
    endpoints: (builder) => ({
        // Single Course Analytics
        getCourseEnrollmentAnalytics: builder.query({
            query: ({ courseId, access_token }) => ({
                url: `/course-performance/${courseId}`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
        }),
        getCourseModuleAnalytics: builder.query({
            query: ({ courseId, access_token }) => ({
                url: `/course-performance/${courseId}/module-analytics`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
        }),
        getCourseTopicStrengthAnalytics: builder.query({
            query: ({ courseId, access_token }) => ({
                url: `/course-performance/${courseId}/topic-strength`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
        }),
        getCourseErrorAnalyticsAverage: builder.query({
            query: ({ courseId, access_token }) => ({
                url: `/course-performance/${courseId}/error-analytics-avg`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
        }),

        // All Courses Analytics
        getAllCoursesModuleAnalytics: builder.query({
            query: (access_token) => ({
                url: `/all-course-performance/module-analytics`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
        }),
        getAllCoursesTopicStrengthAnalytics: builder.query({
            query: (access_token) => ({
                url: `/all-course-performance/topic-strength`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
        }),
        getAllCoursesErrorAnalyticsAverage: builder.query({
            query: (access_token) => ({
                url: `/all-course-performance/error-analytics-avg`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
        }),
    }),
});

export const {
    useGetCourseEnrollmentAnalyticsQuery,
    useGetCourseModuleAnalyticsQuery,
    useGetCourseTopicStrengthAnalyticsQuery,
    useGetCourseErrorAnalyticsAverageQuery,
    useGetAllCoursesModuleAnalyticsQuery,
    useGetAllCoursesTopicStrengthAnalyticsQuery,
    useGetAllCoursesErrorAnalyticsAverageQuery,
} = allCoursesAnalyticsApi;
