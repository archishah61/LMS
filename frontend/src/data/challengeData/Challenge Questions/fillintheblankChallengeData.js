const fillInTheBlanksChallengeData = {
    id: 'fill-in-the-blanks-challenge',
    name: 'Fill in the Blanks Challenge',
    description: 'The Fill in the Blanks Challenge API provides endpoints to manage fill-in-the-blanks challenges in the system. These endpoints allow you to create, read, update, delete, and manage the status of fill-in-the-blanks challenges.',
    endpoints: [
        {
            id: 'get-all-fill-in-the-blanks-challenges',
            name: 'Get All Fill in the Blanks Challenges',
            method: 'GET',
            url: '/challenge/fill-in-the-blanks/all',
            description: 'Get all fill-in-the-blanks challenges in the system.',
            parameters: [],
            responses: [
                {
                    status: 200,
                    description: 'Fill in the blanks challenges fetched successfully',
                    example: {
                        "success": true,
                        "message": "Challenges fetched successfully via stored procedure.",
                        "fillInTheBlanksChallenges": {
                            "success": true,
                            "data": [
                                {
                                    "id": 1,
                                    "challenge_task_id": 5,
                                    "challenge_id": null,
                                    "text": "The sum of 5 and 7 is __.",
                                    "answers": ["12"],
                                    "is_active": 1,
                                    "created_at": "2025-05-12T09:47:49.000Z",
                                    "updated_at": "2025-05-12T09:47:49.000Z"
                                },
                                {
                                    "id": 2,
                                    "challenge_task_id": 5,
                                    "challenge_id": null,
                                    "text": "A triangle has __ sides.",
                                    "answers": ["3", "three"],
                                    "is_active": 1,
                                    "created_at": "2025-05-12T09:47:49.000Z",
                                    "updated_at": "2025-05-12T09:47:49.000Z"
                                }
                            ]
                        }
                    }
                }
            ]
        },
        {
            id: 'get-fill-in-the-blanks-challenge-by-id',
            name: 'Get Fill in the Blanks Challenge By ID',
            method: 'GET',
            url: '/challenge/fill-in-the-blanks/{id}',
            description: 'Get a specific fill-in-the-blanks challenge by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the fill-in-the-blanks challenge to retrieve',
                    example: '17'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Fill in the blanks challenge fetched successfully',
                    example: {
                        "success": true,
                        "message": "Challenge fetched successfully via stored procedure.",
                        "fillInTheBlanksChallenge": {
                            "success": true,
                            "data": [
                                {
                                    "id": 17,
                                    "challenge_task_id": 30,
                                    "challenge_id": null,
                                    "text": "The antonym of 'hot' is __.",
                                    "answers": ["cold"],
                                    "is_active": 1,
                                    "created_at": "2025-05-12T09:47:50.000Z",
                                    "updated_at": "2025-05-12T09:47:50.000Z"
                                }
                            ]
                        }
                    }
                },
                {
                    status: 404,
                    description: 'Fill in the blanks challenge not found',
                    example: {
                        "success": false,
                        "message": "Fill in the blanks challenge not found"
                    }
                }
            ]
        },
        {
            id: 'create-fill-in-the-blanks-challenge',
            name: 'Create Fill in the Blanks Challenge',
            method: 'POST',
            url: '/challenge/fill-in-the-blanks/',
            description: 'Create a new fill-in-the-blanks challenge.',
            parameters: [
                {
                    name: 'challenge_id',
                    type: 'number',
                    required: false,
                    description: 'Challenge ID for Daily Challenge',
                    example: 2
                },
                {
                    name: 'challenge_task_id',
                    type: 'number',
                    required: false,
                    description: 'Challenge Task ID for Challenge Task',
                    example: 1
                },
                {
                    name: 'text',
                    type: 'string',
                    required: true,
                    description: 'The fill-in-the-blanks question text with blanks marked by __ or other indicators',
                    example: "The capital of France is ____ and the currency is ____."
                },
                {
                    name: 'answers',
                    type: 'array',
                    required: true,
                    description: 'Array of possible correct answers for each blank (in order)',
                    items: {
                        type: 'string'
                    },
                    example: ["Paris", "Euro"]
                }
            ],
            responses: [
                {
                    status: 201,
                    description: 'Fill in the blanks challenge created successfully',
                    example: {
                        "success": true,
                        "message": "Challenge created via stored procedure."
                    }
                },
                {
                    status: 400,
                    description: 'Validation error',
                    example: {
                        "success": false,
                        "message": "Validation error: text is required"
                    }
                }
            ]
        },
        {
            id: 'update-fill-in-the-blanks-challenge',
            name: 'Update Fill in the Blanks Challenge',
            method: 'PUT',
            url: '/challenge/fill-in-the-blanks/{id}',
            description: 'Update an existing fill-in-the-blanks challenge by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the fill-in-the-blanks challenge to update',
                    example: '17'
                },
                {
                    name: 'text',
                    type: 'string',
                    required: false,
                    description: 'The updated question text with blanks',
                    example: "The capital of Germany is ____."
                },
                {
                    name: 'answers',
                    type: 'array',
                    required: false,
                    description: 'Updated array of possible correct answers for each blank',
                    items: {
                        type: 'string'
                    },
                    example: ["Berlin"]
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Fill in the blanks challenge updated successfully',
                    example: {
                        "success": true,
                        "message": "Challenge updated successfully via stored procedure."
                    }
                },
                {
                    status: 404,
                    description: 'Fill in the blanks challenge not found',
                    example: {
                        "success": false,
                        "message": "Fill in the blanks challenge not found"
                    }
                }
            ]
        },
        {
            id: 'delete-fill-in-the-blanks-challenge',
            name: 'Delete Fill in the Blanks Challenge',
            method: 'DELETE',
            url: '/challenge/fill-in-the-blanks/{id}',
            description: 'Delete a fill-in-the-blanks challenge by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the fill-in-the-blanks challenge to delete',
                    example: '17'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Fill in the blanks challenge deleted successfully',
                    example: {
                        "success": true,
                        "message": "Challenge deleted successfully via stored procedure."
                    }
                },
                {
                    status: 404,
                    description: 'Fill in the blanks challenge not found',
                    example: {
                        "success": false,
                        "message": "Fill in the blanks challenge not found"
                    }
                }
            ]
        },
        {
            id: 'toggle-fill-in-the-blanks-challenge',
            name: 'Toggle Fill in the Blanks Challenge Status',
            method: 'PATCH',
            url: '/challenge/fill-in-the-blanks/{id}/toggle',
            description: 'Toggle the active status of a fill-in-the-blanks challenge.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the fill-in-the-blanks challenge to toggle',
                    example: '17'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Fill in the blanks challenge status toggled successfully',
                    example: {
                        "success": true,
                        "message": "Challenge status toggled successfully via stored procedure."
                    }
                },
                {
                    status: 404,
                    description: 'Fill in the blanks challenge not found',
                    example: {
                        "success": false,
                        "message": "Fill in the blanks challenge not found"
                    }
                }
            ]
        }
    ]
};

export default fillInTheBlanksChallengeData;