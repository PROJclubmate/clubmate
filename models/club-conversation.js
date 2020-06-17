const mongoose = require('mongoose'),
  Schema       = mongoose.Schema;

const clubConversationSchema = new Schema({
  isActive: {type: Boolean, default: true},
  clubId: {
    type: Schema.Types.ObjectId,
    ref: 'Club'
  },
  latestMessage: String,
  messageCount: {type: Number, default: 1},
  seenMsgCursors: [{
    id: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    cursor: {type: Number, default: 0},
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

module.exports = mongoose.model('ClubConversation', clubConversationSchema);