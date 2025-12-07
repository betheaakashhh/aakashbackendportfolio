import express from 'express';
import ProjectRequest from '../models/ProjectRequest.js';
import { verifyToken } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// GET PAYMENT SUMMARY FOR PROJECT (CLIENT ACCESS)
router.get('/project/:projectId/summary', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    console.log('📊 Getting payment summary for project:', projectId, 'user:', userId);

    // Find project that belongs to this user
    const project = await ProjectRequest.findOne({
      _id: projectId,
      userId: userId
    });

    if (!project) {
      console.error('❌ Project not found or access denied:', projectId);
      return res.status(403).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }

    res.json({
      success: true,
      data: {
        projectId: project._id,
        projectName: project.projectName,
        projectStatus: project.status,
        payment: {
          totalBudget: project.payment?.finalBudget || 0,
          paidAmount: project.payment?.paidAmount || 0,
          dueAmount: project.payment?.dueAmount || 0,
          initialPaymentMade: project.payment?.initialPayment || false,
          fullyPaid: project.payment?.fullyPaid || false
        },
        invoices: project.invoices || [],
        paymentHistory: project.payment?.paymentHistory || []
      }
    });

  } catch (error) {
    console.error('❌ Get payment summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// GET PROJECT INVOICES (CLIENT VIEW)
router.get('/project/:projectId', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    console.log('📄 Getting invoices for project:', projectId, 'user:', userId);

    const project = await ProjectRequest.findOne({
      _id: projectId,
      userId: userId
    });

    if (!project) {
      return res.status(403).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }

    res.json({
      success: true,
      data: {
        projectName: project.projectName,
        invoices: project.invoices || [],
        paymentSummary: {
          totalBudget: project.payment?.finalBudget || 0,
          paidAmount: project.payment?.paidAmount || 0,
          dueAmount: project.payment?.dueAmount || 0,
          initialPaymentMade: project.payment?.initialPayment || false
        }
      }
    });

  } catch (error) {
    console.error('❌ Get project invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// GENERATE PDF INVOICE (CLIENT ACCESS)
router.get('/project/:projectId/generate/:invoiceNumber', verifyToken, async (req, res) => {
  try {
    const { projectId, invoiceNumber } = req.params;
    const userId = req.userId;

    console.log('📄 Generating PDF for invoice:', invoiceNumber, 'project:', projectId);

    const project = await ProjectRequest.findOne({
      _id: projectId,
      userId: userId
    }).populate('userId', 'name email contact company country city');

    if (!project) {
      return res.status(403).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }

    const invoice = project.invoices.find(inv => inv.invoiceNumber === invoiceNumber);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Return invoice data instead of PDF for now (add PDFKit later)
    res.json({
      success: true,
      data: {
        invoice: {
          ...invoice.toObject(),
          projectName: project.projectName,
          client: {
            name: project.userId.name,
            email: project.userId.email,
            contact: project.userId.contact
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Generate invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error: ' + error.message
    });
  }
});

// DOWNLOAD INVOICE AS PDF (Simple version - returns JSON)
router.get('/project/:projectId/download/:invoiceNumber', verifyToken, async (req, res) => {
  try {
    const { projectId, invoiceNumber } = req.params;
    const userId = req.userId;

    console.log('📥 Downloading invoice:', invoiceNumber);

    const project = await ProjectRequest.findOne({
      _id: projectId,
      userId: userId
    }).populate('userId', 'name email contact company');

    if (!project) {
      return res.status(403).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }

    const invoice = project.invoices.find(inv => inv.invoiceNumber === invoiceNumber);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Return invoice data (you can add PDF generation later with PDFKit)
    res.json({
      success: true,
      message: 'Invoice data retrieved successfully',
      data: {
        invoice: {
          ...invoice.toObject(),
          projectName: project.projectName,
          clientName: project.userId.name,
          clientEmail: project.userId.email
        }
      }
    });

  } catch (error) {
    console.error('❌ Download invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

export default router;