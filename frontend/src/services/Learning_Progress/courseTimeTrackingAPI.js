import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { enrollApi } from "../Enrollment/enrollAPI";

export const courseTimeTrackingAPI = createApi({
  reducerPath: "courseTimeTrackingAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/track-course`,
  }),
  tagTypes: [
    "StartCourseTimeTracking",
    "EndCourseTimeTracking",
    "UpdateCourseTimeTracking",
  ],
  endpoints: (builder) => ({
    // ✅ Start a course session
    startCourseSession: builder.mutation({
      query: (data) => ({
        url: "/start-session",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["StartCourseTimeTracking"],
    }),

    // ✅ End a course session
    endCourseSession: builder.mutation({
      query: (data) => ({
        url: "/end-session",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["EndCourseTimeTracking"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(enrollApi.util.invalidateTags(["Enrollments", "CourseProgress"]));
        } catch {
          // Request failed; keep existing cache untouched.
        }
      },
    }),

    updateCourseSession: builder.mutation({
      query: (data) => ({
        url: "/update-session",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["UpdateCourseTimeTracking"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(enrollApi.util.invalidateTags(["Enrollments", "CourseProgress"]));
        } catch {
          // Request failed; keep existing cache untouched.
        }
      },
    }),

    // ✅ Check if a student can access a course
    checkCourseAccess: builder.query({
      query: (enrollment_id) => ({
        url: `/check-access/${enrollment_id}`,
        method: "GET",
      }),
      providesTags: [
        "StartCourseTimeTracking",
        "EndCourseTimeTracking",
        "UpdateCourseTimeTracking",
        "ResetCourseTimeTracking",
      ],
    }),

  }),
});

export const {
  useStartCourseSessionMutation,
  useEndCourseSessionMutation,
  useUpdateCourseSessionMutation,
  useCheckCourseAccessQuery,
} = courseTimeTrackingAPI;