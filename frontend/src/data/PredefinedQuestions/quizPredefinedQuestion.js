const quizPredefinedQuestionData = {
    "id": "quiz-predefined-questions",
    "name": "Quiz Predefined Questions",
    "description": "The Quiz Predefined Questions API provides endpoints to manage predefined question-quiz mappings in the system. These endpoints allow you to retrieve, assign, update, and delete predefined question-quiz mappings.",
    "endpoints": [
        {
            "id": "get-all-quiz-predefined-questions",
            "name": "Get All Quiz Predefined Questions",
            "method": "GET",
            "url": "/quiz-predefined-questions/",
            "description": "Get a list of all predefined question-quiz mappings in the system.",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved all predefined question-quiz mappings",
                    "example": {
                        "message": "All predefined question-quiz mappings retrieved successfully",
                        "data": {
                            "success": true,
                            "data": [
                                {
                                    "id": 2,
                                    "quiz_id": 2,
                                    "pre_defined_question_id": 2,
                                    "created_by": 1,
                                    "updated_by": 1,
                                    "created_at": "2025-05-09T05:38:26.000Z",
                                    "updated_at": "2025-05-09T05:38:26.000Z"
                                }
                            ]
                        }
                    }
                }
            ]
        },
        {
            "id": "get-quiz-predefined-question-by-id",
            "name": "Get Quiz Predefined Question By ID",
            "method": "GET",
            "url": "/quiz-predefined-questions/:id",
            "description": "Get a specific predefined question-quiz mapping by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the predefined question-quiz mapping to retrieve",
                    "example": "2"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the predefined question-quiz mapping",
                    "example": {
                        "message": "Predefined question-quiz mapping retrieved successfully",
                        "data": {
                            "success": true,
                            "data": [
                                {
                                    "id": 2,
                                    "quiz_id": 2,
                                    "pre_defined_question_id": 2,
                                    "created_by": 1,
                                    "updated_by": 1,
                                    "created_at": "2025-05-09T05:38:26.000Z",
                                    "updated_at": "2025-05-09T05:38:26.000Z"
                                }
                            ]
                        }
                    }
                },
                {
                    "status": 404,
                    "description": "Predefined question-quiz mapping not found",
                    "example": {
                        "success": false,
                        "message": "Predefined question-quiz mapping not found"
                    }
                }
            ]
        },
        {
            "id": "assign-quiz-predefined-questions",
            "name": "Assign Quiz Predefined Questions",
            "method": "POST",
            "url": "/quiz-predefined-questions/assign",
            "description": "Assign predefined questions to a quiz.",
            "parameters": [
                {
                    "name": "quiz_id",
                    "type": "number",
                    "required": true,
                    "description": "ID of the quiz",
                    "example": 1
                },
                {
                    "name": "pre_defined_question_id",
                    "type": "number",
                    "required": true,
                    "description": "ID of the predefined question",
                    "example": 1
                },
                {
                    "name": "created_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user creating the mapping",
                    "example": 1
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user updating the mapping",
                    "example": 1
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Predefined questions assigned to quiz successfully",
                    "example": {
                        "message": "Predefined questions assigned to quiz successfully",
                        "data": {
                            "success": true,
                            "data": [
                                {
                                    "message": "Predefined questions assigned to quiz successfully"
                                }
                            ]
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
            "id": "update-quiz-predefined-question",
            "name": "Update Quiz Predefined Question",
            "method": "PUT",
            "url": "/quiz-predefined-questions/update/:id",
            "description": "Update an existing predefined question-quiz mapping by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the predefined question-quiz mapping to update",
                    "example": "1"
                },
                {
                    "name": "quiz_id",
                    "type": "number",
                    "required": false,
                    "description": "Updated ID of the quiz",
                    "example": 1
                },
                {
                    "name": "pre_defined_question_id",
                    "type": "number",
                    "required": false,
                    "description": "Updated ID of the predefined question",
                    "example": 3
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user updating the mapping",
                    "example": 1
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Predefined question mapping updated successfully",
                    "example": {
                        "message": "Predefined question mapping updated successfully",
                        "data": {
                            "success": true,
                            "data": [
                                {
                                    "message": "Predefined question mapping updated successfully"
                                }
                            ]
                        }
                    }
                },
                {
                    "status": 404,
                    "description": "Predefined question-quiz mapping not found",
                    "example": {
                        "success": false,
                        "message": "Predefined question-quiz mapping not found"
                    }
                }
            ]
        },
        {
            "id": "delete-quiz-predefined-question",
            "name": "Delete Quiz Predefined Question",
            "method": "DELETE",
            "url": "/quiz-predefined-questions/remove/:id",
            "description": "Delete a predefined question-quiz mapping by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the predefined question-quiz mapping to delete",
                    "example": "1"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Predefined question removed from quiz successfully",
                    "example": {
                        "message": "Predefined question removed from quiz successfully",
                        "data": {
                            "success": true,
                            "data": [
                                {
                                    "message": "Predefined question removed from quiz successfully"
                                }
                            ]
                        }
                    }
                },
                {
                    "status": 404,
                    "description": "Predefined question-quiz mapping not found",
                    "example": {
                        "success": false,
                        "message": "Predefined question-quiz mapping not found"
                    }
                }
            ]
        },
        {
            "id": "get-quiz-predefined-questions-by-quiz-id",
            "name": "Get Quiz Predefined Questions By Quiz ID",
            "method": "GET",
            "url": "/quiz-predefined-questions/quiz/:quiz_id",
            "description": "Get predefined question-quiz mappings by quiz ID.",
            "parameters": [
                {
                    "name": "quiz_id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the quiz to retrieve mappings for",
                    "example": "2"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the predefined question-quiz mappings by quiz ID",
                    "example": {
                        "message": "Predefined question-quiz mapping retrieved successfully",
                        "data": {
                            "success": true,
                            "data": [
                                {
                                    "id": 2,
                                    "quiz_id": 2,
                                    "pre_defined_question_id": 2,
                                    "created_by": 1,
                                    "updated_by": 1,
                                    "created_at": "2025-05-09T05:38:26.000Z",
                                    "updated_at": "2025-05-09T05:38:26.000Z"
                                }
                            ]
                        }
                    }
                },
                {
                    "status": 404,
                    "description": "Predefined question-quiz mappings not found for the quiz ID",
                    "example": {
                        "success": false,
                        "message": "Predefined question-quiz mappings not found for the quiz ID"
                    }
                }
            ]
        }
    ]
};

export default quizPredefinedQuestionData;
