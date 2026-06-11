const challengeTaskData = {
    id: 'challenge-task',
    name: 'Challenge Task',
    description: 'The Challenge Task API provides endpoints to manage challenge tasks within the system. These endpoints allow you to create, read, update, delete, and toggle the active status of challenge tasks.',
    endpoints: [
        {
            id: 'get-all-challenge-tasks',
            name: 'Get All Challenge Tasks',
            method: 'GET',
            url: '/challenge/task/',
            description: 'Get a list of all challenge tasks in the system.',
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved all challenge tasks',
                    example: {
                        "success": true,
                        "data": [
                            {
                                "id": 1,
                                "challenge_phase_id": 1,
                                "title": "Variables and Data Types",
                                "description": "Understand JavaScript variables",
                                
                                "difficulty_level": "Easy",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 10,
                                "time_limit": 15,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 2,
                                "challenge_phase_id": 1,
                                "title": "Operators and Expressions",
                                "description": "Work with JavaScript operators",
                                
                                "difficulty_level": "Moderate",
                                "order": 2,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 20,
                                "time_limit": 15,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 3,
                                "challenge_phase_id": 2,
                                "title": "Conditional Statements",
                                "description": "Learn if/else and switch",
                                
                                "difficulty_level": "Moderate",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 20,
                                "time_limit": 15,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 4,
                                "challenge_phase_id": 2,
                                "title": "Loops",
                                "description": "Work with for, while, and do-while",
                                
                                "difficulty_level": "Hard",
                                "order": 2,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 20,
                                "time_limit": 15,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 5,
                                "challenge_phase_id": 3,
                                "title": "HTML Document Structure",
                                "description": "Understand basic HTML skeleton",
                                
                                "difficulty_level": "Moderate",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 20,
                                "time_limit": 15,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 6,
                                "challenge_phase_id": 3,
                                "title": "Common HTML Elements",
                                "description": "Learn about frequently used tags",
                                
                                "difficulty_level": "Moderate",
                                "order": 2,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 20,
                                "time_limit": 15,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 7,
                                "challenge_phase_id": 4,
                                "title": "CSS Selectors",
                                "description": "Understand how to target elements",
                                
                                "difficulty_level": "Moderate",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 20,
                                "time_limit": 15,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 8,
                                "challenge_phase_id": 4,
                                "title": "CSS Box Model",
                                "description": "Understand padding, margin and border",
                                
                                "difficulty_level": "Moderate",
                                "order": 2,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 20,
                                "time_limit": 15,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 9,
                                "challenge_phase_id": 5,
                                "title": "Basic Equation Solving",
                                "description": "Solve for x in simple equations",
                                
                                "difficulty_level": "Easy",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 15,
                                "time_limit": 20,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 10,
                                "challenge_phase_id": 5,
                                "title": "Word Problems",
                                "description": "Translate word problems into equations",
                                
                                "difficulty_level": "Moderate",
                                "order": 2,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 25,
                                "time_limit": 30,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 11,
                                "challenge_phase_id": 6,
                                "title": "Factoring Practice",
                                "description": "Factor quadratic expressions",
                                
                                "difficulty_level": "Moderate",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 30,
                                "time_limit": 25,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 12,
                                "challenge_phase_id": 6,
                                "title": "Quadratic Formula",
                                "description": "Apply the quadratic formula",
                                
                                "difficulty_level": "Hard",
                                "order": 2,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 40,
                                "time_limit": 30,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 13,
                                "challenge_phase_id": 7,
                                "title": "Subatomic Particles",
                                "description": "Identify protons, neutrons, and electrons",
                                
                                "difficulty_level": "Easy",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 20,
                                "time_limit": 15,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 14,
                                "challenge_phase_id": 7,
                                "title": "Electron Configuration",
                                "description": "Write electron configurations for elements",
                                
                                "difficulty_level": "Moderate",
                                "order": 2,
                                "is_mandatory": 0,
                                "max_attempts": 3,
                                "reward_points": 30,
                                "time_limit": 20,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 15,
                                "challenge_phase_id": 8,
                                "title": "Ionic Bonds",
                                "description": "Predict ionic compound formation",
                                
                                "difficulty_level": "Moderate",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 35,
                                "time_limit": 25,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 16,
                                "challenge_phase_id": 8,
                                "title": "Covalent Bonds",
                                "description": "Understand electron sharing",
                                
                                "difficulty_level": "Hard",
                                "order": 2,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 40,
                                "time_limit": 30,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 17,
                                "challenge_phase_id": 9,
                                "title": "Sumerian Achievements",
                                "description": "Identify key Sumerian contributions",
                                
                                "difficulty_level": "Easy",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 20,
                                "time_limit": 20,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 18,
                                "challenge_phase_id": 9,
                                "title": "Hammurabi's Code",
                                "description": "Understand early legal systems",
                                
                                "difficulty_level": "Moderate",
                                "order": 2,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 30,
                                "time_limit": 25,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 19,
                                "challenge_phase_id": 10,
                                "title": "Pyramid Construction",
                                "description": "Understand building techniques",
                                
                                "difficulty_level": "Moderate",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 35,
                                "time_limit": 25,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 20,
                                "challenge_phase_id": 10,
                                "title": "Hieroglyphics",
                                "description": "Study Egyptian writing",
                                
                                "difficulty_level": "Hard",
                                "order": 2,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 40,
                                "time_limit": 30,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 21,
                                "challenge_phase_id": 11,
                                "title": "Single-Digit Addition",
                                "description": "Answer the following:",
                                
                                "difficulty_level": "Easy",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 20,
                                "time_limit": 10,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 22,
                                "challenge_phase_id": 12,
                                "title": "Single-Digit Subtraction",
                                "description": "Answer the following:",
                                
                                "difficulty_level": "Easy",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 20,
                                "time_limit": 10,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 23,
                                "challenge_phase_id": 13,
                                "title": "Mammal Traits",
                                "description": "Select the correct answer:",
                                
                                "difficulty_level": "Easy",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 25,
                                "time_limit": 15,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 24,
                                "challenge_phase_id": 14,
                                "title": "Bird Traits",
                                "description": "Fill in the blank:",
                                
                                "difficulty_level": "Easy",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 25,
                                "time_limit": 15,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 25,
                                "challenge_phase_id": 15,
                                "title": "Great Pyramid",
                                "description": "Answer the question:",
                                
                                "difficulty_level": "Easy",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 30,
                                "time_limit": 20,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 26,
                                "challenge_phase_id": 16,
                                "title": "Colossus of Rhodes",
                                "description": "Fill in the blank:",
                                
                                "difficulty_level": "Easy",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 30,
                                "time_limit": 20,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 27,
                                "challenge_phase_id": 17,
                                "title": "Variable Types",
                                "description": "What is the output?",
                                
                                "difficulty_level": "Easy",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 30,
                                "time_limit": 20,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 28,
                                "challenge_phase_id": 18,
                                "title": "For Loop",
                                "description": "Fill in the blank:",
                                
                                "difficulty_level": "Easy",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 30,
                                "time_limit": 20,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 29,
                                "challenge_phase_id": 19,
                                "title": "Match Synonyms",
                                "description": "Select the correct pair:",
                                
                                "difficulty_level": "Easy",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 25,
                                "time_limit": 15,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 30,
                                "challenge_phase_id": 20,
                                "title": "Match Antonyms",
                                "description": "Fill in the blank:",
                                
                                "difficulty_level": "Easy",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 25,
                                "time_limit": 15,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 31,
                                "challenge_phase_id": 21,
                                "title": "Famous Quotes",
                                "description": "Who said this?",
                                
                                "difficulty_level": "Easy",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 20,
                                "time_limit": 10,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 32,
                                "challenge_phase_id": 22,
                                "title": "Song Artists",
                                "description": "Fill in the blank:",
                                
                                "difficulty_level": "Easy",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 20,
                                "time_limit": 10,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            }
                        ]
                    }
                }
            ]
        },
        {
            id: 'get-challenge-task-by-id',
            name: 'Get Challenge Task By ID',
            method: 'GET',
            url: '/challenge/task/:id',
            description: 'Get a specific challenge task by its ID, including any associated challenge questions.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge task to retrieve',
                    example: '1'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved the challenge task',
                    example: {
                        "success": true,
                        "data": {
                            "id": 1,
                            "challenge_phase_id": 1,
                            "title": "Variables and Data Types",
                            "description": "Understand JavaScript variables",
                            
                            "difficulty_level": "Easy",
                            "order": 1,
                            "is_mandatory": 1,
                            "max_attempts": 3,
                            "reward_points": 10,
                            "time_limit": 15,
                            "is_active": 1,
                            "created_at": "2025-05-13T09:36:28.000Z",
                            "updated_at": "2025-05-13T09:36:28.000Z",
                            "FillInBlankChallenges": [],
                            "MCQChallenges": [],
                            "TrueFalseChallenges": [
                                {
                                    "id": 1,
                                    "challenge_task_id": 1,
                                    "challenge_id": null,
                                    "question": "JavaScript is a statically typed language.",
                                    "answer": 0,
                                    "is_active": 1,
                                    "created_at": "2025-05-13T09:36:28.000Z",
                                    "updated_at": "2025-05-13T09:36:28.000Z",
                                    "challenge_type": "TrueFalse"
                                },
                                {
                                    "id": 2,
                                    "challenge_task_id": 1,
                                    "challenge_id": null,
                                    "question": "The 'let' keyword allows block-scoped variables.",
                                    "answer": 1,
                                    "is_active": 1,
                                    "created_at": "2025-05-13T09:36:28.000Z",
                                    "updated_at": "2025-05-13T09:36:28.000Z",
                                    "challenge_type": "TrueFalse"
                                },
                                {
                                    "id": 3,
                                    "challenge_task_id": 1,
                                    "challenge_id": null,
                                    "question": "JavaScript has a 'number' type for all numeric values.",
                                    "answer": 1,
                                    "is_active": 1,
                                    "created_at": "2025-05-13T09:36:28.000Z",
                                    "updated_at": "2025-05-13T09:36:28.000Z",
                                    "challenge_type": "TrueFalse"
                                },
                                {
                                    "id": 4,
                                    "challenge_task_id": 1,
                                    "challenge_id": null,
                                    "question": "Undefined means a variable is declared but not assigned.",
                                    "answer": 1,
                                    "is_active": 1,
                                    "created_at": "2025-05-13T09:36:28.000Z",
                                    "updated_at": "2025-05-13T09:36:28.000Z",
                                    "challenge_type": "TrueFalse"
                                },
                                {
                                    "id": 5,
                                    "challenge_task_id": 1,
                                    "challenge_id": null,
                                    "question": "null and undefined are identical in JavaScript.",
                                    "answer": 0,
                                    "is_active": 1,
                                    "created_at": "2025-05-13T09:36:28.000Z",
                                    "updated_at": "2025-05-13T09:36:28.000Z",
                                    "challenge_type": "TrueFalse"
                                }
                            ]
                        }
                    }
                },
                {
                    status: 404,
                    description: 'Challenge task not found',
                    example: {
                        "success": false,
                        "message": "Challenge task not found"
                    }
                }
            ]
        },
        {
            id: 'get-challenge-tasks-by-phase-id',
            name: 'Get Challenge Tasks By Phase ID',
            method: 'GET',
            url: '/challenge/task/phase/:id',
            description: 'Get all challenge tasks belonging to a specific challenge phase.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge phase to retrieve tasks for',
                    example: '1'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved challenge tasks for the specified phase',
                    example: {
                        "success": true,
                        "data": [
                            {
                                "id": 1,
                                "challenge_phase_id": 1,
                                "title": "Variables and Data Types",
                                "description": "Understand JavaScript variables",
                                
                                "difficulty_level": "Easy",
                                "order": 1,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 10,
                                "time_limit": 15,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            },
                            {
                                "id": 2,
                                "challenge_phase_id": 1,
                                "title": "Operators and Expressions",
                                "description": "Work with JavaScript operators",
                                
                                "difficulty_level": "Moderate",
                                "order": 2,
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "reward_points": 20,
                                "time_limit": 15,
                                "is_active": 1,
                                "created_at": "2025-05-13T09:36:28.000Z",
                                "updated_at": "2025-05-13T09:36:28.000Z"
                            }
                        ]
                    }
                },
                {
                    status: 404,
                    description: 'No challenge tasks found for the specified phase',
                    example: {
                        "success": false,
                        "message": "No tasks found for this phase"
                    }
                }
            ]
        },
        {
            id: 'create-challenge-task',
            name: 'Create Challenge Task',
            method: 'POST',
            url: '/challenge/task/',
            description: 'Create a new challenge task in the system.',
            parameters: [
                {
                    name: 'challenge_phase_id',
                    type: 'number',
                    required: true,
                    description: 'ID of the challenge phase this task belongs to',
                    example: 1
                },
                {
                    name: 'title',
                    type: 'string',
                    required: true,
                    description: 'Title of the challenge task',
                    example: 'demo'
                },
                {
                    name: 'description',
                    type: 'string',
                    required: true,
                    description: 'Description of the challenge task',
                    example: 'demo challenge'
                },
                {
                    name: 'difficulty_level',
                    type: 'string',
                    required: true,
                    description: 'Difficulty level of the challenge task, e.g., Easy, Moderate, Hard',
                    example: 'Easy'
                },
                {
                    name: 'order',
                    type: 'number',
                    required: true,
                    description: 'Order/sequence number of the task within its phase',
                    example: 3
                },
                {
                    name: 'is_mandatory',
                    type: 'number',
                    required: true,
                    description: 'Whether the task is mandatory (1) or optional (0)',
                    example: 1
                },
                {
                    name: 'max_attempts',
                    type: 'number',
                    required: true,
                    description: 'Maximum number of attempts allowed for the task',
                    example: 2
                },
                {
                    name: 'reward_points',
                    type: 'number',
                    required: true,
                    description: 'Points awarded for completing the task',
                    example: 5
                },
                {
                    name: 'time_limit',
                    type: 'number',
                    required: true,
                    description: 'Time limit for the task in minutes',
                    example: 120
                }
            ],
            responses: [
                {
                    status: 201,
                    description: 'Challenge task created successfully',
                    example: {
                        "success": true,
                        "message": "Challenge Task created successfully."
                    }
                },
                {
                    status: 400,
                    description: 'Validation error',
                    example: {
                        "success": false,
                        "message": "Required fields are missing"
                    }
                }
            ]
        },
        {
            id: 'update-challenge-task',
            name: 'Update Challenge Task',
            method: 'PUT',
            url: '/challenge/task/:id',
            description: 'Update an existing challenge task by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge task to update',
                    example: '1'
                },
                {
                    name: 'challenge_phase_id',
                    type: 'number',
                    required: false,
                    description: 'Updated ID of the challenge phase this task belongs to',
                    example: 2
                },
                {
                    name: 'title',
                    type: 'string',
                    required: false,
                    description: 'Updated title of the challenge task',
                    example: 'demoupdate'
                },
                {
                    name: 'description',
                    type: 'string',
                    required: false,
                    description: 'Updated description of the challenge task',
                    example: 'demo update'
                },
                {
                    name: 'difficulty_level',
                    type: 'string',
                    required: false,
                    description: 'Updated difficulty level of the challenge task',
                    example: 'Easy'
                },
                {
                    name: 'order',
                    type: 'number',
                    required: false,
                    description: 'Updated order/sequence number within its phase',
                    example: 3
                },
                {
                    name: 'is_mandatory',
                    type: 'number',
                    required: false,
                    description: 'Updated mandatory status (1 for mandatory, 0 for optional)',
                    example: 1
                },
                {
                    name: 'max_attempts',
                    type: 'number',
                    required: false,
                    description: 'Updated maximum number of attempts allowed',
                    example: 2
                },
                {
                    name: 'reward_points',
                    type: 'number',
                    required: false,
                    description: 'Updated points awarded for completion',
                    example: 5
                },
                {
                    name: 'time_limit',
                    type: 'number',
                    required: false,
                    description: 'Updated time limit for the task in minutes',
                    example: 180
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Challenge task updated successfully',
                    example: {
                        "success": true,
                        "message": "Challenge Task updated successfully."
                    }
                },
                {
                    status: 404,
                    description: 'Challenge task not found',
                    example: {
                        "success": false,
                        "message": "Challenge task not found"
                    }
                }
            ]
        },
        {
            id: 'delete-challenge-task',
            name: 'Delete Challenge Task',
            method: 'DELETE',
            url: '/challenge/task/:id',
            description: 'Delete a challenge task by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge task to delete',
                    example: '1'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Challenge task deleted successfully',
                    example: {
                        "success": true,
                        "message": "Challenge Task deleted successfully."
                    }
                },
                {
                    status: 404,
                    description: 'Challenge task not found',
                    example: {
                        "success": false,
                        "message": "Challenge task not found"
                    }
                }
            ]
        },
        {
            id: 'toggle-challenge-task-status',
            name: 'Toggle Challenge Task Status',
            method: 'PATCH',
            url: '/challenge/task/:id',
            description: 'Toggle the active status of a challenge task (active/inactive).',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge task to toggle status',
                    example: '1'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Challenge task status toggled successfully',
                    example: {
                        "success": true
                    }
                },
                {
                    status: 404,
                    description: 'Challenge task not found',
                    example: {
                        "success": false,
                        "message": "Challenge task not found"
                    }
                }
            ]
        }
    ]
};

export default challengeTaskData;