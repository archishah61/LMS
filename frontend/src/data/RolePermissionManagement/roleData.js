const roleData = {
  id: 'role',
  name: 'Role & Permission Management',
  description: 'The Role API provides endpoints to manage user roles and permissions in the system. These endpoints allow you to create, read, update, and delete roles with their associated permissions.',
  endpoints: [
    {
      id: 'get-all-roles',
      name: 'Get All Roles',
      method: 'GET',
      url: '/roles/all',
      description: 'Get a list of all roles in the system.',
      responses: [
        {
          status: 200,
          description: 'Successfully retrieved all roles',
          example: {
            "success": true,
            "data": [
              {
                "id": 1,
                "name": "Admin",
                "description": "Full access to everything",
                "created_at": "2025-05-09T08:09:14.000Z",
                "updated_at": "2025-05-09T08:09:14.000Z"
              },
              {
                "id": 4,
                "name": "Analysis Manager",
                "description": "Can only view data",
                "created_at": "2025-05-09T08:09:14.000Z",
                "updated_at": "2025-05-09T08:09:14.000Z"
              },
              {
                "id": 3,
                "name": "Content Manager",
                "description": "Can manage content",
                "created_at": "2025-05-09T08:09:14.000Z",
                "updated_at": "2025-05-09T08:09:14.000Z"
              },
              {
                "id": 5,
                "name": "SuperAdmin",
                "description": "Updated role with extended permissions",
                "created_at": "2025-05-09T09:40:15.000Z",
                "updated_at": "2025-05-09T09:46:09.000Z"
              },
              {
                "id": 2,
                "name": "User Manager",
                "description": "Manages system and users",
                "created_at": "2025-05-09T08:09:14.000Z",
                "updated_at": "2025-05-09T08:09:14.000Z"
              }
            ]
          }
        }
      ]
    },
    {
      id: 'get-role-by-id',
      name: 'Get Role By ID',
      method: 'GET',
      url: '/roles/{id}',
      description: 'Get a specific role by its ID.',
      parameters: [
        {
          name: 'id',
          type: 'number',
          required: true,
          inPath: true,
          description: 'The ID of the role to retrieve',
          example: '3'
        }
      ],
      responses: [
        {
          status: 200,
          description: 'Successfully retrieved the role',
          example: {
            "success": true,
            "data": {
              "id": 3,
              "name": "Content Manager",
              "description": "Can manage content",
              "created_at": "2025-05-09T08:09:14.000Z",
              "updated_at": "2025-05-09T08:09:14.000Z"
            }
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
      id: 'create-role',
      name: 'Create Role',
      method: 'POST',
      url: '/roles/create',
      description: 'Create a new role in the system.',
      parameters: [
        {
          name: 'name',
          type: 'string',
          required: true,
          description: 'Name of the role',
          example: 'Business Analytics'
        },
        {
          name: 'description',
          type: 'string',
          required: true,
          description: 'Description of the role',
          example: 'Manage Business with full permissions'
        }
      ],
      responses: [
        {
          status: 201,
          description: 'Role created successfully',
          example: {
            "success": true,
            "message": "Role created successfully",
            "data": {
              "id": 5,
              "name": "Business Analytics",
              "description": "Manage Business with full permissions",
              "created_at": "2025-05-09T09:40:15.000Z",
              "updated_at": "2025-05-09T09:40:15.000Z"
            }
          }
        },
        {
          status: 400,
          description: 'Validation error',
          example: {
            "success": false,
            "message": "Role name and description are required"
          }
        }
      ]
    },
    {
      id: 'update-role',
      name: 'Update Role',
      method: 'PUT',
      url: '/roles/update/{id}',
      description: 'Update an existing role by its ID.',
      parameters: [
        {
          name: 'id',
          type: 'number',
          required: true,
          inPath: true,
          description: 'The ID of the role to update',
          example: '5'
        },
        {
          name: 'name',
          type: 'string',
          required: false,
          description: 'Updated name of the role',
          example: 'SuperAdmin'
        },
        {
          name: 'description',
          type: 'string',
          required: false,
          description: 'Updated description of the role',
          example: 'Updated role with extended permissions'
        }
      ],
      responses: [
        {
          status: 200,
          description: 'Role updated successfully',
          example: {
            "success": true,
            "message": "Role updated successfully",
            "data": {
              "id": 5,
              "name": "SuperAdmin",
              "description": "Updated role with extended permissions",
              "created_at": "2025-05-09T09:40:15.000Z",
              "updated_at": "2025-05-09T09:46:09.000Z"
            }
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
      id: 'delete-role',
      name: 'Delete Role',
      method: 'DELETE',
      url: '/roles/delete/{id}',
      description: 'Delete a role by its ID.',
      parameters: [
        {
          name: 'id',
          type: 'number',
          required: true,
          inPath: true,
          description: 'The ID of the role to delete',
          example: '5'
        }
      ],
      responses: [
        {
          status: 200,
          description: 'Role deleted successfully',
          example: {
            "success": true,
            "message": "Role deleted successfully"
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
    }
  ]
};

export default roleData;