import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const profitsApi = createApi({
  reducerPath: "profitsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/profits/`,
    prepareHeaders: (headers, { getState }) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getMetrics: builder.query({
      query: (month) => `metrics${month ? `?month=${month}` : ""}`, 
      providesTags: ["Profits"],
    }),
  }),
});

export const { useGetMetricsQuery } = profitsApi;
