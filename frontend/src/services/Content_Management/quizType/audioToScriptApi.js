import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../../CookieService";

export const audioToScriptApi = createApi({
  reducerPath: "audioToScriptApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/audio-to-script/`,
  }),
  tagTypes: ["AudioToScript"],
  endpoints: (builder) => ({
    // ✅ Create
    createAudioToScriptQuestion: builder.mutation({
      query: ({ formData, access_token }) => ({
        url: "create",
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["AudioToScript"],
    }),

    // ✅ Get All
    // getAllAudioToScriptQuestions: builder.query({
    //   query: () => ({
    //     url: "",
    //     method: "GET",
    //   }),
    //   providesTags: ["AudioToScript"],
    // }),

    // ✅ Get by Quiz ID
    getAudioToScriptByQuizId: builder.query({
      query: ({ quizId, access_token }) => ({
        url: `quiz/${quizId}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["AudioToScript"],
    }),

    // ✅ Update
    updateAudioToScriptQuestion: builder.mutation({
      query: ({ id, formData, access_token }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${access_token}`,
          // ❌ Do NOT set Content-Type manually!
        },
      }),
      invalidatesTags: ["AudioToScript"],
    }),

    // ✅ Delete
    deleteAudioToScriptQuestion: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `delete/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["AudioToScript"],
    }),
  }),
});

export const {
  useCreateAudioToScriptQuestionMutation,
  // useGetAllAudioToScriptQuestionsQuery,
  useGetAudioToScriptByQuizIdQuery,
  useUpdateAudioToScriptQuestionMutation,
  useDeleteAudioToScriptQuestionMutation,
} = audioToScriptApi;
