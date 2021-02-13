require("dotenv").config();
const express = require("express");
const router = express.Router();
const Article = require("../models/Article.model");

router.get("/", (req, res) => {
  Article.find()
    .populate("author")
    .then((allArticles) => {
      res.render("main/article-list.hbs", { articles: allArticles });
    })
    .catch((error) => {
      console.log(error);
    });
});

router.get("/:articleId", (req, res) => {
  const { articleId } = req.params;

  Article.findOne({ _id: { $eq: articleId } })
    .then((article) => {
      res.render("main/article-page.hbs", { article });
    })
    .catch((error) => {
      console.log(error);
    });
});

module.exports = router;
