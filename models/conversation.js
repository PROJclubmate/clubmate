const mongoose = require('mongoose'),
  Schema       = mongoose.Schema;

const conversationSchema = new Schema({
  participants: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  isBlocked: {type: Boolean, default: false},
  blockedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  bucketNum: {type: Number, default: 1},
  messageBuckets: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    }
  ]
});

module.exports = mongoose.model('Conversation', conversationSchema);