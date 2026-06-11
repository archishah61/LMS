const learningProgressData = {
  id: "learning-progress",
  name: "Learning Progress",
  description:
    "The Learning Progress API provides endpoints to track and retrieve user progress through courses, modules, topics, and slides. It supports marking content as completed, checking completion status, and tracking time spent.",
  endpoints: [
    {
      id: "check-topic-completion",
      name: "Check Topic Completion",
      method: "GET",
      url: "/progress/check-topic-completion",
      description: "Check if a user has completed a specific topic.",
      parameters: [
        { name: "userId", type: "number", required: true, inQuery: true, description: "User ID", example: 1 },
        { name: "topicId", type: "number", required: true, inQuery: true, description: "Topic ID", example: 10 }
      ],
      responses: [
        {
          status: 200,
          description: "Topic completion status returned",
          example: { success: true, completed: true }
        },
        {
          status: 404,
          description: "Topic or enrollment not found",
          example: { success: false, message: "Topic not found" }
        }
      ]
    },
    {
      id: "check-module-completion",
      name: "Check Module Completion",
      method: "GET",
      url: "/progress/check-module-completion",
      description: "Check if a user has completed a specific module.",
      parameters: [
        { name: "userId", type: "number", required: true, inQuery: true, description: "User ID", example: 1 },
        { name: "moduleId", type: "number", required: true, inQuery: true, description: "Module ID", example: 5 }
      ],
      responses: [
        {
          status: 200,
          description: "Module completion status returned",
          example: { success: true, completed: false }
        },
        {
          status: 404,
          description: "Module or enrollment not found",
          example: { success: false, message: "Module not found" }
        }
      ]
    },
    {
      id: "check-slide-completion",
      name: "Check Slide Completion",
      method: "GET",
      url: "/progress/check-slide-completion",
      description: "Check which slides are completed for a specific topic.",
      parameters: [
        { name: "userId", type: "number", required: true, inQuery: true, description: "User ID", example: 1 },
        { name: "topicId", type: "number", required: true, inQuery: true, description: "Topic ID", example: 10 }
      ],
      responses: [
        {
          status: 200,
          description: "Completed slides returned",
          example: { success: true, completedSlides: [101, 102] }
        },
        {
          status: 404,
          description: "Topic or enrollment not found",
          example: { success: false, message: "Topic not found" }
        }
      ]
    },
    {
      id: "get-accessible-modules",
      name: "Get Accessible Modules",
      method: "GET",
      url: "/progress/get-accessible-modules",
      description: "Get modules accessible to a user for a course.",
      parameters: [
        { name: "userId", type: "number", required: true, inQuery: true, description: "User ID", example: 1 },
        { name: "courseId", type: "number", required: true, inQuery: true, description: "Course ID", example: 2 }
      ],
      responses: [
        {
          status: 200,
          description: "Accessible modules returned",
          example: { success: true, modules: [{ id: 1, title: "Module 1", isAccessible: true }] }
        },
        {
          status: 404,
          description: "Enrollment not found",
          example: { success: false, message: "Enrollment not found for this user" }
        }
      ]
    },
    {
      id: "get-accessible-topics",
      name: "Get Accessible Topics",
      method: "GET",
      url: "/progress/get-accessible-topics",
      description: "Get topics accessible to a user for a module.",
      parameters: [
        { name: "userId", type: "number", required: true, inQuery: true, description: "User ID", example: 1 },
        { name: "moduleId", type: "number", required: true, inQuery: true, description: "Module ID", example: 5 }
      ],
      responses: [
        {
          status: 200,
          description: "Accessible topics returned",
          example: [{ id: 10, title: "Topic 1", isAccessible: true }]
        },
        {
          status: 404,
          description: "Module or enrollment not found",
          example: { success: false, message: "Module not found" }
        }
      ]
    },
    {
      id: "complete-content",
      name: "Complete Content",
      method: "POST",
      url: "/progress/complete-content",
      description: "Mark a topic or slide as completed for a user.",
      parameters: [
        { name: "userId", type: "number", required: true, inBody: true, description: "User ID", example: 1 },
        { name: "topicId", type: "number", required: true, inBody: true, description: "Topic ID", example: 10 },
        { name: "slideId", type: "number", required: false, inBody: true, description: "Slide ID (for slide content)", example: 101 }
      ],
      responses: [
        {
          status: 200,
          description: "Content marked as completed",
          example: { success: true, message: "Content marked as completed", completed: true, topicId: 10 }
        },
        {
          status: 404,
          description: "Topic or enrollment not found",
          example: { success: false, message: "Topic not found" }
        }
      ]
    },
    {
      id: "track-slide-completion",
      name: "Track Slide Completion",
      method: "POST",
      url: "/progress/complete-topic-slide",
      description: "Track completion of a slide for a user.",
      parameters: [
        { name: "userId", type: "number", required: true, inBody: true, description: "User ID", example: 1 },
        { name: "topicId", type: "number", required: true, inBody: true, description: "Topic ID", example: 10 },
        { name: "slideId", type: "number", required: true, inBody: true, description: "Slide ID", example: 101 }
      ],
      responses: [
        {
          status: 200,
          description: "Slide completion tracked successfully",
          example: { success: true, message: "Slide completion tracked successfully", data: { topicId: 10, progress: { total: 5, completed: 3, status: "in_progress", timeSpent: 120 } } }
        },
        {
          status: 404,
          description: "Topic, slide, or enrollment not found",
          example: { success: false, message: "Slide not found for this topic" }
        }
      ]
    },
    {
      id: "get-course-completion-progress",
      name: "Get Course Completion Progress",
      method: "GET",
      url: "/progress/check-course-completion",
      description: "Get the completion percentage for a course.",
      parameters: [
        { name: "userId", type: "number", required: true, inQuery: true, description: "User ID", example: 1 },
        { name: "courseId", type: "number", required: true, inQuery: true, description: "Course ID", example: 2 }
      ],
      responses: [
        {
          status: 200,
          description: "Course completion percentage returned",
          example: { success: true, completionPercentage: 80 }
        },
        {
          status: 404,
          description: "Enrollment not found",
          example: { success: false, message: "Enrollment not found for this user and course" }
        }
      ]
    },
    {
      id: "get-module-completion-progress",
      name: "Get Module Completion Progress",
      method: "GET",
      url: "/progress/get-module-completion-progress",
      description: "Get the completion percentage for a module.",
      parameters: [
        { name: "userId", type: "number", required: true, inQuery: true, description: "User ID", example: 1 },
        { name: "moduleId", type: "number", required: true, inQuery: true, description: "Module ID", example: 5 }
      ],
      responses: [
        {
          status: 200,
          description: "Module completion percentage returned",
          example: { completionPercentage: 60 }
        },
        {
          status: 404,
          description: "Module or enrollment not found",
          example: { success: false, message: "Module not found" }
        }
      ]
    },
    {
      id: "get-time-spent",
      name: "Get Time Spent",
      method: "GET",
      url: "/progress/topic/:topicId/get-time",
      description: "Get time spent by a user on a topic or slide.",
      parameters: [
        { name: "topicId", type: "number", required: true, inPath: true, description: "Topic ID", example: 10 },
        { name: "slideId", type: "number", required: false, inQuery: true, description: "Slide ID (optional)", example: 101 }
      ],
      responses: [
        {
          status: 200,
          description: "Time spent returned",
          example: { time_spent: 120 }
        },
        {
          status: 404,
          description: "Topic not found",
          example: { success: false, message: "Topic not found" }
        }
      ]
    },
    {
      id: "update-time-spent",
      name: "Update Time Spent",
      method: "POST",
      url: "/progress/topic/:topicId/update-time",
      description: "Update time spent by a user on a topic or slide.",
      parameters: [
        { name: "userId", type: "number", required: true, inBody: true, description: "User ID", example: 1 },
        { name: "topicId", type: "number", required: true, inPath: true, description: "Topic ID", example: 10 },
        { name: "moduleId", type: "number", required: true, inBody: true, description: "Module ID", example: 5 },
        { name: "timeSpent", type: "number", required: true, inBody: true, description: "Time spent in seconds", example: 120 },
        { name: "slideId", type: "number", required: false, inBody: true, description: "Slide ID (for slide content)", example: 101 }
      ],
      responses: [
        {
          status: 200,
          description: "Time spent updated",
          example: { success: true, time_spent: 120 }
        },
        {
          status: 404,
          description: "Topic or enrollment not found",
          example: { success: false, message: "Topic not found" }
        }
      ]
    }
  ]
};

export default learningProgressData; 