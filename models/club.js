const mongoose          = require("mongoose"),
  passportLocalMongoose = require("passport-local-mongoose"),
  Schema                = mongoose.Schema;

const clubSchema = new Schema({
  name: String,
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
  categories: [String],
  clubKeys: {
    location: String,
    grouptype: String,
    organization: String,
    weblink: String
  },
  description: String,
  updates: [{
    news: String,
    eventDate: Date,
    pushedAt: {type: Date, default: Date.now}
  }],
  reccomendations: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],
  clubUsers: [{
    id: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    userRank: {
      type: Number,
      min: 0,
      max: 4,
      required: "Please provide a (clubRank:0-Founder,1-Admin,2-Moderator,3-SrMember,4-JrMember)",
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value."
      }
    },
    userStatus: String,
    memberSince: {type: Date, default: Date.now},
    _id: false
  }],
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: "ClubConversation"
  }
},
{
  timestamps: true
});

clubSchema.index({name: "text"});

module.exports = mongoose.model("Club", clubSchema);