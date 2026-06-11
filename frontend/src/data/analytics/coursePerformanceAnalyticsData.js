const coursePerformanceAnalyticsData = {
  id: "course-performance-analytics",
  name: "Course Performance Analytics",
  description:
    "The Course Performance Analytics API provides endpoints to retrieve analytics and statistics about courses, including top enrolled courses, top rated courses, categories with most enrollments, and average time to complete courses.",
  endpoints: [
    {
      id: "get-top-enrolled-courses",
      name: "Get Top Enrolled Courses",
      method: "GET",
      url: "/reporting/course-performance/top-enrolled-courses",
      description: "Get a list of the top enrolled courses.",
      parameters: [],
      responses: [
        {
          status: 200,
          description: "Successfully retrieved top enrolled courses.",
          example: {
            "success": true,
            "data": [
              {
                "course_id": 5,
                "title": "Complete IELTS Preparation Course: Band 7+ Score",
                "thumbnail": "/course/thumbnail/IELTS_course_thumbnail.png",
                "averageTimeSpent": "101.67",
                "completedUsersCount": 1
              },
              {
                "course_id": 6,
                "title": "React Basics: A Comprehensive Introduction",
                "thumbnail": "/course/thumbnail/react_basics.png",
                "averageTimeSpent": "100.70",
                "completedUsersCount": 5
              },
              {
                "course_id": 2,
                "title": "Exploring the Solar System: A Deep Dive into Planetary Science",
                "thumbnail": "/course/thumbnail/solar_thumbnail.jpg",
                "averageTimeSpent": "98.20",
                "completedUsersCount": 2
              },
              {
                "course_id": 1,
                "title": "The Story of Us: Human Evolution",
                "thumbnail": "/course/thumbnail/evolutionthumbnail.jpg",
                "averageTimeSpent": "90.11",
                "completedUsersCount": 3
              },
              {
                "course_id": 4,
                "title": "The Indian Constitution: Foundations of Our Democracy",
                "thumbnail": "/course/thumbnail/constitution.png",
                "averageTimeSpent": "87.80",
                "completedUsersCount": 2
              },
              {
                "course_id": 3,
                "title": "Gujarat's geography",
                "thumbnail": "/course/thumbnail/ggthumbnail.jpg",
                "averageTimeSpent": "78.50",
                "completedUsersCount": 1
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
      id: "get-top-rated-courses",
      name: "Get Top Rated Courses",
      method: "GET",
      url: "/reporting/course-performance/top-rated-courses",
      description: "Get a list of the top rated courses.",
      parameters: [],
      responses: [
        {
          status: 200,
          description: "Successfully retrieved top rated courses.",
          example: {
            "success": true,
            "data": [
              {
                "course_id": 5,
                "title": "Complete IELTS Preparation Course: Band 7+ Score",
                "thumbnail": "/course/thumbnail/IELTS_course_thumbnail.png",
                "price": "399.00",
                "category_id": 5,
                "averageRating": 3.6,
                "reviewCount": 8
              },
              {
                "course_id": 6,
                "title": "React Basics: A Comprehensive Introduction",
                "thumbnail": "/course/thumbnail/react_basics.png",
                "price": "149.99",
                "category_id": 6,
                "averageRating": 3.5,
                "reviewCount": 10
              },
              {
                "course_id": 3,
                "title": "Gujarat's geography",
                "thumbnail": "/course/thumbnail/ggthumbnail.jpg",
                "price": "77.00",
                "category_id": 3,
                "averageRating": 3.2,
                "reviewCount": 5
              },
              {
                "course_id": 1,
                "title": "The Story of Us: Human Evolution",
                "thumbnail": "/course/thumbnail/evolutionthumbnail.jpg",
                "price": "100.00",
                "category_id": 1,
                "averageRating": 2.9,
                "reviewCount": 10
              },
              {
                "course_id": 2,
                "title": "Exploring the Solar System: A Deep Dive into Planetary Science",
                "thumbnail": "/course/thumbnail/solar_thumbnail.jpg",
                "price": "120.00",
                "category_id": 2,
                "averageRating": 2.8,
                "reviewCount": 6
              },
              {
                "course_id": 4,
                "title": "The Indian Constitution: Foundations of Our Democracy",
                "thumbnail": "/course/thumbnail/constitution.png",
                "price": "100.00",
                "category_id": 4,
                "averageRating": 2.5,
                "reviewCount": 4
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
      id: "get-categories-with-most-enrollments",
      name: "Get Categories With Most Enrollments",
      method: "GET",
      url: "/reporting/course-performance/categories-most-enrollments",
      description: "Get a list of course categories with the most enrollments.",
      parameters: [],
      responses: [
        {
          status: 200,
          description: "Successfully retrieved categories with most enrollments.",
          example: {
            "success": true,
            "data": [
              {
                "category_id": 6,
                "category_name": "Programming",
                "enrollmentCount": 7
              },
              {
                "category_id": 3,
                "category_name": "Geography",
                "enrollmentCount": 6
              },
              {
                "category_id": 5,
                "category_name": "Language & Global Skills",
                "enrollmentCount": 6
              },
              {
                "category_id": 4,
                "category_name": "History",
                "enrollmentCount": 4
              },
              {
                "category_id": 1,
                "category_name": "Human Evolution",
                "enrollmentCount": 4
              },
              {
                "category_id": 2,
                "category_name": "Science",
                "enrollmentCount": 4
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
      id: "get-average-time-to-complete-course",
      name: "Get Average Time to Complete Course",
      method: "GET",
      url: "/reporting/course-performance/average-time-completion-per-course",
      description: "Get the average time to complete each course and the count of completed users.",
      parameters: [],
      responses: [
        {
          status: 200,
          description: "Successfully retrieved average time to complete courses.",
          example: {
    "success": true,
    "data": [
        {
            "course_id": 5,
            "title": "Complete IELTS Preparation Course: Band 7+ Score",
            "thumbnail": "/course/thumbnail/IELTS_course_thumbnail.png",
            "averageTimeSpent": "101.67",
            "completedUsersCount": 1
        },
        {
            "course_id": 6,
            "title": "React Basics: A Comprehensive Introduction",
            "thumbnail": "/course/thumbnail/react_basics.png",
            "averageTimeSpent": "100.70",
            "completedUsersCount": 5
        },
        {
            "course_id": 2,
            "title": "Exploring the Solar System: A Deep Dive into Planetary Science",
            "thumbnail": "/course/thumbnail/solar_thumbnail.jpg",
            "averageTimeSpent": "98.20",
            "completedUsersCount": 2
        },
        {
            "course_id": 1,
            "title": "The Story of Us: Human Evolution",
            "thumbnail": "/course/thumbnail/evolutionthumbnail.jpg",
            "averageTimeSpent": "90.11",
            "completedUsersCount": 3
        },
        {
            "course_id": 4,
            "title": "The Indian Constitution: Foundations of Our Democracy",
            "thumbnail": "/course/thumbnail/constitution.png",
            "averageTimeSpent": "87.80",
            "completedUsersCount": 2
        },
        {
            "course_id": 3,
            "title": "Gujarat's geography",
            "thumbnail": "/course/thumbnail/ggthumbnail.jpg",
            "averageTimeSpent": "78.50",
            "completedUsersCount": 1
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

export default coursePerformanceAnalyticsData; 