import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// API for Import Course → Sessions → Modules → Topics
export const importContentApi = createApi({
    reducerPath: "importContentApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/import-content`,
    }),
    tagTypes: ["ImportContent"],
    endpoints: (builder) => ({

        // ============================
        // 1️⃣ Get All Courses
        // ============================
        importAllCourses: builder.query({
            query: ({ access_token, searchQuery }) => ({
                url: "/courses",
                method: "GET",
                params: { searchQuery },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ["ImportContent"],
        }),

        // ============================
        // 2️⃣ Get Sessions by Course ID
        // ============================
        importSessionsByCourseId: builder.query({
            query: ({ courseId, searchQuery, access_token }) => ({
                url: `/sessions/${courseId}`,
                method: "GET",
                params: { searchQuery },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ["ImportContent"],
        }),

        // ============================
        // 3️⃣ Get Modules by Session ID
        // ============================
        importModulesBySessionId: builder.query({
            query: ({ sessionId, searchQuery, access_token }) => ({
                url: `/modules/${sessionId}`,
                method: "GET",
                params: { searchQuery },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ["ImportContent"],
        }),

        // ============================
        // 4️⃣ Get Topics by Module ID
        // ============================
        importTopicsByModuleId: builder.query({
            query: ({ moduleId, searchQuery, access_token }) => ({
                url: `/topics/${moduleId}`,
                method: "GET",
                params: { searchQuery },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ["ImportContent"],
        }),

        importSelectedSessions: builder.mutation({
            query: ({ courseId, sessionIds, access_token }) => ({
                url: `/sessions`,
                method: "POST",
                body: { courseId, sessionIds },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["ImportContent"],
        }),

        importSelectedModules: builder.mutation({
            query: ({ sessionId, moduleIds, access_token }) => ({
                url: `/modules`,
                method: "POST",
                body: { sessionId, moduleIds },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["ImportContent"],
        }),

        importSelectedTopics: builder.mutation({
            query: ({ moduleId, topicIds, access_token }) => ({
                url: `/topics`,
                method: "POST",
                body: { moduleId, topicIds },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["ImportContent"],
        }),

    }),
});

// Export hooks
export const {
    useImportAllCoursesQuery,
    useImportSessionsByCourseIdQuery,
    useImportModulesBySessionIdQuery,
    useImportTopicsByModuleIdQuery,
    useLazyImportSessionsByCourseIdQuery,
    useLazyImportModulesBySessionIdQuery,
    useLazyImportTopicsByModuleIdQuery,
    useImportSelectedSessionsMutation,
    useImportSelectedModulesMutation,
    useImportSelectedTopicsMutation,
} = importContentApi;
