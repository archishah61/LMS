import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const featureStatusApi = createApi({
    reducerPath: "featureStatusApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/feature`, // Base path: /feature
        credentials: "include",
    }),
    tagTypes: ["FeatureStatus"],
    endpoints: (builder) => ({
        // ✅ Get feature status by feature name
        getFeatureStatusByName: builder.query({
            query: ({ name }) => ({
                url: `/${name}`,
                method: "GET",
            }),
            providesTags: (result, error, arg) => [
                { type: "FeatureStatus", id: arg.name }
            ],
        }),

        // ✅ Get feature status by feature name
        getAllFeatureStatus: builder.query({
            query: ({ sortBy, status, access_token }) => ({
                url: `/`,
                method: "GET",
                params: { sortBy, status },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
        }),

        // ✅ Toggle feature status (true <-> false)
        toggleFeatureStatus: builder.mutation({
            query: ({ id, access_token }) => ({
                url: `${id}/toggle`,
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: (result, error, arg) => [
                { type: "FeatureStatus", id: arg.id }
            ],
        }),
    }),
});

export const {
    useGetFeatureStatusByNameQuery,
    useGetAllFeatureStatusQuery,
    useToggleFeatureStatusMutation,
} = featureStatusApi;
