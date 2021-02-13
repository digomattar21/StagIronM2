require("dotenv").config();
const express = require("express");
const router = express.Router();
const Article = require("../models/Article.model");

router.get("/", (req, res) => {
  //Implementar busca de todos artigos e display
});

router.get("/:articleId", (req, res) => {
  //implementar pagina e rota de detalhes de cada artigo
});

module.exports = router;
