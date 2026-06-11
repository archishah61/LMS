import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const frontendFeaturesApi = createApi({
    reducerPath: "frontendFeaturesApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/frontend-features`,
    }),
    tagTypes: ["FrontendFeatures"],
    endpoints: (builder) => ({
        createFeature: builder.mutation({
            query: ({ data, access_token }) => ({
                url: "/",
                method: "POST",
                body: data,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["FrontendFeatures"],
        }),

        getAdminFeatures: builder.query({
            query: ({ access_token, is_active }) => {
                let url = "/admin";
                if (is_active !== undefined && is_active !== "") {
                    url += `?is_active=${is_active}`;
                }
                return {
                    url,
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                };
            },
            providesTags: ["FrontendFeatures"],
        }),

        getUserFeatures: builder.query({
            query: () => ({
                url: "/",
                method: "GET",
            }),
            providesTags: ["FrontendFeatures"],
        }),

        updateFeature: builder.mutation({
            query: ({ id, data, access_token }) => ({
                url: `/${id}`,
                method: "PUT",
                body: data,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["FrontendFeatures"],
        }),

        deleteFeature: builder.mutation({
            query: ({ id, access_token }) => ({
                url: `/${id}`,
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["FrontendFeatures"],
        }),

        toggleFeatureActive: builder.mutation({
            query: ({ id, access_token }) => ({
                url: `/${id}/toggle`,
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["FrontendFeatures"],
        }),

        updateFeatureSequence: builder.mutation({
            query: ({ sequences, access_token }) => ({
                url: `/sequence/update`,
                method: "PUT",
                body: { sequences },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["FrontendFeatures"],
        }),
    }),
});

export const {
    useCreateFeatureMutation,
    useGetAdminFeaturesQuery,
    useGetUserFeaturesQuery,
    useUpdateFeatureMutation,
    useDeleteFeatureMutation,
    useToggleFeatureActiveMutation,
    useUpdateFeatureSequenceMutation,
} = frontendFeaturesApi;
