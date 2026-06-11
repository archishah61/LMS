const partnerData = {
    id: 'partner',
    name: 'Partner',
    description: 'The Partner API provides endpoints to manage partners in the system. These endpoints allow partners to login/logout, and administrators to create, read, update, delete, and manage the status of partners (both Individual and Organization types).',
    endpoints: [
        {
            id: 'partner-login',
            name: 'Partner Login',
            method: 'POST',
            url: '/partners/login',
            description: 'Authenticate a partner and return a JWT token.',
            parameters: [
                {
                    name: 'email',
                    type: 'string',
                    required: true,
                    description: 'Partner email address',
                    example: 'person1@gmail.com'
                },
                {
                    name: 'password',
                    type: 'string',
                    required: true,
                    description: 'Partner password (use tempPassword from create response for first login)',
                    example: 't2bdhaal'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Login successful',
                    example: {
                        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJQZXJzb24xIiwiZW1haWwiOiJwZXJzb24xQGdtYWlsLmNvbSIsInBhcnRuZXJfdHlwZSI6IkluZGl2aWR1YWwiLCJyb2xlIjoicGFydG5lciIsInNlc3Npb25Ub2tlbiI6IjRhZWMzMzExLWIwZGYtNDEzMi1iMjU3LWYwMjBmMjUwZjE1MCIsImlhdCI6MTc0NzE1MzgxNCwiZXhwIjoxNzQ3NzU4NjE0fQ.XvBAFIqLu61bwKRenm7xVmyMf7DDsQLqURouiOg6rkg",
                        "message": "Login successful",
                        "partner": {
                            "id": 2,
                            "username": "Person1",
                            "email": "person1@gmail.com",
                            "partner_type": "Individual"
                        }
                    }
                },
                {
                    status: 400,
                    description: 'Validation error',
                    example: {
                        "message": "Email and password are required || Invalid email format"
                    }
                },
                {
                    status: 401,
                    description: 'Invalid credentials',
                    example: {
                        "message": "Invalid email or password"
                    }
                },
                {
                    status: 403,
                    description: 'Account not activated',
                    example: {
                        "message": "Your request has been submitted and is awaiting admin approval || Your account has been rejected"
                    }
                }
            ]
        },
        {
            id: 'partner-logout',
            name: 'Partner Logout',
            method: 'POST',
            url: '/partners/logout',
            description: 'Logout the currently authenticated partner.',
            responses: [
                {
                    status: 200,
                    description: 'Logout successful',
                    example: {
                        "message": "Logout successful"
                    }
                }
            ]
        },
        {
            id: 'get-all-partners',
            name: 'Get All Partners',
            method: 'GET',
            url: '/partners/',
            description: 'Get a list of all partners in the system.',
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved all partners',
                    example: [
                        {
                            "id": 2,
                            "user_id": 1,
                            "partner_type": "Individual",
                            "name": "Person1",
                            "email": "person1@gmail.com",
                            "phone": "98775434982",
                            "organization_type": null,
                            "contact_person_name": null,
                            "contact_person_email": null,
                            "contact_person_phone": null,
                            "website": "https://person1.com",
                            "description": null,
                            "logo": null,
                            "status": "Pending",
                            "session_token": null,
                            "created_at": "2025-05-13T16:14:16.000Z",
                            "updated_at": "2025-05-13T16:14:16.000Z",
                            "user": {
                                "id": 1,
                                "username": "johndoe",
                                "email": "john@example.com"
                            }
                        },
                        {
                            "id": 3,
                            "user_id": 1,
                            "partner_type": "Organization",
                            "name": "Demo Organization",
                            "email": "superadmin123dfhfrhd@gmail.com",
                            "phone": "9876542123",
                            "organization_type": "Institute",
                            "contact_person_name": "demo person1",
                            "contact_person_email": "demo1@gmail.com",
                            "contact_person_phone": "9087654321",
                            "website": null,
                            "description": null,
                            "logo": null,
                            "status": "Pending",
                            "session_token": null,
                            "created_at": "2025-05-13T16:17:27.000Z",
                            "updated_at": "2025-05-13T16:17:27.000Z",
                            "user": {
                                "id": 1,
                                "username": "johndoe",
                                "email": "john@example.com"
                            }
                        }
                    ]
                }
            ]
        },
        {
            id: 'get-partner-by-id',
            name: 'Get Partner By ID',
            method: 'GET',
            url: '/partners/{id}',
            description: 'Get a specific partner by their ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the partner to retrieve',
                    example: '2'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved the partner',
                    example: {
                        "id": 2,
                        "user_id": 1,
                        "partner_type": "Individual",
                        "name": "Person1",
                        "email": "person1@gmail.com",
                        "phone": "98775434982",
                        "organization_type": null,
                        "contact_person_name": null,
                        "contact_person_email": null,
                        "contact_person_phone": null,
                        "website": "https://person1.com",
                        "description": null,
                        "logo": null,
                        "status": "Pending",
                        "session_token": null,
                        "created_at": "2025-05-13T16:14:16.000Z",
                        "updated_at": "2025-05-13T16:14:16.000Z",
                        "user": {
                            "id": 1,
                            "username": "johndoe",
                            "email": "john@example.com"
                        }
                    }
                }
            ]
        },
        {
            id: 'create-partner',
            name: 'Create Partner',
            method: 'POST',
            url: '/partners/create',
            description: 'Create a new partner in the system. For Organization type, additional contact person details are required.',
            parameters: [
                {
                    name: 'user_id',
                    type: 'number',
                    required: true,
                    description: 'ID of the user creating the partner',
                    example: 1
                },
                {
                    name: 'partnerType',
                    type: 'string',
                    required: true,
                    description: 'Type of partner (Individual/Organization)',
                    example: 'Individual'
                },
                {
                    name: 'fullName',
                    type: 'string',
                    required: true,
                    description: 'Full name of the partner (for Individual) or organization name (for Organization)',
                    example: 'Person1'
                },
                {
                    name: 'email',
                    type: 'string',
                    required: true,
                    description: 'Partner email address',
                    example: 'person1@gmail.com'
                },
                {
                    name: 'phone',
                    type: 'string',
                    required: true,
                    description: 'Partner phone number',
                    example: '98775434982'
                },
                {
                    name: 'website',
                    type: 'string',
                    required: false,
                    description: 'Partner website URL',
                    example: 'https://person1.com'
                },
                {
                    name: 'contactPersonName',
                    type: 'string',
                    required: false,
                    description: 'Contact person name (required for Organization type)',
                    example: 'demo person1'
                },
                {
                    name: 'contactPersonEmail',
                    type: 'string',
                    required: false,
                    description: 'Contact person email (required for Organization type)',
                    example: 'demo1@gmail.com'
                },
                {
                    name: 'contactPersonPhone',
                    type: 'string',
                    required: false,
                    description: 'Contact person phone (required for Organization type)',
                    example: '9087654321'
                },
                {
                    name: 'status',
                    type: 'string',
                    required: true,
                    description: 'Initial status of the partner (Pending/Approved/Rejected)',
                    example: 'Pending'
                }
            ],
            responses: [
                {
                    status: 201,
                    description: 'Partner created successfully',
                    example: {
                        "message": "Partner created successfully",
                        "partner": {
                            "id": 2,
                            "name": "Person1",
                            "email": "person1@gmail.com",
                            "partner_type": "Individual",
                            "status": "Pending",
                            "tempPassword": "t2bdhaal"
                        }
                    }
                }
            ]
        },
        {
            id: 'update-partner',
            name: 'Update Partner',
            method: 'PUT',
            url: '/partners/update/{id}',
            description: 'Update an existing partner by their ID. Partner type cannot be changed after creation.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the partner to update',
                    example: '3'
                },
                {
                    name: 'user_id',
                    type: 'number',
                    required: true,
                    description: 'ID of the user updating the partner',
                    example: 2
                },
                {
                    name: 'fullName',
                    type: 'string',
                    required: false,
                    description: 'Updated name of the partner',
                    example: 'Person2'
                },
                {
                    name: 'phone',
                    type: 'string',
                    required: false,
                    description: 'Updated phone number',
                    example: '98775434982'
                },
                {
                    name: 'website',
                    type: 'string',
                    required: false,
                    description: 'Updated website URL',
                    example: 'https://person2.com'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Partner updated successfully',
                    example: {
                        "message": "Partner updated successfully",
                        "partner": {
                            "id": 3,
                            "name": "Person2",
                            "email": "superadmin123dfhfrhd@gmail.com",
                            "partner_type": "Organization",
                            "status": "Approved"
                        }
                    }
                }
            ]
        },
        {
            id: 'update-partner-status',
            name: 'Update Partner Status',
            method: 'PUT',
            url: '/partners/update-status/{id}',
            description: 'Update the status of a partner (Approved/Rejected).',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the partner to update status',
                    example: '3'
                },
                {
                    name: 'status',
                    type: 'string',
                    required: true,
                    description: 'New status for the partner (Pending, Approved, Rejected)',
                    example: 'Approved'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Partner status updated successfully',
                    example: {
                        "message": "Partner status updated successfully",
                        "status": "Approved"
                    }
                },
                {
                    status: 400,
                    description: 'Invalid status value',
                    example: {
                        "message": "Invalid status value. Allowed values are: Pending, Approved, Rejected"
                    }
                },
                {
                    status: 404,
                    description: 'Partner not found',
                    example: {
                        "message": "Partner not found"
                    }
                }
            ]
        },
        {
            id: 'delete-partner',
            name: 'Delete Partner',
            method: 'DELETE',
            url: '/partners/delete/{id}',
            description: 'Delete a partner by their ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the partner to delete',
                    example: '2'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Partner deleted successfully',
                    example: {
                        "message": "Partner deleted successfully"
                    }
                },
                {
                    status: 400,
                    description: 'Invalid ID format',
                    example: {
                        "message": "Invalid ID format"
                    }
                },
                {
                    status: 403,
                    description: 'Unauthorized action',
                    example: {
                        "message": "Only approved partners can be deleted"
                    }
                },
                {
                    status: 404,
                    description: 'Partner not found',
                    example: {
                        "message": "Partner not found"
                    }
                }
            ]
        }
    ]
};

export default partnerData;