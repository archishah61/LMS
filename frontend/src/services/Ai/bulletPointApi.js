// api/bulletPointApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const bulletPointApi = createApi({
  reducerPath: "bulletPointApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/ai-bullet-point/bulletpoints`,
  }),
  tagTypes: ['BulletPoint'],
  endpoints: (builder) => ({
    createBulletPoint: builder.mutation({
      query: ({ bulletPointData, access_token }) => ({
        url: '',
        method: 'POST',
        body: bulletPointData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ['BulletPoint'],
    }),
  }),
});

export const {
  useCreateBulletPointMutation,
} = bulletPointApi;
