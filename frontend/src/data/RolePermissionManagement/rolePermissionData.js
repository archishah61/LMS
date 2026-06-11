const rolePermissionData = {
    id: 'role-permission',
    name: 'Role & Permission Management',
    description: 'The Role & Permission API provides endpoints to manage role permissions in the system. These endpoints allow you to assign permissions to roles and retrieve permission information.',
    endpoints: [
        {
            id: 'manage-role-permissions',
            name: 'Manage Role Permissions',
            method: 'POST',
            url: '/role-permissions/manage',
            description: 'Assign permissions to a specific role by providing the role ID and an array of permission IDs.',
            parameters: [
                {
                    name: 'roleId',
                    type: 'number',
                    required: true,
                    description: 'ID of the role to manage permissions for',
                    example: '4'
                },
                {
                    name: 'permissions',
                    type: 'array',
                    required: true,
                    description: 'Array of permission IDs to assign to the role',
                    example: [19, 14, 27]
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Permissions updated successfully',
                    example: {
                        "success": true,
                        "message": "Permissions updated for the role successfully"
                    }
                },
                {
                    status: 400,
                    description: 'Validation error',
                    example: {
                        "success": false,
                        "message": "Role ID and permissions array are required"
                    }
                },
                {
                    status: 404,
                    description: 'Role not found',
                    example: {
                        "success": false,
                        "message": "Role not found"
                    }
                }
            ]
        },
        {
            id: 'get-role-permissions-by-id',
            name: 'Get Role Permissions By ID',
            method: 'GET',
            url: '/role-permissions/{id}',
            description: 'Get all permissions assigned to a specific role by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the role to retrieve permissions for',
                    example: '4'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved role permissions',
                    example: {
                        "success": true,
                        "data": [
                            {
                                "role_permission_id": 237,
                                "roleId": 4,
                                "permissionId": 19,
                                "section": "Admin",
                                "description": "View Admins",
                                "action": "view",
                                "created_at": "2025-05-09T10:25:47.000Z",
                                "updated_at": "2025-05-09T10:25:47.000Z"
                            },
                            {
                                "role_permission_id": 238,
                                "roleId": 4,
                                "permissionId": 14,
                                "section": "Challenge Category",
                                "description": "View Challenge Category",
                                "action": "view",
                                "created_at": "2025-05-09T10:25:47.000Z",
                                "updated_at": "2025-05-09T10:25:47.000Z"
                            },
                            {
                                "role_permission_id": 239,
                                "roleId": 4,
                                "permissionId": 27,
                                "section": "Challenge Quest",
                                "description": "View Challenge Quest",
                                "action": "view",
                                "created_at": "2025-05-09T10:31:13.000Z",
                                "updated_at": "2025-05-09T10:31:13.000Z"
                            }
                        ]
                    }
                },
                {
                    status: 404,
                    description: 'Role not found',
                    example: {
                        "success": false,
                        "message": "Role not found"
                    }
                }
            ]
        },
        {
            id: 'get-all-permissions',
            name: 'Get All Permissions',
            method: 'GET',
            url: '/admin/auth/permissions',
            description: 'Get a list of all available permissions in the system.',
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved all permissions',
                    example: {
                        "success": true,
                        "data": [
                            {
                                "role_permission_id": 237,
                                "roleId": 4,
                                "permissionId": 19,
                                "section": "Admin",
                                "description": "View Admins",
                                "action": "view",
                                "created_at": "2025-05-09T10:25:47.000Z",
                                "updated_at": "2025-05-09T10:25:47.000Z"
                            },
                            {
                                "role_permission_id": 238,
                                "roleId": 4,
                                "permissionId": 14,
                                "section": "Challenge Category",
                                "description": "View Challenge Category",
                                "action": "view",
                                "created_at": "2025-05-09T10:25:47.000Z",
                                "updated_at": "2025-05-09T10:25:47.000Z"
                            },
                            {
                                "role_permission_id": 239,
                                "roleId": 4,
                                "permissionId": 27,
                                "section": "Challenge Quest",
                                "description": "View Challenge Quest",
                                "action": "view",
                                "created_at": "2025-05-09T10:31:13.000Z",
                                "updated_at": "2025-05-09T10:31:13.000Z"
                            }
                        ]
                    }
                }
            ]
        }
    ]
};

export default rolePermissionData;