const courseData = {
    "id": "course",
    "name": "Course",
    "description": "The Course API provides endpoints to manage courses in the system. These endpoints allow you to create, read, update, delete, and manage the status of courses.",
    "endpoints": [
        {
            "id": "get-all-courses",
            "name": "Get All Courses",
            "method": "GET",
            "url": "/course/",
            "description": "Get a list of all courses in the system.",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved all courses",
                    "example": [
                        {
                            "id": 1,
                            "public_hash": "abc123",
                            "sequence": 1,
                            "title": "Full Stack Web Development",
                            "description": "Learn full stack web development...",
                            "category_id": 1,
                            "thumbnail": "/course/thumbnail/image1.jpg",
                            "preview_video": "/course/preview_video/video1.mp4",
                            "price": 99.99,
                            "discount": 10,
                            "duration_hours": 40,
                            "expiry_days": 365,
                            "what_you_will_learn": ["HTML", "CSS", "JavaScript"],
                            "prerequisites": ["Basic Computer Knowledge"],
                            "hashtags": ["webdev", "fullstack"],
                            "status": "published",
                            "min_access_hours": 0.03,
                            "max_access_hours": 0.05,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_by_type": "admin",
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T05:48:55.000Z",
                            "updated_at": "2025-05-09T06:01:42.000Z"
                        }
                    ]
                }
            ]
        },
        {
            "id": "get-course-by-id",
            "name": "Get Course By ID",
            "method": "GET",
            "url": "/course/:id",
            "description": "Get a specific course by its ID or public hash.",
            "parameters": [
                {
                    "name": "id",
                    "type": "string",
                    "required": true,
                    "inPath": true,
                    "description": "The ID or public hash of the course to retrieve",
                    "example": "abc123"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the course",
                    "example": {
                        "id": 1,
                        "public_hash": "abc123",
                        "sequence": 1,
                        "title": "Full Stack Web Development",
                        "description": "Learn full stack web development...",
                        "category_id": 1,
                        "thumbnail": "/course/thumbnail/image1.jpg",
                        "preview_video": "/course/preview_video/video1.mp4",
                        "price": 99.99,
                        "discount": 10,
                        "duration_hours": 40,
                        "expiry_days": 365,
                        "what_you_will_learn": ["HTML", "CSS", "JavaScript"],
                        "prerequisites": ["Basic Computer Knowledge"],
                        "hashtags": ["webdev", "fullstack"],
                        "status": "published",
                        "min_access_hours": 0.03,
                        "max_access_hours": 0.05,
                        "created_by": 1,
                        "updated_by": 1,
                        "created_by_type": "admin",
                        "updated_by_type": "admin",
                        "created_at": "2025-05-09T05:48:55.000Z",
                        "updated_at": "2025-05-09T06:01:42.000Z"
                    }
                },
                {
                    "status": 404,
                    "description": "Course not found",
                    "example": {
                        "success": false,
                        "message": "Course not found"
                    }
                }
            ]
        },
        {
            "id": "create-course",
            "name": "Create Course",
            "method": "POST",
            "url": "/course/create",
            "description": "Create a new course in the system.",
            "parameters": [
                {
                    "name": "title",
                    "type": "string",
                    "required": true,
                    "description": "Title of the course",
                    "example": "Full Stack Web Development"
                },
                {
                    "name": "description",
                    "type": "string",
                    "required": true,
                    "description": "Detailed description of the course",
                    "example": "Learn full stack web development..."
                },
                {
                    "name": "category_id",
                    "type": "number",
                    "required": true,
                    "description": "ID of the course category",
                    "example": 1
                },
                {
                    "name": "price",
                    "type": "number",
                    "required": true,
                    "description": "Price of the course",
                    "example": 99.99
                },
                {
                    "name": "discount",
                    "type": "number",
                    "required": false,
                    "description": "Discount percentage for the course",
                    "example": 10
                },
                {
                    "name": "duration_hours",
                    "type": "number",
                    "required": true,
                    "description": "Duration of the course in hours",
                    "example": 40
                },
                {
                    "name": "expiry_days",
                    "type": "number",
                    "required": true,
                    "description": "Number of days until course access expires",
                    "example": 365
                },
                {
                    "name": "what_you_will_learn",
                    "type": "array",
                    "required": false,
                    "description": "Array of learning outcomes",
                    "example": ["HTML", "CSS", "JavaScript"]
                },
                {
                    "name": "prerequisites",
                    "type": "array",
                    "required": false,
                    "description": "Array of prerequisites",
                    "example": ["Basic Computer Knowledge"]
                },
                {
                    "name": "hashtags",
                    "type": "array",
                    "required": false,
                    "description": "Array of hashtags",
                    "example": ["webdev", "fullstack"]
                },
                {
                    "name": "min_access_hours",
                    "type": "number",
                    "required": false,
                    "description": "Minimum hours required before accessing content",
                    "example": 0.03
                },
                {
                    "name": "max_access_hours",
                    "type": "number",
                    "required": false,
                    "description": "Maximum hours allowed for course access",
                    "example": 0.05
                },
                {
                    "name": "created_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user creating the course",
                    "example": 1
                },
                {
                    "name": "created_by_type",
                    "type": "string",
                    "required": true,
                    "description": "Type of user creating the course (admin/partner)",
                    "example": "admin"
                }
            ],
            "responses": [
                {
                    "status": 201,
                    "description": "Course created successfully",
                    "example": {
                        "success": true,
                        "course": {
                            "id": 1,
                            "public_hash": "abc123",
                            "title": "Full Stack Web Development",
                            "status": "draft"
                        }
                    }
                },
                {
                    "status": 400,
                    "description": "Validation error",
                    "example": {
                        "success": false,
                        "message": "Title is required"
                    }
                }
            ]
        },
        {
            "id": "update-course",
            "name": "Update Course",
            "method": "PUT",
            "url": "/course/update/:id",
            "description": "Update an existing course by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "string",
                    "required": true,
                    "inPath": true,
                    "description": "The ID or public hash of the course to update",
                    "example": "abc123"
                },
                {
                    "name": "title",
                    "type": "string",
                    "required": false,
                    "description": "Updated title of the course",
                    "example": "Advanced Full Stack Development"
                },
                {
                    "name": "description",
                    "type": "string",
                    "required": false,
                    "description": "Updated description of the course",
                    "example": "Learn advanced full stack web development..."
                },
                {
                    "name": "category_id",
                    "type": "number",
                    "required": false,
                    "description": "Updated category ID",
                    "example": 2
                },
                {
                    "name": "price",
                    "type": "number",
                    "required": false,
                    "description": "Updated price",
                    "example": 149.99
                },
                {
                    "name": "discount",
                    "type": "number",
                    "required": false,
                    "description": "Updated discount percentage",
                    "example": 15
                },
                {
                    "name": "duration_hours",
                    "type": "number",
                    "required": false,
                    "description": "Updated duration in hours",
                    "example": 50
                },
                {
                    "name": "expiry_days",
                    "type": "number",
                    "required": false,
                    "description": "Updated expiry days",
                    "example": 180
                },
                {
                    "name": "what_you_will_learn",
                    "type": "array",
                    "required": false,
                    "description": "Updated learning outcomes",
                    "example": ["Advanced HTML", "CSS3", "JavaScript ES6+"]
                },
                {
                    "name": "prerequisites",
                    "type": "array",
                    "required": false,
                    "description": "Updated prerequisites",
                    "example": ["Basic Web Development"]
                },
                {
                    "name": "hashtags",
                    "type": "array",
                    "required": false,
                    "description": "Updated hashtags",
                    "example": ["advanced", "webdev", "fullstack"]
                },
                {
                    "name": "min_access_hours",
                    "type": "number",
                    "required": false,
                    "description": "Updated minimum access hours",
                    "example": 0.05
                },
                {
                    "name": "max_access_hours",
                    "type": "number",
                    "required": false,
                    "description": "Updated maximum access hours",
                    "example": 0.08
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user updating the course",
                    "example": 1
                },
                {
                    "name": "updated_by_type",
                    "type": "string",
                    "required": true,
                    "description": "Type of user updating the course (admin/partner)",
                    "example": "admin"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Course updated successfully",
                    "example": {
                        "success": true,
                        "message": "Course updated successfully",
                        "course": {
                            "id": 1,
                            "title": "Advanced Full Stack Development",
                            "status": "published"
                        }
                    }
                },
                {
                    "status": 404,
                    "description": "Course not found",
                    "example": {
                        "success": false,
                        "message": "Course not found"
                    }
                }
            ]
        },
        {
            "id": "delete-course",
            "name": "Delete Course",
            "method": "DELETE",
            "url": "/course/delete/:id",
            "description": "Delete a course by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "string",
                    "required": true,
                    "inPath": true,
                    "description": "The ID or public hash of the course to delete",
                    "example": "abc123"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Course deleted successfully",
                    "example": {
                        "success": true,
                        "message": "Course deleted successfully"
                    }
                },
                {
                    "status": 404,
                    "description": "Course not found",
                    "example": {
                        "success": false,
                        "message": "Course not found"
                    }
                }
            ]
        },
        {
            "id": "update-course-status",
            "name": "Update Course Status",
            "method": "PUT",
            "url": "/course/update-status/:id",
            "description": "Update the status of a course.",
            "parameters": [
                {
                    "name": "id",
                    "type": "string",
                    "required": true,
                    "inPath": true,
                    "description": "The ID or public hash of the course to update",
                    "example": "abc123"
                },
                {
                    "name": "status",
                    "type": "string",
                    "required": true,
                    "description": "New status for the course (draft/pending/approved/published/rejected)",
                    "example": "published"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Course status updated successfully",
                    "example": {
                        "success": true,
                        "message": "Course status updated successfully",
                        "status": "published"
                    }
                },
                {
                    "status": 400,
                    "description": "Invalid status value",
                    "example": {
                        "success": false,
                        "message": "Invalid status value"
                    }
                },
                {
                    "status": 404,
                    "description": "Course not found",
                    "example": {
                        "success": false,
                        "message": "Course not found"
                    }
                }
            ]
        },
        {
            "id": "update-course-sequence",
            "name": "Update Course Sequence",
            "method": "PUT",
            "url": "/course/sequence",
            "description": "Update the sequence/order of courses.",
            "parameters": [
                {
                    "name": "sequence",
                    "type": "array",
                    "required": true,
                    "description": "Array of course IDs in the desired order",
                    "example": [3, 1, 2]
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Course sequence updated successfully",
                    "example": {
                        "success": true,
                        "message": "Courses sequence updated successfully"
                    }
                },
                {
                    "status": 400,
                    "description": "Invalid sequence format",
                    "example": {
                        "success": false,
                        "message": "Invalid sequence format"
                    }
                }
            ]
        }
    ]
};

export default courseData;
