const predefined_option_data = {
    "id": "predefined-options",
    "name": "Predefined Options",
    "description": "The Predefined Options API provides endpoints to manage predefined options in the system. These endpoints allow you to create, read, update, and delete predefined options.",
    "endpoints": [
        {
            "id": "get-all-predefined-options",
            "name": "Get All Predefined Options",
            "method": "GET",
            "url": "/api/pre-defined-options/",
            "description": "Get a list of all predefined options in the system.",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved all predefined options",
                    "example": [
                        {
                            "id": 17,
                            "pre_defined_question_id": 5,
                            "option_text": "array",
                            "option_img": null,
                            "is_correct": 0,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T04:43:56.000Z",
                            "updated_at": "2025-05-09T04:43:56.000Z"
                        },
                        {
                            "id": 18,
                            "pre_defined_question_id": 5,
                            "option_text": "object",
                            "option_img": null,
                            "is_correct": 1,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T04:43:56.000Z",
                            "updated_at": "2025-05-09T04:43:56.000Z"
                        }
                    ]
                }
            ]
        },
        {
            "id": "get-predefined-option-by-id",
            "name": "Get Predefined Option By ID",
            "method": "GET",
            "url": "/api/pre-defined-options/:id",
            "description": "Get a specific predefined option by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": 1,
                    "inPath": 1,
                    "description": "The ID of the predefined option to retrieve",
                    "example": "17"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the predefined option",
                    "example": [
                        {
                            "id": 17,
                            "pre_defined_question_id": 5,
                            "option_text": "array",
                            "option_img": null,
                            "is_correct": 0,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T04:43:56.000Z",
                            "updated_at": "2025-05-09T04:43:56.000Z"
                        },
                        {
                            "id": 18,
                            "pre_defined_question_id": 5,
                            "option_text": "object",
                            "option_img": null,
                            "is_correct": 1,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T04:43:56.000Z",
                            "updated_at": "2025-05-09T04:43:56.000Z"
                        }
                    ]
                },
                {
                    "status": 404,
                    "description": "Predefined option not found",
                    "example": {
                        "success": 0,
                        "message": "Predefined option not found"
                    }
                }
            ]
        },
        {
            "id": "create-predefined-option",
            "name": "Create Predefined Option",
            "method": "POST",
            "url": "/api/pre-defined-options/create",
            "description": "Create a new predefined option in the system.",
            "parameters": [
                {
                    "name": "pre_defined_question_id",
                    "type": "number",
                    "required": 1,
                    "description": "ID of the predefined question",
                    "example": 1
                },
                {
                    "name": "option_text",
                    "type": "string",
                    "required": 1,
                    "description": "Text of the predefined option",
                    "example": "Hydrogen"
                },
                {
                    "name": "option_img",
                    "type": "string",
                    "required": 0,
                    "description": "Image URL for the option",
                    "example": null
                },
                {
                    "name": "is_correct",
                    "type": "boolean",
                    "required": 1,
                    "description": "Whether the option is correct",
                    "example": 0
                },
                {
                    "name": "created_by",
                    "type": "number",
                    "required": 1,
                    "description": "ID of the user creating the option",
                    "example": 1
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": 1,
                    "description": "ID of the user updating the option",
                    "example": 1
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Predefined option created successfully",
                    "example": {
                        "message": "Predefined option created successfully"
                    }
                },
                {
                    "status": 400,
                    "description": "Validation error",
                    "example": {
                        "success": 0,
                        "message": "Option text is required"
                    }
                }
            ]
        },
        {
            "id": "update-predefined-option",
            "name": "Update Predefined Option",
            "method": "PUT",
            "url": "/api/pre-defined-options/update/:id",
            "description": "Update an existing predefined option by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": 1,
                    "inPath": 1,
                    "description": "The ID of the predefined option to update",
                    "example": "1"
                },
                {
                    "name": "pre_defined_question_id",
                    "type": "number",
                    "required": 0,
                    "description": "ID of the predefined question",
                    "example": 1
                },
                {
                    "name": "option_text",
                    "type": "string",
                    "required": 0,
                    "description": "Updated text of the predefined option",
                    "example": "Hydrogen"
                },
                {
                    "name": "option_img",
                    "type": "string",
                    "required": 0,
                    "description": "Updated image URL for the option",
                    "example": null
                },
                {
                    "name": "is_correct",
                    "type": "boolean",
                    "required": 0,
                    "description": "Whether the option is correct",
                    "example": 1
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": 1,
                    "description": "ID of the user updating the option",
                    "example": 1
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Predefined option updated successfully",
                    "example": {
                        "success": 1,
                        "message": "Predefined option updated successfully"
                    }
                },
                {
                    "status": 404,
                    "description": "Predefined option not found",
                    "example": {
                        "success": 0,
                        "message": "Predefined option not found"
                    }
                }
            ]
        },
        {
            "id": "delete-predefined-option",
            "name": "Delete Predefined Option",
            "method": "DELETE",
            "url": "/api/pre-defined-options/delete/:id",
            "description": "Delete a predefined option by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": 1,
                    "inPath": 1,
                    "description": "The ID of the predefined option to delete",
                    "example": "3"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Predefined option deleted successfully",
                    "example": {
                        "message": "Predefined option deleted successfully"
                    }
                },
                {
                    "status": 404,
                    "description": "Predefined option not found",
                    "example": {
                        "success": 0,
                        "message": "Predefined option not found"
                    }
                }
            ]
        }
    ]
}

export default predefined_option_data;
