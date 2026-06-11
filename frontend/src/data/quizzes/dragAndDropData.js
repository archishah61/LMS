const dragAndDropData = {
    "id": "drag-drop-question",
    "name": "Drag Drop Question",
    "description": "The Drag Drop Question API provides endpoints to manage drag and drop questions in the system. These endpoints allow you to create, read, update, and delete drag and drop questions.",
    "endpoints": [
        {
            "id": "get-all-drag-drop-questions",
            "name": "Get All Drag Drop Questions",
            "method": "GET",
            "url": "/dragdrop-questions/",
            "description": "Get a list of all drag and drop questions in the system.",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved all drag and drop questions",
                    "example": {
                        "success": true,
                        "data": [
                            {
                                "id": 2,
                                "quiz_id": 1,
                                "prompt": "complete equation ___+___=7",
                                "options": [
                                    "5",
                                    "2"
                                ],
                                "blanks": [
                                    {
                                        "correct": "5",
                                        "position": 1
                                    },
                                    {
                                        "correct": "2",
                                        "position": 2
                                    }
                                ],
                                "marks": 2,
                                "created_by": 1,
                                "updated_by": 1,
                                "created_at": "2025-05-12T09:53:16.000Z",
                                "updated_at": "2025-05-12T09:53:16.000Z"
                            }
                        ]
                    }
                }
            ]
        },
        {
            "id": "get-drag-drop-questions-by-quiz-id",
            "name": "Get Drag Drop Questions By Quiz ID",
            "method": "GET",
            "url": "/dragdrop-questions/quiz/:quiz_id",
            "description": "Get drag and drop questions by Quiz ID.",
            "parameters": [
                {
                    "name": "quiz_id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the quiz to retrieve drag and drop questions",
                    "example": "1"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the drag and drop questions by quiz ID",
                    "example": [
                        {
                            "id": 2,
                            "quiz_id": 1,
                            "prompt": "complete equation ___+___=7",
                            "options": [
                                "5",
                                "2"
                            ],
                            "blanks": [
                                {
                                    "correct": "5",
                                    "position": 1
                                },
                                {
                                    "correct": "2",
                                    "position": 2
                                }
                            ],
                            "marks": 2,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-12T09:53:16.000Z",
                            "updated_at": "2025-05-12T09:53:16.000Z"
                        }
                    ]
                },
                {
                    "status": 404,
                    "description": "Drag and drop questions not found",
                    "example": {
                        "success": false,
                        "message": "Drag and drop questions not found"
                    }
                }
            ]
        },
        {
            "id": "get-drag-drop-question-by-id",
            "name": "Get Drag Drop Question By ID",
            "method": "GET",
            "url": "/dragdrop-questions/:id",
            "description": "Get a specific drag and drop question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the drag and drop question to retrieve",
                    "example": "2"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the drag and drop question",
                    "example": {
                        "success": true,
                        "data": {
                            "id": 2,
                            "quiz_id": 1,
                            "prompt": "complete equation ___+___=7",
                            "options": [
                                "5",
                                "2"
                            ],
                            "blanks": [
                                {
                                    "correct": "5",
                                    "position": 1
                                },
                                {
                                    "correct": "2",
                                    "position": 2
                                }
                            ],
                            "marks": 2,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-12T09:53:16.000Z",
                            "updated_at": "2025-05-12T09:53:16.000Z"
                        }
                    }
                },
                {
                    "status": 404,
                    "description": "Drag and drop question not found",
                    "example": {
                        "success": false,
                        "message": "Drag and drop question not found"
                    }
                }
            ]
        },
        {
            "id": "create-drag-drop-question",
            "name": "Create Drag Drop Question",
            "method": "POST",
            "url": "/dragdrop-questions/create",
            "description": "Create a new drag and drop question in the system.",
            "parameters": [
                {
                    "name": "quiz_id",
                    "type": "number",
                    "required": true,
                    "description": "The ID of the quiz",
                    "example": 1
                },
                {
                    "name": "prompt",
                    "type": "string",
                    "required": true,
                    "description": "The prompt for the drag and drop question",
                    "example": "complete equation ___+___=7"
                },
                {
                    "name": "options",
                    "type": "array",
                    "required": true,
                    "description": "List of options for the drag and drop question",
                    "example": ["5", "2"]
                },
                {
                    "name": "blanks",
                    "type": "array",
                    "required": true,
                    "description": "List of blanks with correct answers and positions",
                    "example": [
                        { "position": 1, "correct": "5" },
                        { "position": 2, "correct": "2" }
                    ]
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
                    "name": "marks",
                    "type": "number",
                    "required": true,
                    "description": "Marks for the question",
                    "example": 2
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Drag and drop question created successfully",
                    "example": {
                        "success": true,
                        "message": "Drag drop question created successfully",
                        "data": {
                            "id": 1,
                            "quiz_id": 1,
                            "prompt": "complete equation ___+___=7",
                            "options": ["5", "2"],
                            "blanks": [
                                { "position": 1, "correct": "5" },
                                { "position": 2, "correct": "2" }
                            ],
                            "marks": 2,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-12T09:45:42.000Z",
                            "updated_at": "2025-05-12T09:45:42.000Z"
                        }
                    }
                },
                {
                    "status": 400,
                    "description": "Validation error",
                    "example": {
                        "success": false,
                        "message": "Validation error"
                    }
                }
            ]
        },
        {
            "id": "update-drag-drop-question",
            "name": "Update Drag Drop Question",
            "method": "PUT",
            "url": "/dragdrop-questions/update/:id",
            "description": "Update an existing drag and drop question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the drag and drop question to update",
                    "example": "1"
                },
                {
                    "name": "quiz_id",
                    "type": "number",
                    "required": false,
                    "description": "The ID of the quiz",
                    "example": 1
                },
                {
                    "name": "prompt",
                    "type": "string",
                    "required": false,
                    "description": "The prompt for the drag and drop question",
                    "example": "parrot is ___ in color"
                },
                {
                    "name": "options",
                    "type": "array",
                    "required": false,
                    "description": "List of options for the drag and drop question",
                    "example": ["green"]
                },
                {
                    "name": "blanks",
                    "type": "array",
                    "required": false,
                    "description": "List of blanks with correct answers and positions",
                    "example": [
                        { "position": 1, "correct": "green" }
                    ]
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user updating the question",
                    "example": 1
                },
                {
                    "name": "marks",
                    "type": "number",
                    "required": false,
                    "description": "Marks for the question",
                    "example": 999
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Drag and drop question updated successfully",
                    "example": {
                        "success": true,
                        "data": {
                            "id": 1,
                            "quiz_id": 1,
                            "prompt": "parrot is ___ in color",
                            "options": ["green"],
                            "blanks": [
                                { "position": 1, "correct": "green" }
                            ],
                            "marks": 999,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-12T09:45:42.000Z",
                            "updated_at": "2025-05-12T09:47:52.000Z"
                        }
                    }
                },
                {
                    "status": 404,
                    "description": "Drag and drop question not found",
                    "example": {
                        "success": false,
                        "message": "Drag and drop question not found"
                    }
                }
            ]
        },
        {
            "id": "delete-drag-drop-question",
            "name": "Delete Drag Drop Question",
            "method": "DELETE",
            "url": "/dragdrop-questions/delete/:id",
            "description": "Delete a drag and drop question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the drag and drop question to delete",
                    "example": "1"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Drag and drop question deleted successfully",
                    "example": {
                        "success": true,
                        "message": "Drag drop question deleted successfully",
                        "data": {
                            "deleted_id": 1,
                            "message": "Question deleted successfully"
                        }
                    }
                },
                {
                    "status": 404,
                    "description": "Drag and drop question not found",
                    "example": {
                        "success": false,
                        "message": "Drag and drop question not found"
                    }
                }
            ]
        }
    ]
};

export default dragAndDropData;
