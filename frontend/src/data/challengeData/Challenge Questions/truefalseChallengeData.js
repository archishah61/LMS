const trueFalseChallengeData = {
    id: 'true-false-challenge',
    name: 'True/False Challenge',
    description: 'The True/False Challenge API provides endpoints to manage true/false challenges in the system. These endpoints allow you to create, read, update, delete, and manage the status of true/false challenges.',
    endpoints: [
        {
            id: 'get-all-true-false-challenges',
            name: 'Get All True/False Challenges',
            method: 'GET',
            url: '/challenge/true-false/',
            description: 'Get all true/false challenges in the system.',
            parameters: [],
            responses: [
                {
                    status: 200,
                    description: 'True/False challenges fetched successfully',
                    example: {
                        "success": true,
                        "message": "Challenges fetched successfully.",
                        "trueFalseChallenges": [
                            {
                                "id": 1,
                                "challenge_task_id": 1,
                                "challenge_id": null,
                                "question": "JavaScript is a statically typed language.",
                                "answer": false,
                                "is_active": true,
                                "created_at": "2025-05-12T09:47:49.000Z",
                                "updated_at": "2025-05-12T09:47:49.000Z"
                            },
                            {
                                "id": 2,
                                "challenge_task_id": 1,
                                "challenge_id": null,
                                "question": "The 'let' keyword allows block-scoped variables.",
                                "answer": true,
                                "is_active": true,
                                "created_at": "2025-05-12T09:47:49.000Z",
                                "updated_at": "2025-05-12T09:47:49.000Z"
                            }
                        ]
                    }
                }
            ]
        },
        {
            id: 'get-true-false-challenge-by-id',
            name: 'Get True/False Challenge By ID',
            method: 'GET',
            url: '/challenge/true-false/{id}',
            description: 'Get a specific true/false challenge by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the true/false challenge to retrieve',
                    example: '47'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'True/False challenge fetched successfully',
                    example: {
                        "success": true,
                        "message": "Challenge fetched successfully.",
                        "trueFalseChallenge": {
                            "id": 47,
                            "challenge_task_id": 25,
                            "challenge_id": null,
                            "question": "The Great Pyramid is in Cairo.",
                            "answer": true,
                            "is_active": true,
                            "created_at": "2025-05-12T09:47:49.000Z",
                            "updated_at": "2025-05-12T09:47:49.000Z"
                        }
                    }
                },
                {
                    status: 404,
                    description: 'True/False challenge not found',
                    example: {
                        "success": false,
                        "message": "True/False challenge not found"
                    }
                }
            ]
        },
        {
            id: 'create-true-false-challenge',
            name: 'Create True/False Challenge',
            method: 'POST',
            url: '/challenge/true-false/',
            description: 'Create a new true/false challenge.',
            parameters: [
                {
                    name: 'challenge_task_id',
                    type: 'number',
                    required: false,
                    description: 'Challenge Task ID for Challenge Task',
                    example: 1
                },
                {
                    name: 'challenge_id',
                    type: 'number',
                    required: false,
                    description: 'Challenge ID for Daily Challenge',
                    example: null
                },
                {
                    name: 'question',
                    type: 'string',
                    required: true,
                    description: 'The true/false question text',
                    example: 'The Earth revolves around the Sun.'
                },
                {
                    name: 'answer',
                    type: 'boolean',
                    required: true,
                    description: 'The correct answer (true or false)',
                    example: true
                }
            ],
            responses: [
                {
                    status: 201,
                    description: 'True/False challenge created successfully',
                    example: {
                        "success": true,
                        "message": "True/False Challenge created successfully."
                    }
                },
                {
                    status: 400,
                    description: 'Validation error',
                    example: {
                        "success": false,
                        "message": "Validation error: question is required"
                    }
                }
            ]
        },
        {
            id: 'update-true-false-challenge',
            name: 'Update True/False Challenge',
            method: 'PUT',
            url: '/challenge/true-false/{id}',
            description: 'Update an existing true/false challenge by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the true/false challenge to update',
                    example: '57'
                },
                {
                    name: 'question',
                    type: 'string',
                    required: false,
                    description: 'The updated question text',
                    example: 'Water boils at 100 degrees Celsius.'
                },
                {
                    name: 'answer',
                    type: 'boolean',
                    required: false,
                    description: 'The updated correct answer',
                    example: true
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'True/False challenge updated successfully',
                    example: {
                        "success": true,
                        "message": "Challenge updated successfully.",
                        "trueFalseChallenge": {
                            "id": 57,
                            "challenge_task_id": 1,
                            "challenge_id": null,
                            "question": "Water boils at 100 degrees Celsius.",
                            "answer": true,
                            "is_active": true,
                            "created_at": "2025-05-12T10:28:52.000Z",
                            "updated_at": "2025-05-12T10:30:20.327Z"
                        }
                    }
                },
                {
                    status: 404,
                    description: 'True/False challenge not found',
                    example: {
                        "success": false,
                        "message": "True/False challenge not found"
                    }
                }
            ]
        },
        {
            id: 'delete-true-false-challenge',
            name: 'Delete True/False Challenge',
            method: 'DELETE',
            url: '/challenge/true-false/{id}',
            description: 'Delete a true/false challenge by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the true/false challenge to delete',
                    example: '57'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'True/False challenge deleted successfully',
                    example: {
                        "success": true,
                        "message": "Challenge deleted successfully."
                    }
                },
                {
                    status: 404,
                    description: 'True/False challenge not found',
                    example: {
                        "success": false,
                        "message": "True/False challenge not found"
                    }
                }
            ]
        },
        {
            id: 'toggle-true-false-challenge',
            name: 'Toggle True/False Challenge Status',
            method: 'PATCH',
            url: '/challenge/true-false/{id}',
            description: 'Toggle the active status of a true/false challenge.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the true/false challenge to toggle',
                    example: '57'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'True/False challenge status toggled successfully',
                    example: {
                        "success": true,
                        "message": "Challenge is now inactive.",
                        "trueFalseChallenge": {
                            "id": 57,
                            "challenge_task_id": 1,
                            "challenge_id": null,
                            "question": "Water boils at 100 degrees Celsius.",
                            "answer": true,
                            "is_active": false,
                            "created_at": "2025-05-12T10:28:52.000Z",
                            "updated_at": "2025-05-12T10:31:12.438Z"
                        }
                    }
                },
                {
                    status: 404,
                    description: 'True/False challenge not found',
                    example: {
                        "success": false,
                        "message": "True/False challenge not found"
                    }
                }
            ]
        }
    ]
};

export default trueFalseChallengeData;