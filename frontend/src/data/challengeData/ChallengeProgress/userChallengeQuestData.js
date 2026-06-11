const userChallengeQuestData = {
    id: 'user-challenge-quest',
    name: 'User Challenge Quest',
    description: 'The User Challenge Quest API provides endpoints to manage user interactions with challenge quests in the system. These endpoints allow users to view available challenges, enroll in challenges, track progress, and complete challenge phases.',
    endpoints: [
        {
            id: 'get-all-challenges',
            name: 'Get All Challenges',
            method: 'GET',
            url: '/challenge/quest/user/',
            description: 'Get a list of all available challenges in the system.',
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved all challenges',
                    example: {
                        "success": true,
                        "data": [
                            {
                                "id": 1,
                                "title": "JavaScript Fundamentals Challenge",
                                "description": "Master the basics of JavaScript programming",
                                "duration": 14,
                                "difficulty_level": "Beginner",
                                "category_id": 4,
                                "category_name": "Coding",
                                "reward_points": 500,
                                "status": "active",
                                "startDate": "2025-05-13T09:07:30.000Z",
                                "endDate": "2025-05-27T09:07:30.000Z",
                                "max_attempt": 3,
                                "rules": "Complete all phases to earn the full reward",
                                "is_active": 1,
                                "created_at": "2025-05-13T09:07:30.000Z",
                                "updated_at": "2025-05-13T09:07:30.000Z"
                            },
                            {
                                "id": 2,
                                "title": "Web Development Basics",
                                "description": "Learn HTML, CSS and basic web concepts",
                                "duration": 21,
                                "difficulty_level": "Beginner",
                                "category_id": 4,
                                "category_name": "Coding",
                                "reward_points": 750,
                                "status": "active",
                                "startDate": "2025-05-13T09:07:30.000Z",
                                "endDate": "2025-06-03T09:07:30.000Z",
                                "max_attempt": 3,
                                "rules": "Complete all tasks to unlock the next phase",
                                "is_active": 1,
                                "created_at": "2025-05-13T09:07:30.000Z",
                                "updated_at": "2025-05-13T09:07:30.000Z"
                            },
                            {
                                "id": 9,
                                "title": "Python Basics",
                                "description": "Learn simple Python syntax",
                                "duration": 14,
                                "difficulty_level": "Beginner",
                                "category_id": 4,
                                "category_name": "Coding",
                                "reward_points": 500,
                                "status": "active",
                                "startDate": "2025-05-13T09:07:31.000Z",
                                "endDate": "2025-05-27T09:07:31.000Z",
                                "max_attempt": 3,
                                "rules": "No IDE use",
                                "is_active": 1,
                                "created_at": "2025-05-13T09:07:31.000Z",
                                "updated_at": "2025-05-13T09:07:31.000Z"
                            },
                            {
                                "id": 10,
                                "title": "Synonyms & Antonyms",
                                "description": "Match similar and opposite words",
                                "duration": 10,
                                "difficulty_level": "Beginner",
                                "category_id": 5,
                                "category_name": "English",
                                "reward_points": 400,
                                "status": "active",
                                "startDate": "2025-05-13T09:07:31.000Z",
                                "endDate": "2025-05-23T09:07:31.000Z",
                                "max_attempt": 3,
                                "rules": "No thesaurus",
                                "is_active": 1,
                                "created_at": "2025-05-13T09:07:31.000Z",
                                "updated_at": "2025-05-13T09:07:31.000Z"
                            },
                            {
                                "id": 5,
                                "title": "Ancient Civilizations",
                                "description": "Explore the rise and fall of early empires",
                                "duration": 21,
                                "difficulty_level": "Beginner",
                                "category_id": 3,
                                "category_name": "History",
                                "reward_points": 550,
                                "status": "active",
                                "startDate": "2025-05-13T09:07:30.000Z",
                                "endDate": "2025-06-03T09:07:30.000Z",
                                "max_attempt": 3,
                                "rules": "Cite sources for all research tasks",
                                "is_active": 1,
                                "created_at": "2025-05-13T09:07:30.000Z",
                                "updated_at": "2025-05-13T09:07:30.000Z"
                            },
                            {
                                "id": 8,
                                "title": "Ancient Wonders",
                                "description": "Explore the Seven Wonders",
                                "duration": 14,
                                "difficulty_level": "Beginner",
                                "category_id": 3,
                                "category_name": "History",
                                "reward_points": 500,
                                "status": "active",
                                "startDate": "2025-05-13T09:07:31.000Z",
                                "endDate": "2025-05-27T09:07:31.000Z",
                                "max_attempt": 3,
                                "rules": "Cite sources if needed",
                                "is_active": 1,
                                "created_at": "2025-05-13T09:07:31.000Z",
                                "updated_at": "2025-05-13T09:07:31.000Z"
                            },
                            {
                                "id": 3,
                                "title": "Algebra Mastery Challenge",
                                "description": "Develop core algebra skills through practical problems",
                                "duration": 10,
                                "difficulty_level": "Intermediate",
                                "category_id": 1,
                                "category_name": "Maths",
                                "reward_points": 600,
                                "status": "active",
                                "startDate": "2025-05-13T09:07:30.000Z",
                                "endDate": "2025-05-23T09:07:30.000Z",
                                "max_attempt": 2,
                                "rules": "Show your work for full credit on problem-solving tasks",
                                "is_active": 1,
                                "created_at": "2025-05-13T09:07:30.000Z",
                                "updated_at": "2025-05-13T09:07:30.000Z"
                            },
                            {
                                "id": 6,
                                "title": "Basic Arithmetic",
                                "description": "Master addition and subtraction",
                                "duration": 10,
                                "difficulty_level": "Beginner",
                                "category_id": 1,
                                "category_name": "Maths",
                                "reward_points": 400,
                                "status": "active",
                                "startDate": "2025-05-13T09:07:30.000Z",
                                "endDate": "2025-05-23T09:07:30.000Z",
                                "max_attempt": 3,
                                "rules": "Show your work",
                                "is_active": 1,
                                "created_at": "2025-05-13T09:07:30.000Z",
                                "updated_at": "2025-05-13T09:07:30.000Z"
                            },
                            {
                                "id": 11,
                                "title": "Pop Culture",
                                "description": "Test your knowledge of movies and music",
                                "duration": 7,
                                "difficulty_level": "Beginner",
                                "category_id": 6,
                                "category_name": "Other",
                                "reward_points": 350,
                                "status": "active",
                                "startDate": "2025-05-13T09:07:31.000Z",
                                "endDate": "2025-05-20T09:07:31.000Z",
                                "max_attempt": 3,
                                "rules": "No internet searches",
                                "is_active": 1,
                                "created_at": "2025-05-13T09:07:31.000Z",
                                "updated_at": "2025-05-13T09:07:31.000Z"
                            },
                            {
                                "id": 4,
                                "title": "Chemistry Fundamentals",
                                "description": "Explore atomic structure and chemical bonding",
                                "duration": 14,
                                "difficulty_level": "Intermediate",
                                "category_id": 2,
                                "category_name": "Science",
                                "reward_points": 700,
                                "status": "active",
                                "startDate": "2025-05-13T09:07:30.000Z",
                                "endDate": "2025-05-27T09:07:30.000Z",
                                "max_attempt": 3,
                                "rules": "Complete all lab simulations for full credit",
                                "is_active": 1,
                                "created_at": "2025-05-13T09:07:30.000Z",
                                "updated_at": "2025-05-13T09:07:30.000Z"
                            },
                            {
                                "id": 7,
                                "title": "Animal Kingdom",
                                "description": "Learn about mammals and birds",
                                "duration": 14,
                                "difficulty_level": "Beginner",
                                "category_id": 2,
                                "category_name": "Science",
                                "reward_points": 450,
                                "status": "active",
                                "startDate": "2025-05-13T09:07:30.000Z",
                                "endDate": "2025-05-27T09:07:30.000Z",
                                "max_attempt": 3,
                                "rules": "No external resources",
                                "is_active": 1,
                                "created_at": "2025-05-13T09:07:30.000Z",
                                "updated_at": "2025-05-13T09:07:30.000Z"
                            }
                        ]
                    }
                }
            ]
        },
        {
            id: 'get-user-challenges-by-user-id',
            name: 'Get User Challenges By User ID',
            method: 'GET',
            url: '/challenge/quest/user/enrolled',
            description: 'Get all challenges that a user has enrolled in along with their progress status.',
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved user enrolled challenges',
                    example: {
                        "success": 1,
                        "data": [
                            {
                                "id": 1,
                                "status": "pending",
                                "user_id": 1,
                                "attempts": 1,
                                "Challenge": {
                                    "id": 2,
                                    "rules": "Complete all tasks to unlock the next phase",
                                    "title": "Web Development Basics",
                                    "status": "active",
                                    "endDate": "2025-06-03 09:43:38.000000",
                                    "duration": 21,
                                    "is_active": 1,
                                    "startDate": "2025-05-13 09:43:38.000000",
                                    "created_at": "2025-05-13 09:43:38.000000",
                                    "updated_at": "2025-05-13 09:43:38.000000",
                                    "category_id": 4,
                                    "description": "Learn HTML, CSS and basic web concepts",
                                    "max_attempt": 3,
                                    "reward_points": 750,
                                    "difficulty_level": "Beginner"
                                },
                                "assigned_at": "2025-05-13 09:45:24.000000",
                                "challenge_id": 2,
                                "completed_at": null,
                                "is_completed": 0,
                                "points_earned": 0,
                                "UserChallengePhases": [
                                    {
                                        "id": 1,
                                        "is_lock": 0,
                                        "is_active": 1,
                                        "created_at": "2025-05-13 09:45:24.000000",
                                        "started_at": "2025-05-13 09:45:24.000000",
                                        "updated_at": "2025-05-13 09:45:24.000000",
                                        "completed_at": null,
                                        "is_completed": 0,
                                        "points_earned": 0,
                                        "ChallengePhase": {
                                            "id": 3,
                                            "title": "HTML Fundamentals",
                                            "is_active": 1,
                                            "created_at": "2025-05-13 09:43:38.000000",
                                            "phase_type": "Moderate",
                                            "updated_at": "2025-05-13 09:43:38.000000",
                                            "description": "Learn HTML structure and elements",
                                            "tasks_count": 2,
                                            "bonus_reward": null,
                                            "challenge_id": 2,
                                            "phase_number": 1
                                        },
                                        "completed_tasks": 0,
                                        "user_challenge_id": 1,
                                        "challenge_phase_id": 3,
                                        "progress_percentage": 0
                                    },
                                    {
                                        "id": 2,
                                        "is_lock": 1,
                                        "is_active": 1,
                                        "created_at": "2025-05-13 09:45:24.000000",
                                        "started_at": null,
                                        "updated_at": "2025-05-13 09:45:24.000000",
                                        "completed_at": null,
                                        "is_completed": 0,
                                        "points_earned": 0,
                                        "ChallengePhase": {
                                            "id": 4,
                                            "title": "CSS Basics",
                                            "is_active": 1,
                                            "created_at": "2025-05-13 09:43:38.000000",
                                            "phase_type": "Moderate",
                                            "updated_at": "2025-05-13 09:43:38.000000",
                                            "description": "Learn to style web pages with CSS",
                                            "tasks_count": 2,
                                            "bonus_reward": null,
                                            "challenge_id": 2,
                                            "phase_number": 2
                                        },
                                        "completed_tasks": 0,
                                        "user_challenge_id": 1,
                                        "challenge_phase_id": 4,
                                        "progress_percentage": 0
                                    }
                                ],
                                "progress_percentage": 0
                            }
                        ]
                    }
                }
            ]
        },
        {
            id: 'start-user-challenge',
            name: 'Start User Challenge',
            method: 'POST',
            url: '/challenge/quest/user/start',
            description: 'Start or attempt a challenge by a user. Increments the attempt count if the user has already started the challenge.',
            parameters: [
                {
                    name: 'user_id',
                    type: 'number',
                    required: true,
                    description: 'ID of the user starting the challenge',
                    example: 1
                },
                {
                    name: 'challenge_id',
                    type: 'number',
                    required: true,
                    description: 'ID of the challenge to start',
                    example: 10
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Challenge started or attempt incremented successfully',
                    example: {
                        "message": "User Challenge attempts incremented successfully",
                        "userChallenge": {
                            "id": 2,
                            "user_id": 1,
                            "challenge_id": 10,
                            "attempts": 2,
                            "is_completed": true,
                            "completed_at": "2025-05-13T09:46:48.000Z",
                            "points_earned": 20,
                            "status": "completed",
                            "progress_percentage": 100,
                            "assigned_at": "2025-05-13T09:46:30.000Z"
                        },
                        "challenge": {
                            "id": 10,
                            "title": "Synonyms & Antonyms",
                            "description": "Match similar and opposite words",
                            "duration": 10,
                            "difficulty_level": "Beginner",
                            "category_id": 5,
                            "reward_points": 400,
                            "status": "active",
                            "startDate": "2025-05-13T09:43:38.000Z",
                            "endDate": "2025-05-23T09:43:38.000Z",
                            "max_attempt": 3,
                            "rules": "No thesaurus",
                            "is_active": true,
                            "created_at": "2025-05-13T09:43:38.000Z",
                            "updated_at": "2025-05-13T09:43:38.000Z",
                            "ChallengePhases": [
                                {
                                    "id": 19,
                                    "challenge_id": 10,
                                    "phase_number": 1,
                                    
                                    "title": "Synonyms",
                                    "description": "Find words with similar meanings",
                                    "tasks_count": 1,
                                    "bonus_reward": null,
                                    "phase_type": "Moderate",
                                    "is_active": true,
                                    "created_at": "2025-05-13T09:43:38.000Z",
                                    "updated_at": "2025-05-13T09:43:38.000Z"
                                },
                                {
                                    "id": 20,
                                    "challenge_id": 10,
                                    "phase_number": 2,
                                    
                                    "title": "Antonyms",
                                    "description": "Find words with opposite meanings",
                                    "tasks_count": 1,
                                    "bonus_reward": null,
                                    "phase_type": "Moderate",
                                    "is_active": true,
                                    "created_at": "2025-05-13T09:43:38.000Z",
                                    "updated_at": "2025-05-13T09:43:38.000Z"
                                }
                            ]
                        }
                    }
                },
                {
                    status: 400,
                    description: 'Invalid request parameters',
                    example: {
                        "success": false,
                        "message": "User ID and Challenge ID are required"
                    }
                },
                {
                    status: 404,
                    description: 'Challenge or user not found',
                    example: {
                        "success": false,
                        "message": "Challenge not found"
                    }
                }
            ]
        },
        {
            id: 'get-user-challenge-by-id',
            name: 'Get User Challenge By ID',
            method: 'GET',
            url: '/challenge/quest/user/:id',
            description: 'Get detailed information about a specific user challenge by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the user challenge to retrieve',
                    example: '1'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved the user challenge details',
                    example: {
                        "success": true,
                        "data": {
                            "id": 1,
                            "user_id": 1,
                            "challenge_id": 2,
                            "attempts": 1,
                            "is_completed": 0,
                            "completed_at": null,
                            "points_earned": 0,
                            "status": "pending",
                            "progress_percentage": 0,
                            "assigned_at": "2025-05-13T09:45:24.000Z",
                            "challenge_title": "Web Development Basics",
                            "challenge_description": "Learn HTML, CSS and basic web concepts",
                            "difficulty_level": "Beginner",
                            "reward_points": 750,
                            "challenge_created_at": "2025-05-13T09:43:38.000Z",
                            "Challenge": {
                                "id": 2,
                                "title": "Web Development Basics",
                                "description": "Learn HTML, CSS and basic web concepts",
                                "difficulty_level": "Beginner",
                                "reward_points": 750,
                                "created_at": "2025-05-13T09:43:38.000Z"
                            },
                            "UserChallengePhases": [
                                {
                                    "id": 1,
                                    "user_challenge_id": 1,
                                    "challenge_phase_id": 3,
                                    "completed_tasks": 0,
                                    "is_completed": 0,
                                    "points_earned": 0,
                                    "completed_at": null,
                                    "is_lock": 0,
                                    "started_at": "2025-05-13T09:45:24.000Z",
                                    "progress_percentage": 0,
                                    "is_active": 1,
                                    "created_at": "2025-05-13T09:45:24.000Z",
                                    "updated_at": "2025-05-13T09:45:24.000Z",
                                    "phase_title": "HTML Fundamentals",
                                    "phase_description": "Learn HTML structure and elements",
                                    "phase_number": 1,
                                    
                                    "tasks_count": 2,
                                    "phase_type": "Moderate",
                                    "ChallengePhase": {
                                        "id": 3,
                                        "title": "HTML Fundamentals",
                                        "description": "Learn HTML structure and elements",
                                        "phase_number": 1,
                                        
                                        "tasks_count": 2,
                                        "phase_type": "Moderate"
                                    }
                                },
                                {
                                    "id": 2,
                                    "user_challenge_id": 1,
                                    "challenge_phase_id": 4,
                                    "completed_tasks": 0,
                                    "is_completed": 0,
                                    "points_earned": 0,
                                    "completed_at": null,
                                    "is_lock": 1,
                                    "started_at": null,
                                    "progress_percentage": 0,
                                    "is_active": 1,
                                    "created_at": "2025-05-13T09:45:24.000Z",
                                    "updated_at": "2025-05-13T09:45:24.000Z",
                                    "phase_title": "CSS Basics",
                                    "phase_description": "Learn to style web pages with CSS",
                                    "phase_number": 2,
                                    
                                    "tasks_count": 2,
                                    "phase_type": "Moderate",
                                    "ChallengePhase": {
                                        "id": 4,
                                        "title": "CSS Basics",
                                        "description": "Learn to style web pages with CSS",
                                        "phase_number": 2,
                                        
                                        "tasks_count": 2,
                                        "phase_type": "Moderate"
                                    }
                                }
                            ]
                        }
                    }
                },
                {
                    status: 404,
                    description: 'User challenge not found',
                    example: {
                        "success": false,
                        "message": "User challenge not found"
                    }
                }
            ]
        }
    ]
};

export default userChallengeQuestData;