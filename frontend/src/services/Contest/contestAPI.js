import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const contestAPI = createApi({
  reducerPath: "contestAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/contest`,
    prepareHeaders: (headers) => {
      const token = getAdminToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token.access_token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Contest"],
  endpoints: (builder) => ({
    // ✅ Create Contest
    createContest: builder.mutation({
      query: ({ data }) => ({
        url: "/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Contest"],
    }),

    // ✅ Get All Contests
    getAllContests: builder.query({
      query: ({ limit = 10, offset = 0, status, type, sortBy, template_id }) => {
        if (template_id) {
          return {
            url: `/`, // contests by template
            method: "GET",
            params: { limit, offset, status, type, template_id, sortBy }
          };
        }
        return {
          url: `/`, // all contests
          method: "GET",
          params: { limit, offset, status, type, sortBy }
        };
      },
      providesTags: ["Contest"],
    }),

    // ✅ Get Active Contests
    getActiveContests: builder.query({
      query: (template_id) => {
        if (template_id) {
          return {
            url: `/active/?template_id=${template_id}`, // contests by template
            method: "GET",
          };
        }
        return {
          url: `/active`, // all contests
          method: "GET",
        };
      },
      providesTags: ["Contest"],
    }),

    // ✅ Get Contest by ID
    getContestById: builder.query({
      query: (id) => ({
        url: `/${id}`,
        method: "GET",
      }),
      providesTags: ["Contest"],
    }),

    // ✅ Update Contest
    updateContest: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Contest"],
    }),

    // ✅ Toggle Contest Status
    toggleContestStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/${id}/toggle`,
        method: "PATCH",
        body: { status }
      }),
      invalidatesTags: ["Contest"],
    }),

    // ✅ Delete Contest
    deleteContest: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Contest"],
    }),
  }),
});

export const {
  useCreateContestMutation,
  useGetAllContestsQuery,
  useGetActiveContestsQuery,
  useGetContestByIdQuery,
  useUpdateContestMutation,
  useToggleContestStatusMutation,
  useDeleteContestMutation,
} = contestAPI;
