const mcqChallengeData = {
    id: 'mcq-challenge',
    name: 'MCQ Challenge',
    description: 'The MCQ Challenge API provides endpoints to manage mcq challenges in the system. These endpoints allow you to create, read, update, delete, and manage the status of mcq challenges along with their associated questions (Fill in the Blanks, MCQs, True/False).',
    endpoints: [
        {
            id: 'create-mcq-challenge',
            name: 'Create MCQ Challenge',
            method: 'POST',
            url: '/challenge/',
            description: 'Create a new mcq challenge with optional questions (Fill in the Blanks, MCQs).',
            parameters: [
                {
                    name: 'challenge_id',
                    type: 'number',
                    required: false,
                    description: 'Challenge Id For Daily Challenge',
                    example: 1
                },
                {
                    name: 'challenge_task_id',
                    type: 'number',
                    required: false,
                    description: 'Challenge Task Id For Challenge Task',
                    example: 2
                },
                {
                    name: 'question_text',
                    type: 'string',
                    required: true,
                    description: 'MCQ Question Text',
                    example: 'Hello World'
                },
                {
                    name: 'options',
                    type: 'array',
                    required: true,
                    description: 'Array of options for this MCQ',
                    items: {
                        type: 'object',
                        properties: {
                            option: {
                                type: 'string',
                                description: 'The option text',
                                example: 'Paris'
                            },
                            is_correct: {
                                type: 'boolean',
                                description: 'Whether this option is correct',
                                example: true
                            }
                        }
                    },
                    example: [
                        {
                            "option": "London",
                            "is_correct": false
                        },
                        {
                            "option": "Paris",
                            "is_correct": true
                        },
                        {
                            "option": "Berlin",
                            "is_correct": false
                        }
                    ]
                },
            ],
            responses: [
                {
                    status: 201,
                    description: 'MCQ Challenge created successfully',
                    example: {
                        "success": true,
                        "message": "MCQ Challenge with options created successfully."
                    }
                },
                {
                    status: 404,
                    description: 'Daily Challenge Not Found',
                    example: {
                        "success": false,
                        "message": "Daily Challenge Not Found"
                    }
                }
            ]
        },
        {
            id: 'update-mcq-challenge',
            name: 'Update MCQ Challenge',
            method: 'PUT',
            url: '/challenge/mcq/{id}',
            description: 'Update an existing MCQ challenge by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the mcq challenge to update',
                    example: '1'
                },
                {
                    name: 'question_text',
                    type: 'string',
                    required: false,
                    description: 'MCQ Challenge Text',
                    example: 'What is Capital Of India?'
                },
            ],
            responses: [
                {
                    status: 200,
                    description: 'MCQ Challenge updated successfully',
                    example: {
                        "success": true,
                        "message": "MCQ Challenge updated successfully."
                    }
                },
                {
                    status: 404,
                    description: 'MCQ Challenge not found',
                    example: {
                        "success": false,
                        "message": "MCQ Challenge not found"
                    }
                }
            ]
        },
        {
            id: 'delete-mcq-challenge',
            name: 'Delete MCQ Challenge',
            method: 'DELETE',
            url: '/challenge/mcq/{id}',
            description: 'Delete a mcq challenge by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the mcq challenge to delete',
                    example: '1'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'MCQ Challenge deleted successfully',
                    example: {
                        "success": true,
                        "message": "MCQ Challenge deleted successfully."
                    }
                },
                {
                    status: 404,
                    description: 'MCQ Challenge not found',
                    example: {
                        "success": false,
                        "message": "MCQ Challenge not found"
                    }
                }
            ]
        }
    ]
};

export default mcqChallengeData;