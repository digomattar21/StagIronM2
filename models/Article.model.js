const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const articleSchema = new Schema(
  {
    title: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "User" },
    imgPath: String,
    content: { type: String },
    category: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = model("Article", articleSchema);
