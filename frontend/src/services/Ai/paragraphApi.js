import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const paragraphApi = createApi({
    reducerPath: "paragraphApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/ai-paragraph`,
    }),
    tagTypes: ['Paragraph'],
    endpoints: (builder) => ({
        generateParagraph: builder.mutation({
            query: ({ difficulty, access_token }) => ({
                url: '/generate',
                method: 'POST',
                body: { difficulty },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ['Paragraph'],
        }),
        analyzePerformance: builder.mutation({
            query: ({ metrics, access_token, sessionId }) => ({
                url: '/analyze',
                method: 'POST',
                body: { ...metrics, sessionId },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
        }),
        saveParagraphPractice: builder.mutation({
            query: ({ sessionData, access_token }) => ({
                url: '/save',
                method: 'POST',
                body: sessionData,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ['Paragraph'],
        }),
        getParagraphHistory: builder.query({
            query: (access_token) => ({
                url: '/history',
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ['Paragraph'],
        }),
    }),
});

export const {
    useGenerateParagraphMutation,
    useAnalyzePerformanceMutation,
    useSaveParagraphPracticeMutation,
    useGetParagraphHistoryQuery,
} = paragraphApi;

