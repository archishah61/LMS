import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define the API service for Subscribe
export const subscribeApi = createApi({
    reducerPath: "subscribeApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/subscribe`,
    }),
    tagTypes: ["Subscribe"],
    endpoints: (builder) => ({
        // Create a new subscription
        createSubscription: builder.mutation({
            query: (emailData) => ({
                url: "/create",
                method: "POST",
                body: emailData,
            }),
            invalidatesTags: ["Subscribe"],
        }),

        // Get all subscriptions
        getAllSubscriptions: builder.query({
            query: ({ search_term = '', status, limit = 10, offset = 0, access_token }) => ({
                url: "/",
                method: "GET",
                params: { search_term, status, limit, offset },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ["Subscribe"],
        }),
        updateStatusSubscribe: builder.mutation({
            query: ({ id, access_token }) => ({
                url: `/status/${id}`,
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ['Subscribe']
        }),
    }),
});

// Export hooks
export const {
    useCreateSubscriptionMutation,
    useGetAllSubscriptionsQuery,
    useUpdateStatusSubscribeMutation,
    useLazyGetAllSubscriptionsQuery,
} = subscribeApi;
