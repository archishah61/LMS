const quizData = {
    "id": "quiz",
    "name": "Quiz",
    "description": "The Quiz API provides endpoints to manage quizzes in the system. These endpoints allow you to create, read, update, and manage the status of quizzes.",
    "endpoints": [
        {
            "id": "get-all-quizzes",
            "name": "Get All Quizzes",
            "method": "GET",
            "url": "/quizzes/",
            "description": "Get a list of all quizzes in the system.",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved all quizzes",
                    "example": [
                        {
                            "id": 1,
                            "module_id": 1,
                            "title": "JS Basics Quiz",
                            "duration_minutes": 10,
                            "passing_score": 50,
                            "max_attempts": 3,
                            "attempts_gap": 12,
                            "status": "active",
                            "quizType": "normal",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T07:42:01.000Z",
                            "updated_at": "2025-05-09T07:42:01.000Z"
                        },
                        {
                            "id": 2,
                            "module_id": 2,
                            "title": "Functions & Scope Quiz",
                            "duration_minutes": 15,
                            "passing_score": 60,
                            "max_attempts": 2,
                            "attempts_gap": 24,
                            "status": "active",
                            "quizType": "normal",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T07:42:01.000Z",
                            "updated_at": "2025-05-09T07:42:01.000Z"
                        }
                    ]
                }
            ]
        },
        {
            "id": "get-quiz-by-id",
            "name": "Get Quiz By ID",
            "method": "GET",
            "url": "/quizzes/:id",
            "description": "Get a specific quiz by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the quiz to retrieve",
                    "example": "2"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the quiz",
                    "example": {
                        "id": 2,
                        "module_id": 2,
                        "title": "Functions & Scope Quiz",
                        "duration_minutes": 15,
                        "passing_score": 60,
                        "max_attempts": 2,
                        "attempts_gap": 24,
                        "status": "active",
                        "quizType": "normal",
                        "created_by": 1,
                        "created_by_type": "admin",
                        "updated_by": 1,
                        "updated_by_type": "admin",
                        "created_at": "2025-05-09T07:42:01.000Z",
                        "updated_at": "2025-05-09T07:42:01.000Z",
                        "QuizQuestions": [
                            {
                                "id": 4,
                                "marks": 5,
                                "quiz_id": 2,
                                "created_at": "2025-05-09 07:42:01.000000",
                                "updated_at": "2025-05-09 07:42:01.000000",
                                "created_by": 1,
                                "updated_by": 1,
                                "QuizOptions": [
                                    {
                                        "id": 5,
                                        "created_at": "2025-05-09 07:42:01.000000",
                                        "updated_at": "2025-05-09 07:42:01.000000",
                                        "created_by": 1,
                                        "is_correct": false,
                                        "option_img": null,
                                        "updated_by": 1,
                                        "option_text": "function add(a, b) { return a + b; }",
                                        "question_id": 4,
                                        "created_by_type": "admin",
                                        "updated_by_type": "admin"
                                    }
                                ],
                                "sequence_no": 1,
                                "question_img": null,
                                "question_text": "Which of the following is an arrow function?",
                                "question_type": "mcq",
                                "created_by_type": "admin",
                                "updated_by_type": "admin"
                            }
                        ],
                        "totalMarks": 13
                    }
                },
                {
                    "status": 404,
                    "description": "Quiz not found",
                    "example": {
                        "success": false,
                        "message": "Quiz not found"
                    }
                }
            ]
        },
        {
            "id": "get-quiz-by-module-id",
            "name": "Get Quiz by Module ID",
            "method": "GET",
            "url": "/quizzes/quiz/:id",
            "description": "Get a specific quiz by its module ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The module ID of the quiz to retrieve",
                    "example": "1"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the quiz",
                    "example": [
                        {
                            "id": 1,
                            "title": "JS Basics Quiz",
                            "status": "active",
                            "quizType": "normal",
                            "created_at": "2025-05-09T07:42:01.000000Z",
                            "module_id": 1,
                            "updated_at": "2025-05-09T07:42:01.000000Z",
                            "created_by": 1,
                            "updated_by": 1,
                            "attempts_gap": 12,
                            "max_attempts": 3,
                            "QuizQuestions": [
                                {
                                    "id": 1,
                                    "marks": 5,
                                    "quiz_id": 1,
                                    "created_at": "2025-05-09T07:42:01.000000Z",
                                    "updated_at": "2025-05-09T07:42:01.000000Z",
                                    "created_by": 1,
                                    "updated_by": 1,
                                    "QuizOptions": [
                                        {
                                            "id": 1,
                                            "created_at": "2025-05-09 07:42:01.000000",
                                            "updated_at": "2025-05-09 07:42:01.000000",
                                            "created_by": 1,
                                            "is_correct": true,
                                            "option_img": null,
                                            "updated_by": 1,
                                            "option_text": "let x = 5;",
                                            "question_id": 1,
                                            "created_by_type": "admin",
                                            "updated_by_type": "admin"
                                        }
                                    ],
                                    "sequence_no": 1,
                                    "question_img": null,
                                    "question_text": "What is the correct way to declare a variable in JavaScript?",
                                    "question_type": "mcq",
                                    "created_by_type": "admin",
                                    "updated_by_type": "admin",
                                    "CompleteSentences": null
                                }
                            ],
                            "passing_score": 50,
                            "created_by_type": "admin",
                            "updated_by_type": "admin",
                            "duration_minutes": 10,
                            "DragDropQuestions": [],
                            "RealWordQuestions": [
                                {
                                    "id": 1,
                                    "words": [
                                        "variable",
                                        "object",
                                        "arript",
                                        "array",
                                        "funclet"
                                    ],
                                    "quiz_id": 1,
                                    "created_at": "2025-05-09T07:42:01.000000Z",
                                    "updated_at": "2025-05-09T07:42:01.000000Z",
                                    "created_by": 1,
                                    "updated_by": 1,
                                    "correct_answers": [
                                        "yes",
                                        "yes",
                                        "no",
                                        "yes",
                                        "no"
                                    ]
                                }
                            ],
                            "BestOptionQuestions": [
                                {
                                    "id": 1,
                                    "passage": "JavaScript is a ____ programming language that allows you to implement ____ features on web pages. It is an essential ____ for front-end web development along with HTML and CSS.",
                                    "quiz_id": 1,
                                    "created_at": "2025-05-09T07:42:01.000000Z",
                                    "created_by": 1,
                                    "updated_at": "2025-05-09T07:42:01.000000Z",
                                    "updated_by": 1,
                                    "blanked_words": [
                                        "versatile",
                                        "interactive",
                                        "technology"
                                    ],
                                    "distractor_options": {
                                        "versatile": [
                                            "versatile",
                                            "template",
                                            "presentation",
                                            "outline",
                                            "depiction"
                                        ]
                                    }
                                }
                            ],
                            "AudioToScriptQuestions": [
                                {
                                    "id": 1,
                                    "url": "/audiotoScript/jsAudioyt.mp3",
                                    "script": "Welcome to the JavaScript basics course. In this audio, we'll cover variables and data types.",
                                    "quiz_id": 1,
                                    "created_at": "2025-05-09T07:42:01.000000Z",
                                    "updated_at": "2025-05-09T07:42:01.000000Z",
                                    "created_by": 1,
                                    "updated_by": 1
                                }
                            ],
                            "QuizPreDefinedQuestions": [],
                            "SummarizePassageQuestions": [
                                {
                                    "id": 1,
                                    "quiz_id": 1,
                                    "summary": "These underwater ecosystems are formed by colonies of coral polyps held together by calcium carbonate.Coral reefs provide shelter and food to countless marine species and support the livelihoods of millions of people around the world.Climate change has led to widespread coral bleaching, putting entire reef systems at risk.Coral reefs are often referred to as the rainforests of the sea because of their incredible biodiversity.",
                                    "created_at": "2025-05-09T07:42:01.000000Z",
                                    "created_by": 1,
                                    "time_limit": 6,
                                    "updated_at": "2025-05-09T07:42:01.000000Z",
                                    "updated_by": 1
                                }
                            ],
                            "CompleteSentences": [],
                            "totalMarks": 15,
                            "TextedBasedQuizTexts": []
                        }
                    ]
                },
                {
                    "status": 404,
                    "description": "Quiz not found",
                    "example": {
                        "success": false,
                        "message": "Quiz not found"
                    }
                }
            ]
        },
        {
            "id": "create-quiz",
            "name": "Create Quiz",
            "method": "POST",
            "url": "/quizzes/create",
            "description": "Create a new quiz in the system.",
            "parameters": [
                {
                    "name": "module_id",
                    "type": "string",
                    "required": true,
                    "description": "ID of the module for the quiz",
                    "example": "60097fb94b"
                },
                {
                    "name": "title",
                    "type": "string",
                    "required": true,
                    "description": "Title of the quiz",
                    "example": "Python Basics Quiz"
                },
                {
                    "name": "duration_minutes",
                    "type": "number",
                    "required": true,
                    "description": "Duration of the quiz in minutes",
                    "example": 45
                },
                {
                    "name": "passing_score",
                    "type": "number",
                    "required": true,
                    "description": "Passing score for the quiz",
                    "example": 80
                },
                {
                    "name": "max_attempts",
                    "type": "number",
                    "required": true,
                    "description": "Maximum number of attempts allowed",
                    "example": 5
                },
                {
                    "name": "attempts_gap",
                    "type": "number",
                    "required": true,
                    "description": "Gap between attempts in hours",
                    "example": 12
                },
                {
                    "name": "status",
                    "type": "string",
                    "required": true,
                    "description": "Status of the quiz",
                    "example": "active"
                },
                {
                    "name": "quizType",
                    "type": "string",
                    "required": true,
                    "description": "Type of the quiz",
                    "example": "normal"
                },
                {
                    "name": "created_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user creating the quiz",
                    "example": 1
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user updating the quiz",
                    "example": 1
                },
                {
                    "name": "created_by_type",
                    "type": "string",
                    "required": true,
                    "description": "Type of the user creating the quiz",
                    "example": "admin"
                },
                {
                    "name": "updated_by_type",
                    "type": "string",
                    "required": true,
                    "description": "Type of the user updating the quiz",
                    "example": "admin"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Quiz created successfully",
                    "example": {
                        "message": "Quiz created successfully",
                        "quiz": {
                            "id": 5,
                            "module_id": 1,
                            "title": "Python Basics Quiz",
                            "duration_minutes": 45,
                            "passing_score": 80,
                            "max_attempts": 5,
                            "attempts_gap": 12,
                            "status": "active",
                            "quizType": "normal",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T07:47:39.000Z",
                            "updated_at": "2025-05-09T07:47:39.000Z"
                        }
                    }
                },
                {
                    "status": 400,
                    "description": "Validation error",
                    "example": {
                        "success": false,
                        "message": "Title is required"
                    }
                }
            ]
        },
        {
            "id": "update-quiz",
            "name": "Update Quiz",
            "method": "PUT",
            "url": "/quizzes/update/:id",
            "description": "Update an existing quiz by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the quiz to update",
                    "example": "5"
                },
                {
                    "name": "module_id",
                    "type": "number",
                    "required": false,
                    "description": "Updated module ID for the quiz",
                    "example": 2
                },
                {
                    "name": "title",
                    "type": "string",
                    "required": false,
                    "description": "Updated title of the quiz",
                    "example": "Python Intermediate Quiz"
                },
                {
                    "name": "duration_minutes",
                    "type": "number",
                    "required": false,
                    "description": "Updated duration of the quiz in minutes",
                    "example": 50
                },
                {
                    "name": "passing_score",
                    "type": "number",
                    "required": false,
                    "description": "Updated passing score for the quiz",
                    "example": 85
                },
                {
                    "name": "max_attempts",
                    "type": "number",
                    "required": false,
                    "description": "Updated maximum number of attempts allowed",
                    "example": 4
                },
                {
                    "name": "attempts_gap",
                    "type": "number",
                    "required": false,
                    "description": "Updated gap between attempts in hours",
                    "example": 24
                },
                {
                    "name": "created_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user updating the quiz",
                    "example": 1
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user updating the quiz",
                    "example": 1
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Quiz updated successfully",
                    "example": {
                        "success": true,
                        "message": "Quiz updated successfully"
                    }
                },
                {
                    "status": 404,
                    "description": "Quiz not found",
                    "example": {
                        "success": false,
                        "message": "Quiz not found"
                    }
                }
            ]
        },
        {
            "id": "toggle-quiz-status",
            "name": "Toggle Quiz Status",
            "method": "PATCH",
            "url": "/quizzes/:quizId/status",
            "description": "Toggle the status (active/inactive) of a quiz.",
            "parameters": [
                {
                    "name": "quizId",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the quiz to update status",
                    "example": "5"
                },
                {
                    "name": "status",
                    "type": "string",
                    "required": true,
                    "description": "New status for the quiz (active/inactive)",
                    "example": "inactive"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Quiz status updated successfully",
                    "example": {
                        "message": "Quiz deactivated successfully"
                    }
                },
                {
                    "status": 400,
                    "description": "Invalid status value",
                    "example": {
                        "success": false,
                        "message": "Status must be either 'active' or 'inactive'"
                    }
                },
                {
                    "status": 404,
                    "description": "Quiz not found",
                    "example": {
                        "success": false,
                        "message": "Quiz not found"
                    }
                }
            ]
        }
    ]
}

export default quizData;
