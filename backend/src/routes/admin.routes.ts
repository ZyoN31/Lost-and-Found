import { Router } from "express";
import { getDashboard, toggleUserStatus } from "../controllers/admin.controller.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/dashboard", getDashboard);
router.patch("/users/:id/toggle-status", toggleUserStatus);

export default router;
