// frontend/src/components/PayPalButton.jsx
import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useCaptureOrderMutation, useCreateOrderMutation } from '../../services/PayPal/paypalAPI';
import toast from "react-hot-toast";

const PayPalButton = ({ onResult, amount }) => {
    const [createOrder] = useCreateOrderMutation();
    const [captureOrder] = useCaptureOrderMutation();

    const makeOrder = async () => {
        try {
            const res = await createOrder({ amount }).unwrap();
            return res.id; // PayPal expects just the order ID
        } catch (err) {
            const errorMessage = err?.data?.error ||
                err?.data?.message ||
                err?.error ||
                err?.message ||
                'Failed to delete role';
            toast.error(errorMessage);
        }
    };

    const onApprove = async (data) => {
        try {
            const res = await captureOrder({ orderId: data.orderID }).unwrap();
            toast.success("Payment successful!");
            onResult(res);
        } catch (err) {
            const errorMessage = err?.data?.error ||
                err?.data?.message ||
                err?.error ||
                err?.message ||
                'Failed to delete role';
            toast.error(errorMessage);
        }
    };

    return (
        <PayPalScriptProvider options={{ "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID }}>
            <PayPalButtons createOrder={makeOrder} onApprove={onApprove} />
        </PayPalScriptProvider>
    );
};

export default PayPalButton;
