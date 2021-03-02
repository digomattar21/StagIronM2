const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const replySchema = new Schema(
    {
        author: { type: Schema.Types.ObjectId, ref: "User", unique: false},
        content: { type: String, max: 400, min: 10, unique: false },
        comment: { type: Schema.Types.ObjectId, ref: 'Comment', unique: false },
        authorUsername: {type: String}
    },
    {
        timestamps: true,
    }
);

module.exports = model("Reply", replySchema);