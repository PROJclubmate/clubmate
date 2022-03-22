const mongoose = require('mongoose'),
  Schema       = mongoose.Schema;

const merchandiseSchema = new Schema({
    createdAt: {type: Date, default: Date.now},
    image: String,
    imageId: String,
    title : String,
    description: String,
    category: String,
    contact: Number,
    price: Number,
    club: String,
});

module.exports = mongoose.model('Merchandise', merchandiseSchema);