import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

// Define a service for quiz answers (quiz responses) data CRUD operations
export const quizResponseApi = createApi({
  reducerPath: "quizResponseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/quiz-responses/`, // Adjusted to match QuizResponse model
  }),
  endpoints: (builder) => ({
    createQuizResponse: builder.mutation({
      query: ({ responseData, access_token }) => ({
        url: "",
        method: "POST",
        body: responseData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["QuizResponses"],
    }),

  }),
});

export const {
  useCreateQuizResponseMutation,
} = quizResponseApi;
