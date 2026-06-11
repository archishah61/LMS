import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define a service using a base URL and expected endpoints
export const promoCodeApi = createApi({
    reducerPath: "promoCodeApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/promo-codes/`,
    }),
    tagTypes: ["PromoCode"],
    endpoints: (builder) => ({
        // Generate promo codes for multiple courses for a single user
        generatePromoCodes: builder.mutation({
            query: ({ course_ids, user_ids, access_token }) => ({
                url: "generate/",
                method: "POST",
                body: { course_ids, user_ids },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["PromoCode"],
        }),

        getAllBatches: builder.query({
            query: ({ limit = 10, offset = 0, searchTerm, dateFrom, dateTo, access_token }) => ({
                url: "batches/",     // <-- endpoint: /promo-codes/batches
                method: "GET",
                params: { limit, offset, searchTerm, dateFrom, dateTo },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ["PromoCode"],
        }),

        getUsersByBatchId: builder.mutation({
            query: ({ batchId, access_token }) => ({
                url: "batches/users/",
                method: "POST",
                body: { batchId },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
        }),

        verifyPromoCode: builder.mutation({
            query: ({ user_id, course_id, code, access_token }) => ({
                url: "verify/",
                method: "POST",
                body: { user_id, course_id, code },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
        }),

        checkIsPromoCodeVerified: builder.mutation({
            query: ({ userId, courseId, access_token }) => ({
                url: "check-verified/",
                method: "POST",
                body: { userId, courseId },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
        }),

    }),
});

// Export hooks for usage in components
export const {
    useGeneratePromoCodesMutation,
    useGetAllBatchesQuery,
    useGetUsersByBatchIdMutation,
    useVerifyPromoCodeMutation,
    useCheckIsPromoCodeVerifiedMutation
} = promoCodeApi;
