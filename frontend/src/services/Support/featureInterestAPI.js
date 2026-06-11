import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const featureInterestApi = createApi({
    reducerPath: "featureInterestApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/feature-interest`,
        credentials: "include",
    }),
    tagTypes: ["FeatureInterest"],
    endpoints: (builder) => ({
        // ✅ Create Feature Interest
        createFeatureInterest: builder.mutation({
            query: (data) => ({
                url: `/create`,
                method: "POST",
                body: data
            }),
            invalidatesTags: ["FeatureInterest"],
        }),

        // ✅ Get All Feature Interests (with pagination & search)
        getAllFeatureInterests: builder.query({
            query: ({
                search_term = "",
                feature_filter = "all",
                limit = 10,
                offset = 0,
                access_token
            }) => ({
                url: `/all`,
                method: "GET",
                params: {
                    search_term,
                    feature_filter,
                    limit,
                    offset
                },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ["FeatureInterest"],
        }),
        // ✅ Delete a Feature Interest
        deleteFeatureInterest: builder.mutation({
            query: ({ id, access_token }) => ({
                url: `/delete/${id}`,
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["FeatureInterest"],
        }),
    }),
});

export const {
    useCreateFeatureInterestMutation,
    useGetAllFeatureInterestsQuery,
    useDeleteFeatureInterestMutation,
} = featureInterestApi;
