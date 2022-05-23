const Post      = require('../models/post'),
  User          = require('../models/user'),
  Comment       = require('../models/comment'),
  clConfig      = require('../config/cloudinary'),
  s3Config      = require('../config/s3'),
  logger        = require('../logger');

if(process.env.ENVIRONMENT === 'dev'){
  var cdn_prefix = 'https://res.cloudinary.com/dubirhea4/';
} else if (process.env.ENVIRONMENT === 'prod'){
  var cdn_prefix = 'https://d367cfssgkev4p.cloudfront.net/';
}


module.exports = {
  commentsCreate(req, res, next){
    Post.findById(req.params.post_id, function(err, foundPost){
    if(err || !foundPost){
      logger.error(req.user._id+' : (comments-1)foundPost err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      Comment.findOneAndUpdate({postId: foundPost._id, bucket: foundPost.bucketNum},
      {$inc: {count: 1},
        $push: {comments: {commentAuthor: {id: req.user._id, authorName: req.user.fullName}, 
          text: req.body.text}
        }
      }, {fields: {count:1}, upsert: true, new: true}, function(err, newCommentBucket){
      if(err || !newCommentBucket){
        logger.error(req.user._id+' : (comments-2)newCommentBucket err => '+err);
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        if(newCommentBucket.count == 1){
          foundPost.commentBuckets.push(newCommentBucket._id);
          foundPost.commentsCount += 1;
          foundPost.save();
        } else if(newCommentBucket.count >= 20){
          foundPost.bucketNum += 1;
          foundPost.commentsCount += 1;
          foundPost.save();
        } else{
          foundPost.commentsCount += 1;
          foundPost.save();
        }
        req.flash('success', 'Comment posted successfuly');
        return res.redirect('back');
      }
      });
    }
    });
  },

  commentsEditPage(req, res, next){
    Comment.findOne({_id: req.params.bucket_id}, {comments: {$elemMatch: {_id: req.params.comment_id}}},
    function(err, foundBucket){
    if(err || !foundBucket){
      logger.error(req.user._id+' : (comments-3)foundBucket err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      if(foundBucket.comments[0].commentAuthor.id.equals(req.user._id)){
        var bucket = foundBucket;
        var foundComment = foundBucket.comments[0];
        res.render('comments/edit', {bucket, comment: foundComment, cdn_prefix});
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      } else{
        res.redirect('back');
      }
    }
    });
  },

  commentsUpdate(req, res, next){
    Comment.updateOne({_id: req.params.bucket_id, 'comments._id': req.params.comment_id}, 
    {$set: {'comments.$.text': req.body.text}}, function(err){
    if(err){
      logger.error(req.user._id+' : (comments-4)updateBucket err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      req.flash('success', 'Comment edited successfuly');
      return res.redirect('back');
    }
    });
  },

  commentsDelete(req, res, next){
    Post.findById(req.params.post_id, function(err, foundPost){
    if(err || !foundPost){
      logger.error(req.user._id+' : (comments-5)foundPost err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      Comment.findOneAndUpdate({_id: req.params.bucket_id},
      {$inc: {count: -1}, $pull: {comments: {_id: req.params.comment_id}}}, {fields: {count:1} , new: true}, 
      function(err, deleteBucket){
      if(err || !deleteBucket){
        logger.error(req.user._id+' : (comments-6)deleteBucket err => '+err);
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        if(deleteBucket.count == 0){
          var index = foundPost.commentBuckets.indexOf(deleteBucket._id);
          if (index > -1) {
            foundPost.commentBuckets.splice(index, 1);
            foundPost.commentsCount -= 1;
            foundPost.save();
          }
          deleteBucket.remove();
        } else{
          foundPost.commentsCount -= 1;
          foundPost.save();
        }
      req.flash('success', 'Comment deleted successfuly');
      return res.redirect('back');
      }
      });
    }
    });
  },

  commentsLoadMore(req, res, next){
    Post.findById(req.params.post_id).select({type: 1, commentBuckets: 1})
    .exec(function (err, foundPost){
    if(err || !foundPost){
      logger.error('(comments-7)foundPost err => '+err);
      return res.sendStatus(500);
    } else{
      if(foundPost.type == 'simple' && foundPost.commentBuckets != ''){
        Comment.find({_id: foundPost.commentBuckets[req.query.newIndex]})
        .populate({path: 'comments.commentAuthor.id', select: 'fullName profilePic profilePicId userKeys'})
        .exec(function(err, foundBucket){
        if(err || !foundBucket){
          logger.error('(comments-8)foundBucket err => '+err);
          return res.sendStatus(500);
        } else if(!err && foundBucket != ''){
          foundBucket.comments.sort(function(a, b){
            return a.likeCount - b.likeCount;
          });
          var CA_50_profilePic = [];
          for(var j=0;j<foundBucket[0].comments.length;j++){
            if(process.env.ENVIRONMENT === 'dev'){
              CA_50_profilePic[j] = clConfig.cloudinary.url(foundBucket[0].comments[j].commentAuthor.id.profilePicId, clConfig.thumb_100_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              CA_50_profilePic[j] = s3Config.thumb_100_prefix+foundBucket[0].comments[j].commentAuthor.id.profilePicId;
            }
          }
          var index = req.query.newIndex-1;
          if(req.user && foundBucket != ''){
            var likedComments = commentCheck(req.user._id,foundBucket);
            var currentUser = req.user._id
          } else{
            var likedComments = [], currentUser = null;
          }
          res.json({post: foundPost, likedComments, buckets: foundBucket, index, currentUser, 
          CA_50_profilePic, csrfToken: res.locals.csrfToken, cdn_prefix});
          return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
        // Close else block if problem
        } else{
          return res.json({buckets: []});
        }
        });
      } else{
        res.redirect('back');
      }
    }
    });
  },

  commentsVote(req, res, next){
    Comment.findOneAndUpdate({_id: req.params.bucket_id, 
    comments: {$elemMatch: {_id: req.params.comment_id, likeUserIds: {$ne: req.user._id}}}},
    {$push: {'comments.$.likeUserIds': req.user._id}, $inc: {'comments.$.likeCount': 1}},
    {fields: {comments: {$elemMatch: {_id: req.params.comment_id, likeUserIds: req.user._id}}}, new: true},
    function(err, notFoundComment){
    if(err){
      logger.error(req.user._id+' : (comments-9)notFoundComment err => '+err);
      return res.sendStatus(500);
    } else{
      if(notFoundComment){
        res.json({foundComment: notFoundComment, csrfToken: res.locals.csrfToken, cdn_prefix});
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      }else if(!notFoundComment){
        Comment.findOneAndUpdate({_id: req.params.bucket_id, 
          comments: {$elemMatch: {_id: req.params.comment_id, likeUserIds: req.user._id}}},
        {$pull: {'comments.$.likeUserIds': req.user._id}, $inc: {'comments.$.likeCount': -1}},
        {fields: {comments: {$elemMatch: {_id: req.params.comment_id, likeUserIds: {$ne: req.user._id}}}}, new: true},
        function(err, foundComment){
        if(err){
          logger.error(req.user._id+' : (comments-10)foundComment err => '+err);
          return res.sendStatus(500);
        } else{
          res.json({foundComment, csrfToken: res.locals.csrfToken, cdn_prefix});
          return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
        }
        });
      }
    }
    });
  }
}

function commentCheck(userId,bucket){
  if(userId){
    var likedComments = [];
    for(var k=0;k<bucket.length;k++){
      for(var i=0;i<bucket[k].count;i++){
        for(var j=0;j<bucket[k].comments[i].likeCount;j++){
          if(bucket[k].comments[i].likeUserIds[j].equals(userId)){
            likedComments.push(bucket[k].comments[i]._id);
          }
        }
      }
    }
    return likedComments;
  } else{var likedComments = []; return likedComments;}
};