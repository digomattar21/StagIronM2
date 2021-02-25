require("dotenv").config();
const express = require("express");
const router = express.Router();
const Article = require('../models/Article.model');
const Carteira = require('../models/Carteira.model');
const Comment = require('../models/Comment.model');
let User = require('../models/User.model');
const yf = require('yahoo-finance')



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

  router.get("/article/main/:articleId", async (req, res) => {
    try {
      const { articleId } = req.params;
      let article = await Article.findById(articleId).populate("author comments");
  
      let comments = await Comment.find({ article: article._id }).populate(
        "author likes"
      );

      if (req.session.currentUser){
        res.render("private/article-detail.hbs", {
            article: article,
            userInSession: req.session.currentUser,
            layout: false,
            comments: comments,
          });

      } else{
        res.render("main/articleDetail.hbs", {
            article: article,
            userInSession: req.session.currentUser,
            comments: comments,
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