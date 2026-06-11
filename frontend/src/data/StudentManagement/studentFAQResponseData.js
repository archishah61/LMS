const studentFAQResponseData = {
    id: 'student-faq-response',
    name: 'Student FAQ Response',
    description: 'The Student FAQ Response API provides endpoints to manage and retrieve student responses to course FAQs. These endpoints allow you to create responses and retrieve them by student, course, or all responses.',
    endpoints: [
        {
            id: 'get-all-faq-responses',
            name: 'Get All FAQ Responses',
            method: 'GET',
            url: '/student-faq-response/all',
            description: 'Get a list of all student FAQ responses in the system.',
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved all student FAQ responses',
                    example: [
                        {
                            "id": 1,
                            "user_id": 1,
                            "course_id": 1,
                            "faq_id": 2,
                            "selected_option_id": 5,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T06:57:52.000Z",
                            "updated_at": "2025-05-09T06:57:52.000Z",
                            "user_name": "John Doe",
                            "user_email": "john@example.com",
                            "course_title": "JavaScript Basics",
                            "faq_question": "What is your current programming level?",
                            "option_text": "Beginner"
                        }
                    ]
                },
                {
                    status: 400,
                    description: 'Error retrieving responses',
                    example: {
                        "success": false,
                        "message": "Error retrieving responses"
                    }
                }
            ]
        },
        {
            id: 'get-responses-by-student-id',
            name: 'Get Responses By Student ID',
            method: 'GET',
            url: '/student-faq-response/student/{user_id}',
            description: 'Get all FAQ responses for a specific student by their user ID.',
            parameters: [
                {
                    name: 'user_id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the student/user to retrieve responses for',
                    example: '1'
                }
            ],
            responses: [
                {
                    status: 201,
                    description: 'Successfully retrieved responses for the student',
                    example: [
                        {
                            "id": 1,
                            "user_id": 1,
                            "course_id": 1,
                            "faq_id": 2,
                            "selected_option_id": 5,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T06:57:52.000Z",
                            "updated_at": "2025-05-09T06:57:52.000Z",
                            "course_title": "JavaScript Basics",
                            "faq_question": "What is your current programming level?",
                            "option_text": "Beginner"
                        }
                    ]
                },
                {
                    status: 404,
                    description: 'No responses found for this student',
                    example: {
                        "success": false,
                        "message": "No FAQ responses found for this student"
                    }
                }
            ]
        },
        {
            id: 'get-responses-by-course-id',
            name: 'Get Responses By Course ID',
            method: 'GET',
            url: '/student-faq-response/course/{course_id}',
            description: 'Get all FAQ responses for a specific course by course ID.',
            parameters: [
                {
                    name: 'course_id',
                    type: 'string',
                    required: true,
                    inPath: true,
                    description: 'The ID of the course to retrieve responses for',
                    example: '1'
                }
            ],
            responses: [
                {
                    status: 202,
                    description: 'Successfully retrieved responses for the course',
                    example: [
                        {
                            "id": 1,
                            "user_id": 1,
                            "course_id": 1,
                            "faq_id": 2,
                            "selected_option_id": 5,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T07:03:32.000Z",
                            "updated_at": "2025-05-09T07:03:32.000Z",
                            "user_name": "John Doe",
                            "user_email": "john@example.com",
                            "faq_question": "What is your current programming level?",
                            "option_text": "Beginner"
                        }
                    ]
                },
                {
                    status: 404,
                    description: 'No responses found for this course',
                    example: {
                        "success": false,
                        "message": "No FAQ responses found for this course"
                    }
                }
            ]
        },
        {
            id: 'create-faq-response',
            name: 'Create FAQ Response',
            method: 'POST',
            url: '/student-faq-response/create',
            description: 'Create a new student FAQ response.',
            parameters: [
                {
                    name: 'user_id',
                    type: 'number',
                    required: true,
                    description: 'ID of the student/user submitting the response',
                    example: 1
                },
                {
                    name: 'course_id',
                    type: 'string',
                    required: true,
                    description: 'ID of the course the FAQ belongs to',
                    example: '60097fb94b'
                },
                {
                    name: 'faq_id',
                    type: 'number',
                    required: true,
                    description: 'ID of the FAQ being responded to',
                    example: 2
                },
                {
                    name: 'selected_option_id',
                    type: 'number',
                    required: true,
                    description: 'ID of the option selected by the student',
                    example: 5
                },
                {
                    name: 'created_by',
                    type: 'number',
                    required: true,
                    description: 'ID of the user creating the response (usually same as user_id)',
                    example: 1
                }
            ],
            responses: [
                {
                    status: 201,
                    description: 'Response saved successfully',
                    example: {
                        "message": "Response saved successfully",
                        "response": {
                            "id": 1
                        }
                    }
                },
                {
                    status: 400,
                    description: 'Validation error',
                    example: {
                        "success": false,
                        "message": "Missing required fields"
                    }
                },
                {
                    status: 404,
                    description: 'Invalid course reference',
                    example: {
                        "success": false,
                        "message": "Invalid course reference"
                    }
                }
            ]
        }
    ]
};

export default studentFAQResponseData;