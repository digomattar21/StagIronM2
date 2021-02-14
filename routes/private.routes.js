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

router.post("/private/createArticle", async (req, res, nxt) => {
  try {
    console.log(req.body);
    const { title, category, imgPath, message } = req.body;
    const id = req.session.currentUser.id;
    console.log(id)

    let userPost = await Article.create({ title, category, imgPath, message });

    return User.findByIdAndUpdate(id, { $push: { articles: userPost.id } })
  }
  catch (e) {
    console.log(e);
  }
});

router.get("/private/minha-carteira", (req, res) => {
  res.render("private/minha-carteira.hbs", { layout: false });
});

router.post("/private/ticker-search", (req, res) => {
  //implementar search de ticker na area privada
});

router.get('/private/main', (req, res) => {
  res.render('private/main.hbs', { layout: false });
});

module.exports = router;
