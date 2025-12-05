// routes/resumeRoutes.js
import express from "express";
import Resume from "../models/Resume.js";
import { verifyToken, verifyAdmin } from "../middleware/auth.js";

const router = express.Router();
const adminAuth = [verifyToken, verifyAdmin];

// ✨ Utility: Ensure resume always exists
async function ensureResume() {
  let resume = await Resume.findOne();
  if (!resume) {
    resume = await Resume.create({});
  }
  // Ensure arrays exist if old DB resume broken
  resume.education ||= [];
  resume.certifications ||= [];
  resume.projects ||= [];
  resume.extracurricular ||= [];
  resume.skills ||= [];
  resume.customSections ||= [];
  return resume;
}

// ==================== PUBLIC ROUTE ====================
router.get("/public", async (req, res) => {
  try {
    const resume = await Resume.findOne({ isPublished: true }).lean();
    if (!resume)
      return res.status(404).json({ success: false, message: "Resume not found" });

    res.status(200).json({ success: true, data: resume });
  } catch (error) {
    console.error("Error fetching public resume:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ==================== ADMIN PROTECTED ROUTES ====================
router.get("/admin", adminAuth, async (req, res) => {
  try {
    const resume = await ensureResume();
    res.status(200).json({ success: true, data: resume });
  } catch (error) {
    console.error("Error fetching admin resume:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// FULL UPDATE resume
router.put("/", adminAuth, async (req, res) => {
  try {
    let resume = await ensureResume();
    Object.assign(resume, req.body);
    await resume.save();
    res.status(200).json({ success: true, message: "Resume updated", data: resume });
  } catch (error) {
    console.error("Resume Update Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ==================== EDUCATION ====================
router.post("/education", adminAuth, async (req, res) => {
  try {
    const resume = await ensureResume();
    resume.education.push(req.body);
    await resume.save();
    res.status(201).json({ success: true, message: "Added", data: resume.education });
  } catch (error) {
    console.error("Education Add Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

router.put("/education/:id", adminAuth, async (req, res) => {
  try {
    const resume = await ensureResume();
    const entry = resume.education.id(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: "Not found" });

    Object.assign(entry, req.body);
    await resume.save();
    res.status(200).json({ success: true, message: "Updated", data: entry });
  } catch (error) {
    console.error("Education Update Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

router.delete("/education/:id", adminAuth, async (req, res) => {
  try {
    const resume = await ensureResume();
    resume.education.pull(req.params.id);
    await resume.save();
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error("Education Delete Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ==================== CERTIFICATIONS ====================
router.post("/certifications", adminAuth, async (req, res) => {
  try {
    const resume = await ensureResume();
    resume.certifications.push(req.body);
    await resume.save();
    res.status(201).json({ success: true, message: "Added", data: resume.certifications });
  } catch (error) {
    console.error("Certification Add Error:", error);
    res.status(500).json({ success: false, message: "Failed", error: error.message });
  }
});

router.put("/certifications/:id", adminAuth, async (req, res) => {
  try {
    const resume = await ensureResume();
    const cert = resume.certifications.id(req.params.id);
    if (!cert) return res.status(404).json({ success: false, message: "Not found" });

    Object.assign(cert, req.body);
    await resume.save();
    res.status(200).json({ success: true, message: "Updated", data: cert });
  } catch (error) {
    console.error("Certification Update Error:", error);
    res.status(500).json({ success: false, message: "Failed", error: error.message });
  }
});

router.delete("/certifications/:id", adminAuth, async (req, res) => {
  try {
    const resume = await ensureResume();
    resume.certifications.pull(req.params.id);
    await resume.save();
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error("Certification Delete Error:", error);
    res.status(500).json({ success: false, message: "Failed", error: error.message });
  }
});

// ==================== PROJECTS ====================
router.post("/projects", adminAuth, async (req, res) => {
  try {
    const resume = await ensureResume();
    resume.projects.push(req.body);
    await resume.save();
    res.status(201).json({ success: true, message: "Added", data: resume.projects });
  } catch (error) {
    console.error("Project Add Error:", error);
    res.status(500).json({ success: false, message: "Failed", error: error.message });
  }
});

router.put("/projects/:id", adminAuth, async (req, res) => {
  try {
    const resume = await ensureResume();
    const project = resume.projects.id(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Not found" });

    Object.assign(project, req.body);
    await resume.save();
    res.status(200).json({ success: true, message: "Updated", data: project });
  } catch (error) {
    console.error("Project Update Error:", error);
    res.status(500).json({ success: false, message: "Failed", error: error.message });
  }
});

router.delete("/projects/:id", adminAuth, async (req, res) => {
  try {
    const resume = await ensureResume();
    resume.projects.pull(req.params.id);
    await resume.save();
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error("Project Delete Error:", error);
    res.status(500).json({ success: false, message: "Failed", error: error.message });
  }
});

// ==================== EXTRACURRICULAR ====================
router.post("/extracurricular", adminAuth, async (req, res) => {
  try {
    const resume = await ensureResume();
    resume.extracurricular.push(req.body);
    await resume.save();
    res.status(201).json({ success: true, message: "Added", data: resume.extracurricular });
  } catch (error) {
    console.error("Extra Add Error:", error);
    res.status(500).json({ success: false, message: "Failed", error: error.message });
  }
});

router.put("/extracurricular/:id", adminAuth, async (req, res) => {
  try {
    const resume = await ensureResume();
    const activity = resume.extracurricular.id(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: "Not found" });

    Object.assign(activity, req.body);
    await resume.save();
    res.status(200).json({ success: true, message: "Updated", data: activity });
  } catch (error) {
    console.error("Extra Update Error:", error);
    res.status(500).json({ success: false, message: "Failed", error: error.message });
  }
});

router.delete("/extracurricular/:id", adminAuth, async (req, res) => {
  try {
    const resume = await ensureResume();
    resume.extracurricular.pull(req.params.id);
    await resume.save();
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error("Extra Delete Error:", error);
    res.status(500).json({ success: false, message: "Failed", error: error.message });
  }
});

// ==================== SKILLS ====================
router.post("/skills", adminAuth, async (req, res) => {
  try {
    const resume = await ensureResume();
    resume.skills.push(req.body);
    await resume.save();
    res.status(201).json({ success: true, message: "Added", data: resume.skills });
  } catch (error) {
    console.error("Skills Add Error:", error);
    res.status(500).json({ success: false, message: "Failed", error: error.message });
  }
});

router.put("/skills/:index", adminAuth, async (req, res) => {
  try {
    const resume = await ensureResume();
    const index = parseInt(req.params.index);
    if (!resume.skills[index])
      return res.status(404).json({ success: false, message: "Not found" });

    resume.skills[index] = req.body;
    await resume.save();
    res.status(200).json({ success: true, message: "Updated", data: resume.skills });
  } catch (error) {
    console.error("Skills Update Error:", error);
    res.status(500).json({ success: false, message: "Failed", error: error.message });
  }
});

router.delete("/skills/:index", adminAuth, async (req, res) => {
  try {
    const resume = await ensureResume();
    const index = parseInt(req.params.index);
    if (!resume.skills[index])
      return res.status(404).json({ success: false, message: "Not found" });

    resume.skills.splice(index, 1);
    await resume.save();
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error("Skills Delete Error:", error);
    res.status(500).json({ success: false, message: "Failed", error: error.message });
  }
});

// ==================== CUSTOM SECTIONS ====================
router.post("/custom-sections", adminAuth, async (req, res) => {
  try {
    const resume = await ensureResume();
    resume.customSections.push(req.body);
    await resume.save();
    res.status(201).json({ success: true, message: "Added", data: resume.customSections });
  } catch (error) {
    console.error("Custom Section Add Error:", error);
    res.status(500).json({ success: false, message: "Failed", error: error.message });
  }
});

router.put("/custom-sections/:id", adminAuth, async (req, res) => {
  try {
    const resume = await ensureResume();
    const section = resume.customSections.id(req.params.id);
    if (!section) return res.status(404).json({ success: false, message: "Not found" });

    Object.assign(section, req.body);
    await resume.save();
    res.status(200).json({ success: true, message: "Updated", data: section });
  } catch (error) {
    console.error("Custom Section Update Error:", error);
    res.status(500).json({ success: false, message: "Failed", error: error.message });
  }
});

router.delete("/custom-sections/:id", adminAuth, async (req, res) => {
  try {
    const resume = await ensureResume();
    resume.customSections.pull(req.params.id);
    await resume.save();
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error("Custom Section Delete Error:", error);
    res.status(500).json({ success: false, message: "Failed", error: error.message });
  }
});

export default router;
