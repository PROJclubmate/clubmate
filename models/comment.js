const mongoose = require('mongoose'),
  Schema       = mongoose.Schema;

const commentSchema = new Schema({
	postId: {
		type: Schema.Types.ObjectId,
    ref: 'Post'
	},
	bucket: {type: Number, default: 1},
	count: {
		type: Number,
		default: 0,
		max: 20
	},
	comments: [{
		postedAt: {type: Date, default: Date.now},
		commentAuthor: {
			id:{
				type: Schema.Types.ObjectId,
	      ref: 'User'
	    },
	    authorName: String
		},
		text: String,
		likeCount: {type: Number, default: 0},
		likeUserIds: [{
		  type: Schema.Types.ObjectId,
		  ref: 'User'
		}]
	}]
});

commentSchema.index({postId: 1, bucket: 1}, {unique: true});

module.exports = mongoose.model('Comment', commentSchema);

