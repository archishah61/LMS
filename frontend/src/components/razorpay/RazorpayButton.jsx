// frontend/src/components/RazorpayButton.jsx
import React from 'react';
import toast from 'react-hot-toast';
import { useCreateOrderMutation, useVerifyPaymentMutation } from '../../services/Razorpay/razorpayAPI';
import { getStudentToken } from '../../services/CookieService';

const RazorpayButton = ({ amount, detail, onResult, buttonText = `Pay ₹${amount}`, className = "" }) => {
    const [createOrder] = useCreateOrderMutation();
    const [verifyPayment] = useVerifyPaymentMutation();
    const { access_token } = getStudentToken();

    // Load Razorpay script dynamically
    const loadRazorpayScript = () =>
        new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });

    // Payment handler
    const handlePayment = async () => {
        if (!access_token) {
            toast.error('You need to be logged in to make a payment');
            return;
        }
        const isScriptLoaded = await loadRazorpayScript();

        if (!isScriptLoaded) {
            toast.error('Razorpay SDK failed to load. Are you online?');
            return;
        }

        try {
            // 🧾 1. Create Order using RTK Query
            const orderResponse = await createOrder({ amount, currency: "INR", item: detail?.item, related_id: detail?.related_id }).unwrap();

            const { order } = orderResponse;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: "INR",
                name: "Queekies",
                description: "Course Payment",
                order_id: order.id,
                handler: async (response) => {

                    try {
                        // ✅ 2. Verify Payment using RTK Query
                        const verifyResponse = await verifyPayment(response).unwrap();

                        onResult(verifyResponse);
                    } catch (error) {
                        console.error("Error verifying payment:", error);
                        toast.error("Payment verification failed");
                    }
                },
                prefill: {
                    name: "Test User",
                    email: "test@example.com",
                },
                theme: {
                    color: "#009D5C",
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error("Error creating order:", error);
            const errorMessage = error?.data?.error ||
                error?.data?.message ||
                error?.error ||
                error?.message ||
                'Failed to Toggle role';
            toast.error(errorMessage);
        }
    };

    return (
        <button
            onClick={handlePayment}
            className={className || `bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-3 rounded-lg transition-all duration-300 shadow-md transform hover:translate-y-0.5`}
        >
            {buttonText}
        </button>
    );
};

export default RazorpayButton;
