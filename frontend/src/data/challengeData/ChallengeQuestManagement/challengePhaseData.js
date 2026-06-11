const challengePhaseData = {
    id: 'challenge-phase',
    name: 'Challenge Phase',
    description: 'The Challenge Phase API provides endpoints to manage phases within challenges in the system. These endpoints allow you to create, read, update, delete, and manage the status of challenge phases.',
    endpoints: [
        {
            id: 'get-all-challenge-phases',
            name: 'Get All Challenge Phases',
            method: 'GET',
            url: '/challenge/phase/',
            description: 'Get a list of all challenge phases in the system.',
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved all challenge phases',
                    example: {
                        "success": true,
                        "data": [
                            {
                                "id": 1,
                                "challenge_id": 1,
                                "phase_number": 1,
                                
                                "title": "Basic Concepts",
                                "description": "Learn JavaScript fundamentals",
                                "tasks_count": 2,                                
                                "bonus_reward": null,
                                "phase_type": "Moderate",
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 2,
                                "challenge_id": 1,
                                "phase_number": 2,
                                
                                "title": "Control Flow",
                                "description": "Master JavaScript control structures",
                                "tasks_count": 2,                                
                                "bonus_reward": null,
                                "phase_type": "Moderate",
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 3,
                                "challenge_id": 2,
                                "phase_number": 1,
                                
                                "title": "HTML Fundamentals",
                                "description": "Learn HTML structure and elements",
                                "tasks_count": 2,
                                "bonus_reward": null,
                                
                                "phase_type": "Moderate",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 4,
                                "challenge_id": 2,
                                "phase_number": 2,
                                
                                "title": "CSS Basics",
                                "description": "Learn to style web pages with CSS",
                                "tasks_count": 2,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Moderate",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 5,
                                "challenge_id": 3,
                                "phase_number": 1,
                                
                                "title": "Linear Equations",
                                "description": "Solve single-variable equations",
                                "tasks_count": 2,                                
                                "bonus_reward": null,
                                "phase_type": "Moderate",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 6,
                                "challenge_id": 3,
                                "phase_number": 2,
                                
                                "title": "Quadratic Equations",
                                "description": "Master factoring and the quadratic formula",
                                "tasks_count": 2,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Moderate",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 7,
                                "challenge_id": 4,
                                "phase_number": 1,
                                
                                "title": "Atomic Structure",
                                "description": "Understand subatomic particles and electron configuration",
                                "tasks_count": 2,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Moderate",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 8,
                                "challenge_id": 4,
                                "phase_number": 2,
                                
                                "title": "Chemical Bonding",
                                "description": "Explore ionic and covalent bonds",
                                "tasks_count": 2,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Moderate",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 9,
                                "challenge_id": 5,
                                "phase_number": 1,
                                
                                "title": "Mesopotamia",
                                "description": "Study the cradle of civilization",
                                "tasks_count": 2,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Moderate",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 10,
                                "challenge_id": 5,
                                "phase_number": 2,
                                
                                "title": "Ancient Egypt",
                                "description": "Explore pharaonic civilization",
                                "tasks_count": 2,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Moderate",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 11,
                                "challenge_id": 6,
                                "phase_number": 1,
                                
                                "title": "Addition Basics",
                                "description": "Solve simple addition problems",
                                "tasks_count": 1,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Moderate",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 12,
                                "challenge_id": 6,
                                "phase_number": 2,
                                
                                "title": "Subtraction Basics",
                                "description": "Solve simple subtraction problems",
                                "tasks_count": 1,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Moderate",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 13,
                                "challenge_id": 7,
                                "phase_number": 1,
                                
                                "title": "Mammals",
                                "description": "Identify common mammals",
                                "tasks_count": 1,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Moderate",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 14,
                                "challenge_id": 7,
                                "phase_number": 2,
                                
                                "title": "Birds",
                                "description": "Identify common birds",
                                "tasks_count": 1,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Moderate",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 15,
                                "challenge_id": 8,
                                "phase_number": 1,
                                
                                "title": "Egyptian Wonders",
                                "description": "Learn about the Pyramids",
                                "tasks_count": 1,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Moderate",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 16,
                                "challenge_id": 8,
                                "phase_number": 2,
                                
                                "title": "Greek Wonders",
                                "description": "Learn about the Colossus",
                                "tasks_count": 1,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Moderate",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 17,
                                "challenge_id": 9,
                                "phase_number": 1,
                                
                                "title": "Variables",
                                "description": "Declare and use variables",
                                "tasks_count": 1,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Moderate",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 18,
                                "challenge_id": 9,
                                "phase_number": 2,
                                
                                "title": "Loops",
                                "description": "Write a simple loop",
                                "tasks_count": 1,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Moderate",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 19,
                                "challenge_id": 10,
                                "phase_number": 1,
                                
                                "title": "Synonyms",
                                "description": "Find words with similar meanings",
                                "tasks_count": 1,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Moderate",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 20,
                                "challenge_id": 10,
                                "phase_number": 2,
                                
                                "title": "Antonyms",
                                "description": "Find words with opposite meanings",
                                "tasks_count": 1,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Moderate",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 21,
                                "challenge_id": 11,
                                "phase_number": 1,
                                
                                "title": "Movies",
                                "description": "Guess famous films",
                                "tasks_count": 1,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Moderate",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 22,
                                "challenge_id": 11,
                                "phase_number": 2,
                                
                                "title": "Music",
                                "description": "Identify hit songs",
                                "tasks_count": 1,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Moderate",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 23,
                                "challenge_id": 1,
                                "phase_number": 3,
                                
                                "title": "demo",
                                "description": "demo",
                                "tasks_count": 2,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Easy",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:56:42.000Z",
                                "updated_at": "2025-05-13T09:56:42.000Z"
                            }
                        ]
                    }
                }
            ]
        },
        {
            id: 'get-challenge-phase-by-id',
            name: 'Get Challenge Phase By ID',
            method: 'GET',
            url: '/challenge/phase/{id}',
            description: 'Get a specific challenge phase by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge phase to retrieve',
                    example: '1'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved the challenge phase',
                    example: {
                        "success": true,
                        "data": {
                            "id": 1,
                            "challenge_id": 1,
                            "phase_number": 1,
                            
                            "title": "Basic Concepts",
                            "description": "Learn JavaScript fundamentals",
                            "tasks_count": 2,                            
                            "bonus_reward": null,
                            
                            "phase_type": "Moderate",
                            
                            "is_active": 1,
                            "created_at": "2025-05-13T09:36:28.000Z",
                            "updated_at": "2025-05-13T09:36:28.000Z"
                        }
                    }
                },
                {
                    status: 404,
                    description: 'Challenge phase not found',
                    example: {
                        "success": false,
                        "message": "Challenge phase not found"
                    }
                }
            ]
        },
        {
            id: 'get-challenge-phases-by-quest-id',
            name: 'Get Challenge Phases By Quest ID',
            method: 'GET',
            url: '/challenge/phase/quest/{id}',
            description: 'Get all phases for a specific challenge quest by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge quest to retrieve phases for',
                    example: '1'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved challenge phases for the quest',
                    example: {
                        "success": true,
                        "data": [
                            {
                                "id": 1,
                                "challenge_id": 1,
                                "phase_number": 1,
                                
                                "title": "Basic Concepts",
                                "description": "Learn JavaScript fundamentals",
                                "tasks_count": 2,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Moderate",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 2,
                                "challenge_id": 1,
                                "phase_number": 2,
                                
                                "title": "Control Flow",
                                "description": "Master JavaScript control structures",
                                "tasks_count": 2,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Moderate",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            }
                        ]
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
            id: 'create-challenge-phase',
            name: 'Create Challenge Phase',
            method: 'POST',
            url: '/challenge/phase/',
            description: 'Create a new challenge phase in the system.',
            parameters: [
                {
                    name: 'challenge_id',
                    type: 'number',
                    required: true,
                    description: 'ID of the challenge quest this phase belongs to',
                    example: 1
                },
                {
                    name: 'phase_number',
                    type: 'number',
                    required: true,
                    description: 'The number of this phase within the challenge',
                    example: 3
                },
                {
                    name: 'title',
                    type: 'string',
                    required: true,
                    description: 'Title of the challenge phase',
                    example: 'demo'
                },
                {
                    name: 'description',
                    type: 'string',
                    required: true,
                    description: 'Description of the challenge phase',
                    example: 'demo'
                },
                {
                    name: 'tasks_count',
                    type: 'number',
                    required: false,
                    description: 'Number of tasks in this phase',
                    example: 2
                },
                {
                    name: 'bonus_reward',
                    type: 'string',
                    required: false,
                    description: 'Bonus reward for completing this phase',
                    example: '10 points'
                },
                {
                    name: 'phase_type',
                    type: 'string',
                    required: true,
                    description: 'Type of phase (Easy/Moderate/Hard)',
                    example: 'Easy'
                },
            ],
            responses: [
                {
                    status: 201,
                    description: 'Challenge phase created successfully',
                    example: {
                        "success": true,
                        "message": "Phase created",
                        "data": [
                            {
                                "id": 23,
                                "challenge_id": 1,
                                "phase_number": 3,
                                
                                "title": "demo",
                                "description": "demo",
                                "tasks_count": 2,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Easy",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:56:42.000Z",
                                "updated_at": "2025-05-13T09:56:42.000Z"
                            }
                        ]
                    }
                },
                {
                    status: 400,
                    description: 'Validation error',
                    example: {
                        "success": false,
                        "message": "Missing required fields"
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
            id: 'update-challenge-phase',
            name: 'Update Challenge Phase',
            method: 'PUT',
            url: '/challenge/phase/{id}',
            description: 'Update an existing challenge phase by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge phase to update',
                    example: '23'
                },
                {
                    name: 'challenge_id',
                    type: 'number',
                    required: false,
                    description: 'Updated ID of the challenge quest this phase belongs to',
                    example: 2
                },
                {
                    name: 'phase_number',
                    type: 'number',
                    required: false,
                    description: 'Updated phase number',
                    example: 3
                },
                {
                    name: 'title',
                    type: 'string',
                    required: false,
                    description: 'Updated title',
                    example: 'abc'
                },
                {
                    name: 'description',
                    type: 'string',
                    required: false,
                    description: 'Updated description',
                    example: 'abc'
                },
                {
                    name: 'tasks_count',
                    type: 'number',
                    required: false,
                    description: 'Updated tasks count',
                    example: 2
                },
                {
                    name: 'phase_type',
                    type: 'string',
                    required: false,
                    description: 'Updated phase type',
                    example: 'Easy'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Challenge phase updated successfully',
                    example: {
                        "success": true,
                        "message": "Updated",
                        "data": [
                            {
                                "id": 23,
                                "challenge_id": 2,
                                "phase_number": 3,
                                
                                "title": "abc",
                                "description": "abc",
                                "tasks_count": 2,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Easy",
                                
                                "is_active": 1,
                                "created_at": "2025-05-13T09:56:42.000Z",
                                "updated_at": "2025-05-13T10:01:08.000Z"
                            }
                        ]
                    }
                },
                {
                    status: 404,
                    description: 'Challenge phase not found',
                    example: {
                        "success": false,
                        "message": "Challenge phase not found"
                    }
                }
            ]
        },
        {
            id: 'delete-challenge-phase',
            name: 'Delete Challenge Phase',
            method: 'DELETE',
            url: '/challenge/phase/{id}',
            description: 'Delete a challenge phase by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge phase to delete',
                    example: '23'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Challenge phase deleted successfully',
                    example: {
                        "success": true,
                        "message": "Deleted"
                    }
                },
                {
                    status: 404,
                    description: 'Challenge phase not found',
                    example: {
                        "success": false,
                        "message": "Challenge phase not found"
                    }
                }
            ]
        },
        {
            id: 'toggle-challenge-phase-status',
            name: 'Toggle Challenge Phase Status',
            method: 'PATCH',
            url: '/challenge/phase/{id}',
            description: 'Toggle the active status of a challenge phase.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge phase to toggle status',
                    example: '23'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Challenge phase status toggled successfully',
                    example: {
                        "success": true,
                        "message": "Status toggled",
                        "data": [
                            {
                                "id": 23,
                                "challenge_id": 2,
                                "phase_number": 3,
                                
                                "title": "abc",
                                "description": "abc",
                                "tasks_count": 2,                                
                                "bonus_reward": null,
                                
                                "phase_type": "Easy",
                                
                                "is_active": 0,
                                "created_at": "2025-05-13T09:56:42.000Z",
                                "updated_at": "2025-05-13T10:02:09.000Z"
                            }
                        ]
                    }
                },
                {
                    status: 404,
                    description: 'Challenge phase not found',
                    example: {
                        "success": false,
                        "message": "Challenge phase not found"
                    }
                }
            ]
        }
    ]
};

export default challengePhaseData;