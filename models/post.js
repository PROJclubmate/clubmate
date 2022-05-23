const mongoose = require('mongoose'),
  Schema       = mongoose.Schema;

const postSchema = new Schema({
  type: {type: String, enum: ['simple', 'topic']},
  clubCollegeKey: String,
  clubCategory: String,
  description: {type: String, required: true},
  hyperlink: String,
  descEdit: [{
    desc: String,
    createdAt: {type: Date, default: Date.now},
    _id: false
  }],
  image: String,
  imageId: String,
  // +1 for minified view (Load more), +5 for view;
  // Unwanted --> Someone might refresh page indefinately (F5) to boost score
  viewsCount: {type: Number, default: 0},
  privacy: {
    type: Number,
    min: 0,
    max: 3,
    required: 'Please provide a (privacySetting:0-Outside College, 1-This College, 2-This Club, 3-Only Me)',
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value.'
    }
  },
  moderation: {
    type: Number,
    min: -1,
    max: 1,
    required: 'Please provide a (moderationSetting:(-1)-Hidden, 0-Published, 1-Exclusive)',
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value.'
    }
  },
  postClub: {
    type: Schema.Types.ObjectId,
    ref: 'Club'
  },
  postAuthor: {
    id:{
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    authorName: String
  },
  createdAt: {type: Date, default: Date.now},
  // =============================== SIMPLE Posts i.e. if topic == '' ================================
  commentsCount: {type: Number, default: 0},
  //bucketNum is the cursor for current comment bucket(NOT THE TOTAL NUMBER OF COMM BUCKETS)
  bucketNum: {type: Number, default: 1},
  commentBuckets: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Comment'
    }
  ],
  likeCount: {type: Number, default: 0},
  heartCount: {type: Number, default: 0},
  likeUserIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  heartUserIds: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],
  // =============================== DISCUSSION (TOPIC Posts) i.e. if topic != '' ================================
  topic: String,
  subpostsCount: {type: Number, default: 0},
  subpostbucketNum: {type: Number, default: 1},
  subpostBuckets: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Discussion'
    }
  ],
  upVoteCount: {type: Number, default: 0},
  downVoteCount: {type: Number, default: 0},
  upVoteUserIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  downVoteUserIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
});

postSchema.index({createdAt: 1});
postSchema.index({postClub: 1});
postSchema.index({'postAuthor.id': 1});
postSchema.index({clubCollegeKey: 1});
postSchema.index({type: 1});

module.exports = mongoose.model('Post', postSchema);