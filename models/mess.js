const mongoose = require('mongoose'),
  Schema       = mongoose.Schema;
const messSchema = new Schema({
 hostel: String,
 menu:{
     day: String,
     time: String,
     dishes: Array
 }
},{
    collection: 'mess'
});

module.exports = mongoose.model('Mess',messSchema);