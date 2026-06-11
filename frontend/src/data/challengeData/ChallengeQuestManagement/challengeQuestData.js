const challengeQuestData = {
    id: 'challenge-quest',
    name: 'Challenge Quest',
    description: 'The Challenge Quest API provides endpoints to manage challenge quests in the system. These endpoints allow you to create, read, update, delete, and toggle the active status of challenge quests.',
    endpoints: [
        {
            id: 'get-all-challenge-quests',
            name: 'Get All Challenge Quests',
            method: 'GET',
            url: '/challenge/quest/',
            description: 'Get a list of all challenges that are stored in database.',
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved all challenge quests',
                    example: {
                        "success": true,
                        "data": [
                            {
                                "id": 1,
                                "title": "JavaScript Fundamentals Challenge",
                                "description": "Master the basics of JavaScript programming",
                                "duration": 14,
                                "difficulty_level": "Beginner",
                                "category_id": 4,
                                "category_name": "Coding",
                                "reward_points": 500,
                                "status": "active",
                                "startDate": "2025-05-12T08:33:34.000Z",
                                "endDate": "2025-05-26T08:33:34.000Z",
                                "max_attempt": 3,
                                "rules": "Complete all phases to earn the full reward",
                                "is_active": 1,
                                "created_at": "2025-05-12T08:33:34.000Z",
                                "updated_at": "2025-05-12T08:33:34.000Z"
                            },
                            {
                                "id": 2,
                                "title": "Web Development Basics",
                                "description": "Learn HTML, CSS and basic web concepts",
                                "duration": 21,
                                "difficulty_level": "Beginner",
                                "category_id": 4,
                                "category_name": "Coding",
                                "reward_points": 750,
                                "status": "active",
                                "startDate": "2025-05-12T08:33:34.000Z",
                                "endDate": "2025-06-02T08:33:34.000Z",
                                "max_attempt": 3,
                                "rules": "Complete all tasks to unlock the next phase",
                                "is_active": 1,
                                "created_at": "2025-05-12T08:33:34.000Z",
                                "updated_at": "2025-05-12T08:33:34.000Z"
                            },
                            {
                                "id": 3,
                                "title": "Algebra Mastery Challenge",
                                "description": "Develop core algebra skills through practical problems",
                                "duration": 10,
                                "difficulty_level": "Intermediate",
                                "category_id": 1,
                                "category_name": "Maths",
                                "reward_points": 600,
                                "status": "active",
                                "startDate": "2025-05-12T08:33:34.000Z",
                                "endDate": "2025-05-22T08:33:34.000Z",
                                "max_attempt": 2,
                                "rules": "Show your work for full credit on problem-solving tasks",
                                "is_active": 1,
                                "created_at": "2025-05-12T08:33:34.000Z",
                                "updated_at": "2025-05-12T08:33:34.000Z"
                            },
                            {
                                "id": 4,
                                "title": "Chemistry Fundamentals",
                                "description": "Explore atomic structure and chemical bonding",
                                "duration": 14,
                                "difficulty_level": "Intermediate",
                                "category_id": 2,
                                "category_name": "Science",
                                "reward_points": 700,
                                "status": "active",
                                "startDate": "2025-05-12T08:33:35.000Z",
                                "endDate": "2025-05-26T08:33:35.000Z",
                                "max_attempt": 3,
                                "rules": "Complete all lab simulations for full credit",
                                "is_active": 1,
                                "created_at": "2025-05-12T08:33:35.000Z",
                                "updated_at": "2025-05-12T08:33:35.000Z"
                            },
                            {
                                "id": 5,
                                "title": "Ancient Civilizations",
                                "description": "Explore the rise and fall of early empires",
                                "duration": 21,
                                "difficulty_level": "Beginner",
                                "category_id": 3,
                                "category_name": "History",
                                "reward_points": 550,
                                "status": "active",
                                "startDate": "2025-05-12T08:33:35.000Z",
                                "endDate": "2025-06-02T08:33:35.000Z",
                                "max_attempt": 3,
                                "rules": "Cite sources for all research tasks",
                                "is_active": 1,
                                "created_at": "2025-05-12T08:33:35.000Z",
                                "updated_at": "2025-05-12T08:33:35.000Z"
                            },
                            {
                                "id": 6,
                                "title": "Basic Arithmetic",
                                "description": "Master addition and subtraction",
                                "duration": 10,
                                "difficulty_level": "Beginner",
                                "category_id": 1,
                                "category_name": "Maths",
                                "reward_points": 400,
                                "status": "active",
                                "startDate": "2025-05-12T08:33:35.000Z",
                                "endDate": "2025-05-22T08:33:35.000Z",
                                "max_attempt": 3,
                                "rules": "Show your work",
                                "is_active": 1,
                                "created_at": "2025-05-12T08:33:35.000Z",
                                "updated_at": "2025-05-12T08:33:35.000Z"
                            },
                            {
                                "id": 7,
                                "title": "Animal Kingdom",
                                "description": "Learn about mammals and birds",
                                "duration": 14,
                                "difficulty_level": "Beginner",
                                "category_id": 2,
                                "category_name": "Science",
                                "reward_points": 450,
                                "status": "active",
                                "startDate": "2025-05-12T08:33:35.000Z",
                                "endDate": "2025-05-26T08:33:35.000Z",
                                "max_attempt": 3,
                                "rules": "No external resources",
                                "is_active": 1,
                                "created_at": "2025-05-12T08:33:35.000Z",
                                "updated_at": "2025-05-12T08:33:35.000Z"
                            },
                            {
                                "id": 8,
                                "title": "Ancient Wonders",
                                "description": "Explore the Seven Wonders",
                                "duration": 14,
                                "difficulty_level": "Beginner",
                                "category_id": 3,
                                "category_name": "History",
                                "reward_points": 500,
                                "status": "active",
                                "startDate": "2025-05-12T08:33:35.000Z",
                                "endDate": "2025-05-26T08:33:35.000Z",
                                "max_attempt": 3,
                                "rules": "Cite sources if needed",
                                "is_active": 1,
                                "created_at": "2025-05-12T08:33:35.000Z",
                                "updated_at": "2025-05-12T08:33:35.000Z"
                            },
                            {
                                "id": 9,
                                "title": "Python Basics",
                                "description": "Learn simple Python syntax",
                                "duration": 14,
                                "difficulty_level": "Beginner",
                                "category_id": 4,
                                "category_name": "Coding",
                                "reward_points": 500,
                                "status": "active",
                                "startDate": "2025-05-12T08:33:35.000Z",
                                "endDate": "2025-05-26T08:33:35.000Z",
                                "max_attempt": 3,
                                "rules": "No IDE use",
                                "is_active": 1,
                                "created_at": "2025-05-12T08:33:35.000Z",
                                "updated_at": "2025-05-12T08:33:35.000Z"
                            },
                            {
                                "id": 10,
                                "title": "Synonyms & Antonyms",
                                "description": "Match similar and opposite words",
                                "duration": 10,
                                "difficulty_level": "Beginner",
                                "category_id": 5,
                                "category_name": "English",
                                "reward_points": 400,
                                "status": "active",
                                "startDate": "2025-05-12T08:33:35.000Z",
                                "endDate": "2025-05-22T08:33:35.000Z",
                                "max_attempt": 3,
                                "rules": "No thesaurus",
                                "is_active": 1,
                                "created_at": "2025-05-12T08:33:35.000Z",
                                "updated_at": "2025-05-12T08:33:35.000Z"
                            },
                            {
                                "id": 11,
                                "title": "Pop Culture",
                                "description": "Test your knowledge of movies and music",
                                "duration": 7,
                                "difficulty_level": "Beginner",
                                "category_id": 6,
                                "category_name": "Other",
                                "reward_points": 350,
                                "status": "active",
                                "startDate": "2025-05-12T08:33:35.000Z",
                                "endDate": "2025-05-19T08:33:35.000Z",
                                "max_attempt": 3,
                                "rules": "No internet searches",
                                "is_active": 1,
                                "created_at": "2025-05-12T08:33:35.000Z",
                                "updated_at": "2025-05-12T08:33:35.000Z"
                            }
                        ]
                    }
                }
            ]
        },
        {
            id: 'get-challenge-quest-by-id',
            name: 'Get Challenge Quest By ID',
            method: 'GET',
            url: '/challenge/quest/{id}',
            description: 'Get a specific challenge details according to their id.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge quest to retrieve',
                    example: '1'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved the challenge quest',
                    example: {
                        "success": true
                    }
                },
                {
                    status: 400,
                    description: 'ChallengeQuest ID is required.',
                    example: {
                        "success": false,
                        "message": "ChallengeQuest ID is required."
                    }
                },
                {
                    status: 404,
                    description: 'Challenge quest not found',
                    example: {
                        "success": false,
                        "message": "Challenge quest not found"
                    }
                }
            ]
        },
        {
            id: 'create-challenge-quest',
            name: 'Create Challenge Quest',
            method: 'POST',
            url: '/challenge/quest/',
            description: 'Create a new challenge in the system.',
            parameters: [
                {
                    name: 'title',
                    type: 'string',
                    required: true,
                    description: 'Title of the challenge quest, Title must be a valid string between 1-100 characters.',
                    example: '30-Day Fitness Challenge'
                },
                {
                    name: 'description',
                    type: 'string',
                    required: true,
                    description: 'Description of the challenge quest',
                    example: 'Complete a new workout every day for 30 days.'
                },
                {
                    name: 'duration',
                    type: 'number',
                    required: true,
                    description: 'Duration of the challenge in days',
                    example: 30
                },
                {
                    name: 'difficulty_level',
                    type: 'string',
                    required: true,
                    description: 'Difficulty level of the challenge, Difficulty level must be one of: Beginner, Intermediate, Advanced',
                    example: 'Intermediate'
                },
                {
                    name: 'category_id',
                    type: 'number',
                    required: true,
                    description: 'ID of the category this challenge belongs to',
                    example: 1
                },
                {
                    name: 'reward_points',
                    type: 'number',
                    required: false,
                    description: 'Points rewarded for completing the challenge',
                    example: 100
                },
                {
                    name: 'status',
                    type: 'string',
                    required: false,
                    description: 'Status of the challenge',
                    example: 'active'
                },
                {
                    name: 'startDate',
                    type: 'string',
                    required: false,
                    description: 'Start date of the challenge',
                    example: '2025-05-15'
                },
                {
                    name: 'endDate',
                    type: 'string',
                    required: false,
                    description: 'End date of the challenge',
                    example: '2025-06-14'
                },
                {
                    name: 'max_attempt',
                    type: 'number',
                    required: false,
                    description: 'Maximum number of attempts allowed, default is 3',
                    example: 3
                },
                {
                    name: 'rules',
                    type: 'string',
                    required: false,
                    description: 'Rules for the challenge By default, rules are empty.',
                    example: 'No skipping days. Each day must be completed before midnight.'
                }
            ],
            responses: [
                {
                    status: 201,
                    description: 'Challenge created successfully',
                    example: {
                        "success": true,
                        "message": "Challenge created successfully",
                        "challenge": [
                            {
                                "id": 12,
                                "title": "30-Day Fitness Challenge",
                                "description": "Complete a new workout every day for 30 days.",
                                "duration": 30,
                                "difficulty_level": "Intermediate",
                                "category_id": 1,
                                "reward_points": 100,
                                "status": "active",
                                "startDate": "2025-05-15T00:00:00.000Z",
                                "endDate": "2025-06-14T00:00:00.000Z",
                                "max_attempt": 3,
                                "rules": "No skipping days. Each day must be completed before midnight.",
                                "is_active": 1,
                                "created_at": null,
                                "updated_at": null
                            }
                        ]
                    }
                },
                {
                    status: 400,
                    description: 'Validation error',
                    example: {
                        "success": false,
                        "message": "Required fields are missing"
                    }
                },
                {
                    status: 404,
                    description: 'Category not found',
                    example: {
                        "success": false,
                        "message": "The specified category does not exist."
                    }
                }
            ]
        },
        {
            id: 'update-challenge-quest',
            name: 'Update Challenge Quest',
            method: 'PUT',
            url: '/challenge/quest/{id}',
            description: 'Update an existing challenge by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge quest to update',
                    example: '12'
                },
                {
                    name: 'title',
                    type: 'string',
                    required: false,
                    description: 'Updated title of the challenge quest, must be a valid string between 1-100 characters.',
                    example: 'Updated 30-Day Fitness Challenge'
                },
                {
                    name: 'description',
                    type: 'string',
                    required: false,
                    description: 'Updated description of the challenge quest',
                    example: 'Updated: Do a new workout every day for 30 days to build consistency.'
                },
                {
                    name: 'duration',
                    type: 'number',
                    required: false,
                    description: 'Updated duration of the challenge in days',
                    example: 30
                },
                {
                    name: 'difficulty_level',
                    type: 'string',
                    required: false,
                    description: 'Updated difficulty level of the challenge, must be one of: Beginner, Intermediate, Advanced',
                    example: 'Advanced'
                },
                {
                    name: 'category_id',
                    type: 'number',
                    required: false,
                    description: 'Updated ID of the category this challenge belongs to',
                    example: 1
                },
                {
                    name: 'reward_points',
                    type: 'number',
                    required: false,
                    description: 'Updated points rewarded for completing the challenge',
                    example: 150
                },
                {
                    name: 'status',
                    type: 'string',
                    required: false,
                    description: 'Updated status of the challenge',
                    example: 'active'
                },
                {
                    name: 'startDate',
                    type: 'string',
                    required: false,
                    description: 'Updated start date of the challenge',
                    example: '2025-05-20'
                },
                {
                    name: 'endDate',
                    type: 'string',
                    required: false,
                    description: 'Updated end date of the challenge',
                    example: '2025-06-18'
                },
                {
                    name: 'max_attempt',
                    type: 'number',
                    required: false,
                    description: 'Updated maximum number of attempts allowed',
                    example: 5
                },
                {
                    name: 'rules',
                    type: 'string',
                    required: false,
                    description: 'Updated rules for the challenge',
                    example: 'No cheating. Daily check-ins required.'
                },
                {
                    name: 'is_active',
                    type: 'boolean',
                    required: false,
                    description: 'Updated active status of the challenge',
                    example: true
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Challenge updated successfully',
                    example: {
                        "success": true,
                        "message": "Challenge updated successfully",
                        "challenge": [
                            {
                                "id": 12,
                                "title": "Updated 30-Day Fitness Challenge",
                                "description": "Updated: Do a new workout every day for 30 days to build consistency.",
                                "duration": 30,
                                "difficulty_level": "Advanced",
                                "category_id": 1,
                                "reward_points": 150,
                                "status": "active",
                                "startDate": "2025-05-20T00:00:00.000Z",
                                "endDate": "2025-06-18T00:00:00.000Z",
                                "max_attempt": 5,
                                "rules": "No cheating. Daily check-ins required.",
                                "is_active": 1,
                                "created_at": null,
                                "updated_at": "2025-05-12T10:09:41.000Z"
                            }
                        ]
                    }
                },
                {
                    status: 400,
                    description: 'Validation error',
                    example: {
                        "success": false,
                        "message": "Required fields are missing or invalid"
                    }
                },
                {
                    status: 404,
                    description: 'Challenge quest not found',
                    example: {
                        "success": false,
                        "message": "Challenge quest not found"
                    }
                }
            ]
        },
        {
            id: 'delete-challenge-quest',
            name: 'Delete Challenge Quest',
            method: 'DELETE',
            url: '/challenge/quest/{id}',
            description: 'Delete a particular challenge by id.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge quest to delete',
                    example: '12'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Challenge deleted successfully',
                    example: {
                        "success": true,
                        "message": "Challenge deleted successfully"
                    }
                },
                {
                    status: 400,
                    description: 'ChallengeQuest ID is required.',
                    example: {
                        "success": false,
                        "message": "ChallengeQuest ID is required."
                    }
                },
                {
                    status: 404,
                    description: 'Challenge quest not found',
                    example: {
                        "success": false,
                        "message": "Challenge quest not found"
                    }
                }
            ]
        },
        {
            id: 'toggle-challenge-quest-status',
            name: 'Toggle Challenge Quest Status',
            method: 'PATCH',
            url: '/challenge/quest/{id}',
            description: 'Toggle the active status of a challenge (making challenge is_active 0 and 1).',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge quest to toggle status',
                    example: '12'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Challenge status toggled successfully',
                    example: {
                        "success": true
                    }
                },
                {
                    status: 400,
                    description: 'ChallengeQuest ID is required.',
                    example: {
                        "success": false,
                        "message": "ChallengeQuest ID is required."
                    }
                },
                {
                    status: 404,
                    description: 'Challenge quest not found',
                    example: {
                        "success": false,
                        "message": "Challenge quest not found"
                    }
                }
            ]
        }
    ]
};

export default challengeQuestData;