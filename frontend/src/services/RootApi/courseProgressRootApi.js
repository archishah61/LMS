import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const courseProgressRootApi = createApi({
  reducerPath: "courseProgressRootApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_BACKEND_URL,
  }),
  tagTypes: [
    "CheckCourseCompletion",
    "QuizCompletion",
    // any other tags
  ],
  endpoints: () => ({}), // will be extended
});
