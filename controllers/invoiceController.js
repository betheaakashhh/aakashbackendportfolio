
import ProjectRequest from '../models/ProjectRequest.js';
import User from '../models/User.js';
import PDFDocument from 'pdfkit';

// Helper functions
const generateInvoiceNumber = (projectName = '') => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const prefix = projectName.substring(0, 3).toUpperCase();
  return `INV-${prefix}-${timestamp}-${random}`;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

// Create Invoice
export const createInvoice = async (req, res) => {
  try {
    const { 
      projectId, 
      items, 
      dueDate, 
      taxRate = 0, 
      paymentMethod = 'Bank Transfer', 
      notes,
      invoiceType = 'standard'
    } = req.body;

    const userId = req.userId;
    const userRole = req.userRole;

    console.log(`📝 Creating ${invoiceType} invoice for project:`, projectId);

    // Find the project
    const project = await ProjectRequest.findById(projectId)
      .populate('userId', 'name email contact company country city');
    
    if (!project) {
      console.error('❌ Project not found:', projectId);
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    // Check authorization
    if (userRole !== 'admin' && project.userId.toString() !== userId) {
      console.error('❌ Unauthorized access attempt by user:', userId);
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    // Validate project status
    if (project.status !== 'accepted') {
      console.error('❌ Invalid project status for invoice:', project.status);
      return res.status(400).json({ 
        success: false,
        message: 'Invoices can only be created for accepted projects' 
      });
    }

    // Validate payment data exists
    if (!project.payment || !project.payment.finalBudget) {
      return res.status(400).json({
        success: false,
        message: 'Project payment details not configured'
      });
    }

    let invoiceItems = items;
    let subtotal, tax, totalAmount;

    // Handle automatic invoice creation based on type
    if (!invoiceItems || invoiceItems.length === 0) {
      const projectBudget = project.payment.finalBudget;
      
      switch(invoiceType) {
        case 'initial':
          if (project.payment.initialPayment) {
            return res.status(400).json({
              success: false,
              message: 'Initial payment already made for this project'
            });
          }
          subtotal = projectBudget * 0.5;
          break;
          
        case 'final':
          if (project.payment.dueAmount <= 0) {
            return res.status(400).json({
              success: false,
              message: 'No balance due for final payment'
            });
          }
          subtotal = project.payment.dueAmount;
          break;
          
        case 'milestone':
          subtotal = projectBudget * 0.25;
          break;
          
        default:
          subtotal = projectBudget;
      }
      
      tax = subtotal * (taxRate / 100);
      totalAmount = subtotal + tax;
      
      invoiceItems = [{
        description: `${invoiceType.charAt(0).toUpperCase() + invoiceType.slice(1)} Payment - ${project.projectName}`,
        quantity: 1,
        unitPrice: totalAmount,
        total: totalAmount
      }];
    } else {
      // Calculate from custom items
      subtotal = invoiceItems.reduce((sum, item) => 
        sum + (item.quantity * item.unitPrice), 0
      );
      tax = subtotal * (taxRate / 100);
      totalAmount = subtotal + tax;
    }

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber(project.projectName);
    
    // Create invoice object
    const invoice = {
      invoiceNumber,
      issueDate: new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      invoiceType,
      items: invoiceItems,
      subtotal,
      tax,
      totalAmount,
      amountPaid: 0,
      balanceDue: totalAmount,
      status: 'pending',
      paymentMethod,
      notes: notes || `Invoice for ${project.projectName} - ${invoiceType} payment`
    };

    // Add to project
    if (!project.invoices) {
      project.invoices = [];
    }
    
    project.invoices.push(invoice);
    project.hasUnreadUpdate = true;
    project.lastUpdatedBy = userRole === 'admin' ? 'admin' : 'client';
    
    await project.save();
    
    console.log('✅ Invoice created successfully:', invoiceNumber);
    
    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: {
        invoice: {
          ...invoice,
          projectId: project._id,
          projectName: project.projectName,
          clientName: project.userId.name,
          clientEmail: project.userId.email
        }
      }
    });
  } catch (error) {
    console.error('❌ Create invoice error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error: ' + error.message 
    });
  }
};

