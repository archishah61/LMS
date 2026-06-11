import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const stateApi = createApi({
  reducerPath: "stateApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/states`,
    prepareHeaders: (headers, { getState }) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["State"],
  endpoints: (builder) => ({
    // ✅ Create State
    createState: builder.mutation({
      query: (data) => ({
        url: "/create",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["State"],
    }),

    // ✅ Update State
    updateState: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/update/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["State"],
    }),

    // ✅ Get All States
    getAllStates: builder.query({
      query: (params) => ({
        url: "/all",
        method: "GET",
        params: {
          search_term: params?.search_term,
          limit: params?.limit,
          offset: params?.offset,
          country_id: params?.country_id,
        },
      }),
      providesTags: ["State"],
    }),

        // ✅ Get All Active Cities
    getAllActiveStates: builder.query({
      query: ({ country_id }) => ({
        url: "/all-active",
        method: "GET",
        params: { country_id },
      }),
      providesTags: ["State"],
    }),

    // ✅ Get State by ID
    getStateById: builder.query({
      query: (id) => ({
        url: `/${id}`,
        method: "GET",
      }),
      providesTags: ["State"],
    }),

    // ✅ Toggle State Status
    toggleStateStatus: builder.mutation({
      query: (id) => ({
        url: `/toggle-status/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["State"],
    }),
  }),
});

export const {
  useCreateStateMutation,
  useUpdateStateMutation,
  useGetAllStatesQuery,
  useGetAllActiveStatesQuery,
  useGetStateByIdQuery,
  useToggleStateStatusMutation,
} = stateApi;