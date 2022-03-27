const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

const messSchema = new Schema({
  college: String,
  mess: [{
    name: String,
    menu: [{
      day: String,
      time: String,
      dishes: Array,
      _id: false
    }],
    _id: false
  }]
});

messSchema.index({ college: 1 });

module.exports = mongoose.model('Mess', messSchema);
