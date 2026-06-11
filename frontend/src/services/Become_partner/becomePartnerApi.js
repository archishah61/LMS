import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define a service using a base URL and expected endpoints
export const partnerApi = createApi({
    reducerPath: "partnerApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/partners/`,
        credentials: "include", // Ensure cookies are sent with requests
    }),
    tagTypes: ["Partner"],
    endpoints: (builder) => ({
        registerPartner: builder.mutation({
            query: ({ formData, access_token }) => {
                return {
                    url: "create",
                    method: "POST",
                    body: formData,
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                };
            },
            invalidatesTags: ["Partner"],
        }),
        getPartners: builder.query({
            query: ({ search_term = '', limit = 10, offset = 0, status, partner_type, access_token }) => {
                return {
                    url: "",
                    method: "GET",
                    params: { search_term, limit, offset, status, partner_type },
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                };
            },
            providesTags: ["Partner"],
        }),
        getPartnerById: builder.query({
            query: ({ id, access_token }) => {
                return {
                    url: `/${id}`,
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                };
            },
            providesTags: ["Partner"],
        }),
        updatePartner: builder.mutation({
            query: ({ id, formData, access_token }) => ({
                url: `update/${id}`,
                method: "PUT",
                body: formData,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["Partner"],
        }),
        updatePartnerStatus: builder.mutation({
            query: ({ partnerId, status, access_token }) => ({
                url: `/update-status/${partnerId}`,
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
                body: { status },
            }),
            invalidatesTags: ["Partner"],
        }),
        loginPartner: builder.mutation({
            query: ({ email, password }) => ({
                url: "login",
                method: "POST",
                body: { email, password },
                credentials: "include", // Ensures cookies are sent with the request
            }),
        }),
        logoutPartner: builder.mutation({
            query: () => ({
                url: "logout",
                method: "POST",
                credentials: "include", // Ensures cookies are included
            }),
        }),
        updatePassword: builder.mutation({
            query: ({ partnerId, password, access_token }) => ({
                url: `/update-password/${partnerId}`,
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
                body: { password },
            }),
            invalidatesTags: ["Partner"],
        }),
        forgotPassword: builder.mutation({
            query: ({ email, password, access_token }) => ({
                url: `/forgot-password/`,
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
                body: { email, password },
            }),
            invalidatesTags: ["Partner"],
        }),
    }),
});

export const {
    useRegisterPartnerMutation,
    useGetPartnersQuery,
    useGetPartnerByIdQuery,
    useUpdatePartnerMutation,
    useUpdatePartnerStatusMutation,
    useLoginPartnerMutation,
    useLogoutPartnerMutation,
    useUpdatePasswordMutation,
    useForgotPasswordMutation
} = partnerApi;