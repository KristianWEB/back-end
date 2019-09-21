const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Post = require("./Post");

// User Schema
const UserSchema = mongoose.Schema({
  email: { required: true, type: String },
  username: { required: true, type: String },
  displayName: { type: String, required: true },
  profileImage: {
    type: String,
    default: "https://www.w3schools.com/w3images/avatar2.png",
  },
  coverImage: {
    type: String,
    default: "https://www.w3schools.com/w3images/avatar2.png",
  },
  joinDate: { type: Number, required: true, default: Date.now() },
  lastLogin: { type: Number, required: true, default: Date.now() },
  status: {
    isDeactivated: { type: Boolean, default: false },
    lastActiveDate: { type: Number, default: Date.now() },
  },
  about: {
    dob: Number,
    bio: String,
  },
  password: { required: true, type: String },
  roles: { type: Array, default: ["user"] },
  posts: { type: [Post.schema], required: true },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;

module.exports.getUserById = (id, callback) => User.findById(id, callback);

module.exports.getUserByEmail = email => User.findOne({ email }).exec();

module.exports.getUserByUsername = username =>
  User.findOne({ username }).exec();

module.exports.addUser = newUser => {
  return new Promise(resolve => {
    bcrypt.genSalt(10, (_, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) {
          throw err;
        }

        const name = newUser.email.substring(0, newUser.email.lastIndexOf("@"));
        newUser.displayName = name;
        newUser.password = hash;

        newUser.save((error, savedObj) => {
          if (error) throw error;
          resolve(savedObj);
        });
      });
    });
  });
};

module.exports.comparePassword = (password, hash) =>
  bcrypt.compare(password, hash);
