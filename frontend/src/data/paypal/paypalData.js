const paypalData = {
    "id": "paypal",
    "name": "PayPal",
    "description": "The PayPal API provides endpoints to manage PayPal orders. These endpoints allow you to create and capture orders.",
    "endpoints": [
        {
            "id": "create-order",
            "name": "Create Order",
            "method": "POST",
            "url": "/paypal/create-order",
            "description": "Create a new PayPal order.",
            "parameters": [
                {
                    "name": "amount",
                    "type": "number",
                    "required": true,
                    "description": "Amount for the order",
                    "example": 100
                },
                {
                    "name": "currency",
                    "type": "string",
                    "required": true,
                    "description": "Currency for the order",
                    "example": "USD"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Order created successfully",
                    "example": {
                        "id": "03702539D5436335R"
                    }
                }
            ]
        },
        {
            "id": "capture-order",
            "name": "Capture Order",
            "method": "POST",
            "url": "/paypal/capture-order",
            "description": "Capture an existing PayPal order.",
            "parameters": [
                {
                    "name": "orderId",
                    "type": "string",
                    "required": true,
                    "description": "ID of the order to capture",
                    "example": "5BP88456935185719"
                }
            ],
            "responses": [
                {
                    "status": 200,
                    "description": "Order captured successfully",
                    "example": {
                        "capture": {
                            "id": "5BP88456935185719",
                            "status": "COMPLETED",
                            "payment_source": {
                                "paypal": {
                                    "email_address": "sb-jbvfw40692670@personal.example.com",
                                    "account_id": "MXQF5ZB4ZK44W",
                                    "account_status": "VERIFIED",
                                    "name": {
                                        "given_name": "John",
                                        "surname": "Doe"
                                    },
                                    "address": {
                                        "country_code": "US"
                                    }
                                }
                            },
                            "purchase_units": [
                                {
                                    "reference_id": "default",
                                    "shipping": {
                                        "name": {
                                            "full_name": "John Doe"
                                        },
                                        "address": {
                                            "address_line_1": "1 Main St",
                                            "admin_area_2": "San Jose",
                                            "admin_area_1": "CA",
                                            "postal_code": "95131",
                                            "country_code": "US"
                                        }
                                    },
                                    "payments": {
                                        "captures": [
                                            {
                                                "id": "4GH411305M546574H",
                                                "status": "COMPLETED",
                                                "amount": {
                                                    "currency_code": "USD",
                                                    "value": "68.00"
                                                },
                                                "final_capture": true,
                                                "seller_protection": {
                                                    "status": "ELIGIBLE",
                                                    "dispute_categories": [
                                                        "ITEM_NOT_RECEIVED",
                                                        "UNAUTHORIZED_TRANSACTION"
                                                    ]
                                                },
                                                "seller_receivable_breakdown": {
                                                    "gross_amount": {
                                                        "currency_code": "USD",
                                                        "value": "68.00"
                                                    },
                                                    "paypal_fee": {
                                                        "currency_code": "USD",
                                                        "value": "2.27"
                                                    },
                                                    "net_amount": {
                                                        "currency_code": "USD",
                                                        "value": "65.73"
                                                    }
                                                },
                                                "links": [
                                                    {
                                                        "href": "https://api.sandbox.paypal.com/v2/payments/captures/4GH411305M546574H",
                                                        "rel": "self",
                                                        "method": "GET"
                                                    },
                                                    {
                                                        "href": "https://api.sandbox.paypal.com/v2/payments/captures/4GH411305M546574H/refund",
                                                        "rel": "refund",
                                                        "method": "POST"
                                                    },
                                                    {
                                                        "href": "https://api.sandbox.paypal.com/v2/checkout/orders/5BP88456935185719",
                                                        "rel": "up",
                                                        "method": "GET"
                                                    }
                                                ],
                                                "create_time": "2025-05-09T10:27:35Z",
                                                "update_time": "2025-05-09T10:27:35Z"
                                            }
                                        ]
                                    }
                                }
                            ],
                            "payer": {
                                "name": {
                                    "given_name": "John",
                                    "surname": "Doe"
                                },
                                "email_address": "sb-jbvfw40692670@personal.example.com",
                                "payer_id": "MXQF5ZB4ZK44W",
                                "address": {
                                    "country_code": "US"
                                }
                            },
                            "links": [
                                {
                                    "href": "https://api.sandbox.paypal.com/v2/checkout/orders/5BP88456935185719",
                                    "rel": "self",
                                    "method": "GET"
                                }
                            ]
                        }
                    }
                }
            ]
        }
    ]
};

export default paypalData;
