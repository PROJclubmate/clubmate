const express  = require('express'),
  router       = express.Router({mergeParams: true}),
  Post         = require('../models/post'),
  Comment      = require('../models/comment'),
  {cloudinary} = require('../public/js/cloudinary.js');

module.exports = {
  commentsCreate(req, res, next){
    Post.findById(req.params.post_id, function(err, foundPost){
    if(err || !foundPost){
      console.log(Date.now()+' : '+req.user._id+' => (comments-1)foundPost err:- '+JSON.stringify(err, null, 2));
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
        console.log(Date.now()+' : '+req.user._id+' => (comments-2)newCommentBucket err:- '+JSON.stringify(err, null, 2));
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
      console.log(Date.now()+' : '+req.user._id+' => (comments-3)foundBucket err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      if(foundBucket.comments[0].commentAuthor.id.equals(req.user._id)){
        var bucket = foundBucket;
        var foundComment = foundBucket.comments[0];
        res.render('comments/edit', {bucket, comment: foundComment});
      } else{
        res.redirect('back');
      }
    }
    });
  },

  commentsUpdate(req, res, next){
    Comment.updateOne({_id: req.params.bucket_id, 'comments._id': req.params.comment_id}, 
    {$set: {'comments.$.text': req.body.text}}, function(err, updateBucket){
    if(err || !updateBucket){
      console.log(Date.now()+' : '+req.user._id+' => (comments-4)updateBucket err:- '+JSON.stringify(err, null, 2));
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
      console.log(Date.now()+' : '+req.user._id+' => (comments-5)foundPost err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      Comment.findOneAndUpdate({_id: req.params.bucket_id},
      {$inc: {count: -1}, $pull: {comments: {_id: req.params.comment_id}}}, {fields: {count:1} , new: true}, 
      function(err, deleteBucket){
      if(err || !deleteBucket){
        console.log(Date.now()+' : '+req.user._id+' => (comments-6)deleteBucket err:- '+JSON.stringify(err, null, 2));
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
    Post.findById(req.params.post_id).select({topic: 1, commentBuckets: 1})
    .exec(function (err, foundPost){
    if(err || !foundPost){
      console.log(Date.now()+' : '+'(comments-7)foundPost err:- '+JSON.stringify(err, null, 2));
      return res.sendStatus(500);
    } else{
      if(foundPost.topic == '' && foundPost.commentBuckets != ''){
        Comment.find({_id: foundPost.commentBuckets[req.query.newIndex]})
        .populate({path: 'comments.commentAuthor.id', select: 'fullName profilePic profilePicId'})
        .exec(function(err, foundBucket){
        if(err || !foundBucket){
          console.log(Date.now()+' : '+'(comments-8)foundBucket err:- '+JSON.stringify(err, null, 2));
          return res.sendStatus(500);
        } else if(!err && foundBucket != ''){
          var CA_50_profilePic = [];
          for(var j=0;j<foundBucket[0].comments.length;j++){
            CA_50_profilePic[j] = cloudinary.url(foundBucket[0].comments[j].commentAuthor.id.profilePicId,
            {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
          }
          var index = req.query.newIndex-1;
          if(req.user && foundBucket != ''){
            var upComments = commentCheck(req.user._id,foundBucket);
            var currentUser = req.user._id
          } else{
            var upComments = [], currentUser = null;
          }
          return res.json({post: foundPost, upComments, buckets: foundBucket, index, currentUser, CA_50_profilePic});
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
      comments: {$elemMatch: {_id: req.params.comment_id, upvoteUserIds: {$ne: req.user._id}}}},
    {$push: {'comments.$.upvoteUserIds': req.user._id}, $inc: {'comments.$.upvotesCount': 1}},
    {fields: {comments: {$elemMatch: {_id: req.params.comment_id, upvoteUserIds: req.user._id}}}, new: true},
    function(err, notFoundComment){
    if(err){
      console.log(Date.now()+' : '+req.user._id+' => (comments-9)notFoundComment err:- '+JSON.stringify(err, null, 2));
      return res.sendStatus(500);
    } else{
      if(notFoundComment){
        res.json(notFoundComment);
      }else if(!notFoundComment){
        Comment.findOneAndUpdate({_id: req.params.bucket_id, 
          comments: {$elemMatch: {_id: req.params.comment_id, upvoteUserIds: req.user._id}}},
        {$pull: {'comments.$.upvoteUserIds': req.user._id}, $inc: {'comments.$.upvotesCount': -1}},
        {fields: {comments: {$elemMatch: {_id: req.params.comment_id, upvoteUserIds: {$ne: req.user._id}}}}, new: true},
        function(err, foundComment){
        if(err){
          console.log(Date.now()+' : '+req.user._id+' => (comments-10)foundComment err:- '+JSON.stringify(err, null, 2));
          return res.sendStatus(500);
        } else{
          res.json(foundComment);
        }
        });
      }
    }
    });
  }
}

function commentCheck(userId,bucket){
  if(userId){
    var upComments = [];
    for(var k=0;k<bucket.length;k++){
      for(var i=0;i<bucket[k].count;i++){
        for(var j=0;j<bucket[k].comments[i].upvotesCount;j++){
          if(bucket[k].comments[i].upvoteUserIds[j].equals(userId)){
            upComments.push(bucket[k].comments[i]._id);
          }
        }
      }
    }
    return upComments;
  } else{var upComments = []; return upComments;}
};