require("dotenv").config();
const express = require("express");
const router = express.Router();
const Article = require('../models/Article.model');
// const User = require("../models/User.model");
// const yf = require("yahoo-finance");
// const nodemailer = require("nodemailer");

router.get("/private/createArticle", (req, res) => {
  res.render("private/createArticle.hbs", {
    userInSession: req.session.currentUser,
    layout: false,
  });
});

router.post("/private/createArticle", async (req, res, nxt) => {
  //implementar post de createarticle (postar no feed?)
});

router.get("/private/minha-carteira", (req, res) => {
  res.render("private/minha-carteira.hbs", { layout: false });
});

router.post("/private/ticker-search", (req, res) => {
  //implementar search de ticker na area privada
});

module.exports = router;
