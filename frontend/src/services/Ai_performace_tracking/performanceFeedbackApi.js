import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const performanceFeedbackApi = createApi({
    reducerPath: 'performanceFeedbackApi',    
    baseQuery: fetchBaseQuery({ 
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}`
    }),
    tagTypes: ['Feedback'],
    endpoints: (builder) => ({
        // Get all feedback for a user
        getUserFeedback: builder.query({
            query: ({ userId, access_token }) => ({
                url: `/performance-feedback/user-feedback/${userId}`,
                headers: { Authorization: `Bearer ${access_token}` },
            }),
            providesTags: ['Feedback']
        }),
        
        // Get specific feedback by ID
        getFeedbackById: builder.query({
            query: ({ feedbackId, access_token }) => ({
                url: `/performance-feedback/feedback/${feedbackId}`,
                headers: { Authorization: `Bearer ${access_token}` },
            }),
            providesTags: ['Feedback']
        }),
          // Get feedback history for a specific module
        getModuleFeedbackHistory: builder.query({
            query: ({ userId, moduleId, access_token }) => ({
                url: `/performance-feedback/feedback-history/${userId}/${moduleId}`,
                headers: { Authorization: `Bearer ${access_token}` },
            }),
            providesTags: ['Feedback']
        }),
        
        // Delete feedback
        deleteFeedback: builder.mutation({
            query: ({ feedbackId, access_token }) => ({
                url: `/performance-feedback/feedback/${feedbackId}`,
                method: 'DELETE',
                headers: { Authorization: `Bearer ${access_token}` },
            }),
            invalidatesTags: ['Feedback']
        }),
    }),
});

export const { 
    useGetUserFeedbackQuery,
    useGetFeedbackByIdQuery,
    useGetModuleFeedbackHistoryQuery,
    useDeleteFeedbackMutation
} = performanceFeedbackApi;
