const cheatsheetData = {
    id: 'cheatsheet-management',
    name: 'CheetSheet Management',
    description: 'The CheetSheet API provides endpoints to manage cheat sheets in the system. These endpoints allow you to create, read, update, delete, and manage the status of cheat sheets.',
    endpoints: [
        {
            id: 'get-all-cheatsheets',
            name: 'Get All CheatSheets',
            method: 'GET',
            url: '/cheat-sheets/',
            description: 'Get a list of all cheat sheets in the system.',
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved all cheat sheets',
                    example: [
                        {
                            "id": 1,
                            "title": "google",
                            "imageUrl": "/cheat-sheet/image/imageUrl-1747047237271-322425890.jpg",
                            "description": "sdfgh",
                            "isPaid": 1,
                            "price": null,
                            "discount": null,
                            "isActive": 1,
                            "createdBy": 1,
                            "created_by_type": "admin",
                            "updatedBy": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-12T10:53:57.000Z",
                            "updated_at": "2025-05-12T10:53:57.000Z"
                        }
                    ]
                }
            ]
        },
        {
            id: 'get-cheatsheet-by-id',
            name: 'Get CheatSheet By ID',
            method: 'GET',
            url: '/cheat-sheets/{id}',
            description: 'Get a specific cheat sheet by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the cheat sheet to retrieve',
                    example: '1'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved the cheat sheet',
                    example: {
                        "id": 1,
                        "title": "google",
                        "imageUrl": "/cheat-sheet/image/imageUrl-1747047237271-322425890.jpg",
                        "description": "sdfgh",
                        "isPaid": 1,
                        "price": null,
                        "discount": null,
                        "isActive": 1,
                        "createdBy": 1,
                        "created_by_type": "admin",
                        "updatedBy": 1,
                        "updated_by_type": "admin",
                        "created_at": "2025-05-12T10:53:57.000Z",
                        "updated_at": "2025-05-12T10:53:57.000Z"
                    }
                },
                {
                    status: 404,
                    description: 'Cheat sheet not found',
                    example: {
                        "success": false,
                        "message": "Cheat sheet not found"
                    }
                }
            ]
        },
        {
            id: 'create-cheatsheet',
            name: 'Create CheatSheet',
            method: 'POST',
            url: '/cheat-sheets/create',
            description: 'Create a new cheat sheet in the system. Note: Use form-data in Postman for image upload.',
            parameters: [
                {
                    name: 'title',
                    type: 'string',
                    required: true,
                    description: 'Title of the cheat sheet',
                    example: 'geminii'
                },
                {
                    name: 'description',
                    type: 'string',
                    required: true,
                    description: 'Description of the cheat sheet',
                    example: "It's demo"
                },
                {
                    name: 'isPaid',
                    type: 'number',
                    required: true,
                    description: 'Whether the cheat sheet is paid (1) or free (0)',
                    example: 0
                },
                {
                    name: 'price',
                    type: 'number',
                    required: false,
                    description: 'Price of the cheat sheet if paid',
                    example: null
                },
                {
                    name: 'discount',
                    type: 'number',
                    required: false,
                    description: 'Discount percentage if applicable',
                    example: null
                },
                {
                    name: 'isActive',
                    type: 'number',
                    required: true,
                    description: 'Whether the cheat sheet is active (1) or inactive (0)',
                    example: 1
                },
                {
                    name: 'createdBy',
                    type: 'number',
                    required: true,
                    description: 'ID of the user creating the cheat sheet',
                    example: 1
                },
                {
                    name: 'updatedBy',
                    type: 'number',
                    required: true,
                    description: 'ID of the user updating the cheat sheet',
                    example: 1
                },
                {
                    name: 'created_by_type',
                    type: 'string',
                    required: true,
                    description: 'Type of user creating (admin/user)',
                    example: 'admin'
                },
                {
                    name: 'updated_by_type',
                    type: 'string',
                    required: true,
                    description: 'Type of user updating (admin/user)',
                    example: 'admin'
                },
                {
                    name: 'imageUrl',
                    type: 'file',
                    required: false,
                    description: 'Image file for the cheat sheet',
                    example: 'path/image1.png'
                }
            ],
            responses: [
                {
                    status: 201,
                    description: 'CheatSheet created successfully',
                    example: {
                        "message": "CheatSheet created successfully"
                    }
                },
                {
                    status: 400,
                    description: 'Validation error',
                    example: {
                        "success": false,
                        "message": "Validation error"
                    }
                }
            ]
        },
        {
            id: 'update-cheatsheet',
            name: 'Update CheatSheet',
            method: 'PUT',
            url: '/cheat-sheets/update/{id}',
            description: 'Update an existing cheat sheet by its ID. Note: Use form-data in Postman for image upload.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the cheat sheet to update',
                    example: '1'
                },
                {
                    name: 'title',
                    type: 'string',
                    required: true,
                    description: 'Updated title of the cheat sheet',
                    example: 'gemini'
                },
                {
                    name: 'description',
                    type: 'string',
                    required: false,
                    description: 'Updated description of the cheat sheet',
                    example: "It's demo update"
                },
                {
                    name: 'isPaid',
                    type: 'number',
                    required: false,
                    description: 'Updated paid status (1/0)',
                    example: 1
                },
                {
                    name: 'price',
                    type: 'number',
                    required: false,
                    description: 'Updated price if paid',
                    example: 120
                },
                {
                    name: 'discount',
                    type: 'number',
                    required: false,
                    description: 'Updated discount percentage',
                    example: 10
                },
                {
                    name: 'isActive',
                    type: 'number',
                    required: false,
                    description: 'Updated active status (1/0)',
                    example: 1
                },
                {
                    name: 'updatedBy',
                    type: 'number',
                    required: true,
                    description: 'ID of the user updating the cheat sheet',
                    example: 1
                },
                {
                    name: 'updated_by_type',
                    type: 'string',
                    required: true,
                    description: 'Type of user updating (admin/user)',
                    example: 'admin'
                },
                {
                    name: 'imageUrl',
                    type: 'file',
                    required: false,
                    description: 'Updated image file for the cheat sheet',
                    example: 'path/image1.png'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'CheatSheet updated successfully',
                    example: {
                        "message": "CheatSheet updated successfully"
                    }
                },
                {
                    status: 404,
                    description: 'Cheat sheet not found',
                    example: {
                        "success": false,
                        "message": "Cheat sheet not found"
                    }
                }
            ]
        },
        {
            id: 'delete-cheatsheet',
            name: 'Delete CheatSheet',
            method: 'DELETE',
            url: '/cheat-sheets/delete/{id}',
            description: 'Delete a cheat sheet by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the cheat sheet to delete',
                    example: '1'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'CheatSheet deleted successfully',
                    example: {
                        "message": "CheatSheet deleted successfully"
                    }
                },
                {
                    status: 404,
                    description: 'Cheat sheet not found',
                    example: {
                        "success": false,
                        "message": "Cheat sheet not found"
                    }
                }
            ]
        },
        {
            id: 'toggle-cheatsheet-status',
            name: 'Toggle CheatSheet Status',
            method: 'PATCH',
            url: '/cheat-sheets/{cheatSheetId}/status',
            description: 'Toggle the status (active/inactive) of a cheat sheet.',
            parameters: [
                {
                    name: 'cheatSheetId',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the cheat sheet to update status',
                    example: '1'
                },
                {
                    name: 'status',
                    type: 'boolean',
                    required: true,
                    description: 'New status for the cheat sheet (true/false)',
                    example: false
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'CheatSheet status updated successfully',
                    example: {
                        "message": "CheatSheet deactivated successfully"
                    }
                },
                {
                    status: 400,
                    description: 'Invalid status value',
                    example: {
                        "success": false,
                        "message": "Status must be either true or false"
                    }
                },
                {
                    status: 404,
                    description: 'Cheat sheet not found',
                    example: {
                        "success": false,
                        "message": "Cheat sheet not found"
                    }
                }
            ]
        }
    ]
};

export default cheatsheetData;