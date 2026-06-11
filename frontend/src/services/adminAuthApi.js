import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "./CookieService";

export const adminAuthApi = createApi({
  reducerPath: "adminAuthApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/admin/auth/`,
    prepareHeaders: (headers, { getState }) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Admin"], // Useful for invalidation
  endpoints: (builder) => ({
    // Auth
    registerUser: builder.mutation({
      query: (user) => ({
        url: "signup",
        method: "POST",
        body: user,
        headers: { "Content-Type": "application/json" },
      }),
    }),
    loginUser: builder.mutation({
      query: (user) => ({
        url: "login",
        method: "POST",
        body: user,
        headers: { "Content-Type": "application/json" },
      }),
    }),

    // Admin CRUD
    getAllAdmins: builder.query({
      query: ({ search_term, role_id, limit = 10, offset = 0 }) => ({
        url: "/admins",
        method: "GET",
        params: { search_term, role_id, limit, offset },
      }),
      providesTags: ["Admin"]
    }),

    getAdminById: builder.query({
      query: (id) => `admins/${id}`,
      providesTags: (result, error, id) => [{ type: "Admin", id }],
    }),

    getCurrentAdmin: builder.query({
      query: () => `admins/me`,
      providesTags: ["Admin"],
    }),

    createAdmin: builder.mutation({
      query: (newAdmin) => ({
        url: "admins",
        method: "POST",
        body: newAdmin,
        headers: { "Content-Type": "application/json" },
      }),
      invalidatesTags: ["Admin"],
    }),

    updateAdmin: builder.mutation({
      query: ({ id, formData }) => ({
        url: `admins/${id}`,
        method: "PUT",
        body: formData, // send FormData
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Admin", id }],
    }),

    updateAdminPassword: builder.mutation({
      query: ({ id, currentPassword, newPassword }) => ({
        url: `admins/${id}/password`,
        method: "PUT",
        body: { currentPassword, newPassword },
        headers: { "Content-Type": "application/json" },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Admin", id }],
    }),


    deleteAdmin: builder.mutation({
      query: (id) => ({
        url: `admins/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Admin"],
    }),

    toggleAdminStatus: builder.mutation({
      query: (id) => ({
        url: `admins/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Admin", id }],
    }),

    // New permissions endpoint
    getAdminPermissions: builder.query({
      query: (access_token) => ({
        url: "permissions",
        method: "GET",
      }),
      providesTags: ["Admin"],
    }),
    logoutAdminOrPartnerUser: builder.mutation({
      query: (access_token) => ({
        url: "logout",
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["Admin"],
    }),
  }),
});

export const {
  useRegisterUserMutation,
  useLoginUserMutation,
  useGetAllAdminsQuery,
  useGetAdminByIdQuery,
  useGetCurrentAdminQuery,
  useCreateAdminMutation,
  useUpdateAdminMutation,
  useUpdateAdminPasswordMutation,
  useDeleteAdminMutation,
  useToggleAdminStatusMutation,
  useGetAdminPermissionsQuery,
  useLogoutAdminOrPartnerUserMutation
} = adminAuthApi;
