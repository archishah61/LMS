import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define a service using a base URL and expected endpoints
export const summarizeApi = createApi({
  reducerPath: "summarizeApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/ai`, // Adjust the base URL as needed
  }),
  endpoints: (builder) => ({
    summarizePassage: builder.mutation({
      query: ({ passage, access_token }) => ({
        url: "summarize", // This should match the route defined in your backend
        method: "POST",
        body: { passage },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),
  }),
});

export const { useSummarizePassageMutation } = summarizeApi;
