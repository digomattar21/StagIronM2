require("dotenv").config();
const express = require("express");
const router = express.Router();
const NewsAPI = require("newsapi");
const Article = require("../models/Article.model");
const News = require("../models/News.model");
const IpInfo = require("../models/IpInfo.model");
const yf = require("yahoo-finance");

const axios = require('axios');


var news_api_key = process.env.NEWS_API_KEY;

const newsapi = new NewsAPI(`${news_api_key}`);

/* GET home page */
router.get("/", async (req, res, next) => {
  try {
    var ip = req.headers['x-forwarded-for'];

    if (ip != undefined && ip != null && ip != '::1') {

      let ipsList = await IpInfo.find();
      //console.log('length:', ipsList.length)
      await IpInfo.deleteMany();
      await getIpInfo(ip);
    }

    // let responseBR = await newsapi.v2.topHeadlines({
    //   q: "mercado",
    //   category: "business",
    //   language: "pt",
    //   country: "br",
    // });

    // var newsBR = responseBR.articles;

    // if (newsBR.length > 6) {
    //   newsBR.splice(6, newsBR.length - 6);
    // }

    // newsBR.forEach((noticia, index) => {
    //   if (noticia.title.includes("-")) {
    //     var indice = noticia.title.indexOf("-");
    //     if (indice > 30) {
    //       noticia.title = noticia.title.slice(0, indice);
    //     }
    //   }
    //   noticia.country = "br";
    // });

    // let responseUSA = await newsapi.v2.topHeadlines({
    //   q: "",
    //   category: "business",
    //   language: "en",
    //   country: "us",
    // });

    // var newsUSA = responseUSA.articles;
    // newsUSA.country = "us";

    // if (newsUSA.length > 7) {
    //   newsUSA.splice(7, newsUSA.length - 7);
    // }

    // newsUSA.forEach((noticia, index) => {
    //   if (noticia.title.includes("-")) {
    //     var indice = noticia.title.indexOf("-");
    //     if (indice > 30) {
    //       noticia.title = noticia.title.slice(0, indice);
    //     }
    //   }
    //   noticia.country = "us";
    // });

    //importing articles from DB
    let mainArticlesFromDB = await Article.find({ category: { $eq: "main" } })
      .sort({ _id: 1 })
      .limit(6);
    let comprarOuVenderArticles = await Article.find({
      category: { $eq: "comprar ou vender" },
    })
      .sort({ _id: -1 })
      .limit(4);

    // await News.deleteMany();
    // console.log(`Sucessfully Cleared DB`);

    // await News.create(newsUSA);
    // console.log(`SucessFully added newsUSA to DB`);

    // await News.create(newsBR);
    // console.log(`Sucessfully added NewsBR to DB`);

    allNewsUSA = await News.find({ country: { $eq: "us" } });

    allNewsBR = await News.find({ country: { $eq: "br" } });

    res.render("index", {
      newsUSA: allNewsUSA,
      newsBR: allNewsBR,
      mainArticles: mainArticlesFromDB,
      cpvArticles: comprarOuVenderArticles,
      userInSession: req.session.currentUser,
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

    //console.log(data);

    let date = new Date().toISOString().slice(0, 10);



    console.log(data)

    var dailyChange = data.price.regularMarketChangePercent;

    if (dailyChange < 0) {
      var negChange = dailyChange.toFixed(2);
    } else {
      var posChange = dailyChange.toFixed(2);
    }

    var outros = {};

    data.defaultKeyStatistics.sharesOutstanding = toMillion(data.defaultKeyStatistics.sharesOutstanding)
    data.price.marketCap = toMillion(data.price.marketCap)
    data.summaryDetail.volume = toMillion(data.summaryDetail.volume);
    data.price.regularMarketVolume = toMillion(data.price.regularMarketVolume)
    data.summaryDetail.averageDailyVolume10Day = toMillion(data.summaryDetail.averageDailyVolume10Day)
    data.price.averageDailyVolume3Month = toMillion(data.price.averageDailyVolume3Month)

    //fazer calculos p colocar no company info

    let cutSymbol = data.price.symbol.slice(0,-3)
    let logoUrl = `https://eodhistoricaldata.com/img/logos/US/${cutSymbol}.png`;
    let foundedText = data.summaryProfile.longBusinessSummary;
    var fd;
    if (foundedText.includes('founded in')){
       fd = foundedText.slice(foundedText.indexOf('founded in')+11,foundedText.indexOf('founded in')+15)
    }

    let exchange = data.price.exchange;

    if(exchange ==='SAO'){
      exchange = 'B3';
    }
    
    let twoHundredDayAverage = data.summaryDetail.twoHundredDayAverage.toFixed(2) || data.summaryDetail.fiftyDayAverage.toFixed(2);
    let beta = data.summaryDetail.beta.toFixed(2) || data.defaultKeyStatistics.beta.toFixed(2);
    let fiftyTwoWeekHigh = data.summaryDetail.fiftyTwoWeekHigh.toFixed(2);
    let fiftyTwoWeekLow = data.summaryDetail.fiftyTwoWeekLow.toFixed(2);


    res.render("main/company-info.hbs", {
      sumDet: data.summaryDetails,
      price: data.price,
      defKey: data.defaultKeyStatistics,
      sumProf: data.summaryProfile,
      finData: data.financialData,
      posChange: posChange,
      negChange: negChange,
      logoUrl: logoUrl,
      foundedDate: fd,
      exchange: exchange,
      twoHundredDayAverage,
      beta,
      fiftyTwoWeekLow,
      fiftyTwoWeekHigh
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
    .catch((err) => {
      console.log(err);
      setTimeout(() =>{
        res.redirect('index');
      },1000)
    });
});






function getIpInfo(ip) {


  if (ip.includes("::ffff:")) {
    //console.log(ip.indexOf(ip.includes("::ffff:")));
    ip = ip.slice(7, ip.length);
    ip = geoip.pretty(ip)
    //console.log(ip);
  }

  if (ip.match(/(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}/)) {
    var url = `https://ipapi.co/${ip}/json`;
    axios
      .get(url)
      .then(response => {
        //console.log(response.data);
        IpInfo.create({ info: response.data })
          .then((done) => {
            console.log('Created IpInfo sucessfully');
            var infoIp = response.data;
          }).catch(err => console.log(err))
      }).catch(err => { console.log(err) })


  } else {
    console.log("ip not valid");
  }

}

function toMillion(data){
  return (data/1000000).toFixed(1)
}

module.exports = router;
