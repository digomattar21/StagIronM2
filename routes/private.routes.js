require("dotenv").config();
const express = require("express");
const router = express.Router();
const session = require("express-session");
const Article = require('../models/Article.model');
const User = require("../models/User.model");
// const yf = require("yahoo-finance");
// const nodemailer = require("nodemailer");

router.get("/private/createArticle", (req, res) => {
  res.render("private/createArticle.hbs", {
    userInSession: req.session.currentUser,
    layout: false,
  });
});

router.post("/private/createArticle", (req, res, nxt) => {

  const { title, category, imgPath, message } = req.body;
  const id = req.session.currentUser._id;

  Article.create({ title, category, imgPath, message })
    .then(dbArticle => {
      return User.findByIdAndUpdate(id, { $push: { articles: dbArticle._id } })
    })
    .then(() => res.redirect('/private/main'))
    .catch(e => console.log(`Error while creating the article in the DB: ${e}`));
});

router.get('/private/main', (req, res) => {
  console.log(req.session.currentUser);
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

router.get('/private/main', (req, res) => {
  res.render('private/main.hbs', {
    userInSession: req.session.currentUser,
    layout: false,
  });
});

module.exports = router;
