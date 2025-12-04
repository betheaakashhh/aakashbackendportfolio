// models/Resume.js
import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema({
  institution: {
    type: String,
    required: true,
    trim: true
  },
  course: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  startYear: {
    type: String,
    required: true
  },
  endYear: {
    type: String,
    required: true
  },
  cgpa: {
    type: String,
    trim: true
  }
}, { _id: true });

const certificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  issuer: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  certificateLink: {
    type: String,
    trim: true
  }
}, { _id: true });

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  technologies: {
    type: String,
    trim: true
  },
  githubLink: {
    type: String,
    trim: true
  },
  liveLink: {
    type: String,
    trim: true
  },
  startDate: {
    type: String
  },
  endDate: {
    type: String
  }
}, { _id: true });

const extracurricularSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  organization: {
    type: String,
    trim: true
  },
  year: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    trim: true
  }
}, { _id: true });

const customSectionSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true,
    trim: true
  },
  items: [{
    title: String,
    description: String,
    date: String,
    additionalInfo: String
  }]
}, { _id: true });

const resumeSchema = new mongoose.Schema({
  // Personal Info
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  portfolio: {
    type: String,
    trim: true
  },
  linkedin: {
    type: String,
    trim: true
  },
  github: {
    type: String,
    trim: true
  },
  summary: {
    type: String,
    trim: true
  },

  // Skills
  skills: [{
    category: String,
    items: [String]
  }],

  // Main Sections
  education: [educationSchema],
  certifications: [certificationSchema],
  projects: [projectSchema],
  extracurricular: [extracurricularSchema],
  
  // Custom sections for future flexibility
  customSections: [customSectionSchema],

  // Visibility and metadata
  isPublished: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastUpdated on save
resumeSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;