require("dotenv").config();
const express = require("express");
const router = express.Router();
const session = require("express-session");
const Article = require("../models/Article.model");
const User = require("../models/User.model");
const yf = require("yahoo-finance");
const Carteira = require("../models/Carteira.model");
const Comment = require("../models/Comment.model");
const Reply = require('../models/Reply.model');
const Settings = require("../models/Settings.model");
const Ticker = require("../models/Ticker.model")

router.get("/private/main", async (req, res) => {
  try {
    let id = req.session.currentUser._id;

    let user = await User.findById(id).populate("articles carteira");

    let carteira = await Carteira.findById(user.carteira._id).populate('tickers');

    var dailyChanges = {};
    let labels = [];
    let dawta = [];
    let labelDataObj = {};

    var patrimonio = carteira.patrimonio;
    if (!patrimonio) {
      carteira.patrimonio = 0;
      var patrimonio = 0;
    }

    // carteira.tickers.forEach(async(ticker,index) => {
    //   let data = await yf.quote({
    //     symbol: `${ticker.name}`,
    //     modules: ["price"],
    //   });
    //   let changePct = data.price.regularMarketChangePercent * 100;
    //   dailyChanges[ticker.name] = changePct.toFixed(2);
    //   ticker['pctOfWallet'] = ((ticker.position / patrimonio) * 100).toFixed(2);
    //   console.log(ticker.name)
    //   labels.push(ticker.name.toString());
    //   dawta.push(((ticker.position / patrimonio) * 100).toFixed(2));
    // });

    for (let i = 0; i < carteira.tickers.length; i++) {
      let ticker = carteira.tickers[i];
      let data = await yf.quote({
        symbol: `${ticker.name}`,
        modules: ["price"],
      });
      let changePct = data.price.regularMarketChangePercent * 100;
      dailyChanges[ticker.name] = changePct.toFixed(2);
      ticker["pctOfWallet"] = ((ticker.position / patrimonio) * 100).toFixed(2);
      labels.push(ticker.name.toString());
      dawta.push(((ticker.position / patrimonio) * 100).toFixed(2));
    }

    labelDataObj["labels"] = labels;
    labelDataObj["data"] = dawta;
    console.log(labelDataObj);

    if (carteira.tickers.length < 4) {
      num = carteira.tickers.length;
    } else {
      num = 4;
    }

    let highest = pickHighest(dailyChanges, num);
    let lowest = pickLowest(dailyChanges, num);

    let articles = user.articles;

    carteira.markModified("tickers");
    await carteira.save();
    console.log(carteira.tickers)

    res.render("private/main.hbs", {
      layout: false,
      articles: articles,
      user: req.session.currentUser,
      maioresAltas: highest,
      maioresBaixas: lowest,
      doughnutGraphData: labelDataObj,
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

    let carteira = await Carteira.findById(user.carteira._id).populate('tickers');
    console.log(carteira.tickers)
    //fazendo os calculos de porcetagem da posicao total e aumento do patrimonio
    carteira.patrimonio = 0;

    for (let i = 0; i < carteira.tickers.length; i++) {
      let ticker = carteira.tickers[i];
      let data = await yf.quote({
        symbol: `${ticker.name}`,
        modules: ["price"],
      });

      let dayChangePct = data.price.regularMarketChangePercent * 100;

      if (ticker.buyPrice) {
        var bp = ticker.buyPrice;
      } else {
        var bp = null;
      }

      ticker.dayChangePct = dayChangePct.toFixed(2);
      ticker.currentPrice = data.price.regularMarketPrice;
      ticker.positionUn = ticker.positionUn;
      ticker.position = ticker.position
      ticker.volume = data.price.regularMarketVolume
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      ticker.mktCap = (data.price.marketCap / 1000000000).toFixed(2);
      ticker.buyPrice = bp;

      carteira.patrimonio += parseFloat(ticker.position);

    }

    console.log(carteira.patrimonio)

    carteira.markModified("patrimonio");
    carteira.markModified('tickers')
    await carteira.save();

    res.render("private/minha-carteira.hbs", {
      layout: false,
      tickers: carteira.tickers,
      patrimonio: carteira.patrimonio.toFixed(2),
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

    console.log(data)

    let dividendData = await yf.historical({
      symbol: `${queryCap}`,
      to: await getTodayDate(),
      period: 'v'
    });

    let dividendDataArray = [];

    dividendData.forEach((data, index) => {
      let obj = {};
      obj[`year`] = parseInt(data.date.toString().slice(11, 15));
      let month = data.date.toString().slice(4, 7);
      let monthToInt = getMonth(month);
      obj[`month`] = monthToInt;
      obj[`dividends`] = data.dividends;
      obj['date'] = `${obj[`year`]}-${obj[`month`]}`
      dividendDataArray.push(obj)
    });

    dividendDataArray.sort((a, b) => {
      if (a.year > b.year) {
        return 1
      }
      if (a.year < b.year) {
        return -1
      }

      if (a.year === b.year) {
        if (a.month > b.month) {
          return 1
        }
        if (a.month < b.month) {
          return -1
        }
        if (a.month === b.month) {
          return 0
        }
      }

    });

    let datesArray = [];
    let dividendsArray = [];

    dividendDataArray.forEach((data, index) => {
      datesArray.push(data.date);
      dividendsArray.push(data.dividends)

    })

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
    data.financialData.totalRevenue = toMillion(
      data.financialData.totalRevenue
    );
    data.financialData.ebitda = toMillion(data.financialData.ebitda);
    data.financialData.grossProfits = toMillion(
      data.financialData.grossProfits
    );
    data.financialData.freeCashflow = toMillion(
      data.financialData.freeCashflow
    );
    data.financialData.operatingCashflow = toMillion(
      data.financialData.operatingCashflow
    );
    data.financialData.totalDebt = toMillion(data.financialData.totalDebt);
    data.financialData.returnOnAssets = (
      data.financialData.returnOnAssets * 100
    ).toFixed(2);
    data.financialData.returnOnEquity = (
      data.financialData.returnOnEquity * 100
    ).toFixed(2);
    data.financialData.operatingMargins = (
      data.financialData.operatingMargins * 100
    ).toFixed(2);
    data.financialData.profitMargins = (
      data.financialData.profitMargins * 100
    ).toFixed(2);
    let dYield = data.summaryDetail.dividendYield = (data.summaryDetail.dividendYield*100).toFixed(2);
    let payoutRatio = (data.summaryDetail.payoutRatio*100).toFixed(2);
    let avgYieldFiveYear = data.summaryDetail.fiveYearAvgDividendYield;

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
      layout: false,
      dates: datesArray,
      dividends: dividendsArray,
      userInSession: req.session.currentUser,
      dividendYield: dYield,
      avgYield: avgYieldFiveYear,
      payoutRatio: payoutRatio
    });
  } catch (e) {
    console.log(e);
    res.redirect("/private/main");
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

    // let tickerInfo = {
    //   name: symbol,
    //   currentPrice: yfData.price.regularMarketPrice,
    //   dayChangePct: dayChangePct,
    //   mktCap: mktCap,
    //   volume: volume,
    //   position: 0,
    // };

    let ticker = await Ticker.create({
      carteira: user.carteira._id,
      name: symbol,
      currentPrice: yfData.price.regularMarketPrice,
      dayChangePct: dayChangePct,
      mktCap: mktCap,
      volume: volume,
      position: 0,
      positionUn: 0
    });

    let updatedCarteira = await Carteira.findByIdAndUpdate(user.carteira._id, {
      $push: { tickers: ticker._id },
    });

    res.redirect("/private/minha-carteira");
  } catch (err) {
    console.log(err);
    setTimeout(() => {
      res.redirect("index");
    }, 1000);
  }
});

router.post("/private/tickerName/updateTicker", async (req, res) => {
  try {
    const { tickerId, tickerName, positionUn, currentPrice } = req.body;

    let user = await User.findById(req.session.currentUser._id).populate(
      "carteira"
    );

    console.log('positionUn', positionUn);

    console.log('tickername', tickerName);
    console.log('tickerid', tickerId)

    let positionTicker = (positionUn * currentPrice).toFixed(2);
    let ticker = await Ticker.findByIdAndUpdate(tickerId, { carteira: user.carteira._id, name: tickerName, positionUn: positionUn, position: positionTicker, buyPrice: currentPrice })
    console.log(ticker)
    // // let carteira = await Carteira.findById(user.carteira._id).populate('tickers');

    // // carteira.tickers.forEach((ticker, index) => {
    // //   let positionChange = positionUn - ticker.positionUn;
    // //   if (ticker.name === tickerName) {
    // //     ticker["positionUn"] = positionUn;
    // //     ticker["position"] = (positionUn * currentPrice).toFixed(2);
    // //     ticker['buyPrice'] = currentPrice;
    // //     console.log(ticker);
    // //   }
    // // });


    // console.log(carteira);
    res.redirect("/private/minha-carteira");
  } catch (err) {
    console.log(err);
    res.redirect("/private/minha-carteira");
  }
});

router.post("/private/minha-carteira/ticker/delete", async (req, res) => {
  try {
    const { tickerName, tickerId } = req.body;

    let user = await User.findById(req.session.currentUser._id).populate(
      "carteira"
    );

    let tickerToDelete = await Ticker.findByIdAndRemove(tickerId);

    console.log(tickerToDelete);

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
    if (req.session.currentUser) {
      res.redirect(`/private/main/${articleId}`);
    } else {
      res.redirect(`/article/main/${articleId}`);
    }

  }
});

router.post("/private/reply/post", async (req, res) => {
  try {
    const { content, commentId } = req.body;

    let comment = await Comment.findById(commentId).populate("replys article");
    let articleId = comment.article._id;
    let user = await User.findById(req.session.currentUser._id);

    let reply = await Reply.create({
      author: user._id,
      content,
      comment: commentId,
    });
    let updated = await Comment.findByIdAndUpdate(commentId, {
      $push: { replys: reply._id },
    });

    res.redirect(`/private/main/${articleId}`);
  } catch (error) {
    console.log(error);
  }
});

router.post("/private/reply/like", async (req, res) => {
  const { replyId, articleId } = req.body;

  try {
    let reply = await Reply.findById(replyId).populate("likes comments");

    let user = await User.findById(req.session.currentUser._id);

    let likes = reply.likes;

    likes.forEach((like, index) => {
      if (like._id.toString() === user._id.toString()) {
        throw new Error("Voce ja curtiu essa resposta");
      }
    });

    if (user) {
      let liked = await Reply.findByIdAndUpdate(replyId, {
        $push: { likes: user._id },
      });
    }

    res.redirect(`/private/main/${articleId}`);
  } catch (error) {
    console.log(error);
    if (req.session.currentUser) {
      res.redirect(`/private/main/${articleId}`);
    } else {
      res.redirect(`/article/main/${articleId}`);
    }

  }
});

router.get("/private/user/settings", async (req, res) => {
  try {
    let user = await User.findById(req.session.currentUser._id).populate('settings');

    res.render("private/settings.hbs", {
      userInSession: req.session.currentUser,
      user: user,
    });
  } catch (error) {
    console.log(error);
  }
});


router.post('/private/user/settings/update', async (req, res) => {
  const { biografia, sexo, fblink, twitterlink, instalink, walletpublic, destaquespublic } = req.body;
  try {

    let user = await User.findById(req.session.currentUser._id);

    let settings = await Settings.findByIdAndUpdate(user.settings._id, { biografia: biografia, sexo: sexo, fblink: fblink, twitterlink: twitterlink, instalink: instalink, walletpublic: walletpublic, destaquespublic: destaquespublic })

    res.redirect('/private/user/settings')

  } catch (error) {
    console.log(error);
  }
})

function getTodayDate() {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0");
  var yyyy = today.getFullYear();

  today = yyyy + "-" + mm + "-" + dd;
  return today;
}

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

function getMonth(string) {
  switch (string) {
    case 'Jan':
      return 1;
    case 'Feb':
      return 2;
    case 'Mar':
      return 3;
    case 'Apr':
      return 4;
    case 'May':
      return 5;
    case 'Jun':
      return 6;
    case 'Jul':
      return 7;
    case 'Aug':
      return 8;
    case 'Sep':
      return 9;
    case 'Oct':
      return 10;
    case 'Nov':
      return 11;
    case 'Dec':
      return 12;
    default:
      return 1;
  }
}

module.exports = router;
