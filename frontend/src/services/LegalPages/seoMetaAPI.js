import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const seoMetaApi = createApi({
    reducerPath: "seoMetaApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/seo-meta`,
    }),
    tagTypes: ["SeoMeta"],
    endpoints: (builder) => ({

        /* ───────────────────────────
           CREATE or UPDATE SEO META
           send id = 0 → create
           send id > 0 → update
        ─────────────────────────── */
        saveSeoMeta: builder.mutation({
            query: ({ data, access_token }) => ({
                url: "/save",
                method: "POST",
                body: data,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["SeoMeta"],
        }),

        /* ───────────────────────────
            GET BY PAGE TYPE
        ─────────────────────────── */
        getSeoMetaByPageType: builder.query({
            query: ({ page_type }) => ({
                url: `/by-page-type/${page_type}`,
                method: "GET",
            }),
            providesTags: ["SeoMeta"],
        }),

        /* ───────────────────────────
            TOGGLE STATUS
        ─────────────────────────── */
        toggleSeoMetaStatus: builder.mutation({
            query: ({ id, access_token }) => ({
                url: `/toggle-status/${id}`,
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["SeoMeta"],
        }),
    }),
});

export const {
    useSaveSeoMetaMutation,
    useGetSeoMetaByPageTypeQuery,
    useToggleSeoMetaStatusMutation,
} = seoMetaApi;
