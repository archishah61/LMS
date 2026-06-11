const userStreaksData = {
  id: "user-streaks",
  name: "User Streaks",
  description:
    "The User Streaks API provides endpoints to manage user streaks in the system. These endpoints allow you to get user streak information including current streak, longest streak, and missed days.",
  endpoints: [
    {
      id: "get-user-streak",
      name: "Get User Streak",
      method: "GET",
      url: "/user-streaks/:id",
      description: "Get streak information for a specific user. If no ID is provided, returns streak for the authenticated user.",
      parameters: [
        {
          name: "id",
          type: "number",
          required: false,
          inPath: true,
          description: "ID of the user. If not provided, uses authenticated user's ID.",
          example: 1
        }
      ],
      responses: [
        {
          status: 200,
          description: "Successfully retrieved user streak",
          example: {
            success: true,
            userStreak: {
              id: 1,
              user_id: 1,
              current_streak: 5,
              longest_streak: 10,
              last_completed_date: "2024-03-20T10:30:00.000Z",
              missed_days: 2,
              created_at: "2024-03-15T10:30:00.000Z",
              updated_at: "2024-03-20T10:30:00.000Z"
            }
          }
        },
        {
          status: 404,
          description: "User streak not found",
          example: {
            success: false,
            message: "User Streak not found."
          }
        }
      ]
    }
  ]
};

export default userStreaksData; 