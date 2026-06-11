const assignmentCompletionData = {
    "id": "assignment-completion",
    "name": "Assignment Completion",
    "description": "The Assignment Completion API provides endpoints to manage assignment completions in the system. These endpoints allow you to create, read, and update assignment completions.",
    "endpoints": [
        {
            "id": "get-all-assignment-completions",
            "name": "Get All Assignment Completions",
            "method": "GET",
            "url": "/assignment-completions/",
            "description": "Get a list of all assignment completions in the system.",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved all assignment completions",
                    "example": [
                        {
                            "id": 1,
                            "userId": 1,
                            "assignmentId": 4,
                            "isCompleted": 1,
                            "status": "Completed",
                            "score": 40,
                            "updated_by": 1,
                            "created_by": 1,
                            "created_at": "2025-05-13T16:52:02.000Z",
                            "updated_at": "2025-05-13T16:52:02.000Z"
                        },
                        {
                            "id": 3,
                            "userId": 1,
                            "assignmentId": 14,
                            "isCompleted": 1,
                            "status": "Incomplete",
                            "score": 0,
                            "updated_by": 1,
                            "created_by": 1,
                            "created_at": "2025-05-13T16:55:28.000Z",
                            "updated_at": "2025-05-13T16:55:28.000Z"
                        }
                    ]
                }
            ]
        },
        {
            "id": "get-assignment-completions-by-student-id",
            "name": "Get Assignment Completions By Student ID",
            "method": "GET",
            "url": "/assignment-completions/student/:studentId",
            "description": "Get all assignment completions for a specific student by their student ID.",
            "parameters": [
                {
                    "name": "studentId",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the student to retrieve assignment completions for",
                    "example": "1"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the assignment completions for the student",
                    "example": [
                        {
                            "id": 1,
                            "userId": 1,
                            "assignmentId": 4,
                            "isCompleted": 1,
                            "status": "Completed",
                            "score": 40,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-13T16:52:02.000Z",
                            "updated_at": "2025-05-13T16:52:02.000Z",
                            "Assignment": {
                                "id": 4,
                                "module_id": 1,
                                "title": "Fill in the Blanks - Variables",
                                "description": "Complete the sentences about variables",
                                "file": null,
                                "due_date": "2025-05-17T15:47:38.000Z",
                                "max_score": 40,
                                "status": "active",
                                "category": "fill_in_the_blanks",
                                "created_by": 1,
                                "created_by_type": "admin",
                                "updated_by": 1,
                                "updated_by_type": "admin",
                                "created_at": "2025-05-13T15:48:03.000Z",
                                "updated_at": "2025-05-13T15:48:03.000Z",
                                "MatchingQuestions": [],
                                "TrueFalseQuestions": [],
                                "FillTheBlanksQuestions": [
                                    {
                                        "id": 1,
                                        "answers": [
                                            "const"
                                        ],
                                        "assignment_id": 4,
                                        "question_text": "The _____ keyword is used to declare a constant variable"
                                    },
                                    {
                                        "id": 2,
                                        "answers": [
                                            "var"
                                        ],
                                        "assignment_id": 4,
                                        "question_text": "Variables declared with _____ are function-scoped"
                                    }
                                ],
                                "ParagraphWritings": []
                            },
                            "AssignmentResponses": [
                                {
                                    "id": 1,
                                    "created_at": "2025-05-13 16:52:02.000000",
                                    "updated_at": "2025-05-13 16:52:02.000000",
                                    "created_by": 1,
                                    "questionId": 1,
                                    "updated_by": 1,
                                    "optionIndex": null,
                                    "selectedAnswer": "const",
                                    "assignmentCompletionId": 1
                                },
                                {
                                    "id": 2,
                                    "created_at": "2025-05-13 16:52:02.000000",
                                    "updated_at": "2025-05-13 16:52:02.000000",
                                    "created_by": 1,
                                    "questionId": 2,
                                    "updated_by": 1,
                                    "optionIndex": null,
                                    "selectedAnswer": "var",
                                    "assignmentCompletionId": 1
                                }
                            ]
                        },
                        {
                            "id": 3,
                            "userId": 1,
                            "assignmentId": 14,
                            "isCompleted": 1,
                            "status": "Incomplete",
                            "score": 0,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-13T16:55:28.000Z",
                            "updated_at": "2025-05-13T16:55:28.000Z",
                            "Assignment": {
                                "id": 14,
                                "module_id": 3,
                                "title": "Fill in the Blanks - Bones",
                                "description": "Complete the sentences about the skeletal system",
                                "file": null,
                                "due_date": "2025-05-17T15:47:38.000Z",
                                "max_score": 40,
                                "status": "active",
                                "category": "fill_in_the_blanks",
                                "created_by": 1,
                                "created_by_type": "admin",
                                "updated_by": 1,
                                "updated_by_type": "admin",
                                "created_at": "2025-05-13T15:48:03.000Z",
                                "updated_at": "2025-05-13T15:48:03.000Z",
                                "MatchingQuestions": [],
                                "TrueFalseQuestions": [],
                                "FillTheBlanksQuestions": [
                                    {
                                        "id": 5,
                                        "answers": [
                                            "skull"
                                        ],
                                        "assignment_id": 14,
                                        "question_text": "The _____ protects the brain"
                                    },
                                    {
                                        "id": 6,
                                        "answers": [
                                            "ligaments"
                                        ],
                                        "assignment_id": 14,
                                        "question_text": "Bones are connected to each other by _____"
                                    }
                                ],
                                "ParagraphWritings": []
                            },
                            "AssignmentResponses": [
                                {
                                    "id": 3,
                                    "created_at": "2025-05-13 16:55:28.000000",
                                    "updated_at": "2025-05-13 16:55:28.000000",
                                    "created_by": 1,
                                    "questionId": 5,
                                    "updated_by": 1,
                                    "optionIndex": null,
                                    "selectedAnswer": "answer1",
                                    "assignmentCompletionId": 3
                                },
                                {
                                    "id": 4,
                                    "created_at": "2025-05-13 16:55:28.000000",
                                    "updated_at": "2025-05-13 16:55:28.000000",
                                    "created_by": 1,
                                    "questionId": 6,
                                    "updated_by": 1,
                                    "optionIndex": null,
                                    "selectedAnswer": "answer2",
                                    "assignmentCompletionId": 3
                                }
                            ]
                        }
                    ]
                },
                {
                    "status": 404,
                    "description": "Student not found",
                    "example": {
                        "success": false,
                        "message": "Student not found"
                    }
                }
            ]
        },
        {
            "id": "create-assignment-completion",
            "name": "Create Assignment Completion",
            "method": "POST",
            "url": "/assignment-completions/",
            "description": "Create a new assignment completion in the system.",
            "parameters": [
                {
                    "name": "userId",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user completing the assignment",
                    "example": 1
                },
                {
                    "name": "assignmentId",
                    "type": "number",
                    "required": true,
                    "description": "ID of the assignment being completed",
                    "example": 4
                },
                {
                    "name": "isCompleted",
                    "type": "boolean",
                    "required": true,
                    "description": "Whether the assignment is completed",
                    "example": true
                },
                {
                    "name": "status",
                    "type": "string",
                    "required": true,
                    "description": "Status of the assignment completion",
                    "example": "Completed"
                },
                {
                    "name": "score",
                    "type": "number",
                    "required": true,
                    "description": "Score of the assignment completion",
                    "example": 40
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user updating the assignment completion",
                    "example": 1
                },
                {
                    "name": "created_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user creating the assignment completion",
                    "example": 1
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Assignment completion created successfully",
                    "example": {
                        "id": 1
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
            "id": "update-assignment-completion",
            "name": "Update Assignment Completion",
            "method": "PUT",
            "url": "/assignment-completions/:id",
            "description": "Update an existing assignment completion by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the assignment completion to update",
                    "example": "3"
                },
                {
                    "name": "userId",
                    "type": "number",
                    "required": false,
                    "description": "Updated ID of the user completing the assignment",
                    "example": 2
                },
                {
                    "name": "assignmentId",
                    "type": "number",
                    "required": false,
                    "description": "Updated ID of the assignment being completed",
                    "example": 4
                },
                {
                    "name": "isCompleted",
                    "type": "boolean",
                    "required": false,
                    "description": "Updated completion status of the assignment",
                    "example": true
                },
                {
                    "name": "status",
                    "type": "string",
                    "required": false,
                    "description": "Updated status of the assignment completion",
                    "example": "Incomplete"
                },
                {
                    "name": "score",
                    "type": "number",
                    "required": false,
                    "description": "Updated score of the assignment completion",
                    "example": 0
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": false,
                    "description": "Updated ID of the user updating the assignment completion",
                    "example": 1
                },
                {
                    "name": "created_by",
                    "type": "number",
                    "required": false,
                    "description": "Updated ID of the user creating the assignment completion",
                    "example": 1
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Assignment completion updated successfully",
                    "example": {
                        "id": 3,
                        "userId": 2,
                        "assignmentId": 4,
                        "isCompleted": 1,
                        "status": "Incomplete",
                        "score": 0,
                        "updated_by": 1,
                        "created_by": 1,
                        "created_at": "2025-05-13T16:55:28.000Z",
                        "updated_at": "2025-05-13T17:02:17.000Z"
                    }
                },
                {
                    "status": 404,
                    "description": "Assignment completion not found",
                    "example": {
                        "success": false,
                        "message": "Assignment completion not found"
                    }
                }
            ]
        }
    ]
};

export default assignmentCompletionData;
