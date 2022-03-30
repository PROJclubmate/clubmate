const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

const blogSchema = new Schema({
  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  image: String,
  imageId: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },

  url: String,

  content: String,

  readTime: {
    type: Number,
    default: 0
  },
  
  author: {
    id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    name: String,
  },

  heartCount: {
    type: Number,
    default: 0,
  },

  approved: {
    type: Boolean,
    default: false,
  },

});

const blogBucketSchema = new Schema({

  college: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  
  blogCount: {
    type: Number,
    default: 0,
    max: 100,
  },

  blogApprovedCount: {
    type: Number,
    default: 0,
      max: 100,
  },

  blogs: [blogSchema],
});

blogBucketSchema.index({college: 1, createdAt: 1}, {unique: true});

module.exports = mongoose.model('Blog', blogBucketSchema);
