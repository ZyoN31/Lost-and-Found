import { Router } from "express";
import {
  addComment,
  createItem,
  deleteComment,
  deleteItem,
  getItemById,
  getItems,
  markItemReturned,
  updateItem,
} from "../controllers/items.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { handleSingleImageUpload } from "../middleware/upload.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getItems);
router.get("/:id", getItemById);
router.post("/", handleSingleImageUpload("foto"), createItem);
router.put("/:id", handleSingleImageUpload("foto"), updateItem);
router.patch("/:id/status", markItemReturned);
router.delete("/:id", deleteItem);

router.post("/:id/comments", addComment);
router.delete("/:id/comments/:commentId", deleteComment);

export default router;
