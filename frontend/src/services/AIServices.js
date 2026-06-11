import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken, getStudentToken } from "./CookieService";

export const aiApi = createApi({
  reducerPath: "aiApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/`, // ensure this leads to the base server URL
    prepareHeaders: (headers, { getState, extra, endpoint }) => {

      let token = extra?.access_token;

      if (endpoint !== "doYourOwnCourseGenerateAndSave" && endpoint !== "getUserMathSolverHistory") {
        if (!token) {
          let storedToken = getStudentToken();
          if (!storedToken?.access_token) {
            storedToken = getAdminToken();
          }
          token = storedToken?.access_token;
        }

        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }

      return headers;
    },
  }),
  endpoints: (builder) => ({
    solveMath: builder.mutation({
      query: (formData) => {
        return {
          url: "solve-math",
          method: "POST",
          body: formData,
        };
      },
    }),

    getUserMathSolverHistory: builder.query({
      query: ({ access_token }) => ({
        url: "/solve-math/history",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),

    chatWithBot: builder.mutation({
      query: (formData) => {
        return {
          url: "chat-bot",
          method: "POST",
          body: formData,
        };
      },
    }),
    contentGenerator: builder.mutation({
      query: (formData) => {
        return {
          url: "generate-content",
          method: "POST",
          body: formData,
        };
      },
    }),
    contentGeneratorByType: builder.mutation({
      query: (formData) => {
        return {
          url: "generate-content-by-type",
          method: "POST",
          body: formData,
        };
      },
    }),
    voiceAssistant: builder.mutation({
      query: (formData) => {
        return {
          url: "voice-assistant",
          method: "POST",
          body: formData,
        };
      },
    }),
    learningPath: builder.mutation({
      query: (formData) => {
        return {
          url: "learning-path",
          method: "POST",
          body: formData,
        };
      },
    }),
    goalSuggestion: builder.mutation({
      query: (formData) => {
        const params = new URLSearchParams();
        params.append('interest', formData.interest);
        if (formData.industry) params.append('industry', formData.industry);

        return {
          url: `goal-suggestions?${params.toString()}`,
          method: "POST"
        };
      },
    }),

    // Learning Path Agent Endpoints
    initializeLearningPathAgent: builder.mutation({
      query: (data) => {
        return {
          url: "learning-path-agent/initialize",
          method: "POST",
          body: data, // { goal: "JEE Main" }
        };
      },
    }),

    processLearningPathResponses: builder.mutation({
      query: (data) => {
        return {
          url: "learning-path-agent/process-responses",
          method: "POST",
          body: data, // { sessionId, goal, responses, step }
        };
      },
    }),

    generateLearningPathRoadmap: builder.mutation({
      query: (data) => {
        return {
          url: "learning-path-agent/generate-roadmap",
          method: "POST",
          body: data, // { sessionId, goal, allResponses, userProfile }
        };
      },
    }),

    resumeLearningPath: builder.mutation({
      query: (sessionId) => {
        return {
          url: `learning-path-agent/${sessionId}/resume`,
          method: "POST",
        };
      },
    }),

    getLearningPaths: builder.query({
      query: () => {
        return {
          url: `learning-path-agent/history`,
          method: "GET"
        };
      },
    }),

    getLearningPathDetails: builder.query({
      query: (sessionId) => {
        return {
          url: `learning-path-agent/${sessionId}`,
          method: "GET"
        };
      },
    }),

    getExamUpdates: builder.query({
      query: (examName) => {
        const params = new URLSearchParams();
        params.append('examName', examName);

        return {
          url: `learning-path-agent/exam-updates?${params.toString()}`,
          method: "GET"
        };
      },
    }),

    adminCourseStructureGenerate: builder.mutation({
      query: (data) => {
        return {
          url: "/generate-course-structure",
          method: "POST",
          body: data,
        };
      },
    }),

    adminCourseStructureRegenerate: builder.mutation({
      query: (data) => {
        return {
          url: "/regenerate-course-structure",
          method: "POST",
          body: data,
        };
      },
    }),

    doYourOwnCourseStructureGenerate: builder.mutation({
      query: (data) => {
        return {
          url: "/custom-course-structure",
          method: "POST",
          body: data,
        };
      },
    }),

    doYourOwnCourseGenerateAndSave: builder.mutation({
      query: ({ data, access_token }) => {
        return {
          url: "/custom-course",
          method: "POST",
          body: data,
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
    }),

    // New AI Course Generator (Quick / Complete modes)
    newCourseGenerate: builder.mutation({
      query: (formData) => {
        return {
          url: "/new-generate-course",
          method: "POST",
          body: formData,
        };
      },
    }),

    newCourseSave: builder.mutation({
      query: (data) => {
        return {
          url: "/new-save-course",
          method: "POST",
          body: data,
        };
      },
    }),

    newCourseGenerateContent: builder.mutation({
      query: (data) => {
        return {
          url: "/new-generate-course-content",
          method: "POST",
          body: data,
        };
      },
    }),

    newCourseSaveContent: builder.mutation({
      query: (data) => {
        return {
          url: "/new-save-course-content",
          method: "POST",
          body: data,
        };
      },
    }),

    newCourseRegenerateNode: builder.mutation({
      query: (data) => {
        return {
          url: "/new-regenerate-node",
          method: "POST",
          body: data,
        };
      },
    }),

    newCourseRegenerateNodeContent: builder.mutation({
      query: (data) => {
        return {
          url: "/new-regenerate-node-content",
          method: "POST",
          body: data,
        };
      },
    }),

    newCourseSaveQuizContent: builder.mutation({
      query: (data) => {
        return {
          url: "/new-save-quiz-content",
          method: "POST",
          body: data,
        };
      },
    }),

    newCourseRegenerateQuiz: builder.mutation({
      query: (data) => {
        return {
          url: "/new-regenerate-quiz",
          method: "POST",
          body: data,
        };
      },
    }),

    newCourseSaveAssignmentContent: builder.mutation({
      query: (data) => {
        return {
          url: "/new-save-assignment-content",
          method: "POST",
          body: data,
        };
      },
    }),

    newCourseRegenerateAssignment: builder.mutation({
      query: (data) => {
        return {
          url: "/new-regenerate-assignment",
          method: "POST",
          body: data,
        };
      },
    }),

    evaluateAnswer: builder.mutation({
      query: ({ data, access_token }) => {
        return {
          url: "/evaluate",
          method: "POST",
          body: data,
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        };
      },
    }),

  }),
});

export const {
  useSolveMathMutation,
  useGetUserMathSolverHistoryQuery,
  useChatWithBotMutation,
  useContentGeneratorMutation,
  useContentGeneratorByTypeMutation,
  useVoiceAssistantMutation,
  useLearningPathMutation,
  useGoalSuggestionMutation,

  // Learning Path Agent Hooks
  useInitializeLearningPathAgentMutation,
  useProcessLearningPathResponsesMutation,
  useGenerateLearningPathRoadmapMutation,
  useResumeLearningPathMutation,
  useGetLearningPathsQuery,
  useGetLearningPathDetailsQuery,
  useGetExamUpdatesQuery,

  useAdminCourseStructureRegenerateMutation,
  useAdminCourseStructureGenerateMutation,

  // Do Your Own Course
  useDoYourOwnCourseGenerateAndSaveMutation,
  useDoYourOwnCourseStructureGenerateMutation,

  // New Course Generator
  useNewCourseGenerateMutation,
  useNewCourseSaveMutation,
  useNewCourseGenerateContentMutation,
  useNewCourseSaveContentMutation,
  useNewCourseRegenerateNodeMutation,
  useNewCourseRegenerateNodeContentMutation,
  useNewCourseSaveQuizContentMutation,
  useNewCourseRegenerateQuizMutation,
  useNewCourseSaveAssignmentContentMutation,
  useNewCourseRegenerateAssignmentMutation,

  // Quiz Answer Check
  useEvaluateAnswerMutation,
} = aiApi;