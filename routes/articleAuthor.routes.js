require("dotenv").config();
const express = require("express");
const router = express.Router();
const Article = require("../models/Article.model");
const Carteira = require("../models/Carteira.model");
const Comment = require("../models/Comment.model");
const Reply = require('../models/Reply.model');
const User = require("../models/User.model");
const News = require("../models/News.model");
const yf = require("yahoo-finance");
const NewsAPI = require("newsapi");
const axios = require("axios")

var news_api_key = process.env.NEWS_API_KEY;
const newsapi = new NewsAPI(`${news_api_key}`);


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

    let userUpdated = await User.findById(author).populate("articles");

    res.redirect("/private/main");
  } catch (e) {
    console.log(e);
    setTimeout(() => {
      res.redirect("index");
    }, 1000);
  }
});

router.get("/private/main/:articleId", async (req, res) => {
  try {
    //await News.deleteMany({country:{$eq:"related"}});
    const { articleId } = req.params;
    let article = await Article.findById(articleId).populate("author comments");
    let author = await User.findById(article.author._id).populate('settings');
    console.log(author)
    let category = article.category;

    // if (category === 'main' || category === 'comprar ou vender') {
    //   await getGeneralNews()
    // } else {
    //   await getSpecificNews(category)
    // }

    let news = await News.find({ country: { $eq: 'related' } })
    let comments = await Comment.find({ article: article._id }).populate(
      "author likes replys"
    );

    res.render("private/article-detail.hbs", {
      article: article,
      userInSession: req.session.currentUser,
      layout: false,
      comments: comments,
      newsRelated: news,
      user: author
    });
  } catch (err) {
    console.log(`Error while getting the details about this article: ${err}`);
    setTimeout(() => {
      res.redirect("index");
    }, 100);
  }
});

router.get("/article/main/:articleId", async (req, res) => {
  try {
    //await News.deleteMany({country:{$eq:"related"}});
    const { articleId } = req.params;
    let article = await Article.findById(articleId).populate("author comments");
    let author = await User.findById(article.author._id).populate('settings');
    console.log(author)
    let comments = await Comment.find({ article: article._id }).populate(
      "author likes replys"
    );
    let category = article.category;

    // if (category === 'main' || category === 'comprar ou vender') {
    //   await getGeneralNews()
    // } else {
    //   await getSpecificNews(category)
    // }

    let news = await News.find({ country: { $eq: "related" } });

    if (req.session.currentUser) {
      res.render("private/article-detail.hbs", {
        article: article,
        userInSession: req.session.currentUser,
        layout: false,
        comments: comments,
        newsRelated: news,
        user: author
      });
    } else {
      res.render("main/articleDetail.hbs", {
        article: article,
        userInSession: req.session.currentUser,
        comments: comments,
        newsRelated: news,
        user: article
      });
    }
  } catch (err) {
    console.log(`Error while getting the details about this article: ${err}`);
    setTimeout(() => {
      res.redirect("index");
    }, 100);
  }
});

router.get("/private/:articleId/edit", async (req, res) => {
  try {
    const { articleId } = req.params;

    let article = await Article.findById(articleId);

    res.render("private/article-edit.hbs", { layout: false, article: article });
  } catch (err) {
    console.log(err);
    setTimeout(() => {
      res.redirect("index");
    }, 1000);
  }
});

router.post("/private/:articleId/edit", async (req, res) => {
  try {
    const { articleId } = req.params;
    const { title, category, imgPath, content } = req.body;

    let article = await Article.findByIdAndUpdate(
      articleId,
      { title, category, imgPath, content },
      { new: true }
    );

    res.redirect("/private/main");
  } catch (err) {
    console.log(err);
    setTimeout(() => {
      res.redirect("index");
    }, 1000);
  }
});

router.post("/private/:articleId/delete", (req, res) => {
  const { articleId } = req.params;
  //console.log(id)
  Article.findByIdAndDelete(articleId)
    .then(() => res.redirect("/private/main"))
    .catch((err) => {
      console.log(`Error while deleting an article: ${err}`);
      setTimeout(() => {
        res.redirect("index");
      }, 1000);
    });
});

router.get("/private/article-detail", (req, res) => {
  res.render("private/article-detail", {
    userInSession: req.session.currentUser,
    layout: false,
  });
});

