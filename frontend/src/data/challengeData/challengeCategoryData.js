const challengeCategoryData = {
    id: 'challenge-category',
    name: 'Challenge Category',
    description: 'The Challenge Category API provides endpoints to manage challenge categories in the system. These endpoints allow you to create, read, update, delete, and manage the status of challenge categories.',
    endpoints: [
        {
            id: 'get-all-challenge-categories',
            name: 'Get All Challenge Categories',
            method: 'GET',
            url: '/challenge/category/',
            description: 'Get a list of all challenge categories in the system.',
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved all challenge categories',
                    example: [
                        {
                            "id": 1,
                            "category": "Maths",
                            "is_active": 1,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-12T08:33:34.000Z",
                            "updated_at": "2025-05-12T08:33:34.000Z"
                        },
                        {
                            "id": 2,
                            "category": "Science",
                            "is_active": 1,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-12T08:33:34.000Z",
                            "updated_at": "2025-05-12T08:33:34.000Z"
                        },
                        {
                            "id": 3,
                            "category": "History",
                            "is_active": 1,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-12T08:33:34.000Z",
                            "updated_at": "2025-05-12T08:33:34.000Z"
                        },
                        {
                            "id": 4,
                            "category": "Coding",
                            "is_active": 1,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-12T08:33:34.000Z",
                            "updated_at": "2025-05-12T08:33:34.000Z"
                        },
                        {
                            "id": 5,
                            "category": "English",
                            "is_active": 1,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-12T08:33:34.000Z",
                            "updated_at": "2025-05-12T08:33:34.000Z"
                        },
                        {
                            "id": 6,
                            "category": "Other",
                            "is_active": 1,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-12T08:33:34.000Z",
                            "updated_at": "2025-05-12T08:33:34.000Z"
                        },
                        {
                            "id": 7,
                            "category": "programming",
                            "is_active": 1,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-12T08:35:03.000Z",
                            "updated_at": "2025-05-12T08:35:03.000Z"
                        },
                        {
                            "id": 9,
                            "category": "Agriculture",
                            "is_active": 1,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-12T08:38:06.000Z",
                            "updated_at": "2025-05-12T08:38:06.000Z"
                        }
                    ]
                }
            ]
        },
        {
            id: 'get-challenge-category-by-id',
            name: 'Get Challenge Category By ID',
            method: 'GET',
            url: '/challenge/category/{id}',
            description: 'Get a specific challenge category by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge category to retrieve',
                    example: '2'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved the challenge category',
                    example: {
                        "id": 9,
                        "category": "Agriculture",
                        "is_active": 1,
                        "created_by": 1,
                        "updated_by": 1,
                        "created_at": "2025-05-12T08:38:06.000Z",
                        "updated_at": "2025-05-12T08:38:06.000Z"
                    }
                },
                {
                    status: 404,
                    description: 'Challenge category not found',
                    example: {
                        "success": false,
                        "message": "Challenge category not found"
                    }
                }
            ]
        },
        {
            id: 'create-challenge-category',
            name: 'Create Challenge Category',
            method: 'POST',
            url: '/challenge/category/',
            description: 'Create a new challenge category in the system.',
            parameters: [
                {
                    name: 'category',
                    type: 'string',
                    required: true,
                    description: 'Name of the challenge category',
                    example: 'Agriculture'
                },
                {
                    name: 'created_by',
                    type: 'number',
                    required: true,
                    description: 'ID of the user creating the category',
                    example: 1
                }
            ],
            responses: [
                {
                    status: 201,
                    description: 'Category created successfully',
                    example: {
                        "success": true,
                        "message": "Category created successfully"
                    }
                },
                {
                    status: 400,
                    description: 'Validation error',
                    example: {
                        "success": false,
                        "message": "Category name is required"
                    }
                }
            ]
        },
        {
            id: 'update-challenge-category',
            name: 'Update Challenge Category',
            method: 'PUT',
            url: '/challenge/category/{id}',
            description: 'Update an existing challenge category by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge category to update',
                    example: '1'
                },
                {
                    name: 'category',
                    type: 'string',
                    required: false,
                    description: 'Updated name of the challenge category',
                    example: 'Full Stack Development'
                },
                {
                    name: 'updated_by',
                    type: 'number',
                    required: true,
                    description: 'ID of the user updating the category',
                    example: 1
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Category updated successfully',
                    example: {
                        "success": true,
                        "message": "Category updated successfully"
                    }
                },
                {
                    status: 404,
                    description: 'Challenge category not found',
                    example: {
                        "success": false,
                        "message": "Challenge category not found"
                    }
                }
            ]
        },
        {
            id: 'delete-challenge-category',
            name: 'Delete Challenge Category',
            method: 'DELETE',
            url: '/challenge/category/{id}',
            description: 'Delete a challenge category by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge category to delete',
                    example: '2'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Category deleted successfully',
                    example: {
                        "message": "Category deleted successfully"
                    }
                },
                {
                    status: 404,
                    description: 'Challenge category not found',
                    example: {
                        "success": false,
                        "message": "Challenge category not found"
                    }
                }
            ]
        },
        {
            id: 'toggle-challenge-category-status',
            name: 'Toggle Challenge Category Status',
            method: 'PATCH',
            url: '/challenge/category/{id}',
            description: 'Toggle the status (active/inactive) of a challenge category.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the challenge category to update status',
                    example: '4'
                },
            ],
            responses: [
                {
                    status: 200,
                    description: 'Category status updated successfully',
                    example: {
                        "message": "Category status updated successfully"
                    }
                },
                {
                    status: 404,
                    description: 'Challenge category not found',
                    example: {
                        "success": false,
                        "message": "Challenge category not found"
                    }
                }
            ]
        }
    ]
};

export default challengeCategoryData;