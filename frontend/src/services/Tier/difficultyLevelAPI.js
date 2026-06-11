import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const difficultyLevelApi = createApi({
    reducerPath: "difficultyLevelApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/difficulty-levels`,
    }),
    tagTypes: ["DifficultyLevel"],
    endpoints: (builder) => ({
        // ✅ Create Difficulty Level
        createDifficultyLevel: builder.mutation({
            query: ({ data, access_token }) => ({
                url: "/create",
                method: "POST",
                body: data,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["DifficultyLevel"],
        }),

        // ✅ Get All Difficulty Levels with search and pagination
        getAllDifficultyLevels: builder.query({
            query: ({ search_term = '', limit = 'ALL', offset = 0, access_token }) => ({
                url: "/all",
                method: "GET",
                params: { search_term, limit, offset },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ["DifficultyLevel"],
        }),

        // ✅ Get All Active Difficulty Levels
        getAllActiveDifficultyLevels: builder.query({
            query: () => ({
                url: "/all-active",
                method: "GET",
            }),
            providesTags: ["DifficultyLevel"],
        }),

        // ✅ Update Difficulty Level
        updateDifficultyLevel: builder.mutation({
            query: ({ id, access_token, ...data }) => ({
                url: `/update/${id}`,
                method: "PUT",
                body: data,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["DifficultyLevel"],
        }),

        // ✅ Toggle Difficulty Level Status
        toggleDifficultyLevelStatus: builder.mutation({
            query: ({ id, access_token }) => ({
                url: `/toggle-status/${id}`,
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["DifficultyLevel"],
        }),

        // ✅ Delete Difficulty Level
        deleteDifficultyLevel: builder.mutation({
            query: ({ id, access_token }) => ({
                url: `/delete/${id}`,
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["DifficultyLevel"],
        }),

        // ✅ Get Tiers by Difficulty Level
        getTiersByDifficultyLevel: builder.query({
            query: ({ id, access_token }) => ({
                url: `/${id}/tiers`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ["DifficultyLevel"],
        }),
    }),
});

export const {
    useCreateDifficultyLevelMutation,
    useGetAllDifficultyLevelsQuery,
    useGetAllActiveDifficultyLevelsQuery,
    useUpdateDifficultyLevelMutation,
    useToggleDifficultyLevelStatusMutation,
    useDeleteDifficultyLevelMutation,
    useGetTiersByDifficultyLevelQuery,
} = difficultyLevelApi;
