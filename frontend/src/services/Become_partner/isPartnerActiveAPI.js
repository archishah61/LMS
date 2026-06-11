import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const partnerActiveApi = createApi({
    reducerPath: "partnerActiveApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/partner-active`, // points to /api/partners/
        credentials: "include", // send cookies
    }),
    tagTypes: ["PartnerActive"],
    endpoints: (builder) => ({
        // ✅ Get partner status by ID
        getPartnerStatusById: builder.query({
            query: ({ id }) => ({
                url: `${id}`,
                method: "GET",
            }),
            providesTags: (result, error, arg) => [{ type: "PartnerActive", id: arg.id }],
        }),

        // ✅ Toggle partner status (Active <-> Inactive)
        togglePartnerStatus: builder.mutation({
            query: ({ id, access_token }) => ({
                url: `${id}/toggle`,
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: (result, error, arg) => [{ type: "PartnerActive", id: arg.id }],
        }),
    }),
});

export const {
    useGetPartnerStatusByIdQuery,
    useTogglePartnerStatusMutation,
} = partnerActiveApi;
