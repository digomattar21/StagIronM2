require("dotenv").config();
const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const bcrypt = require("bcryptjs");
var saltRounds = 12;
const nodemailer = require("nodemailer");

router.get("/auth/login", (req, res) => {
  res.render("auth/login.hbs");
});

router.post("/auth/login", async (req, res) => {
  try {
    console.log("SESSION==>", req.session);
    const { email, password } = req.body;

    if (email === "" || password === "") {
      throw new Error(`Por favor insira seu email e senha `);
    }

    let user = await User.findOne({ email: email });

    if (user != null) {
      let validate = await bcrypt.compareSync(password, user.password);

      if (validate) {
        req.session.currentUser = user;

        res.render("private/main.hbs", {
          userInSession: req.session.currentUser,
        });
      } else {
        throw new Error(`Senha Incorreta`);
      }
    } else {
      throw new Error(`Email nao encontrado`);
    }
  } catch (e) {
    console.log(e);
    res.render("auth/login.hbs", { msg: e });
  }
});

router.get("/auth/signup", (req, res) => {
  res.render("auth/sign-up.hbs");
});

router.post("/auth/sign-up", async (req, res) => {
  try {
    var { name, email, password } = req.body;
    var salt = await bcrypt.genSalt(saltRounds);

    var alreadyExistsEmail = await User.findOne({ email: email });
    var passRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,20}$/;

    if (alreadyExistsEmail != null) {
      throw new Error(`Este email ja está cadastrado`);
    } else if (!password || !email || !name) {
      throw new Error(`Todos os campos são orbigatórios`);
    } else if (!password.match(passRegex)) {
      throw new Error(
        `Sua senha deve conter no mínimo: 8 caracteres, 1 letra maiúscula, 1 letra minúscula, 1 símbolo e 1 número (Levamos sua segurança a sério)`
      );
    } else {
      
      password = await bcrypt.hash(password, salt);
      let createUser = await User.create({ name, email, password });
      let user = await User.findOne({ email: email });
      req.session.currentUser = user;
      res.render("private/main.hbs", {
        userInSession: req.session.currentUser,
      });
    }
  } catch (e) {
    console.log(e);
    res.render("auth/sign-up.hbs", { msg: e });
  }
});

router.post("/auth/logout", async (req, res) => {
  req.session.destroy();
  res.redirect("/");
});


module.exports = router;
