const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

const wearableSchema = new Schema({
  createdAt: { type: Date, default: Date.now },
  images: Array,
  imageIds: Array,
  title: String,
  description: String,
  category: String,
  subCategory: String,
  contact: String,
  price: Number,
  sizes: Array,
  colors: Array,
  inStock: { type: Boolean, default: true },
  club: {
    clubId: {
      type: Schema.Types.ObjectId,
      ref: 'Club'
    },
    clubName: String,
  }
})

const stickerSchema = new Schema({
  createdAt: { type: Date, default: Date.now },
  images: Array,
  imageIds: Array,
  title: String,
  description: String,
  category: String,
  subCategory: String,
  contact: String,
  price: Number,
  inStock: { type: Boolean, default: true },
  club: {
    clubId: {
      type: Schema.Types.ObjectId,
      ref: 'Club'
    },
    clubName: String,
  }
})


const accessorySchema = new Schema({
  createdAt: { type: Date, default: Date.now },
  images: Array,
  imageIds: Array,
  title: String,
  description: String,
  category: String,
  subCategory: String,
  contact: String,
  price: Number,
  inStock: { type: Boolean, default: true },
  club: {
    clubId: {
      type: Schema.Types.ObjectId,
      ref: 'Club'
    },
    clubName: String,
  }
})

const merchandiseSchema = new Schema({
  college: String,
  wearables: [wearableSchema],
  stickers: [stickerSchema],
  accessories: [accessorySchema]
})

merchandiseSchema.index({ college: 1 });


module.exports = mongoose.model('Merchandise', merchandiseSchema);