router.get("/private/author/:authorId/articles", async (req, res) => {
  try {
    const { authorId } = req.params;
    let user = await User.findById(authorId).populate("articles");

    if (req.session.currentUser) {
      res.render("private/author-profile", { user: user, layout: false });
    } else {
      res.render("main/authorProfile", { user: user });

    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/private/author/:authorId/perfil", async (req, res) => {
  try {
    const { authorId } = req.params;
    let user = await User.findById(authorId).populate("articles carteira settings");

    let carteira = await Carteira.findById(user.carteira._id);
    let patrimonio = carteira.patrimonio;

    if (!patrimonio) {
      carteira.patrimonio = 0;
      patrimonio = carteira.patrimonio;
    }
    let doughnutGraphData = {};
    let labels = [];
    let dawta = [];
    let dailyChanges = {};

    for (let i = 0; i < carteira.tickers.length; i++) {
      let ticker = carteira.tickers[i];
      let data = await yf.quote({
        symbol: `${ticker.name}`,
        modules: ["price"],
      });
      let changePct = data.price.regularMarketChangePercent * 100;
      dailyChanges[ticker.name] = changePct.toFixed(2);
      labels.push(ticker.name.toString());
      dawta.push(((ticker.position / patrimonio) * 100).toFixed(2));
    }

    doughnutGraphData["labels"] = labels;
    doughnutGraphData["data"] = dawta;

    if (carteira.tickers.length < 4) {
      num = carteira.tickers.length;
    } else {
      num = 4;
    }

    let highest = pickHighest(dailyChanges, num);
    let lowest = pickLowest(dailyChanges, num);

    await carteira.save();

    if (req.session.currentUser) {
      res.render("private/author-profile-perfil.hbs", {
        user: user,
        layout: false,
        doughnutGraphData: doughnutGraphData,
        maioresAltas: highest,
        maioresBaixas: lowest,
      });
    } else {
      res.render("main/author-profilePerfil.hbs", {
        user: user,
        doughnutGraphData: doughnutGraphData,
        maioresAltas: highest,
        maioresBaixas: lowest,
      });
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/private/articles/filterByCategory", async (req, res) => {
  const { category } = req.body;
  try {

    let articles = await Article.find({ category: category }).populate('author');


    res.render(`private/feed.hbs`, {
      layout: false,
      articles: articles,
      user: req.session.currentUser,
    });
  } catch (error) {
    console.log(error);
  }
});

router.get("/main/articles/category/:category", async (req, res) => {
  const { category } = req.params;
  try {

    let articles = await Article.find({ category: category }).populate(
      "author"
    );

    res.render("main/articleFiltered.hbs", {
      articles: articles,
      user: req.session.currentUser,
    });
  } catch (error) {
    console.log(error);
  }
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

function pickLowest(obj, num) {
  const requiredObj = {};
  if (num > Object.keys(obj).length) {
    return false;
  }
  Object.keys(obj)
    .sort((a, b) => obj[a] - obj[b])
    .forEach((key, ind) => {
      if (ind < num) {
        requiredObj[key] = obj[key];
      }
    });
  return requiredObj;
}

function toMillion(data) {
  return (data / 1000000).toFixed(1);
}

async function getGeneralNews() {
  try {
    let yesterday = getYesterdayDate();
    let today = getTodayDate();
    let request = await axios.get(`https://newsapi.org/v2/everything?from=${yesterday}&to=${today}&language=pt&q=ibovespa OR ibov OR (bolsa AND (mercado OR ibovespa OR bancos OR valores)) OR (bolsa AND valores) OR fintech OR fintechs OR bradesco OR fintechs OR itau OR magalu OR (magazine AND luiza) OR taesa OR cteep OR petrobas OR (rumo AND b3) OR vale OR (iguatemi AND mercado) OR iochpe OR (dias AND branco) OR renner OR ambev OR santander OR (banco AND do AND brasil) OR weg OR eletrobras&apiKey=${news_api_key}`);
    let news = request.data.articles;

    if (news.length > 3) {
      news.splice(3, news.length - 3);
    }

    news.forEach((noticia, index) => {
      if (noticia.title.includes("-")) {
        var indice = noticia.title.indexOf("-");
        if (indice > 30) {
          noticia.title = noticia.title.slice(0, indice);
        }
      }
      noticia.country = "related";
    });

    await News.create(news);

    return news
  } catch (err) {
    console.log(err)
  }
}

async function getSpecificNews(category) {
  try {
    let yesterday = getYesterdayDate();
    let today = getTodayDate();
    let request;
    switch (category) {
      case 'Criptomoedas':
        request = await axios.get(`https://newsapi.org/v2/everything?from=${yesterday}&to=${today}&language=pt&q=criptomoedas OR cripto OR cryptocuyrrency OR bitcoin OR litecoin OR ethereum OR ripple OR Criptomoedas OR blockchain OR blockchain OR (mineracao AND criptomoedas) OR dogecoin OR DOGECOIN&apiKey=${news_api_key}`);
        break;
      case 'Fundos Imobiliários':
        request = await axios.get(`https://newsapi.org/v2/everything?from=${yesterday}&to=${today}&language=pt&q=(Fundos AND Imobiliários) OR (fundos AND imobiliarios) OR kisu11 OR bpac11 OR abcp11 OR ABCP11 OR AFCR11 OR afcr11 OR aiec11 OR AEIC11 OR XPML11 OR xpml11 OR bcff11 OR BCFF11 OR HREC11 OR hreq11 OR HSLG11 OR hslg11&apiKey=${news_api_key}`);
        break;
      case 'Ações BR':
        request = await axios.get(`https://newsapi.org/v2/everything?from=${yesterday}&to=${today}&language=pt&q=bradesco OR fintech OR fintechs OR itau OR magalu OR (magazine AND luiza) OR taesa OR cteep OR petrobas OR (rumo AND b3) OR vale OR (iguatemi AND mercado) OR iochpe OR (dias AND branco) OR renner OR ambev OR santander OR (banco AND do AND brasil) OR weg OR eletrobras OR WEG OR BBSA3 OR PETR&apiKey=${news_api_key}`);
        break;
      case 'Ações EUA':
        request = await axios.get(`https://newsapi.org/v2/everything?from=${yesterday}&to=${today}&language=pt&q=TESLA OR tesla OR apple OR AAPL OR MSFT or microsoft OR Microsoft OR amazon OR AMZN OR (alphabet AND inc.) OR berkshire OR jpmorgan OR netflix OR nike OR (coca AND cola) OR nvidia OR walmart OR pfizer&apiKey=${news_api_key}`);
        break;
      case 'Política':
        request = await axios.get(`https://newsapi.org/v2/top-headlines?country=pt&category=politics&language=pt&apiKey=${news_api_key}`);
        break;
      case 'Renda Fixa':
        request = await axios.get(`https://newsapi.org/v2/everything?from=${yesterday}&to=${today}&language=pt&q=(renda AND fixa) OR (Renda AND (Fixa OR fixa)) OR NTN OR debenture OR debentures OR Debênture OR debênture OR LCA OR lca&apiKey=${news_api_key}`);
        break;
      default:
        request = await axios.get(`https://newsapi.org/v2/everything?from=${yesterday}&to=${today}&language=pt&q=ibovespa OR ibov OR (bolsa AND (mercado OR ibovespa OR bancos OR valores)) OR (bolsa AND valores) OR fintech OR fintechs&apiKey=${news_api_key}`);
        break;

    }

    let news = request.data.articles;

    if (news.length > 3) {
      news.splice(3, news.length - 3);
    }

    news.forEach((noticia, index) => {
      if (noticia.title.includes("-")) {
        var indice = noticia.title.indexOf("-");
        if (indice > 30) {
          noticia.title = noticia.title.slice(0, indice);
        }
      }
      noticia.country = "related";
    });
    await News.create(news);
    return news
  } catch (err) {
    console.log(err)
  }
}


function getTodayDate() {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0");
  var yyyy = today.getFullYear();

  today = yyyy + "-" + mm + "-" + dd;
  return today;
}

function getYesterdayDate() {
  var yesterday = new Date(Date.now() - 86400000);
  var dd = String(yesterday.getDate()).padStart(2, "0");
  var mm = String(yesterday.getMonth() + 1).padStart(2, "0");
  var yyyy = yesterday.getFullYear();

  yesterday = yyyy + "-" + mm + "-" + dd;
  return yesterday;
}

module.exports = router;
