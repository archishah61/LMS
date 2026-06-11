const stateData = {
    id: 'state',
    name: 'State',
    description: 'The State API provides endpoints to manage states in the system. These endpoints allow you to create, read, update, delete, and manage the status of states with their associated data like country, code, and timezone.',
    endpoints: [
        {
            id: 'get-all-states',
            name: 'Get All States',
            method: 'GET',
            url: '/states/all',
            description: 'Get a list of all states in the system with their complete data including country information.',
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved all states',
                    example: {
                        "success": true,
                        "data": [
                            {
                                "id": 51,
                                "name": "California",
                                "code": "CF",
                                "country_id": 1,
                                "timezone": "America/Los_Angeles",
                                "is_active": 1,
                                "created_at": "2025-05-09T10:39:40.000Z",
                                "updated_at": "2025-05-09T10:41:48.000Z",
                                "country_name": "Botswana",
                                "country_code": "BWA"
                            },
                            {
                                "id": 1,
                                "name": "State1",
                                "code": "S1",
                                "country_id": 1,
                                "timezone": "Asia/Kolkata",
                                "is_active": 1,
                                "created_at": "2025-05-09T08:09:14.000Z",
                                "updated_at": "2025-05-09T08:09:14.000Z",
                                "country_name": "Botswana",
                                "country_code": "BWA"
                            },
                            {
                                "id": 10,
                                "name": "State10",
                                "code": "S10",
                                "country_id": 10,
                                "timezone": "Asia/Kolkata",
                                "is_active": 1,
                                "created_at": "2025-05-09T08:09:14.000Z",
                                "updated_at": "2025-05-09T08:09:14.000Z",
                                "country_name": "Bosnia and Herzegovina",
                                "country_code": "BIH"
                            },
                            {
                                "id": 11,
                                "name": "State11",
                                "code": "S11",
                                "country_id": 11,
                                "timezone": "Asia/Kolkata",
                                "is_active": 1,
                                "created_at": "2025-05-09T08:09:14.000Z",
                                "updated_at": "2025-05-09T08:09:14.000Z",
                                "country_name": "Bahrain",
                                "country_code": "BHR"
                            },
                            {
                                "id": 12,
                                "name": "State12",
                                "code": "S12",
                                "country_id": 12,
                                "timezone": "Asia/Kolkata",
                                "is_active": 1,
                                "created_at": "2025-05-09T08:09:14.000Z",
                                "updated_at": "2025-05-09T08:09:14.000Z",
                                "country_name": "Kenya",
                                "country_code": "KEN"
                            },
                            {
                                "id": 13,
                                "name": "State13",
                                "code": "S13",
                                "country_id": 13,
                                "timezone": "Asia/Kolkata",
                                "is_active": 1,
                                "created_at": "2025-05-09T08:09:14.000Z",
                                "updated_at": "2025-05-09T08:09:14.000Z",
                                "country_name": "Estonia",
                                "country_code": "EST"
                            },
                            {
                                "id": 14,
                                "name": "State14",
                                "code": "S14",
                                "country_id": 14,
                                "timezone": "Asia/Kolkata",
                                "is_active": 1,
                                "created_at": "2025-05-09T08:09:14.000Z",
                                "updated_at": "2025-05-09T08:09:14.000Z",
                                "country_name": "Qatar",
                                "country_code": "QAT"
                            },
                            {
                                "id": 15,
                                "name": "State15",
                                "code": "S15",
                                "country_id": 15,
                                "timezone": "Asia/Kolkata",
                                "is_active": 1,
                                "created_at": "2025-05-09T08:09:14.000Z",
                                "updated_at": "2025-05-09T08:09:14.000Z",
                                "country_name": "Poland",
                                "country_code": "POL"
                            },
                            {
                                "id": 16,
                                "name": "State16",
                                "code": "S16",
                                "country_id": 16,
                                "timezone": "Asia/Kolkata",
                                "is_active": 1,
                                "created_at": "2025-05-09T08:09:14.000Z",
                                "updated_at": "2025-05-09T08:09:14.000Z",
                                "country_name": "Moldova",
                                "country_code": "MDA"
                            },
                            {
                                "id": 17,
                                "name": "State17",
                                "code": "S17",
                                "country_id": 17,
                                "timezone": "Asia/Kolkata",
                                "is_active": 1,
                                "created_at": "2025-05-09T08:09:14.000Z",
                                "updated_at": "2025-05-09T08:09:14.000Z",
                                "country_name": "Jordan",
                                "country_code": "JOR"
                            }
                        ]
                    }
                }
            ]
        },
        {
            id: 'get-state-by-id',
            name: 'Get State By ID',
            method: 'GET',
            url: '/states/{id}',
            description: 'Get a specific state by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the state to retrieve',
                    example: '2'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved the state',
                    example: {
                        "success": true,
                        "data": [
                            {
                                "id": 2,
                                "name": "State2",
                                "code": "S2",
                                "country_id": 2,
                                "timezone": "Asia/Kolkata",
                                "is_active": 1,
                                "created_at": "2025-05-09T08:09:14.000Z",
                                "updated_at": "2025-05-09T08:09:14.000Z"
                            }
                        ]
                    }
                },
                {
                    status: 404,
                    description: 'State not found',
                    example: {
                        "success": false,
                        "message": "State not found"
                    }
                }
            ]
        },
        {
            id: 'create-state',
            name: 'Create State',
            method: 'POST',
            url: '/states/create',
            description: 'Create a new state in the system.',
            parameters: [
                {
                    name: 'name',
                    type: 'string',
                    required: true,
                    description: 'Name of the state',
                    example: 'California'
                },
                {
                    name: 'code',
                    type: 'string',
                    required: true,
                    description: 'State code',
                    example: 'CA'
                },
                {
                    name: 'country_id',
                    type: 'number',
                    required: true,
                    description: 'ID of the country this state belongs to',
                    example: 1
                },
                {
                    name: 'timezone',
                    type: 'string',
                    required: true,
                    description: 'Timezone information',
                    example: 'America/Los_Angeles'
                }
            ],
            responses: [
                {
                    status: 201,
                    description: 'State created successfully',
                    example: {
                        "success": true,
                        "message": "State created successfully",
                        "data": {
                            "id": 51,
                            "name": "California",
                            "code": "CA",
                            "country_id": 1,
                            "timezone": "America/Los_Angeles",
                            "is_active": 1,
                            "created_at": "2025-05-09T10:39:40.000Z",
                            "updated_at": "2025-05-09T10:39:40.000Z"
                        }
                    }
                },
                {
                    status: 400,
                    description: 'Validation error',
                    example: {
                        "success": false,
                        "message": "State name is required"
                    }
                }
            ]
        },
        {
            id: 'update-state',
            name: 'Update State',
            method: 'PUT',
            url: '/states/update/{id}',
            description: 'Update an existing state by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the state to update',
                    example: '51'
                },
                {
                    name: 'name',
                    type: 'string',
                    required: false,
                    description: 'Updated name of the state',
                    example: 'California'
                },
                {
                    name: 'code',
                    type: 'string',
                    required: false,
                    description: 'Updated state code',
                    example: 'CF'
                },
                {
                    name: 'country_id',
                    type: 'number',
                    required: false,
                    description: 'Updated country ID',
                    example: 1
                },
                {
                    name: 'timezone',
                    type: 'string',
                    required: false,
                    description: 'Updated timezone',
                    example: 'America/Los_Angeles'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'State updated successfully',
                    example: {
                        "success": true,
                        "message": "State updated successfully",
                        "data": {
                            "id": 51,
                            "name": "California",
                            "code": "CF",
                            "country_id": 1,
                            "timezone": "America/Los_Angeles",
                            "is_active": 1,
                            "created_at": "2025-05-09T10:39:40.000Z",
                            "updated_at": "2025-05-09T10:41:48.000Z"
                        }
                    }
                },
                {
                    status: 404,
                    description: 'State not found',
                    example: {
                        "success": false,
                        "message": "State not found"
                    }
                }
            ]
        },
        {
            id: 'delete-state',
            name: 'Delete State',
            method: 'DELETE',
            url: '/states/delete/{id}',
            description: 'Delete a state by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the state to delete',
                    example: '51'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'State deleted successfully',
                    example: {
                        "success": true,
                        "message": "State deleted successfully"
                    }
                },
                {
                    status: 404,
                    description: 'State not found',
                    example: {
                        "success": false,
                        "message": "State not found"
                    }
                }
            ]
        },
        {
            id: 'toggle-state-status',
            name: 'Toggle State Status',
            method: 'PATCH',
            url: '/states/toggle-status/{id}',
            description: 'Toggle the active/inactive status of a state.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the state to update status',
                    example: '2'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'State status toggled successfully',
                    example: {
                        "success": true,
                        "message": "State status toggled successfully"
                    }
                },
                {
                    status: 404,
                    description: 'State not found',
                    example: {
                        "success": false,
                        "message": "State not found"
                    }
                }
            ]
        }
    ]
};

export default stateData;