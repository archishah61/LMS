const userChallengeTaskData = {
    id: 'user-challenge-task',
    name: 'User Challenge Task',
    description: 'The User Challenge Task API provides endpoints to manage user interactions with challenge tasks in the system. These endpoints allow users to start challenge tasks and submit answers for verification.',
    endpoints: [
        {
            id: 'start-user-challenge-task',
            name: 'Start User Challenge Task',
            method: 'POST',
            url: '/challenge/task/user/start',
            description: 'Start a challenge task for a user. Takes user challenge phase id and challenge task id to start the task.',
            parameters: [
                {
                    name: 'user_challenge_phase_id',
                    type: 'number',
                    required: true,
                    description: 'ID of the user challenge phase',
                    example: 1
                },
                {
                    name: 'challenge_task_id',
                    type: 'number',
                    required: true,
                    description: 'ID of the challenge task to start',
                    example: 6
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Task started successfully',
                    example: {
                        "success": 1,
                        "message": "User Challenge Task recorded successfully",
                        "userChallengeTask": {
                            "id": 2,
                            "attempts": 0,
                            "is_active": 1,
                            "created_at": "2025-05-13 09:45:24.000000",
                            "updated_at": "2025-05-13 10:22:49.000000",
                            "completed_at": null,
                            "is_completed": 0,
                            "ChallengeTask": {
                                "id": 6,
                                "order": 2,
                                "title": "Common HTML Elements",
                                "is_active": 1,
                                "created_at": "2025-05-13 09:43:38.000000",
                                "time_limit": 15,
                                "updated_at": "2025-05-13 09:43:38.000000",
                                "description": "Learn about frequently used tags",
                                "is_mandatory": 1,
                                "max_attempts": 3,
                                "MCQChallenges": [],
                                "reward_points": 20,
                                "difficulty_level": "Moderate",
                                "challenge_phase_id": 3,
                                "TrueFalseChallenges": [
                                    {
                                        "id": 26,
                                        "question": "<div> is an inline element."
                                    },
                                    {
                                        "id": 27,
                                        "question": "<span> is a block-level element."
                                    },
                                    {
                                        "id": 28,
                                        "question": "<img> is a self-closing tag."
                                    },
                                    {
                                        "id": 29,
                                        "question": "<a> tags can only link to external websites."
                                    },
                                    {
                                        "id": 30,
                                        "question": "HTML comments use <!-- --> syntax."
                                    }
                                ],
                                "FillInTheBlanksChallenges": []
                            },
                            "points_earned": 0,
                            "challenge_task_id": 6,
                            "progress_percentage": 0,
                            "user_challenge_phase_id": 1
                        }
                    }
                }
            ]
        },
        {
            id: 'check-user-challenge-task-answers',
            name: 'Check User Challenge Task Answers',
            method: 'POST',
            url: '/challenge/task/user/check',
            description: 'Check the answers submitted by a user for a challenge task. Supports different question types including MCQ, fill-in-the-blank, and true-false questions.',
            parameters: [
                {
                    name: 'user_challenge_task_id',
                    type: 'number',
                    required: true,
                    description: 'ID of the user challenge task',
                    example: 10
                },
                {
                    name: 'answers',
                    type: 'array',
                    required: true,
                    description: 'Array of answers submitted by the user, In the format of question_type(fill-in-the-blank/true-false/mcq) and userAnswer',
                    example: [
                        {
                            "userAnswer": "8",
                            "question_type": "fill-in-the-blank",
                            "question_id": 12
                        },
                        {
                            "userAnswer": "11",
                            "question_type": "fill-in-the-blank",
                            "question_id": 13
                        }
                    ]
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Answers checked successfully',
                    example: {
                        "message": "Answers checked successfully",
                        "totalCorrect": 2,
                        "totalQuestions": 2,
                        "totalRewardPoints": 20,
                        "details": [
                            {
                                "isCorrect": 1,
                                "userAnswer": "8",
                                "question_id": 12,
                                "rewardPoints": 10,
                                "correctAnswer": [
                                    "8"
                                ],
                                "question_type": "fill-in-the-blank"
                            },
                            {
                                "isCorrect": 1,
                                "userAnswer": "11",
                                "question_id": 13,
                                "rewardPoints": 10,
                                "correctAnswer": [
                                    "11"
                                ],
                                "question_type": "fill-in-the-blank"
                            }
                        ],
                        "passed": true
                    }
                }
            ]
        }
    ]
};

export default userChallengeTaskData;