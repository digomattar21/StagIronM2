require("dotenv").config();
const express = require("express");
const router = express.Router();
const session = require("express-session");
const Article = require("../models/Article.model");
const User = require("../models/User.model");
const yf = require("yahoo-finance");
const Carteira = require("../models/Carteira.model");
const Comment = require("../models/Comment.model");

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

router.get("/private/main", async (req, res) => {
  try {
    let id = req.session.currentUser._id;

    let user = await User.findById(id).populate("articles carteira");

    let carteira = await Carteira.findById(user.carteira._id);

    var dailyChanges = {};
    let labels = [];
    let dawta = [];
    let labelDataObj = {};


    let patrimonio = carteira.patrimonio;
    if (!patrimonio){
      carteira.patrimonio = 0
    }

    for (let i = 0; i < carteira.tickers.length; i++) {
      let ticker = carteira.tickers[i];
      let data = await yf.quote({
        symbol: `${ticker.name}`,
        modules: ["price"],
      });
      let changePct = data.price.regularMarketChangePercent * 100;
      dailyChanges[ticker.name] = changePct.toFixed(2);
      ticker['pctOfWallet'] = ((ticker.position/patrimonio)*100).toFixed(2); 
      labels.push(ticker.name.toString());
      dawta.push(((ticker.position/patrimonio)*100).toFixed(2));
    }

    labelDataObj['labels'] = labels;
    labelDataObj['data'] = dawta;
    console.log(labelDataObj);


    if (carteira.tickers.length < 4) {
      num = carteira.tickers.length;
    } else {
      num = 4;
    }

    let highest = pickHighest(dailyChanges, num);
    let lowest = pickLowest(dailyChanges, num);

    let articles = user.articles;

    carteira.markModified('tickers');
    await carteira.save();

    res.render("private/main.hbs", {
      layout: false,
      articles: articles,
      user: req.session.currentUser,
      maioresAltas: highest,
      maioresBaixas: lowest,
      doughnutGraphData: labelDataObj
    });
  } catch (err) {
    console.log(err);
    res.render("auth/login.hbs", {
      msg: `Sua sessao expirou: favor entrar novamente`,
    });
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
    setTimeout(() => {
      res.redirect("index");
    }, 1000);
  }
});

