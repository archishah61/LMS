const cityData = {
    id: 'city',
    name: 'City',
    description: 'The City API provides endpoints to manage cities in the system. These endpoints allow you to create, read, update, delete, and manage the status of cities with their associated data like state, code, and timezone.',
    endpoints: [
        {
            id: 'get-all-cities',
            name: 'Get All Cities',
            method: 'GET',
            url: '/cities/all',
            description: 'Get a list of all cities in the system with their complete data including state information.',
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved all cities',
                    example: {
                        "success": true,
                        "data": [
                            {
                                "id": 1,
                                "name": "City1",
                                "code": "C1",
                                "state_id": 1,
                                "timezone": "Asia/Kolkata",
                                "is_active": 1,
                                "created_at": "2025-05-09T09:57:56.000Z",
                                "updated_at": "2025-05-09T09:57:56.000Z",
                                "state_name": "State1",
                                "state_code": "S1"
                            },
                            {
                                "id": 10,
                                "name": "City10",
                                "code": "C10",
                                "state_id": 10,
                                "timezone": "Asia/Kolkata",
                                "is_active": 1,
                                "created_at": "2025-05-09T09:57:57.000Z",
                                "updated_at": "2025-05-09T09:57:57.000Z",
                                "state_name": "State10",
                                "state_code": "S10"
                            },
                            {
                                "id": 11,
                                "name": "City11",
                                "code": "C11",
                                "state_id": 11,
                                "timezone": "Asia/Kolkata",
                                "is_active": 1,
                                "created_at": "2025-05-09T09:57:57.000Z",
                                "updated_at": "2025-05-09T09:57:57.000Z",
                                "state_name": "State11",
                                "state_code": "S11"
                            },
                            {
                                "id": 12,
                                "name": "City12",
                                "code": "C12",
                                "state_id": 12,
                                "timezone": "Asia/Kolkata",
                                "is_active": 1,
                                "created_at": "2025-05-09T09:57:57.000Z",
                                "updated_at": "2025-05-09T09:57:57.000Z",
                                "state_name": "State12",
                                "state_code": "S12"
                            },
                            {
                                "id": 13,
                                "name": "City13",
                                "code": "C13",
                                "state_id": 13,
                                "timezone": "Asia/Kolkata",
                                "is_active": 1,
                                "created_at": "2025-05-09T09:57:57.000Z",
                                "updated_at": "2025-05-09T09:57:57.000Z",
                                "state_name": "State13",
                                "state_code": "S13"
                            },
                            {
                                "id": 14,
                                "name": "City14",
                                "code": "C14",
                                "state_id": 14,
                                "timezone": "Asia/Kolkata",
                                "is_active": 1,
                                "created_at": "2025-05-09T09:57:57.000Z",
                                "updated_at": "2025-05-09T09:57:57.000Z",
                                "state_name": "State14",
                                "state_code": "S14"
                            },
                            {
                                "id": 15,
                                "name": "City15",
                                "code": "C15",
                                "state_id": 15,
                                "timezone": "Asia/Kolkata",
                                "is_active": 1,
                                "created_at": "2025-05-09T09:57:57.000Z",
                                "updated_at": "2025-05-09T09:57:57.000Z",
                                "state_name": "State15",
                                "state_code": "S15"
                            },
                            {
                                "id": 16,
                                "name": "City16",
                                "code": "C16",
                                "state_id": 16,
                                "timezone": "Asia/Kolkata",
                                "is_active": 1,
                                "created_at": "2025-05-09T09:57:57.000Z",
                                "updated_at": "2025-05-09T09:57:57.000Z",
                                "state_name": "State16",
                                "state_code": "S16"
                            },
                            {
                                "id": 17,
                                "name": "City17",
                                "code": "C17",
                                "state_id": 17,
                                "timezone": "Asia/Kolkata",
                                "is_active": 1,
                                "created_at": "2025-05-09T09:57:57.000Z",
                                "updated_at": "2025-05-09T09:57:57.000Z",
                                "state_name": "State17",
                                "state_code": "S17"
                            },
                            {
                                "id": 18,
                                "name": "City18",
                                "code": "C18",
                                "state_id": 18,
                                "timezone": "Asia/Kolkata",
                                "is_active": 1,
                                "created_at": "2025-05-09T09:57:57.000Z",
                                "updated_at": "2025-05-09T09:57:57.000Z",
                                "state_name": "State18",
                                "state_code": "S18"
                            }
                        ]
                    }
                }
            ]
        },
        {
            id: 'get-city-by-id',
            name: 'Get City By ID',
            method: 'GET',
            url: '/cities/{id}',
            description: 'Get a specific city by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the city to retrieve',
                    example: '1'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved the city',
                    example: {
                        "success": true,
                        "data": {
                            "id": 1,
                            "name": "City1",
                            "code": "C1",
                            "state_id": 1,
                            "timezone": "Asia/Kolkata",
                            "is_active": 1,
                            "created_at": "2025-05-12T08:18:36.000Z",
                            "updated_at": "2025-05-12T08:18:36.000Z"
                        }
                    }
                },
                {
                    status: 404,
                    description: 'City not found',
                    example: {
                        "success": false,
                        "message": "City not found"
                    }
                }
            ]
        },
        {
            id: 'create-city',
            name: 'Create City',
            method: 'POST',
            url: '/cities/create',
            description: 'Create a new city in the system.',
            parameters: [
                {
                    name: 'name',
                    type: 'string',
                    required: true,
                    description: 'Name of the city',
                    example: 'Kolkata'
                },
                {
                    name: 'code',
                    type: 'string',
                    required: true,
                    description: 'City code',
                    example: 'A1'
                },
                {
                    name: 'state_id',
                    type: 'number',
                    required: true,
                    description: 'ID of the state this city belongs to',
                    example: 1
                },
                {
                    name: 'timezone',
                    type: 'string',
                    required: true,
                    description: 'Timezone information',
                    example: 'Asia/Kolkata'
                }
            ],
            responses: [
                {
                    status: 201,
                    description: 'City created successfully',
                    example: {
                        "success": true,
                        "message": "City created successfully",
                        "data": {
                            "id": 51,
                            "name": "Kolkata",
                            "code": "A1",
                            "state_id": 1,
                            "timezone": "Asia/Kolkata",
                            "is_active": 1,
                            "created_at": "2025-05-12T08:42:23.000Z",
                            "updated_at": "2025-05-12T08:42:23.000Z"
                        }
                    }
                },
                {
                    status: 400,
                    description: 'Validation error',
                    example: {
                        "success": false,
                        "message": "City name is required"
                    }
                }
            ]
        },
        {
            id: 'update-city',
            name: 'Update City',
            method: 'PUT',
            url: '/cities/update/{id}',
            description: 'Update an existing city by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the city to update',
                    example: '51'
                },
                {
                    name: 'name',
                    type: 'string',
                    required: false,
                    description: 'Updated name of the city',
                    example: 'Kolkataa'
                },
                {
                    name: 'code',
                    type: 'string',
                    required: false,
                    description: 'Updated city code',
                    example: 'A11'
                },
                {
                    name: 'state_id',
                    type: 'number',
                    required: false,
                    description: 'Updated state ID',
                    example: 2
                },
                {
                    name: 'timezone',
                    type: 'string',
                    required: false,
                    description: 'Updated timezone',
                    example: 'Asia/Kolkata'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'City updated successfully',
                    example: {
                        "success": true,
                        "message": "City updated successfully",
                        "data": {
                            "id": 51,
                            "name": "Kolkataa",
                            "code": "A11",
                            "state_id": 2,
                            "timezone": "Asia/Kolkata",
                            "is_active": 1,
                            "created_at": "2025-05-12T08:42:23.000Z",
                            "updated_at": "2025-05-12T08:48:14.000Z"
                        }
                    }
                },
                {
                    status: 404,
                    description: 'City not found',
                    example: {
                        "success": false,
                        "message": "City not found"
                    }
                }
            ]
        },
        {
            id: 'delete-city',
            name: 'Delete City',
            method: 'DELETE',
            url: '/cities/delete/{id}',
            description: 'Delete a city by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the city to delete',
                    example: '51'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'City deleted successfully',
                    example: {
                        "success": true,
                        "message": "City deleted successfully"
                    }
                },
                {
                    status: 404,
                    description: 'City not found',
                    example: {
                        "success": false,
                        "message": "City not found"
                    }
                }
            ]
        },
        {
            id: 'toggle-city-status',
            name: 'Toggle City Status',
            method: 'PATCH',
            url: '/cities/toggle-status/{id}',
            description: 'Toggle the active/inactive status of a city.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the city to update status',
                    example: '1'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'City status toggled successfully',
                    example: {
                        "success": true,
                        "message": "City status toggled successfully"
                    }
                },
                {
                    status: 404,
                    description: 'City not found',
                    example: {
                        "success": false,
                        "message": "City not found"
                    }
                }
            ]
        }
    ]
};

export default cityData;