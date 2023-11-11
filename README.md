# Blog-Api

## Technologies Used

- "express"
- "cors"
- "bcrypt"
- "dotenv"
- "jsonwebtoken"
- "mongoose"
- "cookie-parser"
- "multer"
- "fs"

## Description

This blogging platform is built using Node.js and Express, with MongoDB as the database. It includes user authentication, blog creation, and various features for managing posts.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a .env file and set the following variables:
  ```bash
   JWT_SECRET=your_jwt_secret
   MONGODB_URL=MongoDB-Connection-String
  ```
3. Install nodemon depandency
  ```bash
   npm i -g nodemon
  ```
4. Start the server:
   ``` bash
   nodemon ./index.js
   ```
5. Server Started
 ```
 Server Listening At Port 8000
  ```
## API Endpoints

### Register a New User

#### `POST /register`

Register a new user.

### Login and Receive JWT Token

#### `POST /login`

Log in and receive a JSON Web Token (JWT) for authentication.

### Get User Profile Information

#### `GET /profile`

Retrieve user profile information.

### Logout and Clear Token

#### `POST /logout`

Log out and clear the authentication token.

### Create a New Blog Post

#### `POST /post`

Create a new blog post.

### Get a List of Latest Blog Posts

#### `GET /post`

Retrieve a list of the latest blog posts.

### Get a Specific Blog Post by ID

#### `GET /post/:id`

Retrieve a specific blog post by its ID.

### Update a Blog Post

#### `PUT /post`

Update an existing blog post.

