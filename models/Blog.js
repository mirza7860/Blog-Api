import mongoose, { Schema } from "mongoose";
const BlogSchema = new mongoose.Schema(
  {
    title: String,
    summary: String,
    content: String,
    cover: String,
    author: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
const Blog = mongoose.model("Blog", BlogSchema);

export default Blog;

