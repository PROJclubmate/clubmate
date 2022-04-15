const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

const collegePageSchema = new Schema({
  name: { type: String, unique: true, required: true },
  cover: String,
  coverId: String,
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
  branches: Array,
  houses: Array,
  hostels: Array,
  messes: Array
});

// for find queries(match exact strings)
collegePageSchema.index({ name: 1 }, { unique: true });
// for search
collegePageSchema.index({ name: 'text' });

module.exports = mongoose.model('CollegePage', collegePageSchema);