import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const frontendFaqApi = createApi({
    reducerPath: "frontendFaqApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/frontend-faqs`,
    }),
    tagTypes: ["FrontendFaq"],
    endpoints: (builder) => ({
        createFaq: builder.mutation({
            query: ({ data, access_token }) => ({
                url: "/",
                method: "POST",
                body: data,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["FrontendFaq"],
        }),

        getAdminFaqs: builder.query({
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
            providesTags: ["FrontendFaq"],
        }),

        getUserFaqs: builder.query({
            query: () => ({
                url: "/",
                method: "GET",
            }),
            providesTags: ["FrontendFaq"],
        }),

        updateFaq: builder.mutation({
            query: ({ id, data, access_token }) => ({
                url: `/${id}`,
                method: "PUT",
                body: data,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["FrontendFaq"],
        }),

        deleteFaq: builder.mutation({
            query: ({ id, access_token }) => ({
                url: `/${id}`,
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["FrontendFaq"],
        }),

        toggleFaqActive: builder.mutation({
            query: ({ id, access_token }) => ({
                url: `/${id}/toggle`,
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["FrontendFaq"],
        }),

        updateFaqSequence: builder.mutation({
            query: ({ sequences, access_token }) => ({
                url: `/sequence/update`,
                method: "PUT",
                body: { sequences },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["FrontendFaq"],
        }),
    }),
});

export const {
    useCreateFaqMutation,
    useGetAdminFaqsQuery,
    useGetUserFaqsQuery,
    useUpdateFaqMutation,
    useDeleteFaqMutation,
    useToggleFaqActiveMutation,
    useUpdateFaqSequenceMutation,
} = frontendFaqApi;
