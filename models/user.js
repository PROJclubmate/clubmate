const mongoose          = require('mongoose'),
  passportLocalMongoose = require('passport-local-mongoose'),
  Schema                = mongoose.Schema;

const userSchema = new Schema({
  firstName: {type: String, required: true},
  lastName: String,
  fullName: {type: String, required: true},
  email: {type: String, unique: true, required: true},
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isVerified: {type: Boolean, default: false},
  isLoggedIn: Boolean,
  lastLoggedOut: Date,
  discoverSwitch: {
    type: Number,
    default: 1,
    min: 1,
    max: 2,
    required: '1-Org. followed, 2-Explore & tags',
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
  followingOrgKeys: [String],
  followingStrayClubIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Club'
  }],
  followingStrayClubCount: {type: Number, default: 0},
  unfollowingOrgClubIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Club'
  }],
  unfollowingOrgClubCount: {type: Number, default: 0},
  profilePic: String,
  profilePicId: String,
  featuredPhotos:[{
    image: String,
    imageId: String,
    heading: String,
    description: String
  }],
  discoverTags: [String],
  userKeys: {
    sex: String,
    birthdate: Date,
    college: String,
    workplace: String,
    school: String,
    residence: String
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
  interests: [String],
  favourites: {music:[String], movies:[String], tvshows:[String], places:[String], books: [String], videogames: [String]},
  friendRequests: [this],
  friends: [this],
  friendsCount: {type: Number, default: 0},
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
    clubName: String,
    rank: {
      type: Number,
      min: 0,
      max: 4,
      required: 'Please provide a (clubRank:0-Owner,1-Admin,2-Moderator,3-SrMember,4-JrMember)',
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value.'
      }
    },
    status: String,
    memberSince: {type: Date, default: Date.now},
    _id: false
  }],
  clubUpdates: [{
    clubId: {
      type: Schema.Types.ObjectId,
      ref: 'Club'
    },
    clubName: String,
    pusherName: String,
    deleterName: String,
    updateId: Schema.Types.ObjectId,
    news: String,
    eventDate: Date,
    pushedAt: {type: Date, default: Date.now}
  }],
  userChats: [{
    userId: this,
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation'
    },
    lastMessage: String,
    _id: false
  }]
},
{
  timestamps: true
});

userSchema.index({fullName: 'text'});
userSchema.index({geometry: '2dsphere'});
userSchema.index({email: 1});

userSchema.plugin(passportLocalMongoose,{
  usernameField : 'email',
  // Set usernameUnique to false to avoid a mongodb index on the username column!
  usernameUnique: false,
  errorMessages: {
    IncorrectPasswordError: 'Password incorrect',
    IncorrectUsernameError: 'There is either no account registered with that email or the account may not have been verified',
    UserExistsError: 'A user with the given email is already registered'
  },
  findByUsername: function(model, queryParameters){
    // Add additional query parameter - AND condition - isVerified: true
    queryParameters.isVerified = true;
    return model.findOne(queryParameters);
  }
});

module.exports = mongoose.model('User', userSchema);