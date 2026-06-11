const userData = {
    "id": "user-auth",
    "name": "User Auth",
    "description": "The User Auth API provides endpoints to manage user authentication and user profiles in the system. These endpoints allow users to sign up, login, logout, and manage their profiles.",
    "endpoints": [
        {
            "id": "user-signup",
            "name": "User Signup",
            "method": "POST",
            "url": "/user/auth/signup",
            "description": "Create a new user account.",
            "parameters": [
                {
                    "name": "full_name",
                    "type": "string",
                    "required": true,
                    "description": "Full name of the user",
                    "example": "Michael Brow"
                },
                {
                    "name": "username",
                    "type": "string",
                    "required": true,
                    "description": "Username of the user",
                    "example": "michaelbrow"
                },
                {
                    "name": "email",
                    "type": "string",
                    "required": true,
                    "description": "Email of the user",
                    "example": "michael.brow@example.com"
                },
                {
                    "name": "password",
                    "type": "string",
                    "required": true,
                    "description": "Password of the user",
                    "example": "password1234"
                },
                {
                    "name": "country_id",
                    "type": "number",
                    "required": true,
                    "description": "Country ID of the user",
                    "example": 1
                },
                {
                    "name": "state_id",
                    "type": "number",
                    "required": true,
                    "description": "State ID of the user",
                    "example": 1
                },
                {
                    "name": "city_id",
                    "type": "number",
                    "required": true,
                    "description": "City ID of the user",
                    "example": 1
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "User registered successfully",
                    "example": {
                        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInVzZXJuYW1lIjoibWljaGFlbGJyb3ciLCJlbWFpbCI6Im1pY2hhZWwuYnJvd0BleGFtcGxlLmNvbSIsInNlc3Npb25Ub2tlbiI6ImJmYjY1NmU3LTcyNmItNDc2Yi1iNGE4LTdhMzJhZjExODRiMyIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ2NzgyNzc3LCJleHAiOjE3NDczODc1Nzd9.MsZCl2Br47jmJyDBqXR0rZyp9NNHKc4fHjw6IcQYGDc",
                        "message": "User registered successfully"
                    }
                }
            ]
        },
        {
            "id": "user-login",
            "name": "User Login",
            "method": "POST",
            "url": "/user/auth/login",
            "description": "Login as a user.",
            "parameters": [
                {
                    "name": "identifier",
                    "type": "string",
                    "required": true,
                    "description": "Username or email of the user",
                    "example": "michaelbrow"
                },
                {
                    "name": "password",
                    "type": "string",
                    "required": true,
                    "description": "Password of the user",
                    "example": "password1234"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Login successful",
                    "example": {
                        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInVzZXJuYW1lIjoibWljaGFlbGJyb3ciLCJlbWFpbCI6Im1pY2hhZWwuYnJvd0BleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwic2Vzc2lvblRva2VuIjoiMmJhMDkxODMtNjYyMC00YmM5LTkzMmMtNDM0YmQ5MWE3NzFjIiwiaWF0IjoxNzQ2NzgzMzExLCJleHAiOjE3NDczODgxMTF9.xesmlPhDK4kj-x22Mvj_ud4MXSVOVOKXnDa3uxyf_UQ",
                        "message": "Login successful"
                    }
                }
            ]
        },
        {
            "id": "user-google-login",
            "name": "User Google Login",
            "method": "POST",
            "url": "/user/auth/googleLogin",
            "description": "Login as a user using Google authentication.",
            "parameters": [
                {
                    "name": "req.user",
                    "type": "object",
                    "required": true,
                    "description": "User data from Google authentication",
                    "example": {
                        "name": "Smit",
                        "picture": "https://lh.googleusercontent.com/a/AocLN-1F5dhzdQ=s96-c",
                        "iss": "https://securetoken.google.com/e-learn9e",
                        "aud": "e-learning-9e",
                        "auth_time": 1261,
                        "user_id": "1Md4mPTR7oxQ32",
                        "sub": "1Mdu4abXAwmPTR7oxQ32",
                        "iat": 17261,
                        "exp": 17861,
                        "email": "smit@gmail.com",
                        "email_verified": true,
                        "firebase": {
                            "identities": {
                                "google.com": [],
                                "email": []
                            },
                            "sign_in_provider": "google.com"
                        },
                        "uid": "1MduM9x4mPTR7oxQ32"
                    }
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Login successful",
                    "example": {
                        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInVzZXJuYW1lIjoic21pdF9wYXRlbF84MjUiLCJlbWFpbCI6InNtaXRwYXRlbDkyNjdAZ21haWwuY29tIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0xOLTFCOGtBTFV1bjFWUkwwVjd1d0hsY2MzQzE0ZHNCYUMxWHhSMy1LRjVkaHpkUT1zOTYtYyIsInJvbGUiOiJ1c2VyIiwic2Vzc2lvblRva2VuIjoiNjkyNjViYWYtNWU4NC00YjAxLWIyNGItYzQxZDAwZjk4OTQ5IiwiaWF0IjoxNzQ3MjE3MzcwLCJleHAiOjE3NDc4MjIxNzB9.rUYBzJltJ8W0kvp5Ui2E1wOsXpoiw-UeK_vcoLD8-ts",
                        "message": "Login successful"
                    }
                }
            ]
        },
        {
            "id": "user-logout",
            "name": "User Logout",
            "method": "POST",
            "url": "/user/auth/logout",
            "description": "Logout the current user.",
            "responses": [
                {
                    "status": 200,
                    "description": "Logout successful",
                    "example": {
                        "message": "Logout successful"
                    }
                }
            ]
        },
        {
            "id": "get-user-points",
            "name": "Get User Points",
            "method": "GET",
            "url": "/user/auth/points/:id",
            "description": "Get the points of a user by their ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the user to retrieve points for",
                    "example": "1"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved user points",
                    "example": {
                        "success": true,
                        "userPoints": {
                            "id": 1,
                            "user_id": 1,
                            "points": 0,
                            "total_earned": 100,
                            "total_spent": 100,
                            "last_updated": "2025-05-09T09:55:12.000Z"
                        }
                    }
                }
            ]
        },
        {
            "id": "get-user-by-id",
            "name": "Get User By ID",
            "method": "GET",
            "url": "/user/auth/:id",
            "description": "Get a specific user by their ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the user to retrieve",
                    "example": "1"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Successfully retrieved the user",
                    "example": {
                        "id": 1,
                        "full_name": "John Doe",
                        "username": "johndoe",
                        "email": "john@example.com",
                        "profile_image": null,
                        "mobile_no": "1234567890",
                        "location": "New York",
                        "session_token": "aa852260-5cf7-4cd9-86ba-63e092ac9cc8",
                        "created_at": "2025-05-09T09:52:23.000Z",
                        "updated_at": "2025-05-09T10:24:17.000Z"
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
            "id": "change-password",
            "name": "Change Password",
            "method": "PUT",
            "url": "/user/auth/users/:id/change-password",
            "description": "Change the password of a user by their ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the user to change password for",
                    "example": "1"
                },
                {
                    "name": "currentPassword",
                    "type": "string",
                    "required": true,
                    "description": "Current password of the user",
                    "example": "123"
                },
                {
                    "name": "newPassword",
                    "type": "string",
                    "required": true,
                    "description": "New password of the user",
                    "example": "1234"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Password changed successfully",
                    "example": {
                        "message": "Password changed successfully"
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
            "id": "update-profile",
            "name": "Update Profile",
            "method": "PUT",
            "url": "/user/auth/user/:id",
            "description": "Update the profile of a user by their ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the user to update profile for",
                    "example": "1"
                },
                {
                    "name": "full_name",
                    "type": "string",
                    "required": false,
                    "description": "Updated full name of the user",
                    "example": "John Doe"
                },
                {
                    "name": "username",
                    "type": "string",
                    "required": false,
                    "description": "Updated username of the user",
                    "example": "johndoe"
                },
                {
                    "name": "email",
                    "type": "string",
                    "required": false,
                    "description": "Updated email of the user",
                    "example": "johndoe@example.com"
                },
                {
                    "name": "mobile_no",
                    "type": "string",
                    "required": false,
                    "description": "Updated mobile number of the user",
                    "example": "1234567890"
                },
                {
                    "name": "location",
                    "type": "string",
                    "required": false,
                    "description": "Updated location of the user",
                    "example": "New York"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Profile updated successfully",
                    "example": {
                        "message": "Profile updated successfully"
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
            "id": "delete-profile-image",
            "name": "Delete Profile Image",
            "method": "DELETE",
            "url": "/user/auth/users/:id/delete-profile-image",
            "description": "Delete the profile image of a user by their ID.",
            "parameters": [
                {
                    "name": "id",
                    "type": "number",
                    "required": true,
                    "inPath": true,
                    "description": "The ID of the user to delete profile image for",
                    "example": "1"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Profile image deleted successfully",
                    "example": {
                        "message": "Profile image deleted successfully"
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
        }
    ]
};

export default userData;
