// routes/resumeRoutes.js
import express from 'express';
import Resume from '../models/Resume.js';
// ✅ FIXED: Use the correct auth middleware names
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// Create a combined middleware for admin auth
const adminAuth = [verifyToken, verifyAdmin];

// ==================== PUBLIC ROUTES ====================

// GET - Fetch public resume (for portfolio display)
router.get('/public', async (req, res) => {
  try {
    const resume = await Resume.findOne({ isPublished: true })
      .select('-__v')
      .lean();

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    res.status(200).json({
      success: true,
      data: resume
    });
  } catch (error) {
    console.error('Error fetching public resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume',
      error: error.message
    });
  }
});

// ==================== ADMIN PROTECTED ROUTES ====================

// GET - Fetch resume for editing (admin only)
router.get('/admin', adminAuth, async (req, res) => {
  try {
    let resume = await Resume.findOne();

    // Create default resume if none exists
    if (!resume) {
      resume = await Resume.create({
        fullName: '',
        title: '',
        email: '',
        education: [],
        certifications: [],
        projects: [],
        extracurricular: [],
        skills: [],
        customSections: []
      });
    }

    res.status(200).json({
      success: true,
      data: resume
    });
  } catch (error) {
    console.error('Error fetching admin resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume',
      error: error.message
    });
  }
});

// PUT - Update entire resume (admin only)
router.put('/', adminAuth, async (req, res) => {
  try {
    let resume = await Resume.findOne();

    if (!resume) {
      resume = await Resume.create(req.body);
    } else {
      Object.assign(resume, req.body);
      await resume.save();
    }

    res.status(200).json({
      success: true,
      message: 'Resume updated successfully',
      data: resume
    });
  } catch (error) {
    console.error('Error updating resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update resume',
      error: error.message
    });
  }
});

// ==================== EDUCATION ROUTES ====================

// POST - Add education entry
router.post('/education', adminAuth, async (req, res) => {
  try {
    const resume = await Resume.findOne();
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    resume.education.push(req.body);
    await resume.save();

    res.status(201).json({
      success: true,
      message: 'Education entry added',
      data: resume.education
    });
  } catch (error) {
    console.error('Error adding education:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add education',
      error: error.message
    });
  }
});

// PUT - Update specific education entry
router.put('/education/:id', adminAuth, async (req, res) => {
  try {
    const resume = await Resume.findOne();
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    const educationEntry = resume.education.id(req.params.id);
    
    if (!educationEntry) {
      return res.status(404).json({
        success: false,
        message: 'Education entry not found'
      });
    }

    Object.assign(educationEntry, req.body);
    await resume.save();

    res.status(200).json({
      success: true,
      message: 'Education entry updated',
      data: educationEntry
    });
  } catch (error) {
    console.error('Error updating education:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update education',
      error: error.message
    });
  }
});

// DELETE - Remove education entry
router.delete('/education/:id', adminAuth, async (req, res) => {
  try {
    const resume = await Resume.findOne();
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    resume.education.pull(req.params.id);
    await resume.save();

    res.status(200).json({
      success: true,
      message: 'Education entry deleted'
    });
  } catch (error) {
    console.error('Error deleting education:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete education',
      error: error.message
    });
  }
});

// ==================== CERTIFICATION ROUTES ====================

router.post('/certifications', adminAuth, async (req, res) => {
  try {
    const resume = await Resume.findOne();
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }
    resume.certifications.push(req.body);
    await resume.save();
    res.status(201).json({ success: true, message: 'Certification added', data: resume.certifications });
  } catch (error) {
    console.error('Error adding certification:', error);
    res.status(500).json({ success: false, message: 'Failed to add certification', error: error.message });
  }
});

router.put('/certifications/:id', adminAuth, async (req, res) => {
  try {
    const resume = await Resume.findOne();
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    const certification = resume.certifications.id(req.params.id);
    if (!certification) return res.status(404).json({ success: false, message: 'Certification not found' });
    Object.assign(certification, req.body);
    await resume.save();
    res.status(200).json({ success: true, message: 'Certification updated', data: certification });
  } catch (error) {
    console.error('Error updating certification:', error);
    res.status(500).json({ success: false, message: 'Failed to update certification', error: error.message });
  }
});

router.delete('/certifications/:id', adminAuth, async (req, res) => {
  try {
    const resume = await Resume.findOne();
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    resume.certifications.pull(req.params.id);
    await resume.save();
    res.status(200).json({ success: true, message: 'Certification deleted' });
  } catch (error) {
    console.error('Error deleting certification:', error);
    res.status(500).json({ success: false, message: 'Failed to delete certification', error: error.message });
  }
});

// ==================== PROJECT ROUTES ====================

router.post('/projects', adminAuth, async (req, res) => {
  try {
    const resume = await Resume.findOne();
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    resume.projects.push(req.body);
    await resume.save();
    res.status(201).json({ success: true, message: 'Project added', data: resume.projects });
  } catch (error) {
    console.error('Error adding project:', error);
    res.status(500).json({ success: false, message: 'Failed to add project', error: error.message });
  }
});

router.put('/projects/:id', adminAuth, async (req, res) => {
  try {
    const resume = await Resume.findOne();
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    const project = resume.projects.id(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    Object.assign(project, req.body);
    await resume.save();
    res.status(200).json({ success: true, message: 'Project updated', data: project });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, message: 'Failed to update project', error: error.message });
  }
});

