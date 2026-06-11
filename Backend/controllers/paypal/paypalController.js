const { client } = require('../../config/paypal');
const checkoutNodeJssdk = require("@paypal/checkout-server-sdk");

exports.OrdersCreateRequest = async (req, res, next) => {
  const { amount , currency = null} = req.body;

  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [{
      amount: {
        currency_code: currency || "USD",
        value: amount?.toString()
      }
    }]
  });

  try {
    const order = await client().execute(request);
    res.json({ id: order.result.id });
  } catch (error) {
    next(error);
  }
};

exports.OrdersCaptureRequest = async (req, res, next) => {
  const orderId = req.body.orderId;

  const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  try {
    const capture = await client().execute(request);    
    res.json({ capture: capture.result });
  } catch (error) {
    next(error);
  }
};
