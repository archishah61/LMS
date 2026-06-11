const courseFAQData = {
    id: "course-faq",
    name: "Course FAQ",
    description: "The Course FAQ API provides endpoints to manage FAQs for each course. These endpoints allow admins to create, view, update, and delete course FAQs.",
    endpoints: [
        {
            id: "create-faq",
            name: "Create FAQ",
            method: "POST",
            url: "/course-faq/",
            description: "Create a new FAQ for a specific course.",
            parameters: [
                { name: "course_id", type: "string", required: true, description: "Public hash of the course" },
                { name: "question", type: "string", required: true, description: "The FAQ question" },
                { name: "created_by", type: "string", required: true, description: "ID of the creator" },
                { name: "created_by_type", type: "string", required: false, description: "Creator type: admin or user", example: "admin" },
                { name: "updated_by_type", type: "string", required: false, description: "Updater type: admin or user", example: "admin" }
            ],
            responses: [
                {
                    status: 201,
                    description: "FAQ created successfully",
                    example: {
                        message: "FAQ created successfully",
                        faq: {
                            id: 1,
                            course_id: 2,
                            question: "What is included in this course?",
                            created_by: "1",
                            created_by_type: "admin",
                            updated_by: "1",
                            updated_by_type: "admin",
                            created_at: "2025-05-16T10:00:00.000Z",
                            updated_at: "2025-05-16T10:00:00.000Z"
                        }
                    }
                },
                {
                    status: 404,
                    description: "Course not found",
                    example: {
                        message: "Course not found"
                    }
                }
            ]
        },
        {
            id: "get-all-faqs",
            name: "Get All FAQs",
            method: "GET",
            url: "/course-faq/",
            description: "Retrieve all course FAQs with course details.",
            responses: [
                {
                    status: 200,
                    description: "Successfully retrieved all FAQs",
                    example: [
                        {
                            id: 1,
                            question: "What will I learn in this course?",
                            course_id: 2,
                            created_by: "1",
                            created_by_type: "admin",
                            updated_by: "1",
                            updated_by_type: "admin",
                            created_at: "2025-05-16T10:00:00.000Z",
                            updated_at: "2025-05-16T10:00:00.000Z",
                            course: {
                                id: 2,
                                public_hash: "abc123",
                                title: "Full Stack Web Development",
                                description: "Learn full stack web development...",
                                price: 99.99,
                                discount: 10
                            }
                        }
                    ]
                }
            ]
        },
        {
            id: "get-faqs-by-course-id",
            name: "Get FAQs by Course ID",
            method: "GET",
            url: "/course-faq/course/:course_id",
            description: "Retrieve FAQs for a specific course using its public hash.",
            parameters: [
                { name: "course_id", type: "string", required: true, inPath: true, description: "Public hash of the course" }
            ],
            responses: [
                {
                    status: 200,
                    description: "Successfully retrieved FAQs for the course",
                    example: [
                        {
                            id: 1,
                            question: "What are the prerequisites?",
                            course_id: 2,
                            created_by: "1",
                            created_by_type: "admin",
                            updated_by: "1",
                            updated_by_type: "admin",
                            created_at: "2025-05-16T10:00:00.000Z",
                            updated_at: "2025-05-16T10:00:00.000Z"
                        }
                    ]
                },
                {
                    status: 404,
                    description: "Course not found",
                    example: { message: "Course not found" }
                }
            ]
        },
        {
            id: "update-faq",
            name: "Update FAQ",
            method: "PUT",
            url: "/course-faq/:id",
            description: "Update an existing FAQ by its ID.",
            parameters: [
                { name: "id", type: "string", required: true, inPath: true, description: "ID of the FAQ" },
                { name: "question", type: "string", required: true, description: "Updated question" },
                { name: "updated_by", type: "string", required: true, description: "ID of the user updating the FAQ" },
                { name: "updated_by_type", type: "string", required: false, description: "Updater type (admin/user)", example: "admin" }
            ],
            responses: [
                {
                    status: 200,
                    description: "FAQ updated successfully",
                    example: {
                        message: "FAQ updated successfully",
                        faq: {
                            id: 1,
                            question: "Updated question text",
                            updated_by: "1",
                            updated_by_type: "admin",
                            updated_at: "2025-05-16T10:30:00.000Z"
                        }
                    }
                },
                {
                    status: 404,
                    description: "FAQ not found",
                    example: { message: "FAQ not found" }
                }
            ]
        },
        {
            id: "delete-faq",
            name: "Delete FAQ",
            method: "DELETE",
            url: "/course-faq/:id",
            description: "Delete an FAQ by its ID.",
            parameters: [
                { name: "id", type: "string", required: true, inPath: true, description: "ID of the FAQ to delete" }
            ],
            responses: [
                {
                    status: 200,
                    description: "FAQ deleted successfully",
                    example: {
                        message: "FAQ deleted successfully",
                        deletedFAQ: {
                            id: 1,
                            question: "What is this course about?"
                        }
                    }
                },
                {
                    status: 404,
                    description: "FAQ not found",
                    example: { message: "FAQ not found" }
                }
            ]
        }
    ]
};

export default courseFAQData;
