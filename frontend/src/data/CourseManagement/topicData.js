const topicData = {
    id: 'topic',
    name: 'Topic',
    description: 'The Topic API provides endpoints to manage learning topics in the system. These endpoints allow you to retrieve, delete, manage sequence, and toggle status of topics.',
    endpoints: [
        {
            id: 'create-topic',
            name: 'Create Topic',
            method: 'POST',
            url: '/topics/create',
            description: 'Create a new topic with various content types (audio, video, accordion, or slide).',
            parameters: [
                {
                    name: 'module_id',
                    type: 'string',
                    required: true,
                    description: 'The ID of the module this topic belongs to',
                    example: '60097fb94b'
                },
                {
                    name: 'title',
                    type: 'string',
                    required: true,
                    description: 'Title of the topic',
                    example: 'Hello World'
                },
                {
                    name: 'description',
                    type: 'string',
                    required: true,
                    description: 'HTML description of the topic',
                    example: '<p>Hello World</p>'
                },
                {
                    name: 'content_type',
                    type: 'string',
                    required: true,
                    description: 'Type of content (audio, video, accordian, or slide)',
                    example: 'audio'
                },
                {
                    name: 'status',
                    type: 'string',
                    required: true,
                    description: 'Status of the topic (active/inactive)',
                    example: 'active'
                },
                {
                    name: 'created_by',
                    type: 'number',
                    required: true,
                    description: 'ID of the creator',
                    example: 1
                },
                {
                    name: 'updated_by',
                    type: 'number',
                    required: true,
                    description: 'ID of the last updater',
                    example: 1
                },
                {
                    name: 'created_by_type',
                    type: 'string',
                    required: true,
                    description: 'Type of creator (admin/user)',
                    example: 'admin'
                },
                {
                    name: 'updated_by_type',
                    type: 'string',
                    required: true,
                    description: 'Type of last updater (admin/user)',
                    example: 'admin'
                },
                {
                    name: 'generalCompletionType',
                    type: 'string',
                    required: false,
                    description: 'Completion type for general content (audio/timer)',
                    example: 'audio'
                },
                // Audio-specific parameters
                {
                    name: 'audioDuration',
                    type: 'number',
                    required: false,
                    description: 'Duration of audio in minutes (required for audio content)',
                    example: 2
                },
                {
                    name: 'audioUrl',
                    type: 'file',
                    required: false,
                    description: 'Audio file (required for audio content)'
                },
                // Video-specific parameters
                {
                    name: 'videoDuration',
                    type: 'number',
                    required: false,
                    description: 'Duration of video in minutes (required for video content)',
                    example: 9
                },
                {
                    name: 'videoUrl',
                    type: 'file',
                    required: false,
                    description: 'Video file (required for video content)'
                },
                {
                    name: 'video_type',
                    type: 'string',
                    required: false,
                    description: 'Type of video (internal/external)',
                    example: 'internal'
                },
                // Accordion-specific parameters
                {
                    name: 'content',
                    type: 'array',
                    required: false,
                    description: 'Array of accordion sections (required for accordion content)',
                    items: {
                        type: 'object',
                        properties: {
                            title: { type: 'string', example: 'Hello World' },
                            body: { type: 'string', example: '<p>Hello World</p>' },
                            mediaUrl: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        url: { type: 'string' },
                                        fileType: { type: 'string', example: 'audio' }
                                    }
                                }
                            },
                            accordianCompletionType: { type: 'string', example: 'audio' },
                            accordianCompletionTime: { type: 'number', example: 0 },
                            codeLanguage: { type: 'string', example: 'python' },
                            code: { type: 'string', example: 'Hello World' },
                            showVideo: { type: 'boolean', example: true },
                            showAudio: { type: 'boolean', example: true },
                            showFile: { type: 'boolean', example: true }
                        }
                    }
                },
                // Slide-specific parameters
                {
                    name: 'content',
                    type: 'array',
                    required: false,
                    description: 'Array of slides (required for slide content)',
                    items: {
                        type: 'object',
                        properties: {
                            title: { type: 'string', example: 'Hello World' },
                            description: { type: 'string', example: '<p>Hello World</p>' },
                            content_type: { type: 'string', example: 'video' },
                            slideCompletionType: { type: 'string', example: 'timer' },
                            slideCompletionTime: { type: 'string', example: '2' },
                            videoDuration: { type: 'string', example: '1' },
                            audioDuration: { type: 'string', example: '' },
                            accordianSections: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        title: { type: 'string' },
                                        body: { type: 'string' },
                                        mediaUrl: { type: 'array' }
                                    }
                                }
                            },
                            materialType: { type: 'string', example: 'pdf' },
                            videoType: { type: 'string', example: 'internal' },
                            codeLanguage: { type: 'string', example: 'java' },
                            code: { type: 'string', example: 'Hello World' }
                        }
                    }
                },
                // Tags parameters
                {
                    name: 'tags',
                    type: 'array',
                    required: false,
                    description: 'Array of tags associated with the topic',
                    items: {
                        type: 'object',
                        properties: {
                            tagName: { type: 'string', example: '#hello#' },
                            tagFile: { type: 'string', example: 'shared image.jpeg' },
                            tag_type: { type: 'string', example: 'file' },
                            codeLanguage: { type: 'string', example: null }
                        }
                    }
                },
                {
                    name: 'tagFile',
                    type: 'file',
                    required: false,
                    description: 'Tag attachment file'
                }
            ],
            responses: [
                {
                    status: 201,
                    description: 'Topic created successfully',
                    example: {
                        "message": "Topic created successfully",
                        "topic": {
                            "content_type": "audio",
                            "created_at": "2025-05-16T05:34:56.201Z",
                            "created_by": "1",
                            "created_by_type": "admin",
                            "description": "<p>hello World</p>",
                            "id": 20,
                            "module_id": 1,
                            "public_hash": "4669ac25b7",
                            "sequence_no": 6,
                            "status": "active",
                            "title": "Hello World",
                            "updated_at": "2025-05-16T05:34:56.331Z",
                            "updated_by": "1",
                            "updated_by_type": "admin"
                        }
                    }
                },
                {
                    status: 400,
                    description: 'Validation error',
                    examples: [
                        {
                            "success": false,
                            "message": "Validation error: content_type is required"
                        },
                        {
                            "success": false,
                            "message": "Validation error: audioDuration is required for audio content"
                        },
                        {
                            "success": false,
                            "message": "Validation error: videoUrl is required for video content"
                        }
                    ]
                },
                {
                    status: 500,
                    description: 'Internal server error',
                    example: {
                        "success": false,
                        "message": "Error creating topic"
                    }
                }
            ]
        },
        {
            id: 'get-topics-by-module-id',
            name: 'Get Topics By Module ID',
            method: 'GET',
            url: '/topics/module/:module_id',
            description: 'Get all topics belonging to a specific module.',
            parameters: [
                {
                    name: 'module_id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the module to retrieve topics for',
                    example: '3'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Topics fetched successfully',
                    example: {
                        "success": true,
                        "data": [
                            {
                                "id": 11,
                                "public_hash": "4c7688d6a3",
                                "module_id": 3,
                                "title": "Intro Video - Human Anatomy",
                                "description": "Learn the basics of human anatomy via video",
                                "content_type": "video",
                                "sequence_no": 1,
                                "status": "active",
                                "created_by": 1,
                                "created_by_type": "admin",
                                "updated_by": 1,
                                "updated_by_type": "admin",
                                "created_at": "2025-05-13T09:40:25.000Z",
                                "updated_at": "2025-05-13T09:40:25.000Z",
                                "Video": {
                                    "id": 3,
                                    "topic_id": 11,
                                    "url": "/video/session1_module1_topic_video.mp4",
                                    "duration_minutes": 10,
                                    "video_type": "internal",
                                    "created_by": 1,
                                    "created_by_type": "admin",
                                    "updated_by": 1,
                                    "updated_by_type": "admin",
                                    "created_at": "2025-05-13T09:40:25.000Z",
                                    "updated_at": "2025-05-13T09:40:25.000Z"
                                },
                                "Audio": null,
                                "GeneralMaterial": null,
                                "Accordions": [],
                                "MultiSlides": [],
                                "TopicTags": []
                            },
                            {
                                "id": 12,
                                "public_hash": "1dc636ca7c",
                                "module_id": 3,
                                "title": "Getting Started with Anatomy - Audio",
                                "description": "Introduction to human anatomy in audio form",
                                "content_type": "audio",
                                "sequence_no": 2,
                                "status": "active",
                                "created_by": 1,
                                "created_by_type": "admin",
                                "updated_by": 1,
                                "updated_by_type": "admin",
                                "created_at": "2025-05-13T09:40:25.000Z",
                                "updated_at": "2025-05-13T09:40:25.000Z",
                                "Video": null,
                                "Audio": {
                                    "id": 3,
                                    "topic_id": 12,
                                    "url": "/audio/human_anatomy2.mp3",
                                    "duration_minutes": 5,
                                    "created_by": 1,
                                    "created_by_type": "admin",
                                    "updated_by": 1,
                                    "updated_by_type": "admin",
                                    "created_at": "2025-05-13T09:40:25.000Z",
                                    "updated_at": "2025-05-13T09:40:25.000Z"
                                },
                                "GeneralMaterial": null,
                                "Accordions": [],
                                "MultiSlides": [],
                                "TopicTags": []
                            }
                        ]
                    }
                },
                {
                    status: 404,
                    description: 'Module not found or no topics available',
                    example: {
                        "success": false,
                        "message": "No topics found for this module"
                    }
                }
            ]
        },
        {
            id: 'get-topic-by-id',
            name: 'Get Topic By ID',
            method: 'GET',
            url: '/topics/:id',
            description: 'Get a specific topic by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the topic to retrieve',
                    example: '2'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Topic fetched successfully',
                    example: {
                        "success": true,
                        "topic": {
                            "id": 2,
                            "public_hash": "02e1dea0fa",
                            "module_id": 1,
                            "title": "Getting Started with JS - Audio",
                            "description": "Introduction in audio form",
                            "content_type": "audio",
                            "sequence_no": 2,
                            "status": "active",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-13T09:40:24.000Z",
                            "updated_at": "2025-05-13T09:40:24.000Z",
                            "Video": null,
                            "Audio": {
                                "id": 1,
                                "topic_id": 2,
                                "url": "/audio/jsAudioyt.mp3",
                                "duration_minutes": 5,
                                "created_by": 1,
                                "created_by_type": "admin",
                                "updated_by": 1,
                                "updated_by_type": "admin",
                                "created_at": "2025-05-13T09:40:24.000Z",
                                "updated_at": "2025-05-13T09:40:24.000Z"
                            },
                            "GeneralMaterial": null,
                            "Accordions": [],
                            "MultiSlides": [],
                            "TopicTags": []
                        }
                    }
                },
                {
                    status: 404,
                    description: 'Topic not found',
                    example: {
                        "success": false,
                        "message": "Topic not found"
                    }
                }
            ]
        },
        {
            id: 'update-topic-sequence',
            name: 'Update Topic Sequence',
            method: 'PUT',
            url: '/topics/sequence',
            description: 'Update the sequence order of topics.',
            parameters: [
                {
                    name: 'sequence',
                    type: 'array',
                    required: true,
                    description: 'Array of topic IDs in the new desired order',
                    items: {
                        type: 'number'
                    },
                    example: [1, 2, 3]
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Topic sequence updated successfully',
                    example: {
                        "message": "Topics sequence updated successfully"
                    }
                },
                {
                    status: 400,
                    description: 'Validation error',
                    example: {
                        "success": false,
                        "message": "Invalid sequence array provided"
                    }
                }
            ]
        },
        {
            id: 'update-topic-status',
            name: 'Update Topic Status',
            method: 'PATCH',
            url: '/topics/:topicId/status',
            description: 'Update the status of a topic (active/inactive).',
            parameters: [
                {
                    name: 'topicId',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the topic to update',
                    example: '2'
                },
                {
                    name: 'status',
                    type: 'string',
                    required: true,
                    inBody: true,
                    description: 'The new status for the topic',
                    example: "active"
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Topic status updated successfully',
                    example: {
                        "message": "Topic activated successfully",
                        "topic": {
                            "id": 2,
                            "public_hash": "02e1dea0fa",
                            "module_id": 1,
                            "title": "Getting Started with JS - Audio",
                            "description": "Introduction in audio form",
                            "content_type": "audio",
                            "sequence_no": 2,
                            "status": "active",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-13T09:40:24.000Z",
                            "updated_at": "2025-05-14T05:21:42.000Z"
                        }
                    }
                },
                {
                    status: 400,
                    description: 'Invalid status value',
                    example: {
                        "success": false,
                        "message": "Status must be either 'active' or 'inactive'"
                    }
                },
                {
                    status: 404,
                    description: 'Topic not found',
                    example: {
                        "success": false,
                        "message": "Topic not found"
                    }
                }
            ]
        },
        {
            id: 'update-topic',
            name: 'Update Topic',
            method: 'PUT',
            url: '/topics/update/:id',
            description: 'Update an existing topic with various content types (audio, video, accordion, general, or slide).',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the topic to update',
                    example: '17'
                },
                // Common parameters for all content types
                {
                    name: 'title',
                    type: 'string',
                    required: false,
                    description: 'Updated title of the topic',
                    example: 'Intro Video'
                },
                {
                    name: 'description',
                    type: 'string',
                    required: false,
                    description: 'Updated HTML description of the topic',
                    example: '<p>Learn JS basics via video</p>'
                },
                {
                    name: 'content_type',
                    type: 'string',
                    required: false,
                    description: 'Updated type of content (audio, video, accordian, general, or slide)',
                    example: 'video'
                },
                {
                    name: 'status',
                    type: 'string',
                    required: false,
                    description: 'Updated status of the topic (active/inactive)',
                    example: 'active'
                },
                {
                    name: 'updated_by',
                    type: 'number',
                    required: true,
                    description: 'ID of the updater',
                    example: 1
                },
                {
                    name: 'updated_by_type',
                    type: 'string',
                    required: true,
                    description: 'Type of updater (admin/user)',
                    example: 'admin'
                },
                {
                    name: 'generalCompletionType',
                    type: 'string',
                    required: false,
                    description: 'Updated completion type for general content (audio/timer)',
                    example: 'audio'
                },

                // Video-specific parameters
                {
                    name: 'video_type',
                    type: 'string',
                    required: false,
                    description: 'Updated type of video (internal/external)',
                    example: 'internal'
                },
                {
                    name: 'videoDuration',
                    type: 'number',
                    required: false,
                    description: 'Updated duration of video in minutes',
                    example: 10
                },
                {
                    name: 'videoUrl',
                    type: 'file',
                    required: false,
                    description: 'Updated video file (optional - only if changing video)'
                },
                {
                    name: 'content[duration_minutes]',
                    type: 'number',
                    required: false,
                    description: 'Updated video duration in content',
                    example: 10
                },
                {
                    name: 'content[transcript]',
                    type: 'string',
                    required: false,
                    description: 'Updated video transcript text'
                },
                {
                    name: 'content[bullet_points]',
                    type: 'array',
                    required: false,
                    description: 'Updated array of bullet points for video',
                    items: {
                        type: 'string'
                    }
                },

                // Audio-specific parameters
                {
                    name: 'audioDuration',
                    type: 'number',
                    required: false,
                    description: 'Updated duration of audio in minutes',
                    example: 5
                },
                {
                    name: 'audioUrl',
                    type: 'file',
                    required: false,
                    description: 'Updated audio file (optional - only if changing audio)'
                },
                {
                    name: 'content[duration_minutes]',
                    type: 'number',
                    required: false,
                    description: 'Updated audio duration in content',
                    example: 5
                },

                // Accordion-specific parameters
                {
                    name: 'content',
                    type: 'array',
                    required: false,
                    description: 'Updated array of accordion sections',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'number', example: 1 },
                            title: { type: 'string', example: 'Variables' },
                            body: { type: 'string', example: '<p>Variables hold values.</p>' },
                            codeLanguage: { type: 'string', example: 'javascript' },
                            code: { type: 'string', example: 'let x = 5;' },
                            accordianCompletionType: { type: 'string', example: 'audio' },
                            accordianCompletionTime: { type: 'number', example: 0 },
                            accordianAudioUrl: { type: 'string', example: '/audios/accordion/jsAudioyt.mp3' },
                            mediaUrl: {
                                type: 'array',
                                items: {
                                    type: 'object'
                                }
                            }
                        }
                    }
                },

                // General material parameters
                {
                    name: 'materialType',
                    type: 'string',
                    required: false,
                    description: 'Updated type of general material (pdf, html, etc.)',
                    example: 'pdf'
                },
                {
                    name: 'externalLink',
                    type: 'string',
                    required: false,
                    description: 'Updated external link for general material',
                    example: '/general/pdf/js-cheatsheet.pdf'
                },
                {
                    name: 'content[material_type]',
                    type: 'string',
                    required: false,
                    description: 'Updated material type in content',
                    example: 'pdf'
                },
                {
                    name: 'content[description]',
                    type: 'string',
                    required: false,
                    description: 'Updated HTML description for general material',
                    example: '<div class="js-guide">...</div>'
                },
                {
                    name: 'content[code]',
                    type: 'string',
                    required: false,
                    description: 'Updated code snippet for general material'
                },
                {
                    name: 'content[completion_type]',
                    type: 'string',
                    required: false,
                    description: 'Updated completion type for general material',
                    example: 'audio'
                },
                {
                    name: 'content[codeLanguage]',
                    type: 'string',
                    required: false,
                    description: 'Updated code language for general material'
                },

                // Slide-specific parameters
                {
                    name: 'content',
                    type: 'array',
                    required: false,
                    description: 'Updated array of slides',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'number', example: 1 },
                            title: { type: 'string', example: 'JS Variables Slide' },
                            description: { type: 'string', example: '<p>Learn about variables in JS</p>' },
                            content_type: { type: 'string', example: 'video' },
                            videoType: { type: 'string', example: 'internal' },
                            videoUrl: { type: 'string', example: '/multiSlide/video/jsVideoTopicms.mp4' },
                            slideCompletionType: { type: 'string', example: 'timer' },
                            slideCompletionTime: { type: 'number', example: 2 },
                            videoDuration: { type: 'number', example: 5 },
                            audioUrl: { type: 'string' },
                            audioDuration: { type: 'string' },
                            accordianSections: {
                                type: 'array',
                                items: {
                                    type: 'object'
                                }
                            },
                            generalUrl: { type: 'string' },
                            materialType: { type: 'string', example: 'pdf' },
                            externalLink: { type: 'string' },
                            code: { type: 'string' },
                            codeLanguage: { type: 'string' }
                        }
                    }
                },
                {
                    name: 'slideAudioUrl',
                    type: 'array',
                    required: false,
                    description: 'Updated array of slide audio URLs',
                    items: {
                        type: 'string'
                    },
                    example: ['/audios/multi_slide/slideAudioUrl[2].mp3']
                },
                {
                    name: 'slide_general_material_type',
                    type: 'string',
                    required: false,
                    description: 'Updated type of general material for slides',
                    example: 'pdf'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Topic updated successfully',
                    example: {
                        "message": "Topic updated successfully",
                        "topic": {
                            "id": 17,
                            "title": "Intro Video",
                            "description": "<p>Learn JS basics via video</p>",
                            "content_type": "video",
                            "status": "active",
                            "updated_at": "2025-05-16T08:45:22.000Z"
                        }
                    }
                },
                {
                    status: 400,
                    description: 'Validation error',
                    examples: [
                        {
                            "success": false,
                            "message": "Validation error: videoDuration is required for video content"
                        },
                        {
                            "success": false,
                            "message": "Validation error: content array is required for accordion content"
                        }
                    ]
                },
                {
                    status: 404,
                    description: 'Topic not found',
                    example: {
                        "success": false,
                        "message": "Topic not found"
                    }
                },
                {
                    status: 500,
                    description: 'Internal server error',
                    example: {
                        "success": false,
                        "message": "Error updating topic"
                    }
                }
            ]
        },
    ]
};

export default topicData;
