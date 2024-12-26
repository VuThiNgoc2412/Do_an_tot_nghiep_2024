import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import {
  allReviewsOfProduct,
  createProduct,
  createReview,
  deleteProduct,
  getAdminProducts,
  getAllCategories,
  getAllProducts,
  getSingleProduct,
  recommend,
  updateProduct,
} from "../controllers/product.controller.js";
import { mutliUpload } from "../middleware/multer.middleware.js";

const router = express.Router();

//To Create New Product  - /api/product/new
router.post("/new", protectRoute, adminRoute, mutliUpload, createProduct);

//To get all unique Categories  - /api/product/categories
router.get("/categories", getAllCategories);

//To get all Products with filters  - /api/v1/product/all
router.get("/all", getAllProducts);

//To get all Products with filters  - /api/v1/product/all
router.get("/all-admin", getAdminProducts);

//To recommend  - /api/product/recommend
router.get("/recommend", protectRoute, recommend);

// To get, update, delete Product
router
  .route("/:id")
  .get(getSingleProduct)
  .put(protectRoute, adminRoute, mutliUpload, updateProduct)
  .delete(protectRoute, adminRoute, deleteProduct);

router.post("/review/new/:id", protectRoute, createReview);
router.get("/reviews/:id", allReviewsOfProduct);

export default router;
