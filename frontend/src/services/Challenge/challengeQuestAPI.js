import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const challengeQuestAPI = createApi({
  reducerPath: "challengeQuestAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/challenge`,
    prepareHeaders: (headers, { getState }) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Quest"],
  endpoints: (builder) => ({
    // ✅ Create Quest Challenge
    createQuest: builder.mutation({
      query: (data) => ({
        url: "/quest",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Quest"],
    }),

    // ✅ Get All Quest Challenges
    getAllQuests: builder.query({
      query: ({ limit = "10", offset = "0", category, difficulty, status }) => ({
        url: "/quest",
        method: "GET",
        params: { limit, offset, category, difficulty, status },
      }),
      providesTags: ["Quest"],
    }),

    // ✅ Get Quest Challenge by ID
    getQuestById: builder.query({
      query: (id) => ({
        url: `/quest/${id}`,
        method: "GET",
      }),
      providesTags: ["Quest"],
    }),

    // ✅ Update Quest Challenge by ID
    updateQuest: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/quest/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Quest"],
    }),

    // ✅ Toggle Quest Status by ID (using PATCH)
    toggleQuestStatus: builder.mutation({
      query: (id) => ({
        url: `/quest/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Quest"],
    }),

    // ✅ Delete Quest Challenge by ID
    deleteQuest: builder.mutation({
      query: (id) => ({
        url: `/quest/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Quest"],
    }),
  }),
});

export const {
  useCreateQuestMutation,
  useGetAllQuestsQuery,
  useGetQuestByIdQuery,
  useUpdateQuestMutation,
  useToggleQuestStatusMutation,
  useDeleteQuestMutation,
} = challengeQuestAPI;