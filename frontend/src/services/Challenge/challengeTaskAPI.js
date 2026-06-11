import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const challengeTaskAPI = createApi({
  reducerPath: "challengeTaskAPI",
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
  tagTypes: ["Task"],
  endpoints: (builder) => ({
    // ✅ Create Task
    createTask: builder.mutation({
      query: (data) => ({
        url: "/task",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Task"],
    }),

    // ✅ Get All Tasks
    getAllTasks: builder.query({
      query: () => ({
        url: "/task",
        method: "GET",
      }),
      providesTags: ["Task"],
    }),

    // ✅ Get Task by ID
    getTaskById: builder.query({
      query: (id) => ({
        url: `/task/${id}`,
        method: "GET",
      }),
      providesTags: ["Task"],
    }),

    // ✅ Get Tasks by Phase ID
    getTasksByPhaseId: builder.query({
      query: ({ phaseId, searchTerm, difficulty, status }) => ({
        url: `/task/phase/${phaseId}`,
        params: { searchTerm, difficulty, status },
        method: "GET",
      }),
      providesTags: ["Task"],
    }),

    // ✅ Update Task by ID
    updateTask: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/task/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Task"],
    }),

    // ✅ Toggle Task Status by ID (using PATCH)
    toggleTaskStatus: builder.mutation({
      query: (id) => ({
        url: `/task/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Task"],
    }),

    // ✅ Delete Task by ID
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/task/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Task"],
    }),
  }),
});

export const {
  useCreateTaskMutation,
  useGetAllTasksQuery,
  useGetTaskByIdQuery,
  useGetTasksByPhaseIdQuery,
  useUpdateTaskMutation,
  useToggleTaskStatusMutation,
  useDeleteTaskMutation,
} = challengeTaskAPI;