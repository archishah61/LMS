const summarizePassageData = {
    "id": "summarize-passage",
    "name": "Summarize Passage",
    "description": "The Summarize Passage API provides endpoints to manage summarize passage questions in the system. These endpoints allow you to create, read, update, and delete summarize passage questions.",
    "endpoints": [
        {
            "id": "get-all-summarize-passage-questions",
            "name": "Get All Summarize Passage Questions",
            "method": "GET",
            "url": "/summary/",
            "description": "Get a list of all summarize passage questions in the system.",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved all summarize passage questions",
                    "example": [
                        {
                            "id": 1,
                            "quiz_id": 1,
                            "summary": "Coral reefs provide shelter and food to countless marine species and support the livelihoods of millions of people around the world.Coral reefs are often referred to as the rainforests of the sea because of their incredible biodiversity.These underwater ecosystems are formed by colonies of coral polyps held together by calcium carbonate.Climate change has led to widespread coral bleaching, putting entire reef systems at risk.",
                            "time_limit": 6,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T09:52:30.000Z",
                            "updated_at": "2025-05-09T09:52:30.000Z",
                            "quiz_title": "JS Basics Quiz"
                        },
                        {
                            "id": 5,
                            "quiz_id": 1,
                            "summary": "Summarize the following passage about the importance of renewable energy in today's world.",
                            "time_limit": 10,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T10:05:48.000Z",
                            "updated_at": "2025-05-09T10:05:48.000Z",
                            "quiz_title": "JS Basics Quiz"
                        },
                        {
                            "id": 2,
                            "quiz_id": 2,
                            "summary": "Sea turtles are ancient reptiles that have existed for over 100 million years.Efforts to conserve sea turtles include beach protection programs, artificial hatcheries, and international regulations that reduce bycatch.Unfortunately, sea turtle populations are in decline due to habitat loss, climate change, plastic pollution, and accidental capture in fishing gear.",
                            "time_limit": 6,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T09:52:30.000Z",
                            "updated_at": "2025-05-09T09:52:30.000Z",
                            "quiz_title": "Functions & Scope Quiz"
                        },
                        {
                            "id": 3,
                            "quiz_id": 3,
                            "summary": "The human respiratory system enables breathing and gas exchange.Proper functioning of this system is vital for maintaining cellular respiration and overall health.",
                            "time_limit": 6,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T09:52:31.000Z",
                            "updated_at": "2025-05-09T09:52:31.000Z",
                            "quiz_title": "Human Skeleton Quiz"
                        },
                        {
                            "id": 4,
                            "quiz_id": 4,
                            "summary": "The digestive system breaks down food into nutrients, which the body uses for energy, growth, and repair.Enzymes and stomach acids help process food, and undigested waste exits the body as feces.Starting from the mouth and ending at the intestines, the digestive tract plays a key role in nutrient absorption.",
                            "time_limit": 6,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T09:52:31.000Z",
                            "updated_at": "2025-05-09T09:52:31.000Z",
                            "quiz_title": "Circulatory & Respiratory Quiz"
                        }
                    ]
                }
            ]
        },
        {
            "id": "get-summarize-passage-questions-by-quiz-id",
            "name": "Get Summarize Passage Questions by Quiz ID",
            "method": "GET",
            "url": "/summary/quiz/:quiz_id",
            "description": "Get a list of summarize passage questions by quiz ID.",
            "parameters": [
                {
                    "name": "quiz_id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the quiz to retrieve summarize passage questions",
                    "example": "2"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved summarize passage questions by quiz ID",
                    "example": [
                        {
                            "id": 2,
                            "quiz_id": 2,
                            "summary": "Sea turtles are ancient reptiles that have existed for over 100 million years.Efforts to conserve sea turtles include beach protection programs, artificial hatcheries, and international regulations that reduce bycatch.Unfortunately, sea turtle populations are in decline due to habitat loss, climate change, plastic pollution, and accidental capture in fishing gear.",
                            "time_limit": 6,
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T09:52:30.000Z",
                            "updated_at": "2025-05-09T09:52:30.000Z"
                        }
                    ]
                },
                {
                    "status": 404,
                    "description": "Summarize passage questions not found",
                    "example": {
                        "success": false,
                        "message": "Summarize passage questions not found"
                    }
                }
            ]
        },
        {
            "id": "create-summarize-passage-question",
            "name": "Create Summarize Passage Question",
            "method": "POST",
            "url": "/summary/create",
            "description": "Create a new summarize passage question in the system.",
            "parameters": [
                {
                    "name": "quiz_id",
                    "type": "number",
                    "required": true,
                    "description": "ID of the quiz",
                    "example": 1
                },
                {
                    "name": "summary",
                    "type": "string",
                    "required": true,
                    "description": "Summary of the passage",
                    "example": "Summarize the following passage about the importance of renewable energy in today's world."
                },
                {
                    "name": "time_limit",
                    "type": "number",
                    "required": true,
                    "description": "Time limit for the question",
                    "example": 10
                },
                {
                    "name": "created_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user creating the question",
                    "example": 1
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Summarize passage question created successfully",
                    "example": {
                        "message": "Summarize passage question created successfully",
                        "data": {
                            "success": true
                        }
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
            "id": "update-summarize-passage-question",
            "name": "Update Summarize Passage Question",
            "method": "PUT",
            "url": "/summary/update/:id",
            "description": "Update an existing summarize passage question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the summarize passage question to update",
                    "example": "1"
                },
                {
                    "name": "quiz_id",
                    "type": "number",
                    "required": false,
                    "description": "ID of the quiz",
                    "example": 1
                },
                {
                    "name": "summary",
                    "type": "string",
                    "required": false,
                    "description": "Updated summary of the passage",
                    "example": "Updated summary of the passage about renewable energy and its global impact."
                },
                {
                    "name": "time_limit",
                    "type": "number",
                    "required": false,
                    "description": "Updated time limit for the question",
                    "example": 15
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user updating the question",
                    "example": 1
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Summarize passage question updated successfully",
                    "example": {
                        "message": "Summarize-passage question updated successfully"
                    }
                },
                {
                    "status": 404,
                    "description": "Summarize passage question not found",
                    "example": {
                        "success": false,
                        "message": "Summarize passage question not found"
                    }
                }
            ]
        },
        {
            "id": "delete-summarize-passage-question",
            "name": "Delete Summarize Passage Question",
            "method": "DELETE",
            "url": "/summary/delete/:id",
            "description": "Delete a summarize passage question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the summarize passage question to delete",
                    "example": "1"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Summarize passage question deleted successfully",
                    "example": {
                        "message": "Summarize-passage question deleted successfully"
                    }
                },
                {
                    "status": 404,
                    "description": "Summarize passage question not found",
                    "example": {
                        "success": false,
                        "message": "Summarize passage question not found"
                    }
                }
            ]
        }
    ]
};

export default summarizePassageData;
