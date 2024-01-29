import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "./models/User.js";
import Blog from "./models/Blog.js";
import cookieParser from "cookie-parser";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from 'uuid';
import path from "path";

dotenv.config();

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
});

const s3 = new AWS.S3();

const s3BucketName = process.env.S3_BUCKET_NAME;
const s3BaseUrl = process.env.S3_BASE_URL;

const secretKey = process.env.JWT_SECRET;
const __dirname = path.resolve();

const app = express();
const port = process.env.PORT || 8000;

app.use(
  cors({
    credentials: true,
    origin: "https://myblog-client.onrender.com",
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/", express.static(path.join(__dirname, "./Public")));
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
      res.status(200).cookie("token", token, {sameSite: "none",
          secure: true,
          httpOnly: true,} ).json({ id: user._id, Username });
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
  res.cookie("token", "" , {sameSite: "none",
          secure: true,
          httpOnly: true,}  ).json("Thanks for visiting.");
});
app.post("/post", async (req, res) => {
  const { title, summary, content } = req.body;
  const { token } = req.cookies;

  jwt.verify(token, secretKey, {}, async (err, info) => {
    if (err) {
      res.status(401).json({ message: "Token is invalid or expired" });
    } else {
      const file = req.file;
      const fileName = `${uuidv4()}-${file.originalname}`;

      const params = {
        Bucket: s3BucketName,
        Key: fileName,
        Body: JSON.stringify({ title, summary, content }), // Store post data as JSON
        ContentType: file.mimetype,
      };

      s3.upload(params, async (s3Err, data) => {
        if (s3Err) {
          res.status(500).json({ message: "Error uploading file to S3" });
        } else {
          const postBlog = await Blog.create({
            title,
            summary,
            content,
            cover: `${s3BaseUrl}/${fileName}`,
            author: info.id,
          });
          res.json(postBlog);
        }
      });
    }
  });
});

app.get("/post", async (req, res) => {
  const blogs = await Blog.find()
    .populate("author", ["Username"])
    .sort({ createdAt: -1 })
    .limit(32);
  
  const blogsWithS3URLs = blogs.map(blog => ({
    ...blog._doc,
    cover: blog.cover.replace("uploads", s3BaseUrl),
  }));

  res.json(blogsWithS3URLs);
});

app.get("/post/:id", async (req, res) => {
  const { id } = req.params;
  const postDoc = await Blog.findById(id).populate("author", ["Username"]);

  // Update cover URL to use S3 URL
  const postWithS3URL = {
    ...postDoc._doc,
    cover: postDoc.cover.replace("uploads", s3BaseUrl),
  };

  res.json(postWithS3URL);
});

app.put("/post", async (req, res) => {
  const { token } = req.cookies;

  jwt.verify(token, secretKey, {}, async (err, info) => {
    if (err) {
      res.status(401).json({ message: "Token is invalid or expired" });
    } else {
      const { id, title, summary, content } = req.body;
      const postBlog = await Blog.findById(id);
      console.log(postBlog)
      const isAuthor = JSON.stringify(postBlog.author) === JSON.stringify(info.id);

      if (!isAuthor) {
        return res.status(400).json("You are not an authorized user");
      }

      let updatedCover = postBlog.cover;

      if (req.file) {
        const file = req.file;
        const fileName = `${uuidv4()}-${file.originalname}`;

        const params = {
          Bucket: s3BucketName,
          Key: fileName,
          Body: JSON.stringify({ title, summary, content }), // Store updated post data as JSON
          ContentType: file.mimetype,
        };

        await s3.upload(params).promise(); // Upload the new file to S3

        updatedCover = `${s3BaseUrl}/${fileName}`; // Update cover URL
      }

      await postBlog.updateOne({
        title,
        summary,
        content,
        cover: updatedCover,
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
