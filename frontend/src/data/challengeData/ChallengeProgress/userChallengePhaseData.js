const userChallengePhaseData = {
    id: 'user-challenge-phase',
    name: 'User Challenge Phase',
    description: 'The User Challenge Phase API provides endpoints to manage user challenge phases in the system. These endpoints allow users to start challenge phases and track their progress through challenge tasks.',
    endpoints: [
        {
            id: 'start-user-challenge-phase',
            name: 'Start User Challenge Phase',
            method: 'POST',
            url: '/challenge/phase/user/start',
            description: 'Start a challenge phase for a user by providing user challenge ID and challenge phase ID.',
            parameters: [
                {
                    name: 'user_challenge_id',
                    type: 'number',
                    required: true,
                    description: 'The ID of the user challenge',
                    example: 4
                },
                {
                    name: 'challenge_phase_id',
                    type: 'number',
                    required: true,
                    description: 'The ID of the challenge phase to start',
                    example: 1
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'User Challenge Phase started successfully',
                    example: {
                        "success": true,
                        "message": "User Challenge Phase started successfully.",
                        "userChallengePhase": {
                            "id": 10,
                            "user_challenge_id": 4,
                            "challenge_phase_id": 1,
                            "completed_tasks": 0,
                            "is_completed": false,
                            "points_earned": 0,
                            "completed_at": null,
                            "is_lock": false,
                            "started_at": "2025-05-13T10:13:26.000Z",
                            "progress_percentage": 0,
                            "is_active": true,
                            "created_at": "2025-05-13T09:59:49.000Z",
                            "updated_at": "2025-05-13T09:59:49.000Z",
                            "ChallengePhase": {
                                "id": 1,
                                "challenge_id": 1,
                                "phase_number": 1,
                                "title": "Basic Concepts",
                                "description": "Learn JavaScript fundamentals",
                                "tasks_count": 2,
                                "bonus_reward": null,
                                "phase_type": "Moderate",
                                "is_active": true,
                                "created_at": "2025-05-13T09:43:38.000Z",
                                "updated_at": "2025-05-13T09:43:38.000Z"
                            },
                            "UserChallengeTasks": [
                                {
                                    "id": 18,
                                    "user_challenge_phase_id": 10,
                                    "challenge_task_id": 1,
                                    "is_completed": false,
                                    "attempts": 0,
                                    "points_earned": 0,
                                    "completed_at": null,
                                    "progress_percentage": 0,
                                    "is_active": true,
                                    "created_at": "2025-05-13T09:59:49.000Z",
                                    "updated_at": "2025-05-13T09:59:49.000Z",
                                    "ChallengeTask": {
                                        "id": 1,
                                        "challenge_phase_id": 1,
                                        "title": "Variables and Data Types",
                                        "description": "Understand JavaScript variables",
                                        "difficulty_level": "Easy",
                                        "order": 1,
                                        "is_mandatory": true,
                                        "max_attempts": 3,
                                        "reward_points": 10,
                                        "time_limit": 15,
                                        "is_active": true,
                                        "created_at": "2025-05-13T09:43:38.000Z",
                                        "updated_at": "2025-05-13T09:43:38.000Z"
                                    }
                                },
                                {
                                    "id": 19,
                                    "user_challenge_phase_id": 10,
                                    "challenge_task_id": 2,
                                    "is_completed": false,
                                    "attempts": 0,
                                    "points_earned": 0,
                                    "completed_at": null,
                                    "progress_percentage": 0,
                                    "is_active": true,
                                    "created_at": "2025-05-13T09:59:49.000Z",
                                    "updated_at": "2025-05-13T09:59:49.000Z",
                                    "ChallengeTask": {
                                        "id": 2,
                                        "challenge_phase_id": 1,
                                        "title": "Operators and Expressions",
                                        "description": "Work with JavaScript operators",
                                        "difficulty_level": "Moderate",
                                        "order": 2,
                                        "is_mandatory": true,
                                        "max_attempts": 3,
                                        "reward_points": 20,
                                        "time_limit": 15,
                                        "is_active": true,
                                        "created_at": "2025-05-13T09:43:38.000Z",
                                        "updated_at": "2025-05-13T09:43:38.000Z"
                                    }
                                }
                            ]
                        }
                    }
                },
                {
                    status: 400,
                    description: 'Validation error',
                    example: {
                        "success": false,
                        "message": "Both user_challenge_id and challenge_phase_id are required"
                    }
                },
                {
                    status: 404,
                    description: 'User challenge or phase not found',
                    example: {
                        "success": false,
                        "message": "User challenge or phase not found"
                    }
                }
            ]
        }
    ]
};

export default userChallengePhaseData;