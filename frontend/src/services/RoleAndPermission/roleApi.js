import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const roleApi = createApi({
  reducerPath: "roleApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/roles`,
    prepareHeaders: (headers, { getState }) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Role"],
  endpoints: (builder) => ({
    // ✅ Create Role
    createRole: builder.mutation({
      query: (arg) => ({
        url: "/create",
        method: "POST",
        body: arg.data || {},
      }),
      invalidatesTags: ["Role"],
    }),

    // ✅ Update Role
    updateRole: builder.mutation({
      query: (arg) => ({
        url: `/update/${arg.id}`,
        method: "PUT",
        body: arg.data || {},
      }),
      invalidatesTags: ["Role"],
    }),

    // ✅ Get All Roles with filters
    getAllRoles: builder.query({
      query: (arg) => ({
        url: `/all`,
        method: "GET",
        params: {
          search_term: arg?.search_term || "",
          limit: arg?.limit || 10,
          offset: arg?.offset || 0,
        },
      }),
      providesTags: ["Role"],
    }),

    // ✅ Get Role by ID
    getRoleById: builder.query({
      query: (arg) => ({
        url: `/${arg.id}`,
        method: "GET",
      }),
      providesTags: ["Role"],
    }),

    // ✅ Delete Role
    deleteRole: builder.mutation({
      query: (arg) => ({
        url: `/delete/${arg.id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Role"],
    }),

    // ✅ Toggle Role
    toggleRole: builder.mutation({
      query: (arg) => ({
        url: `/toggle/${arg.id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Role"],
    }),
  }),
});

export const {
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useGetAllRolesQuery,
  useGetRoleByIdQuery,
  useDeleteRoleMutation,
  useToggleRoleMutation
} = roleApi;
