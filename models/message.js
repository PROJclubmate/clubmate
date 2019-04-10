var mongoose = require("mongoose");

var messageSchema = new mongoose.Schema({
	conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation"
  },
  bucket: {type: Number, default: 1},
  count: {
    type: Number,
    default: 0,
    max: 50
  },
  messages: [{
    createdAt: {type: Date, default: Date.now},
    authorId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    authorName: String,
    text: String
  }]
});
messageSchema.index({conversationId: 1, bucket: 1}, {unique: true});

module.exports = mongoose.model("Message", messageSchema);