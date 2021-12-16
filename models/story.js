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
  seenByUserIds: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],
  storyClub: {
    type: Schema.Types.ObjectId,
    ref: 'Club'
  },
  storyAuthor: {
    id:{
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    authorName: String
  },
  eventNotice: String,
  eventDate: Date,
  // If false story can be seen by everyone in this college, else only by club members
  isClubExclusive: {type: Boolean, default: true},
  // If true, story & its media will not be deleted after 24 hours
  isSaved: {type: Boolean, default: false},
  createdAt: {type: Date, default: Date.now}
});

storySchema.index({storyClub: 1});
storySchema.index({createdAt: 1});

module.exports = mongoose.model('Story', storySchema);