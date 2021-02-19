require("dotenv").config();
const express = require("express");
const router = express.Router();
const session = require("express-session");
const Article = require("../models/Article.model");
const User = require("../models/User.model");
const yf = require("yahoo-finance");
const Carteira = require("../models/Carteira.model");

router.get("/private/createArticle", (req, res) => {
  res.render("private/createArticle.hbs", {
    userInSession: req.session.currentUser,
    layout: false,
  });
});

router.post("/private/createArticle", async (req, res, nxt) => {
  try {
    const { title, category, imgPath, content, author } = req.body;
    let user = await User.findById(author).populate("articles");

    req.session.currentUser = user;

    let userPost = await Article.create({
      title,
      category,
      imgPath,
      content,
      author,
    });

    let updated = await User.findByIdAndUpdate(author, {
      $push: { articles: userPost._id },
    });

    res.render("private/main.hbs", {
      layout: false,
      articles: user.articles,
      user: req.session.currentUser,
    });
  } catch (e) {
    console.log(e);
  }
});

router.get("/private/main", async (req, res) => {
  try {
    let id = req.session.currentUser._id;

    let user = await User.findById(id).populate("articles carteira");

    let carteira = await Carteira.findById(user.carteira._id);

    var dailyChanges = {};

    carteira.tickers.forEach((ticker) => {
      dailyChanges[ticker.name] = ticker.dayChangePct;
    });

    if (carteira.tickers.length < 5) {
      num = carteira.tickers.length;
    } else {
      num = 5;
    }

    let highest = pickHighest(dailyChanges, num);

    let articles = user.articles;

    res.render("private/main.hbs", {
      layout: false,
      articles: articles,
      user: req.session.currentUser,
      maioresAltas: highest,
    });
  } catch (err) {
    console.log(err);
  }
});

router.get("/private/feed", async (req, res) => {
  try {
    let articles = await Article.find().populate("author");

    res.render("private/feed.hbs", {
      layout: false,
      articles: articles,
      user: req.session.currentUser,
    });
  } catch (err) {
    console.log(err);
  }
});

router.get("/private/minha-carteira", async (req, res) => {
  let id = req.session.currentUser._id;
  try {
    let user = await User.findById(id)
      .populate("articles")
      .populate("carteira");

    let tickers = user.carteira.tickers;

    res.render("private/minha-carteira.hbs", {
      layout: false,
      tickers: tickers,
    });
  } catch (err) {
    console.log(err);
  }
});

router.post("/private/ticker-search", async (req, res) => {
  try {
    const { query } = req.body;
    var queryCap = query.toUpperCase();
    let data = await yf.quote({
      symbol: `${queryCap}`,
      modules: [
        "price",
        "summaryDetail",
        "financialData",
        "summaryProfile",
        "defaultKeyStatistics",
        "recommendationTrend",
      ],
    });

    let date = new Date().toISOString().slice(0, 10);

    var dailyChange = data.price.regularMarketChangePercent;

    if (dailyChange < 0) {
      var negChange = dailyChange.toFixed(2);
    } else {
      var posChange = dailyChange.toFixed(2);
    }

    let user = await User.findById(req.session.currentUser._id).populate(
      "carteira"
    );

    let carteira = await Carteira.findById(user.carteira._id);

    var hasTicker;
    carteira.tickers.forEach((ticker, index) => {
      if (ticker.name === queryCap) {
        hasTicker = true;
      }
    });

    res.render("private/private-company-info.hbs", {
      sumDet: data.summaryDetails,
      price: data.price,
      defKey: data.defaultKeyStatistics,
      sumProf: data.summaryProfile,
      finData: data.financialData,
      posChange,
      negChange,
      hasTicker: hasTicker,
    });
  } catch (e) {
    console.log(e);
    res.render("private/minha-carteira.hbs", {
      layout: false,
      msg: `Ticker Invalido`,
    });
  }
});

router.get("/private/main/:articleId", (req, res) => {
  const { articleId } = req.params;

  Article.findById(articleId)
    .populate("author")
    .then((foundArticle) => {
      res.render("private/article-detail.hbs", {
        article: foundArticle,
        userInSession: req.session.currentUser,
        layout: false,
      });
    })
    .catch((err) =>
      console.log(`Error while getting the details about this article: ${err}`)
    );
});

router.post("/private/addticker", async (req, res) => {
  try {
    const { symbol } = req.body;

    let user = await User.findById(req.session.currentUser._id).populate(
      "articles carteira"
    );

    let yfData = await yf.quote({
      symbol: `${symbol}`,
      modules: ["price"],
    });

    let dayChangePct = yfData.price.regularMarketChangePercent.toFixed(2);

    let tickerInfo = {
      name: symbol,
      currentPrice: yfData.price.regularMarketPrice,
      dayChangePct: dayChangePct,
    };

    let updatedCarteira = await Carteira.findByIdAndUpdate(user.carteira._id, {
      $push: { tickers: tickerInfo },
    });

    let carteira = await Carteira.findById(user.carteira._id);

    let tickers = carteira.tickers;

    res.render("private/minha-carteira.hbs", {
      layout: false,
      user: req.session.currentUser,
      tickers: tickers,
    });
  } catch (err) {
    console.log(err);
  }
});

router.get("/private/author/:authorId", async (req, res) => {
  try {
    const { authorId } = req.params;
    let user = await User.findById(authorId).populate("articles");
    res.render("private/author-profile", { user: user, layout: false });
  } catch (error) {
    console.log(error);
  }
});

router.post("/private/main/:articleId/delete", (req, res) => {
  const { id } = req.params;
  //console.log(id)
  Article.findByIdAndDelete(id)
    .then(() => res.redirect("/private/main"))
    .catch((err) => console.log(`Error while deleting an article: ${err}`));
});

function pickHighest(obj, num) {
  const requiredObj = {};
  if (num > Object.keys(obj).length) {
    return false;
  }
  Object.keys(obj)
    .sort((a, b) => obj[b] - obj[a])
    .forEach((key, ind) => {
      if (ind < num) {
        requiredObj[key] = obj[key];
      }
    });
  return requiredObj;
}

module.exports = router;
