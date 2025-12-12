// models/UpdateInfo.js
import mongoose from "mongoose";

const updateInfoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  importance: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("UpdateInfo", updateInfoSchema);
