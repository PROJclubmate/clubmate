const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

const collegePageSchema = new Schema({
  name: { type: String, unique: true, required: true },
  cover: String,
  userCount: { type: Number, default: 0 },
  allUserIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  clubCount: { type: Number, default: 0 },
  allClubs: [{
    category: String,
    categoryCount: { type: Number, default: 0 },
    categoryClubIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Club'
    }],
    _id: false
  }],
  batches: Array,
  branches: Array,
  hostels: Array,
  messes: Array,
  houses: Array,
  blogBuckets: [{
    blogCount: {
      type: Number,
      default: 0,
      max: 100,
    },
    bucketId: {
      type: Schema.Types.ObjectId,
      ref: 'Blog',
    },
  }],
  unapprovedBlogBucket: {
    type: Schema.Types.ObjectId,
    ref: 'Blog',
  },
});

// for find queries(match exact strings)
collegePageSchema.index({ name: 1 }, { unique: true });
// for search
collegePageSchema.index({ name: 'text' });

module.exports = mongoose.model('CollegePage', collegePageSchema);
