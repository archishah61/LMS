const quizCompletionData = {
    "id": "quiz-completion",
    "name": "Quiz Completion",
    "description": "The Quiz Completion API provides endpoints to manage quiz completions in the system. These endpoints allow you to create and fetch quiz completions.",
    "endpoints": [
        {
            "id": "get-quiz-responses-by-student-id",
            "name": "Get Quiz Responses By Student ID",
            "method": "GET",
            "url": "/quiz-completions/student/:studentId",
            "description": "Fetch quiz responses by student ID.",
            "parameters": [
                {
                    "name": "studentId",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the student to retrieve quiz responses",
                    "example": "2"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved quiz responses by student ID",
                    "example": [
                        {
                            "id": 1,
                            "userId": 2,
                            "quizId": 1,
                            "score": 92,
                            "isCompleted": true,
                            "status": "Passed",
                            "triedAttempts": 1,
                            "lastAttemptTime": "2025-05-14T08:33:55.000Z",
                            "count": 10,
                            "created_by": 2,
                            "updated_by": 2,
                            "created_at": "2025-05-14T08:33:54.000Z",
                            "updated_at": "2025-05-14T08:33:54.000Z",
                            "QuizResponses": [
                                {
                                    "id": 1,
                                    "quizCompletionId": 1,
                                    "questionId": "1",
                                    "answer": "{\"1\":1}",
                                    "created_at": "2025-05-14T08:33:54.000Z",
                                    "updated_at": "2025-05-14T08:33:54.000Z"
                                },
                                {
                                    "id": 2,
                                    "quizCompletionId": 1,
                                    "questionId": "3",
                                    "answer": "{\"3\":\"let\"}",
                                    "created_at": "2025-05-14T08:33:54.000Z",
                                    "updated_at": "2025-05-14T08:33:54.000Z"
                                },
                                {
                                    "id": 3,
                                    "quizCompletionId": 1,
                                    "questionId": "2",
                                    "answer": "{\"2\":\"const\"}",
                                    "created_at": "2025-05-14T08:33:54.000Z",
                                    "updated_at": "2025-05-14T08:33:54.000Z"
                                },
                                {
                                    "id": 4,
                                    "quizCompletionId": 1,
                                    "questionId": "audio_1",
                                    "answer": "{\"audio_1\":\"hshs\"}",
                                    "created_at": "2025-05-14T08:33:54.000Z",
                                    "updated_at": "2025-05-14T08:33:54.000Z"
                                },
                                {
                                    "id": 5,
                                    "quizCompletionId": 1,
                                    "questionId": "realword_1_0",
                                    "answer": "{\"realword_1_0\":\"yes\"}",
                                    "created_at": "2025-05-14T08:33:54.000Z",
                                    "updated_at": "2025-05-14T08:33:54.000Z"
                                },
                                {
                                    "id": 6,
                                    "quizCompletionId": 1,
                                    "questionId": "realword_1_1",
                                    "answer": "{\"realword_1_1\":\"yes\"}",
                                    "created_at": "2025-05-14T08:33:54.000Z",
                                    "updated_at": "2025-05-14T08:33:54.000Z"
                                },
                                {
                                    "id": 7,
                                    "quizCompletionId": 1,
                                    "questionId": "realword_1_2",
                                    "answer": "{\"realword_1_2\":\"no\"}",
                                    "created_at": "2025-05-14T08:33:54.000Z",
                                    "updated_at": "2025-05-14T08:33:54.000Z"
                                },
                                {
                                    "id": 8,
                                    "quizCompletionId": 1,
                                    "questionId": "realword_1_3",
                                    "answer": "{\"realword_1_3\":\"yes\"}",
                                    "created_at": "2025-05-14T08:33:54.000Z",
                                    "updated_at": "2025-05-14T08:33:54.000Z"
                                },
                                {
                                    "id": 9,
                                    "quizCompletionId": 1,
                                    "questionId": "realword_1_4",
                                    "answer": "{\"realword_1_4\":\"no\"}",
                                    "created_at": "2025-05-14T08:33:54.000Z",
                                    "updated_at": "2025-05-14T08:33:54.000Z"
                                },
                                {
                                    "id": 10,
                                    "quizCompletionId": 1,
                                    "questionId": "idea_1",
                                    "answer": "{\"idea_1\":2}",
                                    "created_at": "2025-05-14T08:33:54.000Z",
                                    "updated_at": "2025-05-14T08:33:54.000Z"
                                },
                                {
                                    "id": 11,
                                    "quizCompletionId": 1,
                                    "questionId": "summary_1",
                                    "answer": "{\"summary_1\":{\"userPassage\":\"Coral reefs are often referred to as the rainforests of the sea because of their incredible biodiversity.These underwater ecosystems are formed by colonies of coral polyps held together by calcium carbonate.Coral reefs provide shelter and food to countless marine species and support the livelihoods of millions of people around the world.Climate change has led to widespread coral bleaching, putting entire reef systems at risk.\",\"student_summary\":\"Generated summary would appear here\",\"grade\":4}}",
                                    "created_at": "2025-05-14T08:33:54.000Z",
                                    "updated_at": "2025-05-14T08:33:54.000Z"
                                },
                                {
                                    "id": 12,
                                    "quizCompletionId": 1,
                                    "questionId": "bestoption_1",
                                    "answer": "{\"bestoption_1_0\":\"versatile\",\"bestoption_1_1\":\"interactive\",\"bestoption_1_2\":\"technology\"}",
                                    "created_at": "2025-05-14T08:33:54.000Z",
                                    "updated_at": "2025-05-14T08:33:54.000Z"
                                }
                            ],
                            "Quiz": {
                                "id": 1,
                                "module_id": 1,
                                "title": "JS Basics Quiz",
                                "duration_minutes": 10,
                                "passing_score": 50,
                                "max_attempts": 3,
                                "attempts_gap": 12,
                                "status": "active",
                                "quizType": "normal",
                                "created_by": 1,
                                "created_by_type": "admin",
                                "updated_by": 1,
                                "updated_by_type": "admin",
                                "created_at": "2025-05-14T08:27:31.000Z",
                                "updated_at": "2025-05-14T08:27:31.000Z",
                                "QuizPreDefinedQuestions": [],
                                "QuizQuestions": [
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
                                        "created_at": "2025-05-14T08:27:31.000Z",
                                        "updated_at": "2025-05-14T08:27:31.000Z",
                                        "QuizOptions": [
                                            {
                                                "id": 1,
                                                "question_id": 1,
                                                "option_text": "let x = 5;",
                                                "option_img": null,
                                                "is_correct": true,
                                                "created_by": 1,
                                                "created_by_type": "admin",
                                                "updated_by": 1,
                                                "updated_by_type": "admin",
                                                "created_at": "2025-05-14T08:27:31.000Z",
                                                "updated_at": "2025-05-14T08:27:31.000Z"
                                            },
                                            {
                                                "id": 2,
                                                "question_id": 1,
                                                "option_text": "int x = 5;",
                                                "option_img": null,
                                                "is_correct": false,
                                                "created_by": 1,
                                                "created_by_type": "admin",
                                                "updated_by": 1,
                                                "updated_by_type": "admin",
                                                "created_at": "2025-05-14T08:27:31.000Z",
                                                "updated_at": "2025-05-14T08:27:31.000Z"
                                            },
                                            {
                                                "id": 3,
                                                "question_id": 1,
                                                "option_text": "x := 5;",
                                                "option_img": null,
                                                "is_correct": false,
                                                "created_by": 1,
                                                "created_by_type": "admin",
                                                "updated_by": 1,
                                                "updated_by_type": "admin",
                                                "created_at": "2025-05-14T08:27:31.000Z",
                                                "updated_at": "2025-05-14T08:27:31.000Z"
                                            },
                                            {
                                                "id": 4,
                                                "question_id": 1,
                                                "option_text": "variable x = 5;",
                                                "option_img": null,
                                                "is_correct": false,
                                                "created_by": 1,
                                                "created_by_type": "admin",
                                                "updated_by": 1,
                                                "updated_by_type": "admin",
                                                "created_at": "2025-05-14T08:27:31.000Z",
                                                "updated_at": "2025-05-14T08:27:31.000Z"
                                            }
                                        ]
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
                                        "created_at": "2025-05-14T08:27:31.000Z",
                                        "updated_at": "2025-05-14T08:27:31.000Z",
                                        "QuizOptions": []
                                    },
                                    {
                                        "id": 3,
                                        "quiz_id": 1,
                                        "question_text": "The keyword used to declare a block-scoped variable is ",
                                        "question_img": null,
                                        "question_type": "complete-sentence",
                                        "marks": 5,
                                        "sequence_no": 3,
                                        "created_by": 1,
                                        "created_by_type": "admin",
                                        "updated_by": 1,
                                        "updated_by_type": "admin",
                                        "created_at": "2025-05-14T08:27:31.000Z",
                                        "updated_at": "2025-05-14T08:27:31.000Z",
                                        "QuizOptions": []
                                    }
                                ]
                            }
                        },
                        {
                            "id": 2,
                            "userId": 2,
                            "quizId": 2,
                            "score": 86,
                            "isCompleted": true,
                            "status": "Passed",
                            "triedAttempts": 1,
                            "lastAttemptTime": "2025-05-14T08:36:09.000Z",
                            "count": 9,
                            "created_by": 2,
                            "updated_by": 2,
                            "created_at": "2025-05-14T08:36:08.000Z",
                            "updated_at": "2025-05-14T08:36:08.000Z",
                            "QuizResponses": [
                                {
                                    "id": 13,
                                    "quizCompletionId": 2,
                                    "questionId": "4",
                                    "answer": "{\"4\":6}",
                                    "created_at": "2025-05-14T08:36:08.000Z",
                                    "updated_at": "2025-05-14T08:36:08.000Z"
                                },
                                {
                                    "id": 14,
                                    "quizCompletionId": 2,
                                    "questionId": "5",
                                    "answer": "{\"5\":9}",
                                    "created_at": "2025-05-14T08:36:08.000Z",
                                    "updated_at": "2025-05-14T08:36:08.000Z"
                                },
                                {
                                    "id": 15,
                                    "quizCompletionId": 2,
                                    "questionId": "6",
                                    "answer": "{\"6\":\"scope\"}",
                                    "created_at": "2025-05-14T08:36:08.000Z",
                                    "updated_at": "2025-05-14T08:36:08.000Z"
                                },
                                {
                                    "id": 16,
                                    "quizCompletionId": 2,
                                    "questionId": "audio_2",
                                    "answer": "{\"audio_2\":\"hufk\"}",
                                    "created_at": "2025-05-14T08:36:08.000Z",
                                    "updated_at": "2025-05-14T08:36:08.000Z"
                                },
                                {
                                    "id": 17,
                                    "quizCompletionId": 2,
                                    "questionId": "realword_2_0",
                                    "answer": "{\"realword_2_0\":\"yes\"}",
                                    "created_at": "2025-05-14T08:36:08.000Z",
                                    "updated_at": "2025-05-14T08:36:08.000Z"
                                },
                                {
                                    "id": 18,
                                    "quizCompletionId": 2,
                                    "questionId": "realword_2_1",
                                    "answer": "{\"realword_2_1\":\"yes\"}",
                                    "created_at": "2025-05-14T08:36:08.000Z",
                                    "updated_at": "2025-05-14T08:36:08.000Z"
                                },
                                {
                                    "id": 19,
                                    "quizCompletionId": 2,
                                    "questionId": "realword_2_2",
                                    "answer": "{\"realword_2_2\":\"no\"}",
                                    "created_at": "2025-05-14T08:36:08.000Z",
                                    "updated_at": "2025-05-14T08:36:08.000Z"
                                },
                                {
                                    "id": 20,
                                    "quizCompletionId": 2,
                                    "questionId": "realword_2_3",
                                    "answer": "{\"realword_2_3\":\"yes\"}",
                                    "created_at": "2025-05-14T08:36:08.000Z",
                                    "updated_at": "2025-05-14T08:36:08.000Z"
                                },
                                {
                                    "id": 21,
                                    "quizCompletionId": 2,
                                    "questionId": "realword_2_4",
                                    "answer": "{\"realword_2_4\":\"yes\"}",
                                    "created_at": "2025-05-14T08:36:08.000Z",
                                    "updated_at": "2025-05-14T08:36:08.000Z"
                                },
                                {
                                    "id": 22,
                                    "quizCompletionId": 2,
                                    "questionId": "idea_2",
                                    "answer": "{\"idea_2\":6}",
                                    "created_at": "2025-05-14T08:36:08.000Z",
                                    "updated_at": "2025-05-14T08:36:08.000Z"
                                },
                                {
                                    "id": 23,
                                    "quizCompletionId": 2,
                                    "questionId": "summary_2",
                                    "answer": "{\"summary_2\":{\"userPassage\":\"Efforts to conserve sea turtles include beach protection programs, artificial hatcheries, and international regulations that reduce bycatch.Sea turtles are ancient reptiles that have existed for over 100 million years.Unfortunately, sea turtle populations are in decline due to habitat loss, climate change, plastic pollution, and accidental capture in fishing gear.\",\"student_summary\":\"Generated summary would appear here\",\"grade\":4}}",
                                    "created_at": "2025-05-14T08:36:08.000Z",
                                    "updated_at": "2025-05-14T08:36:08.000Z"
                                },
                                {
                                    "id": 24,
                                    "quizCompletionId": 2,
                                    "questionId": "bestoption_2",
                                    "answer": "{\"bestoption_2_0\":\"function\",\"bestoption_2_1\":\"assumption\",\"bestoption_2_2\":\"global\",\"bestoption_2_3\":\"concise\"}",
                                    "created_at": "2025-05-14T08:36:08.000Z",
                                    "updated_at": "2025-05-14T08:36:08.000Z"
                                }
                            ],
                            "Quiz": {
                                "id": 2,
                                "module_id": 2,
                                "title": "Functions & Scope Quiz",
                                "duration_minutes": 15,
                                "passing_score": 60,
                                "max_attempts": 2,
                                "attempts_gap": 24,
                                "status": "active",
                                "quizType": "normal",
                                "created_by": 1,
                                "created_by_type": "admin",
                                "updated_by": 1,
                                "updated_by_type": "admin",
                                "created_at": "2025-05-14T08:27:31.000Z",
                                "updated_at": "2025-05-14T08:27:31.000Z",
                                "QuizPreDefinedQuestions": [],
                                "QuizQuestions": [
                                    {
                                        "id": 4,
                                        "quiz_id": 2,
                                        "question_text": "Which of the following is an arrow function?",
                                        "question_img": null,
                                        "question_type": "mcq",
                                        "marks": 5,
                                        "sequence_no": 1,
                                        "created_by": 1,
                                        "created_by_type": "admin",
                                        "updated_by": 1,
                                        "updated_by_type": "admin",
                                        "created_at": "2025-05-14T08:27:31.000Z",
                                        "updated_at": "2025-05-14T08:27:31.000Z",
                                        "QuizOptions": [
                                            {
                                                "id": 5,
                                                "question_id": 4,
                                                "option_text": "function add(a, b) { return a + b; }",
                                                "option_img": null,
                                                "is_correct": false,
                                                "created_by": 1,
                                                "created_by_type": "admin",
                                                "updated_by": 1,
                                                "updated_by_type": "admin",
                                                "created_at": "2025-05-14T08:27:31.000Z",
                                                "updated_at": "2025-05-14T08:27:31.000Z"
                                            },
                                            {
                                                "id": 6,
                                                "question_id": 4,
                                                "option_text": "const add = (a, b) => a + b;",
                                                "option_img": null,
                                                "is_correct": true,
                                                "created_by": 1,
                                                "created_by_type": "admin",
                                                "updated_by": 1,
                                                "updated_by_type": "admin",
                                                "created_at": "2025-05-14T08:27:31.000Z",
                                                "updated_at": "2025-05-14T08:27:31.000Z"
                                            },
                                            {
                                                "id": 7,
                                                "question_id": 4,
                                                "option_text": "add := function(a, b) -> a + b",
                                                "option_img": null,
                                                "is_correct": false,
                                                "created_by": 1,
                                                "created_by_type": "admin",
                                                "updated_by": 1,
                                                "updated_by_type": "admin",
                                                "created_at": "2025-05-14T08:27:31.000Z",
                                                "updated_at": "2025-05-14T08:27:31.000Z"
                                            },
                                            {
                                                "id": 8,
                                                "question_id": 4,
                                                "option_text": "def add(a, b): return a + b",
                                                "option_img": null,
                                                "is_correct": false,
                                                "created_by": 1,
                                                "created_by_type": "admin",
                                                "updated_by": 1,
                                                "updated_by_type": "admin",
                                                "created_at": "2025-05-14T08:27:31.000Z",
                                                "updated_at": "2025-05-14T08:27:31.000Z"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 5,
                                        "quiz_id": 2,
                                        "question_text": "Functions in JavaScript can be stored in variables.",
                                        "question_img": null,
                                        "question_type": "true-false",
                                        "marks": 3,
                                        "sequence_no": 2,
                                        "created_by": 1,
                                        "created_by_type": "admin",
                                        "updated_by": 1,
                                        "updated_by_type": "admin",
                                        "created_at": "2025-05-14T08:27:31.000Z",
                                        "updated_at": "2025-05-14T08:27:31.000Z",
                                        "QuizOptions": [
                                            {
                                                "id": 9,
                                                "question_id": 5,
                                                "option_text": "true",
                                                "option_img": null,
                                                "is_correct": true,
                                                "created_by": 1,
                                                "created_by_type": "admin",
                                                "updated_by": 1,
                                                "updated_by_type": "admin",
                                                "created_at": "2025-05-14T08:27:31.000Z",
                                                "updated_at": "2025-05-14T08:27:31.000Z"
                                            },
                                            {
                                                "id": 10,
                                                "question_id": 5,
                                                "option_text": "false",
                                                "option_img": null,
                                                "is_correct": false,
                                                "created_by": 1,
                                                "created_by_type": "admin",
                                                "updated_by": 1,
                                                "updated_by_type": "admin",
                                                "created_at": "2025-05-14T08:27:31.000Z",
                                                "updated_at": "2025-05-14T08:27:31.000Z"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 6,
                                        "quiz_id": 2,
                                        "question_text": "The term  refers to the accessibility of variables in various parts of your code ",
                                        "question_img": null,
                                        "question_type": "complete-sentence",
                                        "marks": 5,
                                        "sequence_no": 3,
                                        "created_by": 1,
                                        "created_by_type": "admin",
                                        "updated_by": 1,
                                        "updated_by_type": "admin",
                                        "created_at": "2025-05-14T08:27:31.000Z",
                                        "updated_at": "2025-05-14T08:27:31.000Z",
                                        "QuizOptions": []
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        },
        {
            "id": "create-quiz-completion",
            "name": "Create Quiz Completion",
            "method": "POST",
            "url": "/quiz-completions/",
            "description": "Create a new quiz completion in the system.",
            "parameters": [
                {
                    "name": "userId",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user",
                    "example": 2
                },
                {
                    "name": "quizId",
                    "type": "number",
                    "required": true,
                    "description": "ID of the quiz",
                    "example": 2
                },
                {
                    "name": "score",
                    "type": "number",
                    "required": true,
                    "description": "Score obtained in the quiz",
                    "example": 91
                },
                {
                    "name": "isCompleted",
                    "type": "boolean",
                    "required": true,
                    "description": "Whether the quiz is completed",
                    "example": true
                },
                {
                    "name": "status",
                    "type": "string",
                    "required": true,
                    "description": "Status of the quiz completion",
                    "example": "Passed"
                },
                {
                    "name": "triedAttempts",
                    "type": "number",
                    "required": true,
                    "description": "Number of attempts tried",
                    "example": 1
                },
                {
                    "name": "lastAttemptTime",
                    "type": "string",
                    "required": true,
                    "description": "Time of the last attempt",
                    "example": "2025-05-14T09:05:23.000Z"
                },
                {
                    "name": "count",
                    "type": "number",
                    "required": true,
                    "description": "Count of questions in the quiz",
                    "example": 10
                },
                {
                    "name": "created_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user creating the quiz completion",
                    "example": 2
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user updating the quiz completion",
                    "example": 2
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Quiz completion created successfully",
                    "example": {
                        "id": 4,
                        "userId": 2,
                        "quizId": 2,
                        "score": 91,
                        "isCompleted": 1,
                        "status": "Passed",
                        "triedAttempts": 1,
                        "lastAttemptTime": "2025-05-14T09:05:23.000Z",
                        "count": 10,
                        "created_by": 2,
                        "updated_by": 2,
                        "created_at": "2025-05-14T09:05:22.000Z",
                        "updated_at": "2025-05-14T09:05:22.000Z"
                    }
                }
            ]
        }
    ]
};

export default quizCompletionData;
