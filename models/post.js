const mongoose = require('mongoose'),
  Schema       = mongoose.Schema;

const postSchema = new Schema({
  description: String,
  descEdit: [{
    desc: String,
    createdAt: {type: Date, default: Date.now},
    _id: false
  }],
  image: String,
  imageId: String,
  privacy: {
    type: Number,
    min: 0,
    max: 4,
    required: 'Please provide a (privacySetting:0-Public,1-Friends,2-Club(members),3-Club(friends),4-Private)',
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value.'
    }
  },
  moderation: {
    type: Number,
    min: -1,
    max: 1,
    required: 'Please provide a (moderationSetting:(-1)-Hidden,0-Published,1-Exclusive)',
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value.'
    }
  },
  likeCount: {type: Number, default: 0},
  dislikeCount: {type: Number, default: 0},
  heartCount: {type: Number, default: 0},
  likeUserIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikeUserIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  heartUserIds: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],
  commentsCount: {type: Number, default: 0},
  //bucketNum is the cursor for current comment bucket(NOT THE TOTAL NUMBER OF COMM BUCKETS)
  bucketNum: {type: Number, default: 1},
  commentBuckets: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Comment'
    }
  ],
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
  // ======================================== DISCUSSION =======================================
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
},
{
  timestamps: true
});

postSchema.index({postClub:1});
postSchema.index({postAuthor:1});

module.exports = mongoose.model('Post', postSchema);