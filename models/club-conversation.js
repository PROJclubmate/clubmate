const mongoose = require('mongoose'),
  Schema       = mongoose.Schema;

const clubConversationSchema = new Schema({
  isActive: {type: Boolean, default: true},
  isRoom: {type: Boolean, default: false},
  roomName: String,
  participantCount: {type: Number, default: 0},
  allParticipantIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  clubId: {
    type: Schema.Types.ObjectId,
    ref: 'Club'
  },
  lastMessage: String,
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

module.exports = mongoose.model('ClubConversation', clubConversationSchema);