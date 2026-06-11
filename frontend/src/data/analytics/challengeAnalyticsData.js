const challengeAnalyticsData = {
  id: "challenge-analytics",
  name: "Challenge Analytics",
  description:
    "The Challenge Analytics API provides endpoints to retrieve analytics and statistics about challenges, including completion rates, user learning overview, and average attempts required to complete challenges.",
  endpoints: [
    {
      id: "get-completion-stats-across-all-challenges",
      name: "Get Completion Stats Across All Challenges",
      method: "GET",
      url: "/reporting/challenge-analytics/comletion-stats-all-challenge",
      description: "Get completion statistics for all challenges.",
      parameters: [],
      responses: [
        {
          status: 200,
          description: "Successfully retrieved challenge completion stats.",
          example: {
            "success": true,
            "data": [
              {
                "challenge_id": 2,
                "challenge_name": "Web Development Basics",
                "total_users": 4,
                "completed_users": 4,
                "completion_rate": 100
              },
              {
                "challenge_id": 5,
                "challenge_name": "Ancient Civilizations",
                "total_users": 2,
                "completed_users": 2,
                "completion_rate": 100
              },
              {
                "challenge_id": 4,
                "challenge_name": "Chemistry Fundamentals",
                "total_users": 5,
                "completed_users": 4,
                "completion_rate": 80
              },
              {
                "challenge_id": 11,
                "challenge_name": "Pop Culture",
                "total_users": 4,
                "completed_users": 3,
                "completion_rate": 75
              },
              {
                "challenge_id": 9,
                "challenge_name": "Python Basics",
                "total_users": 7,
                "completed_users": 5,
                "completion_rate": 71.4286
              },
              {
                "challenge_id": 6,
                "challenge_name": "Basic Arithmetic",
                "total_users": 5,
                "completed_users": 3,
                "completion_rate": 60
              },
              {
                "challenge_id": 7,
                "challenge_name": "Animal Kingdom",
                "total_users": 9,
                "completed_users": 5,
                "completion_rate": 55.5556
              },
              {
                "challenge_id": 1,
                "challenge_name": "JavaScript Fundamentals Challenge",
                "total_users": 8,
                "completed_users": 4,
                "completion_rate": 50
              },
              {
                "challenge_id": 3,
                "challenge_name": "Algebra Mastery Challenge",
                "total_users": 5,
                "completed_users": 2,
                "completion_rate": 40
              },
              {
                "challenge_id": 10,
                "challenge_name": "Synonyms & Antonyms",
                "total_users": 5,
                "completed_users": 2,
                "completion_rate": 40
              },
              {
                "challenge_id": 8,
                "challenge_name": "Ancient Wonders",
                "total_users": 5,
                "completed_users": 0,
                "completion_rate": 0
              }
            ]
          }
        },
        {
          status: 500,
          description: "Internal server error.",
          example: { success: false, message: "Internal server error" }
        }
      ]
    },
    {
      id: "get-user-learning-overview",
      name: "Get User Learning Overview",
      method: "GET",
      url: "/reporting/challenge-analytics/learning-overview",
      description: "Get a comprehensive overview of user learning across challenges.",
      parameters: [],
      responses: [
        {
          status: 200,
          description: "Successfully retrieved user learning overview.",
          example: {
            "success": true,
            "data": [
              {
                "user_id": 1,
                "user_name": "John Doe",
                "total_challenges_attempted": 8,
                "total_challenges_completed": 7,
                "total_points_earned": 3200,
                "average_progress_percentage": 97,
                "max_streak_count": null
              },
              {
                "user_id": 3,
                "user_name": "Alex Johnson",
                "total_challenges_attempted": 2,
                "total_challenges_completed": 1,
                "total_points_earned": 600,
                "average_progress_percentage": 78,
                "max_streak_count": null
              },
              {
                "user_id": 4,
                "user_name": "Sarah Williams",
                "total_challenges_attempted": 9,
                "total_challenges_completed": 2,
                "total_points_earned": 1250,
                "average_progress_percentage": 34.22222222222222,
                "max_streak_count": null
              },
              {
                "user_id": 5,
                "user_name": "Michael Brown",
                "total_challenges_attempted": 2,
                "total_challenges_completed": 2,
                "total_points_earned": 1000,
                "average_progress_percentage": 100,
                "max_streak_count": null
              },
              {
                "user_id": 6,
                "user_name": "Emily Davis",
                "total_challenges_attempted": 4,
                "total_challenges_completed": 2,
                "total_points_earned": 1150,
                "average_progress_percentage": 65,
                "max_streak_count": null
              },
              {
                "user_id": 7,
                "user_name": "David Wilson",
                "total_challenges_attempted": 3,
                "total_challenges_completed": 0,
                "total_points_earned": 0,
                "average_progress_percentage": 15,
                "max_streak_count": null
              },
              {
                "user_id": 8,
                "user_name": "Olivia Martinez",
                "total_challenges_attempted": 6,
                "total_challenges_completed": 1,
                "total_points_earned": 400,
                "average_progress_percentage": 47.833333333333336,
                "max_streak_count": null
              },
              {
                "user_id": 9,
                "user_name": "William Taylor",
                "total_challenges_attempted": 3,
                "total_challenges_completed": 2,
                "total_points_earned": 1000,
                "average_progress_percentage": 78.66666666666667,
                "max_streak_count": null
              },
              {
                "user_id": 10,
                "user_name": "Sophia Anderson",
                "total_challenges_attempted": 3,
                "total_challenges_completed": 2,
                "total_points_earned": 1250,
                "average_progress_percentage": 91,
                "max_streak_count": null
              },
              {
                "user_id": 11,
                "user_name": "James Moore",
                "total_challenges_attempted": 3,
                "total_challenges_completed": 1,
                "total_points_earned": 400,
                "average_progress_percentage": 33.333333333333336,
                "max_streak_count": null
              },
              {
                "user_id": 12,
                "user_name": "Ava Thomas",
                "total_challenges_attempted": 7,
                "total_challenges_completed": 3,
                "total_points_earned": 1600,
                "average_progress_percentage": 49.85714285714285,
                "max_streak_count": null
              },
              {
                "user_id": 13,
                "user_name": "Benjamin Jackson",
                "total_challenges_attempted": 3,
                "total_challenges_completed": 2,
                "total_points_earned": 950,
                "average_progress_percentage": 66.66666666666667,
                "max_streak_count": null
              },
              {
                "user_id": 14,
                "user_name": "Mia White",
                "total_challenges_attempted": 3,
                "total_challenges_completed": 1,
                "total_points_earned": 700,
                "average_progress_percentage": 33.333333333333336,
                "max_streak_count": null
              },
              {
                "user_id": 15,
                "user_name": "Daniel Harris",
                "total_challenges_attempted": 7,
                "total_challenges_completed": 7,
                "total_points_earned": 3700,
                "average_progress_percentage": 100,
                "max_streak_count": null
              },
              {
                "user_id": 16,
                "user_name": "Charlotte Lewis",
                "total_challenges_attempted": 1,
                "total_challenges_completed": 1,
                "total_points_earned": 700,
                "average_progress_percentage": 100,
                "max_streak_count": null
              },
              {
                "user_id": 17,
                "user_name": "Logan Clark",
                "total_challenges_attempted": 1,
                "total_challenges_completed": 0,
                "total_points_earned": 0,
                "average_progress_percentage": 32,
                "max_streak_count": null
              }
            ]
          }
        },
        {
          status: 500,
          description: "Internal server error.",
          example: { success: false, message: "Internal server error" }
        }
      ]
    },
    {
      id: "get-attempts-required-to-complete-challenges",
      name: "Get Attempts Required to Complete Challenges",
      method: "GET",
      url: "/reporting/challenge-analytics/average-attempts-per-challenge",
      description: "Get the average number of attempts required to complete each challenge.",
      parameters: [],
      responses: [
        {
          status: 200,
          description: "Successfully retrieved average attempts per challenge.",
          example: {
            "success": true,
            "data": [
              {
                "challenge_id": 7,
                "challenge_name": "Animal Kingdom",
                "average_attempts": 1.5
              },
              {
                "challenge_id": 5,
                "challenge_name": "Ancient Civilizations",
                "average_attempts": 1.3333
              },
              {
                "challenge_id": 11,
                "challenge_name": "Pop Culture",
                "average_attempts": 1.3333
              },
              {
                "challenge_id": 9,
                "challenge_name": "Python Basics",
                "average_attempts": 1.1667
              },
              {
                "challenge_id": 6,
                "challenge_name": "Basic Arithmetic",
                "average_attempts": 1
              },
              {
                "challenge_id": 3,
                "challenge_name": "Algebra Mastery Challenge",
                "average_attempts": 1
              },
              {
                "challenge_id": 4,
                "challenge_name": "Chemistry Fundamentals",
                "average_attempts": 0.7778
              },
              {
                "challenge_id": 1,
                "challenge_name": "JavaScript Fundamentals Challenge",
                "average_attempts": 0.7778
              },
              {
                "challenge_id": 2,
                "challenge_name": "Web Development Basics",
                "average_attempts": 0.4
              },
              {
                "challenge_id": 10,
                "challenge_name": "Synonyms & Antonyms",
                "average_attempts": 0
              }
            ]
          }
        },
        {
          status: 500,
          description: "Internal server error.",
          example: { success: false, message: "Internal server error" }
        }
      ]
    }
  ]
};

export default challengeAnalyticsData; 