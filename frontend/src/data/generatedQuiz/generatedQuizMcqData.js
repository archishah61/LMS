const generatedQuizMcqData = {
    "id": "generated-quiz-mcq",
    "name": "Generated Quiz MCQ",
    "description": "The Generated Quiz MCQ API provides endpoints to manage multiple-choice questions in the system. These endpoints allow you to create, read, update, and delete multiple-choice questions.",
    "endpoints": [
        {
            "id": "get-all-mcq",
            "name": "Get All MCQ",
            "method": "GET",
            "url": "/generated-quiz/mcq/",
            "description": "Get a list of all multiple-choice questions in the system.",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved all multiple-choice questions",
                    "example": [
                        {
                            "id": 1,
                            "quizTextId": 1,
                            "text": "What is the capital of France?",
                            "correctAnswer": "Paris",
                            "options": [
                                "Paris",
                                "Berlin",
                                "Madrid",
                                "Rome"
                            ],
                            "created_at": "2025-05-13T18:30:07.000Z",
                            "updated_at": "2025-05-13T18:30:07.000Z"
                        },
                        {
                            "id": 2,
                            "quizTextId": 1,
                            "text": "Which planet is known as the Red Planet?",
                            "correctAnswer": "Mars",
                            "options": [
                                "Earth",
                                "Venus",
                                "Mars",
                                "Jupiter"
                            ],
                            "created_at": "2025-05-13T18:31:34.000Z",
                            "updated_at": "2025-05-13T18:32:23.000Z"
                        }
                    ]
                }
            ]
        },
        {
            "id": "get-mcq-by-id",
            "name": "Get MCQ By ID",
            "method": "GET",
            "url": "/generated-quiz/mcq/:id",
            "description": "Get a specific multiple-choice question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the multiple-choice question to retrieve",
                    "example": "2"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the multiple-choice question",
                    "example": [
                        {
                            "id": 2,
                            "quizTextId": 1,
                            "text": "Which planet is known as the Red Planet?",
                            "correctAnswer": "Mars",
                            "options": [
                                "Earth",
                                "Venus",
                                "Mars",
                                "Jupiter"
                            ],
                            "created_at": "2025-05-13T18:31:34.000Z",
                            "updated_at": "2025-05-13T18:32:23.000Z"
                        }
                    ]
                },
                {
                    "status": 404,
                    "description": "Multiple-choice question not found",
                    "example": {
                        "success": false,
                        "message": "Multiple-choice question not found"
                    }
                }
            ]
        },
        {
            "id": "create-mcq",
            "name": "Create MCQ",
            "method": "POST",
            "url": "/generated-quiz/mcq/create",
            "description": "Create a new multiple-choice question in the system.",
            "parameters": [
                {
                    "name": "quizTextId",
                    "type": "number",
                    "required": true,
                    "description": "ID of the quiz text",
                    "example": 1
                },
                {
                    "name": "text",
                    "type": "string",
                    "required": true,
                    "description": "Text of the multiple-choice question",
                    "example": "What is the capital of France?"
                },
                {
                    "name": "correctAnswer",
                    "type": "string",
                    "required": true,
                    "description": "Correct answer for the multiple-choice question",
                    "example": "Paris"
                },
                {
                    "name": "options",
                    "type": "array",
                    "required": true,
                    "description": "List of options for the multiple-choice question",
                    "example": ["Paris", "Berlin", "Madrid", "Rome"]
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Multiple-choice question created successfully",
                    "example": {
                        "success": true,
                        "message": "Multiple choice question created successfully!",
                        "question": {
                            "id": 1,
                            "quizTextId": 1,
                            "text": "What is the capital of France?",
                            "correctAnswer": "Paris",
                            "options": [
                                "Paris",
                                "Berlin",
                                "Madrid",
                                "Rome"
                            ],
                            "created_at": "2025-05-13T18:30:07.000Z",
                            "updated_at": "2025-05-13T18:30:07.000Z"
                        }
                    }
                },
                {
                    "status": 400,
                    "description": "Validation error",
                    "example": {
                        "success": false,
                        "message": "Text is required"
                    }
                }
            ]
        },
        {
            "id": "update-mcq",
            "name": "Update MCQ",
            "method": "PUT",
            "url": "/generated-quiz/mcq/update/:id",
            "description": "Update an existing multiple-choice question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the multiple-choice question to update",
                    "example": "2"
                },
                {
                    "name": "text",
                    "type": "string",
                    "required": false,
                    "description": "Updated text of the multiple-choice question",
                    "example": "Which planet is known as the Red Planet?"
                },
                {
                    "name": "correctAnswer",
                    "type": "string",
                    "required": false,
                    "description": "Updated correct answer for the multiple-choice question",
                    "example": "Mars"
                },
                {
                    "name": "options",
                    "type": "array",
                    "required": false,
                    "description": "Updated list of options for the multiple-choice question",
                    "example": ["Earth", "Venus", "Mars", "Jupiter"]
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Multiple-choice question updated successfully",
                    "example": {
                        "success": true,
                        "message": "Multiple choice question updated successfully!",
                        "question": {
                            "id": 2,
                            "quizTextId": 1,
                            "text": "Which planet is known as the Red Planet?",
                            "correctAnswer": "Mars",
                            "options": [
                                "Earth",
                                "Venus",
                                "Mars",
                                "Jupiter"
                            ],
                            "created_at": "2025-05-13T18:31:34.000Z",
                            "updated_at": "2025-05-13T18:32:23.000Z"
                        }
                    }
                },
                {
                    "status": 404,
                    "description": "Multiple-choice question not found",
                    "example": {
                        "success": false,
                        "message": "Multiple-choice question not found"
                    }
                }
            ]
        },
        {
            "id": "delete-mcq",
            "name": "Delete MCQ",
            "method": "DELETE",
            "url": "/generated-quiz/mcq/delete/:id",
            "description": "Delete a multiple-choice question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the multiple-choice question to delete",
                    "example": "1"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Multiple-choice question deleted successfully",
                    "example": {
                        "success": true,
                        "message": "Multiple choice questions deleted successfully!"
                    }
                },
                {
                    "status": 404,
                    "description": "Multiple-choice question not found",
                    "example": {
                        "success": false,
                        "message": "Multiple-choice question not found"
                    }
                }
            ]
        }
    ]
};

export default generatedQuizMcqData;
