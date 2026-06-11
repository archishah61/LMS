const assignmentData = {
    "id": "assignment",
    "name": "Assignment",
    "description": "The Assignment API provides endpoints to manage assignments in the system. These endpoints allow you to create, read, update, and manage assignments.",
    "endpoints": [
        {
            "id": "create-assignment",
            "name": "Create Assignment",
            "method": "POST",
            "url": "/assignments/create",
            "description": "Create a new assignment in the system.",
            "parameters": [
                {
                    "name": "module_id",
                    "type": "string",
                    "required": true,
                    "description": "ID of the module the assignment belongs to",
                    "example": "60097fb94b"
                },
                {
                    "name": "title",
                    "type": "string",
                    "required": true,
                    "description": "Title of the assignment",
                    "example": "new assignment 2"
                },
                {
                    "name": "description",
                    "type": "string",
                    "required": true,
                    "description": "Description of the assignment",
                    "example": "<p>new assignment 2</p>"
                },
                {
                    "name": "due_date",
                    "type": "string",
                    "required": true,
                    "description": "Due date of the assignment",
                    "example": "2025-05-09T14:32"
                },
                {
                    "name": "max_score",
                    "type": "string",
                    "required": true,
                    "description": "Maximum score for the assignment",
                    "example": "20000"
                },
                {
                    "name": "status",
                    "type": "string",
                    "required": true,
                    "description": "Status of the assignment",
                    "example": "active"
                },
                {
                    "name": "assignmentFile",
                    "type": "string",
                    "required": false,
                    "description": "File associated with the assignment",
                    "example": "null"
                },
                {
                    "name": "created_by",
                    "type": "string",
                    "required": true,
                    "description": "ID of the user creating the assignment",
                    "example": "1"
                },
                {
                    "name": "updated_by",
                    "type": "string",
                    "required": true,
                    "description": "ID of the user updating the assignment",
                    "example": "1"
                },
                {
                    "name": "category",
                    "type": "string",
                    "required": true,
                    "description": "Category of the assignment",
                    "example": "regular"
                },
                {
                    "name": "created_by_type",
                    "type": "string",
                    "required": true,
                    "description": "Type of user creating the assignment",
                    "example": "admin"
                },
                {
                    "name": "updated_by_type",
                    "type": "string",
                    "required": true,
                    "description": "Type of user updating the assignment",
                    "example": "admin"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Assignment created successfully",
                    "example": {
                        "success": true,
                        "message": "Assignment created successfully!",
                        "assignment": {
                            "id": 21,
                            "module_id": 1,
                            "title": "new assignment 2",
                            "description": "<p>new assignment 2</p>",
                            "file": null,
                            "due_date": "2025-05-09T14:50:00.000Z",
                            "max_score": 20,
                            "status": "active",
                            "category": "regular",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:21:02.000Z",
                            "updated_at": "2025-05-09T09:21:02.000Z"
                        }
                    }
                }
            ]
        },
        {
            "id": "get-all-assignments",
            "name": "Get All Assignments",
            "method": "GET",
            "url": "/assignments/",
            "description": "Get a list of all assignments in the system.",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved all assignments",
                    "example": [
                        {
                            "id": 21,
                            "module_id": 1,
                            "title": "new assignment 2",
                            "description": "<p>new assignment 2</p>",
                            "file": null,
                            "due_date": "2025-05-09T14:50:00.000Z",
                            "max_score": 20,
                            "status": "active",
                            "category": "regular",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:21:02.000Z",
                            "updated_at": "2025-05-09T09:21:02.000Z"
                        },
                        {
                            "id": 4,
                            "module_id": 1,
                            "title": "Fill in the Blanks - Variables",
                            "description": "Complete the sentences about variables",
                            "file": null,
                            "due_date": "2025-05-13T09:04:55.000Z",
                            "max_score": 40,
                            "status": "active",
                            "category": "fill_in_the_blanks",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z"
                        },
                        {
                            "id": 9,
                            "module_id": 2,
                            "title": "Fill in the Blanks - Functions",
                            "description": "Complete the sentences about functions",
                            "file": null,
                            "due_date": "2025-05-13T09:04:55.000Z",
                            "max_score": 40,
                            "status": "active",
                            "category": "fill_in_the_blanks",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z"
                        },
                        {
                            "id": 14,
                            "module_id": 3,
                            "title": "Fill in the Blanks - Bones",
                            "description": "Complete the sentences about the skeletal system",
                            "file": null,
                            "due_date": "2025-05-13T09:04:55.000Z",
                            "max_score": 40,
                            "status": "active",
                            "category": "fill_in_the_blanks",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z"
                        },
                        {
                            "id": 19,
                            "module_id": 4,
                            "title": "Fill in the Blanks - Respiration",
                            "description": "Complete the sentences about the respiratory system",
                            "file": null,
                            "due_date": "2025-05-13T09:04:55.000Z",
                            "max_score": 40,
                            "status": "active",
                            "category": "fill_in_the_blanks",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z"
                        },
                        {
                            "id": 2,
                            "module_id": 1,
                            "title": "Data Types Matching",
                            "description": "Match JavaScript data types with their examples",
                            "file": null,
                            "due_date": "2025-05-14T09:04:55.000Z",
                            "max_score": 50,
                            "status": "active",
                            "category": "matching",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z"
                        },
                        {
                            "id": 7,
                            "module_id": 2,
                            "title": "Function Types Matching",
                            "description": "Match function types with their examples",
                            "file": null,
                            "due_date": "2025-05-14T09:04:55.000Z",
                            "max_score": 50,
                            "status": "active",
                            "category": "matching",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z"
                        },
                        {
                            "id": 12,
                            "module_id": 3,
                            "title": "Bone Types Matching",
                            "description": "Match bone types with their examples",
                            "file": null,
                            "due_date": "2025-05-14T09:04:55.000Z",
                            "max_score": 50,
                            "status": "active",
                            "category": "matching",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z"
                        },
                        {
                            "id": 17,
                            "module_id": 4,
                            "title": "Circulatory System Matching",
                            "description": "Match circulatory system components with their functions",
                            "file": null,
                            "due_date": "2025-05-14T09:04:55.000Z",
                            "max_score": 50,
                            "status": "active",
                            "category": "matching",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z"
                        },
                        {
                            "id": 3,
                            "module_id": 1,
                            "title": "Variables True/False",
                            "description": "Test your knowledge of variables with true/false questions",
                            "file": null,
                            "due_date": "2025-05-15T09:04:55.000Z",
                            "max_score": 30,
                            "status": "active",
                            "category": "true_false",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z"
                        },
                        {
                            "id": 8,
                            "module_id": 2,
                            "title": "Scope True/False",
                            "description": "Test your knowledge of scope with true/false questions",
                            "file": null,
                            "due_date": "2025-05-15T09:04:55.000Z",
                            "max_score": 30,
                            "status": "active",
                            "category": "true_false",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z"
                        },
                        {
                            "id": 13,
                            "module_id": 3,
                            "title": "Skeletal System True/False",
                            "description": "Test your knowledge of bones with true/false questions",
                            "file": null,
                            "due_date": "2025-05-15T09:04:55.000Z",
                            "max_score": 30,
                            "status": "active",
                            "category": "true_false",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z"
                        },
                        {
                            "id": 18,
                            "module_id": 4,
                            "title": "Respiratory System True/False",
                            "description": "Test your knowledge of breathing with true/false questions",
                            "file": null,
                            "due_date": "2025-05-15T09:04:55.000Z",
                            "max_score": 30,
                            "status": "active",
                            "category": "true_false",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z"
                        },
                        {
                            "id": 1,
                            "module_id": 1,
                            "title": "Variables Assignment",
                            "description": "Practice working with variables in JavaScript",
                            "file": "/assignments/file/js-cheatsheet.pdf",
                            "due_date": "2025-05-16T09:04:55.000Z",
                            "max_score": 100,
                            "status": "active",
                            "category": "regular",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z"
                        },
                        {
                            "id": 6,
                            "module_id": 2,
                            "title": "Functions Assignment",
                            "description": "Practice writing functions in JavaScript",
                            "file": "/assignments/js-cheatsheet.pdf",
                            "due_date": "2025-05-16T09:04:55.000Z",
                            "max_score": 100,
                            "status": "active",
                            "category": "regular",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z"
                        },
                        {
                            "id": 11,
                            "module_id": 3,
                            "title": "Label the Human Skeleton",
                            "description": "Identify major bones in a diagram",
                            "file": "/assignments/file/anatomy_cheatsheet.pdf",
                            "due_date": "2025-05-16T09:04:55.000Z",
                            "max_score": 100,
                            "status": "active",
                            "category": "regular",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z"
                        },
                        {
                            "id": 16,
                            "module_id": 4,
                            "title": "Heart Diagram Assignment",
                            "description": "Label the parts of the heart",
                            "file": "/assignments/file/heart_anatomy.pdf",
                            "due_date": "2025-05-16T09:04:55.000Z",
                            "max_score": 100,
                            "status": "active",
                            "category": "regular",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z"
                        },
                        {
                            "id": 5,
                            "module_id": 1,
                            "title": "Variables Essay",
                            "description": "Write a paragraph explaining variables in JavaScript",
                            "file": null,
                            "due_date": "2025-05-17T09:04:55.000Z",
                            "max_score": 50,
                            "status": "active",
                            "category": "paragraph_writing",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z"
                        },
                        {
                            "id": 10,
                            "module_id": 2,
                            "title": "Functions Essay",
                            "description": "Write a paragraph explaining functions in JavaScript",
                            "file": null,
                            "due_date": "2025-05-17T09:04:55.000Z",
                            "max_score": 50,
                            "status": "active",
                            "category": "paragraph_writing",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z"
                        },
                        {
                            "id": 15,
                            "module_id": 3,
                            "title": "Skeletal System Essay",
                            "description": "Write a paragraph explaining the functions of the skeletal system",
                            "file": null,
                            "due_date": "2025-05-17T09:04:55.000Z",
                            "max_score": 50,
                            "status": "active",
                            "category": "paragraph_writing",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z"
                        },
                        {
                            "id": 20,
                            "module_id": 4,
                            "title": "Circulatory System Essay",
                            "description": "Write a paragraph explaining how blood circulates through the body",
                            "file": null,
                            "due_date": "2025-05-17T09:04:55.000Z",
                            "max_score": 50,
                            "status": "active",
                            "category": "paragraph_writing",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z"
                        }
                    ]
                }
            ]
        },
        {
            "id": "get-assignments-by-module-id",
            "name": "Get Assignments By Module ID",
            "method": "GET",
            "url": "/assignments/module/:id",
            "description": "Get a list of assignments by module ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the module to retrieve assignments for",
                    "example": "1"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved assignments by module ID",
                    "example": [
                        {
                            "id": 21,
                            "module_id": 1,
                            "title": "new assignment 2",
                            "description": "<p>new assignment 2</p>",
                            "file": null,
                            "due_date": "2025-05-09T14:50:00.000Z",
                            "max_score": 20,
                            "status": "active",
                            "category": "regular",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:21:02.000Z",
                            "updated_at": "2025-05-09T09:21:02.000Z",
                            "TrueFalseQuestions": [],
                            "MatchingQuestions": [],
                            "ParagraphWritings": [],
                            "FillTheBlanksQuestions": []
                        },
                        {
                            "id": 4,
                            "module_id": 1,
                            "title": "Fill in the Blanks - Variables",
                            "description": "Complete the sentences about variables",
                            "file": null,
                            "due_date": "2025-05-13T09:04:55.000Z",
                            "max_score": 40,
                            "status": "active",
                            "category": "fill_in_the_blanks",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z",
                            "TrueFalseQuestions": [],
                            "MatchingQuestions": [],
                            "ParagraphWritings": [],
                            "FillTheBlanksQuestions": [
                                {
                                    "id": 1,
                                    "answer": [
                                        "const"
                                    ],
                                    "sentence": "The _____ keyword is used to declare a constant variable",
                                    "question_text": "The _____ keyword is used to declare a constant variable",
                                    "answers": [
                                        "const"
                                    ]
                                },
                                {
                                    "id": 2,
                                    "answer": [
                                        "var"
                                    ],
                                    "sentence": "Variables declared with _____ are function-scoped",
                                    "question_text": "Variables declared with _____ are function-scoped",
                                    "answers": [
                                        "var"
                                    ]
                                }
                            ]
                        },
                        {
                            "id": 2,
                            "module_id": 1,
                            "title": "Data Types Matching",
                            "description": "Match JavaScript data types with their examples",
                            "file": null,
                            "due_date": "2025-05-14T09:04:55.000Z",
                            "max_score": 50,
                            "status": "active",
                            "category": "matching",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z",
                            "TrueFalseQuestions": [],
                            "MatchingQuestions": [
                                {
                                    "id": 1,
                                    "question": "Match the data types with their examples",
                                    "MatchingOptions": [
                                        {
                                            "id": 1,
                                            "match": "42",
                                            "option": "Number",
                                            "match_type": "text",
                                            "option_type": "text",
                                            "option_text": "Number",
                                            "match_text": "42"
                                        },
                                        {
                                            "id": 2,
                                            "match": "'hello'",
                                            "option": "String",
                                            "match_type": "text",
                                            "option_type": "text",
                                            "option_text": "String",
                                            "match_text": "'hello'"
                                        },
                                        {
                                            "id": 3,
                                            "match": "true",
                                            "option": "Boolean",
                                            "match_type": "text",
                                            "option_type": "text",
                                            "option_text": "Boolean",
                                            "match_text": "true"
                                        }
                                    ]
                                }
                            ],
                            "ParagraphWritings": [],
                            "FillTheBlanksQuestions": []
                        },
                        {
                            "id": 3,
                            "module_id": 1,
                            "title": "Variables True/False",
                            "description": "Test your knowledge of variables with true/false questions",
                            "file": null,
                            "due_date": "2025-05-15T09:04:55.000Z",
                            "max_score": 30,
                            "status": "active",
                            "category": "true_false",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z",
                            "TrueFalseQuestions": [],
                            "MatchingQuestions": [],
                            "ParagraphWritings": [],
                            "FillTheBlanksQuestions": []
                        },
                        {
                            "id": 1,
                            "module_id": 1,
                            "title": "Variables Assignment",
                            "description": "Practice working with variables in JavaScript",
                            "file": "/assignments/file/js-cheatsheet.pdf",
                            "due_date": "2025-05-16T09:04:55.000Z",
                            "max_score": 100,
                            "status": "active",
                            "category": "regular",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z",
                            "TrueFalseQuestions": [],
                            "MatchingQuestions": [],
                            "ParagraphWritings": [],
                            "FillTheBlanksQuestions": []
                        },
                        {
                            "id": 5,
                            "module_id": 1,
                            "title": "Variables Essay",
                            "description": "Write a paragraph explaining variables in JavaScript",
                            "file": null,
                            "due_date": "2025-05-17T09:04:55.000Z",
                            "max_score": 50,
                            "status": "active",
                            "category": "paragraph_writing",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:05:21.000Z",
                            "updated_at": "2025-05-09T09:05:21.000Z",
                            "TrueFalseQuestions": [],
                            "MatchingQuestions": [],
                            "ParagraphWritings": [
                                {
                                    "id": 1,
                                    "prompt": "Explain the difference between let, const and var in JavaScript",
                                    "paragraph": "Explain the difference between let, const and var in JavaScript"
                                }
                            ],
                            "FillTheBlanksQuestions": []
                        }
                    ]
                }
            ]
        },
        {
            "id": "get-assignment-by-id",
            "name": "Get Assignment By ID",
            "method": "GET",
            "url": "/assignments/:id",
            "description": "Get a specific assignment by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the assignment to retrieve",
                    "example": "11"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the assignment",
                    "example": {
                        "assignment": {
                            "id": 11,
                            "module_id": 3,
                            "title": "Label the Human Skeleton",
                            "description": "Identify major bones in a diagram",
                            "file": "/assignments/file/anatomy_cheatsheet.pdf",
                            "due_date": "2025-05-16T09:24:09.000Z",
                            "max_score": 100,
                            "status": "active",
                            "category": "regular",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:24:35.000Z",
                            "updated_at": "2025-05-09T09:24:35.000Z"
                        },
                        "matchingQuestions": [],
                        "trueFalseQuestions": [],
                        "fillTheBlanksQuestions": [],
                        "paragraphWritings": []
                    }
                },
                {
                    "status": 404,
                    "description": "Assignment not found",
                    "example": {
                        "success": false,
                        "message": "Assignment not found"
                    }
                }
            ]
        },
        {
            "id": "update-assignment",
            "name": "Update Assignment",
            "method": "PUT",
            "url": "/assignments/update/:id",
            "description": "Update an existing assignment by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the assignment to update",
                    "example": "4"
                },
                {
                    "name": "title",
                    "type": "string",
                    "required": false,
                    "description": "Updated title of the assignment",
                    "example": "Updated Assignment Title"
                },
                {
                    "name": "description",
                    "type": "string",
                    "required": false,
                    "description": "Updated description of the assignment",
                    "example": "<p>This is an updated assignment description.</p>"
                },
                {
                    "name": "due_date",
                    "type": "string",
                    "required": false,
                    "description": "Updated due date of the assignment",
                    "example": "2025-05-15T14:32:00"
                },
                {
                    "name": "max_score",
                    "type": "number",
                    "required": false,
                    "description": "Updated maximum score for the assignment",
                    "example": 150
                },
                {
                    "name": "status",
                    "type": "string",
                    "required": false,
                    "description": "Updated status of the assignment",
                    "example": "active"
                },
                {
                    "name": "category",
                    "type": "string",
                    "required": false,
                    "description": "Updated category of the assignment",
                    "example": "regular"
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user updating the assignment",
                    "example": 1
                },
                {
                    "name": "updated_by_type",
                    "type": "string",
                    "required": true,
                    "description": "Type of user updating the assignment",
                    "example": "admin"
                },
                {
                    "name": "matching_questions",
                    "type": "array",
                    "required": false,
                    "description": "Updated matching questions for the assignment",
                    "example": [
                        {
                            "question_id": 1,
                            "question_text": "Updated Matching Question 1",
                            "MatchingOptions": [
                                {
                                    "option_id": 1,
                                    "option_text": "Option 1",
                                    "match_text": "Match 1"
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "true_false_questions",
                    "type": "array",
                    "required": false,
                    "description": "Updated true/false questions for the assignment",
                    "example": [
                        {
                            "question_id": 1,
                            "question_text": "Updated True/False Question 1",
                            "correct_answer": true
                        }
                    ]
                },
                {
                    "name": "fill_the_blanks_questions",
                    "type": "array",
                    "required": false,
                    "description": "Updated fill in the blanks questions for the assignment",
                    "example": [
                        {
                            "question_id": 1,
                            "question_text": "This is an updated fill in the blanks question with ______."
                        }
                    ]
                },
                {
                    "name": "paragraph_prompt",
                    "type": "string",
                    "required": false,
                    "description": "Updated paragraph writing prompt for the assignment",
                    "example": "This is an updated paragraph writing prompt."
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Assignment updated successfully",
                    "example": {
                        "success": true,
                        "message": "Assignment updated successfully!",
                        "assignment": {
                            "id": 4,
                            "module_id": 1,
                            "title": "Updated Assignment Title",
                            "description": "<p>This is an updated assignment description.</p>",
                            "file": null,
                            "due_date": "2025-05-15T09:02:00.000Z",
                            "max_score": 150,
                            "status": "active",
                            "category": "regular",
                            "created_by": 1,
                            "created_by_type": "admin",
                            "updated_by": 1,
                            "updated_by_type": "admin",
                            "created_at": "2025-05-09T09:24:35.000Z",
                            "updated_at": "2025-05-09T09:26:27.000Z"
                        }
                    }
                },
                {
                    "status": 404,
                    "description": "Assignment not found",
                    "example": {
                        "success": false,
                        "message": "Assignment not found"
                    }
                }
            ]
        }
    ]
};

export default assignmentData;
