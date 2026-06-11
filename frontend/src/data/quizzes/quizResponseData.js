const quizResponseData = {
    "id": "quiz-response",
    "name": "Quiz Response",
    "description": "The Quiz Response API provides endpoints to manage quiz responses in the system. These endpoints allow you to create quiz responses.",
    "endpoints": [
        {
            "id": "create-quiz-response",
            "name": "Create Quiz Response",
            "method": "POST",
            "url": "/quiz-responses/",
            "description": "Create new quiz responses in the system.",
            "parameters": [
                {
                    "name": "quizCompletionId",
                    "type": "number",
                    "required": true,
                    "description": "ID of the quiz completion",
                    "example": 1
                },
                {
                    "name": "questionId",
                    "type": "string",
                    "required": true,
                    "description": "ID of the question",
                    "example": "1"
                },
                {
                    "name": "answer",
                    "type": "object",
                    "required": true,
                    "description": "Answer provided for the question",
                    "example": {
                        "selectedOptionId": 3
                    }
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Quiz responses created successfully",
                    "example": [
                        {
                            "id": 49,
                            "quizCompletionId": 1,
                            "questionId": "1",
                            "answer": {
                                "selectedOptionId": 3
                            },
                            "created_at": "2025-05-14T09:19:33.895Z",
                            "updated_at": "2025-05-14T09:19:33.895Z"
                        },
                        {
                            "id": 50,
                            "quizCompletionId": 1,
                            "questionId": "2",
                            "answer": {
                                "selectedOptionId": 2
                            },
                            "created_at": "2025-05-14T09:19:33.895Z",
                            "updated_at": "2025-05-14T09:19:33.895Z"
                        }
                    ]
                }
            ]
        }
    ]
};

export default quizResponseData;
