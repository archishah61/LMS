import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../../CookieService";

// Define a service using a base URL and expected endpoints
export const mainSectionApi = createApi({
  reducerPath: "mainSectionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/cheat-sheets/main-section/`,
    // prepareHeaders: (headers, { getState }) => {
    //   const token = getAdminToken();
    //   if (token) {
    //     headers.set("Authorization", `Bearer ${token.access_token}`);
    //   }
    //   return headers;
    // },
  }),
  endpoints: (builder) => ({
    createMainSection: builder.mutation({
      query: ({ mainSection, access_token }) => {
        return {
          url: "create/",
          method: "POST",
          body: mainSection,
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: ["MainSection"],
    }),
    getMainSections: builder.query({
      query: ({ access_token }) => {
        return {
          url: "",
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      providesTags: ["MainSection"],
    }),
    getMainSectionById: builder.query({
      query: ({ id, search_term, access_token }) => {
        return {
          url: `/${id}`,
          method: "GET",
          params: { search_term },
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      providesTags: ["MainSection"],
    }),
    updateMainSection: builder.mutation({
      query: ({ id, formData, access_token }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["MainSection"],
    }),
    deleteMainSection: builder.mutation({
      query: ({ id, access_token }) => {
        return {
          url: `delete/${id}`,
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: ["MainSection"],
    }),
    // ✅ Toggle status mutation
    toggleMainSectionStatus: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `toggle-status/${id}`,
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["MainSection"],
    }),
  }),
});

export const {
  useCreateMainSectionMutation,
  useGetMainSectionsQuery,
  useGetMainSectionByIdQuery,
  useUpdateMainSectionMutation,
  useDeleteMainSectionMutation,
  useToggleMainSectionStatusMutation,
} = mainSectionApi;
