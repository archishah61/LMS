import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const cityApi = createApi({
  reducerPath: "cityApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/cities`,
    prepareHeaders: (headers, { getState }) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["City"],
  endpoints: (builder) => ({
    // ✅ Create City
    createCity: builder.mutation({
      query: (data) => ({
        url: "/create",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["City"],
    }),

    // ✅ Get All Cities
    getAllCities: builder.query({
      query: ({ search_term, limit, offset, state_id }) => ({
        url: "/all",
        method: "GET",
        params: { search_term, limit, offset, state_id },
      }),
      providesTags: ["City"],
    }),

    // ✅ Get All Active Cities
    getAllActiveCities: builder.query({
      query: ({ state_id }) => ({
        url: "/all-active",
        method: "GET",
        params: { state_id },
      }),
      providesTags: ["City"],
    }),

    // ✅ Get Single City by ID
    getCityById: builder.query({
      query: (id) => ({
        url: `/${id}`,
        method: "GET",
      }),
      providesTags: ["City"],
    }),

    // ✅ Update City
    updateCity: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/update/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["City"],
    }),

    // ✅ Toggle City Status
    toggleCityStatus: builder.mutation({
      query: (id) => ({
        url: `/toggle-status/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["City"],
    }),

    // ✅ Delete City
    deleteCity: builder.mutation({
      query: (id) => ({
        url: `/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["City"],
    }),
  }),
});

export const {
  useCreateCityMutation,
  useGetAllCitiesQuery,
  useGetAllActiveCitiesQuery,
  useGetCityByIdQuery,
  useUpdateCityMutation,
  useToggleCityStatusMutation,
  useDeleteCityMutation,
} = cityApi;