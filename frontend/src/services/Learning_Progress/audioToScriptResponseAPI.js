import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const audioToScriptResponseApi = createApi({
  reducerPath: "audioToScriptResponseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/audio-to-script-response/`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.user?.access_token; // adjust if your token path is different
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["AudioToScriptResponse"],
  endpoints: (builder) => ({
    // ✅ Create Response
    createAudioToScriptResponse: builder.mutation({
      query: (data) => ({
        url: "create",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["AudioToScriptResponse"],
    }),

    // ✅ Get All Responses
    getAllAudioToScriptResponses: builder.query({
      query: () => ({
        url: "",
        method: "GET",
      }),
      providesTags: ["AudioToScriptResponse"],
    }),

    // ✅ Get by Question ID
    getResponsesByQuestionId: builder.query({
      query: (question_id) => ({
        url: `question/${question_id}`,
        method: "GET",
      }),
      providesTags: ["AudioToScriptResponse"],
    }),

    // ✅ Get by Student ID
    getResponsesByStudentId: builder.query({
      query: (student_id) => ({
        url: `student/${student_id}`,
        method: "GET",
      }),
      providesTags: ["AudioToScriptResponse"],
    }),

    // ✅ Update Response
    updateAudioToScriptResponse: builder.mutation({
      query: ({ id, data }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["AudioToScriptResponse"],
    }),

    // ✅ Delete Response
    deleteAudioToScriptResponse: builder.mutation({
      query: (id) => ({
        url: `delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AudioToScriptResponse"],
    }),
  }),
});

export const {
  useCreateAudioToScriptResponseMutation,
  useGetAllAudioToScriptResponsesQuery,
  useGetResponsesByQuestionIdQuery,
  useGetResponsesByStudentIdQuery,
  useUpdateAudioToScriptResponseMutation,
  useDeleteAudioToScriptResponseMutation,
} = audioToScriptResponseApi;
