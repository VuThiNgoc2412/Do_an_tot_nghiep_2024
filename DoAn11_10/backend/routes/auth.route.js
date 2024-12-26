import express from "express";
import {
  deleteUser,
  getAllUsers,
  login,
  logout,
  refreshToken,
  signup,
} from "../controllers/auth.controller.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.get("/all", protectRoute, adminRoute, getAllUsers);
router.delete("/:id", protectRoute, adminRoute, deleteUser);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
export default router;
