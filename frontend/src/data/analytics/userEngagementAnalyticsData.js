const userEngagementAnalyticsData = {
  id: "user-engagement-analytics",
  name: "User Engagement Analytics",
  description: "The User Engagement Analytics API provides endpoints to analyze user engagement metrics including course completion rates, time spent, session lengths, recent enrollments, and FAQ responses.",
  endpoints: [
    {
      id: "get-course-completion",
      name: "Get Course Completion Analytics",
      method: "GET",
      url: "/reporting/user-engagement/course-completion",
      description: "Get analytics on course completion rates for both courses and users.",
      parameters: [],
      responses: [
        {
          status: 200,
          description: "Successfully retrieved completion analytics data.",
          example: {
            "success": true,
            "data": {
              "courseCompletionRates": [
                {
                  "courseId": 1,
                  "courseTitle": "The Story of Us: Human Evolution",
                  "totalEnrollments": 4,
                  "completed": 3,
                  "completionRate": "75.00%"
                },
                {
                  "courseId": 2,
                  "courseTitle": "Exploring the Solar System: A Deep Dive into Planetary Science",
                  "totalEnrollments": 4,
                  "completed": 2,
                  "completionRate": "50.00%"
                },
                {
                  "courseId": 3,
                  "courseTitle": "Gujarat's geography",
                  "totalEnrollments": 6,
                  "completed": 1,
                  "completionRate": "16.67%"
                },
                {
                  "courseId": 4,
                  "courseTitle": "The Indian Constitution: Foundations of Our Democracy",
                  "totalEnrollments": 4,
                  "completed": 2,
                  "completionRate": "50.00%"
                },
                {
                  "courseId": 5,
                  "courseTitle": "Complete IELTS Preparation Course: Band 7+ Score",
                  "totalEnrollments": 6,
                  "completed": 1,
                  "completionRate": "16.67%"
                },
                {
                  "courseId": 6,
                  "courseTitle": "React Basics: A Comprehensive Introduction",
                  "totalEnrollments": 7,
                  "completed": 5,
                  "completionRate": "71.43%"
                }
              ],
              "userCompletionRates": [
                {
                  "userId": 3,
                  "userName": "Alex Johnson",
                  "totalCourses": 1,
                  "completedCourses": 0,
                  "completionRate": "0.00%"
                },
                {
                  "userId": 4,
                  "userName": "Sarah Williams",
                  "totalCourses": 3,
                  "completedCourses": 3,
                  "completionRate": "100.00%"
                },
                {
                  "userId": 5,
                  "userName": "Michael Brown",
                  "totalCourses": 1,
                  "completedCourses": 1,
                  "completionRate": "100.00%"
                },
                {
                  "userId": 6,
                  "userName": "Emily Davis",
                  "totalCourses": 3,
                  "completedCourses": 1,
                  "completionRate": "33.33%"
                },
                {
                  "userId": 7,
                  "userName": "David Wilson",
                  "totalCourses": 1,
                  "completedCourses": 1,
                  "completionRate": "100.00%"
                },
                {
                  "userId": 8,
                  "userName": "Olivia Martinez",
                  "totalCourses": 3,
                  "completedCourses": 1,
                  "completionRate": "33.33%"
                },
                {
                  "userId": 9,
                  "userName": "William Taylor",
                  "totalCourses": 1,
                  "completedCourses": 0,
                  "completionRate": "0.00%"
                },
                {
                  "userId": 10,
                  "userName": "Sophia Anderson",
                  "totalCourses": 1,
                  "completedCourses": 1,
                  "completionRate": "100.00%"
                },
                {
                  "userId": 11,
                  "userName": "James Moore",
                  "totalCourses": 2,
                  "completedCourses": 0,
                  "completionRate": "0.00%"
                },
                {
                  "userId": 12,
                  "userName": "Ava Thomas",
                  "totalCourses": 3,
                  "completedCourses": 1,
                  "completionRate": "33.33%"
                },
                {
                  "userId": 13,
                  "userName": "Benjamin Jackson",
                  "totalCourses": 2,
                  "completedCourses": 0,
                  "completionRate": "0.00%"
                },
                {
                  "userId": 14,
                  "userName": "Mia White",
                  "totalCourses": 2,
                  "completedCourses": 1,
                  "completionRate": "50.00%"
                },
                {
                  "userId": 15,
                  "userName": "Daniel Harris",
                  "totalCourses": 3,
                  "completedCourses": 1,
                  "completionRate": "33.33%"
                },
                {
                  "userId": 16,
                  "userName": "Charlotte Lewis",
                  "totalCourses": 1,
                  "completedCourses": 0,
                  "completionRate": "0.00%"
                },
                {
                  "userId": 17,
                  "userName": "Logan Clark",
                  "totalCourses": 1,
                  "completedCourses": 1,
                  "completionRate": "100.00%"
                },
                {
                  "userId": 1,
                  "userName": "John Doe",
                  "totalCourses": 3,
                  "completedCourses": 2,
                  "completionRate": "66.67%"
                }
              ]
            }
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
    },
    {
      id: "get-average-time-spent",
      name: "Get Average Time Spent Analytics",
      method: "GET",
      url: "/reporting/user-engagement/average-time-spent",
      description: "Get analytics on average time spent per user and per course.",
      parameters: [],
      responses: [
        {
          status: 200,
          description: "Successfully retrieved average time spent analytics.",
          example: {
            "success": true,
            "data": {
              "averageTimePerUser": [
                {
                  "userId": 1,
                  "userName": "John Doe",
                  "totalTime": 743,
                  "sessions": 8,
                  "averageTimeSpent": "92.88 min"
                },
                {
                  "userId": 3,
                  "userName": "Alex Johnson",
                  "totalTime": 173,
                  "sessions": 2,
                  "averageTimeSpent": "86.50 min"
                },
                {
                  "userId": 4,
                  "userName": "Sarah Williams",
                  "totalTime": 740,
                  "sessions": 7,
                  "averageTimeSpent": "105.71 min"
                },
                {
                  "userId": 5,
                  "userName": "Michael Brown",
                  "totalTime": 157,
                  "sessions": 2,
                  "averageTimeSpent": "78.50 min"
                },
                {
                  "userId": 6,
                  "userName": "Emily Davis",
                  "totalTime": 634,
                  "sessions": 7,
                  "averageTimeSpent": "90.57 min"
                },
                {
                  "userId": 7,
                  "userName": "David Wilson",
                  "totalTime": 209,
                  "sessions": 2,
                  "averageTimeSpent": "104.50 min"
                },
                {
                  "userId": 8,
                  "userName": "Olivia Martinez",
                  "totalTime": 758,
                  "sessions": 9,
                  "averageTimeSpent": "84.22 min"
                },
                {
                  "userId": 9,
                  "userName": "William Taylor",
                  "totalTime": 260,
                  "sessions": 3,
                  "averageTimeSpent": "86.67 min"
                },
                {
                  "userId": 10,
                  "userName": "Sophia Anderson",
                  "totalTime": 192,
                  "sessions": 2,
                  "averageTimeSpent": "96.00 min"
                },
                {
                  "userId": 11,
                  "userName": "James Moore",
                  "totalTime": 262,
                  "sessions": 4,
                  "averageTimeSpent": "65.50 min"
                },
                {
                  "userId": 12,
                  "userName": "Ava Thomas",
                  "totalTime": 384,
                  "sessions": 5,
                  "averageTimeSpent": "76.80 min"
                },
                {
                  "userId": 13,
                  "userName": "Benjamin Jackson",
                  "totalTime": 330,
                  "sessions": 5,
                  "averageTimeSpent": "66.00 min"
                },
                {
                  "userId": 14,
                  "userName": "Mia White",
                  "totalTime": 486,
                  "sessions": 5,
                  "averageTimeSpent": "97.20 min"
                },
                {
                  "userId": 15,
                  "userName": "Daniel Harris",
                  "totalTime": 609,
                  "sessions": 7,
                  "averageTimeSpent": "87.00 min"
                },
                {
                  "userId": 16,
                  "userName": "Charlotte Lewis",
                  "totalTime": 360,
                  "sessions": 3,
                  "averageTimeSpent": "120.00 min"
                },
                {
                  "userId": 17,
                  "userName": "Logan Clark",
                  "totalTime": 172,
                  "sessions": 2,
                  "averageTimeSpent": "86.00 min"
                }
              ],
              "averageTimePerCourse": [
                {
                  "courseId": 1,
                  "courseTitle": "The Story of Us: Human Evolution",
                  "totalTime": 998,
                  "sessions": 11,
                  "averageTimeSpent": "90.73 min"
                },
                {
                  "courseId": 2,
                  "courseTitle": "Exploring the Solar System: A Deep Dive into Planetary Science",
                  "totalTime": 859,
                  "sessions": 10,
                  "averageTimeSpent": "85.90 min"
                },
                {
                  "courseId": 3,
                  "courseTitle": "Gujarat's geography",
                  "totalTime": 1246,
                  "sessions": 15,
                  "averageTimeSpent": "83.07 min"
                },
                {
                  "courseId": 4,
                  "courseTitle": "The Indian Constitution: Foundations of Our Democracy",
                  "totalTime": 794,
                  "sessions": 9,
                  "averageTimeSpent": "88.22 min"
                },
                {
                  "courseId": 5,
                  "courseTitle": "Complete IELTS Preparation Course: Band 7+ Score",
                  "totalTime": 1201,
                  "sessions": 13,
                  "averageTimeSpent": "92.38 min"
                },
                {
                  "courseId": 6,
                  "courseTitle": "React Basics: A Comprehensive Introduction",
                  "totalTime": 1371,
                  "sessions": 15,
                  "averageTimeSpent": "91.40 min"
                }
              ]
            }
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
    },
    {
      id: "get-average-session-length",
      name: "Get Average Session Length Analytics",
      method: "GET",
      url: "/reporting/user-engagement/average-session-length",
      description: "Get analytics on average session lengths for users, courses, and user-course combinations.",
      parameters: [],
      responses: [
        {
          status: 200,
          description: "Successfully retrieved session length analytics.",
          example: {
            "success": true,
            "data": {
              "averageSessionPerUser": [
                {
                  "userId": 1,
                  "userName": "John Doe",
                  "totalSessions": 8,
                  "totalDuration": 743,
                  "averageSessionLength": "92.88 min"
                },
                {
                  "userId": 3,
                  "userName": "Alex Johnson",
                  "totalSessions": 2,
                  "totalDuration": 173,
                  "averageSessionLength": "86.50 min"
                },
                {
                  "userId": 4,
                  "userName": "Sarah Williams",
                  "totalSessions": 7,
                  "totalDuration": 740,
                  "averageSessionLength": "105.71 min"
                },
                {
                  "userId": 5,
                  "userName": "Michael Brown",
                  "totalSessions": 2,
                  "totalDuration": 157,
                  "averageSessionLength": "78.50 min"
                },
                {
                  "userId": 6,
                  "userName": "Emily Davis",
                  "totalSessions": 7,
                  "totalDuration": 634,
                  "averageSessionLength": "90.57 min"
                },
                {
                  "userId": 7,
                  "userName": "David Wilson",
                  "totalSessions": 2,
                  "totalDuration": 209,
                  "averageSessionLength": "104.50 min"
                },
                {
                  "userId": 8,
                  "userName": "Olivia Martinez",
                  "totalSessions": 9,
                  "totalDuration": 758,
                  "averageSessionLength": "84.22 min"
                },
                {
                  "userId": 9,
                  "userName": "William Taylor",
                  "totalSessions": 3,
                  "totalDuration": 260,
                  "averageSessionLength": "86.67 min"
                },
                {
                  "userId": 10,
                  "userName": "Sophia Anderson",
                  "totalSessions": 2,
                  "totalDuration": 192,
                  "averageSessionLength": "96.00 min"
                },
                {
                  "userId": 11,
                  "userName": "James Moore",
                  "totalSessions": 4,
                  "totalDuration": 262,
                  "averageSessionLength": "65.50 min"
                },
                {
                  "userId": 12,
                  "userName": "Ava Thomas",
                  "totalSessions": 5,
                  "totalDuration": 384,
                  "averageSessionLength": "76.80 min"
                },
                {
                  "userId": 13,
                  "userName": "Benjamin Jackson",
                  "totalSessions": 5,
                  "totalDuration": 330,
                  "averageSessionLength": "66.00 min"
                },
                {
                  "userId": 14,
                  "userName": "Mia White",
                  "totalSessions": 5,
                  "totalDuration": 486,
                  "averageSessionLength": "97.20 min"
                },
                {
                  "userId": 15,
                  "userName": "Daniel Harris",
                  "totalSessions": 7,
                  "totalDuration": 609,
                  "averageSessionLength": "87.00 min"
                },
                {
                  "userId": 16,
                  "userName": "Charlotte Lewis",
                  "totalSessions": 3,
                  "totalDuration": 360,
                  "averageSessionLength": "120.00 min"
                },
                {
                  "userId": 17,
                  "userName": "Logan Clark",
                  "totalSessions": 2,
                  "totalDuration": 172,
                  "averageSessionLength": "86.00 min"
                }
              ],
              "averageSessionPerCourse": [
                {
                  "courseId": 1,
                  "courseTitle": "The Story of Us: Human Evolution",
                  "totalSessions": 11,
                  "totalDuration": 998,
                  "averageSessionLength": "90.73 min"
                },
                {
                  "courseId": 2,
                  "courseTitle": "Exploring the Solar System: A Deep Dive into Planetary Science",
                  "totalSessions": 10,
                  "totalDuration": 859,
                  "averageSessionLength": "85.90 min"
                },
                {
                  "courseId": 3,
                  "courseTitle": "Gujarat's geography",
                  "totalSessions": 15,
                  "totalDuration": 1246,
                  "averageSessionLength": "83.07 min"
                },
                {
                  "courseId": 4,
                  "courseTitle": "The Indian Constitution: Foundations of Our Democracy",
                  "totalSessions": 9,
                  "totalDuration": 794,
                  "averageSessionLength": "88.22 min"
                },
                {
                  "courseId": 5,
                  "courseTitle": "Complete IELTS Preparation Course: Band 7+ Score",
                  "totalSessions": 13,
                  "totalDuration": 1201,
                  "averageSessionLength": "92.38 min"
                },
                {
                  "courseId": 6,
                  "courseTitle": "React Basics: A Comprehensive Introduction",
                  "totalSessions": 15,
                  "totalDuration": 1371,
                  "averageSessionLength": "91.40 min"
                }
              ],
              "averageSessionPerUserCourse": [
                {
                  "userId": 4,
                  "userName": "Sarah Williams",
                  "courseId": 1,
                  "courseTitle": "The Story of Us: Human Evolution",
                  "totalSessions": 3,
                  "totalDuration": 253,
                  "averageSessionLength": "84.33 min"
                },
                {
                  "userId": 6,
                  "userName": "Emily Davis",
                  "courseId": 1,
                  "courseTitle": "The Story of Us: Human Evolution",
                  "totalSessions": 2,
                  "totalDuration": 187,
                  "averageSessionLength": "93.50 min"
                },
                {
                  "userId": 15,
                  "userName": "Daniel Harris",
                  "courseId": 1,
                  "courseTitle": "The Story of Us: Human Evolution",
                  "totalSessions": 3,
                  "totalDuration": 256,
                  "averageSessionLength": "85.33 min"
                },
                {
                  "userId": 1,
                  "userName": "John Doe",
                  "courseId": 1,
                  "courseTitle": "The Story of Us: Human Evolution",
                  "totalSessions": 3,
                  "totalDuration": 302,
                  "averageSessionLength": "100.67 min"
                },
                {
                  "userId": 3,
                  "userName": "Alex Johnson",
                  "courseId": 2,
                  "courseTitle": "Exploring the Solar System: A Deep Dive into Planetary Science",
                  "totalSessions": 2,
                  "totalDuration": 173,
                  "averageSessionLength": "86.50 min"
                },
                {
                  "userId": 4,
                  "userName": "Sarah Williams",
                  "courseId": 2,
                  "courseTitle": "Exploring the Solar System: A Deep Dive into Planetary Science",
                  "totalSessions": 3,
                  "totalDuration": 348,
                  "averageSessionLength": "116.00 min"
                },
                {
                  "userId": 6,
                  "userName": "Emily Davis",
                  "courseId": 2,
                  "courseTitle": "Exploring the Solar System: A Deep Dive into Planetary Science",
                  "totalSessions": 2,
                  "totalDuration": 143,
                  "averageSessionLength": "71.50 min"
                },
                {
                  "userId": 13,
                  "userName": "Benjamin Jackson",
                  "courseId": 2,
                  "courseTitle": "Exploring the Solar System: A Deep Dive into Planetary Science",
                  "totalSessions": 3,
                  "totalDuration": 195,
                  "averageSessionLength": "65.00 min"
                },
                {
                  "userId": 5,
                  "userName": "Michael Brown",
                  "courseId": 3,
                  "courseTitle": "Gujarat's geography",
                  "totalSessions": 2,
                  "totalDuration": 157,
                  "averageSessionLength": "78.50 min"
                },
                {
                  "userId": 9,
                  "userName": "William Taylor",
                  "courseId": 3,
                  "courseTitle": "Gujarat's geography",
                  "totalSessions": 3,
                  "totalDuration": 260,
                  "averageSessionLength": "86.67 min"
                },
                {
                  "userId": 11,
                  "userName": "James Moore",
                  "courseId": 3,
                  "courseTitle": "Gujarat's geography",
                  "totalSessions": 3,
                  "totalDuration": 201,
                  "averageSessionLength": "67.00 min"
                },
                {
                  "userId": 13,
                  "userName": "Benjamin Jackson",
                  "courseId": 3,
                  "courseTitle": "Gujarat's geography",
                  "totalSessions": 2,
                  "totalDuration": 135,
                  "averageSessionLength": "67.50 min"
                },
                {
                  "userId": 15,
                  "userName": "Daniel Harris",
                  "courseId": 3,
                  "courseTitle": "Gujarat's geography",
                  "totalSessions": 2,
                  "totalDuration": 133,
                  "averageSessionLength": "66.50 min"
                },
                {
                  "userId": 16,
                  "userName": "Charlotte Lewis",
                  "courseId": 3,
                  "courseTitle": "Gujarat's geography",
                  "totalSessions": 3,
                  "totalDuration": 360,
                  "averageSessionLength": "120.00 min"
                },
                {
                  "userId": 8,
                  "userName": "Olivia Martinez",
                  "courseId": 4,
                  "courseTitle": "The Indian Constitution: Foundations of Our Democracy",
                  "totalSessions": 3,
                  "totalDuration": 263,
                  "averageSessionLength": "87.67 min"
                },
                {
                  "userId": 12,
                  "userName": "Ava Thomas",
                  "courseId": 4,
                  "courseTitle": "The Indian Constitution: Foundations of Our Democracy",
                  "totalSessions": 1,
                  "totalDuration": 92,
                  "averageSessionLength": "92.00 min"
                },
                {
                  "userId": 17,
                  "userName": "Logan Clark",
                  "courseId": 4,
                  "courseTitle": "The Indian Constitution: Foundations of Our Democracy",
                  "totalSessions": 2,
                  "totalDuration": 172,
                  "averageSessionLength": "86.00 min"
                },
                {
                  "userId": 1,
                  "userName": "John Doe",
                  "courseId": 4,
                  "courseTitle": "The Indian Constitution: Foundations of Our Democracy",
                  "totalSessions": 3,
                  "totalDuration": 267,
                  "averageSessionLength": "89.00 min"
                },
                {
                  "userId": 6,
                  "userName": "Emily Davis",
                  "courseId": 5,
                  "courseTitle": "Complete IELTS Preparation Course: Band 7+ Score",
                  "totalSessions": 3,
                  "totalDuration": 304,
                  "averageSessionLength": "101.33 min"
                },
                {
                  "userId": 8,
                  "userName": "Olivia Martinez",
                  "courseId": 5,
                  "courseTitle": "Complete IELTS Preparation Course: Band 7+ Score",
                  "totalSessions": 3,
                  "totalDuration": 305,
                  "averageSessionLength": "101.67 min"
                },
                {
                  "userId": 11,
                  "userName": "James Moore",
                  "courseId": 5,
                  "courseTitle": "Complete IELTS Preparation Course: Band 7+ Score",
                  "totalSessions": 1,
                  "totalDuration": 61,
                  "averageSessionLength": "61.00 min"
                },
                {
                  "userId": 12,
                  "userName": "Ava Thomas",
                  "courseId": 5,
                  "courseTitle": "Complete IELTS Preparation Course: Band 7+ Score",
                  "totalSessions": 2,
                  "totalDuration": 133,
                  "averageSessionLength": "66.50 min"
                },
                {
                  "userId": 14,
                  "userName": "Mia White",
                  "courseId": 5,
                  "courseTitle": "Complete IELTS Preparation Course: Band 7+ Score",
                  "totalSessions": 2,
                  "totalDuration": 178,
                  "averageSessionLength": "89.00 min"
                },
                {
                  "userId": 15,
                  "userName": "Daniel Harris",
                  "courseId": 5,
                  "courseTitle": "Complete IELTS Preparation Course: Band 7+ Score",
                  "totalSessions": 2,
                  "totalDuration": 220,
                  "averageSessionLength": "110.00 min"
                },
                {
                  "userId": 4,
                  "userName": "Sarah Williams",
                  "courseId": 6,
                  "courseTitle": "React Basics: A Comprehensive Introduction",
                  "totalSessions": 1,
                  "totalDuration": 139,
                  "averageSessionLength": "139.00 min"
                },
                {
                  "userId": 7,
                  "userName": "David Wilson",
                  "courseId": 6,
                  "courseTitle": "React Basics: A Comprehensive Introduction",
                  "totalSessions": 2,
                  "totalDuration": 209,
                  "averageSessionLength": "104.50 min"
                },
                {
                  "userId": 8,
                  "userName": "Olivia Martinez",
                  "courseId": 6,
                  "courseTitle": "React Basics: A Comprehensive Introduction",
                  "totalSessions": 3,
                  "totalDuration": 190,
                  "averageSessionLength": "63.33 min"
                },
                {
                  "userId": 10,
                  "userName": "Sophia Anderson",
                  "courseId": 6,
                  "courseTitle": "React Basics: A Comprehensive Introduction",
                  "totalSessions": 2,
                  "totalDuration": 192,
                  "averageSessionLength": "96.00 min"
                },
                {
                  "userId": 12,
                  "userName": "Ava Thomas",
                  "courseId": 6,
                  "courseTitle": "React Basics: A Comprehensive Introduction",
                  "totalSessions": 2,
                  "totalDuration": 159,
                  "averageSessionLength": "79.50 min"
                },
                {
                  "userId": 14,
                  "userName": "Mia White",
                  "courseId": 6,
                  "courseTitle": "React Basics: A Comprehensive Introduction",
                  "totalSessions": 3,
                  "totalDuration": 308,
                  "averageSessionLength": "102.67 min"
                },
                {
                  "userId": 1,
                  "userName": "John Doe",
                  "courseId": 6,
                  "courseTitle": "React Basics: A Comprehensive Introduction",
                  "totalSessions": 2,
                  "totalDuration": 174,
                  "averageSessionLength": "87.00 min"
                }
              ],
              "overallAverageSessionPerCourse": [
                {
                  "courseId": 1,
                  "courseTitle": "The Story of Us: Human Evolution",
                  "totalDuration": 998,
                  "totalSessions": 11,
                  "averageSessionLength": "90.73 min"
                },
                {
                  "courseId": 2,
                  "courseTitle": "Exploring the Solar System: A Deep Dive into Planetary Science",
                  "totalDuration": 859,
                  "totalSessions": 10,
                  "averageSessionLength": "85.90 min"
                },
                {
                  "courseId": 3,
                  "courseTitle": "Gujarat's geography",
                  "totalDuration": 1246,
                  "totalSessions": 15,
                  "averageSessionLength": "83.07 min"
                },
                {
                  "courseId": 4,
                  "courseTitle": "The Indian Constitution: Foundations of Our Democracy",
                  "totalDuration": 794,
                  "totalSessions": 9,
                  "averageSessionLength": "88.22 min"
                },
                {
                  "courseId": 5,
                  "courseTitle": "Complete IELTS Preparation Course: Band 7+ Score",
                  "totalDuration": 1201,
                  "totalSessions": 13,
                  "averageSessionLength": "92.38 min"
                },
                {
                  "courseId": 6,
                  "courseTitle": "React Basics: A Comprehensive Introduction",
                  "totalDuration": 1371,
                  "totalSessions": 15,
                  "averageSessionLength": "91.40 min"
                }
              ]
            }
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
    },
    {
      id: "get-recent-enrollments",
      name: "Get Recent Enrollments",
      method: "GET",
      url: "/reporting/user-engagement/recent-enrollments",
      description: "Get the 10 most recent course enrollments.",
      parameters: [],
      responses: [
        {
          status: 200,
          description: "Successfully retrieved recent enrollments.",
          example: {
            "success": true,
            "data": [
              {
                "user_name": "John Doe",
                "course_title": "React Basics: A Comprehensive Introduction",
                "enrollment_date": "29-10-2025",
                "course_category": "Programming"
              },
              {
                "user_name": "John Doe",
                "course_title": "The Indian Constitution: Foundations of Our Democracy",
                "enrollment_date": "29-10-2025",
                "course_category": "History"
              },
              {
                "user_name": "Daniel Harris",
                "course_title": "Gujarat's geography",
                "enrollment_date": "29-10-2025",
                "course_category": "Geography"
              },
              {
                "user_name": "Daniel Harris",
                "course_title": "Complete IELTS Preparation Course: Band 7+ Score",
                "enrollment_date": "29-10-2025",
                "course_category": "Language & Global Skills"
              },
              {
                "user_name": "Charlotte Lewis",
                "course_title": "Gujarat's geography",
                "enrollment_date": "29-10-2025",
                "course_category": "Geography"
              },
              {
                "user_name": "Logan Clark",
                "course_title": "The Indian Constitution: Foundations of Our Democracy",
                "enrollment_date": "29-10-2025",
                "course_category": "History"
              },
              {
                "user_name": "John Doe",
                "course_title": "The Story of Us: Human Evolution",
                "enrollment_date": "29-10-2025",
                "course_category": "Human Evolution"
              },
              {
                "user_name": "Mia White",
                "course_title": "React Basics: A Comprehensive Introduction",
                "enrollment_date": "29-10-2025",
                "course_category": "Programming"
              },
              {
                "user_name": "Mia White",
                "course_title": "Complete IELTS Preparation Course: Band 7+ Score",
                "enrollment_date": "29-10-2025",
                "course_category": "Language & Global Skills"
              },
              {
                "user_name": "Daniel Harris",
                "course_title": "The Story of Us: Human Evolution",
                "enrollment_date": "29-10-2025",
                "course_category": "Human Evolution"
              }
            ]
          }
        },
        {
          status: 500,
          description: "Internal server error.",
          example: {
            success: false,
            message: "Something went wrong while fetching recent enrollments"
          }
        }
      ]
    },
    {
      id: "get-student-faq-analytics",
      name: "Get Student FAQ Analytics",
      method: "GET",
      url: "/reporting/user-engagement/faq-response",
      description: "Get analytics on student responses to course FAQs.",
      parameters: [
        {
          name: "course_id",
          type: "number",
          required: false,
          description: "Optional course ID to filter FAQ responses for a specific course",
          example: 1
        }
      ],
      responses: [
        {
          status: 200,
          description: "Successfully retrieved FAQ analytics.",
          example: {
            "success": true,
            "data": [
              {
                "courseId": 1,
                "courseTitle": "The Story of Us: Human Evolution",
                "questions": {
                  "1": {
                    "questionId": 1,
                    "questionText": "Why are you interested in learning about human evolution?",
                    "options": [
                      {
                        "optionText": "Just learning for fun",
                        "percentage": "25.00"
                      },
                      {
                        "optionText": "I'm curious about human history",
                        "percentage": "50.00"
                      },
                      {
                        "optionText": "It's part of my school curriculum",
                        "percentage": "25.00"
                      }
                    ]
                  },
                  "2": {
                    "questionId": 2,
                    "questionText": "What is your current knowledge level on human evolution?",
                    "options": [
                      {
                        "optionText": "Expert",
                        "percentage": "25.00"
                      },
                      {
                        "optionText": "Well-informed",
                        "percentage": "50.00"
                      },
                      {
                        "optionText": "Beginner",
                        "percentage": "25.00"
                      }
                    ]
                  },
                  "3": {
                    "questionId": 3,
                    "questionText": "What do you hope to gain from this course?",
                    "options": [
                      {
                        "optionText": "Help with school or university studies",
                        "percentage": "50.00"
                      },
                      {
                        "optionText": "Personal enrichment",
                        "percentage": "25.00"
                      },
                      {
                        "optionText": "Better understanding of human ancestry",
                        "percentage": "25.00"
                      }
                    ]
                  },
                  "4": {
                    "questionId": 4,
                    "questionText": "How much time can you dedicate to this course each week?",
                    "options": [
                      {
                        "optionText": "5-10 hours",
                        "percentage": "66.67"
                      },
                      {
                        "optionText": "2-5 hours",
                        "percentage": "33.33"
                      }
                    ]
                  },
                  "5": {
                    "questionId": 5,
                    "questionText": "Which aspect of human evolution interests you the most?",
                    "options": [
                      {
                        "optionText": "Evolutionary theory and genetics",
                        "percentage": "66.67"
                      },
                      {
                        "optionText": "Fossil discoveries",
                        "percentage": "33.33"
                      }
                    ]
                  }
                }
              },
              {
                "courseId": 2,
                "courseTitle": "Exploring the Solar System: A Deep Dive into Planetary Science",
                "questions": {
                  "6": {
                    "questionId": 6,
                    "questionText": "What interests you most about the solar system?",
                    "options": [
                      {
                        "optionText": "Astronomy and astrophysics",
                        "percentage": "25.00"
                      },
                      {
                        "optionText": "Space missions and technology",
                        "percentage": "25.00"
                      },
                      {
                        "optionText": "Possibility of life beyond Earth",
                        "percentage": "25.00"
                      },
                      {
                        "optionText": "Planetary formation and origins",
                        "percentage": "25.00"
                      }
                    ]
                  },
                  "7": {
                    "questionId": 7,
                    "questionText": "What is your current knowledge level about space science?",
                    "options": [
                      {
                        "optionText": "Advanced",
                        "percentage": "75.00"
                      },
                      {
                        "optionText": "Intermediate",
                        "percentage": "25.00"
                      }
                    ]
                  },
                  "8": {
                    "questionId": 8,
                    "questionText": "What do you hope to do after completing this course?",
                    "options": [
                      {
                        "optionText": "Enhance general knowledge about the universe",
                        "percentage": "75.00"
                      },
                      {
                        "optionText": "Participate in space-related research or projects",
                        "percentage": "25.00"
                      }
                    ]
                  },
                  "9": {
                    "questionId": 9,
                    "questionText": "How much time can you dedicate weekly to this course?",
                    "options": [
                      {
                        "optionText": "10-15 hours",
                        "percentage": "33.33"
                      },
                      {
                        "optionText": "Less than 5 hours",
                        "percentage": "66.67"
                      }
                    ]
                  },
                  "10": {
                    "questionId": 10,
                    "questionText": "What motivates you to learn about space?",
                    "options": [
                      {
                        "optionText": "Desire to understand our place in the cosmos",
                        "percentage": "50.00"
                      },
                      {
                        "optionText": "Curiosity about the universe",
                        "percentage": "25.00"
                      },
                      {
                        "optionText": "Dream of working in space exploration",
                        "percentage": "25.00"
                      }
                    ]
                  }
                }
              },
              {
                "courseId": 3,
                "courseTitle": "Gujarat's geography",
                "questions": {
                  "11": {
                    "questionId": 11,
                    "questionText": "Why do you want to learn Gujarat's geography?",
                    "options": [
                      {
                        "optionText": "For personal knowledge",
                        "percentage": "33.33"
                      },
                      {
                        "optionText": "For academic studies",
                        "percentage": "50.00"
                      },
                      {
                        "optionText": "For competitive exams (e.g., GPSC, UPSC)",
                        "percentage": "16.67"
                      }
                    ]
                  },
                  "12": {
                    "questionId": 12,
                    "questionText": "What is your current knowledge level about Gujarat's geography?",
                    "options": [
                      {
                        "optionText": "Intermediate understanding",
                        "percentage": "20.00"
                      },
                      {
                        "optionText": "Beginner",
                        "percentage": "20.00"
                      },
                      {
                        "optionText": "Expert/Teaching level",
                        "percentage": "40.00"
                      },
                      {
                        "optionText": "Basic school-level knowledge",
                        "percentage": "20.00"
                      }
                    ]
                  },
                  "13": {
                    "questionId": 13,
                    "questionText": "What topics interest you the most in Gujarat's geography?",
                    "options": [
                      {
                        "optionText": "Agriculture and economy",
                        "percentage": "40.00"
                      },
                      {
                        "optionText": "Districts and administrative divisions",
                        "percentage": "40.00"
                      },
                      {
                        "optionText": "Cultural and tourism geography",
                        "percentage": "20.00"
                      }
                    ]
                  },
                  "14": {
                    "questionId": 14,
                    "questionText": "How do you plan to use this knowledge?",
                    "options": [
                      {
                        "optionText": "Score well in school/college exams",
                        "percentage": "66.67"
                      },
                      {
                        "optionText": "Use it for research or projects",
                        "percentage": "16.67"
                      },
                      {
                        "optionText": "Just for fun and awareness",
                        "percentage": "16.67"
                      }
                    ]
                  },
                  "15": {
                    "questionId": 15,
                    "questionText": "How much time can you dedicate weekly to this course?",
                    "options": [
                      {
                        "optionText": "4–6 hours",
                        "percentage": "33.33"
                      },
                      {
                        "optionText": "More than 10 hours",
                        "percentage": "16.67"
                      },
                      {
                        "optionText": "7–10 hours",
                        "percentage": "33.33"
                      },
                      {
                        "optionText": "1–3 hours",
                        "percentage": "16.67"
                      }
                    ]
                  }
                }
              },
              {
                "courseId": 4,
                "courseTitle": "The Indian Constitution: Foundations of Our Democracy",
                "questions": {
                  "16": {
                    "questionId": 16,
                    "questionText": "Why do you want to learn about the Indian Constitution?",
                    "options": [
                      {
                        "optionText": "Just curious",
                        "percentage": "33.33"
                      },
                      {
                        "optionText": "To understand democratic rights",
                        "percentage": "66.67"
                      }
                    ]
                  },
                  "17": {
                    "questionId": 17,
                    "questionText": "What is your current understanding of the Constitution?",
                    "options": [
                      {
                        "optionText": "Beginner",
                        "percentage": "33.33"
                      },
                      {
                        "optionText": "Advanced",
                        "percentage": "66.67"
                      }
                    ]
                  },
                  "18": {
                    "questionId": 18,
                    "questionText": "What is your goal after completing this course?",
                    "options": [
                      {
                        "optionText": "Engage in discussions",
                        "percentage": "33.33"
                      },
                      {
                        "optionText": "Prepare for exams",
                        "percentage": "33.33"
                      },
                      {
                        "optionText": "Just for awareness",
                        "percentage": "33.33"
                      }
                    ]
                  },
                  "19": {
                    "questionId": 19,
                    "questionText": "How much time can you dedicate weekly?",
                    "options": [
                      {
                        "optionText": "More than 20 hours",
                        "percentage": "25.00"
                      },
                      {
                        "optionText": "Less than 5 hours",
                        "percentage": "25.00"
                      },
                      {
                        "optionText": "5-10 hours",
                        "percentage": "50.00"
                      }
                    ]
                  },
                  "20": {
                    "questionId": 20,
                    "questionText": "What motivates you to learn about the Constitution?",
                    "options": [
                      {
                        "optionText": "Understanding rights",
                        "percentage": "75.00"
                      },
                      {
                        "optionText": "Civic responsibility",
                        "percentage": "25.00"
                      }
                    ]
                  }
                }
              },
              {
                "courseId": 5,
                "courseTitle": "Complete IELTS Preparation Course: Band 7+ Score",
                "questions": {
                  "21": {
                    "questionId": 21,
                    "questionText": "Why do you want to take the IELTS exam?",
                    "options": [
                      {
                        "optionText": "Personal assessment",
                        "percentage": "25.00"
                      },
                      {
                        "optionText": "For immigration purposes",
                        "percentage": "50.00"
                      },
                      {
                        "optionText": "For professional registration",
                        "percentage": "25.00"
                      }
                    ]
                  },
                  "22": {
                    "questionId": 22,
                    "questionText": "What is your current level of English?",
                    "options": [
                      {
                        "optionText": "Beginner (A1-A2)",
                        "percentage": "40.00"
                      },
                      {
                        "optionText": "Advanced (C1-C2)",
                        "percentage": "20.00"
                      },
                      {
                        "optionText": "Intermediate (B1-B2)",
                        "percentage": "40.00"
                      }
                    ]
                  },
                  "23": {
                    "questionId": 23,
                    "questionText": "Which IELTS version are you planning to take?",
                    "options": [
                      {
                        "optionText": "Not sure yet",
                        "percentage": "80.00"
                      },
                      {
                        "optionText": "IELTS Academic",
                        "percentage": "20.00"
                      }
                    ]
                  },
                  "24": {
                    "questionId": 24,
                    "questionText": "What target band score do you need to achieve?",
                    "options": [
                      {
                        "optionText": "Band 6-6.5",
                        "percentage": "66.67"
                      },
                      {
                        "optionText": "Band 7-7.5",
                        "percentage": "33.33"
                      }
                    ]
                  },
                  "25": {
                    "questionId": 25,
                    "questionText": "Which IELTS module do you find most challenging?",
                    "options": [
                      {
                        "optionText": "Speaking",
                        "percentage": "75.00"
                      },
                      {
                        "optionText": "Reading",
                        "percentage": "25.00"
                      }
                    ]
                  },
                  "26": {
                    "questionId": 26,
                    "questionText": "How much time can you dedicate weekly to IELTS preparation?",
                    "options": [
                      {
                        "optionText": "5-10 hours",
                        "percentage": "33.33"
                      },
                      {
                        "optionText": "10-20 hours",
                        "percentage": "50.00"
                      },
                      {
                        "optionText": "Less than 5 hours",
                        "percentage": "16.67"
                      }
                    ]
                  },
                  "27": {
                    "questionId": 27,
                    "questionText": "How soon will you be taking the IELTS exam?",
                    "options": [
                      {
                        "optionText": "Not scheduled yet",
                        "percentage": "40.00"
                      },
                      {
                        "optionText": "Within 3 months",
                        "percentage": "20.00"
                      },
                      {
                        "optionText": "Within 1 month",
                        "percentage": "40.00"
                      }
                    ]
                  },
                  "28": {
                    "questionId": 28,
                    "questionText": "Have you taken the IELTS exam before?",
                    "options": [
                      {
                        "optionText": "Yes, once",
                        "percentage": "60.00"
                      },
                      {
                        "optionText": "No, this will be my first attempt",
                        "percentage": "20.00"
                      },
                      {
                        "optionText": "Yes, multiple times",
                        "percentage": "20.00"
                      }
                    ]
                  },
                  "29": {
                    "questionId": 29,
                    "questionText": "What is your preferred learning style?",
                    "options": [
                      {
                        "optionText": "Visual learning with diagrams and charts",
                        "percentage": "20.00"
                      },
                      {
                        "optionText": "Practice-oriented with many exercises",
                        "percentage": "20.00"
                      },
                      {
                        "optionText": "Mixed approach",
                        "percentage": "20.00"
                      },
                      {
                        "optionText": "Reading detailed explanations",
                        "percentage": "20.00"
                      },
                      {
                        "optionText": "Audio-based learning with lectures",
                        "percentage": "20.00"
                      }
                    ]
                  },
                  "30": {
                    "questionId": 30,
                    "questionText": "Which country are you planning to go to with your IELTS score?",
                    "options": [
                      {
                        "optionText": "United Kingdom",
                        "percentage": "16.67"
                      },
                      {
                        "optionText": "Other",
                        "percentage": "16.67"
                      },
                      {
                        "optionText": "Canada",
                        "percentage": "50.00"
                      },
                      {
                        "optionText": "United States",
                        "percentage": "16.67"
                      }
                    ]
                  }
                }
              },
              {
                "courseId": 6,
                "courseTitle": "React Basics: A Comprehensive Introduction",
                "questions": {
                  "31": {
                    "questionId": 31,
                    "questionText": "What level of JavaScript knowledge do I need for this course?",
                    "options": [
                      {
                        "optionText": "Advanced",
                        "percentage": "16.67"
                      },
                      {
                        "optionText": "Intermediate",
                        "percentage": "50.00"
                      },
                      {
                        "optionText": "Beginner",
                        "percentage": "16.67"
                      },
                      {
                        "optionText": "None - I'm new to JavaScript",
                        "percentage": "16.67"
                      }
                    ]
                  },
                  "32": {
                    "questionId": 32,
                    "questionText": "Why are you interested in learning React?",
                    "options": [
                      {
                        "optionText": "Career advancement",
                        "percentage": "50.00"
                      },
                      {
                        "optionText": "Required for work/school",
                        "percentage": "33.33"
                      },
                      {
                        "optionText": "Understanding modern web development",
                        "percentage": "16.67"
                      }
                    ]
                  },
                  "33": {
                    "questionId": 33,
                    "questionText": "What is your experience with other JavaScript frameworks?",
                    "options": [
                      {
                        "optionText": "None",
                        "percentage": "33.33"
                      },
                      {
                        "optionText": "Some experience with Angular",
                        "percentage": "33.33"
                      },
                      {
                        "optionText": "Some experience with Vue",
                        "percentage": "16.67"
                      },
                      {
                        "optionText": "Experienced with multiple frameworks",
                        "percentage": "16.67"
                      }
                    ]
                  },
                  "34": {
                    "questionId": 34,
                    "questionText": "How much time can you dedicate weekly to this course?",
                    "options": [
                      {
                        "optionText": "7-10 hours",
                        "percentage": "28.57"
                      },
                      {
                        "optionText": "10+ hours",
                        "percentage": "42.86"
                      },
                      {
                        "optionText": "4-6 hours",
                        "percentage": "28.57"
                      }
                    ]
                  },
                  "35": {
                    "questionId": 35,
                    "questionText": "What type of applications are you most interested in building with React?",
                    "options": [
                      {
                        "optionText": "Social media applications",
                        "percentage": "28.57"
                      },
                      {
                        "optionText": "Business/Enterprise applications",
                        "percentage": "14.29"
                      },
                      {
                        "optionText": "Portfolio/Personal websites",
                        "percentage": "14.29"
                      },
                      {
                        "optionText": "Mobile applications with React Native",
                        "percentage": "28.57"
                      },
                      {
                        "optionText": "E-commerce platforms",
                        "percentage": "14.29"
                      }
                    ]
                  }
                }
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

export default userEngagementAnalyticsData; 