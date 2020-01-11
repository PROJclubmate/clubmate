const mongoose = require('mongoose'),
  Schema       = mongoose.Schema;

const clubConversationSchema = new Schema({
  isActive: {type: Boolean, default: true},
  clubId: {
    type: Schema.Types.ObjectId,
    ref: 'Club'
  },
  bucketNum: {type: Number, default: 1},
  messageBuckets: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    }
  ]
});

module.exports = mongoose.model('ClubConversation', clubConversationSchema);