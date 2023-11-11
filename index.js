import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "./models/User.js";
import Blog from "./models/Blog.js";
import cookieParser from "cookie-parser";
import multer from "multer";
import fs from "fs";
import url, { fileURLToPath } from "url";
import path from "path";
dotenv.config();
const uploads = multer({ dest: "uploads/" });
const secretKey = process.env.JWT_SECRET;
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 8000;
app.use(cors({ credentials: true}));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));
app.use("/",express.static(path.join(__dirname,"./Public")));
app.post("/register", async (req, res) => {
  const { Username, Password } = req.body;
  const salt = await bcrypt.genSalt(10);
  try {
    const userDoc = await User.create({
      Username,
      Password: bcrypt.hashSync(Password, salt),
    });
    res.status(200).json(userDoc);
  } catch (err) {
    res.status(400).json(err);
  }
});
app.post("/login", async (req, res) => {
  const { Username, Password } = req.body;
  const user = await User.findOne({ Username: Username });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  const isLoggedin = await bcrypt.compare(Password, user.Password);
  const token = jwt.sign({ Username, id: user._id }, secretKey);
  try {
    if (isLoggedin) {
      res.status(200).cookie("token", token).json({ id: user._id, Username });
    } else {
      res.status(401).json({ message: "Incorrect password" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});
app.get("/profile", (req, res) => {
  const { token } = req.cookies;

  jwt.verify(token, secretKey, {}, (err, info) => {
    if (err) {
      res.status(401).json({ message: "Token is invalid or expired" });
    } else {
      res.json(info);
    }
  });
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json("Thanks for visiting.");
});
app.post("/post", uploads.single("file"), async (req, res) => {
  const { originalname, path } = req.file;
  const parts = originalname.split(".");
  const ext = parts[parts.length - 1];
  const newPath = path + "." + ext;
  fs.renameSync(path, newPath);
  const { token } = req.cookies;
  jwt.verify(token, secretKey, {}, async (err, info) => {
    if (err) {
      res.status(401).json({ message: "Token is invalid or expired" });
    } else {
      const { title, summary, content } = req.body;
      const postBlog = await Blog.create({
        title: title,
        summary: summary,
        content: content,
        cover: newPath,
        author: info.id,
      });

      res.json(postBlog);
    }
  });
});
app.get("/post", async (req, res) => {
  const blogs = await Blog.find()
    .populate("author", ["Username"])
    .sort({ createdAt: -1 })
    .limit(32);
  res.json(blogs);
});
app.get("/post/:id", async (req, res) => {
  const { id } = req.params;
  const postDoc = await Blog.findById(id).populate("author", ["Username"]);
  res.json(postDoc);
});
app.put("/post", uploads.single("file"), async (req, res) => {
  let newPath = null;
  if (req.file) {
    const { originalname, path } = req.file;
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    newPath = path + "." + ext;
    fs.renameSync(path, newPath);
  }
  const { token } = req.cookies;
  jwt.verify(token, secretKey, {}, async (err, info) => {
    if (err) {
      res.status(401).json({ message: "Token is invalid or expired" });
    } else {
      const { id, title, summary, content } = req.body;
      const postBlog = await Blog.findById(id);
      const isAuthor =
        JSON.stringify(postBlog.author) === JSON.stringify(info.id);
      if (!isAuthor) {
        return res.status(400).json("you are not a authorized user");
        throw "invalid   author";
      }
      await postBlog.updateOne({
        title,
        summary,
        content,
        cover: newPath ? newPath : postBlog.cover,
      });
      res.json(postBlog);
    }
  });
});
mongoose.connect(process.env.MONGODB_URL).then(() => {
  app.listen(port, () => {
    console.log(`Server Listening At Port ${port}`);
  });
});
