var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
  firstName: {type: String, required: true},
  lastName: String,
  fullName: {type: String, required: true},
  email: {type: String, unique: true, required: true},
  verified: {type: Boolean, default: false},
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  profilePic: String,
  profilePicId: String,
  featuredPhotos:[{
    image: String,
    imageId: String,
    heading: String,
    description: String
  }],
  userKeys: {
    sex: String,
    birthdate: Date,
    school: String,
    college: String,
    worksAt: String,
    residence: String
  },
  note: String,
  interests: [String],
  favourites: {music:[String], movies:[String], tvshows:[String], places:[String], books: [String]},
  friendRequests: [this],
  friends: [this],
  friendsCount: Number,
  clubInvites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Club"
  }],
  postHearts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
  }],
  userClubs: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club"
    },
    clubName: String,
    rank: {
      type: Number,
      min: 0,
      max: 4,
      required: "Please provide a (clubRank:0-Founder,1-Admin,2-Moderator,3-SrMember,4-JrMember)",
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value."
      }
    },
    status: String,
    memberSince: {type: Date, default: Date.now},
    // currently stores latest update from each club
    clubUpdates: [{
      news: String,
      eventDate: Date,
      pushedAt: {type: Date, default: Date.now}
    }],
    _id: false
  }],
  userChats: [{
    userId: this,
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation"
    },
    _id: false
  }],
  blockedUsers: [this]
},
{
  timestamps: true
});

userSchema.index({fullName: "text"});
userSchema.index({email: 1});

// var passwordValidator = function(password, cb){
//   var regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/;
//   if(!password.match(regex)){
//     return cb(null, false)
//   }
//   return cb(null, true);
// }

userSchema.plugin(passportLocalMongoose,{
  usernameField : "email",
  errorMessages: {
    IncorrectPasswordError: "Password incorrect",
    IncorrectUsernameError: "There is no account registered with that email",
    UserExistsError: "A user with the given email is already registered"
  },
  // passwordValidator: passwordValidator,
  findByUsername: function(model, queryParameters){
    // Add additional query parameter - AND condition - verified: true
    queryParameters.verified = true;
    return model.findOne(queryParameters);
  }
});

module.exports = mongoose.model("User", userSchema);