const generatedQuizFillInTheBlanksData = {
    "id": "generated-quiz-fill-in-the-blanks",
    "name": "Generated Quiz Fill In The Blanks",
    "description": "The Generated Quiz Fill In The Blanks API provides endpoints to manage fill-in-the-blank questions in the system. These endpoints allow you to create, read, update, and delete fill-in-the-blank questions.",
    "endpoints": [
        {
            "id": "get-all-fill-in-the-blanks",
            "name": "Get All Fill In The Blanks",
            "method": "GET",
            "url": "/generated-quiz/fill-in-the-blanks/",
            "description": "Get a list of all fill-in-the-blank questions in the system.",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved all fill-in-the-blank questions",
                    "example": [
                        {
                            "id": 1,
                            "quizTextId": 1,
                            "text": "Fill in the blank: 84% of Google's _______ global traffic comes from the United States, 5",
                            "correctAnswer": "monthly",
                            "created_at": "2025-05-12T16:17:21.000Z",
                            "updated_at": "2025-05-12T16:17:21.000Z"
                        },
                        {
                            "id": 2,
                            "quizTextId": 1,
                            "text": "Fill in the blank: 78% from the _______ Kingdom and 5",
                            "correctAnswer": "United",
                            "created_at": "2025-05-12T16:17:21.000Z",
                            "updated_at": "2025-05-12T16:17:21.000Z"
                        }
                    ]
                }
            ]
        },
        {
            "id": "get-fill-in-the-blank-by-id",
            "name": "Get Fill In The Blank By ID",
            "method": "GET",
            "url": "/generated-quiz/fill-in-the-blanks/:id",
            "description": "Get a specific fill-in-the-blank question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the fill-in-the-blank question to retrieve",
                    "example": "1"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the fill-in-the-blank question",
                    "example": [
                        {
                            "id": 1,
                            "quizTextId": 1,
                            "text": "Fill in the blank: 84% of Google's _______ global traffic comes from the United States, 5",
                            "correctAnswer": "monthly",
                            "created_at": "2025-05-12T16:17:21.000Z",
                            "updated_at": "2025-05-12T16:17:21.000Z"
                        }
                    ]
                },
                {
                    "status": 404,
                    "description": "Fill-in-the-blank question not found",
                    "example": {
                        "success": false,
                        "message": "Fill-in-the-blank question not found"
                    }
                }
            ]
        },
        {
            "id": "create-fill-in-the-blank",
            "name": "Create Fill In The Blank",
            "method": "POST",
            "url": "/generated-quiz/fill-in-the-blanks/create",
            "description": "Create a new fill-in-the-blank question in the system.",
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
                    "description": "Text of the fill-in-the-blank question",
                    "example": "quiz____"
                },
                {
                    "name": "correctAnswer",
                    "type": "string",
                    "required": true,
                    "description": "Correct answer for the fill-in-the-blank question",
                    "example": "fill in the blank"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Fill-in-the-blank question created successfully",
                    "example": {
                        "success": true,
                        "message": "Question created successfully",
                        "question": {
                            "id": 4,
                            "quizTextId": 1,
                            "text": "quiz____",
                            "correctAnswer": "fill in the blank",
                            "created_at": "2025-05-12T16:57:41.000Z",
                            "updated_at": "2025-05-12T16:57:41.000Z"
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
            "id": "update-fill-in-the-blank",
            "name": "Update Fill In The Blank",
            "method": "PUT",
            "url": "/generated-quiz/fill-in-the-blanks/update/:id",
            "description": "Update an existing fill-in-the-blank question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the fill-in-the-blank question to update",
                    "example": "4"
                },
                {
                    "name": "quizTextId",
                    "type": "number",
                    "required": false,
                    "description": "Updated ID of the quiz text",
                    "example": 1
                },
                {
                    "name": "text",
                    "type": "string",
                    "required": false,
                    "description": "Updated text of the fill-in-the-blank question",
                    "example": "quiz type____"
                },
                {
                    "name": "correctAnswer",
                    "type": "string",
                    "required": false,
                    "description": "Updated correct answer for the fill-in-the-blank question",
                    "example": "fill in the blank generate"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Fill-in-the-blank question updated successfully",
                    "example": {
                        "success": true,
                        "message": "Question updated successfully",
                        "question": {
                            "id": 4,
                            "quizTextId": 1,
                            "text": "quiz type____",
                            "correctAnswer": "fill in the blank generate",
                            "created_at": "2025-05-12T16:57:41.000Z",
                            "updated_at": "2025-05-12T16:59:09.000Z"
                        }
                    }
                },
                {
                    "status": 404,
                    "description": "Fill-in-the-blank question not found",
                    "example": {
                        "success": false,
                        "message": "Fill-in-the-blank question not found"
                    }
                }
            ]
        },
        {
            "id": "delete-fill-in-the-blank",
            "name": "Delete Fill In The Blank",
            "method": "DELETE",
            "url": "/generated-quiz/fill-in-the-blanks/delete/:id",
            "description": "Delete a fill-in-the-blank question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the fill-in-the-blank question to delete",
                    "example": "4"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Fill-in-the-blank question deleted successfully",
                    "example": {
                        "success": true,
                        "message": "Questions deleted successfully"
                    }
                },
                {
                    "status": 404,
                    "description": "Fill-in-the-blank question not found",
                    "example": {
                        "success": false,
                        "message": "Fill-in-the-blank question not found"
                    }
                }
            ]
        }
    ]
};

export default generatedQuizFillInTheBlanksData;
