const topicContentData = {
    id: 'topic-content',
    name: 'Topic Content',
    description: 'The Topic Content API provides endpoints to manage content assignments to topics in the system. These endpoints allow you to assign, remove, and retrieve content associated with topics.',
    endpoints: [
        {
            id: 'assign-content-to-topic',
            name: 'Assign Content To Topic',
            method: 'POST',
            url: '/topic-content/assign',
            description: 'Assign content (assignments or quizzes) to a topic.',
            parameters: [
                {
                    name: 'body',
                    type: 'array',
                    required: true,
                    inBody: true,
                    description: 'Array of content assignments to topics',
                    example: [
                        {
                            "module_id": "60097fb94b",
                            "topic_id": 1,
                            "assignment_id": 1,
                            "quiz_id": null,
                            "created_by": 1,
                            "updated_by": 1
                        },
                        {
                            "module_id": "02e1dea0fa",
                            "topic_id": 1,
                            "assignment_id": null,
                            "quiz_id": 1,
                            "created_by": 1,
                            "updated_by": 1
                        }
                    ]
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Content assigned to topics successfully',
                    example: {
                        "success": true,
                        "message": "Content assigned to topics successfully",
                        "data": [
                            {
                                "success": true,
                                "data": [
                                    {
                                        "message": "Content assigned to topic successfully"
                                    }
                                ]
                            },
                            {
                                "success": true,
                                "data": [
                                    {
                                        "message": "Content assigned to topic successfully"
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        },
        {
            id: 'remove-content-from-topic',
            name: 'Remove Content From Topic',
            method: 'DELETE',
            url: '/topic-content/remove/{topic_id}',
            description: 'Remove content (assignment or quiz) from a topic.',
            parameters: [
                {
                    name: 'topic_id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'ID of the topic to remove content from',
                    example: 1
                },
                {
                    name: 'body',
                    type: 'object',
                    required: true,
                    inBody: true,
                    description: 'Content to remove (either assignment_id or quiz_id must be provided)',
                    example: {
                        "assignment_id": 1,
                        "quiz_id": null
                    }
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Content removed from topic successfully',
                    example: {
                        "success": true,
                        "message": "Content removed from topic successfully",
                        "data": {
                            "success": true,
                            "data": [
                                {
                                    "message": "Content removed from topic successfully"
                                }
                            ]
                        }
                    }
                }
            ]
        },
        {
            id: 'get-topic-content-by-topic-id',
            name: 'Get Topic Content By Topic ID',
            method: 'GET',
            url: '/topic-content/topic/{topic_id}',
            description: 'Get all content associated with a specific topic.',
            parameters: [
                {
                    name: 'topic_id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'ID of the topic to retrieve content for',
                    example: 1
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Topic content retrieved successfully',
                    example: {
                        "success": true,
                        "message": "Topic content retrieved successfully",
                        "data": [
                            {
                                "success": true,
                                "data": [
                                    {
                                        "id": 2,
                                        "module_id": 2,
                                        "topic_id": 1,
                                        "assignment_id": null,
                                        "quiz_id": 1,
                                        "created_by": 1,
                                        "updated_by": 1,
                                        "created_at": "2025-05-14T05:10:32.000Z",
                                        "updated_at": "2025-05-14T05:10:32.000Z"
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        },
        {
            id: 'get-topic-content-by-module-id',
            name: 'Get Topic Content By Module ID',
            method: 'GET',
            url: '/topic-content/module/{module_id}',
            description: 'Get all content associated with a specific module.',
            parameters: [
                {
                    name: 'module_id',
                    type: 'string',
                    required: true,
                    inPath: true,
                    description: 'ID of the module to retrieve content for',
                    example: "60097fb94b"
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Topic content retrieved successfully',
                    example: {
                        "success": true,
                        "message": "Topic content retrieved successfully",
                        "data": [
                            {
                                "success": true,
                                "data": [
                                    {
                                        "id": 2,
                                        "module_id": 2,
                                        "topic_id": 1,
                                        "assignment_id": null,
                                        "quiz_id": 1,
                                        "created_by": 1,
                                        "updated_by": 1,
                                        "created_at": "2025-05-14T05:10:32.000Z",
                                        "updated_at": "2025-05-14T05:10:32.000Z"
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        }
    ]
};

export default topicContentData;
