const audioToScriptData = {
    "id": "audio-to-script",
    "name": "Audio To Script",
    "description": "The Audio To Script API provides endpoints to manage audio-to-script questions in the system. These endpoints allow you to create, read, update, and delete audio-to-script questions.",
    "endpoints": [
        {
            "id": "get-all-audio-to-script-questions",
            "name": "Get All Audio To Script Questions",
            "method": "GET",
            "url": "/audio-to-script/",
            "description": "Get a list of all audio-to-script questions in the system.",
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved all audio-to-script questions",
                    "example": [
                        {
                            "id": 1,
                            "quiz_id": 1,
                            "url": "/audiotoScript/jsAudioyt.mp3",
                            "script": "Welcome to the JavaScript basics course. In this audio, we'll cover variables and data types.",
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T08:15:27.000Z",
                            "updated_at": "2025-05-09T08:15:27.000Z"
                        },
                        {
                            "id": 3,
                            "quiz_id": 3,
                            "url": "/audiotoScript/human_anatomy.mp3",
                            "script": "Welcome to the Human Anatomy course. In this audio, we'll discuss the human skeletal system and its role in protection and movement.",
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T08:15:27.000Z",
                            "updated_at": "2025-05-09T08:15:27.000Z"
                        },
                        {
                            "id": 4,
                            "quiz_id": 4,
                            "url": "/audiotoScript/human_anatomy2.mp3",
                            "script": "In this audio lesson, we'll explore how the heart and lungs work together to circulate oxygen-rich blood throughout the body.",
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T08:15:27.000Z",
                            "updated_at": "2025-05-09T08:15:27.000Z"
                        },
                        {
                            "id": 5,
                            "quiz_id": 1,
                            "url": "/audiotoScript/audiotoScript-1746779436279-301028572.mp3",
                            "script": "This is the second sample script",
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T08:30:36.000Z",
                            "updated_at": "2025-05-09T08:30:36.000Z"
                        }
                    ]
                }
            ]
        },
        {
            "id": "get-audio-to-script-questions-by-quiz-id",
            "name": "Get Audio To Script Questions by Quiz ID",
            "method": "GET",
            "url": "/audio-to-script/quiz/:quiz_id",
            "description": "Get a list of audio-to-script questions by quiz ID.",
            "parameters": [
                {
                    "name": "quiz_id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the quiz to retrieve audio-to-script questions for",
                    "example": "1"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved audio-to-script questions by quiz ID",
                    "example": [
                        {
                            "id": 1,
                            "quiz_id": 1,
                            "url": "/audiotoScript/jsAudioyt.mp3",
                            "script": "Welcome to the JavaScript basics course. In this audio, we'll cover variables and data types.",
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T08:15:27.000Z",
                            "updated_at": "2025-05-09T08:15:27.000Z"
                        },
                        {
                            "id": 5,
                            "quiz_id": 1,
                            "url": "/audiotoScript/audiotoScript-1746779436279-301028572.mp3",
                            "script": "This is the second sample script",
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T08:30:36.000Z",
                            "updated_at": "2025-05-09T08:30:36.000Z"
                        }
                    ]
                }
            ]
        },
        {
            "id": "create-audio-to-script-question",
            "name": "Create Audio To Script Question",
            "method": "POST",
            "url": "/audio-to-script/create",
            "description": "Create a new audio-to-script question in the system.",
            "parameters": [
                {
                    "name": "quiz_id",
                    "type": "number",
                    "required": true,
                    "description": "ID of the quiz",
                    "example": 1
                },
                {
                    "name": "audioScript",
                    "type": "file",
                    "required": true,
                    "description": "Audio file to upload",
                    "example": "audio file"
                },
                {
                    "name": "script",
                    "type": "string",
                    "required": true,
                    "description": "Script text",
                    "example": "script text"
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
                    "description": "Audio-to-script question created successfully",
                    "example": {
                        "message": "Audio-to-script question created successfully"
                    }
                }
            ]
        },
        {
            "id": "update-audio-to-script-question",
            "name": "Update Audio To Script Question",
            "method": "PUT",
            "url": "/audio-to-script/update/:id",
            "description": "Update an existing audio-to-script question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the audio-to-script question to update",
                    "example": "2"
                },
                {
                    "name": "quiz_id",
                    "type": "number",
                    "required": false,
                    "description": "ID of the quiz",
                    "example": 1
                },
                {
                    "name": "script",
                    "type": "string",
                    "required": false,
                    "description": "Updated script text",
                    "example": "Updated version of the first audio script."
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
                    "description": "Audio-to-script question updated successfully",
                    "example": {
                        "message": "Audio-to-script question updated successfully",
                        "audioToScriptQuestion": {
                            "id": 2,
                            "quiz_id": 1,
                            "url": "/audiotoScript/jsAudioyt.mp3",
                            "script": "Updated version of the first audio script.",
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T08:15:27.000Z",
                            "updated_at": "2025-05-09T08:36:51.000Z"
                        }
                    }
                }
            ]
        },
        {
            "id": "delete-audio-to-script-question",
            "name": "Delete Audio To Script Question",
            "method": "DELETE",
            "url": "/audio-to-script/delete/:id",
            "description": "Delete an audio-to-script question by its ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the audio-to-script question to delete",
                    "example": "2"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Audio-to-script question deleted successfully",
                    "example": {
                        "message": "Audio-to-script question deleted successfully",
                        "deleted": {
                            "id": 2,
                            "quiz_id": 1,
                            "url": "/audiotoScript/jsAudioyt.mp3",
                            "script": "Updated version of the first audio script.",
                            "created_by": 1,
                            "updated_by": 1,
                            "created_at": "2025-05-09T08:15:27.000Z",
                            "updated_at": "2025-05-09T08:36:51.000Z"
                        }
                    }
                }
            ]
        }
    ]
};

export default audioToScriptData;
