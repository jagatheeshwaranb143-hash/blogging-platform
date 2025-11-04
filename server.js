// backend/server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// Use environment variable for production; fallback to local MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/blogApp";
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Schemas & Models
const Post = mongoose.model(
  "Post",
  new mongoose.Schema({
    title: String,
    content: String,
    createdAt: { type: Date, default: Date.now }
  })
);

const Comment = mongoose.model(
  "Comment",
  new mongoose.Schema({
    postId: String,
    username: String,
    message: String,
    approved: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  })
);

// Routes

// Create Blog Post
app.post("/post/create", async (req, res) => {
  try {
    const post = new Post(req.body);
    await post.save();
    res.json({ message: "Post created", post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Posts
app.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Comment (pending review)
app.post("/comment/create", async (req, res) => {
  try {
    const comment = new Comment(req.body);
    await comment.save();
    res.json({ message: "Comment submitted for review", comment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin – Get Pending Comments
app.get("/comments/pending", async (req, res) => {
  try {
    const comments = await Comment.find({ approved: false }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin – Approve Comment
app.put("/comment/approve/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await Comment.findByIdAndUpdate(id, { approved: true });
    res.json({ message: "Comment Approved", id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Show Approved Comments for a Post
app.get("/comments/:postId", async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId, approved: true }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Basic health check
app.get("/", (req, res) => res.send("Blog API is running"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
