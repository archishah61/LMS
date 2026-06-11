import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const rolePermissionApi = createApi({
  reducerPath: "rolePermissionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/role-permissions`,
    prepareHeaders: (headers, { getState, endpoint, forced, type, arg }) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["RolePermission"],
  endpoints: (builder) => ({
    // ✅ Assign/Manage Permissions for a Role
    manageRolePermissions: builder.mutation({
      query: (arg) => ({
        url: `/manage`,
        method: "POST",
        body: arg.data || {},
        headers: {
          Authorization: `Bearer ${arg.access_token}`,
        },
      }),
      invalidatesTags: ["RolePermission"],
    }),

    // ✅ Get Permissions Assigned to a Role
    getPermissionsByRoleId: builder.query({
      query: (arg) => ({
        url: `/${arg.roleId}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${arg.access_token}`,
        },
      }),
      providesTags: ["RolePermission"],
    }),
  }),
});

export const {
  useManageRolePermissionsMutation,
  useGetPermissionsByRoleIdQuery,
} = rolePermissionApi;
