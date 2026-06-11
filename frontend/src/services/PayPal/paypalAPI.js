import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const paypalApi = createApi({
  reducerPath: "paypalApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/paypal/`,
    prepareHeaders: (headers, { getState }) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: "create-order",
        method: "POST",
        body: orderData,
      }),
    }),
    captureOrder: builder.mutation({
      query: (captureData) => ({
        url: "capture-order",
        method: "POST",
        body: captureData,
      }),
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useCaptureOrderMutation,
} = paypalApi;
