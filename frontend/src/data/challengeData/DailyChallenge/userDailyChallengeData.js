const userDailyChallengeData = {
    id: 'user-daily-challenge',
    name: 'User Daily Challenge',
    description: 'The User Daily Challenge API provides endpoints to manage and interact with daily challenges for users. It includes functionality to start challenges, check answers, track streaks, manage points, and view challenge history.',
    endpoints: [
        {
            id: 'start-challenge-by-id',
            name: 'Start Challenge By ID',
            method: 'GET',
            url: '/user/challenge/start/:id',
            description: 'Get challenge data by ID to start the challenge (does not include answers).',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge to start',
                    example: '12'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved challenge data',
                    example: {
                        "success": true,
                        "challenge": {
                            "id": 12,
                            "title": "Algebra Basics",
                            "description": "Test your fundamental algebra skills",
                            "category": "Maths",
                            "difficulty_level": "Beginner",
                            "time_limit": null,
                            "estimated_time": null,
                            "qualify_percentage": 70,
                            "max_attempt": 3,
                            "is_per_question_reward": 0,
                            "points_reward": 100,
                            "per_question_reward": 0,
                            "start_date": "2023-06-12T00:00:00.000Z",
                            "end_date": null,
                            "is_active": 1,
                            "created_at": "2025-05-12T10:54:38.000Z",
                            "updated_at": "2025-05-12T10:54:38.000Z",
                            "categoryDetails": {
                                "id": 1,
                                "category": "Maths"
                            },
                            "FillInTheBlanksChallenge": [
                                {
                                    "id": null,
                                    "text": null,
                                    "is_active": null,
                                    "challenge_id": null
                                }
                            ],
                            "MCQChallenges": [
                                {
                                    "id": 56,
                                    "is_active": 1,
                                    "challenge_id": 12,
                                    "question_text": "What is the degree of a linear equation?",
                                    "MCQOptionChallenges": [
                                        {
                                            "id": 221,
                                            "option_text": "0",
                                            "option_type": "text"
                                        },
                                        {
                                            "id": 222,
                                            "option_text": "1",
                                            "option_type": "text"
                                        },
                                        {
                                            "id": 223,
                                            "option_text": "2",
                                            "option_type": "text"
                                        },
                                        {
                                            "id": 224,
                                            "option_text": "3",
                                            "option_type": "text"
                                        }
                                    ]
                                },
                                {
                                    "id": 57,
                                    "is_active": 1,
                                    "challenge_id": 12,
                                    "question_text": "Which is not an algebraic expression?",
                                    "MCQOptionChallenges": [
                                        {
                                            "id": 225,
                                            "option_text": "2x + 3",
                                            "option_type": "text"
                                        },
                                        {
                                            "id": 226,
                                            "option_text": "5y - 7",
                                            "option_type": "text"
                                        },
                                        {
                                            "id": 227,
                                            "option_text": "4 + 8",
                                            "option_type": "text"
                                        },
                                        {
                                            "id": 228,
                                            "option_text": "3a + b",
                                            "option_type": "text"
                                        }
                                    ]
                                },
                                {
                                    "id": 58,
                                    "is_active": 1,
                                    "challenge_id": 12,
                                    "question_text": "What is the solution to x² = 16?",
                                    "MCQOptionChallenges": [
                                        {
                                            "id": 229,
                                            "option_text": "4",
                                            "option_type": "text"
                                        },
                                        {
                                            "id": 230,
                                            "option_text": "-4",
                                            "option_type": "text"
                                        },
                                        {
                                            "id": 231,
                                            "option_text": "±4",
                                            "option_type": "text"
                                        },
                                        {
                                            "id": 232,
                                            "option_text": "8",
                                            "option_type": "text"
                                        }
                                    ]
                                },
                                {
                                    "id": 59,
                                    "is_active": 1,
                                    "challenge_id": 12,
                                    "question_text": "Which property is demonstrated by a(b + c) = ab + ac?",
                                    "MCQOptionChallenges": [
                                        {
                                            "id": 233,
                                            "option_text": "Commutative",
                                            "option_type": "text"
                                        },
                                        {
                                            "id": 234,
                                            "option_text": "Associative",
                                            "option_type": "text"
                                        },
                                        {
                                            "id": 235,
                                            "option_text": "Distributive",
                                            "option_type": "text"
                                        },
                                        {
                                            "id": 236,
                                            "option_text": "Identity",
                                            "option_type": "text"
                                        }
                                    ]
                                },
                                {
                                    "id": 60,
                                    "is_active": 1,
                                    "challenge_id": 12,
                                    "question_text": "What is the y-intercept in y = 2x + 3?",
                                    "MCQOptionChallenges": [
                                        {
                                            "id": 237,
                                            "option_text": "2",
                                            "option_type": "text"
                                        },
                                        {
                                            "id": 238,
                                            "option_text": "3",
                                            "option_type": "text"
                                        },
                                        {
                                            "id": 239,
                                            "option_text": "0",
                                            "option_type": "text"
                                        },
                                        {
                                            "id": 240,
                                            "option_text": "-3",
                                            "option_type": "text"
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                }
            ]
        },
        {
            id: 'get-completed-dates',
            name: 'Get Completed Dates',
            method: 'GET',
            url: '/user/challenge/complete-dates',
            description: 'Get dates when challenges were completed and not completed by the user.',
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved completion dates',
                    example: {
                        "success": true,
                        "completed": [
                            "2025-04-21"
                        ],
                        "not_completed": [
                            "2025-04-18",
                            "2025-05-01",
                            "2025-05-04",
                            "2025-05-11"
                        ]
                    }
                }
            ]
        },
        {
            id: 'get-user-streak',
            name: 'Get User Streak',
            method: 'GET',
            url: '/user/challenge/streak',
            description: 'Get the current and longest streak of completed challenges for the user.',
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved user streak',
                    example: {
                        "success": true,
                        "userStreak": {
                            "id": 2,
                            "user_id": 2,
                            "current_streak": 1,
                            "longest_streak": 1,
                            "last_completed_date": "2025-05-13T00:00:00.000Z",
                            "missed_days": 0,
                            "created_at": "2025-05-13T09:07:28.000Z",
                            "updated_at": "2025-05-13T09:07:28.000Z"
                        }
                    }
                }
            ]
        },
        {
            id: 'get-user-points',
            name: 'Get User Points',
            method: 'GET',
            url: '/user/challenge/points',
            description: 'Get the current points and point history for the user.',
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved user points',
                    example: {
                        "success": true,
                        "userPoints": {
                            "id": 2,
                            "user_id": 2,
                            "points": 200,
                            "total_earned": 200,
                            "total_spent": 0,
                            "last_updated": "2025-05-13T08:41:36.000Z"
                        }
                    }
                }
            ]
        },
        {
            id: 'update-user-points',
            name: 'Update User Points',
            method: 'PUT',
            url: '/user/challenge/points',
            description: 'Add or subtract points from the user account.',
            parameters: [
                {
                    name: 'points',
                    type: 'number',
                    required: true,
                    description: 'Number of points to add/subtract',
                    example: 30
                },
                {
                    name: 'is_add',
                    type: 'boolean',
                    required: true,
                    description: 'Whether to add (true) or subtract (false) points',
                    example: false
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Successfully updated user points',
                    example: {
                        "success": true,
                        "message": "User points updated successfully.",
                        "userPoints": {
                            "id": 5,
                            "user_id": 5,
                            "points": 120,
                            "total_earned": 150,
                            "total_spent": 30,
                            "last_updated": "2025-05-13T09:27:23.174Z"
                        }
                    }
                }
            ]
        },
        {
            id: 'check-challenge-answers',
            name: 'Check Challenge Answers',
            method: 'POST',
            url: '/user/challenge/check',
            description: 'Submit answers for a challenge and get results with score and rewards.',
            parameters: [
                {
                    name: 'challenge_id',
                    type: 'number',
                    required: true,
                    description: 'ID of the challenge being checked',
                    example: 12
                },
                {
                    name: 'userAnswers',
                    type: 'array',
                    required: true,
                    description: 'Array of user answers',
                    example: [
                        {
                            "question_id": 56,
                            "selected_option_id": 222
                        },
                        {
                            "question_id": 57,
                            "selected_option_id": 227
                        },
                        {
                            "question_id": 58,
                            "selected_option_id": 231
                        },
                        {
                            "question_id": 59,
                            "selected_option_id": 235
                        },
                        {
                            "question_id": 60,
                            "selected_option_id": 238
                        }
                    ]
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Successfully checked answers',
                    example: {
                        "success": 1,
                        "message": "Challenge checked successfully.",
                        "results": [],
                        "score": "0/5",
                        "totalRewardPoints": 100
                    }
                }
            ]
        },
        {
            id: 'assign-challenge',
            name: 'Assign Challenge',
            method: 'POST',
            url: '/user/challenge/assign',
            description: 'Assign a new challenge to the user based on category and difficulty.',
            parameters: [
                {
                    name: 'category',
                    type: 'number|string',
                    required: true,
                    description: 'Category ID or name for the challenge',
                    example: "2"
                },
                {
                    name: 'difficulty_level',
                    type: 'string',
                    required: true,
                    description: 'Difficulty level for the challenge',
                    example: "Beginner"
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Successfully assigned challenge',
                    example: {
                        "success": true,
                        "message": "Challenge assigned successfully!",
                        "data": {
                            "id": 17,
                            "user_id": 4,
                            "challenge_id": 17,
                            "attempts": 0,
                            "is_completed": 0,
                            "points_earned": 0,
                            "assigned_at": "2025-05-13T09:15:01.000Z"
                        }
                    }
                }
            ]
        },
        {
            id: 'check-assigned-challenge',
            name: 'Check Assigned Challenge',
            method: 'GET',
            url: '/user/challenge/check-assigned',
            description: 'Check if the user has an assigned challenge and get its details.',
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved assigned challenge',
                    example: {
                        "assigned": true,
                        "userChallenge": {
                            "id": 16,
                            "user_id": 2,
                            "challenge_id": 12,
                            "attempts": 1,
                            "is_completed": true,
                            "completed_at": "2025-05-13T08:45:28.000Z",
                            "points_earned": 100,
                            "assigned_at": "2025-05-13T08:44:53.000Z",
                            "DailyChallenge": {
                                "id": 12,
                                "title": "Algebra Basics",
                                "description": "Test your fundamental algebra skills",
                                "category": 1,
                                "difficulty_level": "Beginner",
                                "time_limit": null,
                                "estimated_time": null,
                                "qualify_percentage": 70,
                                "max_attempt": 3,
                                "is_per_question_reward": false,
                                "points_reward": 100,
                                "per_question_reward": 0,
                                "start_date": "2023-06-12T00:00:00.000Z",
                                "end_date": null,
                                "is_active": true,
                                "created_at": "2025-05-13T08:41:37.000Z",
                                "updated_at": "2025-05-13T08:41:37.000Z",
                                "categoryDetails": {
                                    "id": 1,
                                    "category": "Maths",
                                    "is_active": true,
                                    "created_by": 1,
                                    "updated_by": 1,
                                    "created_at": "2025-05-13T08:41:36.000Z",
                                    "updated_at": "2025-05-13T08:41:36.000Z"
                                }
                            }
                        }
                    }
                }
            ]
        },
        {
            id: 'get-challenge-by-date',
            name: 'Get Challenge By Date',
            method: 'GET',
            url: '/user/challenge/',
            description: 'Get the challenge assigned for the current date.',
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved challenge',
                    example: {
                        "success": true,
                        "userChallenge": {
                            "id": 16,
                            "user_id": 2,
                            "challenge_id": 12,
                            "attempts": 1,
                            "is_completed": true,
                            "completed_at": "2025-05-13T08:45:28.000Z",
                            "points_earned": 100,
                            "assigned_at": "2025-05-13T08:44:53.000Z",
                            "DailyChallenge": {
                                "id": 12,
                                "title": "Algebra Basics",
                                "description": "Test your fundamental algebra skills",
                                "category": 1,
                                "difficulty_level": "Beginner",
                                "time_limit": null,
                                "estimated_time": null,
                                "qualify_percentage": 70,
                                "max_attempt": 3,
                                "is_per_question_reward": false,
                                "points_reward": 100,
                                "per_question_reward": 0,
                                "start_date": "2023-06-12T00:00:00.000Z",
                                "end_date": null,
                                "is_active": true,
                                "created_at": "2025-05-13T08:41:37.000Z",
                                "updated_at": "2025-05-13T08:41:37.000Z",
                                "categoryDetails": {
                                    "id": 1,
                                    "category": "Maths",
                                    "is_active": true,
                                    "created_by": 1,
                                    "updated_by": 1,
                                    "created_at": "2025-05-13T08:41:36.000Z",
                                    "updated_at": "2025-05-13T08:41:36.000Z"
                                }
                            }
                        }
                    }
                }
            ]
        },
        {
            id: 'get-user-challenge-by-id',
            name: 'Get User Challenge By ID',
            method: 'GET',
            url: '/user/challenge/:id',
            description: 'Get details of a specific user challenge by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the user challenge to retrieve',
                    example: '16'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved user challenge',
                    example: {
                        "success": true,
                        "userChallenge": {
                            "id": 16,
                            "user_id": 2,
                            "challenge_id": 12,
                            "attempts": 1,
                            "is_completed": 1,
                            "completed_at": "2025-05-13T08:45:28.000Z",
                            "points_earned": 100,
                            "assigned_at": "2025-05-13T08:44:53.000Z",
                            "DailyChallenge": {
                                "id": 12,
                                "title": "Algebra Basics",
                                "description": "Test your fundamental algebra skills",
                                "category": "Maths",
                                "difficulty_level": "Beginner",
                                "time_limit": null,
                                "estimated_time": null,
                                "qualify_percentage": 70,
                                "max_attempt": 3,
                                "is_per_question_reward": 0,
                                "points_reward": 100,
                                "per_question_reward": 0,
                                "start_date": "2023-06-12T00:00:00.000Z",
                                "end_date": null,
                                "is_active": 1,
                                "created_at": "2025-05-13T08:41:37.000Z",
                                "updated_at": "2025-05-13T08:41:37.000Z",
                                "categoryDetails": {
                                    "id": 1,
                                    "category": "Maths",
                                    "is_active": 1,
                                    "created_by": 1,
                                    "updated_by": 1,
                                    "created_at": "2025-05-13T08:41:36.000Z",
                                    "updated_at": "2025-05-13T08:41:36.000Z"
                                }
                            }
                        }
                    }
                }
            ]
        }
    ]
};

export default userDailyChallengeData;