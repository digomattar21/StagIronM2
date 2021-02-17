require("dotenv").config();
const express = require("express");
const router = express.Router();
const session = require("express-session");
const Article = require("../models/Article.model");
const User = require("../models/User.model");

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
    console.log(req.session.currentUser.username)

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

router.get('/private/main', (req, res) => {
  // const id = req.session.currentUser._id;

  Article.find()
    .populate('author')
    .then(dbArticle => {
      console.log(dbArticle)
      res.render('private/main.hbs', {
        articles: dbArticle,
        userInSession: req.session.currentUser,
        layout: false,
      })
    })
    .catch(e => console.log(`Error while getting articles from DB: ${e}`));
})

router.get("/private/minha-carteira", (req, res) => {
  res.render("private/minha-carteira.hbs", { layout: false });
});

router.post("/private/ticker-search", (req, res) => {
  //implementar search de ticker na area privada
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
})


module.exports = router;
