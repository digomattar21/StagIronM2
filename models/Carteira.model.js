const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const carteiraSchema = new Schema(
  {
    user: {type: Schema.Types.ObjectId, ref: "User"},
    tickers: [{type: Schema.Types.ObjectId, ref: "Ticker"}],
    patrimonio: {type: Number},
  },
  {
    timestamps: true,
  }
);

module.exports = model("Carteira", carteiraSchema);