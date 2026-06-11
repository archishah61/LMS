import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const timeBasedAnalyticsApi = createApi({
  reducerPath: "timeBasedAnalyticsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/time-based-analytics/`,
  }),
  endpoints: (builder) => ({
    getEstimatedVsActualCompletionTimes: builder.query({
      query: ({ user_type, partner_id, access_token }) => ({
        url: "estimated-vs-actual-completion",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: { user_type, partner_id },

      }),
      providesTags: ["TimeBasedAnalytics"],
    }),
  }),
});

export const { useGetEstimatedVsActualCompletionTimesQuery } =
  timeBasedAnalyticsApi;
