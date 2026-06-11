const realWordData = {
    "id": "real-word",
    "name": "Real Word",
    "description": "The Real Word API provides endpoints to manage real word questions in the system. These endpoints allow you to create, read, and delete real word questions.",
    "endpoints": [
        {
            "id": "get-random-real-word-quiz",
            "name": "Get Random Real Word Quiz",
            "method": "GET",
            "url": "/real-word/random-real-word-quiz",
            "description": "Get a list of 10 shuffled words (5 real, 5 fake).",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved a random real word quiz",
                    "example": {
                        "quiz": [
                            {
                                "word": "shudukila",
                                "correct_answer": "no"
                            },
                            {
                                "word": "bola",
                                "correct_answer": "yes"
                            },
                            {
                                "word": "cure",
                                "correct_answer": "yes"
                            },
                            {
                                "word": "zenezucu",
                                "correct_answer": "no"
                            },
                            {
                                "word": "calezira",
                                "correct_answer": "no"
                            },
                            {
                                "word": "mocopura",
                                "correct_answer": "no"
                            },
                            {
                                "word": "pane",
                                "correct_answer": "yes"
                            },
                            {
                                "word": "mote",
                                "correct_answer": "yes"
                            },
                            {
                                "word": "nazesha",
                                "correct_answer": "no"
                            },
                            {
                                "word": "bile",
                                "correct_answer": "yes"
                            }
                        ]
                    }
                }
            ]
        },
        {
            "id": "create-real-word-questions",
            "name": "Create Real Word Questions",
            "method": "POST",
            "url": "/real-word/",
            "description": "Bulk create real word questions.",
            "parameters": [
                {
                    "name": "questions",
                    "type": "array",
                    "required": true,
                    "description": "Array of word questions to create",
                    "example": [
                        {
                            "word": "banana",
                            "correct_answer": "yes",
                            "quiz_id": 1,
                            "created_by": 1,
                            "updated_by": 1
                        },
                        {
                            "word": "fokezu",
                            "correct_answer": "no",
                            "quiz_id": 1,
                            "created_by": 1,
                            "updated_by": 1
                        }
                    ]
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Real word questions created successfully",
                    "example": {
                        "message": "Real word questions created successfully",
                        "data": {
                            "success": true
                        }
                    }
                }
            ]
        },
        {
            "id": "get-all-real-word-questions",
            "name": "Get All Real Word Questions",
            "method": "GET",
            "url": "/real-word/",
            "description": "Get all stored real word questions with quiz info.",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved all real word questions",
                    "example": {
                        "success": true,
                        "data": [
                            {
                                "id": 1,
                                "quiz_id": 1,
                                "words": [
                                    "variable",
                                    "array",
                                    "funclet"
                                ],
                                "correct_answers": [
                                    "yes",
                                    "yes",
                                    "no"
                                ],
                                "created_by": 1,
                                "updated_by": 1,
                                "created_at": "2025-05-09T05:26:20.000Z",
                                "updated_at": "2025-05-09T05:50:14.000Z",
                                "quiz_title": "JS Basics Quiz"
                            },
                            {
                                "id": 6,
                                "quiz_id": 1,
                                "words": [
                                    "banana",
                                    "fokezu"
                                ],
                                "correct_answers": [
                                    "yes",
                                    "no"
                                ],
                                "created_by": 1,
                                "updated_by": 1,
                                "created_at": "2025-05-09T06:00:35.000Z",
                                "updated_at": "2025-05-09T06:00:35.000Z",
                                "quiz_title": "JS Basics Quiz"
                            },
                            {
                                "id": 2,
                                "quiz_id": 2,
                                "words": [
                                    "function",
                                    "scope",
                                    "promist",
                                    "closure",
                                    "await"
                                ],
                                "correct_answers": [
                                    "yes",
                                    "yes",
                                    "no",
                                    "yes",
                                    "yes"
                                ],
                                "created_by": 1,
                                "updated_by": 1,
                                "created_at": "2025-05-09T05:26:20.000Z",
                                "updated_at": "2025-05-09T05:26:20.000Z",
                                "quiz_title": "Functions & Scope Quiz"
                            },
                            {
                                "id": 3,
                                "quiz_id": 3,
                                "words": [
                                    "bone",
                                    "organ",
                                    "skeltom",
                                    "artery",
                                    "celll"
                                ],
                                "correct_answers": [
                                    "yes",
                                    "yes",
                                    "no",
                                    "yes",
                                    "no"
                                ],
                                "created_by": 1,
                                "updated_by": 1,
                                "created_at": "2025-05-09T05:26:20.000Z",
                                "updated_at": "2025-05-09T05:26:20.000Z",
                                "quiz_title": "Human Skeleton Quiz"
                            },
                            {
                                "id": 4,
                                "quiz_id": 4,
                                "words": [
                                    "heart",
                                    "lung",
                                    "neuron",
                                    "respirote",
                                    "digestive"
                                ],
                                "correct_answers": [
                                    "yes",
                                    "yes",
                                    "yes",
                                    "no",
                                    "yes"
                                ],
                                "created_by": 1,
                                "updated_by": 1,
                                "created_at": "2025-05-09T05:26:20.000Z",
                                "updated_at": "2025-05-09T05:26:20.000Z",
                                "quiz_title": "Circulatory & Respiratory Quiz"
                            }
                        ]
                    }
                }
            ]
        },
        {
            "id": "get-real-word-question-by-quiz-id",
            "name": "Get Real Word Question By Quiz ID",
            "method": "GET",
            "url": "/real-word/quiz/:quiz_id",
            "description": "Get real word questions by quiz ID.",
            "parameters": [
                {
                    "name": "quiz_id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the quiz to retrieve questions for",
                    "example": "1"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved real word questions by quiz ID",
                    "example": [
                        {
                            "id": 1,
                            "quiz_id": 1,
                            "words": [
                                "variable",
                                "array",
                                "funclet"
                            ],
                            "correct_answers": [
                                "yes",
                                "yes",
                                "no"
                            ],
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T05:26:20.000Z",
                            "updated_at": "2025-05-09T05:50:14.000Z"
                        },
                        {
                            "id": 6,
                            "quiz_id": 1,
                            "words": [
                                "banana",
                                "fokezu"
                            ],
                            "correct_answers": [
                                "yes",
                                "no"
                            ],
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T06:00:35.000Z",
                            "updated_at": "2025-05-09T06:00:35.000Z"
                        }
                    ]
                }
            ]
        },
        {
            "id": "delete-word-from-real-word-question",
            "name": "Delete Word From Real Word Question",
            "method": "DELETE",
            "url": "/real-word/delete-word/:id",
            "description": "Delete a word from real word questions.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the word to delete",
                    "example": "1"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Word removed successfully",
                    "example": {
                        "message": "Word removed successfully"
                    }
                }
            ]
        }
    ]
};

export default realWordData;
