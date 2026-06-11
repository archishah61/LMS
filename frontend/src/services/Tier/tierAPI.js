import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const tierApi = createApi({
    reducerPath: "tierApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/tiers`,
    }),
    tagTypes: ["Tier"],
    endpoints: (builder) => ({
        // ✅ Create Tier
        createTier: builder.mutation({
            query: ({ data, access_token }) => ({
                url: "/create",
                method: "POST",
                body: data,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["Tier"],
        }),

        // ✅ Get All Tiers with search and pagination
        getAllTiers: builder.query({
            query: ({ search_term = '', sortBy, type, limit = 10, offset = 0, access_token }) => ({
                url: "/all",
                method: "GET",
                params: { search_term, sortBy, type, limit, offset },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ["Tier"],
        }),

        // ✅ Get All Active Tiers
        getAllActiveTiers: builder.query({
            query: () => ({
                url: "/all-active",
                method: "GET",
            }),
            providesTags: ["Tier"],
        }),

        // ✅ Update Tier
        updateTier: builder.mutation({
            query: ({ id, access_token, ...data }) => ({
                url: `/update/${id}`,
                method: "PUT",
                body: data,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["Tier"],
        }),

        // ✅ Toggle Tier Status
        toggleTierStatus: builder.mutation({
            query: ({ id, access_token }) => ({
                url: `/toggle-status/${id}`,
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["Tier"],
        }),

        // ✅ Delete Tier
        deleteTier: builder.mutation({
            query: ({ id, access_token }) => ({
                url: `/delete/${id}`,
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["Tier"],
        }),

        purchaseCourseGenerationTier: builder.mutation({
            query: ({ data, access_token }) => {
                return {
                    url: "/purchase",
                    method: "POST",
                    body: data,
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                };
            },
            invalidatesTags: ["Payments"],
        }),
    }),
});

export const {
    useCreateTierMutation,
    useGetAllTiersQuery,
    useGetAllActiveTiersQuery,
    useUpdateTierMutation,
    useToggleTierStatusMutation,
    useDeleteTierMutation,
    usePurchaseCourseGenerationTierMutation
} = tierApi;
