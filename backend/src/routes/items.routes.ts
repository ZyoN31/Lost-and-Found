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
import { authenticate, optionalAuth } from "../middleware/auth.middleware.js";
import { handleSingleImageUpload } from "../middleware/upload.middleware.js";

const router = Router();

// Read-only endpoints are public: anonymous visitors may browse the feed.
// Anything that mutates data requires a valid session.
router.get("/", optionalAuth, getItems);
router.get("/:id", optionalAuth, getItemById);
router.post("/", authenticate, handleSingleImageUpload("foto"), createItem);
router.put("/:id", authenticate, handleSingleImageUpload("foto"), updateItem);
router.patch("/:id/status", authenticate, markItemReturned);
router.delete("/:id", authenticate, deleteItem);

router.post("/:id/comments", authenticate, addComment);
router.delete("/:id/comments/:commentId", authenticate, deleteComment);

export default router;
