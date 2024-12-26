import Coupon from "../models/coupon.model.js";
import { stripe } from "../server.js";

export const createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount)
      return res.status(400).json({ message: "Please enter amount" });
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Number(amount) * 100,
      currency: "inr",
    });
    res.status(201).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.log("Error in createPaymentIntent controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const newCoupon = async (req, res) => {
  try {
    const { code, amount } = req.body;

    if (!code || !amount)
      return res
        .status(400)
        .json({ message: "Please enter both coupon and amount" });

    const codeExists = await Coupon.findOne({ code: code });

    if (codeExists) {
      return res.status(400).json({ message: "Code already exists" });
    }

    await Coupon.create({ code, amount });

    res.status(201).json({
      success: true,
      message: `Coupon ${code} Created Successfully`,
    });
  } catch (error) {
    console.log("Error in newCoupon controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const applyDiscount = async (req, res) => {
  try {
    const { coupon } = req.query;

    const discount = await Coupon.findOne({ code: coupon });

    if (!discount)
      return res.status(400).json({ message: "Invalid Coupon Code" });

    res.status(200).json({
      success: true,
      discount: discount.amount,
    });
  } catch (error) {
    console.log("Error in applyDiscount controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const allCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({});
    res.status(200).json({
      success: true,
      coupons,
    });
  } catch (error) {
    console.log("Error in allCoupons controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);

    if (!coupon) return res.status(400).json({ message: "Invalid Coupon ID" });

    res.status(200).json({
      success: true,
      coupon,
    });
  } catch (error) {
    console.log("Error in getCoupon controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const { code, amount } = req.body;

    const coupon = await Coupon.findById(id);

    if (!coupon) return res.status(400).json({ message: "Invalid Coupon ID" });

    if (code) coupon.code = code;
    if (amount) coupon.amount = amount;

    await coupon.save();

    res.status(200).json({
      success: true,
      message: `Coupon ${coupon.code} Updated Successfully`,
    });
  } catch (error) {
    console.log("Error in updateCoupon controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) return res.status(400).json({ message: "Invalid Coupon ID" });

    res.status(200).json({
      success: true,
      message: `Coupon ${coupon.code} Deleted Successfully`,
    });
  } catch (error) {
    console.log("Error in deleteCoupon controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
