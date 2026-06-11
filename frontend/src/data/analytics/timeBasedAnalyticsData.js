const timeBasedAnalyticsData = {
  id: "time-based-analytics",
  name: "Time-Based Analytics",
  description:
    "The Time-Based Analytics API provides endpoints to analyze and compare estimated versus actual course completion times, helping identify courses that may need time estimation adjustments.",
  endpoints: [
    {
      id: "get-estimated-vs-actual-completion",
      name: "Get Estimated vs Actual Completion Times",
      method: "GET",
      url: "/reporting/time-based-analytics/estimated-vs-actual-completion",
      description: "Get a comparison of estimated course hours versus average actual completion times for all completed courses.",
      parameters: [],
      responses: [
        {
          status: 200,
          description: "Successfully retrieved time-based analytics data.",
          example: {
            "success": true,
            "data": [
              {
                "course_id": 1,
                "course_title": "The Story of Us: Human Evolution",
                "estimated_hours": 360,
                "average_actual_hours": 4.50556667,
                "student_count": 3
              },
              {
                "course_id": 2,
                "course_title": "Exploring the Solar System: A Deep Dive into Planetary Science",
                "estimated_hours": 720,
                "average_actual_hours": 4.09165,
                "student_count": 2
              },
              {
                "course_id": 3,
                "course_title": "Gujarat's geography",
                "estimated_hours": 4320,
                "average_actual_hours": 2.6167,
                "student_count": 1
              },
              {
                "course_id": 4,
                "course_title": "The Indian Constitution: Foundations of Our Democracy",
                "estimated_hours": 300,
                "average_actual_hours": 3.65835,
                "student_count": 2
              },
              {
                "course_id": 5,
                "course_title": "Complete IELTS Preparation Course: Band 7+ Score",
                "estimated_hours": 2700,
                "average_actual_hours": 5.0833,
                "student_count": 1
              },
              {
                "course_id": 6,
                "course_title": "React Basics: A Comprehensive Introduction",
                "estimated_hours": 15,
                "average_actual_hours": 3.35666,
                "student_count": 5
              }
            ]
          }
        },
        {
          status: 500,
          description: "Internal server error.",
          example: {
            success: false,
            message: "Internal server error"
          }
        }
      ]
    }
  ]
};

export default timeBasedAnalyticsData; 