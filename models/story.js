const mongoose = require('mongoose'),
  Schema       = mongoose.Schema;

const storySchema = new Schema({
  type: {type: String, enum: ['photo', 'video']},
  length: {type: Number, default: 3},
  image: String,
  imageId: String,
  aspectRatio: String,
  preview: String,
  link: String,
  linkText: String,
  timestamp: Number,
  seenByUserIds: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],
  storyClub: {
    type: Schema.Types.ObjectId,
    ref: 'Club'
  },
  storyAuthor: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  authorName: String,
  eventNotice: String,
  eventDate: Date,
  // If true, story cannot be seen by anyone but the club members
  isClubExclusive: {type: Boolean, default: true},
  // If true, story & its media will not get deleted after 7 days
  isSaved: {type: Boolean, default: true},
  createdAt: {type: Date, default: Date.now},
  album: String,
});

storySchema.index({storyClub: 1});
storySchema.index({createdAt: 1});

module.exports = mongoose.model('Story', storySchema);