router.get("/private/minha-carteira", async (req, res) => {
  try {
    let id = req.session.currentUser._id;
    let user = await User.findById(id).populate("carteira");

    let tickerInfo = [];

    let carteira = await Carteira.findById(user.carteira._id);

    //fazendo os calculos de porcetagem da posicao total e aumento do patrimonio
    carteira.patrimonio =0;

    //Pegando os quotes dos tickers da carteira do usuario
    for (let i = 0; i < user.carteira.tickers.length; i++) {
      let ticker = carteira.tickers[i];
      let data = await yf.quote({
        symbol: `${ticker.name}`,
        modules: ["price"],
      });

      let dayChangePct = data.price.regularMarketChangePercent * 100;
      let info = {
        name: ticker.name,
        dayChangePct: dayChangePct.toFixed(2),
        currentPrice: data.price.regularMarketPrice,
        positionUn: ticker.positionUn,
        position: ticker.position,
        volume: data.price.regularMarketVolume
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ","),
        mktCap: (data.price.marketCap / 1000000000).toFixed(2),
      };
      carteira.patrimonio += parseFloat(ticker.position);
      
      tickerInfo.push(info);
    }


    carteira.markModified("patrimonio");
    await carteira.save();

    res.render("private/minha-carteira.hbs", {
      layout: false,
      tickers: tickerInfo,
      patrimonio: carteira.patrimonio,
    });
  } catch (err) {
    console.log(err);
    setTimeout(() => {
      res.redirect("index");
    }, 1000);
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

    let hasTicker = false;

    let user = await User.findById(req.session.currentUser._id).populate(
      "carteira"
    );

    let tickers = user.carteira.tickers;

    tickers.forEach((ticker, index) => {
      if (ticker.name === queryCap) {
        hasTicker = true;
      }
    });

    let date = new Date().toISOString().slice(0, 10);

    var dailyChange = data.price.regularMarketChangePercent * 100;

    if (dailyChange < 0) {
      var negChange = dailyChange.toFixed(2);
    } else {
      var posChange = dailyChange.toFixed(2);
    }

    var outros = {};

    data.defaultKeyStatistics.sharesOutstanding = toMillion(
      data.defaultKeyStatistics.sharesOutstanding
    );
    data.price.marketCap = toMillion(data.price.marketCap);
    data.summaryDetail.volume = toMillion(data.summaryDetail.volume);
    data.price.regularMarketVolume = toMillion(data.price.regularMarketVolume);
    data.summaryDetail.averageDailyVolume10Day = toMillion(
      data.summaryDetail.averageDailyVolume10Day
    );
    data.price.averageDailyVolume3Month = toMillion(
      data.price.averageDailyVolume3Month
    );

    //fazer calculos p colocar no company info

    let cutSymbol = data.price.symbol.slice(0, -3);
    let logoUrl = `https://eodhistoricaldata.com/img/logos/US/${cutSymbol}.png`;
    let foundedText = data.summaryProfile.longBusinessSummary;
    var fd;
    if (foundedText.includes("founded in")) {
      fd = foundedText.slice(
        foundedText.indexOf("founded in") + 11,
        foundedText.indexOf("founded in") + 15
      );
    }

    let exchange = data.price.exchange;

    if (exchange === "SAO") {
      exchange = "B3";
    }
    if (
      data.summaryDetail.twoHundredDayAverage ||
      data.summaryDetail.fiftyDayAverage
    ) {
      var twoHundredDayAverage =
        data.summaryDetail.twoHundredDayAverage.toFixed(2) ||
        data.summaryDetail.fiftyDayAverage.toFixed(2);
    }
    if (data.summaryDetail.beta || data.defaultKeyStatistics.beta) {
      var beta =
        data.summaryDetail.beta.toFixed(2) ||
        data.defaultKeyStatistics.beta.toFixed(2);
    }
    if (data.summaryDetail.fiftyTwoWeekHigh) {
      var fiftyTwoWeekHigh = data.summaryDetail.fiftyTwoWeekHigh.toFixed(2);
      var fiftyTwoWeekLow = data.summaryDetail.fiftyTwoWeekLow.toFixed(2);
    }

    res.render("private/private-company-info.hbs", {
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
      fiftyTwoWeekHigh,
      hasTicker,
    });
  } catch (e) {
    console.log(e);
    res.redirect("/private/main");
  }
});

router.get("/private/main/:articleId", async (req, res) => {
  try {
    const { articleId } = req.params;
    let article = await Article.findById(articleId).populate("author comments");

    let comments = await Comment.find({ article: article._id }).populate(
      "author likes"
    );

    res.render("private/article-detail.hbs", {
      article: article,
      userInSession: req.session.currentUser,
      layout: false,
      comments: comments,
    });
  } catch (err) {
    console.log(`Error while getting the details about this article: ${err}`);
    setTimeout(() => {
      res.redirect("index");
    }, 100);
  }
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

    let dayChangePct = (yfData.price.regularMarketChangePercent * 100).toFixed(
      2
    );
    let volume = yfData.price.regularMarketVolume;
    let mktCap = yfData.price.marketCap / 1000000000;

    let tickerInfo = {
      name: symbol,
      currentPrice: yfData.price.regularMarketPrice,
      dayChangePct: dayChangePct,
      mktCap: mktCap,
      volume: volume, 
      position:0
    };

    let updatedCarteira = await Carteira.findByIdAndUpdate(user.carteira._id, {
      $push: { tickers: tickerInfo },
    });

    res.redirect("/private/-carteira");
  } catch (err) {
    console.log(err);
    setTimeout(() => {
      res.redirect("index");
    }, 1000);
  }
});

