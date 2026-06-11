import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const challengePhaseAPI = createApi({
  reducerPath: "challengePhaseAPI",
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
  tagTypes: ["Phase"],
  endpoints: (builder) => ({
    // ✅ Create Challenge Phase
    createPhase: builder.mutation({
      query: (data) => ({
        url: "/phase",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Phase"],
    }),

    // ✅ Get All Challenge Phases
    getAllPhases: builder.query({
      query: () => ({
        url: "/phase",
        method: "GET",
      }),
      providesTags: ["Phase"],
    }),

    // ✅ Get Challenge Phase by ID
    getPhaseById: builder.query({
      query: (id) => ({
        url: `/phase/${id}`,
        method: "GET",
      }),
      providesTags: ["Phase"],
    }),

    // ✅ Update Challenge Phase by ID
    updatePhase: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/phase/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Phase"],
    }),

    // ✅ Toggle Phase Status by ID (using PATCH)
    togglePhaseStatus: builder.mutation({
      query: (id) => ({
        url: `/phase/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Phase"],
    }),

    // ✅ Delete Challenge Phase by ID
    deletePhase: builder.mutation({
      query: (id) => ({
        url: `/phase/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Phase"],
    }),

    // ✅ Get Phases by Challenge ID
    getPhasesByChallengeId: builder.query({
      query: ({ challengeId, searchTerm, phaseType, status }) => ({
        url: `/phase/quest/${challengeId}`,
        params: { searchTerm, phaseType, status },
        method: "GET",
      }),
      providesTags: ["Phase"],
    }),
  }),
});

export const {
  useCreatePhaseMutation,
  useGetAllPhasesQuery,
  useGetPhaseByIdQuery,
  useUpdatePhaseMutation,
  useTogglePhaseStatusMutation,
  useDeletePhaseMutation,
  useGetPhasesByChallengeIdQuery,
} = challengePhaseAPI;