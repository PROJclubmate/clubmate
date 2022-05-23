const Post      = require('../models/post'),
  User          = require('../models/user'),
  Discussion    = require('../models/discussion'),
  clConfig      = require('../config/cloudinary'),
  s3Config      = require('../config/s3'),
  logger        = require('../logger');

if(process.env.ENVIRONMENT === 'dev'){
  var cdn_prefix = 'https://res.cloudinary.com/dubirhea4/';
} else if (process.env.ENVIRONMENT === 'prod'){
  var cdn_prefix = 'https://d367cfssgkev4p.cloudfront.net/';
}


module.exports = {
  discussionsNew(req, res, next){
    if((req.body.text && req.body.text != '') || (req.files && req.files != '')){
      Post.findById(req.params.post_id, async function(err, foundPost){
      if(err || !foundPost){
        logger.error(req.user._id+' : (discussions-1)foundPost err => '+err);
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        var multiImagesArr = [];
        if(req.files){
          try{
            multiImagesArr = [];
            // upload images
            for(var file of req.files){
              if(process.env.ENVIRONMENT === 'dev'){
                var result = await clConfig.cloudinary.v2.uploader.upload(file.path, clConfig.subPostImages_1080_obj);
                // add images to multiImagesArr array
                multiImagesArr.push({
                  image: result.secure_url,
                  imageId: result.public_id
                });
              } else if (process.env.ENVIRONMENT === 'prod'){
                var result = await s3Config.uploadFile(file, 'subPostImages/', 1080);
                s3Config.removeTmpUpload(file.path);
                // add images to multiImagesArr array
                multiImagesArr.push({
                  image: result.Location,
                  imageId: result.Key
                });
              }
            }
          } catch(err){
            logger.error(req.user._id+' : (discussions-2)imagesUpload err => '+err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }
        };
        Discussion.findOneAndUpdate({postId: foundPost._id, bucket: foundPost.subpostbucketNum},
        {$inc: {count: 1},
          $push: {subPosts: {subPostAuthor: {id: req.user._id, authorName: req.user.fullName},
          text: req.body.text, images: multiImagesArr, quoteNum: req.body.quoteNum, quoteText: req.body.quoteText}}
        }, {fields: {count:1} , upsert: true, new: true}, function(err, newSubPostBucket){
        if(err || !newSubPostBucket){
          logger.error(req.user._id+' : (discussions-3)newSubPostBucket err => '+err);
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
          req.flash('success', 'subPost added successfuly');
          return res.redirect('/clubs/'+req.params.club_id+'/posts/'+req.params.post_id);
        }
        });
      }
      });
    } else{
      req.flash('success', 'Please add some text or upload an image');
      return res.redirect('/clubs/'+req.params.club_id+'/posts/'+req.params.post_id);
    }
  },

  discussionsPagination(req, res, next){
    if(process.env.ENVIRONMENT === 'dev'){
      var CU_50_profilePic = clConfig.cloudinary.url(req.user.profilePicId, clConfig.thumb_100_obj);
    } else if (process.env.ENVIRONMENT === 'prod'){
      var CU_50_profilePic = s3Config.thumb_100_prefix+req.user.profilePicId;
    }
    Post.findById(req.params.post_id).populate({path: 'postClub', select: 'name avatar avatarId clubUsers'})
    .select({type:1, subpostBuckets: 1, postClub: 1, subpostsCount: 1})
    .exec(function (err, foundPost){
    if(err || !foundPost){
      logger.error('(discussions-4)foundPost err => '+err);
      return res.sendStatus(500);
    } else{
      if(foundPost.type == 'topic' && foundPost.subpostBuckets != ''){
        if(0 <= req.query.newIndex && req.query.newIndex < foundPost.subpostBuckets.length-1){
          var page = req.query.newIndex;
        } else{
          var page = foundPost.subpostBuckets.length-1;
        }
        Discussion.find({_id: foundPost.subpostBuckets[page]})
        .populate({path: 'subPosts.subPostAuthor.id', select: 'fullName profilePic profilePicId userKeys'})
        .exec(function(err, foundBucket){
        if(err || !foundBucket){
          logger.error('(discussions-5)foundBucket err => '+err);
          return res.sendStatus(500);
        } else{
          var sPA_50_profilePic = [];
          for(var j=0;j<foundBucket[0].subPosts.length;j++){
            if(process.env.ENVIRONMENT === 'dev'){
              sPA_50_profilePic[j] = clConfig.cloudinary.url(foundBucket[0].subPosts[j].subPostAuthor.id.profilePicId, clConfig.thumb_100_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              sPA_50_profilePic[j] = s3Config.thumb_100_prefix+foundBucket[0].subPosts[j].subPostAuthor.id.profilePicId;
            }
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
          res.json({post: foundPost, subVotes, bucket: foundBucket, index, rank, currentUser,
          clubId: req.params.club_id, CU_50_profilePic, sPA_50_profilePic, csrfToken: res.locals.csrfToken, cdn_prefix});
          return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
        }
        });
      } else{
        res.redirect('back');
      }
    }
    });
  },

  discussionsVote(req, res, next){
    if(req.body.subLike == 'like'){
      Discussion.findOneAndUpdate({_id: req.params.bucket_id, 
        subPosts: {$elemMatch: {_id: req.params.subpost_id, likeUserIds: req.user._id}}},
      {$pull: {'subPosts.$.likeUserIds': req.user._id}, $inc: {'subPosts.$.likeCount': -1}},
      {fields: {subPosts: {$elemMatch: {_id: req.params.subpost_id, likeUserIds: {$ne: req.user._id}}}}, new: true},
      function(err, foundClickId){
      if(err){
        logger.error(req.user._id+' : (discussions-6)foundClickId err => '+err);
        return res.sendStatus(500);
      } else{
        if(foundClickId){
          res.json({foundClickId, csrfToken: res.locals.csrfToken, cdn_prefix});
          return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
        }else if(!foundClickId){
          Discussion.findOneAndUpdate({_id: req.params.bucket_id, 
            subPosts: {$elemMatch: {_id: req.params.subpost_id, dislikeUserIds: req.user._id}}},
          {$pull: {'subPosts.$.dislikeUserIds': req.user._id}, $inc: {'subPosts.$.dislikeCount': -1}},
          {fields: {subPosts: {$elemMatch: {_id: req.params.subpost_id, dislikeUserIds: {$ne: req.user._id}}}}, new: true},
          function(err, foundSecondId){
          if(err){
            logger.error(req.user._id+' : (discussions-7)foundSecondId err => '+err);
            return res.sendStatus(500);
          } else{
            Discussion.findOneAndUpdate({_id: req.params.bucket_id, 
              subPosts: {$elemMatch: {_id: req.params.subpost_id, likeUserIds: {$ne: req.user._id}}}},
            {$push: {'subPosts.$.likeUserIds': req.user._id}, $inc: {'subPosts.$.likeCount': 1}},
            {fields: {subPosts: {$elemMatch: {_id: req.params.subpost_id, likeUserIds: req.user._id}}}, new: true},
            function(err, notFoundClickId){
            if(err){
              logger.error(req.user._id+' : (discussions-8)notFoundClickId err => '+err);
              return res.sendStatus(500);
            } else{
              res.json({foundClickId: notFoundClickId, csrfToken: res.locals.csrfToken, cdn_prefix});
              return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
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
        logger.error(req.user._id+' : (discussions-9)foundClickId err => '+err);
        return res.sendStatus(500);
      } else{
        if(foundClickId){
          res.json({foundClickId, csrfToken: res.locals.csrfToken, cdn_prefix});
          return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
        }else if(!foundClickId){
          Discussion.findOneAndUpdate({_id: req.params.bucket_id, 
            subPosts: {$elemMatch: {_id: req.params.subpost_id, likeUserIds: req.user._id}}},
          {$pull: {'subPosts.$.likeUserIds': req.user._id}, $inc: {'subPosts.$.likeCount': -1}},
          {fields: {subPosts: {$elemMatch: {_id: req.params.subpost_id, likeUserIds: {$ne: req.user._id}}}}, new: true},
          function(err, foundSecondId){
          if(err){
            logger.error(req.user._id+' : (discussions-10)foundSecondId err => '+err);
            return res.sendStatus(500);
          } else{
            Discussion.findOneAndUpdate({_id: req.params.bucket_id, 
              subPosts: {$elemMatch: {_id: req.params.subpost_id, dislikeUserIds: {$ne: req.user._id}}}},
            {$push: {'subPosts.$.dislikeUserIds': req.user._id}, $inc: {'subPosts.$.dislikeCount': 1}},
            {fields: {subPosts: {$elemMatch: {_id: req.params.subpost_id, dislikeUserIds: req.user._id}}}, new: true},
            function(err, notFoundClickId){
            if(err){
              logger.error(req.user._id+' : (discussions-11)notFoundClickId err => '+err);
              return res.sendStatus(500);
            } else{
              res.json({foundClickId: notFoundClickId, csrfToken: res.locals.csrfToken, cdn_prefix});
              return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
            }
            });
          }
          });
        }
      }
      });
    }
  }
};

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