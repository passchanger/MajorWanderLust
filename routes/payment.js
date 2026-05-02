const express = require("express");
const router = express.Router();
const razorpay = require("../utils/payment");

router.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    console.log("AMOUNT:", amount); // debug

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
    });

    res.json(order);

  } catch (err) {
    console.log("ERROR:", err);
    res.status(500).send("error");
  }
});

module.exports = router;