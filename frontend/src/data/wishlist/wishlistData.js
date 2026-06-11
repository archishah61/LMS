const wishlistData = {
  id: "wishlist",
  name: "Wishlist",
  description:
    "The Wishlist API provides endpoints to manage users' course wishlists. These endpoints allow you to add courses to a wishlist, remove them, and retrieve a user's wishlist.",
  endpoints: [
    {
      id: "add-to-wishlist",
      name: "Add to Wishlist",
      method: "POST",
      url: "/wishlist/add",
      description: "Add a course to a user's wishlist.",
      parameters: [
        { name: "course_id", type: "number", required: true, description: "ID of the course to add.", example: 1 },
        { name: "user_id", type: "number", required: true, description: "ID of the user.", example: 2 }
      ],
      responses: [
        {
          status: 201,
          description: "Course added to wishlist successfully",
          example: {
            success: true,
            message: "Course added to wishlist successfully",
            data: {
              id: 1,
              course_id: 1,
              user_id: 2,
              created_by: 2,
              created_by_type: "admin",
              updated_by: 2,
              updated_by_type: "admin",
              created_at: "2025-05-09T05:48:55.000Z",
              updated_at: "2025-05-09T05:48:55.000Z"
            }
          }
        },
        {
          status: 409,
          description: "Course already in wishlist",
          example: { success: false, message: "Course is already in the wishlist." }
        },
        {
          status: 401,
          description: "Authentication required",
          example: { success: false, message: "Login is needed to add a course to the wishlist." }
        }
      ]
    },
    {
      id: "remove-from-wishlist",
      name: "Remove from Wishlist",
      method: "DELETE",
      url: "/wishlist/remove/",
      description: "Remove a course from a user's wishlist.",
      parameters: [
        { name: "course_id", type: "number", required: true, description: "ID of the course to remove.", example: 1 },
        { name: "user_id", type: "number", required: true, description: "ID of the user.", example: 2 }
      ],
      responses: [
        {
          status: 200,
          description: "Course removed from wishlist successfully",
          example: { success: true, message: "Course removed from wishlist" }
        },
        {
          status: 404,
          description: "Wishlist item not found",
          example: { success: false, message: "Wishlist item not found" }
        }
      ]
    },
    {
      id: "get-wishlist-by-user",
      name: "Get Wishlist by User",
      method: "GET",
      url: "/wishlist/:user_id",
      description: "Get all wishlist items for a user.",
      parameters: [
        { name: "user_id", type: "number", required: true, inPath: true, description: "ID of the user.", example: 2 }
      ],
      responses: [
        {
          status: 200,
          description: "Wishlist retrieved successfully",
          example: {
            success: true,
            data: [
              {
                id: 1,
                course_id: 1,
                user_id: 2,
                created_by: 2,
                created_by_type: "admin",
                updated_by: 2,
                updated_by_type: "admin",
                created_at: "2025-05-09T05:48:55.000Z",
                updated_at: "2025-05-09T05:48:55.000Z"
              }
            ]
          }
        },
        {
          status: 404,
          description: "User not found",
          example: { success: false, message: "User not found" }
        }
      ]
    }
  ]
};

export default wishlistData; 