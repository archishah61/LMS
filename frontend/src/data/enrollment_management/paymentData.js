const paymentData = {
    "id": "payment",
    "name": "Payment",
    "description": "The Payment API provides endpoints to manage payments in the system. These endpoints allow you to create, read, update, and delete payments.",
    "endpoints": [
        {
            "id": "get-all-payments",
            "name": "Get All Payments",
            "method": "GET",
            "url": "/enroll/payments",
            "description": "Get a list of all payments in the system.",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved all payments",
                    "example": [
                        {
                            "id": 1,
                            "enrollment_id": 1,
                            "amount": 90,
                            "currency": "USD",
                            "payment_method": "paypal",
                            "transaction_id": "139116068",
                            "reference_id": null,
                            "status": "completed",
                            "transaction_date": "2025-05-09T08:13:37.000Z",
                            "paypal_email": null,
                            "paypal_payer_id": null,
                            "created_by": 3,
                            "updated_by": 3,
                            "created_at": "2025-05-09T08:13:37.000Z",
                            "updated_at": "2025-05-09T08:13:37.000Z"
                        },
                        {
                            "id": 2,
                            "enrollment_id": 2,
                            "amount": 90,
                            "currency": "USD",
                            "payment_method": "paypal",
                            "transaction_id": "400807166",
                            "reference_id": null,
                            "status": "completed",
                            "transaction_date": "2025-05-09T09:56:59.000Z",
                            "paypal_email": null,
                            "paypal_payer_id": null,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T09:56:59.000Z",
                            "updated_at": "2025-05-09T09:56:59.000Z"
                        },
                        {
                            "id": 3,
                            "enrollment_id": 3,
                            "amount": 68,
                            "currency": "USD",
                            "payment_method": "paypal",
                            "transaction_id": "621645843",
                            "reference_id": null,
                            "status": "completed",
                            "transaction_date": "2025-05-09T09:57:18.000Z",
                            "paypal_email": null,
                            "paypal_payer_id": null,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T09:57:18.000Z",
                            "updated_at": "2025-05-09T09:57:18.000Z"
                        },
                        {
                            "id": 4,
                            "enrollment_id": 4,
                            "amount": 68,
                            "currency": "USD",
                            "payment_method": "paypal",
                            "transaction_id": "629716739",
                            "reference_id": null,
                            "status": "completed",
                            "transaction_date": "2025-05-09T10:27:36.000Z",
                            "paypal_email": null,
                            "paypal_payer_id": null,
                            "created_by": 3,
                            "updated_by": 3,
                            "created_at": "2025-05-09T10:27:36.000Z",
                            "updated_at": "2025-05-09T10:27:36.000Z"
                        },
                        {
                            "id": 6,
                            "enrollment_id": 1,
                            "amount": 100,
                            "currency": "USD",
                            "payment_method": "paypal",
                            "transaction_id": "TXN123456789",
                            "reference_id": "REF987654",
                            "status": "completed",
                            "transaction_date": "2025-05-09T10:35:09.000Z",
                            "paypal_email": "buyer@example.com",
                            "paypal_payer_id": "PAYERID123456",
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T10:35:09.000Z",
                            "updated_at": "2025-05-09T10:35:09.000Z"
                        }
                    ]
                }
            ]
        },
        {
            "id": "get-payments-by-user-id",
            "name": "Get Payments By User ID",
            "method": "GET",
            "url": "/enroll/payments/user/:user_hashId",
            "description": "Get all payments for a specific user by their user hash ID.",
            "parameters": [
                {
                    "name": "user_hashId",
                    "type": "string",
                    "required": true,
                    "inPath": true,
                    "description": "The user hash ID of the user to retrieve payments for",
                    "example": "938c43c82c"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the payments for the user",
                    "example": [
                        {
                            "payment_id": 2,
                            "enrollment_id": 2,
                            "amount": 90,
                            "currency": "USD",
                            "payment_method": "paypal",
                            "transaction_id": "400807166",
                            "reference_id": null,
                            "payment_status": "completed",
                            "transaction_date": "2025-05-09T09:56:59.000Z",
                            "paypal_email": null,
                            "paypal_payer_id": null,
                            "payment_created_by": 1,
                            "payment_updated_by": 1,
                            "payment_created_at": "2025-05-09T09:56:59.000Z",
                            "payment_updated_at": "2025-05-09T09:56:59.000Z",
                            "enrolled_user_id": 1,
                            "enrolled_course_id": 1,
                            "user_hash": "938c43c82c",
                            "enrollment_date": "2025-05-09T15:26:59.000Z",
                            "expiry_date": "2026-05-09T15:26:59.000Z",
                            "enrollment_status": "active",
                            "enrollment_created_by": null,
                            "enrollment_updated_by": null,
                            "enrollment_created_at": "2025-05-09T09:56:59.000Z",
                            "enrollment_updated_at": "2025-05-09T09:56:59.000Z",
                            "course_id": 1,
                            "public_hash": "60097fb94b",
                            "sequence": 1,
                            "course_title": "JavaScript Basics",
                            "course_description": "Learn the fundamentals of JavaScript. This course covers variables, data types, functions, and control structures. Gain hands-on experience through interactive exercises and real-world examples. Perfect for beginners looking to build a solid programming foundation.",
                            "category_id": 1,
                            "thumbnail": "/course/thumbnail/jsthumbnail.jpg",
                            "preview_video": "/course/preview_video/jspreviewVideo.mp4",
                            "course_price": "100.00",
                            "course_discount": 10,
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
                            "course_status": "published",
                            "min_access_hours": "1.00",
                            "max_access_hours": "3.00",
                            "course_created_by": 1,
                            "created_by_type": "admin",
                            "course_updated_by": 1,
                            "updated_by_type": "admin",
                            "course_created_at": "2025-05-09T07:13:42.000Z",
                            "course_updated_at": "2025-05-09T07:13:43.000Z"
                        },
                        {
                            "payment_id": 3,
                            "enrollment_id": 3,
                            "amount": 68,
                            "currency": "USD",
                            "payment_method": "paypal",
                            "transaction_id": "621645843",
                            "reference_id": null,
                            "payment_status": "completed",
                            "transaction_date": "2025-05-09T09:57:18.000Z",
                            "paypal_email": null,
                            "paypal_payer_id": null,
                            "payment_created_by": 1,
                            "payment_updated_by": 1,
                            "payment_created_at": "2025-05-09T09:57:18.000Z",
                            "payment_updated_at": "2025-05-09T09:57:18.000Z",
                            "enrolled_user_id": 1,
                            "enrolled_course_id": 2,
                            "user_hash": "8bf2ac85e2",
                            "enrollment_date": "2025-05-09T15:27:18.000Z",
                            "expiry_date": "2026-05-09T15:27:18.000Z",
                            "enrollment_status": "active",
                            "enrollment_created_by": null,
                            "enrollment_updated_by": null,
                            "enrollment_created_at": "2025-05-09T09:57:18.000Z",
                            "enrollment_updated_at": "2025-05-09T09:57:18.000Z",
                            "course_id": 2,
                            "public_hash": "02e1dea0fa",
                            "sequence": 2,
                            "course_title": "Human Body & Anatomy Basics",
                            "course_description": "Explore the fascinating structure of the human body! This course covers the skeletal system, circulatory system, nervous system, and more. Ideal for students, health enthusiasts, and anyone curious about how the body works.",
                            "category_id": 4,
                            "thumbnail": "/course/thumbnail/human_anatomy_course_thumb.jpeg",
                            "preview_video": "/course/preview_video/human_anatomy1.mp4",
                            "course_price": "80.00",
                            "course_discount": 15,
                            "duration_hours": 6,
                            "expiry_days": 120,
                            "what_you_will_learn": [
                                "Human Organ Systems",
                                "Functions of Major Organs",
                                "Body Structure & Anatomy Terms"
                            ],
                            "prerequisites": [
                                "Basic Biology"
                            ],
                            "hashtags": [
                                "#anatomy",
                                "#humanbody"
                            ],
                            "embedding": [
                                0,
                                0,
                                0
                            ],
                            "course_status": "published",
                            "min_access_hours": "1.00",
                            "max_access_hours": "3.00",
                            "course_created_by": 1,
                            "created_by_type": "admin",
                            "course_updated_by": 1,
                            "updated_by_type": "admin",
                            "course_created_at": "2025-05-09T07:13:43.000Z",
                            "course_updated_at": "2025-05-09T07:13:43.000Z"
                        }
                    ]
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
            "id": "get-payment-by-id",
            "name": "Get Payment By ID",
            "method": "GET",
            "url": "/enroll/payments/:id",
            "description": "Get a specific payment by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the payment to retrieve",
                    "example": "2"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the payment",
                    "example": {
                        "id": 2,
                        "enrollment_id": 2,
                        "amount": 90,
                        "currency": "USD",
                        "payment_method": "paypal",
                        "transaction_id": "400807166",
                        "reference_id": null,
                        "status": "completed",
                        "transaction_date": "2025-05-09T09:56:59.000Z",
                        "paypal_email": null,
                        "paypal_payer_id": null,
                        "created_by": 1,
                        "updated_by": 1,
                        "created_at": "2025-05-09T09:56:59.000Z",
                        "updated_at": "2025-05-09T09:56:59.000Z"
                    }
                },
                {
                    "status": 404,
                    "description": "Payment not found",
                    "example": {
                        "success": false,
                        "message": "Payment not found"
                    }
                }
            ]
        },
        {
            "id": "create-payment",
            "name": "Create Payment",
            "method": "POST",
            "url": "/enroll/payments/",
            "description": "Create a new payment in the system.",
            "parameters": [
                {
                    "name": "enrollment_id",
                    "type": "number",
                    "required": true,
                    "description": "ID of the enrollment associated with the payment",
                    "example": 1
                },
                {
                    "name": "amount",
                    "type": "number",
                    "required": true,
                    "description": "Amount of the payment",
                    "example": 100
                },
                {
                    "name": "currency",
                    "type": "string",
                    "required": true,
                    "description": "Currency of the payment",
                    "example": "USD"
                },
                {
                    "name": "payment_method",
                    "type": "string",
                    "required": true,
                    "description": "Method of payment",
                    "example": "paypal"
                },
                {
                    "name": "userId",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user making the payment",
                    "example": 1
                },
                {
                    "name": "transactionId",
                    "type": "string",
                    "required": true,
                    "description": "Transaction ID of the payment",
                    "example": "TXN123456789"
                },
                {
                    "name": "reference_id",
                    "type": "string",
                    "required": false,
                    "description": "Reference ID of the payment",
                    "example": "REF987654"
                },
                {
                    "name": "paypal_email",
                    "type": "string",
                    "required": false,
                    "description": "PayPal email associated with the payment",
                    "example": "buyer@example.com"
                },
                {
                    "name": "paypal_payer_id",
                    "type": "string",
                    "required": false,
                    "description": "PayPal payer ID associated with the payment",
                    "example": "PAYERID123456"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Payment created successfully",
                    "example": {
                        "success": true,
                        "data": [
                            {
                                "id": 6,
                                "enrollment_id": 1,
                                "amount": 100,
                                "currency": "USD",
                                "payment_method": "paypal",
                                "transaction_id": "TXN123456789",
                                "reference_id": "REF987654",
                                "status": "completed",
                                "transaction_date": "2025-05-09T10:35:09.000Z",
                                "paypal_email": "buyer@example.com",
                                "paypal_payer_id": "PAYERID123456",
                                "created_by": 1,
                                "updated_by": 1,
                                "created_at": "2025-05-09T10:35:09.000Z",
                                "updated_at": "2025-05-09T10:35:09.000Z"
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
            "id": "update-payment",
            "name": "Update Payment",
            "method": "PUT",
            "url": "/enroll/payments/:id",
            "description": "Update an existing payment by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the payment to update",
                    "example": "2"
                },
                {
                    "name": "enrollment_id",
                    "type": "number",
                    "required": false,
                    "description": "Updated ID of the enrollment associated with the payment",
                    "example": 456
                },
                {
                    "name": "amount",
                    "type": "number",
                    "required": false,
                    "description": "Updated amount of the payment",
                    "example": 150.75
                },
                {
                    "name": "payment_status",
                    "type": "string",
                    "required": false,
                    "description": "Updated status of the payment",
                    "example": "completed"
                },
                {
                    "name": "payment_method",
                    "type": "string",
                    "required": false,
                    "description": "Updated method of payment",
                    "example": "paypal"
                },
                {
                    "name": "transaction_id",
                    "type": "string",
                    "required": false,
                    "description": "Updated transaction ID of the payment",
                    "example": "TXN987654321"
                },
                {
                    "name": "payment_date",
                    "type": "string",
                    "required": false,
                    "description": "Updated date of the payment",
                    "example": "2025-05-09"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Payment updated successfully",
                    "example": {
                        "id": 2,
                        "enrollment_id": 2,
                        "amount": 150.75,
                        "currency": "USD",
                        "payment_method": "paypal",
                        "transaction_id": "400807166",
                        "reference_id": null,
                        "status": "completed",
                        "transaction_date": "2025-05-09T09:56:59.000Z",
                        "paypal_email": null,
                        "paypal_payer_id": null,
                        "created_by": 1,
                        "updated_by": null,
                        "created_at": "2025-05-09T09:56:59.000Z",
                        "updated_at": "2025-05-09T10:50:04.000Z"
                    }
                },
                {
                    "status": 404,
                    "description": "Payment not found",
                    "example": {
                        "success": false,
                        "message": "Payment not found"
                    }
                }
            ]
        },
        {
            "id": "delete-payment",
            "name": "Delete Payment",
            "method": "DELETE",
            "url": "/enroll/payments/:id",
            "description": "Delete a payment by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the payment to delete",
                    "example": "2"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Payment deleted successfully",
                    "example": {
                        "success": true,
                        "message": "Payment Deleted Successfully"
                    }
                },
                {
                    "status": 404,
                    "description": "Payment not found",
                    "example": {
                        "success": false,
                        "message": "Payment not found"
                    }
                }
            ]
        }
    ]
};

export default paymentData;