router.delete('/projects/:id', adminAuth, async (req, res) => {
  try {
    const resume = await Resume.findOne();
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    resume.projects.pull(req.params.id);
    await resume.save();
    res.status(200).json({ success: true, message: 'Project deleted' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, message: 'Failed to delete project', error: error.message });
  }
});

// ==================== EXTRACURRICULAR ROUTES ====================

router.post('/extracurricular', adminAuth, async (req, res) => {
  try {
    const resume = await Resume.findOne();
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    resume.extracurricular.push(req.body);
    await resume.save();
    res.status(201).json({ success: true, message: 'Extracurricular activity added', data: resume.extracurricular });
  } catch (error) {
    console.error('Error adding extracurricular:', error);
    res.status(500).json({ success: false, message: 'Failed to add extracurricular activity', error: error.message });
  }
});

router.put('/extracurricular/:id', adminAuth, async (req, res) => {
  try {
    const resume = await Resume.findOne();
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    const activity = resume.extracurricular.id(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Extracurricular activity not found' });
    Object.assign(activity, req.body);
    await resume.save();
    res.status(200).json({ success: true, message: 'Extracurricular activity updated', data: activity });
  } catch (error) {
    console.error('Error updating extracurricular:', error);
    res.status(500).json({ success: false, message: 'Failed to update extracurricular activity', error: error.message });
  }
});

router.delete('/extracurricular/:id', adminAuth, async (req, res) => {
  try {
    const resume = await Resume.findOne();
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    resume.extracurricular.pull(req.params.id);
    await resume.save();
    res.status(200).json({ success: true, message: 'Extracurricular activity deleted' });
  } catch (error) {
    console.error('Error deleting extracurricular:', error);
    res.status(500).json({ success: false, message: 'Failed to delete extracurricular activity', error: error.message });
  }
});

// ==================== SKILLS ROUTES ====================

router.post('/skills', adminAuth, async (req, res) => {
  try {
    const resume = await Resume.findOne();
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    resume.skills.push(req.body);
    await resume.save();
    res.status(201).json({ success: true, message: 'Skill category added', data: resume.skills });
  } catch (error) {
    console.error('Error adding skills:', error);
    res.status(500).json({ success: false, message: 'Failed to add skills', error: error.message });
  }
});

router.put('/skills/:index', adminAuth, async (req, res) => {
  try {
    const resume = await Resume.findOne();
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    const index = parseInt(req.params.index);
    if (index < 0 || index >= resume.skills.length) {
      return res.status(404).json({ success: false, message: 'Skill category not found' });
    }
    resume.skills[index] = req.body;
    await resume.save();
    res.status(200).json({ success: true, message: 'Skills updated', data: resume.skills });
  } catch (error) {
    console.error('Error updating skills:', error);
    res.status(500).json({ success: false, message: 'Failed to update skills', error: error.message });
  }
});

router.delete('/skills/:index', adminAuth, async (req, res) => {
  try {
    const resume = await Resume.findOne();
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    const index = parseInt(req.params.index);
    if (index < 0 || index >= resume.skills.length) {
      return res.status(404).json({ success: false, message: 'Skill category not found' });
    }
    resume.skills.splice(index, 1);
    await resume.save();
    res.status(200).json({ success: true, message: 'Skill category deleted' });
  } catch (error) {
    console.error('Error deleting skills:', error);
    res.status(500).json({ success: false, message: 'Failed to delete skills', error: error.message });
  }
});

// ==================== CUSTOM SECTIONS ROUTES ====================

router.post('/custom-sections', adminAuth, async (req, res) => {
  try {
    const resume = await Resume.findOne();
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    resume.customSections.push(req.body);
    await resume.save();
    res.status(201).json({ success: true, message: 'Custom section added', data: resume.customSections });
  } catch (error) {
    console.error('Error adding custom section:', error);
    res.status(500).json({ success: false, message: 'Failed to add custom section', error: error.message });
  }
});

router.put('/custom-sections/:id', adminAuth, async (req, res) => {
  try {
    const resume = await Resume.findOne();
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    const section = resume.customSections.id(req.params.id);
    if (!section) return res.status(404).json({ success: false, message: 'Custom section not found' });
    Object.assign(section, req.body);
    await resume.save();
    res.status(200).json({ success: true, message: 'Custom section updated', data: section });
  } catch (error) {
    console.error('Error updating custom section:', error);
    res.status(500).json({ success: false, message: 'Failed to update custom section', error: error.message });
  }
});

router.delete('/custom-sections/:id', adminAuth, async (req, res) => {
  try {
    const resume = await Resume.findOne();
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    resume.customSections.pull(req.params.id);
    await resume.save();
    res.status(200).json({ success: true, message: 'Custom section deleted' });
  } catch (error) {
    console.error('Error deleting custom section:', error);
    res.status(500).json({ success: false, message: 'Failed to delete custom section', error: error.message });
  }
});

// ==================== TOGGLE PUBLISH STATUS ====================

router.patch('/publish', adminAuth, async (req, res) => {
  try {
    const resume = await Resume.findOne();
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    resume.isPublished = !resume.isPublished;
    await resume.save();
    res.status(200).json({
      success: true,
      message: `Resume ${resume.isPublished ? 'published' : 'unpublished'}`,
      data: { isPublished: resume.isPublished }
    });
  } catch (error) {
    console.error('Error toggling publish status:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle publish status', error: error.message });
  }
});

export default router;