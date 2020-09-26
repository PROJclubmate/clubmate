const mongoose = require('mongoose'),
  Schema       = mongoose.Schema;

const collegePageSchema = new Schema({
  name: {type: String, unique: true, required: true},
  userCount: {type: Number, default: 0},
  allUserIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  clubCount: {type: Number, default: 0},
  // Not 'allClubIds' (clubCount != allClubs.length)
  allClubs: [{
    category: String,
    categoryCount: {type: Number, default: 0},
    categoryClubIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Club'
    }],
    _id: false
  }]  
});

// for find queries(match exact strings)
collegePageSchema.index({name: 1}, {unique: true});
// for search
collegePageSchema.index({name: 'text'});

module.exports = mongoose.model('CollegePage', collegePageSchema);