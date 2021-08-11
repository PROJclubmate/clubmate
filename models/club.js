const mongoose = require('mongoose'),
  Schema       = mongoose.Schema;

const clubSchema = new Schema({
  name: String,
  isActive: {type: Boolean, default: true},
  deActivatedOn: Date,
  banner: String,
  avatar: String,
  avatarId: String,
  featuredPhotos:[{
    image: String,
    imageId: String,
    heading: String,
    description: String
  }],
  info: {
    description: String,
    rules: String
  },
  clubKeys: {
    college: String,
    category: String
  },
  followerCount: {type: Number, default: 0},
  allFollowerIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  memberRequests: [{
    message: String,
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    _id: false
  }],
  clubUsers: [{
    id: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    userRank: {
      type: Number,
      min: 0,
      max: 4,
      required: 'Please provide a (clubRank:0-President, 1-Admin, 2-Moderator, 3-SrMember, 4-JrMember)',
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value.'
      }
    },
    userStatus: String,
    memberSince: {type: Date, default: Date.now},
    storyDraftImage: String,
    storyDraftImageId: String,
    // x_y
    storyDraftAspectRatio: String,
    _id: false
  }],
  membersCount: {type: Number, default: 1},
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'ClubConversation'
  },
  chatRooms: [{
    name: String,
    avatar: String,
    avatarId: String,
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'ClubConversation'
    }
  }],
  chatRoomsCount: {type: Number, default: 1}
},
{
  timestamps: true
});

clubSchema.index({'clubKeys.college': 1});
clubSchema.index({name: 'text'});
clubSchema.index({geometry: '2dsphere'});

module.exports = mongoose.model('Club', clubSchema);