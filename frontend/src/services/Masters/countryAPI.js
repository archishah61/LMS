import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const countryApi = createApi({
  reducerPath: "countryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/countries`,
    prepareHeaders: (headers, { getState }) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Country"],
  endpoints: (builder) => ({
    // ✅ Create Country
    createCountry: builder.mutation({
      query: (data) => ({
        url: "/create",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Country"],
    }),

    // ✅ Get All Countries with search and pagination
    getAllCountries: builder.query({
      query: ({ search_term = '', limit = 10, offset = 0 }) => ({
        url: "/all",
        method: "GET",
        params: { search_term, limit, offset },
      }),
      providesTags: ["Country"],
    }),

    // ✅ Get All Active Countries
    getAllActiveCountries: builder.query({
      query: () => ({
        url: "/all-active",
        method: "GET",
      }),
      providesTags: ["Country"],
    }),

    // ✅ Get Single Country by ID
    getCountryById: builder.query({
      query: (id) => ({
        url: `/${id}`,
        method: "GET",
      }),
      providesTags: ["Country"],
    }),

    // ✅ Update Country
    updateCountry: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/update/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Country"],
    }),

    // ✅ Toggle Country Status
    toggleCountryStatus: builder.mutation({
      query: (id) => ({
        url: `/toggle-status/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Country"],
    }),

    // ✅ Delete Country
    deleteCountry: builder.mutation({
      query: (id) => ({
        url: `/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Country"],
    }),
  }),
});

export const {
  useCreateCountryMutation,
  useGetAllCountriesQuery,
  useGetAllActiveCountriesQuery,
  useGetCountryByIdQuery,
  useUpdateCountryMutation,
  useToggleCountryStatusMutation,
  useDeleteCountryMutation,
} = countryApi;