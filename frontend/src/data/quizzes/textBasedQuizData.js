const textBasedQuizData = {
    "id": "text-based-quiz",
    "name": "Text Based Quiz",
    "description": "The Text Based Quiz API provides endpoints to manage text-based quiz questions in the system. These endpoints allow you to create, read, update, and delete text-based quiz questions.",
    "endpoints": [
        {
            "id": "get-all-quiz-questions",
            "name": "Get All Quiz Questions",
            "method": "GET",
            "url": "/text-based-quiz-text/all",
            "description": "Get a list of all quiz questions in the system.",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved all quiz questions",
                    "example": {
                        "success": true,
                        "quizTexts": [
                            {
                                "id": 1,
                                "quiz_id": 5,
                                "text": "Google Search (also known simply as Google or Google.com) is a search engine operated by Google. It allows users to search for information on the Web by entering keywords or phrases. Google Search uses algorithms to analyze and rank websites based on their relevance to the search query. It is the most popular search engine worldwide.\r\n\r\nGoogle Search is the most-visited website in the world. As of 2025, Google Search has a 90% share of the global search engine market.[3] Approximately 24.84% of Google's monthly global traffic comes from the United States, 5.51% from India, 4.7% from Brazil, 3.78% from the United Kingdom and 5.28% from Japan according to data provided by Similarweb.[4]\r\n\r\nThe order of search results returned by Google is based, in part, on a priority rank system called \"PageRank\". Google Search also provides many different options for customized searches, using symbols to include, exclude, specify or require certain search behavior, and offers specialized interactive experiences, such as flight status and package tracking, weather forecasts, currency, unit, and time conversions, word definitions, and more.",
                                "created_by": 1,
                                "created_by_type": "admin",
                                "updated_by": 1,
                                "updated_by_type": "admin",
                                "created_at": "2025-05-12T16:01:18.000Z",
                                "updated_at": "2025-05-12T16:01:18.000Z"
                            }
                        ]
                    }
                }
            ]
        },
        {
            "id": "get-quiz-question-by-id",
            "name": "Get Quiz Question by ID",
            "method": "GET",
            "url": "/text-based-quiz-text/:id",
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
                            "quiz_id": 5,
                            "text": "Google Search (also known simply as Google or Google.com) is a search engine operated by Google. It allows users to search for information on the Web by entering keywords or phrases. Google Search uses algorithms to analyze and rank websites based on their relevance to the search query. It is the most popular search engine worldwide.\r\n\r\nGoogle Search is the most-visited website in the world. As of 2025, Google Search has a 90% share of the global search engine market.[3] Approximately 24.84% of Google's monthly global traffic comes from the United States, 5.51% from India, 4.7% from Brazil, 3.78% from the United Kingdom and 5.28% from Japan according to data provided by Similarweb.[4]\r\n\r\nThe order of search results returned by Google is based, in part, on a priority rank system called \"PageRank\". Google Search also provides many different options for customized searches, using symbols to include, exclude, specify or require certain search behavior, and offers specialized interactive experiences, such as flight status and package tracking, weather forecasts, currency, unit, and time conversions, word definitions, and more.",
                            "FillInBlankQuestions": [
                                {
                                    "id": 1,
                                    "text": "Fill in the blank: 84% of Google's _______ global traffic comes from the United States, 5",
                                    "correctAnswer": "monthly"
                                },
                                {
                                    "id": 2,
                                    "text": "Fill in the blank: 78% from the _______ Kingdom and 5",
                                    "correctAnswer": "United"
                                },
                                {
                                    "id": 3,
                                    "text": "Fill in the blank: 28% from Japan according to _______ provided by Similarweb",
                                    "correctAnswer": "data"
                                }
                            ],
                            "MultipleChoiceQuestions": [
                                {
                                    "id": 1,
                                    "text": "What best describes the concept of \"Google\" in the given context?",
                                    "correctAnswer": "Google Search (also known simply as Google or Google",
                                    "options": [
                                        "A concept not mentioned in the provided text.",
                                        "The opposite of what is stated in the text.",
                                        "Google Search (also known simply as Google or Google",
                                        "An unrelated statement to the context."
                                    ]
                                },
                                {
                                    "id": 2,
                                    "text": "What best describes the concept of \"Google\" in the given context?",
                                    "correctAnswer": "com) is a search engine operated by Google",
                                    "options": [
                                        "A concept not mentioned in the provided text.",
                                        "The opposite of what is stated in the text.",
                                        "An unrelated statement to the context.",
                                        "com) is a search engine operated by Google"
                                    ]
                                },
                                {
                                    "id": 3,
                                    "text": "What best describes the concept of \"entering\" in the given context?",
                                    "correctAnswer": " It allows users to search for information on the Web by entering keywords or phrases",
                                    "options": [
                                        " It allows users to search for information on the Web by entering keywords or phrases",
                                        "An unrelated statement to the context.",
                                        "A concept not mentioned in the provided text.",
                                        "The opposite of what is stated in the text."
                                    ]
                                },
                                {
                                    "id": 4,
                                    "text": "What best describes the concept of \"Google\" in the given context?",
                                    "correctAnswer": " Google Search uses algorithms to analyze and rank websites based on their relevance to the search query",
                                    "options": [
                                        "A concept not mentioned in the provided text.",
                                        "The opposite of what is stated in the text.",
                                        "An unrelated statement to the context.",
                                        " Google Search uses algorithms to analyze and rank websites based on their relevance to the search query"
                                    ]
                                }
                            ],
                            "TrueFalseQuestions": [
                                {
                                    "id": 1,
                                    "text": "True or False:  It is the most popular search engine worldwide",
                                    "correctAnswer": 1
                                },
                                {
                                    "id": 2,
                                    "text": "True or False: \r\n\r\nGoogle Search is not the most-visited website in the world",
                                    "correctAnswer": 0
                                },
                                {
                                    "id": 3,
                                    "text": "True or False:  As of 2025, Google Search has a 90% share of the global search engine market",
                                    "correctAnswer": 1
                                }
                            ]
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
            "url": "/text-based-quiz-text/create",
            "description": "Create a new quiz question in the system.",
            "parameters": [
                {
                    "name": "quiz_id",
                    "type": "number",
                    "required": true,
                    "description": "ID of the quiz",
                    "example": 5
                },
                {
                    "name": "question_text",
                    "type": "string",
                    "required": true,
                    "description": "Text of the quiz question",
                    "example": "As of 2025, Google Search has a 90% share of the global search engine market.[3] Approximately 24.84% of Google's monthly global traffic comes from the United States, 5.51% from India, 4.7% from Brazil, 3.78% from the United Kingdom and 5.28% from Japan according to data provided by Similarweb.[4]"
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
                    "name": "created_by_type",
                    "type": "string",
                    "required": true,
                    "description": "Type of the user creating the question",
                    "example": "admin"
                },
                {
                    "name": "updated_by_type",
                    "type": "string",
                    "required": true,
                    "description": "Type of the user updating the question",
                    "example": "admin"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Quiz question created successfully",
                    "example": {
                        "success": true,
                        "message": "Quiz question created successfully!",
                        "quizQuestion": {
                            "id": 2,
                            "quiz_id": 5,
                            "text": "As of 2025, Google Search has a 90% share of the global search engine market.[3] Approximately 24.84% of Google's monthly global traffic comes from the United States, 5.51% from India, 4.7% from Brazil, 3.78% from the United Kingdom and 5.28% from Japan according to data provided by Similarweb.[4]",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-12T16:31:39.000Z",
                            "updated_at": "2025-05-12T16:31:39.000Z"
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
            "id": "update-quiz-question",
            "name": "Update Quiz Question",
            "method": "PUT",
            "url": "/text-based-quiz-text/update/:id",
            "description": "Update an existing quiz question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the quiz question to update",
                    "example": "1"
                },
                {
                    "name": "quiz_id",
                    "type": "number",
                    "required": false,
                    "description": "ID of the quiz",
                    "example": 5
                },
                {
                    "name": "question_text",
                    "type": "string",
                    "required": false,
                    "description": "Updated text of the quiz question",
                    "example": "The order of search results returned by Google is based, in part, on a priority rank system called PageRank. Google Search also provides many different options for customized searches, using symbols to include, exclude, specify or require certain search behavior, and offers specialized interactive experiences, such as flight status and package tracking, weather forecasts, currency, unit, and time conversions, word definitions, and more."
                },
                {
                    "name": "created_by",
                    "type": "number",
                    "required": false,
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
                    "name": "created_by_type",
                    "type": "string",
                    "required": false,
                    "description": "Type of the user creating the question",
                    "example": "admin"
                },
                {
                    "name": "updated_by_type",
                    "type": "string",
                    "required": true,
                    "description": "Type of the user updating the question",
                    "example": "admin"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Quiz question updated successfully",
                    "example": {
                        "success": true,
                        "message": "Quiz text updated successfully!",
                        "quizQuestion": [
                            {
                                "id": 1,
                                "quiz_id": 5,
                                "text": "The order of search results returned by Google is based, in part, on a priority rank system called PageRank. Google Search also provides many different options for customized searches, using symbols to include, exclude, specify or require certain search behavior, and offers specialized interactive experiences, such as flight status and package tracking, weather forecasts, currency, unit, and time conversions, word definitions, and more.",
                                "created_by": 1,
                                "created_by_type": "admin",
                                "updated_by": 1,
                                "updated_by_type": "admin",
                                "created_at": "2025-05-12T16:01:18.000Z",
                                "updated_at": "2025-05-12T16:33:48.000Z"
                            },
                            {
                                "id": 2,
                                "quiz_id": 5,
                                "text": "The order of search results returned by Google is based, in part, on a priority rank system called PageRank. Google Search also provides many different options for customized searches, using symbols to include, exclude, specify or require certain search behavior, and offers specialized interactive experiences, such as flight status and package tracking, weather forecasts, currency, unit, and time conversions, word definitions, and more.",
                                "created_by": 1,
                                "created_by_type": "admin",
                                "updated_by": 1,
                                "updated_by_type": "admin",
                                "created_at": "2025-05-12T16:31:39.000Z",
                                "updated_at": "2025-05-12T16:33:48.000Z"
                            }
                        ]
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
        },
        {
            "id": "delete-quiz-question",
            "name": "Delete Quiz Question",
            "method": "DELETE",
            "url": "/text-based-quiz-text/delete/:id",
            "description": "Delete a quiz question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the quiz question to delete",
                    "example": "2"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Quiz question deleted successfully",
                    "example": {
                        "success": true,
                        "message": "Quiz text deleted successfully!",
                        "deletedQuizText": {
                            "id": 2,
                            "quiz_id": 5,
                            "text": "The order of search results returned by Google is based, in part, on a priority rank system called PageRank. Google Search also provides many different options for customized searches, using symbols to include, exclude, specify or require certain search behavior, and offers specialized interactive experiences, such as flight status and package tracking, weather forecasts, currency, unit, and time conversions, word definitions, and more.",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-12T16:31:39.000Z",
                            "updated_at": "2025-05-12T16:33:48.000Z"
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

export default textBasedQuizData;
