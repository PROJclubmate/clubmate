const mongoose          = require('mongoose'),
  passportLocalMongoose = require('passport-local-mongoose'),
  Schema                = mongoose.Schema;

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
    organization: String,
    category: String,
    weblink: String,
    location: String,
  },
  geometry: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
    }
  },
  updates: [{
    pusherId: this,
    pusherName: String,
    news: String,
    eventDate: Date,
    pushedAt: {type: Date, default: Date.now}
  }],
  totalFollowerCount: {type: Number, default: 0},
  strayClubfollowingUserIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  strayClubfollowingUserCount: {type: Number, default: 0},
  orgClubUnfollowingUserIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  orgClubUnfollowingUserCount: {type: Number, default: 0},
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
      required: 'Please provide a (clubRank:0-Owner,1-Admin,2-Moderator,3-SrMember,4-JrMember)',
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value.'
      }
    },
    userStatus: String,
    memberSince: {type: Date, default: Date.now},
    _id: false
  }],
  membersCount: {type: Number, default: 1},
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'ClubConversation'
  }
},
{
  timestamps: true
});

clubSchema.index({'clubKeys.organization': 1});
clubSchema.index({name: 'text'});
clubSchema.index({geometry: '2dsphere'});

module.exports = mongoose.model('Club', clubSchema);