router.get("/private/author/:authorId/articles", async (req, res) => {
  try {
    const { authorId } = req.params;
    let user = await User.findById(authorId).populate("articles");
    res.render("private/author-profile", { user: user, layout: false });
  } catch (error) {
    console.log(error);
  }
});

router.get("/private/author/:authorId/perfil", async (req, res) => {
  try {
    const { authorId } = req.params;
    let user = await User.findById(authorId).populate("articles carteira");

    let carteira = await Carteira.findById(user.carteira._id);
    let patrimonio = carteira.patrimonio;

    if (!patrimonio){
      carteira.patrimonio =0;
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
      dawta.push(((ticker.position/patrimonio)*100).toFixed(2));
    }

    doughnutGraphData['labels'] = labels;
    doughnutGraphData['data'] = dawta;

    if (carteira.tickers.length < 4) {
      num = carteira.tickers.length;
    } else {
      num = 4;
    }

    let highest = pickHighest(dailyChanges, num);
    let lowest = pickLowest(dailyChanges, num);

    await carteira.save();

    res.render("private/author-profile-perfil.hbs", {
      user: user,
      layout: false,
      doughnutGraphData: doughnutGraphData,
      maioresAltas: highest,
      maioresBaixas: lowest,
    });
  } catch (error) {
    console.log(error);
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

router.post("/private/:tickerName/updateTicker", async (req, res) => {
  try {
    const { tickerName, positionUn, currentPrice } = req.body;

    let user = await User.findById(req.session.currentUser._id).populate(
      "carteira"
    );

    let carteira = await Carteira.findById(user.carteira._id);

    carteira.tickers.forEach((ticker, index) => {
      let positionChange = positionUn - ticker.positionUn;
      if (ticker.name === tickerName) {
        ticker["positionUn"] = positionUn;
        ticker["position"] = (positionUn * currentPrice).toFixed(2);
        console.log(ticker);
      }
    });

    carteira.markModified("tickers");
    await carteira.save();
    console.log(carteira);
    res.redirect("/private/minha-carteira");
  } catch (err) {
    console.log(err);
    res.redirect("/private/minha-carteira");
  }
});

router.get("/private/minha-carteira/ticker/delete", async (req, res) => {
  try {
    const { tickerName } = req.body;
    console.log(tickerName);
    let user = await User.findById(req.session.currentUser._id).populate(
      "carteira"
    );
    let carteira = await Carteira.findById(user.carteira._id);

    carteira.tickers.forEach((ticker, index) => {
      if (ticker.name === tickerName) {
        console.log(carteira);
        carteira.tickers.slice(index, 1);
      }
    });

    carteira.markModified("tickers");
    await carteira.save();
    res.redirect("/private/minha-carteira");
  } catch (err) {
    console.log(err);
  }
});

router.post("/private/comment/post", async (req, res) => {
  try {
    const { content, articleId } = req.body;

    let article = await Article.findById(articleId).populate("comments");
    let user = await User.findById(req.session.currentUser._id);

    let comment = await Comment.create({
      author: user._id,
      content,
      article: articleId,
    });
    let updated = await Article.findByIdAndUpdate(articleId, {
      $push: { comments: comment._id },
    });

    res.redirect(`/private/main/${articleId}`);
  } catch (error) {
    console.log(error);
  }
});

router.post("/private/comment/like", async (req, res) => {
  const { commentId, articleId } = req.body;

  try {
    let comment = await Comment.findById(commentId).populate("likes article");

    let user = await User.findById(req.session.currentUser._id);

    let likes = comment.likes;

    likes.forEach((like, index) => {
      if (like._id.toString() === user._id.toString()) {
        throw new Error("Voce ja curtiu esse comentario");
      }
    });

    if (user) {
      let liked = await Comment.findByIdAndUpdate(commentId, {
        $push: { likes: user._id },
      });
    }

    res.redirect(`/private/main/${articleId}`);
  } catch (error) {
    console.log(error);
    res.redirect(`/private/main/${articleId}`);
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

module.exports = router;
