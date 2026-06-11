import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define a service using a base URL and expected endpoints
export const performanceTrackingApi = createApi({
    reducerPath: "performanceTrackingApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/student-performance-tracking/`
    }),    endpoints: (builder) => ({
        // Generate feedback/get performance data
        // Using a mutation is more appropriate as this creates/updates data
        generateFeedback: builder.mutation({
            query: ({ userId, moduleId, access_token }) => ({
                url: `/topic-skill/${userId}/${moduleId}`,
                method: 'GET',
                headers: { Authorization: `Bearer ${access_token}` },
            }),
            invalidatesTags: ["CreateCourse", "UpdateCourse", "Feedback"]
        }),
    }),
});

export const {
    useGenerateFeedbackMutation,
} = performanceTrackingApi;