// utils/invoicePDF.js
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generateInvoicePDF = (invoice) => {
  // Ensure invoices folder exists
  const invoicesDir = path.join(process.cwd(), "invoices");
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir);
  }

  const filePath = path.join(invoicesDir, `${invoice.invoiceNumber}.pdf`);

  const doc = new PDFDocument({ margin: 50 });
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  // ===== HEADER =====
  doc
    .fontSize(24)
    .text("INVOICE", { align: "center" })
    .moveDown();

  doc
    .fontSize(12)
    .text(`Invoice No: ${invoice.invoiceNumber}`)
    .text(`Issue Date: ${new Date(invoice.issueDate).toDateString()}`)
    .text(`Due Date: ${new Date(invoice.dueDate).toDateString()}`)
    .moveDown();

  // ===== ITEMS =====
  doc.fontSize(14).text("Items", { underline: true }).moveDown(0.5);

  invoice.items.forEach((item) => {
    doc
      .fontSize(12)
      .text(`• ${item.description}`, { continued: true })
      .text(`  —  ₹${item.amount.toFixed(2)}`);
  });

  doc.moveDown();

  // ===== TOTALS =====
  doc
    .fontSize(12)
    .text(`Subtotal: ₹${invoice.subtotal.toFixed(2)}`)
    .text(`Tax: ${invoice.tax}%`)
    .moveDown(0.3)
    .fontSize(14)
    .text(`Total: ₹${invoice.total.toFixed(2)}`, { underline: true });

  doc.end();

  return filePath;
};
