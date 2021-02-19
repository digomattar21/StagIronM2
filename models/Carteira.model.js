const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const carteiraSchema = new Schema(
  {
    user: {type: Schema.Types.ObjectId, ref: "User"},
    tickers: [{type: Object}],
  },
  {
    timestamps: true,
  }
);

module.exports = model("Carteira", carteiraSchema);
