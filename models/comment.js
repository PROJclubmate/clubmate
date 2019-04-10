var mongoose = require("mongoose");

var commentSchema = new mongoose.Schema({
	postId: {
		type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
	},
	bucket: {type: Number, default: 1},
	count: {
		type: Number,
		default: 0,
		max: 10
	},
	comments: [{
		// slug: String,
		// full_slug: String,
		postedAt: {type: Date, default: Date.now},
		commentAuthor: {
			id:{
				type: mongoose.Schema.Types.ObjectId,
	      ref: "User"
	    },
	    authorName: String
		},
		text: String,
		upvotesCount: {type: Number, default: 0},
		upvoteUserIds: [{
		  type: mongoose.Schema.Types.ObjectId,
		  ref: "User"
		}]
	}]
});
commentSchema.index({postId: 1, bucket: 1}, {unique: true});

module.exports = mongoose.model("Comment", commentSchema);

