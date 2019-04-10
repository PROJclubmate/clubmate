var express = require("express");
var router  = express.Router({mergeParams: true});
var Post = require("../models/post");
var Discussion = require("../models/discussion");
var middleware = require("../middleware");

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_ID, 
  api_secret: process.env.API_SECRET,
});

//SUBPOST CREATE
router.post("/clubs/:club_id/posts/:post_id/discussions", middleware.isLoggedIn, function(req, res){
  Post.findById(req.params.post_id, function(err, foundPost){
  if(err || !foundPost){
    console.log(req.user._id+' => (discussions-1)foundPost err:- '+JSON.stringify(err, null, 2));
    req.flash('error', 'Something went wrong :(');
    return res.redirect('back');
  } else{
    Discussion.findOneAndUpdate({postId: foundPost._id, bucket: foundPost.subpostbucketNum},
    {$inc: {count: 1},
      $push: {subPosts: {subPostAuthor: {id: req.user._id, authorName: req.user.fullName},
      text: req.body.text, quoteNum: req.body.quoteNum, quoteText: req.body.quoteText}}
    }, {fields: {count:1} , upsert: true, new: true}, function(err, newSubPostBucket){
    if(err || !newSubPostBucket){
      console.log(req.user._id+' => (discussions-2)newSubPostBucket err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      if(newSubPostBucket.count == 1){
        foundPost.subpostBuckets.push(newSubPostBucket._id);
        foundPost.subpostsCount += 1;
        foundPost.save();
      } else if(newSubPostBucket.count >= 20){
        foundPost.subpostbucketNum += 1;
        foundPost.subpostsCount += 1;
        foundPost.save();
      } else{
        foundPost.subpostsCount += 1;
        foundPost.save();
      }
      req.flash('success', 'Discussion subPost added successfuly');
      return res.redirect('/clubs/'+req.params.club_id+'/posts/'+req.params.post_id);
    }
    });
  }
  });
});

