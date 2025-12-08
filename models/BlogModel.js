import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
  deviceId: { type: String }, // fingerprint or localStorage ID
  ip: { type: String },
  userAgent: { type: String },
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
  commentId: { type: String, required: true },
  text: { type: String, required: true },
  deviceId: { type: String },
  ip: { type: String },
  userAgent: { type: String },
  replies: [
    {
      replyId: String,
      text: String,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  timestamp: { type: Date, default: Date.now }
});

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, trim: true },   // aakash/blog/slug
  content: { type: String, required: true },
  tags: [{ type: String }],
  coverImage: { type: String, default: "" },
  isPublished: { type: Boolean, default: false },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // engagement
  likes: [likeSchema],
  comments: [commentSchema],

  views: { type: Number, default: 0 }
}, { timestamps: true });

const Blog = mongoose.model("Blog", blogSchema);
export default Blog;
