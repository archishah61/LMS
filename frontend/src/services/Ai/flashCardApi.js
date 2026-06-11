// api/flashCardApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const flashCardApi = createApi({
  reducerPath: "flashCardApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/ai-flash-card/flashcards`,
  }),
  tagTypes: ['FlashCard'],
  endpoints: (builder) => ({
    createFlashCard: builder.mutation({
      query: ({ flashCardData, access_token }) => ({
        url: '',
        method: 'POST',
        body: flashCardData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ['FlashCard'],
    }),
  }),
});

export const {
  useCreateFlashCardMutation,
} = flashCardApi;
