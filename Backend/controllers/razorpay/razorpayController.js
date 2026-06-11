// paymentController.js
const Razorpay = require('razorpay');
require('dotenv').config();
const Validation = require("../../validations");
const { payments } = require('../../models/enrollment_management/enrollment_management');
const { callProcedure } = require('../../utils/procedure/callProcedure');

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res, next) => {
  try {
    const user_id = req?.user?.id;

    const { amount, currency, item, related_id } = req.body;

    Validation.isNumber(amount, { min: 1 }, "amount must be valid number.");

    const order = await instance.orders.create({ amount: parseInt(parseFloat(amount) * 100), currency: currency || "INR", receipt: `rcpt_${Date.now()}` });

    if (item === "contest") {
      const { success, data, error } = await callProcedure("createPayment", [
        null,
        related_id,
        amount,
        currency,
        "NA",
        "NA",
        null,
        null,
        order.id,
        "pending",
        null,
        user_id
      ]);

      if (!success) {
        await payments.create({
          contest_id: related_id,
          reference_id: order.id,
          amount: amount,
          currency: currency,
          payment_method: "NA",
          payment_gateway: "NA",
          transaction_date: new Date(),
          status: "pending",
          created_by: user_id || null,
          updated_by: user_id || null
        });
      }
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

exports.verifyPayment = (req, res, next) => {
  const crypto = require('crypto');
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = hmac.digest('hex');

  if (digest === razorpay_signature) {
    res.status(200).json({ success: true, message: "Payment verified successfully" });
  } else {
    res.status(400).json({ success: false, message: "Payment verification failed" });
  }
};

exports.verifyPayment = async (req, res) => {
  const crypto = require('crypto');

  const user_id = req?.user?.id;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = hmac.digest('hex');

  if (digest !== razorpay_signature) {
    return res.status(400).json({ success: false, message: "Payment verification failed" });
  }

  // Fetch full payment details
  try {
    const payment = await instance.payments.fetch(razorpay_payment_id);

    const { success, data, error } = await callProcedure("updatePayment", [
      payment.order_id,
      "completed",
      payment.id,
      payment.method,
      "razorpay",
      JSON.stringify(payment),
      payment.description
    ]);

    if (success && data[0]) {
      const result = await callProcedure("EnrollUserInContest", [
        user_id, data[0]?.contest_id, null
      ]);
    } else { // Fall back
      const orderRecord = await payments.findOne({
        where: { reference_id: payment.order_id }
      });

      if (orderRecord && orderRecord.contest_id) {

        if (orderRecord.status === "completed") {
          return res.status(400).json({ message: "duplicate payment" });
        }

        // Mark payment paid
        orderRecord.status = "completed";
        orderRecord.transaction_id = payment.id;
        orderRecord.payment_method = payment.method;
        orderRecord.payment_gateway = "razorpay";
        orderRecord.gateway_response = payment;
        orderRecord.transaction_date = new Date();
        orderRecord.notes = payment.description;

        await orderRecord.save();

        await callProcedure("EnrollUserInContest", [
          user_id, orderRecord.contest_id, null
        ]);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified",
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
