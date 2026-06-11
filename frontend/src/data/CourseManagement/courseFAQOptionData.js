const courseFAQOptionData = {
    id: "course-faq-option",
    name: "Course FAQ Option",
    description: "The Course FAQ Option API provides endpoints to manage answer options for each course FAQ. These endpoints support creating, retrieving, updating, and deleting options.",
    endpoints: [
        {
            id: "create-faq-options",
            name: "Create FAQ Options",
            method: "POST",
            url: "/course-faq-option/",
            description: "Create one or more answer options for a specific FAQ.",
            parameters: [
                { name: "faq_id", type: "string", required: true, description: "ID of the FAQ question" },
                { name: "options", type: "array", required: true, description: "Array of string options" }
            ],
            responses: [
                {
                    status: 201,
                    description: "FAQ options created successfully",
                    example: {
                        message: "FAQ options created successfully",
                        options: [
                            { id: 1, faq_id: "123", option_text: "Option A" },
                            { id: 2, faq_id: "123", option_text: "Option B" }
                        ]
                    }
                },
                {
                    status: 404,
                    description: "FAQ question not found",
                    example: { message: "FAQ question not found" }
                }
            ]
        },
        {
            id: "get-all-faq-options",
            name: "Get All FAQ Options",
            method: "GET",
            url: "/course-faq-option/",
            description: "Retrieve all available FAQ options.",
            responses: [
                {
                    status: 200,
                    description: "All FAQ options retrieved successfully",
                    example: [
                        { id: 1, faq_id: "123", option_text: "Option A" },
                        { id: 2, faq_id: "123", option_text: "Option B" }
                    ]
                }
            ]
        },
        {
            id: "get-faq-options-by-faq-id",
            name: "Get FAQ Options by FAQ ID",
            method: "GET",
            url: "/course-faq-option/faq/:faq_id",
            description: "Retrieve all options for a specific FAQ.",
            parameters: [
                { name: "faq_id", type: "string", required: true, inPath: true, description: "ID of the FAQ" }
            ],
            responses: [
                {
                    status: 200,
                    description: "Options retrieved successfully",
                    example: [
                        { id: 1, faq_id: "123", option_text: "Option A" },
                        { id: 2, faq_id: "123", option_text: "Option B" }
                    ]
                }
            ]
        },
        {
            id: "get-faq-options-by-faq-ids",
            name: "Get Options by Multiple FAQ IDs",
            method: "POST",
            url: "/course-faq-option/faq-options/bulk",
            description: "Retrieve FAQ options in bulk by providing an array of FAQ IDs.",
            parameters: [
                { name: "faq_ids", type: "array", required: true, description: "Array of FAQ IDs" }
            ],
            responses: [
                {
                    status: 200,
                    description: "Options for multiple FAQs retrieved successfully",
                    example: [
                        { faq_id: "123", option_text: "Option A" },
                        { faq_id: "124", option_text: "Option B" }
                    ]
                },
                {
                    status: 400,
                    description: "Invalid or empty FAQ ID list",
                    example: { message: "Invalid or empty FAQ ID list" }
                }
            ]
        },
        {
            id: "update-faq-option",
            name: "Update FAQ Option",
            method: "PUT",
            url: "/course-faq-option/:id",
            description: "Update a specific FAQ option by its ID.",
            parameters: [
                { name: "id", type: "string", required: true, inPath: true, description: "ID of the option to update" },
                { name: "option_text", type: "string", required: true, description: "Updated option text" }
            ],
            responses: [
                {
                    status: 200,
                    description: "FAQ option updated successfully",
                    example: {
                        message: "FAQ option updated successfully",
                        option: {
                            id: "1",
                            faq_id: "123",
                            option_text: "Updated Option"
                        }
                    }
                },
                {
                    status: 404,
                    description: "FAQ option not found",
                    example: { message: "FAQ option not found" }
                }
            ]
        },
        {
            id: "delete-faq-option",
            name: "Delete FAQ Option",
            method: "DELETE",
            url: "/course-faq-option/:id",
            description: "Delete a specific FAQ option by its ID.",
            parameters: [
                { name: "id", type: "string", required: true, inPath: true, description: "ID of the FAQ option" }
            ],
            responses: [
                {
                    status: 200,
                    description: "FAQ option deleted successfully",
                    example: {
                        message: "FAQ option deleted successfully"
                    }
                },
                {
                    status: 404,
                    description: "FAQ option not found",
                    example: { message: "FAQ option not found" }
                }
            ]
        }
    ]
};

export default courseFAQOptionData;
