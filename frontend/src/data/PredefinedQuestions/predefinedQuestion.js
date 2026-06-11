const preDefinedQuestionData = {
    "id": "predefined-questions",
    "name": "Predefined Questions",
    "description": "The Predefined Questions API provides endpoints to manage predefined questions in the system. These endpoints allow you to create, read, update, delete, and manage the sequence of predefined questions.",
    "endpoints": [
        {
            "id": "get-all-predefined-questions",
            "name": "Get All Predefined Questions",
            "method": "GET",
            "url": "/api/pre-defined-questions/",
            "description": "Get a list of all predefined questions in the system.",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved all predefined questions",
                    "example": [
                        {
                            "id": 1,
                            "quiz_id": null,
                            "question_text": "Describe Newton's third law of motion.",
                            "question_img": null,
                            "question_type": "Descriptive",
                            "marks": 8,
                            "sequence_no": 2,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T04:43:56.000Z",
                            "updated_at": "2025-05-09T04:53:48.000Z",
                            "PreDefinedOptions": [
                                { "id": 5, "option_text": "var", "is_correct": 1 },
                                { "id": 6, "option_text": "int", "is_correct": 0 },
                                { "id": 7, "option_text": "string", "is_correct": 0 },
                                { "id": 8, "option_text": "let", "is_correct": 1 }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "id": "get-predefined-question-by-id",
            "name": "Get Predefined Question By ID",
            "method": "GET",
            "url": "/api/pre-defined-questions/:id",
            "description": "Get a specific predefined question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the predefined question to retrieve",
                    "example": "2"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the predefined question",
                    "example": {
                        "id": 2,
                        "quiz_id": null,
                        "question_text": "Describe Newton's third law of motion.",
                        "question_img": null,
                        "question_type": "Descriptive",
                        "marks": 8,
                        "sequence_no": 2,
                        "created_by": 1,
                        "updated_by": 1,
                        "created_at": "2025-05-09T04:43:56.000Z",
                        "updated_at": "2025-05-09T04:53:48.000Z",
                        "PreDefinedOptions": [
                            { "id": 5, "option_text": "var", "is_correct": 1 },
                            { "id": 6, "option_text": "int", "is_correct": 0 },
                            { "id": 7, "option_text": "string", "is_correct": 0 },
                            { "id": 8, "option_text": "let", "is_correct": 1 }
                        ]
                    }
                },
                {
                    "status": 404,
                    "description": "Predefined question not found",
                    "example": {
                        "success": false,
                        "message": "Predefined question not found"
                    }
                }
            ]
        },
        {
            "id": "create-predefined-question",
            "name": "Create Predefined Question",
            "method": "POST",
            "url": "/api/pre-defined-questions/create",
            "description": "Create a new predefined question in the system.",
            "parameters": [
                {
                    "name": "question_text",
                    "type": "string",
                    "required": true,
                    "description": "Text of the predefined question",
                    "example": "Explain Newton's second law of motion."
                },
                {
                    "name": "question_type",
                    "type": "string",
                    "required": true,
                    "description": "Type of the question (e.g., MCQ, Descriptive)",
                    "example": "MCQ"
                },
                {
                    "name": "marks",
                    "type": "number",
                    "required": true,
                    "description": "Marks assigned to the question",
                    "example": 10
                },
                {
                    "name": "created_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user creating the question",
                    "example": 1
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user updating the question",
                    "example": 1
                },
                {
                    "name": "sequence_no",
                    "type": "number",
                    "required": true,
                    "description": "Sequence number of the question",
                    "example": 2
                },
                {
                    "name": "question_img",
                    "type": "string",
                    "required": false,
                    "description": "Image URL for the question",
                    "example": "/quiz/predefined_question_images/newton2.png"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Predefined question created successfully",
                    "example": {
                        "message": "Predefined question created successfully"
                    }
                },
                {
                    "status": 400,
                    "description": "Validation error",
                    "example": {
                        "success": false,
                        "message": "Question text is required"
                    }
                }
            ]
        },
        {
            "id": "update-predefined-question",
            "name": "Update Predefined Question",
            "method": "PUT",
            "url": "/api/pre-defined-questions/update/:id",
            "description": "Update an existing predefined question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the predefined question to update",
                    "example": "2"
                },
                {
                    "name": "question_text",
                    "type": "string",
                    "required": false,
                    "description": "Updated text of the predefined question",
                    "example": "Describe Newton's third law of motion."
                },
                {
                    "name": "question_type",
                    "type": "string",
                    "required": false,
                    "description": "Updated type of the question",
                    "example": "MCQ"
                },
                {
                    "name": "marks",
                    "type": "number",
                    "required": false,
                    "description": "Updated marks assigned to the question",
                    "example": 8
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user updating the question",
                    "example": 43
                },
                {
                    "name": "question_img",
                    "type": "string",
                    "required": false,
                    "description": "Updated image URL for the question",
                    "example": "/quiz/predefined_question_images/newton3.png"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Predefined question updated successfully",
                    "example": {
                        "success": true,
                        "message": "Predefined question updated successfully"
                    }
                },
                {
                    "status": 404,
                    "description": "Predefined question not found",
                    "example": {
                        "success": false,
                        "message": "Predefined question not found"
                    }
                }
            ]
        },
        {
            "id": "delete-predefined-question",
            "name": "Delete Predefined Question",
            "method": "DELETE",
            "url": "/api/pre-defined-questions/delete/:id",
            "description": "Delete a predefined question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the predefined question to delete",
                    "example": "2"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Predefined question deleted successfully",
                    "example": {
                        "message": "Predefined question deleted successfully"
                    }
                },
                {
                    "status": 404,
                    "description": "Predefined question not found",
                    "example": {
                        "success": false,
                        "message": "Predefined question not found"
                    }
                }
            ]
        },
        {
            "id": "update-predefined-question-sequence",
            "name": "Update Predefined Question Sequence",
            "method": "PUT",
            "url": "/api/pre-defined-questions/update-sequence",
            "description": "Update the sequence of predefined questions.",
            "parameters": [
                {
                    "name": "updatedSequence",
                    "type": "array",
                    "required": true,
                    "description": "Array of objects with id and sequence_no",
                    "example": [
                        { "id": 101, "sequence_no": 1 },
                        { "id": 102, "sequence_no": 2 },
                        { "id": 103, "sequence_no": 3 }
                    ]
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Sequence updated successfully",
                    "example": {
                        "message": "Sequence updated successfully"
                    }
                }
            ]
        }
    ]
};

export default preDefinedQuestionData;
