const dailyChallengeData = {
    id: 'daily-challenge',
    name: 'Daily Challenge',
    description: 'The Daily Challenge API provides endpoints to manage daily challenges in the system. These endpoints allow you to create, read, update, delete, and manage the status of daily challenges along with their associated questions (Fill in the Blanks, MCQs, True/False).',
    endpoints: [
        {
            id: 'create-daily-challenge',
            name: 'Create Daily Challenge',
            method: 'POST',
            url: '/challenge/',
            description: 'Create a new daily challenge with optional questions (Fill in the Blanks, MCQs).',
            parameters: [
                {
                    name: 'title',
                    type: 'string',
                    required: true,
                    description: 'Title of the challenge',
                    example: 'Basic Math Quiz'
                },
                {
                    name: 'description',
                    type: 'string',
                    required: false,
                    description: 'Description of the challenge',
                    example: 'Test your basic math skills with this quiz'
                },
                {
                    name: 'category',
                    type: 'number',
                    required: true,
                    description: 'ID of the challenge category',
                    example: 1
                },
                {
                    name: 'difficulty_level',
                    type: 'string',
                    required: true,
                    description: 'Difficulty level of the challenge',
                    enum: ['Beginner', 'Intermediate', 'Advanced'],
                    example: 'Beginner'
                },
                {
                    name: 'time_limit',
                    type: 'number',
                    required: false,
                    description: 'Time limit in minutes',
                    example: 30
                },
                {
                    name: 'estimated_time',
                    type: 'number',
                    required: false,
                    description: 'Estimated completion time in minutes',
                    example: 20
                },
                {
                    name: 'qualify_percentage',
                    type: 'number',
                    required: false,
                    default: 70,
                    description: 'Percentage required to qualify',
                    example: 70
                },
                {
                    name: 'max_attempt',
                    type: 'number',
                    required: true,
                    description: 'Maximum number of attempts allowed',
                    example: 3
                },
                {
                    name: 'is_per_question_reward',
                    type: 'boolean',
                    required: true,
                    description: 'Whether rewards are given per question',
                    example: true
                },
                {
                    name: 'points_reward',
                    type: 'number',
                    required: false,
                    description: 'Total points reward (if not per question)',
                    example: 100
                },
                {
                    name: 'per_question_reward',
                    type: 'number',
                    required: false,
                    description: 'Points per question (if per question reward)',
                    example: 10
                },
                {
                    name: 'start_date',
                    type: 'string',
                    format: 'date-time',
                    required: true,
                    description: 'When the challenge becomes available',
                    example: '2025-05-20T00:00:00.000Z'
                },
                {
                    name: 'end_date',
                    type: 'string',
                    format: 'date-time',
                    required: false,
                    description: 'When the challenge expires',
                    example: '2025-05-27T00:00:00.000Z'
                },
                {
                    name: 'is_active',
                    type: 'boolean',
                    required: false,
                    default: true,
                    description: 'Whether the challenge is active',
                    example: true
                },
            ],
            responses: [
                {
                    status: 201,
                    description: 'Challenge created successfully',
                    example: {
                        "success": true,
                        "message": "Daily challenge created successfully!",
                        "challenge": {
                            "id": 1,
                            "title": "Basic Math Quiz",
                            "description": "Test your basic math skills with this quiz",
                            "category": 1,
                            "difficulty_level": "Beginner",
                            "time_limit": 30,
                            "estimated_time": 20,
                            "qualify_percentage": 70,
                            "max_attempt": 3,
                            "is_per_question_reward": true,
                            "per_question_reward": 10,
                            "start_date": "2025-05-20T00:00:00.000Z",
                            "end_date": "2025-05-27T00:00:00.000Z",
                            "is_active": true
                        }
                    }
                },
                {
                    status: 400,
                    description: 'Validation error',
                    example: {
                        "success": false,
                        "message": "Title is required"
                    }
                }
            ]
        },
        {
            id: 'get-all-daily-challenges',
            name: 'Get All Daily Challenges',
            method: 'GET',
            url: '/challenge/',
            description: 'Get a list of all daily challenges with their categories.',
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved all challenges',
                    example: [
                        {
                            "id": 1,
                            "title": "Basic Math Quiz",
                            "description": "Test your basic math skills with this quiz",
                            "category_id": 1,
                            "category_name": "Maths",
                            "difficulty_level": "Beginner",
                            "time_limit": 30,
                            "estimated_time": 20,
                            "qualify_percentage": 70,
                            "max_attempt": 3,
                            "is_per_question_reward": true,
                            "per_question_reward": 10,
                            "start_date": "2025-05-20T00:00:00.000Z",
                            "end_date": "2025-05-27T00:00:00.000Z",
                            "is_active": true
                        },
                        {
                            "id": 2,
                            "title": "Science Fundamentals",
                            "description": "Basic science questions",
                            "category_id": 2,
                            "category_name": "Science",
                            "difficulty_level": "Intermediate",
                            "time_limit": 45,
                            "estimated_time": 30,
                            "qualify_percentage": 75,
                            "max_attempt": 2,
                            "is_per_question_reward": false,
                            "points_reward": 100,
                            "start_date": "2025-05-21T00:00:00.000Z",
                            "is_active": true
                        }
                    ]
                }
            ]
        },
        {
            id: 'get-daily-challenge-by-id',
            name: 'Get Daily Challenge By ID',
            method: 'GET',
            url: '/challenge/{id}',
            description: 'Get a specific daily challenge by its ID with all associated questions.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge to retrieve',
                    example: '1'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved the challenge',
                    example: {
                        "success": true,
                        "challenge": {
                            "id": 1,
                            "title": "Basic Math Quiz",
                            "description": "Test your basic math skills with this quiz",
                            "difficulty_level": "Beginner",
                            "time_limit": 30,
                            "estimated_time": 20,
                            "qualify_percentage": 70,
                            "max_attempt": 3,
                            "is_per_question_reward": true,
                            "per_question_reward": 10,
                            "start_date": "2025-05-20T00:00:00.000Z",
                            "end_date": "2025-05-27T00:00:00.000Z",
                            "is_active": true,
                            "categoryDetails": {
                                "id": 1,
                                "category": "Maths"
                            },
                            "FillInTheBlanksChallenges": [
                                {
                                    "id": 1,
                                    "question": "The capital of France is ___.",
                                    "answer": "Paris",
                                    "explanation": "Paris is known as the capital of France.",
                                    "marks": 5
                                }
                            ],
                            "MCQChallenges": [
                                {
                                    "id": 1,
                                    "question": "What is 2+2?",
                                    "explanation": "Basic addition",
                                    "marks": 5,
                                    "options": [
                                        { "id": 1, "option": "3", "is_correct": false },
                                        { "id": 2, "option": "4", "is_correct": true },
                                        { "id": 3, "option": "5", "is_correct": false }
                                    ]
                                }
                            ],
                            "TrueFalseChallenges": []
                        }
                    }
                },
                {
                    status: 404,
                    description: 'Challenge not found',
                    example: {
                        "success": false,
                        "message": "Challenge not found"
                    }
                }
            ]
        },
        {
            id: 'update-daily-challenge',
            name: 'Update Daily Challenge',
            method: 'PUT',
            url: '/challenge/{id}',
            description: 'Update an existing daily challenge by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge to update',
                    example: '1'
                },
                {
                    name: 'title',
                    type: 'string',
                    required: false,
                    description: 'Updated title of the challenge',
                    example: 'Advanced Math Quiz'
                },
                {
                    name: 'description',
                    type: 'string',
                    required: false,
                    description: 'Updated description',
                    example: 'Test your advanced math skills'
                },
                {
                    name: 'category',
                    type: 'number',
                    required: false,
                    description: 'Updated category ID',
                    example: 2
                },
                {
                    name: 'difficulty_level',
                    type: 'string',
                    required: false,
                    description: 'Updated difficulty level',
                    enum: ['Beginner', 'Intermediate', 'Advanced'],
                    example: 'Intermediate'
                },
                {
                    name: 'max_attempt',
                    type: 'number',
                    required: false,
                    description: 'Updated max attempts',
                    example: 5
                },
                {
                    name: 'is_per_question_reward',
                    type: 'boolean',
                    required: false,
                    description: 'Updated reward type',
                    example: false
                },
                {
                    name: 'per_question_reward',
                    type: 'number',
                    required: false,
                    description: 'Updated points per question',
                    example: 15
                },
                {
                    name: 'points_reward',
                    type: 'number',
                    required: false,
                    description: 'Updated total points reward',
                    example: 150
                },
                {
                    name: 'qualify_percentage',
                    type: 'number',
                    required: false,
                    description: 'Updated qualify percentage',
                    example: 80
                },
                {
                    name: 'start_date',
                    type: 'string',
                    format: 'date-time',
                    required: false,
                    description: 'Updated start date',
                    example: '2025-05-25T00:00:00.000Z'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Challenge updated successfully',
                    example: {
                        "success": true,
                        "message": "Challenge updated successfully.",
                        "challenge": {
                            "id": 1,
                            "title": "Advanced Math Quiz",
                            "description": "Test your advanced math skills",
                            "category": 2,
                            "difficulty_level": "Intermediate",
                            "max_attempt": 5,
                            "is_per_question_reward": false,
                            "points_reward": 150,
                            "qualify_percentage": 80,
                            "start_date": "2025-05-25T00:00:00.000Z"
                        }
                    }
                },
                {
                    status: 404,
                    description: 'Challenge not found',
                    example: {
                        "success": false,
                        "message": "Challenge not found"
                    }
                }
            ]
        },
        {
            id: 'toggle-daily-challenge-status',
            name: 'Toggle Daily Challenge Status',
            method: 'PATCH',
            url: '/challenge/{id}',
            description: 'Toggle the active status of a daily challenge.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge to toggle',
                    example: '1'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Challenge status updated successfully',
                    example: {
                        "success": true,
                        "message": "Challenge is now inactive.",
                        "challenge": {
                            "id": 23,
                            "title": "Updated Daily Logic Puzzle",
                            "description": "New description for the logic challenge.",
                            "category": 1,
                            "difficulty_level": "Advanced",
                            "time_limit": 900,
                            "estimated_time": 600,
                            "qualify_percentage": 85,
                            "max_attempt": 5,
                            "is_per_question_reward": 1,
                            "points_reward": null,
                            "per_question_reward": 15,
                            "start_date": "2025-05-14T09:00:00.000Z",
                            "end_date": "2025-12-05T00:00:00.000Z",
                            "is_active": 0,
                            "created_at": "2025-05-12T08:57:53.000Z",
                            "updated_at": "2025-05-12T08:57:53.000Z"
                        }
                    }
                },
                {
                    status: 404,
                    description: 'Challenge not found',
                    example: {
                        "success": false,
                        "message": "Challenge not found"
                    }
                }
            ]
        },
        {
            id: 'delete-daily-challenge',
            name: 'Delete Daily Challenge',
            method: 'DELETE',
            url: '/challenge/{id}',
            description: 'Delete a daily challenge by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge to delete',
                    example: '1'
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
                    status: 404,
                    description: 'Challenge not found',
                    example: {
                        "success": false,
                        "message": "Challenge not found"
                    }
                }
            ]
        }
    ]
};

export default dailyChallengeData;