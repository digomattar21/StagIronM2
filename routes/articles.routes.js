require("dotenv").config();
const express = require("express");
const router = express.Router();
const Article = require("../models/Article.model");

router.get("/:articleId", (req, res) => {
  //implementar pagina e rota de detalhes de cada artigo
});

module.exports = router;
