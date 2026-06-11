import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const testimonialApi = createApi({
    reducerPath: "testimonialApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/testimonials/`,
    }),
    tagTypes: ["CompanyLogo", "Testimonial"],
    endpoints: (builder) => ({
        // --- Company Logos ---
        getAllLogos: builder.query({
            query: (access_token) => ({
                url: "logos",
                method: "GET",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ["CompanyLogo"],
        }),
        createLogo: builder.mutation({
            query: ({ data, access_token }) => ({
                url: "logos",
                method: "POST",
                body: data,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["CompanyLogo"],
        }),
        updateLogo: builder.mutation({
            query: ({ id, data, access_token }) => ({
                url: `logos/${id}`,
                method: "PUT",
                body: data,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["CompanyLogo", "Testimonial"],
        }),
        deleteLogo: builder.mutation({
            query: ({ id, access_token }) => ({
                url: `logos/${id}`,
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["CompanyLogo", "Testimonial"],
        }),

        // --- Testimonials ---
        getAllTestimonials: builder.query({
            query: (arg) => {
                const isAccessTokenString = typeof arg === "string";
                const accessToken = isAccessTokenString ? arg : arg?.access_token;
                const status = isAccessTokenString ? undefined : arg?.status;

                return {
                    url: "testimonials",
                    method: "GET",
                    ...(status ? { params: { status } } : {}),
                    ...(accessToken ? {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    } : {}),
                };
            },
            providesTags: ["Testimonial"],
        }),
        createTestimonial: builder.mutation({
            query: ({ data, access_token }) => ({
                url: "testimonials",
                method: "POST",
                body: data,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["Testimonial"],
        }),
        updateTestimonial: builder.mutation({
            query: ({ id, data, access_token }) => ({
                url: `testimonials/${id}`,
                method: "PUT",
                body: data,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["Testimonial"],
        }),
        deleteTestimonial: builder.mutation({
            query: ({ id, access_token }) => ({
                url: `testimonials/${id}`,
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["Testimonial"],
        }),
    }),
});

export const {
    useGetAllLogosQuery,
    useCreateLogoMutation,
    useUpdateLogoMutation,
    useDeleteLogoMutation,
    useGetAllTestimonialsQuery,
    useCreateTestimonialMutation,
    useUpdateTestimonialMutation,
    useDeleteTestimonialMutation,
} = testimonialApi;
