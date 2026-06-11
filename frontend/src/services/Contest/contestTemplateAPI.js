import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const contestTemplateAPI = createApi({
  reducerPath: "contestTemplateAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/contest/template`,
    prepareHeaders: (headers) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["ContestTemplate"],
  endpoints: (builder) => ({
    // ✅ Create Contest Template
    createTemplate: builder.mutation({
      query: (data) => ({
        url: "/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ContestTemplate"],
    }),

    // ✅ Get All Contest Templates
    getAllTemplates: builder.query({
      query: ({ limit = 10, offset = 0, status, type }) => ({
        url: "/",
        method: "GET",
        params: { limit, offset, status, type }
      }),
      providesTags: ["ContestTemplate"],
    }),

    // ✅ Get Active Contest Templates
    getActiveTemplates: builder.query({
      query: () => ({
        url: "/active",
        method: "GET",
      }),
      providesTags: ["ContestTemplate"],
    }),

    // ✅ Get Contest Template by ID
    getTemplateById: builder.query({
      query: (id) => ({
        url: `/${id}`,
        method: "GET",
      }),
      providesTags: ["ContestTemplate"],
    }),

    // ✅ Update Contest Template
    updateTemplate: builder.mutation({
      query: ({ id, template }) => ({
        url: `/${id}`,
        method: "PUT",
        body: template,
      }),
      invalidatesTags: ["ContestTemplate"],
    }),

    // ✅ Toggle Template Status
    toggleTemplateStatus: builder.mutation({
      query: (id) => ({
        url: `/${id}/toggle`,
        method: "PATCH",
      }),
      invalidatesTags: ["ContestTemplate"],
    }),

    // ✅ Delete Contest Template
    deleteTemplate: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ContestTemplate"],
    }),
  }),
});

export const {
  useCreateTemplateMutation,
  useGetAllTemplatesQuery,
  useGetActiveTemplatesQuery,
  useGetTemplateByIdQuery,
  useUpdateTemplateMutation,
  useToggleTemplateStatusMutation,
  useDeleteTemplateMutation,
} = contestTemplateAPI;
