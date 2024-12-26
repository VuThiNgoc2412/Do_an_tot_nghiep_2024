import express from "express";
import {
  allOrders,
  cancelOrder,
  createOrder,
  deleteOrder,
  getSingleOrder,
  myOrders,
  processOrder,
  receiveOrder,
} from "../controllers/order.controller.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

//To Create New Order  - /api/order/new
router.post("/new", protectRoute, createOrder);
//To my Order  - /api/order/myorder
router.get("/my", protectRoute, myOrders);
//To all Order  - /api/order/myorder
router.get("/all", protectRoute, adminRoute, allOrders);

router
  .route("/:id")
  .get(protectRoute, getSingleOrder)
  .put(protectRoute, adminRoute, processOrder)
  .delete(protectRoute, adminRoute, deleteOrder);

//To Cancel Order - /api/order/cancel/:id
router.put("/cancel/:id", protectRoute, cancelOrder);
router.put("/receive/:id", protectRoute, receiveOrder);
export default router;
