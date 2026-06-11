import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../../CookieService";

// Define a service using a base URL and expected endpoints
export const sectionApi = createApi({
  reducerPath: "sectionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL
      }/cheat-sheets/main-section/section/`,
    // prepareHeaders: (headers, { getState }) => {
    //   const token = getAdminToken();
    //   if (token) {
    //     headers.set("Authorization", `Bearer ${token.access_token}`);
    //   }
    //   return headers;
    // },
  }),
  endpoints: (builder) => ({
    createSection: builder.mutation({
      query: ({ section, access_token }) => {
        return {
          url: "create/",
          method: "POST",
          body: section,
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: ["Section"],
    }),
    getSections: builder.query({
      query: ({ access_token }) => {
        return {
          url: "",
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      providesTags: ["Section"],
    }),
    getSectionById: builder.query({
      query: ({ id, access_token }) => {
        return {
          url: `/${id}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      providesTags: ["Section"],
    }),
    updateSection: builder.mutation({
      query: ({ id, formData, access_token }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["Section"],
    }),
    deleteSection: builder.mutation({
      query: ({ id, access_token }) => {
        return {
          url: `delete/${id}`,
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
      invalidatesTags: ["Section"],
    }),
  }),
});

export const {
  useCreateSectionMutation,
  useGetSectionsQuery,
  useGetSectionByIdQuery,
  useUpdateSectionMutation,
  useDeleteSectionMutation,
} = sectionApi;
