const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const tickerSchema = new Schema(
  {
    carteira: {type: Schema.Types.ObjectId, ref: "Carteira"},
    name: {type: String},
    currentPrice: {type: String},
    positionUn: {type: Number},
    position: {type: Number},
    dayChangePct: {type: Number},
    buyPrice:{type: Number}

  },
  {
    timestamps: true,
  }
);

module.exports = model("Ticker", tickerSchema);
