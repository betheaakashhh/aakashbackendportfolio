// models/Resume.js
import mongoose from 'mongoose';

// ================= EDUCATION =================
const educationSchema = new mongoose.Schema({
  institution: { type: String, trim: true, default: "" },
  course: { type: String, trim: true, default: "" },
  location: { type: String, trim: true, default: "" },
  startYear: { type: String, default: "" },
  endYear: { type: String, default: "" },
  cgpa: { type: String, trim: true, default: "" }
}, { _id: true });

// ================= CERTIFICATIONS =================
const certificationSchema = new mongoose.Schema({
  title: { type: String, trim: true, default: "" },
  issuer: { type: String, trim: true, default: "" },
  year: { type: String, default: "" },
  description: { type: String, trim: true, default: "" },
  certificateLink: { type: String, trim: true, default: "" }
}, { _id: true });

// ================= PROJECTS =================
const projectSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: "" },
  description: { type: String, trim: true, default: "" },
  technologies: { type: String, trim: true, default: "" },
  githubLink: { type: String, trim: true, default: "" },
  liveLink: { type: String, trim: true, default: "" },
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" }
}, { _id: true });

// ================= EXTRACURRICULAR =================
const extracurricularSchema = new mongoose.Schema({
  title: { type: String, trim: true, default: "" },
  organization: { type: String, trim: true, default: "" },
  year: { type: String, default: "" },
  description: { type: String, trim: true, default: "" },
  role: { type: String, trim: true, default: "" }
}, { _id: true });

// ================= CUSTOM SECTIONS =================
const customSectionSchema = new mongoose.Schema({
  heading: { type: String, trim: true, default: "" },
  items: [{
    title: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    date: { type: String, default: "" },
    additionalInfo: { type: String, trim: true, default: "" }
  }]
}, { _id: true });

// ================= MAIN RESUME SCHEMA =================
const resumeSchema = new mongoose.Schema({
  fullName: { type: String, trim: true, default: "" },
  title: { type: String, trim: true, default: "" },
  email: { type: String, trim: true, default: "" },
  phone: { type: String, trim: true, default: "" },
  location: { type: String, trim: true, default: "" },
  portfolio: { type: String, trim: true, default: "" },
  linkedin: { type: String, trim: true, default: "" },
  github: { type: String, trim: true, default: "" },
  summary: { type: String, trim: true, default: "" },

  skills: {
    type: [{
      category: { type: String, trim: true, default: "" },
      items: { type: [String], default: [] }
    }],
    default: []
  },

  education: { type: [educationSchema], default: [] },
  certifications: { type: [certificationSchema], default: [] },
  projects: { type: [projectSchema], default: [] },
  extracurricular: { type: [extracurricularSchema], default: [] },
  customSections: { type: [customSectionSchema], default: [] },

  isPublished: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

resumeSchema.pre("save", function (next) {
  this.lastUpdated = new Date();
  next();
});

const Resume = mongoose.model("Resume", resumeSchema);
export default Resume;
