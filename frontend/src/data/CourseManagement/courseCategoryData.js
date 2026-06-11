const courseCategoryData = {
    "id": "course-category",
    "name": "Course Category",
    "description": "The Course Category API provides endpoints to manage course categories in the system. These endpoints allow you to create, read, update, delete, and manage the status of course categories.",
    "endpoints": [
        {
            "id": "get-all-course-categories",
            "name": "Get All Course Categories",
            "method": "GET",
            "url": "/course-catagory/",
            "description": "Get a list of all course categories in the system.",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved all course categories",
                    "example": [
                        {
                            "id": 1,
                            "category": "Full Stack Development",
                            "status": "active",
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T05:48:55.000Z",
                            "updated_at": "2025-05-09T06:01:42.000Z"
                        },
                        {
                            "id": 2,
                            "category": "Design",
                            "status": "active",
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T05:48:55.000Z",
                            "updated_at": "2025-05-09T05:48:55.000Z"
                        },
                        {
                            "id": 3,
                            "category": "Science",
                            "status": "active",
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T05:48:55.000Z",
                            "updated_at": "2025-05-09T05:48:55.000Z"
                        },
                        {
                            "id": 4,
                            "category": "Health & Biology",
                            "status": "inactive",
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T05:48:55.000Z",
                            "updated_at": "2025-05-09T06:05:43.000Z"
                        }
                    ]
                }
            ]
        },
        {
            "id": "get-course-category-by-id",
            "name": "Get Course Category By ID",
            "method": "GET",
            "url": "/course-catagory/:id",
            "description": "Get a specific course category by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the course category to retrieve",
                    "example": "2"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the course category",
                    "example": {
                        "id": 2,
                        "category": "Design",
                        "status": "active",
                        "created_by": 1,
                        "updated_by": 1,
                        "created_at": "2025-05-09T05:48:55.000Z",
                        "updated_at": "2025-05-09T05:48:55.000Z"
                    }
                },
                {
                    "status": 404,
                    "description": "Course category not found",
                    "example": {
                        "success": false,
                        "message": "Course category not found"
                    }
                }
            ]
        },
        {
            "id": "create-course-category",
            "name": "Create Course Category",
            "method": "POST",
            "url": "/course-catagory/create",
            "description": "Create a new course category in the system.",
            "parameters": [
                {
                    "name": "category",
                    "type": "string",
                    "required": true,
                    "description": "Name of the course category",
                    "example": "Data Science"
                },
                {
                    "name": "created_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user creating the category",
                    "example": 1
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Category created successfully",
                    "example": {
                        "message": "Category created successfully"
                    }
                },
                {
                    "status": 400,
                    "description": "Validation error",
                    "example": {
                        "success": false,
                        "message": "Category name is required"
                    }
                }
            ]
        },
        {
            "id": "update-course-category",
            "name": "Update Course Category",
            "method": "PUT",
            "url": "/course-catagory/update/:id",
            "description": "Update an existing course category by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the course category to update",
                    "example": "1"
                },
                {
                    "name": "category",
                    "type": "string",
                    "required": false,
                    "description": "Updated name of the course category",
                    "example": "Full Stack Development"
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user updating the category",
                    "example": 1
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Category updated successfully",
                    "example": {
                        "success": true,
                        "message": "Category updated successfully"
                    }
                },
                {
                    "status": 404,
                    "description": "Course category not found",
                    "example": {
                        "success": false,
                        "message": "Course category not found"
                    }
                }
            ]
        },
        {
            "id": "delete-course-category",
            "name": "Delete Course Category",
            "method": "DELETE",
            "url": "/course-catagory/delete/:id",
            "description": "Delete a course category by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the course category to delete",
                    "example": "2"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Category deleted successfully",
                    "example": {
                        "message": "Category deleted successfully"
                    }
                },
                {
                    "status": 404,
                    "description": "Course category not found",
                    "example": {
                        "success": false,
                        "message": "Course category not found"
                    }
                }
            ]
        },
        {
            "id": "toggle-course-category-status",
            "name": "Toggle Course Category Status",
            "method": "PUT",
            "url": "/course-catagory/:id/status",
            "description": "Toggle the status (active/inactive) of a course category.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the course category to update status",
                    "example": "4"
                },
                {
                    "name": "status",
                    "type": "string",
                    "required": true,
                    "description": "New status for the course category (active/inactive)",
                    "example": "inactive"
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user updating the status",
                    "example": 1
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Category status updated successfully",
                    "example": {
                        "success": true,
                        "message": "Category status updated successfully"
                    }
                },
                {
                    "status": 400,
                    "description": "Invalid status value",
                    "example": {
                        "success": false,
                        "message": "Status must be either 'active' or 'inactive'"
                    }
                },
                {
                    "status": 404,
                    "description": "Course category not found",
                    "example": {
                        "success": false,
                        "message": "Course category not found"
                    }
                }
            ]
        }
    ]
}

export default courseCategoryData;