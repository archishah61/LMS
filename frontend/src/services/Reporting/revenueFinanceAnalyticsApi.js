import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const revenueFinanceAnalyticsApi = createApi({
  reducerPath: "revenueFinanceAnalyticsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/revenue-and-financial/`,
  }),
  endpoints: (builder) => ({
    getRevenueByCourseCategory: builder.query({
      query: ({ user_type, partner_id, access_token }) => ({
        url: "revenue-by-category",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: { user_type, partner_id },
      }),
      providesTags: ["RevenueFinance"],
    }),

    getCustomerLifetimeValue: builder.query({
      query: ({ user_type, partner_id, access_token }) => ({
        url: "customer-lifetime-value",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: { user_type, partner_id }
      }),
      providesTags: ["RevenueFinance"],
    }),

    getTodaysRevenue: builder.query({
      query: ({ user_type, partner_id, access_token }) => ({
        url: "todays-revenue",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: { user_type, partner_id },

      }),
      providesTags: ["RevenueFinance"],
    }),

    getThisWeeksRevenue: builder.query({
      query: ({ user_type, partner_id, access_token }) => ({
        url: "this-weeks-revenue",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: { user_type, partner_id },

      }),
      providesTags: ["RevenueFinance"],
    }),

    getMonthlyRevenue: builder.query({
      query: ({ user_type, partner_id, access_token, month }) => ({
        url: "monthly-revenue",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: { user_type, partner_id, month },
      }),
      providesTags: ["RevenueFinance"],
    }),

    getYearlyRevenue: builder.query({
      query: ({ user_type, partner_id, access_token, year }) => ({
        url: "yearly-revenue",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: { user_type, partner_id, year },
      }),
      providesTags: ["RevenueFinance"],
    }),

    getOverallRevenue: builder.query({
      query: ({ user_type, partner_id, access_token }) => ({
        url: "overall-revenue",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: { user_type, partner_id },

      }),
      providesTags: ["RevenueFinance"],
    }),


  }),
});

export const {
  useGetRevenueByCourseCategoryQuery,
  useGetCustomerLifetimeValueQuery,
  useGetTodaysRevenueQuery,
  useGetThisWeeksRevenueQuery,
  useGetMonthlyRevenueQuery,
  useGetYearlyRevenueQuery,
  useGetOverallRevenueQuery,
} = revenueFinanceAnalyticsApi;