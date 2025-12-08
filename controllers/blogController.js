import Blog from "../models/BlogModel.js";
import slugify from "slugify";
import crypto from "crypto";

// Helper for clean slugs
const createSlug = (text) =>
  slugify(text, { lower: true, strict: true }) +
  "-" +
  crypto.randomBytes(3).toString("hex");

// ADMIN ➜ Create Blog
export const createBlog = async (req, res) => {
  try {
    const { title, content, tags, coverImage } = req.body;

    const blog = await Blog.create({
      title,
      slug: createSlug(title),
      content,
      tags,
      coverImage,
      author: req.userId, // admin user
      isPublished: true,
    });

    res.status(201).json({ success: true, blog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// 📌 GET ALL PUBLISHED BLOGS (feed list)
export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublished: true })
      .select("title slug tags coverImage views createdAt content likes")
      .sort({ createdAt: -1 }); // Show newest first

    const formattedBlogs = blogs.map(blog => ({
      _id: blog._id,
      title: blog.title,
      slug: blog.slug,
      tags: blog.tags,
      coverImage: blog.coverImage,
      views: blog.views,
      createdAt: blog.createdAt,
      likeCount: blog.likes.length,
      preview: blog.content
        ? blog.content.substring(0, 120)
        : "No preview available."
    }));

    res.json({
      success: true,
      blogs: formattedBlogs
    });
  } catch (err) {
    console.error("Get blogs error:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};



// PUBLIC ➜ Get single blog by slug
export const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    blog.views += 1;
    await blog.save();

    res.json({ success: true, blog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUBLIC ➜ Like/Unlike Blog
export const toggleLike = async (req, res) => {
  try {
    const { deviceId, ip, userAgent } = req.deviceInfo;
    const blog = await Blog.findById(req.params.id);

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const existing = blog.likes.find(
      (l) => l.deviceId === deviceId || l.ip === ip
    );

    if (existing) {
      blog.likes = blog.likes.filter((l) => l.deviceId !== deviceId);
      await blog.save();
      return res.json({ success: true, liked: false, likeCount: blog.likes.length });
    }

    blog.likes.push({ deviceId, ip, userAgent });
    await blog.save();
    res.json({ success: true, liked: true, likeCount: blog.likes.length });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUBLIC ➜ Add Comment
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { deviceId, ip, userAgent } = req.deviceInfo;

    if (!text?.trim())
      return res.status(400).json({ message: "Text required" });

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    blog.comments.push({
      commentId: crypto.randomBytes(6).toString("hex"),
      text,
      deviceId,
      ip,
      userAgent
    });

    await blog.save();
    res.json({ success: true, comments: blog.comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADMIN ➜ Delete
export const deleteBlog = async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// get all blogs from admin : likes comment : tags
export const getAllBlogsAdmin = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      blogs
    });
  } catch (err) {
    console.error("Admin Blog Fetch Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
export const updateBlog =  async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      content: req.body.content,
      tags: req.body.tags,
      coverImage: req.body.coverImage,
      isPublished: req.body.isPublished ?? true, // ensure published stays valid
    };

    const updated = await Blog.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    res.json({ success: true, blog: updated });
  } catch (error) {
    console.error("Update blog error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};