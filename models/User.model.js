const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, `Insira seu nome de usuário`],
      unique: true,
      trim: true,
      match: [/^[a-zA-Z0-9_-]{3,15}$/, 'Seu username não pode conter símbolos, nem espaços, nem letras maiúsculas e deve ter entre 3 e 15 caracteres!']
    },
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
    carteira: { type: Schema.Types.ObjectId, ref: "Carteira" },
  },
  {
    timestamps: true,
  }
);

module.exports = model("User", userSchema);
