const leaderboardAnalyticsData = {
    id: "leaderboard-analytics",
    name: "Leaderboard Analytics",
    description:
        "The Leaderboard Analytics API provides endpoints to retrieve leaderboard and gamification statistics, including top performers by challenge category and users with the highest points.",
    endpoints: [
        {
            id: "get-top-performers-by-challenge-category",
            name: "Get Top Performers by Challenge Category",
            method: "GET",
            url: "/reporting/leaderboard-gamification/top-performers-by-category",
            description: "Get the top performers for each challenge category.",
            parameters: [],
            responses: [
                {
                    status: 200,
                    description: "Successfully retrieved top performers by category.",
                    example: {
                        "success": true,
                        "data": [
                            {
                                "category_name": "Coding",
                                "student_list": [
                                    {
                                        "user_id": 4,
                                        "user_name": "Sarah Williams",
                                        "email": "sarah@example.com",
                                        "profile_image": null,
                                        "total_points": "1250"
                                    },
                                    {
                                        "user_id": 10,
                                        "user_name": "Sophia Anderson",
                                        "email": "sophia@example.com",
                                        "profile_image": null,
                                        "total_points": "1250"
                                    },
                                    {
                                        "user_id": 12,
                                        "user_name": "Ava Thomas",
                                        "email": "ava@example.com",
                                        "profile_image": null,
                                        "total_points": "1250"
                                    },
                                    {
                                        "user_id": 1,
                                        "user_name": "John Doe",
                                        "email": "john@example.com",
                                        "profile_image": null,
                                        "total_points": "1250"
                                    },
                                    {
                                        "user_id": 9,
                                        "user_name": "William Taylor",
                                        "email": "william@example.com",
                                        "profile_image": null,
                                        "total_points": "1000"
                                    },
                                    {
                                        "user_id": 15,
                                        "user_name": "Daniel Harris",
                                        "email": "daniel@example.com",
                                        "profile_image": null,
                                        "total_points": "1000"
                                    },
                                    {
                                        "user_id": 13,
                                        "user_name": "Benjamin Jackson",
                                        "email": "benjamin@example.com",
                                        "profile_image": null,
                                        "total_points": "500"
                                    }
                                ]
                            },
                            {
                                "category_name": "English",
                                "student_list": [
                                    {
                                        "user_id": 15,
                                        "user_name": "Daniel Harris",
                                        "email": "daniel@example.com",
                                        "profile_image": null,
                                        "total_points": "400"
                                    },
                                    {
                                        "user_id": 1,
                                        "user_name": "John Doe",
                                        "email": "john@example.com",
                                        "profile_image": null,
                                        "total_points": "400"
                                    }
                                ]
                            },
                            {
                                "category_name": "History",
                                "student_list": [
                                    {
                                        "user_id": 5,
                                        "user_name": "Michael Brown",
                                        "email": "michael@example.com",
                                        "profile_image": null,
                                        "total_points": "550"
                                    },
                                    {
                                        "user_id": 15,
                                        "user_name": "Daniel Harris",
                                        "email": "daniel@example.com",
                                        "profile_image": null,
                                        "total_points": "550"
                                    }
                                ]
                            },
                            {
                                "category_name": "Maths",
                                "student_list": [
                                    {
                                        "user_id": 3,
                                        "user_name": "Alex Johnson",
                                        "email": "alex@example.com",
                                        "profile_image": null,
                                        "total_points": "600"
                                    },
                                    {
                                        "user_id": 15,
                                        "user_name": "Daniel Harris",
                                        "email": "daniel@example.com",
                                        "profile_image": null,
                                        "total_points": "600"
                                    },
                                    {
                                        "user_id": 8,
                                        "user_name": "Olivia Martinez",
                                        "email": "olivia@example.com",
                                        "profile_image": null,
                                        "total_points": "400"
                                    },
                                    {
                                        "user_id": 11,
                                        "user_name": "James Moore",
                                        "email": "james@example.com",
                                        "profile_image": null,
                                        "total_points": "400"
                                    },
                                    {
                                        "user_id": 1,
                                        "user_name": "John Doe",
                                        "email": "john@example.com",
                                        "profile_image": null,
                                        "total_points": "400"
                                    }
                                ]
                            },
                            {
                                "category_name": "Other",
                                "student_list": [
                                    {
                                        "user_id": 1,
                                        "user_name": "John Doe",
                                        "email": "john@example.com",
                                        "profile_image": null,
                                        "total_points": "700"
                                    },
                                    {
                                        "user_id": 12,
                                        "user_name": "Ava Thomas",
                                        "email": "ava@example.com",
                                        "profile_image": null,
                                        "total_points": "350"
                                    }
                                ]
                            },
                            {
                                "category_name": "Science",
                                "student_list": [
                                    {
                                        "user_id": 6,
                                        "user_name": "Emily Davis",
                                        "email": "emily@example.com",
                                        "profile_image": null,
                                        "total_points": "1150"
                                    },
                                    {
                                        "user_id": 15,
                                        "user_name": "Daniel Harris",
                                        "email": "daniel@example.com",
                                        "profile_image": null,
                                        "total_points": "1150"
                                    },
                                    {
                                        "user_id": 14,
                                        "user_name": "Mia White",
                                        "email": "mia@example.com",
                                        "profile_image": null,
                                        "total_points": "700"
                                    },
                                    {
                                        "user_id": 16,
                                        "user_name": "Charlotte Lewis",
                                        "email": "charlotte@example.com",
                                        "profile_image": null,
                                        "total_points": "700"
                                    },
                                    {
                                        "user_id": 5,
                                        "user_name": "Michael Brown",
                                        "email": "michael@example.com",
                                        "profile_image": null,
                                        "total_points": "450"
                                    },
                                    {
                                        "user_id": 13,
                                        "user_name": "Benjamin Jackson",
                                        "email": "benjamin@example.com",
                                        "profile_image": null,
                                        "total_points": "450"
                                    },
                                    {
                                        "user_id": 1,
                                        "user_name": "John Doe",
                                        "email": "john@example.com",
                                        "profile_image": null,
                                        "total_points": "450"
                                    }
                                ]
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
            id: "get-users-with-highest-points",
            name: "Get Users With Highest Points",
            method: "GET",
            url: "/reporting/leaderboard-gamification/users-with-highest-points",
            description: "Get a list of users with the highest points, including their completed challenges.",
            parameters: [],
            responses: [
                {
                    status: 200,
                    description: "Successfully retrieved users with highest points.",
                    example: {
                        "success": true,
                        "data": [
                            {
                                "user_id": 11,
                                "full_name": "James Moore",
                                "email": "james@example.com",
                                "profile_image": null,
                                "total_points": 181,
                                "points_earned": 181,
                                "completed_challenges": [
                                    "Basic Arithmetic"
                                ]
                            },
                            {
                                "user_id": 7,
                                "full_name": "David Wilson",
                                "email": "david@example.com",
                                "profile_image": null,
                                "total_points": 174,
                                "points_earned": 174,
                                "completed_challenges": []
                            },
                            {
                                "user_id": 15,
                                "full_name": "Daniel Harris",
                                "email": "daniel@example.com",
                                "profile_image": null,
                                "total_points": 171,
                                "points_earned": 171,
                                "completed_challenges": [
                                    "Algebra Mastery Challenge",
                                    "Ancient Civilizations",
                                    "Animal Kingdom",
                                    "Chemistry Fundamentals",
                                    "JavaScript Fundamentals Challenge",
                                    "Python Basics",
                                    "Synonyms & Antonyms"
                                ]
                            },
                            {
                                "user_id": 10,
                                "full_name": "Sophia Anderson",
                                "email": "sophia@example.com",
                                "profile_image": null,
                                "total_points": 169,
                                "points_earned": 169,
                                "completed_challenges": [
                                    "Python Basics",
                                    "Web Development Basics"
                                ]
                            },
                            {
                                "user_id": 3,
                                "full_name": "Alex Johnson",
                                "email": "alex@example.com",
                                "profile_image": null,
                                "total_points": 167,
                                "points_earned": 167,
                                "completed_challenges": [
                                    "Algebra Mastery Challenge"
                                ]
                            },
                            {
                                "user_id": 17,
                                "full_name": "Logan Clark",
                                "email": "logan@example.com",
                                "profile_image": null,
                                "total_points": 159,
                                "points_earned": 159,
                                "completed_challenges": []
                            },
                            {
                                "user_id": 8,
                                "full_name": "Olivia Martinez",
                                "email": "olivia@example.com",
                                "profile_image": null,
                                "total_points": 158,
                                "points_earned": 158,
                                "completed_challenges": [
                                    "Basic Arithmetic"
                                ]
                            },
                            {
                                "user_id": 16,
                                "full_name": "Charlotte Lewis",
                                "email": "charlotte@example.com",
                                "profile_image": null,
                                "total_points": 148,
                                "points_earned": 148,
                                "completed_challenges": [
                                    "Chemistry Fundamentals"
                                ]
                            },
                            {
                                "user_id": 1,
                                "full_name": "John Doe",
                                "email": "john@example.com",
                                "profile_image": null,
                                "total_points": 141,
                                "points_earned": 141,
                                "completed_challenges": [
                                    "Animal Kingdom",
                                    "Basic Arithmetic",
                                    "JavaScript Fundamentals Challenge",
                                    "Pop Culture",
                                    "Synonyms & Antonyms",
                                    "Web Development Basics"
                                ]
                            },
                            {
                                "user_id": 13,
                                "full_name": "Benjamin Jackson",
                                "email": "benjamin@example.com",
                                "profile_image": null,
                                "total_points": 140,
                                "points_earned": 140,
                                "completed_challenges": [
                                    "Animal Kingdom",
                                    "JavaScript Fundamentals Challenge"
                                ]
                            },
                            {
                                "user_id": 6,
                                "full_name": "Emily Davis",
                                "email": "emily@example.com",
                                "profile_image": null,
                                "total_points": 130,
                                "points_earned": 130,
                                "completed_challenges": [
                                    "Animal Kingdom",
                                    "Chemistry Fundamentals"
                                ]
                            },
                            {
                                "user_id": 5,
                                "full_name": "Michael Brown",
                                "email": "michael@example.com",
                                "profile_image": null,
                                "total_points": 124,
                                "points_earned": 124,
                                "completed_challenges": [
                                    "Ancient Civilizations",
                                    "Animal Kingdom"
                                ]
                            },
                            {
                                "user_id": 4,
                                "full_name": "Sarah Williams",
                                "email": "sarah@example.com",
                                "profile_image": null,
                                "total_points": 113,
                                "points_earned": 113,
                                "completed_challenges": [
                                    "Python Basics",
                                    "Web Development Basics"
                                ]
                            },
                            {
                                "user_id": 12,
                                "full_name": "Ava Thomas",
                                "email": "ava@example.com",
                                "profile_image": null,
                                "total_points": 110,
                                "points_earned": 110,
                                "completed_challenges": [
                                    "Pop Culture",
                                    "Python Basics",
                                    "Web Development Basics"
                                ]
                            },
                            {
                                "user_id": 9,
                                "full_name": "William Taylor",
                                "email": "william@example.com",
                                "profile_image": null,
                                "total_points": 60,
                                "points_earned": 60,
                                "completed_challenges": [
                                    "JavaScript Fundamentals Challenge",
                                    "Python Basics"
                                ]
                            },
                            {
                                "user_id": 2,
                                "full_name": "demo",
                                "email": "demo123@example.com",
                                "profile_image": null,
                                "total_points": 55,
                                "points_earned": 55,
                                "completed_challenges": []
                            },
                            {
                                "user_id": 14,
                                "full_name": "Mia White",
                                "email": "mia@example.com",
                                "profile_image": null,
                                "total_points": 52,
                                "points_earned": 52,
                                "completed_challenges": [
                                    "Chemistry Fundamentals"
                                ]
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

export default leaderboardAnalyticsData;
