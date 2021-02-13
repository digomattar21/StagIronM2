require("dotenv").config();
const express = require("express");
const router = express.Router();
const NewsAPI = require("newsapi");
const Article = require("../models/Article.model");
const News = require("../models/News.model");
const yf = require("yahoo-finance");

var news_api_key = process.env.NEWS_API_KEY;

const newsapi = new NewsAPI(`${news_api_key}`);

/* GET home page */
router.get("/", async (req, res, next) => {
  try {
    let responseBR = await newsapi.v2.topHeadlines({
      q: "mercado",
      category: "business",
      language: "pt",
      country: "br",
    });

    var newsBR = responseBR.articles;

    if (newsBR.length > 6) {
      newsBR.splice(6, newsBR.length - 6);
    }

    newsBR.forEach((noticia, index) => {
      if (noticia.title.includes("-")) {
        var indice = noticia.title.indexOf("-");
        if (indice > 30) {
          noticia.title = noticia.title.slice(0, indice);
        }
      }
      noticia.country = "br";
    });

    let responseUSA = await newsapi.v2.topHeadlines({
      q: "",
      category: "business",
      language: "en",
      country: "us",
    });

    var newsUSA = responseUSA.articles;
    newsUSA.country = "us";

    if (newsUSA.length > 7) {
      newsUSA.splice(7, newsUSA.length - 7);
    }

    newsUSA.forEach((noticia, index) => {
      if (noticia.title.includes("-")) {
        var indice = noticia.title.indexOf("-");
        if (indice > 30) {
          noticia.title = noticia.title.slice(0, indice);
        }
      }
      noticia.country = "us";
    });

    //importing articles from DB
    let mainArticlesFromDB = await Article.find({ category: { $eq: "main" } })
      .sort({ _id: 1 })
      .limit(6);
    let comprarOuVenderArticles = await Article.find({
      category: { $eq: "comprar ou vender" },
    })
      .sort({ _id: -1 })
      .limit(4);

    await News.deleteMany();
    console.log(`Sucessfully Cleared DB`);

    await News.create(newsUSA);
    console.log(`SucessFully added newsUSA to DB`);

    await News.create(newsBR);
    console.log(`Sucessfully added NewsBR to DB`);

    allNewsUSA = await News.find({ country: { $eq: "us" } });

    allNewsBR = await News.find({ country: { $eq: "br" } });

    res.render("index", {
      newsUSA: allNewsUSA,
      newsBR: allNewsBR,
      mainArticles: mainArticlesFromDB,
      cpvArticles: comprarOuVenderArticles,
    });
  } catch (e) {
    res.render("api-error.hbs", { APImessage: e.message });
  }
});



router.post("/ticker-search", async (req, res) => {
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
    

    console.log(data);

    let date = new Date().toISOString().slice(0, 10);

    
    var dailyChange = data.price.regularMarketChangePercent;

    if (dailyChange < 0) {
      var negChange = dailyChange.toFixed(2);
    } else {
      var posChange = dailyChange.toFixed(2);
    }

    var outros = {};

    //fazer calculos p colocar no company info

    res.render("main/company-info.hbs", {
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
    Article.find({ category: { $eq: "main" } }).then((mainArticlesFromDB) => {
      News.find({ country: { $eq: "us" } }).then((allNewsUSA) => {
        News.find({ country: { $eq: "br" } }).then((allNewsBR) => {
          res.render("index.hbs", {
            newsUSA: allNewsUSA,
            newsBR: allNewsBR,
            mainArticles: mainArticlesFromDB,
            message: `Ticker inválido`,
          });
        });
      });
    });
  }
});

router.get("/noticias/pagina-noticia/:noticiaId", (req, res) => {
  const { noticiaId } = req.params;

  News.findById(noticiaId)
    .then((noticia) => {
      //console.log(noticia);
      res.render("main/pagina-noticia.hbs", noticia);
    })
    .catch((err) => console.log(err));
});

module.exports = router;
