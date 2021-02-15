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
    const { title, category, imgPath, message, author } = req.body;
    const id = req.session.currentUser.id;

    let userPost = await Article.create({ title, category, imgPath, message, author });

    let updated = await User.findByIdAndUpdate(id, { $push: { articles: userPost.id } });

    let articlesFromDB = await Article.find()

    res.render("private/main.hbs", {articles: articlesFromDB, userInSession: req.session.currentUser})
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

router.get('/private/main', async (req, res) => {
  try{

    const id = req.session.currentUser._id;
    console.log(id);

    let articlesFromDB = await Article.find();
    console.log(articlesFromDB);

    res.render('private/main.hbs', { layout: false , articles:articlesFromDB, userInSession: req.session.currentUser});

  }catch(error){console.log(error)}

});

module.exports = router;
