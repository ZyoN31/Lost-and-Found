import { Router } from "express";
import {
  getMe,
  login,
  logout,
  register,
  updateProfilePhoto,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { handleSingleImageUpload } from "../middleware/upload.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);
router.patch(
  "/profile-photo",
  authenticate,
  handleSingleImageUpload("foto"),
  updateProfilePhoto
);

export default router;
