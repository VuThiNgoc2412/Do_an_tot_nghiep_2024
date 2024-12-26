import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import {
  allCoupons,
  applyDiscount,
  createPaymentIntent,
  deleteCoupon,
  getCoupon,
  newCoupon,
  updateCoupon,
} from "../controllers/payment.controller.js";

const router = express.Router();

//To Create New Coupon  - /api/payment/create
router.post("/create", protectRoute, createPaymentIntent);
//To Create New Coupon  - /api/payment/coupon/new
router.post("/coupon/new", protectRoute, adminRoute, newCoupon);
// route - /api/v1/payment/coupon/discount
router.get("/discount", protectRoute, applyDiscount);
// route - /api/v1/payment/coupon/all
router.get("/coupon/all", protectRoute, adminRoute, allCoupons);

// route - /api/v1/payment/coupon/:id
router
  .route("/coupon/:id")
  .get(protectRoute, adminRoute, getCoupon)
  .put(protectRoute, adminRoute, updateCoupon)
  .delete(protectRoute, adminRoute, deleteCoupon);

export default router;