// PAGINATION
router.get('/clubs/:club_id/posts/:post_id/m-sP', middleware.isLoggedIn, function(req, res){
  var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
  {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
  Post.findById(req.params.post_id).populate({path: 'postClub', select: 'name avatar avatarId clubUsers'})
  .select({topic: 1, subpostBuckets: 1, postClub: 1, subpostsCount: 1})
  .exec(function (err, foundPost){
  if(err || !foundPost){
    console.log('(discussions-3)foundPost err:- '+JSON.stringify(err, null, 2));
    req.flash('error', 'Something went wrong :(');
    return res.redirect('back');
  } else{
    if(foundPost.topic != '' && foundPost.subpostBuckets != ''){
      if(0 <= req.query.newIndex && req.query.newIndex < foundPost.subpostBuckets.length-1){
        var page = req.query.newIndex;
      } else{
        var page = foundPost.subpostBuckets.length-1;
      }
      Discussion.find({_id: foundPost.subpostBuckets[page]})
      .populate({path: 'subPosts.subPostAuthor.id', select: 'fullName profilePic profilePicId'})
      .exec(function(err, foundBucket){
      if(err || !foundBucket){
        console.log('(discussions-4)foundBucket err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        var sPA_50_profilePic = [];
        for(var j=0;j<foundBucket[0].subPosts.length;j++){
          sPA_50_profilePic[j] = cloudinary.url(foundBucket[0].subPosts[j].subPostAuthor.id.profilePicId,
          {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
        }
        var currentUser = req.user, index = page;
        if(req.user && foundBucket != ''){
          for(var i=0;i<req.user.userClubs.length;i++){
            if(req.user.userClubs[i].id.equals(req.params.club_id)){
              var rank = req.user.userClubs[i].rank;
              break;
            }
          }
          var subVotes = subVoteCheck(req.user._id,foundBucket[0]);
        } else{
          var subVotes = [];
        }
        res.json({post: foundPost, subVotes: subVotes, bucket: foundBucket, index: index, rank: rank,
        currentUser: currentUser, clubId: req.params.club_id, CU_50_profilePic: CU_50_profilePic,
        sPA_50_profilePic: sPA_50_profilePic});
      }
      });
    } else{
      res.redirect('back');
    }
  }
  });
});

//SubPosts Vote route
router.put('/subposts/:bucket_id/:subpost_id/vote', middleware.isLoggedIn, function(req, res){
  if(req.body.subLike == 'like'){
    Discussion.findOneAndUpdate({_id: req.params.bucket_id, 
      subPosts: {$elemMatch: {_id: req.params.subpost_id, likeUserIds: req.user._id}}},
    {$pull: {'subPosts.$.likeUserIds': req.user._id}, $inc: {'subPosts.$.likeCount': -1}},
    {fields: {subPosts: {$elemMatch: {_id: req.params.subpost_id, likeUserIds: {$ne: req.user._id}}}}, new: true},
    function(err, foundClickId){
    if(err){
      console.log(req.user._id+' => (discussions-5)foundClickId err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      if(foundClickId){
        return res.json(foundClickId);
      }else if(!foundClickId){
        Discussion.findOneAndUpdate({_id: req.params.bucket_id, 
          subPosts: {$elemMatch: {_id: req.params.subpost_id, dislikeUserIds: req.user._id}}},
        {$pull: {'subPosts.$.dislikeUserIds': req.user._id}, $inc: {'subPosts.$.dislikeCount': -1}},
        {fields: {subPosts: {$elemMatch: {_id: req.params.subpost_id, dislikeUserIds: {$ne: req.user._id}}}}, new: true},
        function(err, foundSecondId){
        if(err){
          console.log(req.user._id+' => (discussions-6)foundSecondId err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          Discussion.findOneAndUpdate({_id: req.params.bucket_id, 
            subPosts: {$elemMatch: {_id: req.params.subpost_id, likeUserIds: {$ne: req.user._id}}}},
          {$push: {'subPosts.$.likeUserIds': req.user._id}, $inc: {'subPosts.$.likeCount': 1}},
          {fields: {subPosts: {$elemMatch: {_id: req.params.subpost_id, likeUserIds: req.user._id}}}, new: true},
          function(err, notFoundClickId){
          if(err){
            console.log(req.user._id+' => (discussions-7)notFoundClickId err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          } else{
            return res.json(notFoundClickId);
          }
          });
        }
        });
      }
    }
    });
  } else if(req.body.subDislike == 'dislike'){
    Discussion.findOneAndUpdate({_id: req.params.bucket_id, 
      subPosts: {$elemMatch: {_id: req.params.subpost_id, dislikeUserIds: req.user._id}}},
    {$pull: {'subPosts.$.dislikeUserIds': req.user._id}, $inc: {'subPosts.$.dislikeCount': -1}},
    {fields: {subPosts: {$elemMatch: {_id: req.params.subpost_id, dislikeUserIds: {$ne: req.user._id}}}}, new: true},
    function(err, foundClickId){
    if(err){
      console.log(req.user._id+' => (discussions-8)foundClickId err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      if(foundClickId){
        return res.json(foundClickId);
      }else if(!foundClickId){
        Discussion.findOneAndUpdate({_id: req.params.bucket_id, 
          subPosts: {$elemMatch: {_id: req.params.subpost_id, likeUserIds: req.user._id}}},
        {$pull: {'subPosts.$.likeUserIds': req.user._id}, $inc: {'subPosts.$.likeCount': -1}},
        {fields: {subPosts: {$elemMatch: {_id: req.params.subpost_id, likeUserIds: {$ne: req.user._id}}}}, new: true},
        function(err, foundSecondId){
        if(err){
          console.log(req.user._id+' => (discussions-9)foundSecondId err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          Discussion.findOneAndUpdate({_id: req.params.bucket_id, 
            subPosts: {$elemMatch: {_id: req.params.subpost_id, dislikeUserIds: {$ne: req.user._id}}}},
          {$push: {'subPosts.$.dislikeUserIds': req.user._id}, $inc: {'subPosts.$.dislikeCount': 1}},
          {fields: {subPosts: {$elemMatch: {_id: req.params.subpost_id, dislikeUserIds: req.user._id}}}, new: true},
          function(err, notFoundClickId){
          if(err){
            console.log(req.user._id+' => (discussions-10)notFoundClickId err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          } else{
            return res.json(notFoundClickId);
          }
          });
        }
        });
      }
    }
    });
  }
});

function subVoteCheck(userId,bucket){
  if(userId){
    var subLikes = [], subDislikes = [], subVotes = {};
    for(var j=0;j<bucket.count;j++){
      for(var k=0;k<bucket.subPosts[j].likeCount;k++){
        if(bucket.subPosts[j].likeUserIds[k].equals(userId)){
          subLikes.push(bucket.subPosts[j]._id);
        }
      }
      for(var l=0;l<bucket.subPosts[j].dislikeCount;l++){
        if(bucket.subPosts[j].dislikeUserIds[l].equals(userId)){
          subDislikes.push(bucket.subPosts[j]._id);
        }
      }
    }
    subVotes['subLikes'] = subLikes;
    subVotes['subDislikes'] = subDislikes;
    return subVotes;
  } else{
    var subLikes = [], subDislikes = [], subVotes = {};
    subVotes['subLikes'] = subLikes;
    subVotes['subDislikes'] = subDislikes;
    return subVotes;
  }
};

// // Redirect ajax refresh pages
// router.get('/clubs/:club_id/posts/:post_id/m-sP/:page', function(req, res){
//   res.redirect('/clubs/'+req.params.club_id+'/posts/'+req.params.post_id);
// });

module.exports = router;
