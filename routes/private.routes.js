require("dotenv").config();
const express = require("express");
const router = express.Router();
const session = require("express-session");
const Article = require("../models/Article.model");
const User = require("../models/User.model");
const yf = require("yahoo-finance")

router.get("/private/createArticle", (req, res) => {
  res.render("private/createArticle.hbs", {
    userInSession: req.session.currentUser,
    layout: false,
  });
});

router.post("/private/createArticle", async (req, res, nxt) => {
  try {

    const { title, category, imgPath, content, author } = req.body;
    let authorName = await User.findById(author);
    // console.log(authorName.username);
    req.session.currentUser = authorName;
    //console.log(req.session.currentUser.username)

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

    let articlesFromDB = await Article.find();

    res.render('private/main.hbs', {
      layout: false,
      articles: articlesFromDB,
      userInSession: req.session.currentUser
    })


  } catch (e) {
    console.log(e);
  }
});

router.get('/private/main', async (req, res) => {
try{

  let id = req.session.currentUser._id;

  let user = await User.findById(id).populate('articles');

  let articles = user.articles;

  res.render('private/main.hbs', {layout: false, articles: articles, user: req.session.currentUser})

} catch(err){
  console.log(err)
}

  
});


router.get('/private/feed', async (req, res) => {
  try{

    let articles = await Article.find().populate('author');

    res.render('private/feed.hbs', {layout: false, articles: articles, user: req.session.currentUser})

  }catch(err){
    console.log(err)
  }


})

router.get("/private/minha-carteira", (req, res) => {
  res.render("private/minha-carteira.hbs", { layout: false });
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

    //console.log(data);

    let date = new Date().toISOString().slice(0, 10);


    var dailyChange = data.price.regularMarketChangePercent;

    if (dailyChange < 0) {
      var negChange = dailyChange.toFixed(2);
    } else {
      var posChange = dailyChange.toFixed(2);
    }

    var outros = {};

    //fazer calculos p colocar no company info

    res.render("private/private-company-info.hbs", {
      sumDet: data.summaryDetails,
      price: data.price,
      defKey: data.defaultKeyStatistics,
      sumProf: data.summaryProfile,
      finData: data.financialData,
      posChange: posChange,
      negChange: negChange,
    });
  } catch (e) {
    console.log(e);
    res.render('private/minha-carteira.hbs', {layout: false, msg: `Ticker Invalido`})
  }
});

router.get('/private/main/:articleId', (req, res) => {
  const { articleId } = req.params;

  Article.findById(articleId)
    .populate('author')
    .then(foundArticle => {
      res.render('private/article-detail.hbs', {
        article: foundArticle,
        userInSession: req.session.currentUser,
        layout: false,
      })
    })
    .catch(err => console.log(`Error while getting the details about this article: ${err}`));
});

router.get('/private/author/:authorId', async (req, res) => {
  try {

    const { authorId } = req.params;
    let user = await User.findById(authorId).populate('articles');
    res.render('private/author-profile', { user: user, layout: false });

  } catch (error) {
    console.log(error);
  }
});

router.post('/private/main/:articleId/delete', (req, res) => {
  const { id } = req.params;
  //console.log(id)
  Article.findByIdAndDelete(id)
    .then(() => res.redirect('/private/main'))
    .catch(err => console.log(`Error while deleting an article: ${err}`));
});


module.exports = router;
