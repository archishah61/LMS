import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const privacyPolicyApi = createApi({
  reducerPath: "privacyPolicyApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/privacy/`,
  }),
  tagTypes: ["PrivacyPolicy"],
  endpoints: (builder) => ({
    // Create Privacy Policy
    createPrivacyPolicy: builder.mutation({
      query: ({ data, access_token }) => ({
        url: "",
        method: "POST",
        body: data,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["PrivacyPolicy"],
    }),

    // Update Privacy Policy
    updatePrivacyPolicy: builder.mutation({
      query: ({ id, data, access_token }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: data,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["PrivacyPolicy"],
    }),

    // Toggle Privacy Policy Status
    togglePrivacyPolicyStatus: builder.mutation({
      query: ({ id, access_token, updatedBy }) => ({
        url: `${id}`,
        method: "PATCH",
        body: updatedBy ? { updatedBy } : {}, // Optional updatedBy
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["PrivacyPolicy"],
    }),

    // Get All Privacy Policies
    getAllPrivacyPolicies: builder.query({
      query: (access_token) => ({
        url: "",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["PrivacyPolicy"],
    }),

    // Get by Category
    getPrivacyPolicyByCategory: builder.query({
      query: (category) => ({
        url: `category/${category}`,
        method: "GET",
      }),
      providesTags: ["PrivacyPolicy"],
    }),
  }),
});

export const {
  useCreatePrivacyPolicyMutation,
  useUpdatePrivacyPolicyMutation,
  useTogglePrivacyPolicyStatusMutation,
  useGetAllPrivacyPoliciesQuery,
  useGetPrivacyPolicyByCategoryQuery,
} = privacyPolicyApi;
