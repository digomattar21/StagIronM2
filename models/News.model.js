const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const newsSchema = new Schema(
  {
    author: { type: String },
    title: { type: String, required: true },
    description: { type: String },
    urlToImage: String,
    publishedAt: { type: String },
    content: { type: String },
    country: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = model("News", newsSchema);
