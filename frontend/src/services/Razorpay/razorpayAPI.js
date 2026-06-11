import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getStudentToken } from "../CookieService";

export const razorpayApi = createApi({
  reducerPath: "razorpayApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/razorpay/`,
    prepareHeaders: (headers, { getState }) => {
      const token = getStudentToken();
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
    verifyPayment: builder.mutation({
      query: (captureData) => ({
        url: "verify-payment",
        method: "POST",
        body: captureData,
      }),
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useVerifyPaymentMutation,
} = razorpayApi;
