const assignmentResponseData = {
    "id": "assignment-response",
    "name": "Assignment Response",
    "description": "The Assignment Response API provides endpoints to manage assignment responses in the system. These endpoints allow you to create assignment responses.",
    "endpoints": [
        {
            "id": "create-assignment-responses",
            "name": "Create Assignment Responses",
            "method": "POST",
            "url": "/assignment-responses/",
            "description": "Create new assignment responses in the system.",
            "parameters": [
                {
                    "name": "assignmentCompletionId",
                    "type": "number",
                    "required": true,
                    "description": "ID of the assignment completion associated with the responses",
                    "example": 2
                },
                {
                    "name": "questionId",
                    "type": "string",
                    "required": true,
                    "description": "ID of the question being responded to",
                    "example": "2"
                },
                {
                    "name": "selectedAnswer",
                    "type": "string",
                    "required": true,
                    "description": "Selected answer for the question",
                    "example": "Arrow Function-const foo = () => {}"
                },
                {
                    "name": "updated_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user updating the response",
                    "example": 2
                },
                {
                    "name": "created_by",
                    "type": "number",
                    "required": true,
                    "description": "ID of the user creating the response",
                    "example": 2
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Assignment responses created successfully",
                    "example": {
                        "id": 5,
                        "assignmentCompletionId": 2,
                        "questionId": 2,
                        "selectedAnswer": "Arrow Function-const foo = () => {}",
                        "optionIndex": null,
                        "updated_by": 2,
                        "created_by": 2,
                        "created_at": "2025-05-14T09:34:57.000Z",
                        "updated_at": "2025-05-14T09:34:57.000Z"
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
        }
    ]
};

export default assignmentResponseData;
