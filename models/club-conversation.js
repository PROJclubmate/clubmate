var mongoose = require("mongoose");

var clubConversationSchema = new mongoose.Schema({
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Club"
  },
  bucketNum: {type: Number, default: 1},
  messageBuckets: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    }
  ]
});

module.exports = mongoose.model("ClubConversation", clubConversationSchema);