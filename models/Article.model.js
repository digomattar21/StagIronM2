const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const articleSchema = new Schema(
  {
    title: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "User" },
    imgPath: String,
    content: { type: String },
    likes: [{ type: Schema.Types.ObjectId, ref: "User", unique: true }],
    category: { type: String, required: true, enum: ['Geral', 'Fundos Imobiliários', 'Ações BR', 'Ações EUA', 'Criptomoedas', 'Política', 'Mercado de Trabalho', 'Renda Fixa', 'main', 'comprar ou vender'] },
    comments: { type: Schema.Types.ObjectId, ref: 'Comment' },
  },
  {
    timestamps: true,
  }
);

module.exports = model("Article", articleSchema);
