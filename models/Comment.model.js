const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const commentSchema = new Schema(
    {
        author: { type: Schema.Types.ObjectId, ref: "User" },
        content: { type: String },
        likes: { type: Number, min: 0 },
        article: { type: Schema.Types.ObjectId, ref: 'Article' },
    },
    {
        timestamps: true,
    }
);

module.exports = model("Comment", commentSchema);