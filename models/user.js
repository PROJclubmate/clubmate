const mongoose = require('mongoose'),
  passportLocalMongoose = require('passport-local-mongoose'),
  Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: String,
  jamKey: String,
  fullName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  googleId: String,
  provider: String,
  isCollegeLevelAdmin: { type: Boolean, default: false },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isVerified: { type: Boolean, default: false },
  lastLoggedOut: Date,
  lastActive: Date,
  darkTheme: { type: Boolean, default: false },
  discoverSwitch: {
    type: Number,
    default: 1,
    min: 1,
    max: 2,
    required: '1-Clubs followed, 2-Explore',
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value.'
    }
  },
  sortByKey: {
    type: Number,
    default: 1,
    min: 1,
    max: 3,
    required: '1-HOT, 2-NEW, 3-TOP',
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value.'
    }
  },
  collegePagesView: {
    type: Number,
    default: 2,
    min: 1,
    max: 2,
    required: '1-Shows num of rooms in clubs & their banners, 2-Shows Following which clubs & my friends in that club',
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value.'
    }
  },
  followingClubCount: { type: Number, default: 0 },
  followingClubIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Club'
  }],
  profilePic: String,
  profilePicId: String,
  userKeys: {
    college: String,
    batch: String,
    house: String,
    branch: String,
    school: String,
    hostel: String,
    mess: String,
    sex: String,
    hometown: String,
    birthdate: { type: Date, default: null }
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
  note: String,
  bio: {
    aboutme: String,
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    discord: { type: String, default: '' },
    github: { type: String, default: '' },
    spotify: { type: String, default: '' },
    youtube: { type: String, default: '' },
    custom1: { type: String, default: '' },
    custom2: { type: String, default: '' }
  },
  interests: [String],
  recommends: { music: [String], movies: [String], tvshows: [String], places: [String], books: [String] },
  friendRequests: [this],
  friends: [this],
  friendsCount: { type: Number, default: 0 },
  clubInvites: [{
    type: Schema.Types.ObjectId,
    ref: 'Club'
  }],
  postHearts: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }],
  userClubs: [{
    id: {
      type: Schema.Types.ObjectId,
      ref: 'Club'
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'ClubConversation'
    },
    clubName: String,
    rank: {
      type: Number,
      min: 0,
      max: 4,
      required: 'Please provide a (clubRank:0-President,1-Admin,2-Moderator,3-SrMember,4-JrMember)',
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value.'
      }
    },
    status: String,
    memberSince: { type: Date, default: Date.now },
    _id: false
  }],
  unreadChatsCount: { type: Number, default: 0 },
  userChats: [{
    userId: this,
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation'
    },
    _id: false
  }],
  lastOpenedChatListClub: {
    type: Schema.Types.ObjectId,
    ref: 'Club'
  }
},
  {
    timestamps: true
  });

userSchema.index({ fullName: 'text' });
userSchema.index({ geometry: '2dsphere' });
userSchema.index({ email: 1 });

userSchema.plugin(passportLocalMongoose, {
  usernameField: 'email',
  // Set usernameUnique to false to avoid a mongodb index on the username column!
  usernameUnique: false,
  errorMessages: {
    IncorrectPasswordError: 'Password incorrect',
    IncorrectUsernameError: 'If registered an account already, Please verify your account through the link sent to your email id',
    UserExistsError: 'A user with the given email already exists. Not you? Try resetting your password.',
    NoSaltValueStoredError: 'No password stored. Use Login with Google for authentication.'
  },
  findByUsername: function (model, queryParameters) {
    // Add additional query parameter - AND condition - isVerified: true
    queryParameters.isVerified = true;
    return model.findOne(queryParameters);
  }
});

module.exports = mongoose.model('User', userSchema);