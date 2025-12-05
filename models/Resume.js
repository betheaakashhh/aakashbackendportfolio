// models/Resume.js
import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema({
  institution: { type: String, required: true, trim: true },
  course: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  startYear: { type: String, required: true },
  endYear: { type: String, required: true },
  cgpa: { type: String, trim: true }
}, { _id: true });

const certificationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  issuer: { type: String, required: true, trim: true },
  year: { type: String, required: true },
  description: { type: String, trim: true },
  certificateLink: { type: String, trim: true }
}, { _id: true });

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  technologies: { type: String, trim: true },
  githubLink: { type: String, trim: true },
  liveLink: { type: String, trim: true },
  startDate: { type: String },
  endDate: { type: String }
}, { _id: true });

const extracurricularSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  organization: { type: String, trim: true },
  year: { type: String, required: true },
  description: { type: String, required: true, trim: true },
  role: { type: String, trim: true }
}, { _id: true });

const customSectionSchema = new mongoose.Schema({
  heading: { type: String, required: true, trim: true },
  items: [{
    title: String,
    description: String,
    date: String,
    additionalInfo: String
  }]
}, { _id: true });

const resumeSchema = new mongoose.Schema({
  // 🔹 Personal Info with safe defaults
  fullName: { type: String, default: "", trim: true },
  title: { type: String, default: "", trim: true },
  email: { type: String, default: "", trim: true },
  phone: { type: String, default: "", trim: true },
  location: { type: String, default: "", trim: true },
  portfolio: { type: String, default: "", trim: true },
  linkedin: { type: String, default: "", trim: true },
  github: { type: String, default: "", trim: true },
  summary: { type: String, default: "", trim: true },

  // 🔹 Array sections must always exist
  skills: {
    type: [{
      category: String,
      items: [String]
    }],
    default: []
  },

  education: { type: [educationSchema], default: [] },
  certifications: { type: [certificationSchema], default: [] },
  projects: { type: [projectSchema], default: [] },
  extracurricular: { type: [extracurricularSchema], default: [] },
  customSections: { type: [customSectionSchema], default: [] },

  // Publish settings
  isPublished: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now }

}, { timestamps: true });

// Auto update lastUpdated
resumeSchema.pre('save', function (next) {
  this.lastUpdated = new Date();
  next();
});

const Resume = mongoose.model('Resume', resumeSchema);
export default Resume;
