const supportData = {
  id: "support",
  name: "Support",
  description:
    "The Support API provides endpoints to manage support tickets, replies, attachments, and resolution logs. These endpoints allow you to create, read, update, delete, and reply to support tickets, as well as manage attachments and resolution logs.",
  endpoints: [
    {
      id: "create-support-ticket",
      name: "Create Support Ticket",
      method: "POST",
      url: "/support/tickets",
      description: "Create a new support ticket.",
      parameters: [
        { name: "user_id", type: "number", required: true, description: "ID of the user creating the ticket.", example: 1 },
        { name: "title", type: "string", required: true, description: "Title of the support ticket.", example: "Cannot access course" },
        { name: "description", type: "string", required: true, description: "Detailed description of the issue.", example: "I am unable to access the course after payment." },
        { name: "category", type: "string", required: true, description: "Category of the issue (Technical, Billing, Course Content, Other).", example: "Technical" },
        { name: "status", type: "string", required: true, description: "Status of the ticket (OPEN, IN_PROGRESS, RESOLVED, CLOSED).", example: "OPEN" },
        { name: "course_id", type: "number", required: false, description: "ID of the related course (if any).", example: 2 },
        { name: "supportFile", type: "file", required: false, description: "Attachment(s) for the ticket.", example: "screenshot.png" }
      ],
      responses: [
        {
          status: 201,
          description: "Support ticket created successfully",
          example: {
            success: true,
            message: "Support ticket created successfully.",
            ticket: {
              id: 1,
              title: "Cannot access course",
              description: "I am unable to access the course after payment.",
              category: "Technical",
              status: "OPEN",
              user_id: 1,
              course_id: 2,
              is_active: true,
              created_at: "2025-05-09T05:48:55.000Z",
              updated_at: "2025-05-09T05:48:55.000Z",
              attachments: [
                {
                  id: 1,
                  file_url: "/support/attachment/screenshot.png",
                  file_type: "image/png",
                  ticket_id: 1,
                  reply_id: null,
                  uploaded_at: "2025-05-09T05:48:55.000Z"
                }
              ]
            }
          }
        },
        {
          status: 400,
          description: "Validation error",
          example: { success: false, message: "User, Title, and Description are required." }
        }
      ]
    },
    {
      id: "get-all-support-tickets",
      name: "Get All Support Tickets",
      method: "GET",
      url: "/support/tickets",
      description: "Get a list of all support tickets (with replies and attachments).",
      parameters: [
        { name: "status", type: "string", required: false, description: "Filter tickets by status (OPEN, IN_PROGRESS, RESOLVED, CLOSED).", example: "OPEN" }
      ],
      responses: [
        {
          status: 200,
          description: "Successfully retrieved all support tickets",
          example: {
            success: true,
            tickets: [
              {
                id: 1,
                title: "Cannot access course",
                description: "I am unable to access the course after payment.",
                category: "Technical",
                status: "OPEN",
                user_id: 1,
                course_id: 2,
                is_active: true,
                created_at: "2025-05-09T05:48:55.000Z",
                updated_at: "2025-05-09T05:48:55.000Z",
                SupportReplies: [
                  {
                    id: 1,
                    ticket_id: 1,
                    user_id: 1,
                    admin_id: null,
                    message: "We are looking into this issue.",
                    created_at: "2025-05-09T06:00:00.000Z",
                    updated_at: "2025-05-09T06:00:00.000Z",
                    attachments: []
                  }
                ],
                SupportAttachments: [
                  {
                    id: 1,
                    file_url: "/support/attachment/screenshot.png",
                    file_type: "image/png",
                    ticket_id: 1,
                    reply_id: null,
                    uploaded_at: "2025-05-09T05:48:55.000Z"
                  }
                ],
                User: {
                  id: 1,
                  full_name: "John Doe",
                  email: "john@example.com"
                },
                Course: {
                  id: 2,
                  title: "React for Beginners"
                }
              }
            ]
          }
        }
      ]
    },
    {
      id: "get-support-ticket-by-id",
      name: "Get Support Ticket By ID",
      method: "GET",
      url: "/support/tickets/:id",
      description: "Get a single support ticket with replies and attachments.",
      parameters: [
        { name: "id", type: "number", required: true, inPath: true, description: "ID of the support ticket.", example: 1 }
      ],
      responses: [
        {
          status: 200,
          description: "Support ticket retrieved successfully",
          example: {
            success: true,
            ticket: {
              id: 1,
              title: "Cannot access course",
              description: "I am unable to access the course after payment.",
              category: "Technical",
              status: "OPEN",
              user_id: 1,
              course_id: 2,
              is_active: true,
              created_at: "2025-05-09T05:48:55.000Z",
              updated_at: "2025-05-09T05:48:55.000Z",
              SupportReplies: [
                {
                  id: 1,
                  ticket_id: 1,
                  user_id: 1,
                  admin_id: null,
                  message: "We are looking into this issue.",
                  created_at: "2025-05-09T06:00:00.000Z",
                  updated_at: "2025-05-09T06:00:00.000Z",
                  attachments: []
                }
              ],
              SupportAttachments: [
                {
                  id: 1,
                  file_url: "/support/attachment/screenshot.png",
                  file_type: "image/png",
                  ticket_id: 1,
                  reply_id: null,
                  uploaded_at: "2025-05-09T05:48:55.000Z"
                }
              ],
              User: {
                id: 1,
                full_name: "John Doe",
                email: "john@example.com"
              },
              Course: {
                id: 2,
                title: "React for Beginners"
              }
            }
          }
        },
        {
          status: 404,
          description: "Ticket not found",
          example: { success: false, message: "Ticket not found." }
        }
      ]
    },
    {
      id: "update-support-ticket",
      name: "Update Support Ticket",
      method: "PUT",
      url: "/support/tickets/:id",
      description: "Update a support ticket (status, subject, etc.).",
      parameters: [
        { name: "id", type: "number", required: true, inPath: true, description: "ID of the support ticket.", example: 1 },
        { name: "title", type: "string", required: false, description: "Updated title.", example: "Issue with course access" },
        { name: "description", type: "string", required: false, description: "Updated description.", example: "Updated issue details..." },
        { name: "category", type: "string", required: false, description: "Updated category.", example: "Billing" },
        { name: "status", type: "string", required: false, description: "Updated status.", example: "IN_PROGRESS" }
      ],
      responses: [
        {
          status: 200,
          description: "Ticket updated successfully",
          example: {
            success: true,
            message: "Ticket updated successfully.",
            ticket: {
              id: 1,
              title: "Issue with course access",
              status: "IN_PROGRESS"
            }
          }
        },
        {
          status: 404,
          description: "Ticket not found",
          example: { success: false, message: "Ticket not found." }
        }
      ]
    },
    {
      id: "delete-support-ticket",
      name: "Delete Support Ticket",
      method: "DELETE",
      url: "/support/tickets/:id",
      description: "Delete a support ticket.",
      parameters: [
        { name: "id", type: "number", required: true, inPath: true, description: "ID of the support ticket.", example: 1 }
      ],
      responses: [
        {
          status: 200,
          description: "Ticket deleted successfully",
          example: { success: true, message: "Ticket deleted successfully." }
        },
        {
          status: 404,
          description: "Ticket not found",
          example: { success: false, message: "Ticket not found." }
        }
      ]
    },
    {
      id: "create-support-reply",
      name: "Create Support Reply",
      method: "POST",
      url: "/support/replies",
      description: "Add a reply to a support ticket.",
      parameters: [
        { name: "ticket_id", type: "number", required: true, description: "ID of the support ticket.", example: 1 },
        { name: "user_id", type: "number", required: false, description: "ID of the user replying.", example: 1 },
        { name: "admin_id", type: "number", required: false, description: "ID of the admin replying.", example: 2 },
        { name: "message", type: "string", required: true, description: "Reply message.", example: "We are looking into this issue." },
        { name: "supportFile", type: "file", required: false, description: "Attachment(s) for the reply.", example: "reply_screenshot.png" }
      ],
      responses: [
        {
          status: 201,
          description: "Reply added successfully",
          example: {
            success: true,
            message: "Reply added successfully.",
            reply: {
              id: 1,
              ticket_id: 1,
              user_id: 1,
              admin_id: null,
              message: "We are looking into this issue.",
              created_at: "2025-05-09T06:00:00.000Z",
              updated_at: "2025-05-09T06:00:00.000Z",
              attachments: [
                {
                  id: 2,
                  file_url: "/support/attachment/reply_screenshot.png",
                  file_type: "image/png",
                  ticket_id: 1,
                  reply_id: 1,
                  uploaded_at: "2025-05-09T06:00:00.000Z"
                }
              ]
            }
          }
        },
        {
          status: 400,
          description: "Validation error",
          example: { success: false, message: "ticket_id, message and one of UserId or AdminId are required." }
        }
      ]
    },
    {
      id: "delete-support-reply",
      name: "Delete Support Reply",
      method: "DELETE",
      url: "/support/replies/:id",
      description: "Delete a reply from a support ticket.",
      parameters: [
        { name: "id", type: "number", required: true, inPath: true, description: "ID of the reply.", example: 1 }
      ],
      responses: [
        {
          status: 200,
          description: "Reply deleted successfully",
          example: { success: true, message: "Reply deleted successfully." }
        },
        {
          status: 404,
          description: "Reply not found",
          example: { success: false, message: "Reply not found." }
        }
      ]
    }
  ]
};

export default supportData; 