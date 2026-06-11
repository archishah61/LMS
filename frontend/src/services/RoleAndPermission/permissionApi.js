import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const permissionApi = createApi({
  reducerPath: "permissionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/permissions`,
    prepareHeaders: (headers,) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Permission"],
  endpoints: (builder) => ({
    // ✅ Get All Permissions with filters
    getAllPermissions: builder.query({
      query: (arg) => ({
        url: `/all`,
        method: "GET",
        params: {
          search_term: arg?.search_term || "",
          limit: arg?.limit || 10,
          offset: arg?.offset || 0,
        },
        headers: {
          Authorization: `Bearer ${arg.access_token}`,
        },
      }),
      providesTags: ["Permission"],
    }),
  }),
});

export const {
  useGetAllPermissionsQuery,
} = permissionApi;
