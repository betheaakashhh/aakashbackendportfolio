
import mongoose from 'mongoose';

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
    finalBudget: {
      type: Number,
      default: 0
    },
    initialPayment: {
      type: Boolean,
      default: false
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    dueAmount: {
      type: Number,
      default: 0
    },
    paymentHistory: [{
      amount: Number,
      date: {
        type: Date,
        default: Date.now
      },
      note: String,
      invoiceNumber: String,
      paymentMethod: String,
      isInitialPayment: {
        type: Boolean,
        default: false
      }
    }],
    fullyPaid: {
      type: Boolean,
      default: false
    }
  },
  
  // INVOICES ARRAY
  invoices: [{
    invoiceNumber: {
      type: String,
      required: true,
      unique: true
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    dueDate: Date,
    invoiceType: {
      type: String,
      enum: ['initial', 'milestone', 'final', 'standard'],
      default: 'standard'
    },
    items: [{
      description: String,
      quantity: {
        type: Number,
        default: 1
      },
      unitPrice: Number,
      total: Number
    }],
    subtotal: Number,
    tax: {
      type: Number,
      default: 0
    },
    totalAmount: Number,
    amountPaid: {
      type: Number,
      default: 0
    },
    balanceDue: Number,
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'cancelled', 'partial'],
      default: 'pending'
    },
    paymentMethod: String,
    notes: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
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
  }
}, {
  timestamps: true
});

// Middleware to automatically update due amount and status
projectRequestSchema.pre('save', function(next) {
  // Update payment calculations
  if (this.payment && this.payment.finalBudget !== undefined) {
    this.payment.dueAmount = this.payment.finalBudget - (this.payment.paidAmount || 0);
    this.payment.fullyPaid = this.payment.dueAmount <= 0;
  }
  
  // Update invoice balance due
  if (this.invoices && this.invoices.length > 0) {
    this.invoices.forEach(invoice => {
      if (invoice.totalAmount !== undefined && invoice.amountPaid !== undefined) {
        invoice.balanceDue = invoice.totalAmount - invoice.amountPaid;
        
        // Update invoice status based on balance
        if (invoice.balanceDue <= 0) {
          invoice.status = 'paid';
        } else if (invoice.balanceDue > 0 && invoice.amountPaid > 0) {
          invoice.status = 'partial';
        }
        
        // Check if invoice is overdue
        if (invoice.dueDate && new Date() > invoice.dueDate && invoice.status !== 'paid') {
          invoice.status = 'overdue';
        }
      }
    });
  }
  
  next();
});

// Virtual for payment progress percentage
projectRequestSchema.virtual('paymentProgress').get(function() {
  if (!this.payment || !this.payment.finalBudget || this.payment.finalBudget === 0) {
    return 0;
  }
  return Math.round((this.payment.paidAmount / this.payment.finalBudget) * 100);
});

// Virtual for total invoice amount
projectRequestSchema.virtual('totalInvoiceAmount').get(function() {
  if (!this.invoices || this.invoices.length === 0) {
    return 0;
  }
  return this.invoices.reduce((total, invoice) => total + (invoice.totalAmount || 0), 0);
});

// Virtual for pending invoice amount
projectRequestSchema.virtual('pendingInvoiceAmount').get(function() {
  if (!this.invoices || this.invoices.length === 0) {
    return 0;
  }
  return this.invoices
    .filter(invoice => invoice.status === 'pending' || invoice.status === 'partial')
    .reduce((total, invoice) => total + (invoice.balanceDue || 0), 0);
});

// Virtual for paid invoice amount
projectRequestSchema.virtual('paidInvoiceAmount').get(function() {
  if (!this.invoices || this.invoices.length === 0) {
    return 0;
  }
  return this.invoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((total, invoice) => total + (invoice.totalAmount || 0), 0);
});

const ProjectRequest = mongoose.model('ProjectRequest', projectRequestSchema);

export default ProjectRequest;
