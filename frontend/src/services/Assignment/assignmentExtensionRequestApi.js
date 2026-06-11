/* eslint-disable no-unused-vars */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const assignmentExtensionRequestApi = createApi({
    reducerPath: "assignmentExtensionRequestApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/extension/`, // 👈 base path for extension API
    }),
    tagTypes: ["ExtensionRequest"],
    endpoints: (builder) => ({

        // 1. Student - Create request
        createExtensionRequest: builder.mutation({
            query: ({ requestData, access_token }) => ({
                url: "request",
                method: "POST",
                body: requestData,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["ExtensionRequest"],
        }),

        // 2. Student - Get my requests
        getMyExtensionRequests: builder.query({
            query: ({ access_token }) => ({
                url: "my-requests",
                method: "GET",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ["ExtensionRequest"],
        }),

        // 3. Admin - Fetch all requests
        getAllExtensionRequests: builder.query({
            query: ({ limit = "10", offset = "0", search_term, status, access_token }) => ({
                url: "requests",
                method: "GET",
                params: { search_term, status, limit, offset },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ["ExtensionRequest"],
        }),

        // 4. Admin - Approve/Reject request
        handleExtensionRequest: builder.mutation({
            query: ({ requestId, actionData, access_token }) => ({
                url: `request/${requestId}`,
                method: "PUT",
                body: actionData,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["ExtensionRequest"],
        }),
    }),
});

export const {
    useCreateExtensionRequestMutation,
    useGetMyExtensionRequestsQuery,
    useGetAllExtensionRequestsQuery,
    useHandleExtensionRequestMutation,
} = assignmentExtensionRequestApi;
