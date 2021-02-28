const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const replySchema = new Schema(
    {
        author: { type: Schema.Types.ObjectId, ref: "User" },
        content: { type: String, max: 400, min: 10 },
        likes: [{ type: Schema.Types.ObjectId, ref: "User", unique: true }],
        comment: { type: Schema.Types.ObjectId, ref: 'Comment' },
    },
    {
        timestamps: true,
    }
);

module.exports = model("Reply", replySchema);