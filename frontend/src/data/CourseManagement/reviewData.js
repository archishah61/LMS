const reviewData = {
  id: "review",
  name: "Review",
  description:
    "The Review API provides endpoints to manage course reviews. These endpoints allow you to create, read, update, and delete reviews for courses.",
  endpoints: [
    {
      id: "create-review",
      name: "Create Review",
      method: "POST",
      url: "/reviews/create",
      description: "Create a new review for a course.",
      parameters: [
        { name: "course_id", type: "number", required: true, description: "ID of the course being reviewed.", example: 1 },
        { name: "user_id", type: "number", required: true, description: "ID of the user submitting the review.", example: 2 },
        { name: "review", type: "string", required: false, description: "Text content of the review.", example: "Great course!" },
        { name: "rating", type: "number", required: true, description: "Rating for the course (1-5).", example: 5 }
      ],
      responses: [
        {
          status: 201,
          description: "Review created successfully",
          example: {
            message: "Review created successfully",
            review: {
              id: 1,
              course_id: 1,
              user_id: 2,
              review: "Great course!",
              rating: 5,
              created_by: 2,
              updated_by: 2,
              created_at: "2025-05-09T05:48:55.000Z",
              updated_at: "2025-05-09T05:48:55.000Z"
            }
          }
        },
        {
          status: 400,
          description: "Validation error",
          example: { message: "Rating must be between 1 and 5" }
        },
        {
          status: 409,
          description: "Duplicate review",
          example: { message: "You have already reviewed this course." }
        }
      ]
    },
    {
      id: "get-all-reviews",
      name: "Get All Reviews",
      method: "GET",
      url: "/reviews/",
      description: "Get a list of all reviews in the system.",
      responses: [
        {
          status: 200,
          description: "Successfully retrieved all reviews",
          example: {
            message: "Reviews fetched successfully",
            reviews: [
              {
                id: 1,
                course_id: 1,
                user_id: 2,
                review: "Great course!",
                rating: 5,
                created_by: 2,
                updated_by: 2,
                created_at: "2025-05-09T05:48:55.000Z",
                updated_at: "2025-05-09T05:48:55.000Z"
              }
            ]
          }
        }
      ]
    },
    {
      id: "get-review-by-id",
      name: "Get Review By ID",
      method: "GET",
      url: "/reviews/:id",
      description: "Get a specific review by its ID.",
      parameters: [
        { name: "id", type: "number", required: true, inPath: true, description: "ID of the review.", example: 1 }
      ],
      responses: [
        {
          status: 200,
          description: "Review retrieved successfully",
          example: {
            review: {
              id: 1,
              course_id: 1,
              user_id: 2,
              review: "Great course!",
              rating: 5,
              created_by: 2,
              updated_by: 2,
              created_at: "2025-05-09T05:48:55.000Z",
              updated_at: "2025-05-09T05:48:55.000Z"
            }
          }
        },
        {
          status: 404,
          description: "Review not found",
          example: { error: "Review not found." }
        }
      ]
    },
    {
      id: "get-reviews-by-course",
      name: "Get Reviews By Course",
      method: "GET",
      url: "/reviews/course/:courseId",
      description: "Get all reviews for a specific course (by public_hash).",
      parameters: [
        { name: "courseId", type: "string", required: true, inPath: true, description: "Public hash of the course.", example: "abc123" }
      ],
      responses: [
        {
          status: 200,
          description: "Reviews retrieved successfully",
          example: {
            reviews: [
              {
                id: 1,
                course_id: 1,
                user_id: 2,
                review: "Great course!",
                rating: 5,
                created_by: 2,
                updated_by: 2,
                created_at: "2025-05-09T05:48:55.000Z",
                updated_at: "2025-05-09T05:48:55.000Z",
                full_name: "John Doe"
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
      id: "update-review",
      name: "Update Review",
      method: "PUT",
      url: "/reviews/update/:id",
      description: "Update an existing review by its ID.",
      parameters: [
        { name: "id", type: "number", required: true, inPath: true, description: "ID of the review.", example: 1 },
        { name: "review", type: "string", required: false, description: "Updated review text.", example: "Updated review text." },
        { name: "rating", type: "number", required: false, description: "Updated rating (1-5).", example: 4 },
        { name: "user_id", type: "number", required: true, description: "ID of the user updating the review.", example: 2 }
      ],
      responses: [
        {
          status: 200,
          description: "Review updated successfully",
          example: {
            message: "Review updated successfully",
            review: {
              id: 1,
              course_id: 1,
              user_id: 2,
              review: "Updated review text.",
              rating: 4,
              created_by: 2,
              updated_by: 2,
              created_at: "2025-05-09T05:48:55.000Z",
              updated_at: "2025-05-09T06:00:00.000Z"
            }
          }
        },
        {
          status: 400,
          description: "Validation error",
          example: { message: "Rating must be between 1 and 5" }
        },
        {
          status: 404,
          description: "Review not found",
          example: { message: "Review not found" }
        }
      ]
    },
    {
      id: "delete-review",
      name: "Delete Review",
      method: "DELETE",
      url: "/reviews/delete/:id",
      description: "Delete a review by its ID.",
      parameters: [
        { name: "id", type: "number", required: true, inPath: true, description: "ID of the review.", example: 1 }
      ],
      responses: [
        {
          status: 200,
          description: "Review deleted successfully",
          example: { message: "Review deleted successfully" }
        },
        {
          status: 404,
          description: "Review not found",
          example: { message: "Review not found or error during deletion" }
        }
      ]
    }
  ]
};

export default reviewData; 