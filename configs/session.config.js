const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const mongoose = require("mongoose");

var expiryDate = new Date(Date.now() + 60 * 60 * 1000);

module.exports = (app) => {
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: true,
        expires: expiryDate,
        store: new MongoStore({
          mongooseConnection: mongoose.connection,
          // ttl => time to live
          ttl: 60 * 60 * 24, // 60sec * 60min * 24h => 1 day
        }),
      },
    })
  );
};
