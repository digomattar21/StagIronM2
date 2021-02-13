const mongoose = require("mongoose");
const uri =
  process.env.MONGODB_URI ||
  `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@cluster0.iutfv.mongodb.net/StagInitial?retryWrites=true&w=majority`;

//Connecting to DB
mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((x) => {
    console.log(
      `Connected to Mongo! Database name: "${x.connections[0].name}"`
    );
  })
  .catch((err) => {
    console.error("Error connecting to mongo", err);
  });
