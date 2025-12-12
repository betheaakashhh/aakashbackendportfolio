// routes/updateInfoRoutes.js
import express from "express";
import UpdateInfo from "../models/UpdateInfo.js";
import { verifyToken, verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

// Get active updates (For frontend user side)
router.get("/", async (req, res) => {
  try {
    const updates = await UpdateInfo.find({ isActive: true })
      .sort({ createdAt: -1 });
    res.json(updates);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: Create update
router.post("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const update = new UpdateInfo(req.body);
    await update.save();
    res.status(201).json({ message: "Update created", update });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: Update update
router.put("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const updated = await UpdateInfo.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: Delete update
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await UpdateInfo.findByIdAndDelete(req.params.id);
    res.json({ message: "Update deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
// ADMIN — Get ALL updates (active + inactive)
router.get("/all", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const updates = await UpdateInfo.find().sort({ createdAt: -1 });
    res.json(updates);
  } catch (error) {
    console.error("Error fetching all updates:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