// Get Payment Summary
export const getPaymentSummary = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;

    const project = await ProjectRequest.findById(projectId)
      .populate('userId', 'name email contact');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check authorization
    if (userRole !== 'admin' && project.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const summary = {
      projectId: project._id,
      projectName: project.projectName,
      projectStatus: project.status,
      client: {
        name: project.userId.name,
        email: project.userId.email,
        contact: project.userId.contact
      },
      payment: {
        totalBudget: project.payment?.finalBudget || 0,
        paidAmount: project.payment?.paidAmount || 0,
        dueAmount: project.payment?.dueAmount || 0,
        initialPaymentMade: project.payment?.initialPayment || false,
        fullyPaid: project.payment?.fullyPaid || false
      },
      invoices: project.invoices || [],
      paymentHistory: project.payment?.paymentHistory || []
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('❌ Get payment summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// Mark Invoice as Paid
export const markInvoiceAsPaid = async (req, res) => {
  try {
    const { projectId, invoiceNumber } = req.params;
    const { 
      amount, 
      paymentMethod = 'Bank Transfer', 
      note,
      isInitialPayment = false 
    } = req.body;

    const userRole = req.userRole;

    // Only admin can mark invoices as paid
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update payment status'
      });
    }

    const project = await ProjectRequest.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const invoiceIndex = project.invoices.findIndex(
      inv => inv.invoiceNumber === invoiceNumber
    );
    
    if (invoiceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    const invoice = project.invoices[invoiceIndex];
    const paymentAmount = amount || invoice.balanceDue;

    if (paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    // Update invoice
    invoice.amountPaid += paymentAmount;
    invoice.balanceDue = invoice.totalAmount - invoice.amountPaid;
    invoice.status = invoice.balanceDue <= 0 ? 'paid' : 'partial';
    invoice.paymentMethod = paymentMethod;

    // Update project payment
    if (isInitialPayment) {
      project.payment.initialPayment = true;
    }

    // Add to payment history
    if (!project.payment.paymentHistory) {
      project.payment.paymentHistory = [];
    }
    
    project.payment.paymentHistory.push({
      amount: paymentAmount,
      date: new Date(),
      note: note || `Payment for invoice ${invoiceNumber}`,
      invoiceNumber,
      paymentMethod,
      isInitialPayment
    });

    // Update payment totals
    project.payment.paidAmount += paymentAmount;
    project.payment.dueAmount = project.payment.finalBudget - project.payment.paidAmount;
    project.payment.fullyPaid = project.payment.dueAmount <= 0;

    // Update timeline if fully paid
    if (project.payment.fullyPaid && project.timeline) {
      project.timeline.completedDate = new Date();
    }

    project.hasUnreadUpdate = true;
    project.lastUpdatedBy = 'admin';

    await project.save();

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        invoice: {
          ...invoice.toObject(),
          projectName: project.projectName
        },
        projectPayment: {
          paidAmount: project.payment.paidAmount,
          dueAmount: project.payment.dueAmount,
          initialPaymentMade: project.payment.initialPayment,
          fullyPaid: project.payment.fullyPaid
        }
      }
    });

  } catch (error) {
    console.error('❌ Mark invoice as paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// Generate PDF Invoice
export const generatePDFInvoice = async (req, res) => {
  try {
    const { projectId, invoiceNumber } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;

    const project = await ProjectRequest.findById(projectId)
      .populate('userId', 'name email contact company country city');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check authorization
    if (userRole !== 'admin' && project.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const invoice = project.invoices.find(inv => inv.invoiceNumber === invoiceNumber);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Create PDF
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4'
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceNumber}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(24).text('INVOICE', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Invoice #: ${invoiceNumber}`, { align: 'center' });
    doc.fontSize(10).text(`Issue Date: ${invoice.issueDate.toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1);

    // Company Info (Left)
    doc.fontSize(12).text('FROM:', { underline: true });
    doc.fontSize(10);
    doc.text('Your Company Name');
    doc.text('123 Business Street');
    doc.text('City, State 12345');
    doc.text('Email: billing@company.com');
    doc.text('Phone: (123) 456-7890');
    doc.moveDown(1);

    // Client Info (Right)
    const clientStartX = 300;
    doc.fontSize(12).text('BILL TO:', { x: clientStartX, underline: true });
    doc.fontSize(10);
    doc.text(project.userId.name, { x: clientStartX });
    if (project.userId.company) {
      doc.text(project.userId.company, { x: clientStartX });
    }
    doc.text(project.userId.email, { x: clientStartX });
    if (project.userId.contact) {
      doc.text(`Phone: ${project.userId.contact}`, { x: clientStartX });
    }
    if (project.userId.city || project.userId.country) {
      const location = [project.userId.city, project.userId.country]
        .filter(Boolean)
        .join(', ');
      doc.text(location, { x: clientStartX });
    }
    doc.moveDown(2);

    // Project Info
    doc.fontSize(12).text('PROJECT DETAILS:', { underline: true });
    doc.fontSize(10);
    doc.text(`Project: ${project.projectName}`);
    if (project.description) {
      const shortDesc = project.description.length > 100 
        ? project.description.substring(0, 100) + '...'
        : project.description;
      doc.text(`Description: ${shortDesc}`);
    }
    doc.moveDown(2);

    // Invoice Items Table
    const tableTop = doc.y;
    const itemX = 50;
    const descX = 100;
    const qtyX = 350;
    const priceX = 400;
    const totalX = 470;

    // Table Headers
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('#', itemX, tableTop);
    doc.text('Description', descX, tableTop);
    doc.text('Qty', qtyX, tableTop);
    doc.text('Unit Price', priceX, tableTop);
    doc.text('Total', totalX, tableTop);

    // Header line
    doc.moveTo(itemX, tableTop + 15)
       .lineTo(550, tableTop + 15)
       .stroke();

    // Table Rows
    let y = tableTop + 25;
    doc.font('Helvetica');
    
    invoice.items.forEach((item, index) => {
      doc.text(`${index + 1}`, itemX, y);
      doc.text(item.description.substring(0, 40) + (item.description.length > 40 ? '...' : ''), descX, y, {
        width: 240
      });
      doc.text(item.quantity.toString(), qtyX, y);
      doc.text(formatCurrency(item.unitPrice), priceX, y);
      doc.text(formatCurrency(item.total), totalX, y);
      y += 25;
    });

    // Totals Section
    y += 20;
    doc.font('Helvetica');
    doc.text('Subtotal:', priceX, y);
    doc.text(formatCurrency(invoice.subtotal), totalX, y);
    
    y += 20;
    if (invoice.tax > 0) {
      doc.text(`Tax:`, priceX, y);
      doc.text(formatCurrency(invoice.tax), totalX, y);
      y += 20;
    }
    
    doc.font('Helvetica-Bold');
    doc.text('Total:', priceX, y);
    doc.text(formatCurrency(invoice.totalAmount), totalX, y);
    
    y += 20;
    doc.font('Helvetica');
    doc.text('Amount Paid:', priceX, y);
    doc.text(formatCurrency(invoice.amountPaid), totalX, y);
    
    y += 20;
    doc.font('Helvetica-Bold');
    doc.text('Balance Due:', priceX, y);
    doc.text(formatCurrency(invoice.balanceDue), totalX, y);

    // Payment Status
    y += 40;
    doc.font('Helvetica');
    doc.text('Payment Status:', 50, y);
    doc.text(invoice.status.toUpperCase(), 150, y);
    
    if (invoice.notes) {
      y += 40;
      doc.text('Notes:', 50, y);
      doc.text(invoice.notes, 50, y + 15, {
        width: 500
      });
    }

    // Footer
    doc.fontSize(8);
    doc.text('Thank you for your business!', 50, 750, { align: 'center' });
    doc.text('All payments should be made within 30 days of invoice date.', 50, 765, { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('❌ Generate PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating PDF: ' + error.message
    });
  }
};

// Get Invoice Details
export const getInvoiceDetails = async (req, res) => {
  try {
    const { projectId, invoiceNumber } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;

    const project = await ProjectRequest.findById(projectId)
      .populate('userId', 'name email contact company');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check authorization
    if (userRole !== 'admin' && project.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const invoice = project.invoices.find(inv => inv.invoiceNumber === invoiceNumber);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: {
        invoice: {
          ...invoice.toObject(),
          projectName: project.projectName,
          client: {
            name: project.userId.name,
            email: project.userId.email,
            company: project.userId.company
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Get invoice details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// Get Quick Invoice Options
export const getQuickInvoiceOptions = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;

    const project = await ProjectRequest.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check authorization
    if (userRole !== 'admin' && project.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (project.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Project must be accepted to create invoices'
      });
    }

    const options = [];
    const projectBudget = project.payment?.finalBudget || 0;

    // Initial Payment Option
    if (!project.payment?.initialPayment && projectBudget > 0) {
      options.push({
        type: 'initial',
        label: 'Initial Payment',
        description: '50% deposit to start the project',
        amount: projectBudget * 0.5,
        items: [{
          description: 'Initial Deposit - Project Kickoff',
          quantity: 1,
          unitPrice: projectBudget * 0.5,
          total: projectBudget * 0.5
        }]
      });
    }

    // Milestone Payment Options
    if (project.payment?.paidAmount > 0 && project.payment?.dueAmount > 0) {
      options.push({
        type: 'milestone',
        label: 'Milestone Payment',
        description: 'Progress payment for completed work',
        amount: projectBudget * 0.25,
        items: [{
          description: 'Milestone Payment - Progress Update',
          quantity: 1,
          unitPrice: projectBudget * 0.25,
          total: projectBudget * 0.25
        }]
      });
    }

    // Final Payment Option
    if (project.payment?.dueAmount > 0 && project.payment?.initialPayment) {
      options.push({
        type: 'final',
        label: 'Final Payment',
        description: 'Remaining balance payment',
        amount: project.payment.dueAmount,
        items: [{
          description: 'Final Payment - Project Completion',
          quantity: 1,
          unitPrice: project.payment.dueAmount,
          total: project.payment.dueAmount
        }]
      });
    }

    // Custom Invoice Option
    options.push({
      type: 'custom',
      label: 'Custom Invoice',
      description: 'Create an invoice with custom items and amounts',
      custom: true
    });

    res.json({
      success: true,
      data: {
        projectName: project.projectName,
        currentPaymentStatus: {
          totalBudget: projectBudget,
          paidAmount: project.payment?.paidAmount || 0,
          dueAmount: project.payment?.dueAmount || 0,
          initialPaymentMade: project.payment?.initialPayment || false
        },
        options
      }
    });

  } catch (error) {
    console.error('❌ Get quick options error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// Get All Invoices for Admin
export const getAllInvoices = async (req, res) => {
  try {
    const userRole = req.userRole;
    
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can access all invoices'
      });
    }

    const { status, startDate, endDate, projectId } = req.query;
    
    let filter = { 'invoices.0': { $exists: true } };
    
    if (projectId) {
      filter._id = projectId;
    }
    
    const projects = await ProjectRequest.find(filter)
      .populate('userId', 'name email')
      .select('projectName userId invoices status payment');

    // Flatten invoices with project info
    const allInvoices = [];
    
    projects.forEach(project => {
      if (project.invoices && project.invoices.length > 0) {
        project.invoices.forEach(invoice => {
          // Apply filters
          if (status && invoice.status !== status) return;
          if (startDate && new Date(invoice.issueDate) < new Date(startDate)) return;
          if (endDate && new Date(invoice.issueDate) > new Date(endDate)) return;
          
          allInvoices.push({
            ...invoice.toObject(),
            projectId: project._id,
            projectName: project.projectName,
            clientName: project.userId.name,
            clientEmail: project.userId.email,
            projectStatus: project.status,
            projectPayment: project.payment
          });
        });
      }
    });

    // Sort by issue date (newest first)
    allInvoices.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

    // Calculate summary
    const summary = {
      totalInvoices: allInvoices.length,
      totalAmount: allInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      pendingAmount: allInvoices
        .filter(inv => inv.status === 'pending' || inv.status === 'partial')
        .reduce((sum, inv) => sum + inv.balanceDue, 0),
      paidAmount: allInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.totalAmount, 0)
    };

    res.json({
      success: true,
      data: {
        summary,
        invoices: allInvoices,
        total: allInvoices.length
      }
    });

  } catch (error) {
    console.error('❌ Get all invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};
