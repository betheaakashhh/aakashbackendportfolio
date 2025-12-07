// models/Invoice.js
import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    // Link invoice to the project request (your project card)
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectRequest",
      required: true
    },
    invoiceNumber: { type: String, required: true, unique: true },

    items: [itemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 }, // percentage
    total: { type: Number, required: true },

    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid", "Partially Paid"],
      default: "Unpaid"
    },

    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true }
  },
  { timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
