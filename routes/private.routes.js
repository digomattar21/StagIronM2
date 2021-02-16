require("dotenv").config();
const express = require("express");
const router = express.Router();
const session = require("express-session");
const Article = require("../models/Article.model");
const User = require("../models/User.model");
// const yf = require("yahoo-finance");
// const nodemailer = require("nodemailer");

router.get("/private/createArticle", (req, res) => {
  res.render("private/createArticle.hbs", {
    userInSession: req.session.currentUser,
    layout: false,
  });
});

router.post("/private/createArticle", async (req, res, nxt) => {
  try {
    const { title, category, imgPath, content, author } = req.body;
    // const id = req.session.currentUser._id;
    // console.log(id)

    let userPost = await Article.create({
      title,
      category,
      imgPath,
      content,
      author,
    });

    let updated = await User.findByIdAndUpdate(id, {
      $push: { articles: userPost.id },
    });

    let articlesFromDB = await Article.find();

    res.redirect("/private/main.hbs");
  } catch (e) {
    console.log(e);
  }
});

router.get('/private/main', (req, res) => {
  const id = req.session.currentUser._id;

  Article.find()
    .populate(id)
    .then(dbArticle => res.render('private/main.hbs', {
      articles: dbArticle,
      userInSession: req.session.currentUser,
      layout: false,
    }))
    .catch(e => console.log(`Error while getting articles from DB: ${e}`));
})

router.get("/private/minha-carteira", (req, res) => {
  res.render("private/minha-carteira.hbs", { layout: false });
});

router.post("/private/ticker-search", (req, res) => {
  //implementar search de ticker na area privada
});

router.get('/private/main/:articleId', (req, res) => {
  const id = req.session.currentUser._id;
  const { articleId } = req.params;

  Article.findById(articleId)
    .populate(id)
    .then(foundArticle => {
      console.log(foundArticle)
      res.render('private/article-detail.hbs', {
        article: foundArticle,
        userInSession: req.session.currentUser,
        layout: false,
      })
    })
    .catch(err => console.log(`Error while getting the details about this article: ${err}`));
})

module.exports = router;
