const generatedQuizTrueFalseData = {
    "id": "generated-quiz-true-false",
    "name": "Generated Quiz True False",
    "description": "The Generated Quiz True False API provides endpoints to manage true/false questions in the system. These endpoints allow you to create, read, update, and delete true/false questions.",
    "endpoints": [
        {
            "id": "get-all-true-false",
            "name": "Get All True False",
            "method": "GET",
            "url": "/generated-quiz/true-false/",
            "description": "Get a list of all true/false questions in the system.",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved all true/false questions",
                    "example": [
                        {
                            "id": 3,
                            "quizTextId": 1,
                            "text": "The Earth is flat.",
                            "correctAnswer": 0,
                            "created_at": "2025-05-13T18:09:59.000Z",
                            "updated_at": "2025-05-13T18:09:59.000Z"
                        },
                        {
                            "id": 4,
                            "quizTextId": 1,
                            "text": "The Earth is flat 123.",
                            "correctAnswer": 1,
                            "created_at": "2025-05-13T18:10:41.000Z",
                            "updated_at": "2025-05-13T18:10:41.000Z"
                        }
                    ]
                }
            ]
        },
        {
            "id": "get-true-false-by-id",
            "name": "Get True False By ID",
            "method": "GET",
            "url": "/generated-quiz/true-false/:id",
            "description": "Get a specific true/false question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the true/false question to retrieve",
                    "example": "3"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the true/false question",
                    "example": [
                        {
                            "id": 3,
                            "quizTextId": 1,
                            "text": "The Earth is flat.",
                            "correctAnswer": 0,
                            "created_at": "2025-05-13T18:09:59.000Z",
                            "updated_at": "2025-05-13T18:09:59.000Z"
                        }
                    ]
                },
                {
                    "status": 404,
                    "description": "True/false question not found",
                    "example": {
                        "success": false,
                        "message": "True/false question not found"
                    }
                }
            ]
        },
        {
            "id": "create-true-false",
            "name": "Create True False",
            "method": "POST",
            "url": "/generated-quiz/true-false/create",
            "description": "Create a new true/false question in the system.",
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
                    "description": "Text of the true/false question",
                    "example": "The Earth is flat."
                },
                {
                    "name": "correctAnswer",
                    "type": "boolean",
                    "required": true,
                    "description": "Correct answer for the true/false question",
                    "example": false
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "True/false question created successfully",
                    "example": {
                        "success": true,
                        "message": "True/False question created successfully",
                        "question": {
                            "id": 3,
                            "quizTextId": 1,
                            "text": "The Earth is flat.",
                            "correctAnswer": 0,
                            "created_at": "2025-05-13T18:09:59.000Z",
                            "updated_at": "2025-05-13T18:09:59.000Z"
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
            "id": "update-true-false",
            "name": "Update True False",
            "method": "PUT",
            "url": "/generated-quiz/true-false/update/:id",
            "description": "Update an existing true/false question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the true/false question to update",
                    "example": "5"
                },
                {
                    "name": "text",
                    "type": "string",
                    "required": false,
                    "description": "Updated text of the true/false question",
                    "example": "Water boils at 100°C."
                },
                {
                    "name": "correctAnswer",
                    "type": "boolean",
                    "required": false,
                    "description": "Updated correct answer for the true/false question",
                    "example": true
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "True/false question updated successfully",
                    "example": {
                        "success": true,
                        "message": "True/False question updated successfully",
                        "question": {
                            "id": 5,
                            "quizTextId": 1,
                            "text": "Water boils at 100°C.",
                            "correctAnswer": 1,
                            "created_at": "2025-05-13T18:11:02.000Z",
                            "updated_at": "2025-05-13T18:14:59.000Z"
                        }
                    }
                },
                {
                    "status": 404,
                    "description": "True/false question not found",
                    "example": {
                        "success": false,
                        "message": "True/false question not found"
                    }
                }
            ]
        },
        {
            "id": "delete-true-false",
            "name": "Delete True False",
            "method": "DELETE",
            "url": "/generated-quiz/true-false/delete/:id",
            "description": "Delete a true/false question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the true/false question to delete",
                    "example": "5"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "True/false question deleted successfully",
                    "example": {
                        "success": true,
                        "message": "True/False question(s) deleted successfully"
                    }
                },
                {
                    "status": 404,
                    "description": "True/false question not found",
                    "example": {
                        "success": false,
                        "message": "True/false question not found"
                    }
                }
            ]
        }
    ]
};

export default generatedQuizTrueFalseData;
