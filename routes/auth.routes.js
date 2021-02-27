require("dotenv").config();
const express = require("express");
const router = express.Router();
const session = require("express-session");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const http = require("http");
const redis = require("redis");
const { RateLimiterRedis } = require('rate-limiter-flexible');

const User = require("../models/User.model");
const Article = require("../models/Article.model");
const Carteira = require("../models/Carteira.model");
const Settings = require("../models/Settings.model");

const redisClient = redis.createClient({
  enable_offline_queue: false,
});

redisClient.on("error", function (err) {
  console.log("Error " + err);
});
const maxFails = 3;

const failsByUsernameLimiter = new RateLimiterRedis({
  redis: redisClient,
  keyPrefix: 'login_fail_consecutive_username',
  points: maxFails,
  duration: 216000, //3hrs until reset
  blockDuration: 900 // 15 min
});

var saltRounds = 12;


router.get("/auth/signup", (req, res) => {
  res.render("auth/sign-up.hbs");
});

router.post("/auth/sign-up", async (req, res) => {
  try {

    var { username, email, password } = req.body;
    var salt = await bcrypt.genSalt(saltRounds);


    var alreadyExistsEmail = await User.findOne({ email: email });
    var passRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,20}$/;

    var alreadyExistsUser = await User.findOne({ username: username });

    if (alreadyExistsUser != null) {
      throw new Error('Este usuário já está cadastrado');
    }
    if (alreadyExistsEmail != null) {
      throw new Error(`Este email ja está cadastrado`);
    } else if (!password || !email || !username) {
      throw new Error(`Todos os campos são obrigatórios`);
    } else if (!password.match(passRegex)) {
      throw new Error(
        `Sua senha deve conter no mínimo: 8 caracteres, 1 letra maiúscula, 1 letra minúscula, 1 símbolo e 1 número (Levamos sua segurança a sério)`
      );
    } else {
      await sendConfirmationMail(email);

      startTimer()

      password = await bcrypt.hash(password, salt);
      let createUser = await User.create({ username, email, password });

      res.render("auth/confirmEmail.hbs", { email: email, username: username });
    }
  } catch (e) {
    console.log(e);
    res.render("auth/sign-up.hbs", { msg: e });
  }
});

router.get("/auth/login", (req, res) => {
  res.render("auth/login.hbs");
});

router.post("/auth/login", async (req, res) => {
  try {
    //console.log("SESSION==>", req.session);
    const { username, password } = req.body;

    const rlUser = failsByUsernameLimiter.get(username);


    if (username === "" || password === "") {
      throw new Error(`Por favor insira seu nome de usuário e senha `);
    }

    let user = await User.findOne({ username: username }).populate('articles');

    if (user != null) {
      let validate = await bcrypt.compareSync(password, user.password);

      if (rlUser != null && rlUser.consumedPoints > maxFails) {
        const retry = Math.round(rlUser.msBeforeNext / 1000) || 1;
        let r = 'Tente Novamente Apos' + (String(retry) + 's') || '15 minutos';;
        throw new Error(r)
      } else {
        if (validate) {
          req.session.currentUser = user;
          if (rlUser !== null && rlUser.consumedPoints > 0) {
            await failsByUsernameLimiter.delete(username)
          }
          res.redirect('/private/main');

        } else {
          try {
            await failsByUsernameLimiter.consume(username);
            throw new Error(`Senha Incorreta`);
          } catch (rejected) {
            if (rejected instanceof Error) {
              throw rejected;
            } else {
              let r = "Tente de novo apos " + (String(Math.round(rejected.msBeforeNext / 1000)) + 's') || '15 minutos'
              throw new Error(r)
            }

          }

        }

      }


    } else {
      throw new Error(`Nome de usuário nao encontrado`);
    }
  } catch (e) {
    console.log(e.message);
    res.render("auth/login.hbs", { msg: e });
  }
});

router.post("/auth/logout", async (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

router.post("/auth/confirm", async (req, res) => {
  try {
    var { inputNum, email, username } = req.body;

    if (inputNum === crypt.toString()) {

      let user = await User.findOne({ email: email }).populate('articles');

      req.session.currentUser = user;

      let carteiraCreate = await Carteira.create({ user: user._id, patrimonio: 0 });

      let userSettings = await Settings.create({ user: req.session.currentUser._id, biografia: '', sexo: 'nao', fblink: '', twitterlink: '', instalink: '', walletpublic: 'off', destaquespublic: 'off' })

      let updated = await User.findByIdAndUpdate(user._id, {
        $push: { carteira: carteiraCreate._id, settings: userSettings._id },
      });

      console.log(userSettings);
      console.log(updated);

      res.render("private/main.hbs", {
        user: req.session.currentUser,
        articles: user.articles
      });


    } else {

      let deletedUser = await User.findOneAndDelete({ email: email });
      var msg = "Código Incorreto, favor preencher novamente";
      res.render("auth/sign-up", { msg: msg, email: email, username: username });

    }
  } catch (err) {
    console.log(err);
    setTimeout(() => {
      res.redirect('index');
    }, 1000);
  }
});

var crypt;
function storeRandNum(randNum) {
  crypt = randNum;
}

var timer;

function resetTimer() {
  timer = 0;
}


function startTimer() {
  setInterval(() => timer++, 1000)
}



function sendConfirmationMail(email) {
  var randNum = Math.floor(100000 + Math.random() * 900000);
  storeRandNum(randNum);

  var mailToHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
      <div style='width: 100%; height: 100%; background-color: #fff'>
          <h4>Seu código: <span>${randNum}</h4></span>
        </div>      
    </body>
    </html>
    `;

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "stag.talk.mailer@gmail.com",
      pass: `${process.env.ARTICLE_MAILER_PASS}`,
    },
  });

  const mail = {
    from: "Stag Article Mailer",
    to: `${email}`,
    subject: "Confirme Sua Conta",
    html: `${mailToHtml}`,
  };

  transporter.sendMail(mail, function (err, info) {
    if (err) {
      console.log(err);
    } else {
      return info;
    }
  });
}

module.exports = router;
