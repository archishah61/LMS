const quizOptionData = {
    "id": "quiz-options",
    "name": "Quiz Options",
    "description": "The Quiz Options API provides endpoints to manage quiz options in the system. These endpoints allow you to create, read, update, and delete quiz options.",
    "endpoints": [
        {
            "id": "get-all-quiz-options",
            "name": "Get All Quiz Options",
            "method": "GET",
            "url": "/quiz-options/",
            "description": "Get a list of all quiz options in the system.",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved all quiz options",
                    "example": [
                        {
                            "id": 1,
                            "question_id": 1,
                            "option_text": "let x = 5;",
                            "option_img": null,
                            "is_correct": 1,
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T07:42:01.000Z",
                            "updated_at": "2025-05-09T07:42:01.000Z"
                        },
                        {
                            "id": 2,
                            "question_id": 1,
                            "option_text": "int x = 5;",
                            "option_img": null,
                            "is_correct": 0,
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
            "id": "get-quiz-options-by-question-id",
            "name": "Get Quiz Options By Question ID",
            "method": "GET",
            "url": "/quiz-options/:id",
            "description": "Get quiz options by question ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the question to retrieve options for",
                    "example": "1"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the quiz options by question ID",
                    "example": [
                        {
                            "id": 1,
                            "question_id": 1,
                            "option_text": "let x = 5;",
                            "option_img": null,
                            "is_correct": 1,
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T07:42:01.000Z",
                            "updated_at": "2025-05-09T07:42:01.000Z"
                        },
                        {
                            "id": 2,
                            "question_id": 1,
                            "option_text": "int x = 5;",
                            "option_img": null,
                            "is_correct": 0,
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T07:42:01.000Z",
                            "updated_at": "2025-05-09T07:42:01.000Z"
                        }
                    ]
                },
                {
                    "status": 404,
                    "description": "Quiz options not found for the question ID",
                    "example": {
                        "success": false,
                        "message": "Quiz options not found for the question ID"
                    }
                }
            ]
        },
        {
            "id": "create-quiz-option",
            "name": "Create Quiz Option",
            "method": "POST",
            "url": "/quiz-options/create",
            "description": "Create a new quiz option in the system.",
            "parameters": [
                {
                    "name": "question_id",
                    "type": "number",
                    "required": true,
                    "description": "ID of the question",
                    "example": 17
                },
                {
                    "name": "option_text",
                    "type": "string",
                    "required": true,
                    "description": "Text of the quiz option",
                    "example": "g"
                },
                {
                    "name": "is_correct",
                    "type": "boolean",
                    "required": true,
                    "description": "Whether the option is correct",
                    "example": false
                },
                {
                    "name": "created_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user creating the option",
                    "example": 1
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user updating the option",
                    "example": 1
                },
                {
                    "name": "option_img",
                    "type": "string",
                    "required": false,
                    "description": "Image URL for the option",
                    "example": null
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Quiz option created successfully",
                    "example": {
                        "message": "Quiz option created successfully",
                        "quizOption": {
                            "id": 30,
                            "question_id": 17,
                            "option_text": "g",
                            "option_img": null,
                            "is_correct": 0,
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T08:19:32.000Z",
                            "updated_at": "2025-05-09T08:19:32.000Z"
                        }
                    }
                },
                {
                    "status": 400,
                    "description": "Validation error",
                    "example": {
                        "success": false,
                        "message": "Option text is required"
                    }
                }
            ]
        },
        {
            "id": "update-quiz-option",
            "name": "Update Quiz Option",
            "method": "PUT",
            "url": "/quiz-options/update/:id",
            "description": "Update an existing quiz option by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the quiz option to update",
                    "example": "1"
                },
                {
                    "name": "option_text",
                    "type": "string",
                    "required": false,
                    "description": "Updated text of the quiz option",
                    "example": "d"
                },
                {
                    "name": "is_correct",
                    "type": "boolean",
                    "required": false,
                    "description": "Whether the option is correct",
                    "example": true
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user updating the option",
                    "example": 1
                },
                {
                    "name": "updated_by_type",
                    "type": "string",
                    "required": true,
                    "description": "Type of the user updating the option",
                    "example": "admin"
                },
                {
                    "name": "option_img",
                    "type": "string",
                    "required": false,
                    "description": "Updated image URL for the option",
                    "example": null
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Quiz option updated successfully",
                    "example": {
                        "message": "Quiz option updated successfully"
                    }
                },
                {
                    "status": 404,
                    "description": "Quiz option not found",
                    "example": {
                        "success": false,
                        "message": "Quiz option not found"
                    }
                }
            ]
        },
        {
            "id": "delete-quiz-option-by-id",
            "name": "Delete Quiz Option By ID",
            "method": "DELETE",
            "url": "/quiz-options/delete/:id",
            "description": "Delete a quiz option by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the quiz option to delete",
                    "example": "1"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Quiz option deleted successfully",
                    "example": {
                        "message": "Quiz option deleted successfully"
                    }
                },
                {
                    "status": 404,
                    "description": "Quiz option not found",
                    "example": {
                        "error": "Quiz option not found"
                    }
                }
            ]
        },
        {
            "id": "delete-quiz-options-by-question-id",
            "name": "Delete Quiz Options By Question ID",
            "method": "DELETE",
            "url": "/quiz-options/delete/options/:question_id",
            "description": "Delete quiz options by question ID.",
            "parameters": [
                {
                    "name": "question_id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the question to delete options for",
                    "example": "1"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Quiz options deleted successfully",
                    "example": {
                        "message": "Quiz options deleted successfully"
                    }
                },
                {
                    "status": 404,
                    "description": "No options found for the given question ID",
                    "example": {
                        "message": "No options found for the given question ID."
                    }
                }
            ]
        }
    ]
};

export default quizOptionData;
