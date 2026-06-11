import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define a service using a base URL and expected endpoints
export const socialMediaApi = createApi({
    reducerPath: "socialMediaApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/social-media/`,
    }),
    tagTypes: ["SocialMedia"],
    endpoints: (builder) => ({
        // Get all social media links
        getSocialMediaLinks: builder.query({
            query: () => ({
                url: "",
                method: "GET",
            }),
            providesTags: ["SocialMedia"],
        }),

        // Update specific platform link
        updateSocialMediaPlatform: builder.mutation({
            query: ({ platform, url, access_token }) => ({
                url: `${platform}`,
                method: "PUT",
                body: { url },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: (result, error, { platform }) => [
                "SocialMedia",
                { type: "SocialMedia", id: platform },
            ],
        }),
    }),
});

// Export hooks for usage in components
export const {
    useGetSocialMediaLinksQuery,
    useUpdateSocialMediaPlatformMutation,
} = socialMediaApi;
