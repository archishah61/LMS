import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define a service using a base URL and expected endpoints
export const coursePerformanceTrackingApi = createApi({
    reducerPath: "coursePerformanceTrackingApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/student-course-performance-tracking`,
    }),
    endpoints: (builder) => ({
        getCoursePerformanceTracking: builder.query({
            query: ({ userId, courseId, access_token }) => {
                return {
                    url: `/course-performance/${userId}/${courseId}`,
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                };
            },
            providesTags: ["CreateCourse", "UpdateCourse"],
        }),

    }),
});

export const {
    useGetCoursePerformanceTrackingQuery,
} = coursePerformanceTrackingApi;