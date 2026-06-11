import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const footerSettingApi = createApi({
    reducerPath: "footerSettingApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/footer-settings/`,
    }),
    tagTypes: ["FooterSetting"],
    endpoints: (builder) => ({
        // Get all footer settings
        getFooterSettings: builder.query({
            query: () => ({
                url: "",
                method: "GET",
            }),
            providesTags: ["FooterSetting"],
        }),

        // Update a specific field in footer setting
        updateFooterField: builder.mutation({
            query: ({ field, value, access_token }) => {
                const isFormData = value instanceof FormData;

                return {
                    url: `${field}`,
                    method: "PUT",
                    body: isFormData ? value : JSON.stringify(value),
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        ...(isFormData ? {} : { "Content-Type": "application/json" }),
                    },
                };
            },
            invalidatesTags: (result, error, { field }) => [
                "FooterSetting",
                { type: "FooterSetting", id: field },
            ],
        }),

    }),
});

export const {
    useGetFooterSettingsQuery,
    useUpdateFooterFieldMutation,
} = footerSettingApi;
