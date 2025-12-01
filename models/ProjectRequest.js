const mongoose = require('mongoose');

const projectRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: String,
    required: true
  },
  budget: {
    type: Number,
    required: true
  },
  tools: {
    type: String,
    required: true
  },
  projectType: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  attachmentLink: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['requested', 'accepted', 'negotiable', 'rejected'],
    default: 'requested'
  },
  negotiation: {
    proposedBudget: Number,
    proposedDuration: String,
    adminNotes: String,
    negotiatedAt: Date
  },
  rejection: {
    reason: String,
    rejectedAt: Date
  },
  payment: {
    finalBudget: Number,
    paidAmount: {
      type: Number,
      default: 0
    },
    dueAmount: Number,
    paymentHistory: [{
      amount: Number,
      date: Date,
      note: String
    }]
  },
  timeline: {
    startDate: Date,
    deadline: Date,
    completedDate: Date
  },
  commits: [{
    weekNumber: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    completedTasks: [{
      type: String
    }],
    date: {
      type: Date,
      default: Date.now
    }
  }],
  hasUnreadUpdate: {
    type: Boolean,
    default: false
  },
  lastUpdatedBy: {
    type: String,
    enum: ['client', 'admin'],
    default: 'client'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ProjectRequest', projectRequestSchema);