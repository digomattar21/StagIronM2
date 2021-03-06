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
const Carteira = require("../models/Carteira.model");
const Settings = require("../models/Settings.model");

const redisClient = redis.createClient({
  enable_offline_queue: false,
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASS
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
     
      var token = Math.floor(100000 + Math.random() * 900000).toString();

      await sendConfirmationMail(email,token);

      password = await bcrypt.hash(password, salt);

      let createUser = await User.create({
        username,
        email,
        password,
        confirmationCode: token
       });

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

    var user = await User.findOne({ email: email }).populate('articles');

    if (inputNum === user.confirmationCode) {

      req.session.currentUser = user;

      let carteiraCreate = await Carteira.create({ user: user._id, patrimonio: 0 });

      let userSettings = await Settings.create({ user: req.session.currentUser._id, biografia: '', sexo: 'nao', fblink: '', twitterlink: '', instalink: '', walletpublic: 'off', destaquespublic: 'off' })

      let updated = await User.findByIdAndUpdate(user._id, {
        $push: { carteira: carteiraCreate._id, settings: userSettings._id },
      });

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

router.get('/private/reset/confirm-email/:resetField', async (req, res) => {
  const { resetField } = req.params;
  try {
    var token = Math.floor(100000 + Math.random() * 900000).toString();

    var user = await User.findByIdAndUpdate(req.session.currentUser._id,{confirmationCode:token})

    await sendConfirmationMail(user.email,token);
    res.render('auth/resetConfirmEmail', { layout: false, resetField: resetField })
  } catch (err) {
    console.log(err)
  }
});

router.post('/private/reset/confirm', async (req, res) => {
  const { resetField, code } = req.body;
  try {
    var user = await User.findById(req.session.currentUser._id)
    
    if (code === user.confirmationCode) {
      switch (resetField) {
        case 'username':
          res.render('auth/resetUsername.hbs');
          break;
        case 'email':
          res.render('auth/resetEmail.hbs');
          break;
        case 'password':
          res.render('auth/resetPass.hbs');
          break;
        default:
          break;
      }
    } else {
      throw new Error(`Código incorreto`)
    }

  } catch (err) {
    console.log(err);
    res.render('auth/resetConfirmEmail.hbs', { layout: false, msg: err.message })
  }
});

router.post('/private/reset/username', async (req, res) => {
  const { username } = req.body;
  try {

    let user = await User.findOne({ username: username });

    if (user) {
      throw new Error('Nome de usuário já em uso')
    } else {
      let userInSesh = await User.findByIdAndUpdate(req.session.currentUser._id, { username: username });
      req.session.curentUser = userInSesh;
      res.redirect('/private/main')
    }

  } catch (err) {
    console.log(err);
    res.render('auth/resetUsername.hbs', { msg: err.message })
  }
});

router.post('/private/reset/password', async (req, res) => {
  var { password } = req.body;
  try {
    var passRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,20}$/;
    let salt = await bcrypt.genSalt(saltRounds);

    if (!password || !password.match(passRegex)) {
      throw new Error(`Sua senha deve conter no mínimo: 8 caracteres, 1 letra maiúscula, 1 letra minúscula, 1 símbolo e 1 número`)
    } else {
      password = await bcrypt.hash(password, salt);
      let user = await User.findByIdAndUpdate(req.session.currentUser._id, { password: password });
      req.session.currentUser = user;
      res.redirect('/private/main')
    }


  } catch (err) {
    console.log(err);
    res.render('auth/resetPassword', { layout: false, msg: err.message })
  }
});

router.post('/private/reset/email', async (req, res) => {
  const { email } = req.body;
  try {
    let alreadyExistsEmail = await User.findOne({ email: email });

    if (!email || alreadyExistsEmail) {
      throw new Error(`Este email já existe ou você não preencheu o campo corretamente`)
    } else {
      var token = Math.floor(100000 + Math.random() * 900000).toString();
      let userUpdateToken = await User.findByIdAndUpdate(req.session.currentUser._id, {confirmationCode:token})
      await sendConfirmationMail(email, token);

      res.render('auth/confirmNewMail.hbs', { layout: false, email: email })

    }

  } catch (err) {
    console.log(err);
    res.render('auth/resetEmail.hbs', { layout: false, msg: err.message })
  }
});

router.post('/private/reset/confirm-new-email', async (req, res) => {
  const { email, code } = req.body;
  try {
    var beforeUser = await User.findById(req.session.currentUser._id);
    if (code === beforeUser.confirmationCode) {
      let user = await User.findByIdAndUpdate(req.session.currentUser._id, { email: email }, {new:true});
      req.session.currentUser = user;
      res.redirect('/private/main')
    } else {
      throw new Error(`Código incorreto`);
    }

  } catch (err) {
    console.log(err);
    res.render('auth/resetEmail.hbs', { layout: false, msg: err.message })
  }
})



async function sendConfirmationMail(email,token) {
  try {

    var mailToHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
      <div style='width: 100%; height: 100%; background-color: #fff'>
          <h4>Seu código: <span>${token}</h4></span>
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
  } catch (err) {
    console.log(err)
  }
}

module.exports = router;
