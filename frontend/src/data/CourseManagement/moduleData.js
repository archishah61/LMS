const moduleData = {
  id: "module",
  name: "Module",
  description:
    "The Module API provides endpoints to manage modules within courses and sessions. These endpoints allow you to create, read, update, delete, and manage the status and sequence of modules.",
  endpoints: [
    {
      id: "create-module",
      name: "Create Module",
      method: "POST",
      url: "/module/create",
      description: "Create a new module for a course and session.",
      parameters: [
        { name: "course_id", type: "string", required: true, description: "Public hash of the course.", example: "abc123" },
        { name: "session_id", type: "string", required: true, description: "Public hash of the session.", example: "def456" },
        { name: "title", type: "string", required: true, description: "Title of the module.", example: "Introduction to React" },
        { name: "description", type: "string", required: false, description: "Detailed description of the module.", example: "This module covers the basics of React..." },
        { name: "duration_hours", type: "number", required: true, description: "Duration of the module in hours.", example: 2 },
        { name: "moduleImage", type: "file", required: false, description: "Image file for the module.", example: "module1.jpg" },
        { name: "created_by", type: "number", required: true, description: "ID of the user creating the module.", example: 1 },
        { name: "created_by_type", type: "string", required: true, description: "Type of user creating the module (admin/partner).", example: "admin" },
        { name: "updated_by", type: "number", required: true, description: "ID of the user updating the module.", example: 1 },
        { name: "updated_by_type", type: "string", required: true, description: "Type of user updating the module (admin/partner).", example: "admin" }
      ],
      responses: [
        {
          status: 201,
          description: "Module created successfully",
          example: {
            message: "Module created successfully",
            module: {
              id: 1,
              public_hash: "mod123",
              course_id: 1,
              session_id: 1,
              title: "Introduction to React",
              image: "/module/image/module1.jpg",
              description: "This module covers the basics of React...",
              sequence_no: 1,
              duration_hours: 2,
              status: "active",
              created_by: 1,
              created_by_type: "admin",
              updated_by: 1,
              updated_by_type: "admin",
              created_at: "2025-05-09T05:48:55.000Z",
              updated_at: "2025-05-09T05:48:55.000Z"
            }
          }
        },
        {
          status: 400,
          description: "Validation error",
          example: { error: "Negative values are not allowed for duration_hours." }
        }
      ]
    },
    {
      id: "get-modules-by-course",
      name: "Get Modules By Course",
      method: "GET",
      url: "/module/course/:course_id",
      description: "Get all modules for a specific course.",
      parameters: [
        { name: "course_id", type: "string", required: true, inPath: true, description: "Public hash of the course.", example: "abc123" }
      ],
      responses: [
        {
          status: 200,
          description: "Modules retrieved successfully",
          example: {
            message: "Modules retrieved successfully",
            modules: [
              {
                id: 1,
                public_hash: "mod123",
                course_id: 1,
                session_id: 1,
                title: "Introduction to React",
                image: "/module/image/module1.jpg",
                description: "This module covers the basics of React...",
                sequence_no: 1,
                duration_hours: 2,
                status: "active",
                created_by: 1,
                created_by_type: "admin",
                updated_by: 1,
                updated_by_type: "admin",
                created_at: "2025-05-09T05:48:55.000Z",
                updated_at: "2025-05-09T05:48:55.000Z"
              }
            ]
          }
        },
        {
          status: 404,
          description: "Course not found",
          example: { message: "Course not found" }
        }
      ]
    },
    {
      id: "get-modules-by-session",
      name: "Get Modules By Session",
      method: "GET",
      url: "/module/session/:session_id",
      description: "Get all modules for a specific session.",
      parameters: [
        { name: "session_id", type: "string", required: true, inPath: true, description: "Public hash of the session.", example: "def456" }
      ],
      responses: [
        {
          status: 200,
          description: "Modules retrieved successfully",
          example: {
            message: "Modules retrieved successfully",
            modules: [
              {
                id: 1,
                public_hash: "mod123",
                course_id: 1,
                session_id: 1,
                title: "Introduction to React",
                image: "/module/image/module1.jpg",
                description: "This module covers the basics of React...",
                sequence_no: 1,
                duration_hours: 2,
                status: "active",
                created_by: 1,
                created_by_type: "admin",
                updated_by: 1,
                updated_by_type: "admin",
                created_at: "2025-05-09T05:48:55.000Z",
                updated_at: "2025-05-09T05:48:55.000Z"
              }
            ]
          }
        },
        {
          status: 404,
          description: "Session not found",
          example: { message: "Session not found" }
        }
      ]
    },
    {
      id: "get-module-by-id",
      name: "Get Module By ID",
      method: "GET",
      url: "/module/:id",
      description: "Get a specific module by its public hash.",
      parameters: [
        { name: "id", type: "string", required: true, inPath: true, description: "Public hash of the module.", example: "mod123" }
      ],
      responses: [
        {
          status: 200,
          description: "Module retrieved successfully",
          example: {
            id: 1,
            public_hash: "mod123",
            course_id: 1,
            session_id: 1,
            title: "Introduction to React",
            image: "/module/image/module1.jpg",
            description: "This module covers the basics of React...",
            sequence_no: 1,
            duration_hours: 2,
            status: "active",
            created_by: 1,
            created_by_type: "admin",
            updated_by: 1,
            updated_by_type: "admin",
            created_at: "2025-05-09T05:48:55.000Z",
            updated_at: "2025-05-09T05:48:55.000Z"
          }
        },
        {
          status: 404,
          description: "Module not found",
          example: { message: "Module not found" }
        }
      ]
    },
    {
      id: "update-module",
      name: "Update Module",
      method: "PUT",
      url: "/module/update/:id",
      description: "Update an existing module by its public hash.",
      parameters: [
        { name: "id", type: "string", required: true, inPath: true, description: "Public hash of the module.", example: "mod123" },
        { name: "title", type: "string", required: false, description: "Updated title of the module.", example: "Advanced React" },
        { name: "description", type: "string", required: false, description: "Updated description.", example: "This module covers advanced React topics..." },
        { name: "duration_hours", type: "number", required: false, description: "Updated duration in hours.", example: 3 },
        { name: "moduleImage", type: "file", required: false, description: "Updated image file for the module.", example: "module2.jpg" },
        { name: "updated_by", type: "number", required: true, description: "ID of the user updating the module.", example: 1 },
        { name: "updated_by_type", type: "string", required: true, description: "Type of user updating the module (admin/partner).", example: "admin" }
      ],
      responses: [
        {
          status: 200,
          description: "Module updated successfully",
          example: { message: "Module updated successfully" }
        },
        {
          status: 404,
          description: "Module not found",
          example: { message: "Module not found" }
        }
      ]
    },
    {
      id: "delete-module",
      name: "Delete Module",
      method: "DELETE",
      url: "/module/delete/:id",
      description: "Delete a module by its public hash.",
      parameters: [
        { name: "id", type: "string", required: true, inPath: true, description: "Public hash of the module.", example: "mod123" }
      ],
      responses: [
        {
          status: 204,
          description: "Module deleted successfully",
          example: { message: "Module deleted successfully" }
        },
        {
          status: 404,
          description: "Module not found",
          example: { message: "Module not found" }
        }
      ]
    },
    {
      id: "update-module-status",
      name: "Update Module Status",
      method: "PATCH",
      url: "/module/:moduleId/status",
      description: "Update the status (active/inactive) of a module.",
      parameters: [
        { name: "moduleId", type: "string", required: true, inPath: true, description: "ID of the module.", example: "1" },
        { name: "status", type: "string", required: true, description: "New status for the module (active/inactive).", example: "inactive" }
      ],
      responses: [
        {
          status: 200,
          description: "Module status updated successfully",
          example: { message: "Module deactivated successfully" }
        },
        {
          status: 400,
          description: "Invalid status value",
          example: { message: "Invalid status value. Status must be 'active' or 'inactive'." }
        },
        {
          status: 404,
          description: "Module not found",
          example: { message: "Module not found" }
        }
      ]
    },
    {
      id: "update-module-sequence",
      name: "Update Module Sequence",
      method: "PUT",
      url: "/module/module/sequence",
      description: "Update the sequence/order of modules.",
      parameters: [
        { name: "sequence", type: "array", required: true, description: "Array of module IDs in the desired order.", example: [3, 1, 2] }
      ],
      responses: [
        {
          status: 200,
          description: "Modules sequence updated successfully",
          example: { message: "Modules sequence updated successfully" }
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

export default moduleData; 