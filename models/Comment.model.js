const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const commentSchema = new Schema(
    {
        author: { type: Schema.Types.ObjectId, ref: "User" },
        content: { type: String, max: 400, min: 10 },
        likes: [{ type: Schema.Types.ObjectId, ref: "User", unique: true }],
        article: { type: Schema.Types.ObjectId, ref: 'Article' },
        replys: [{ type: Schema.Types.ObjectId, ref: 'Reply' }],
    },
    {
        timestamps: true,
    }
);

module.exports = model("Comment", commentSchema);