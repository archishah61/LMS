const cheetsheetMainSectionData = {
    id: 'cheetsheet-main-section',
    name: 'Cheetsheet Main Section',
    description: 'The Cheetsheet Main Section API provides endpoints to manage main sections within cheat sheets. These endpoints allow you to create, read, update, and delete main sections that organize cheat sheet content.',
    endpoints: [
        {
            id: 'get-all-main-sections',
            name: 'Get All Main Sections',
            method: 'GET',
            url: '/cheat-sheets/main-section/',
            description: 'Get a list of all main sections in the system.',
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved all main sections',
                    example: [
                        {
                            "id": 1,
                            "cheatsheetId": 1,
                            "mainTitle": "section1",
                            "createdBy": 1,
                            "created_by_type": "admin",
                            "updatedBy": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-12T10:55:06.000Z",
                            "updated_at": "2025-05-12T10:55:06.000Z"
                        },
                        {
                            "id": 2,
                            "cheatsheetId": 1,
                            "mainTitle": "sdfgtyui",
                            "createdBy": 1,
                            "created_by_type": "admin",
                            "updatedBy": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-12T10:56:21.000Z",
                            "updated_at": "2025-05-12T10:56:21.000Z"
                        }
                    ]
                }
            ]
        },
        {
            id: 'get-main-section-by-id',
            name: 'Get Main Section By ID',
            method: 'GET',
            url: '/cheat-sheets/main-section/{id}',
            description: 'Get a specific main section by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the main section to retrieve',
                    example: '1'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved the main section',
                    example: {
                        "id": 1,
                        "cheatsheetId": 1,
                        "mainTitle": "section1",
                        "createdBy": 1,
                        "created_by_type": "admin",
                        "updatedBy": 1,
                        "updated_by_type": "admin",
                        "created_at": "2025-05-12T10:55:06.000Z",
                        "updated_at": "2025-05-12T10:55:06.000Z"
                    }
                },
                {
                    status: 404,
                    description: 'Main section not found',
                    example: {
                        "success": false,
                        "message": "Main section not found"
                    }
                }
            ]
        },
        {
            id: 'create-main-section',
            name: 'Create Main Section',
            method: 'POST',
            url: '/cheat-sheets/main-section/create',
            description: 'Create a new main section in the system.',
            parameters: [
                {
                    name: 'mainTitle',
                    type: 'string',
                    required: true,
                    description: 'Title of the main section',
                    example: 'main 3'
                },
                {
                    name: 'cheatsheetId',
                    type: 'number',
                    required: true,
                    description: 'ID of the cheat sheet this section belongs to',
                    example: 1
                },
                {
                    name: 'createdBy',
                    type: 'number',
                    required: true,
                    description: 'ID of the admin creating the section',
                    example: 1
                },
                {
                    name: 'updatedBy',
                    type: 'number',
                    required: true,
                    description: 'ID of the admin updating the section',
                    example: 1
                }
            ],
            responses: [
                {
                    status: 201,
                    description: 'Main section created successfully',
                    example: {
                        "id": 3,
                        "cheatsheetId": 1,
                        "mainTitle": "main 3",
                        "createdBy": 1,
                        "created_by_type": "admin",
                        "updatedBy": 1,
                        "updated_by_type": "admin",
                        "created_at": "2025-05-12T14:33:29.000Z",
                        "updated_at": "2025-05-12T14:33:29.000Z"
                    }
                },
                {
                    status: 400,
                    description: 'Validation error',
                    example: {
                        "success": false,
                        "message": "Main title is required"
                    }
                }
            ]
        },
        {
            id: 'update-main-section',
            name: 'Update Main Section',
            method: 'PUT',
            url: '/cheat-sheets/main-section/update/{id}',
            description: 'Update an existing main section by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the main section to update',
                    example: '3'
                },
                {
                    name: 'mainTitle',
                    type: 'string',
                    required: false,
                    description: 'Updated title of the main section',
                    example: 'mainn 3'
                },
                {
                    name: 'updatedBy',
                    type: 'number',
                    required: true,
                    description: 'ID of the user updating the section',
                    example: 1
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Main section updated successfully',
                    example: {
                        "message": "MainSection updated successfully",
                        "data": [
                            {
                                "id": 3,
                                "cheatsheetId": 1,
                                "mainTitle": "mainn 3",
                                "createdBy": 1,
                                "created_by_type": "admin",
                                "updatedBy": 1,
                                "updated_by_type": "admin",
                                "created_at": "2025-05-12T14:33:29.000Z",
                                "updated_at": "2025-05-12T14:33:29.000Z"
                            }
                        ]
                    }
                },
                {
                    status: 404,
                    description: 'Main section not found',
                    example: {
                        "success": false,
                        "message": "Main section not found"
                    }
                }
            ]
        },
        {
            id: 'delete-main-section',
            name: 'Delete Main Section',
            method: 'DELETE',
            url: '/cheat-sheets/main-section/delete/{id}',
            description: 'Delete a main section by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the main section to delete',
                    example: '1'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Main section deleted successfully',
                    example: {
                        "message": "MainSection deleted"
                    }
                },
                {
                    status: 404,
                    description: 'Main section not found',
                    example: {
                        "success": false,
                        "message": "Main section not found"
                    }
                }
            ]
        }
    ]
};

export default cheetsheetMainSectionData;