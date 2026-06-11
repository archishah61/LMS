const adminAuthData = {
    "id": "admin-auth",
    "name": "Admin Auth",
    "description": "The Admin Auth API provides endpoints to manage admin authentication and admin users in the system. These endpoints allow you to login, create, read, update, delete, and manage the status of admin users.",
    "endpoints": [
        {
            "id": "admin-login",
            "name": "Admin Login",
            "method": "POST",
            "url": "/admin/auth/login",
            "description": "Login as an admin user.",
            "parameters": [
                {
                    "name": "identifier",
                    "type": "string",
                    "required": true,
                    "description": "Username or email of the admin",
                    "example": "super_admin123"
                },
                {
                    "name": "password",
                    "type": "string",
                    "required": true,
                    "description": "Password of the admin",
                    "example": "StrongPass451236"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Login successful",
                    "example": {
                        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjE3MjExNzUsImV4cCI6MTc2MTcyMjA3NX0.-Ex-0TfwFp4MH34MicyPk_G5bKbIZ26c2uRIpury0f4",
                        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjE3MjExNzUsImV4cCI6MTc2MjMyNTk3NX0.RZM92dLxjmR80XYzBcj5oI4f53p2YTMGtT1URzSTWoY",
                        "message": "Login successful"
                    }
                }
            ]
        },
        {
            "id": "get-all-admins",
            "name": "Get All Admins",
            "method": "GET",
            "url": "/admin/auth/admins",
            "description": "Get a list of all admin users in the system.",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved all admins",
                    "example": {
                        "success": true,
                        "data": [
                            {
                                "id": 1,
                                "username": "admin",
                                "email": "admin@example.com",
                                "password": "$2a$10$yUdVVAribx0tqvyYLt1bnepk9cf9TpxGfO.PkCthRiWfWdhc28S76",
                                "roleId": 1,
                                "is_active": 1,
                                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjE3MjE1NTMsImV4cCI6MTc2MjMyNjM1M30.MM75zlpYPDw4w3UVEq8_cd4631ShvAoUTG6yTuM4Ajs",
                                "created_at": "2025-10-28T06:27:58.000Z",
                                "updated_at": "2025-10-29T07:05:53.000Z",
                                "role_name": "Admin"
                            }
                        ]
                    }
                }
            ]
        },
        {
            "id": "get-admin-by-id",
            "name": "Get Admin By ID",
            "method": "GET",
            "url": "/admin/auth/admins/:id",
            "description": "Get a specific admin user by their ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the admin to retrieve",
                    "example": "3"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the admin",
                    "example": {
                        "success": true,
                        "data": {
                            "id": 1,
                            "username": "admin",
                            "email": "admin@example.com",
                            "password": "$2a$10$yUdVVAribx0tqvyYLt1bnepk9cf9TpxGfO.PkCthRiWfWdhc28S76",
                            "roleId": 1,
                            "is_active": 1,
                            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjE3MjE1NTMsImV4cCI6MTc2MjMyNjM1M30.MM75zlpYPDw4w3UVEq8_cd4631ShvAoUTG6yTuM4Ajs",
                            "created_at": "2025-10-28T06:27:58.000Z",
                            "updated_at": "2025-10-29T07:05:53.000Z",
                            "role_name": "Admin"
                        }
                    }
                },
                {
                    "status": 404,
                    "description": "Admin not found",
                    "example": {
                        "success": false,
                        "message": "Admin not found"
                    }
                }
            ]
        },
        {
            "id": "create-admin",
            "name": "Create Admin",
            "method": "POST",
            "url": "/admin/auth/admins/",
            "description": "Create a new admin user in the system.",
            "parameters": [
                {
                    "name": "name",
                    "type": "string",
                    "required": true,
                    "description": "Username of the admin",
                    "example": "super_admin"
                },
                {
                    "name": "email",
                    "type": "string",
                    "required": true,
                    "description": "Email of the admin",
                    "example": "superadmin@example.com"
                },
                {
                    "name": "password",
                    "type": "string",
                    "required": true,
                    "description": "Password of the admin",
                    "example": "StrongPass456"
                },
                {
                    "name": "roleId",
                    "type": "number",
                    "required": true,
                    "description": "Role ID of the admin",
                    "example": 2
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Admin created successfully",
                    "example": {
                        "success": true,
                        "message": "Admin created successfully",
                        "data": {
                            "id": 2,
                            "username": "super_admin",
                            "email": "superadmin@example.com",
                            "password": "$2a$10$QNGluDoIFGrn6VRJIqZC..ttFYc49ayTnVHg8P/qwUnoyRWegce02",
                            "roleId": 1,
                            "is_active": 1,
                            "refresh_token": null,
                            "created_at": "2025-10-29T07:15:44.000Z",
                            "updated_at": "2025-10-29T07:15:44.000Z"
                        }
                    }
                }
            ]
        },
        {
            "id": "update-admin",
            "name": "Update Admin",
            "method": "PUT",
            "url": "/admin/auth/admins/:id",
            "description": "Update an existing admin user by their ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the admin to update",
                    "example": "2"
                },
                {
                    "name": "name",
                    "type": "string",
                    "required": false,
                    "description": "Updated username of the admin",
                    "example": "super_admin123"
                },
                {
                    "name": "email",
                    "type": "string",
                    "required": false,
                    "description": "Updated email of the admin",
                    "example": "superadmin123@example.com"
                },
                {
                    "name": "password",
                    "type": "string",
                    "required": false,
                    "description": "Updated password of the admin",
                    "example": "StrongPass451236"
                },
                {
                    "name": "roleId",
                    "type": "number",
                    "required": false,
                    "description": "Updated role ID of the admin",
                    "example": 3
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Admin updated successfully",
                    "example": {
                        "success": true,
                        "message": "Admin updated successfully",
                        "data": {
                            "id": 2,
                            "username": "super_admin123",
                            "email": "superadmin123@example.com",
                            "password": "$2a$10$kSngfekQp7.YggfVSgYiMuFV8Ed04LfHPKyiHQ.Nw3vPPwvqpIJym",
                            "roleId": 3,
                            "is_active": 1,
                            "refresh_token": null,
                            "created_at": "2025-10-29T07:15:44.000Z",
                            "updated_at": "2025-10-29T07:25:06.000Z"
                        }
                    }
                },
                {
                    "status": 404,
                    "description": "Admin not found",
                    "example": {
                        "success": false,
                        "message": "Admin not found"
                    }
                }
            ]
        },
        {
            "id": "delete-admin",
            "name": "Delete Admin",
            "method": "DELETE",
            "url": "/admin/auth/admins/:id",
            "description": "Delete an admin user by their ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the admin to delete",
                    "example": "1"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Admin deleted successfully",
                    "example": {
                        "success": true,
                        "message": "Admin deleted successfully"
                    }
                },
                {
                    "status": 404,
                    "description": "Admin not found",
                    "example": {
                        "success": false,
                        "message": "Admin not found"
                    }
                }
            ]
        },
        {
            "id": "toggle-admin-status",
            "name": "Toggle Admin Status",
            "method": "PATCH",
            "url": "/admin/auth/admins/:id",
            "description": "Toggle the status (active/inactive) of an admin user by their ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the admin to update status",
                    "example": "3"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Admin status toggled successfully",
                    "example": {
                        "success": true,
                        "message": "Admin status toggled successfully",
                        "data": {
                            "id": 1,
                            "username": "admin",
                            "email": "admin@example.com",
                            "password": "$2a$10$yUdVVAribx0tqvyYLt1bnepk9cf9TpxGfO.PkCthRiWfWdhc28S76",
                            "roleId": 1,
                            "is_active": 0,
                            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjE3MjE1NTMsImV4cCI6MTc2MjMyNjM1M30.MM75zlpYPDw4w3UVEq8_cd4631ShvAoUTG6yTuM4Ajs",
                            "created_at": "2025-10-28T06:27:58.000Z",
                            "updated_at": "2025-10-29T07:27:21.000Z"
                        }
                    }
                },
                {
                    "status": 404,
                    "description": "Admin not found",
                    "example": {
                        "success": false,
                        "message": "Admin not found"
                    }
                }
            ]
        }
    ]
};

export default adminAuthData;
