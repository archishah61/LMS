import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const courseGenerationHistoryApi = createApi({
    reducerPath: "courseGenerationHistoryApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/course-generate-history`,
    }),
    tagTypes: ["CourseGenerationHistory"],
    endpoints: (builder) => ({
        // ✅ Get All Course Generation History by User (excluding structure)
        getUserCourseGenerationHistory: builder.query({
            query: ({ access_token }) => ({
                url: "/",
                method: "GET",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ["CourseGenerationHistory"],
        }),

        // ✅ Get Course Generation History by ID (including structure)
        getCourseGenerationHistoryById: builder.query({
            query: ({ id, access_token }) => ({
                url: `/${id}`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ["CourseGenerationHistory"],
        }),
    }),
});

export const {
    useGetUserCourseGenerationHistoryQuery,
    useGetCourseGenerationHistoryByIdQuery,
    useLazyGetCourseGenerationHistoryByIdQuery
} = courseGenerationHistoryApi;
