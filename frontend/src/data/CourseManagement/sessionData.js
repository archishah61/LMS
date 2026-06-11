const sessionData = {
  id: "session",
  name: "Session",
  description:
    "The Session API provides endpoints to manage sessions within courses. These endpoints allow you to create, read, update, delete, and manage the status and sequence of sessions.",
  endpoints: [
    {
      id: "create-session",
      name: "Create Session",
      method: "POST",
      url: "/session/create",
      description: "Create a new session for a course.",
      parameters: [
        { name: "course_id", type: "string", required: true, description: "Public hash of the course.", example: "abc123" },
        { name: "title", type: "string", required: true, description: "Title of the session.", example: "Getting Started" },
        { name: "chpater_description", type: "string", required: false, description: "Description of the session.", example: "This session introduces the basics..." },
        { name: "min_time_in_minute", type: "number", required: false, description: "Minimum time in minutes for the session.", example: 30 },
        { name: "sessionImage", type: "file", required: false, description: "Image file for the session.", example: "session1.jpg" },
        { name: "status", type: "string", required: false, description: "Status of the session (active/inactive).", example: "active" },
        { name: "created_by", type: "number", required: true, description: "ID of the user creating the session.", example: 1 },
        { name: "updated_by", type: "number", required: true, description: "ID of the user updating the session.", example: 1 }
      ],
      responses: [
        {
          status: 201,
          description: "Session created successfully",
          example: {
            success: true,
            session: {
              id: 1,
              public_hash: "sess123",
              course_id: 1,
              title: "Getting Started",
              chpater_description: "This session introduces the basics...",
              image_name: "session1.jpg",
              image_path: "/session/images/session1.jpg",
              status: "active",
              sequence_no: 1,
              min_time_in_minute: 30,
              created_by: 1,
              updated_by: 1,
              created_at: "2025-05-09T05:48:55.000Z",
              updated_at: "2025-05-09T05:48:55.000Z"
            }
          }
        },
        {
          status: 400,
          description: "Validation error",
          example: { success: false, message: "Course not found" }
        }
      ]
    },
    {
      id: "get-all-sessions",
      name: "Get All Sessions",
      method: "GET",
      url: "/session/",
      description: "Get a list of all sessions in the system.",
      responses: [
        {
          status: 200,
          description: "Successfully retrieved all sessions",
          example: {
            success: true,
            sessions: [
              {
                id: 1,
                public_hash: "sess123",
                course_id: 1,
                title: "Getting Started",
                chpater_description: "This session introduces the basics...",
                image_name: "session1.jpg",
                image_path: "/session/images/session1.jpg",
                status: "active",
                sequence_no: 1,
                min_time_in_minute: 30,
                created_by: 1,
                updated_by: 1,
                created_at: "2025-05-09T05:48:55.000Z",
                updated_at: "2025-05-09T05:48:55.000Z"
              }
            ]
          }
        }
      ]
    },
    {
      id: "get-sessions-by-course",
      name: "Get Sessions By Course",
      method: "GET",
      url: "/session/course/:courseId",
      description: "Get all sessions for a specific course.",
      parameters: [
        { name: "courseId", type: "string", required: true, inPath: true, description: "Public hash of the course.", example: "abc123" }
      ],
      responses: [
        {
          status: 200,
          description: "Sessions retrieved successfully",
          example: {
            success: true,
            sessions: [
              {
                id: 1,
                public_hash: "sess123",
                course_id: 1,
                title: "Getting Started",
                chpater_description: "This session introduces the basics...",
                image_name: "session1.jpg",
                image_path: "/session/images/session1.jpg",
                status: "active",
                sequence_no: 1,
                min_time_in_minute: 30,
                created_by: 1,
                updated_by: 1,
                created_at: "2025-05-09T05:48:55.000Z",
                updated_at: "2025-05-09T05:48:55.000Z"
              }
            ]
          }
        },
        {
          status: 404,
          description: "Course not found or has no sessions",
          example: { success: false, message: "Course not found or has no sessions" }
        }
      ]
    },
    {
      id: "get-session-by-id",
      name: "Get Session By ID",
      method: "GET",
      url: "/session/:id",
      description: "Get a specific session by its public hash.",
      parameters: [
        { name: "id", type: "string", required: true, inPath: true, description: "Public hash of the session.", example: "sess123" }
      ],
      responses: [
        {
          status: 200,
          description: "Session retrieved successfully",
          example: {
            id: 1,
            public_hash: "sess123",
            course_id: 1,
            title: "Getting Started",
            chpater_description: "This session introduces the basics...",
            image_name: "session1.jpg",
            image_path: "/session/images/session1.jpg",
            status: "active",
            sequence_no: 1,
            min_time_in_minute: 30,
            created_by: 1,
            updated_by: 1,
            created_at: "2025-05-09T05:48:55.000Z",
            updated_at: "2025-05-09T05:48:55.000Z"
          }
        },
        {
          status: 404,
          description: "Session not found",
          example: { success: false, message: "Session not found" }
        }
      ]
    },
    {
      id: "update-session",
      name: "Update Session",
      method: "PUT",
      url: "/session/update/:id",
      description: "Update an existing session by its public hash.",
      parameters: [
        { name: "id", type: "string", required: true, inPath: true, description: "Public hash of the session.", example: "sess123" },
        { name: "title", type: "string", required: false, description: "Updated title of the session.", example: "Advanced Session" },
        { name: "chpater_description", type: "string", required: false, description: "Updated description.", example: "This session covers advanced topics..." },
        { name: "sessionImage", type: "file", required: false, description: "Updated image file for the session.", example: "session2.jpg" }
      ],
      responses: [
        {
          status: 200,
          description: "Session updated successfully",
          example: { success: true, session: { id: 1, title: "Advanced Session" } }
        },
        {
          status: 404,
          description: "Session not found",
          example: { success: false, message: "Session not found" }
        }
      ]
    },
    {
      id: "delete-session",
      name: "Delete Session",
      method: "DELETE",
      url: "/session/delete/:id",
      description: "Delete a session by its public hash.",
      parameters: [
        { name: "id", type: "string", required: true, inPath: true, description: "Public hash of the session.", example: "sess123" }
      ],
      responses: [
        {
          status: 200,
          description: "Session deleted successfully",
          example: { success: true, message: "Session deleted successfully" }
        },
        {
          status: 404,
          description: "Session not found",
          example: { success: false, message: "Session not found" }
        }
      ]
    },
    {
      id: "update-session-status",
      name: "Update Session Status",
      method: "PATCH",
      url: "/session/:sessionId/status",
      description: "Update the status (active/inactive) of a session.",
      parameters: [
        { name: "sessionId", type: "string", required: true, inPath: true, description: "ID of the session.", example: "1" },
        { name: "status", type: "string", required: true, description: "New status for the session (active/inactive).", example: "inactive" }
      ],
      responses: [
        {
          status: 200,
          description: "Session status updated successfully",
          example: { message: "Session deactivated successfully" }
        },
        {
          status: 400,
          description: "Invalid status value",
          example: { message: "Invalid status value. Status must be 'active' or 'inactive'." }
        },
        {
          status: 404,
          description: "Session not found",
          example: { message: "Session not found" }
        }
      ]
    },
    {
      id: "update-session-sequence",
      name: "Update Session Sequence",
      method: "PUT",
      url: "/session/session/sequence",
      description: "Update the sequence/order of sessions.",
      parameters: [
        { name: "sequence", type: "array", required: true, description: "Array of session IDs in the desired order.", example: [3, 1, 2] }
      ],
      responses: [
        {
          status: 200,
          description: "Sessions sequence updated successfully",
          example: { message: "Session sequence updated successfully" }
        },
        {
          status: 400,
          description: "Invalid sequence format",
          example: { message: "Invalid sequence format" }
        }
      ]
    }
  ]
};

export default sessionData; 