import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const frontendStatisticsApi = createApi({
    reducerPath: "frontendStatisticsApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/frontend-statistics`,
    }),
    tagTypes: ["FrontendStatistics"],
    endpoints: (builder) => ({
        createStatistic: builder.mutation({
            query: ({ data, access_token }) => ({
                url: "/",
                method: "POST",
                body: data,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["FrontendStatistics"],
        }),

        getAdminStatistics: builder.query({
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
            providesTags: ["FrontendStatistics"],
        }),

        getUserStatistics: builder.query({
            query: () => ({
                url: "/",
                method: "GET",
            }),
            providesTags: ["FrontendStatistics"],
        }),

        updateStatistic: builder.mutation({
            query: ({ id, data, access_token }) => ({
                url: `/${id}`,
                method: "PUT",
                body: data,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["FrontendStatistics"],
        }),

        deleteStatistic: builder.mutation({
            query: ({ id, access_token }) => ({
                url: `/${id}`,
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["FrontendStatistics"],
        }),

        toggleStatisticActive: builder.mutation({
            query: ({ id, access_token }) => ({
                url: `/${id}/toggle`,
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["FrontendStatistics"],
        }),

        updateStatisticSequence: builder.mutation({
            query: ({ sequences, access_token }) => ({
                url: `/sequence/update`,
                method: "PUT",
                body: { sequences },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["FrontendStatistics"],
        }),
    }),
});

export const {
    useCreateStatisticMutation,
    useGetAdminStatisticsQuery,
    useGetUserStatisticsQuery,
    useUpdateStatisticMutation,
    useDeleteStatisticMutation,
    useToggleStatisticActiveMutation,
    useUpdateStatisticSequenceMutation,
} = frontendStatisticsApi;
