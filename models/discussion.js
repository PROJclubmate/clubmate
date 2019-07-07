const mongoose = require('mongoose'),
  Schema       = mongoose.Schema;

const discussionSchema = new Schema({
	postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  bucket: {type: Number, default: 1},
  count: {
    type: Number,
    default: 0,
    max: 20
  },
  subPosts: [{
    postedAt: {type: Date, default: Date.now},
    subPostAuthor: {
      id:{
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      authorName: String
    },
    // image: String,
    // imageId: String,
    quoteNum: {type: Number, default: 0},
    quoteText: {type: String, default: ''},
    text: String,
    likeCount: {type: Number, default: 0},
    dislikeCount: {type: Number, default: 0},
    likeUserIds: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    dislikeUserIds: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  }]
});
discussionSchema.index({postId: 1, bucket: 1}, {unique: true});

module.exports = mongoose.model('Discussion', discussionSchema);