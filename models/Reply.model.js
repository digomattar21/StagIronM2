const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const replySchema = new Schema(
    {
        author: { type: Schema.Types.ObjectId, ref: "User", unique: false },
        content: { type: String, max: 400, min: 10, unique: false },
        article: { type: Schema.Types.ObjectId, ref: 'Article' },
        comment: { type: Schema.Types.ObjectId, ref: 'Comment', unique: false },
        likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
        authorUsername: { type: String }
    },
    {
        timestamps: true,
    }
);

module.exports = model("Reply", replySchema);