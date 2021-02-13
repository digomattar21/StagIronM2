const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: [true, `Insira seu nome`] },
    email: {
      type: String,
      unique: true,
      trim: true,
      required: [true, `Insira um email`],
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Por favor insira um email válido"],
    },
    password: { type: String, required: [true, `Insira uma Senha`] },
    articles: [{ type: Schema.Types.ObjectId, ref: "Article" }],
  },
  {
    timestamps: true,
  }
);

module.exports = model("User", userSchema);
