const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const settingsSchema = new Schema(
    {
        user: {type: Schema.Types.ObjectId, ref: "User"},
        biografia: {type: String},
        sexo: {type: String, enum:['masculino', 'feminino', 'nao']},
        fblink: {type: String},
        twitterlink: {type: String},
        instalink: {type: String},
        walletpublic: {type: String},
        destaquespublic: {type: String},
        profileImgUrl: {type: String}
    },
    {
        timestamps: true,
    }
);

module.exports = model("Settings", settingsSchema);