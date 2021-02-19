const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const ipInfoSchema = new Schema(
  {
    info: {type: Object}
  },
  {
    timestamps: true,
  }
);

module.exports = model("IpInfo", ipInfoSchema);
