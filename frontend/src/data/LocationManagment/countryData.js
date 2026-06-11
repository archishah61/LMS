const countryData = {
    id: 'country',
    name: 'Country',
    description: 'The Country API provides endpoints to manage countries in the system. These endpoints allow you to create, read, update, delete, and manage the status of countries with their associated data like currency, phone code, timezone, region, and subregion.',
    endpoints: [
        {
            id: 'get-all-countries',
            name: 'Get All Countries',
            method: 'GET',
            url: '/countries/all',
            description: 'Get a list of all countries in the system with their complete data.',
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved all countries',
                    example:
                    {
                        "success": true,
                        "data": [
                            {
                                "id": 114,
                                "name": "Afghanistan",
                                "code": "AFG",
                                "currency": "AFN",
                                "phone_code": "+93",
                                "timezone": "UTC+04:30",
                                "region": "Asia",
                                "subregion": "Southern Asia",
                                "is_active": 1,
                                "created_at": "2025-05-09T08:09:14.000Z",
                                "updated_at": "2025-05-09T08:09:14.000Z"
                            },
                            {
                                "id": 107,
                                "name": "Åland Islands",
                                "code": "ALA",
                                "currency": "EUR",
                                "phone_code": "+35818",
                                "timezone": "UTC+02:00",
                                "region": "Europe",
                                "subregion": "Northern Europe",
                                "is_active": 1,
                                "created_at": "2025-05-09T08:09:14.000Z",
                                "updated_at": "2025-05-09T08:09:14.000Z"
                            },
                            {
                                "id": 237,
                                "name": "Albania",
                                "code": "ALB",
                                "currency": "ALL",
                                "phone_code": "+355",
                                "timezone": "UTC+01:00",
                                "region": "Europe",
                                "subregion": "Southeast Europe",
                                "is_active": 1,
                                "created_at": "2025-05-09T08:09:14.000Z",
                                "updated_at": "2025-05-09T08:09:14.000Z"
                            },
                            {
                                "id": 175,
                                "name": "Algeria",
                                "code": "DZA",
                                "currency": "DZD",
                                "phone_code": "+213",
                                "timezone": "UTC+01:00",
                                "region": "Africa",
                                "subregion": "Northern Africa",
                                "is_active": 1,
                                "created_at": "2025-05-09T08:09:14.000Z",
                                "updated_at": "2025-05-09T08:09:14.000Z"
                            },
                            {
                                "id": 153,
                                "name": "American Samoa",
                                "code": "ASM",
                                "currency": "USD",
                                "phone_code": "+1684",
                                "timezone": "UTC-11:00",
                                "region": "Oceania",
                                "subregion": "Polynesia",
                                "is_active": 1,
                                "created_at": "2025-05-09T08:09:14.000Z",
                                "updated_at": "2025-05-09T08:09:14.000Z"
                            },
                            {
                                "id": 126,
                                "name": "Andorra",
                                "code": "AND",
                                "currency": "EUR",
                                "phone_code": "+376",
                                "timezone": "UTC+01:00",
                                "region": "Europe",
                                "subregion": "Southern Europe",
                                "is_active": 1,
                                "created_at": "2025-05-09T08:09:14.000Z",
                                "updated_at": "2025-05-09T08:09:14.000Z"
                            },
                            {
                                "id": 245,
                                "name": "Angola",
                                "code": "AGO",
                                "currency": "AOA",
                                "phone_code": "+244",
                                "timezone": "UTC+01:00",
                                "region": "Africa",
                                "subregion": "Middle Africa",
                                "is_active": 1,
                                "created_at": "2025-05-09T08:09:14.000Z",
                                "updated_at": "2025-05-09T08:09:14.000Z"
                            },
                            {
                                "id": 154,
                                "name": "Anguilla",
                                "code": "AIA",
                                "currency": "XCD",
                                "phone_code": "+1264",
                                "timezone": "UTC-04:00",
                                "region": "Americas",
                                "subregion": "Caribbean",
                                "is_active": 1,
                                "created_at": "2025-05-09T08:09:14.000Z",
                                "updated_at": "2025-05-09T08:09:14.000Z"
                            },
                            {
                                "id": 47,
                                "name": "Antarctica",
                                "code": "ATA",
                                "currency": "",
                                "phone_code": "undefined",
                                "timezone": "UTC-03:00",
                                "region": "Antarctic",
                                "subregion": "",
                                "is_active": 1,
                                "created_at": "2025-05-09T08:09:14.000Z",
                                "updated_at": "2025-05-09T08:09:14.000Z"
                            },
                            {
                                "id": 136,
                                "name": "Antigua and Barbuda",
                                "code": "ATG",
                                "currency": "XCD",
                                "phone_code": "+1268",
                                "timezone": "UTC-04:00",
                                "region": "Americas",
                                "subregion": "Caribbean",
                                "is_active": 1,
                                "created_at": "2025-05-09T08:09:14.000Z",
                                "updated_at": "2025-05-09T08:09:14.000Z"
                            }
                        ]
                    }
                }
            ]
        },
        {
            id: 'get-country-by-id',
            name: 'Get Country By ID',
            method: 'GET',
            url: '/countries/{id}',
            description: 'Get a specific country by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the country to retrieve',
                    example: '2'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Successfully retrieved the country',
                    example: {
                        "success": true,
                        "data": [
                            {
                                "id": 2,
                                "name": "Tonga",
                                "code": "TON",
                                "currency": "TOP",
                                "phone_code": "+676",
                                "timezone": "UTC+13:00",
                                "region": "Oceania",
                                "subregion": "Polynesia",
                                "is_active": 1,
                                "created_at": "2025-05-09T08:09:14.000Z",
                                "updated_at": "2025-05-09T08:09:14.000Z"
                            }
                        ]
                    }
                },
                {
                    status: 404,
                    description: 'Country not found',
                    example: {
                        "success": false,
                        "message": "Country not found"
                    }
                }
            ]
        },
        {
            id: 'create-country',
            name: 'Create Country',
            method: 'POST',
            url: '/countries/create',
            description: 'Create a new country in the system.',
            parameters: [
                {
                    name: 'name',
                    type: 'string',
                    required: true,
                    description: 'Name of the country',
                    example: 'India..12'
                },
                {
                    name: 'code',
                    type: 'string',
                    required: true,
                    description: 'Country code',
                    example: 'I12'
                },
                {
                    name: 'currency',
                    type: 'string',
                    required: true,
                    description: 'Currency code',
                    example: 'INR'
                },
                {
                    name: 'phone_code',
                    type: 'string',
                    required: true,
                    description: 'International phone code',
                    example: '+91'
                },
                {
                    name: 'timezone',
                    type: 'string',
                    required: true,
                    description: 'Timezone information',
                    example: 'Asia/Kolkata'
                },
                {
                    name: 'region',
                    type: 'string',
                    required: true,
                    description: 'Geographical region',
                    example: 'Asia'
                },
                {
                    name: 'subregion',
                    type: 'string',
                    required: true,
                    description: 'Geographical subregion',
                    example: 'Southern Asia'
                }
            ],
            responses: [
                {
                    status: 201,
                    description: 'Country created successfully',
                    example: {
                        "success": true,
                        "message": "Country created successfully",
                        "data": {
                            "id": 251,
                            "name": "India..12",
                            "code": "I12",
                            "currency": "INR",
                            "phone_code": "+91",
                            "timezone": "Asia/Kolkata",
                            "region": "Asia",
                            "subregion": "Southern Asia",
                            "is_active": 1,
                            "created_at": "2025-05-09T10:22:39.000Z",
                            "updated_at": "2025-05-09T10:22:39.000Z"
                        }
                    }
                },
                {
                    status: 400,
                    description: 'Validation error',
                    example: {
                        "success": false,
                        "message": "Country name is required"
                    }
                }
            ]
        },
        {
            id: 'update-country',
            name: 'Update Country',
            method: 'PUT',
            url: '/countries/update/{id}',
            description: 'Update an existing country by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the country to update',
                    example: '251'
                },
                {
                    name: 'name',
                    type: 'string',
                    required: false,
                    description: 'Updated name of the country',
                    example: 'India Updated'
                },
                {
                    name: 'code',
                    type: 'string',
                    required: false,
                    description: 'Updated country code',
                    example: 'I22'
                },
                {
                    name: 'currency',
                    type: 'string',
                    required: false,
                    description: 'Updated currency code',
                    example: 'INR'
                },
                {
                    name: 'phone_code',
                    type: 'string',
                    required: false,
                    description: 'Updated phone code',
                    example: '+911'
                },
                {
                    name: 'timezone',
                    type: 'string',
                    required: false,
                    description: 'Updated timezone',
                    example: 'Asia/Kolkata'
                },
                {
                    name: 'region',
                    type: 'string',
                    required: false,
                    description: 'Updated region',
                    example: 'Asia'
                },
                {
                    name: 'subregion',
                    type: 'string',
                    required: false,
                    description: 'Updated subregion',
                    example: 'Southern Asia'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Country updated successfully',
                    example: {
                        "success": true,
                        "message": "Country updated successfully",
                        "data": {
                            "id": 251,
                            "name": "India Updated",
                            "code": "I22",
                            "currency": "INR",
                            "phone_code": "+911",
                            "timezone": "Asia/Kolkata",
                            "region": "Asia",
                            "subregion": "Southern Asia",
                            "is_active": 1,
                            "created_at": "2025-05-09T10:22:39.000Z",
                            "updated_at": "2025-05-09T10:24:57.000Z"
                        }
                    }
                },
                {
                    status: 404,
                    description: 'Country not found',
                    example: {
                        "success": false,
                        "message": "Country not found"
                    }
                }
            ]
        },
        {
            id: 'delete-country',
            name: 'Delete Country',
            method: 'DELETE',
            url: '/countries/delete/{id}',
            description: 'Delete a country by its ID.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the country to delete',
                    example: '251'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Country deleted successfully',
                    example: {
                        "success": true,
                        "message": "Country deleted successfully"
                    }
                },
                {
                    status: 404,
                    description: 'Country not found',
                    example: {
                        "success": false,
                        "message": "Country not found"
                    }
                }
            ]
        },
        {
            id: 'toggle-country-status',
            name: 'Toggle Country Status',
            method: 'PATCH',
            url: '/countries/toggle-status/{id}',
            description: 'Toggle the active/inactive status of a country.',
            parameters: [
                {
                    name: 'id',
                    type: 'number',
                    required: true,
                    inPath: true,
                    description: 'The ID of the country to update status',
                    example: '2'
                }
            ],
            responses: [
                {
                    status: 200,
                    description: 'Country status toggled successfully',
                    example: {
                        "success": true,
                        "message": "Country status toggled successfully",
                        "data": [
                            {
                                "id": 2,
                                "name": "Tonga",
                                "code": "TON",
                                "currency": "TOP",
                                "phone_code": "+676",
                                "timezone": "UTC+13:00",
                                "region": "Oceania",
                                "subregion": "Polynesia",
                                "is_active": 0,
                                "created_at": "2025-05-09T08:09:14.000Z",
                                "updated_at": "2025-05-09T10:30:40.000Z"
                            }
                        ]
                    }
                },
                {
                    status: 404,
                    description: 'Country not found',
                    example: {
                        "success": false,
                        "message": "Country not found"
                    }
                }
            ]
        }
    ]
};

export default countryData;