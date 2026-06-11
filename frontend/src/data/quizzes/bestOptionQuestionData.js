const bestOptionQuestionData = {
    "id": "best-option-question",
    "name": "Best Option Question",
    "description": "The Best Option Question API provides endpoints to manage best option questions in the system. These endpoints allow you to create, read, update, and delete best option questions.",
    "endpoints": [
        {
            "id": "get-all-best-option-questions",
            "name": "Get All Best Option Questions",
            "method": "GET",
            "url": "/best-option-questions/",
            "description": "Get a list of all best option questions in the system.",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved all best option questions",
                    "example": [
                        {
                            "id": 1,
                            "quiz_id": 1,
                            "passage": "JavaScript is a ____ programming language that allows you to implement ____ features on web pages. It is an essential ____ for front-end web development along with HTML and CSS.",
                            "blanked_words": [
                                "versatile",
                                "interactive",
                                "technology"
                            ],
                            "distractor_options": {
                                "versatile": [
                                    "versatile",
                                    "step",
                                    "proportion",
                                    "iteration",
                                    "expansion"
                                ],
                                "technology": [
                                    "technology",
                                    "hypothesis",
                                    "simulation",
                                    "notation",
                                    "outlook"
                                ],
                                "interactive": [
                                    "interactive",
                                    "formulation",
                                    "format",
                                    "equation",
                                    "designs"
                                ]
                            },
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T05:26:20.000Z",
                            "updated_at": "2025-05-09T05:26:20.000Z"
                        },
                        {
                            "id": 2,
                            "quiz_id": 2,
                            "passage": "In JavaScript, a ____ is a reusable block of code that performs a specific task. Variables declared inside a function have ____ scope, while those declared outside have ____ scope. Arrow functions are a ____ syntax introduced in ES6.",
                            "blanked_words": [
                                "function",
                                "local",
                                "global",
                                "concise"
                            ],
                            "distractor_options": {
                                "local": [
                                    "local",
                                    "iteration",
                                    "execution",
                                    "example",
                                    "pattern"
                                ],
                                "global": [
                                    "global",
                                    "formation",
                                    "diagram",
                                    "drawing",
                                    "framework"
                                ],
                                "concise": [
                                    "concise",
                                    "depiction",
                                    "formation",
                                    "systematic",
                                    "reproduction"
                                ],
                                "function": [
                                    "function",
                                    "expansion",
                                    "reproduction",
                                    "reformulation",
                                    "systematic"
                                ]
                            },
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T05:26:20.000Z",
                            "updated_at": "2025-05-09T05:26:20.000Z"
                        }
                    ]
                }
            ]
        },
        {
            "id": "get-best-option-questions-by-quiz-id",
            "name": "Get Best Option Questions By Quiz ID",
            "method": "GET",
            "url": "/best-option-questions/quiz/:quiz_id",
            "description": "Get best option questions by Quiz ID.",
            "parameters": [
                {
                    "name": "quiz_id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the quiz to retrieve best option questions",
                    "example": "3"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the best option questions by quiz ID",
                    "example": [
                        {
                            "id": 3,
                            "quiz_id": 3,
                            "passage": "The human ____ system provides structure and support for the body. It protects vital organs like the brain, which is encased in the ____. The longest bone in the human body is the ____, found in the thigh.",
                            "blanked_words": [
                                "skeletal",
                                "skull",
                                "femur"
                            ],
                            "distractor_options": {
                                "femur": [
                                    "femur",
                                    "format",
                                    "version",
                                    "idea",
                                    "drafting"
                                ],
                                "skull": [
                                    "skull",
                                    "case",
                                    "configuration",
                                    "sketch",
                                    "methodology"
                                ],
                                "skeletal": [
                                    "skeletal",
                                    "example",
                                    "sequence",
                                    "systematic",
                                    "configuration"
                                ]
                            },
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T05:26:20.000Z",
                            "updated_at": "2025-05-09T05:26:20.000Z"
                        }
                    ]
                },
                {
                    "status": 404,
                    "description": "Best option questions not found",
                    "example": {
                        "success": false,
                        "message": "Best option questions not found"
                    }
                }
            ]
        },
        {
            "id": "create-best-option-question",
            "name": "Create Best Option Question",
            "method": "POST",
            "url": "/best-option-questions/create",
            "description": "Create a new best option question in the system.",
            "parameters": [
                {
                    "name": "passage",
                    "type": "string",
                    "required": true,
                    "description": "The passage with placeholders for the best option question",
                    "example": "The {1} of the new system was praised for its clarity and {2} design."
                },
                {
                    "name": "selected_words",
                    "type": "array",
                    "required": true,
                    "description": "List of selected words with details",
                    "example": [
                        {
                            "word": "implementation",
                            "quiz_id": 1,
                            "created_by": 1,
                            "updated_by": 1
                        },
                        {
                            "word": "efficient",
                            "quiz_id": 1,
                            "created_by": 1,
                            "updated_by": 1
                        }
                    ]
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Best option question created successfully",
                    "example": {
                        "message": "Best option question created successfully"
                    }
                },
                {
                    "status": 400,
                    "description": "Validation error",
                    "example": {
                        "success": false,
                        "message": "Passage and selected words are required"
                    }
                }
            ]
        },
        {
            "id": "update-best-option-question",
            "name": "Update Best Option Question",
            "method": "PUT",
            "url": "/best-option-questions/update/:id",
            "description": "Update an existing best option question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the best option question to update",
                    "example": "1"
                },
                {
                    "name": "passage",
                    "type": "string",
                    "required": false,
                    "description": "Updated passage with placeholders for the best option question",
                    "example": "The {1} of the new platform was applauded for its {2} design and clarity."
                },
                {
                    "name": "blanked_words",
                    "type": "array",
                    "required": false,
                    "description": "Updated list of blanked words",
                    "example": [
                        "implementation",
                        "efficient"
                    ]
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user updating the question",
                    "example": 1
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Question updated successfully",
                    "example": {
                        "message": "Question updated successfully",
                        "updated": {
                            "id": 1,
                            "quiz_id": 1,
                            "passage": "The {1} of the new platform was applauded for its {2} design and clarity.",
                            "blanked_words": [
                                "implementation",
                                "efficient"
                            ],
                            "distractor_options": {
                                "efficient": [
                                    "efficient",
                                    "proposition",
                                    "layout",
                                    "vision",
                                    "aspects"
                                ],
                                "implementation": [
                                    "implementation",
                                    "execution",
                                    "fulfilment",
                                    "fulfillment",
                                    "perpetration"
                                ]
                            },
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T05:26:20.000Z",
                            "updated_at": "2025-05-09T06:41:22.000Z"
                        }
                    }
                },
                {
                    "status": 404,
                    "description": "Best option question not found",
                    "example": {
                        "success": false,
                        "message": "Best option question not found"
                    }
                }
            ]
        },
        {
            "id": "delete-best-option-question",
            "name": "Delete Best Option Question",
            "method": "DELETE",
            "url": "/best-option-questions/delete/:id",
            "description": "Delete a best option question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the best option question to delete",
                    "example": "1"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Question deleted successfully",
                    "example": {
                        "message": "Question deleted successfully",
                        "deleted": [
                            {
                                "id": 1,
                                "quiz_id": 1,
                                "passage": "The {1} of the new platform was applauded for its {2} design and clarity.",
                                "blanked_words": [
                                    "implementation",
                                    "efficient"
                                ],
                                "distractor_options": {
                                    "efficient": [
                                        "efficient",
                                        "proposition",
                                        "layout",
                                        "vision",
                                        "aspects"
                                    ],
                                    "implementation": [
                                        "implementation",
                                        "execution",
                                        "fulfilment",
                                        "fulfillment",
                                        "perpetration"
                                    ]
                                },
                                "created_by": 1,
                                "updated_by": 1,
                                "created_at": "2025-05-09T05:26:20.000Z",
                                "updated_at": "2025-05-09T06:41:22.000Z"
                            }
                        ]
                    }
                },
                {
                    "status": 404,
                    "description": "Best option question not found",
                    "example": {
                        "success": false,
                        "message": "Best option question not found"
                    }
                }
            ]
        }
    ]
};

export default bestOptionQuestionData;
