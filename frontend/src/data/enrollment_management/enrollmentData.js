const enrollmentData = {
    "id": "enrollment",
    "name": "Enrollment",
    "description": "The Enrollment API provides endpoints to manage enrollments in the system. These endpoints allow you to create, read, update, and delete enrollments.",
    "endpoints": [
        {
            "id": "get-all-enrollments",
            "name": "Get All Enrollments",
            "method": "GET",
            "url": "/enroll/enrollments/",
            "description": "Get a list of all enrollments in the system.",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved all enrollments",
                    "example": [
                        {
                            "id": 1,
                            "user_id": 1,
                            "course_id": 1,
                            "user_hash": "938c43c82c",
                            "enrollment_date": "2025-05-09T11:20:47.000Z",
                            "expiry_date": "2026-05-09T11:20:47.000Z",
                            "status": "active",
                            "created_by": null,
                            "updated_by": null,
                            "created_at": "2025-05-09T05:50:47.000Z",
                            "updated_at": "2025-05-09T05:50:47.000Z",
                            "user": {
                                "id": 1,
                                "full_name": "John Doe",
                                "email": "john@example.com",
                                "username": "johndoe",
                                "mobile_no": "1234567890"
                            },
                            "course": {
                                "id": 1,
                                "public_hash": "60097fb94b",
                                "title": "JavaScript Basics",
                                "description": "Learn the fundamentals of JavaScript. This course covers variables, data types, functions, and control structures. Gain hands-on experience through interactive exercises and real-world examples. Perfect for beginners looking to build a solid programming foundation.",
                                "thumbnail": "/course/thumbnail/jsthumbnail.jpg",
                                "price": "100.00",
                                "duration_hours": 5,
                                "category_id": 1,
                                "category": {
                                    "id": 1,
                                    "category": "Programming"
                                }
                            }
                        }
                    ]
                }
            ]
        },
        {
            "id": "get-enrollment-by-id",
            "name": "Get Enrollment By ID",
            "method": "GET",
            "url": "/enroll/enrollments/:id",
            "description": "Get a specific enrollment by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the enrollment to retrieve",
                    "example": "1"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the enrollment",
                    "example": {
                        "success": true,
                        "data": [
                            {
                                "id": 1,
                                "user_id": 1,
                                "course_id": 1,
                                "user_hash": "938c43c82c",
                                "enrollment_date": "2025-05-09T11:20:47.000Z",
                                "expiry_date": "2026-05-09T11:20:47.000Z",
                                "is_completed": 0,
                                "completed_at": null,
                                "total_time_spent": 0,
                                "completion_percentage": 0,
                                "status": "active",
                                "created_by": null,
                                "updated_by": null,
                                "created_at": "2025-05-09T05:50:47.000Z",
                                "updated_at": "2025-05-09T05:50:47.000Z"
                            }
                        ]
                    }
                },
                {
                    "status": 404,
                    "description": "Enrollment not found",
                    "example": {
                        "success": false,
                        "message": "Enrollment not found"
                    }
                }
            ]
        },
        {
            "id": "create-enrollment",
            "name": "Create Enrollment",
            "method": "POST",
            "url": "/enroll/enrollments/",
            "description": "Create a new enrollment in the system.",
            "parameters": [
                {
                    "name": "userId",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user enrolling in the course",
                    "example": 1
                },
                {
                    "name": "courseId",
                    "type": "string",
                    "required": true,
                    "description": "Public hash of the course",
                    "example": "60097fb94b"
                },
                {
                    "name": "enrollment_date",
                    "type": "string",
                    "required": true,
                    "description": "Date of enrollment",
                    "example": "2025-02-28T10:00:00.000Z"
                },
                {
                    "name": "expiry_date",
                    "type": "string",
                    "required": true,
                    "description": "Expiry date of the enrollment",
                    "example": "2025-08-28T10:00:00.000Z"
                },
                {
                    "name": "status",
                    "type": "string",
                    "required": true,
                    "description": "Status of the enrollment",
                    "example": "active"
                },
                {
                    "name": "created_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user creating the enrollment",
                    "example": 1
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user updating the enrollment",
                    "example": 1
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Enrollment created successfully",
                    "example": {
                        "success": true,
                        "data": [
                            {
                                "id": 1,
                                "user_id": 1,
                                "course_id": 1,
                                "user_hash": "938c43c82c",
                                "enrollment_date": "2025-05-09T11:20:47.000Z",
                                "expiry_date": "2026-05-09T11:20:47.000Z",
                                "is_completed": 0,
                                "completed_at": null,
                                "total_time_spent": 0,
                                "completion_percentage": 0,
                                "status": "active",
                                "created_by": null,
                                "updated_by": null,
                                "created_at": "2025-05-09T05:50:47.000Z",
                                "updated_at": "2025-05-09T05:50:47.000Z"
                            }
                        ]
                    }
                },
                {
                    "status": 400,
                    "description": "Validation error",
                    "example": {
                        "success": false,
                        "message": "Validation error"
                    }
                }
            ]
        },
        {
            "id": "get-enrollments-by-user-id",
            "name": "Get Enrollments By User ID",
            "method": "GET",
            "url": "/enroll/users/:user_hashId/courses",
            "description": "Get all enrollments for a specific user by their user hash ID.",
            "parameters": [
                {
                    "name": "user_hashId",
                    "type": "string",
                    "required": true,
                    "inPath": true,
                    "description": "The user hash ID of the user to retrieve enrollments for",
                    "example": "938c43c82c"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the enrollments for the user",
                    "example": {
                        "courses": [
                            {
                                "user_hash": "938c43c82c",
                                "status": "active",
                                "course": {
                                    "id": 1,
                                    "public_hash": "60097fb94b",
                                    "title": "JavaScript Basics",
                                    "description": "Learn the fundamentals of JavaScript. This course covers variables, data types, functions, and control structures. Gain hands-on experience through interactive exercises and real-world examples. Perfect for beginners looking to build a solid programming foundation.",
                                    "thumbnail": "/course/thumbnail/jsthumbnail.jpg",
                                    "price": "100.00",
                                    "duration_hours": 5,
                                    "category_id": 1,
                                    "category": {
                                        "id": 1,
                                        "category": "Programming"
                                    }
                                }
                            }
                        ],
                        "count": 1
                    }
                },
                {
                    "status": 404,
                    "description": "User not found",
                    "example": {
                        "success": false,
                        "message": "User not found"
                    }
                }
            ]
        },
        {
            "id": "get-user-enrollment-by-hash-id",
            "name": "Get User Enrollment By Hash ID",
            "method": "GET",
            "url": "/enroll/user/:userId/course-content/:hashId",
            "description": "Get a user's enrollment by enrollment hash ID (unique).",
            "parameters": [
                {
                    "name": "userId",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the user to retrieve the enrollment for",
                    "example": "1"
                },
                {
                    "name": "hashId",
                    "type": "string",
                    "required": true,
                    "inPath": true,
                    "description": "The hash ID of the enrollment to retrieve",
                    "example": "60097fb94b"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the user's enrollment",
                    "example": {
                        "course": {
                            "id": 1,
                            "public_hash": "60097fb94b",
                            "sequence": 1,
                            "title": "JavaScript Basics",
                            "description": "Learn the fundamentals of JavaScript. This course covers variables, data types, functions, and control structures. Gain hands-on experience through interactive exercises and real-world examples. Perfect for beginners looking to build a solid programming foundation.",
                            "category_id": 1,
                            "thumbnail": "/course/thumbnail/jsthumbnail.jpg",
                            "preview_video": "/course/preview_video/jspreviewVideo.mp4",
                            "price": "100.00",
                            "discount": 10,
                            "duration_hours": 5,
                            "expiry_days": 90,
                            "what_you_will_learn": [
                                "Variables",
                                "Functions",
                                "Loops"
                            ],
                            "prerequisites": [
                                "Basic HTML"
                            ],
                            "hashtags": [
                                "#javascript",
                                "#frontend"
                            ],
                            "embedding": [
                                0,
                                0,
                                0
                            ],
                            "status": "published",
                            "min_access_hours": "1.00",
                            "max_access_hours": "3.00",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T05:48:55.000Z",
                            "updated_at": "2025-05-09T05:48:55.000Z"
                        },
                        "enrollmentuser": 1
                    }
                },
                {
                    "status": 404,
                    "description": "Enrollment not found",
                    "example": {
                        "success": false,
                        "message": "Enrollment not found"
                    }
                }
            ]
        }
    ]
};

export default enrollmentData;
