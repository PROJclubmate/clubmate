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
  latestMessage: String,
  lastMsgOn: {type: Date, default: Date.now},
  lastMsgBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  messageCount: {type: Number, default: 1},
  seenMsgCursors: [{
    id: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    cursor: {type: Number, default: 1},
    lastSeen: Date,
    _id: false
  }],
  bucketNum: {type: Number, default: 1},
  messageBuckets: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    }
  ]
});

module.exports = mongoose.model('Conversation', conversationSchema);