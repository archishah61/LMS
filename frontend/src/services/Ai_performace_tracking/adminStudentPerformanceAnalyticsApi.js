import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const adminStudentPerformanceAnalyticsApi = createApi({
  reducerPath: "adminStudentPerformanceAnalyticsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_BACKEND_URL
  }),
  tagTypes: ["AdminStudentPerformanceAnalytics", "EnrolledStudents"],
  endpoints: (builder) => ({
    // Get overall student performance analytics with filtering options
    getStudentAnalytics: builder.query({
      query: ({ studentId, courseId, moduleId, topicId, version }) => {
        let url = `/admin-student-performance-analytics/student/${studentId}`;
        const params = new URLSearchParams();
        
        if (courseId) params.append("courseId", courseId);
        if (moduleId) params.append("moduleId", moduleId);
        if (topicId) params.append("topicId", topicId);
        if (version) params.append("version", version);
        
        const queryString = params.toString();
        return queryString ? `${url}?${queryString}` : url;
      },
      providesTags: ["AdminStudentPerformanceAnalytics"],
    }),

    // Get detailed version comparison for student performance
    getVersionComparison: builder.query({
      query: ({ studentId, version1, version2, courseId, moduleId }) => {
        let url = `/admin-student-performance-analytics/student/${studentId}/version-comparison`;
        const params = new URLSearchParams();
        
        params.append("version1", version1);
        params.append("version2", version2);
        if (courseId) params.append("courseId", courseId);
        if (moduleId) params.append("moduleId", moduleId);
        
        return `${url}?${params.toString()}`;
      },
      providesTags: ["AdminStudentPerformanceAnalytics"],
    }),

    // Get module completion analytics for a student
    getModuleCompletion: builder.query({
      query: ({ studentId, courseId }) => {
        let url = `/admin-student-performance-analytics/student/${studentId}/modules`;
        const params = new URLSearchParams();
        
        params.append("courseId", courseId);
        
        return `${url}?${params.toString()}`;
      },
      providesTags: ["AdminStudentPerformanceAnalytics"],
    }),

    // Get topic strength analytics for a student
    getTopicStrengthAnalysis: builder.query({
      query: ({ studentId, courseId, moduleId, version }) => {
        let url = `/admin-student-performance-analytics/student/${studentId}/topics`;
        const params = new URLSearchParams();
        
        if (courseId) params.append("courseId", courseId);
        if (moduleId) params.append("moduleId", moduleId);
        if (version) params.append("version", version);
        
        const queryString = params.toString();
        return queryString ? `${url}?${queryString}` : url;
      },
      providesTags: ["AdminStudentPerformanceAnalytics"],
    }),

    // Get time spent analytics for a student
    getTimeSpentAnalysis: builder.query({
      query: ({ studentId, courseId, moduleId, version }) => {
        let url = `/admin-student-performance-analytics/student/${studentId}/time-spent`;
        const params = new URLSearchParams();
        
        if (courseId) params.append("courseId", courseId);
        if (moduleId) params.append("moduleId", moduleId);
        if (version) params.append("version", version);
        
        const queryString = params.toString();
        return queryString ? `${url}?${queryString}` : url;
      },
      providesTags: ["AdminStudentPerformanceAnalytics"],
    }),

    // Get available versions for a student
    getStudentVersions: builder.query({
      query: ({ studentId, courseId, moduleId }) => {
        let url = `/admin-student-performance-analytics/student/${studentId}/versions`;
        const params = new URLSearchParams();
        
        if (courseId) params.append("courseId", courseId);
        if (moduleId) params.append("moduleId", moduleId);
        
        const queryString = params.toString();
        return queryString ? `${url}?${queryString}` : url;
      },
      providesTags: ["AdminStudentPerformanceAnalytics"],
    }),
    
    // Get all enrolled students
    getEnrolledStudents: builder.query({
      query: ({ courseId, status, role, userId, creatorType }) => {
        let url = `/enrolled-students`;
        const params = new URLSearchParams();
        
        if (courseId) params.append("courseId", courseId);
        if (status) params.append("status", status);
        if (role) params.append("role", role);
        if (userId) params.append("userId", userId);
        if (creatorType) params.append("creatorType", creatorType);
        
        const queryString = params.toString();
        return queryString ? `${url}?${queryString}` : url;
      },
      providesTags: ["EnrolledStudents"],
    }),
    
    // Get course enrollments for a specific student
    getStudentEnrollments: builder.query({
      query: ({ studentId, role, userId, creatorType }) => {
        let url = `/enrolled-students/student/${studentId}`;
        const params = new URLSearchParams();
        
        if (role) params.append("role", role);
        if (userId) params.append("userId", userId);
        if (creatorType) params.append("creatorType", creatorType);
        
        const queryString = params.toString();
        return queryString ? `${url}?${queryString}` : url;
      },
      providesTags: (result, error, { studentId }) => [
        { type: "EnrolledStudents", id: studentId }
      ],
    }),
    
    // Get modules for a specific course
    getModulesByCourse: builder.query({
      query: (courseId) => `/enrolled-students/course/${courseId}/modules`,
      providesTags: (result, error, courseId) => [
        { type: "EnrolledStudents", id: `course-${courseId}-modules` }
      ],
    }),
    
    // Get topics for a specific module
    getTopicsByModule: builder.query({
      query: (moduleId) => `/enrolled-students/module/${moduleId}/topics`,
      providesTags: (result, error, moduleId) => [
        { type: "EnrolledStudents", id: `module-${moduleId}-topics` }
      ],
    }),
    
    // Get error analysis and improvement suggestions
    getErrorAnalysis: builder.query({
      query: ({ studentId, courseId, moduleId, version }) => {
        let url = `/admin-student-performance-analytics/student/${studentId}/error-analysis`;
        const params = new URLSearchParams();
        
        if (courseId) params.append("courseId", courseId);
        if (moduleId) params.append("moduleId", moduleId);
        if (version) params.append("version", version);
        
        const queryString = params.toString();
        return queryString ? `${url}?${queryString}` : url;
      },
      providesTags: ["AdminStudentPerformanceAnalytics"],
    }),
  }),
});

export const {
  useGetStudentAnalyticsQuery,
  useGetVersionComparisonQuery,
  useGetModuleCompletionQuery,
  useGetTopicStrengthAnalysisQuery,
  useGetTimeSpentAnalysisQuery,
  useGetStudentVersionsQuery,
  useGetEnrolledStudentsQuery,
  useGetStudentEnrollmentsQuery,
  useGetModulesByCourseQuery,
  useGetTopicsByModuleQuery,
  useGetErrorAnalysisQuery,
} = adminStudentPerformanceAnalyticsApi;
