import express from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  toggleLike,
  addComment,
  deleteBlog,
  getAllBlogsAdmin,
  updateBlog,
} from "../controllers/blogController.js";

import { verifyToken, verifyAdmin } from "../middleware/auth.js";
import { trackDevice } from "../middleware/deviceTrack.js";

const router = express.Router();

// ===== ADMIN ROUTES (Protected) =====
// IMPORTANT: Admin routes must come BEFORE public routes to avoid conflicts

// Get all blogs for admin (with full data including likes/comments)
router.get("/admin/all", verifyToken, verifyAdmin, getAllBlogsAdmin);

// Create new blog
router.post("/", verifyToken, verifyAdmin, createBlog);

// Update blog by ID
router.put("/admin/update/:id", verifyToken, verifyAdmin, updateBlog);

// Delete blog by ID
router.delete("/:id", verifyToken, verifyAdmin, deleteBlog);

// ===== PUBLIC ROUTES =====

// Get all published blogs (feed list)
router.get("/", getAllBlogs);

// Get single blog by slug (must be after /admin routes to avoid conflict)
router.get("/:slug", getBlogBySlug);

// Like/Unlike blog
router.post("/:id/like", trackDevice, toggleLike);

// Add comment to blog
router.post("/:id/comment", trackDevice, addComment);

export default router;