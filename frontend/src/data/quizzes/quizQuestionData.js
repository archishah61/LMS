const quizQuestionData = {
    "id": "quiz-questions",
    "name": "Quiz Questions",
    "description": "The Quiz Questions API provides endpoints to manage quiz questions in the system. These endpoints allow you to create, read, update, and delete quiz questions.",
    "endpoints": [
        {
            "id": "get-all-quiz-questions",
            "name": "Get All Quiz Questions",
            "method": "GET",
            "url": "/quiz-questions/",
            "description": "Get a list of all quiz questions in the system.",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved all quiz questions",
                    "example": [
                        {
                            "id": 1,
                            "quiz_id": 1,
                            "question_text": "What is the correct way to declare a variable in JavaScript?",
                            "question_img": null,
                            "question_type": "mcq",
                            "marks": 5,
                            "sequence_no": 1,
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
            "id": "get-quiz-question-by-id",
            "name": "Get Quiz Question By ID",
            "method": "GET",
            "url": "/quiz-questions/:id",
            "description": "Get a specific quiz question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the quiz question to retrieve",
                    "example": "1"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the quiz question",
                    "example": [
                        {
                            "id": 1,
                            "quiz_id": 1,
                            "question_text": "What is the correct way to declare a variable in JavaScript?",
                            "question_img": null,
                            "question_type": "mcq",
                            "marks": 5,
                            "sequence_no": 1,
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T07:42:01.000Z",
                            "updated_at": "2025-05-09T07:42:01.000Z"
                        },
                        {
                            "id": 2,
                            "quiz_id": 1,
                            "question_text": "The keyword used to define a constant variable in JavaScript is",
                            "question_img": null,
                            "question_type": "complete-sentence",
                            "marks": 5,
                            "sequence_no": 4,
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
                    "description": "Quiz question not found",
                    "example": {
                        "success": false,
                        "message": "Quiz question not found"
                    }
                }
            ]
        },
        {
            "id": "create-quiz-question",
            "name": "Create Quiz Question",
            "method": "POST",
            "url": "/quiz-questions/create",
            "description": "Create a new quiz question in the system.",
            "parameters": [
                {
                    "name": "quiz_id",
                    "type": "number",
                    "required": true,
                    "description": "ID of the quiz",
                    "example": 1
                },
                {
                    "name": "question_text",
                    "type": "string",
                    "required": true,
                    "description": "Text of the quiz question",
                    "example": "What is the output of print(2 + 3 * 4)?"
                },
                {
                    "name": "question_type",
                    "type": "string",
                    "required": true,
                    "description": "Type of the question (e.g., mcq, complete-sentence)",
                    "example": "mcq"
                },
                {
                    "name": "marks",
                    "type": "number",
                    "required": true,
                    "description": "Marks assigned to the question",
                    "example": 5
                },
                {
                    "name": "sequence_no",
                    "type": "number",
                    "required": true,
                    "description": "Sequence number of the question",
                    "example": 1
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
                    "name": "question_img",
                    "type": "string",
                    "required": false,
                    "description": "Image URL for the question",
                    "example": null
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Quiz question created successfully",
                    "example": {
                        "message": "Quiz question created successfully",
                        "quizQuestion": {
                            "id": 17,
                            "quiz_id": 1,
                            "question_text": "What is the output of print(2 + 3 * 4)?",
                            "question_img": null,
                            "question_type": "mcq",
                            "marks": 5,
                            "sequence_no": 1,
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T07:59:21.000Z",
                            "updated_at": "2025-05-09T07:59:21.000Z"
                        }
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
            "id": "update-quiz-question",
            "name": "Update Quiz Question",
            "method": "PUT",
            "url": "/quiz-questions/update/:id",
            "description": "Update an existing quiz question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the quiz question to update",
                    "example": "17"
                },
                {
                    "name": "quiz_id",
                    "type": "number",
                    "required": false,
                    "description": "Updated ID of the quiz",
                    "example": 1
                },
                {
                    "name": "question_text",
                    "type": "string",
                    "required": false,
                    "description": "Updated text of the quiz question",
                    "example": "What is the result of 5 + 2 * 3?"
                },
                {
                    "name": "question_type",
                    "type": "string",
                    "required": false,
                    "description": "Updated type of the question",
                    "example": "mcq"
                },
                {
                    "name": "marks",
                    "type": "number",
                    "required": false,
                    "description": "Updated marks assigned to the question",
                    "example": 5
                },
                {
                    "name": "sequence_no",
                    "type": "number",
                    "required": false,
                    "description": "Updated sequence number of the question",
                    "example": 2
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user updating the question",
                    "example": 1
                },
                {
                    "name": "question_img",
                    "type": "string",
                    "required": false,
                    "description": "Updated image URL for the question",
                    "example": null
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Quiz question updated successfully",
                    "example": {
                        "message": "Quiz question updated successfully",
                        "quizQuestion": {
                            "id": 17,
                            "quiz_id": 1,
                            "question_text": "What is the result of 5 + 2 * 3?",
                            "question_img": null,
                            "question_type": "mcq",
                            "marks": 5,
                            "sequence_no": 2,
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T07:59:21.000Z",
                            "updated_at": "2025-05-09T08:04:18.000Z"
                        }
                    }
                },
                {
                    "status": 404,
                    "description": "Quiz question not found",
                    "example": {
                        "success": false,
                        "message": "Quiz question not found"
                    }
                }
            ]
        }
    ]
};

export default quizQuestionData;
