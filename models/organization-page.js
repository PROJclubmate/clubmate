const mongoose = require('mongoose'),
  Schema       = mongoose.Schema;

const orgPageSchema = new Schema({
  name: {type: String, unique: true, required: true},
  clubCount: {type: Number, default: 0},
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
orgPageSchema.index({name:1}, {unique: true});
// for search
orgPageSchema.index({name: 'text'});

module.exports = mongoose.model('OrgPage', orgPageSchema);