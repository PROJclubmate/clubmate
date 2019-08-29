const express          = require('express'),
  router               = express.Router(),
  Post                 = require('../models/post'),
  User                 = require('../models/user'),
  Club                 = require('../models/club'),
  Comment              = require('../models/comment'),
  Discussion           = require('../models/discussion'),
  {cloudinary, upload} = require('../public/js/cloudinary.js');

module.exports = {
  postsHome(req, res, next){
    if(req.user){
      var userClubIds = req.user.userClubs.map(function(club){
        return club.id;
      });
      Post.find({postClub: {$in: userClubIds}})
      .populate({path: 'postClub', select: 'name avatar avatarId'})
      .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
      .sort({createdAt: -1}).limit(10)
      .exec(function(err, homePosts){
      if(err || !homePosts){
        console.log(req.user._id+' => (posts-1)homePosts err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        var friendsPostUrl = false;
        var foundPostIds = homePosts.map(function(post){
          return post._id;
        });
        var posts = postPrivacy(homePosts, req.user);
        var modPosts = postModeration(posts,req.user);
        sortComments(modPosts);
        var hasVote = [], hasModVote = [], PC_50_clubAvatar = []; var k=0; var len = modPosts.length;
        for(k;k<len;k++){
          PC_50_clubAvatar[k] = cloudinary.url(modPosts[k].postClub.avatarId,
          {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
          hasVote[k] = voteCheck(req.user,modPosts[k]);
          hasModVote[k] = modVoteCheck(req.user,modPosts[k]);
        }
        var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
        {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
        res.render('posts/index',{hasVote, hasModVote, posts: modPosts, friendsPostUrl, foundPostIds,
        CU_50_profilePic, PC_50_clubAvatar});
      }
      });
      // res.render('posts/index');
    } else{
      res.redirect('/discover');
    }
  },

  postsHomeMorePosts(req, res, next){
    if(req.user){
      var userClubIds = req.user.userClubs.map(function(club){
        return club.id;
      });
      if(req.query.ids.split(',') != ''){
        var seenIds = req.query.ids.split(',');
      } else{
        var seenIds = [];
      }
      Post.find({postClub: {$in: userClubIds}, _id: {$nin: seenIds}})
      .populate({path: 'postClub', select: 'name avatar avatarId'})
      .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
      .sort({createdAt: -1}).limit(10)
      .exec(function(err, homePosts){
      if(err || !homePosts){
        console.log(req.user._id+' => (posts-2)homePosts err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
        // return res.sendStatus(500);
      } else{
        var arrLength = homePosts.length;
        var friendsPostUrl = false; var currentUser2 = req.user;
        var foundPostIds = homePosts.map(function(post){
          return post._id;
        });
        var posts = postPrivacy(homePosts, req.user);
        var modPosts = postModeration(posts,req.user);
        sortComments(modPosts);
        var hasVote = [], hasModVote = [], PC_50_clubAvatar = []; var k=0; var len = modPosts.length;
        for(k;k<len;k++){
          PC_50_clubAvatar[k] = cloudinary.url(modPosts[k].postClub.avatarId,
          {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
          hasVote[k] = voteCheck(req.user,modPosts[k]);
          hasModVote[k] = modVoteCheck(req.user,modPosts[k]);
        }
        var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
        {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
        res.json({hasVote, hasModVote, posts: modPosts, friendsPostUrl, currentUser: currentUser2,
        foundPostIds, CU_50_profilePic, PC_50_clubAvatar, arrLength});
      }
      });
    } else{
      res.redirect('/discover');
    }
  },

  postsFriends_posts(req, res, next){
    if(req.user){
      Post.find({'postAuthor.id': {$in: req.user.friends}})
      .populate({path: 'postAuthor.id', select: 'fullName profilePic profilePicId'})
      .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
      .sort({createdAt: -1}).limit(10)
      .exec(function(err, friendsPosts){
      if(err || !friendsPosts){
        console.log(req.user._id+' => (posts-3)friendsPosts err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        var friendsPostUrl = true;
        var foundPostIds = friendsPosts.map(function(post){
          return post._id;
        });
        var posts = postPrivacy(friendsPosts, req.user);
        var modPosts = postModeration(posts,req.user);
        sortComments(modPosts);
        var hasVote = [], hasModVote = [], PA_50_profilePic = []; var k=0; var len = modPosts.length;
        for(k;k<len;k++){
          PA_50_profilePic[k] = cloudinary.url(modPosts[k].postAuthor.id.profilePicId,
          {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
          hasVote[k] = voteCheck(req.user,modPosts[k]);
          hasModVote[k] = modVoteCheck(req.user,modPosts[k]);
        }
        var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
        {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
        res.render('posts/index',{hasVote, hasModVote, posts: modPosts, friendsPostUrl, foundPostIds,
        CU_50_profilePic, PA_50_profilePic});
      }
      });
    } else{
      res.redirect('/discover');
    }
  },

  postsFriends_postsMorePosts(req, res, next){
    if(req.user){
      if(req.query.ids != ''){
        var seenIds = req.query.ids.split(',');
      } else{
        var seenIds = [];
      }
      Post.find({'postAuthor.id': {$in: req.user.friends}, _id: {$nin: seenIds}})
      .populate({path: 'postAuthor.id', select: 'fullName profilePic profilePicId'})
      .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
      .sort({createdAt: -1}).limit(10)
      .exec(function(err, friendsPosts){
      if(err || !friendsPosts){
        console.log(req.user._id+' => (posts-4)friendsPosts err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        var arrLength = friendsPosts.length;
        var friendsPostUrl = true; var currentUser2 = req.user;
        var foundPostIds = friendsPosts.map(function(post){
          return post._id;
        });
        var posts = postPrivacy(friendsPosts, req.user);
        var modPosts = postModeration(posts,req.user);
        sortComments(modPosts);
        var hasVote = [], hasModVote = [], PA_50_profilePic = []; var k=0; var len = modPosts.length;
        for(k;k<len;k++){
          PA_50_profilePic[k] = cloudinary.url(modPosts[k].postAuthor.id.profilePicId,
          {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
          hasVote[k] = voteCheck(req.user,modPosts[k]);
          hasModVote[k] = modVoteCheck(req.user,modPosts[k]);
        }
        var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
        {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
        res.json({hasVote, hasModVote, posts: modPosts, friendsPostUrl, currentUser: currentUser2, foundPostIds,
        CU_50_profilePic, PA_50_profilePic, arrLength});
      }
      });
    } else{
      res.redirect('/discover');
    }
  },

  postsDiscover(req, res, next){
    if(req.user){
      Post.find({privacy: 0, moderation: 0})
      .populate({path: 'postClub', select: 'name avatar avatarId'})
      .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
      .sort({createdAt: -1}).limit(10)
      .exec(function(err, discoverPosts){
      if(err || !discoverPosts){
        console.log(req.user._id+' => (posts-5)discoverPosts err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        var friendsPostUrl = false;
        var foundPostIds = discoverPosts.map(function(post){
          return post._id;
        });
        sortComments(discoverPosts);
        var hasVote = [], hasModVote = [], PC_50_clubAvatar = []; var k=0; var len = discoverPosts.length;
        for(k;k<len;k++){
          PC_50_clubAvatar[k] = cloudinary.url(discoverPosts[k].postClub.avatarId,
          {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
          hasVote[k] = voteCheck(req.user,discoverPosts[k]);
          hasModVote[k] = modVoteCheck(req.user,discoverPosts[k]);
        }
        var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
        {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
        res.render('posts/index',{hasVote, hasModVote, posts: discoverPosts, friendsPostUrl, foundPostIds,
        CU_50_profilePic, PC_50_clubAvatar});
      }
      });
    } else{
      // posts made today where likes are great
      Post.find({privacy: 0, moderation: 0})
      .populate({path: 'postClub', select: 'name avatar avatarId'})
      .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
      .sort({createdAt: -1}).limit(10)
      .exec(function(err, discoverPosts){
      if(err || !discoverPosts){
        console.log('(posts-6)discoverPosts err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        var friendsPostUrl = false;
        var foundPostIds = discoverPosts.map(function(post){
          return post._id;
        });
        sortComments(discoverPosts);
        var hasVote = [], hasModVote = [], PC_50_clubAvatar = []; var k=0; var len = discoverPosts.length;
        for(k;k<len;k++){
          PC_50_clubAvatar[k] = cloudinary.url(discoverPosts[k].postClub.avatarId,
          {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
          hasVote[k] = voteCheck(req.user,discoverPosts[k]);
          hasModVote[k] = modVoteCheck(req.user,discoverPosts[k]);
        }
        res.render('posts/index',{hasVote, hasModVote, posts: discoverPosts, friendsPostUrl, foundPostIds,
        PC_50_clubAvatar});
      }
      });
    }
  },

  postsDiscoverMorePosts(req, res, next){
    if(req.query.ids != ''){
      var seenIds = req.query.ids.split(',');
    } else{
      var seenIds = [];
    }
    if(req.user){
      Post.find({privacy: 0, moderation: 0, _id: {$nin: seenIds}})
      .populate({path: 'postClub', select: 'name avatar avatarId'})
      .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
      .sort({createdAt: -1}).limit(10)
      .exec(function(err, discoverPosts){
      if(err || !discoverPosts){
        console.log(req.user._id+' => (posts-7)discoverPosts err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        var arrLength = discoverPosts.length;
        var friendsPostUrl = false; var currentUser2 = req.user;
        var foundPostIds = discoverPosts.map(function(post){
          return post._id;
        });
        sortComments(discoverPosts);
        var hasVote = [], hasModVote = [], PC_50_clubAvatar = []; var k=0; var len = discoverPosts.length;
        for(k;k<len;k++){
          PC_50_clubAvatar[k] = cloudinary.url(discoverPosts[k].postClub.avatarId,
          {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
          hasVote[k] = voteCheck(req.user,discoverPosts[k]);
          hasModVote[k] = modVoteCheck(req.user,discoverPosts[k]);
        }
        var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
        {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
        res.json({hasVote, hasModVote, posts: discoverPosts, friendsPostUrl, currentUser: currentUser2,
        foundPostIds, CU_50_profilePic, PC_50_clubAvatar, arrLength});
      }
      });
    } else{
      Post.find({privacy: 0, moderation: 0, _id: {$nin: seenIds}})
      .populate({path: 'postClub', select: 'name avatar avatarId'})
      .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
      .sort({createdAt: -1}).limit(10)
      .exec(function(err, discoverPosts){
      if(err || !discoverPosts){
        console.log('(posts-8)discoverPosts err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        var arrLength = discoverPosts.length;
        var friendsPostUrl = false;
        var foundPostIds = discoverPosts.map(function(post){
          return post._id;
        });
        sortComments(discoverPosts);
        var hasVote = [], hasModVote = [], PC_50_clubAvatar = []; var k=0; var len = discoverPosts.length;
        for(k;k<len;k++){
          PC_50_clubAvatar[k] = cloudinary.url(discoverPosts[k].postClub.avatarId,
          {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
          hasVote[k] = voteCheck(req.user,discoverPosts[k]);
          hasModVote[k] = modVoteCheck(req.user,discoverPosts[k]);
        }
        res.json({hasVote, hasModVote, posts: discoverPosts, friendsPostUrl, foundPostIds, PC_50_clubAvatar,
        arrLength});
      }
      });
    }
  },

  postsCreate(req, res, next){
    var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
    {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
    if(req.file){
      if(req.body.privacy){
        cloudinary.v2.uploader.upload(req.file.path,
        {folder: 'postImages/', use_filename: true, width: 1024, height: 768, crop: 'limit'},
        function(err, result){
        if(err){
          console.log(req.user._id+' => (posts-9)imageUpload err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          req.body.image = result.secure_url;
          req.body.imageId = result.public_id;
          req.body.moderation = 1;
          Post.create(req.body, function(err, newPost){
          if(err || !newPost){
            console.log(req.user._id+' => (posts-10)newPost err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          } else{
            newPost.postClub = req.params.club_id;
            newPost.postAuthor.id = req.user._id;
            newPost.postAuthor.authorName = req.user.fullName;
            newPost.save(function(err, newPost){
            if(err || !newPost){
              console.log(req.user._id+' => (posts-11)newPost err:- '+JSON.stringify(err, null, 2));
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            } else{
              res.redirect('/clubs/'+req.params.club_id+'/posts/'+newPost._id);
            }
            });
          }
          });
        }
        });
      } else{
        req.flash('error', 'Please enter a valid post privacy setting.');
        return res.redirect('back');
      }
    } else{
      if(req.body.privacy){
        req.body.moderation = 1;
        Post.create(req.body, function(err, newPost){
        if(err || !newPost){
          console.log(req.user._id+' => (posts-12)newPost err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          newPost.postClub = req.params.club_id;
          newPost.postAuthor.id = req.user._id;
          newPost.postAuthor.authorName = req.user.fullName;
          newPost.save(function(err, newPost){
          if(err || !newPost){
            console.log(req.user._id+' => (posts-13)newPost err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          } else{
            res.redirect('/clubs/'+req.params.club_id+'/posts/'+newPost._id);
          }
          });
        }
        });
      } else{
        req.flash('error', 'Please enter a valid post privacy setting.');
        return res.redirect('back');
      }
    }
  },

  postsShow(req, res, next){
    Post.findById(req.params.post_id).populate({path: 'postClub', select: 'name avatar avatarId clubUsers'})
    .exec(function (err, foundPost){
    if(err || !foundPost){
      console.log('(posts-14)foundPost err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var PC_50_clubAvatar = cloudinary.url(foundPost.postClub.avatarId,
      {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
      var hasVote = voteCheck(req.user,foundPost);
      var hasModVote = modVoteCheck(req.user,foundPost);
      if(req.user){
        for(var i=0;i<req.user.userClubs.length;i++){
          if(req.user.userClubs[i].id.equals(req.params.club_id)){
            var rank = req.user.userClubs[i].rank;
            break;
          }
        }
      }
      if(foundPost.topic == '' && foundPost.commentBuckets != ''){
        var lastTwoBuckets = [], len = foundPost.commentBuckets.length;
        lastTwoBuckets.push(foundPost.commentBuckets[len-1]);
        lastTwoBuckets.push(foundPost.commentBuckets[len-2]);
        Comment.find({_id: {$in: lastTwoBuckets}})
        .populate({path: 'comments.commentAuthor.id', select: 'fullName profilePic profilePicId'})
        .exec(function(err, foundBuckets){
        if(err || !foundBuckets){
          console.log('(posts-15)foundBuckets err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          var CA_50_profilePic = [], numBuckets = foundBuckets.length;
          for(var i=0;i<numBuckets;i++){
            CA_50_profilePic[i] = [];
            for(var j=0;j<foundBuckets[i].comments.length;j++){
              CA_50_profilePic[i][j] = cloudinary.url(foundBuckets[i].comments[j].commentAuthor.id.profilePicId,
              {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
            }
          }
          var index = len-3;
          if(req.user){
            var upComments = commentCheck(req.user._id,foundBuckets);
            var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
            {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
          } else{
            var upComments = [];
            var CU_50_profilePic = null;
          }
          res.render("posts/show", {hasVote, hasModVote, post: foundPost, upComments, rank, buckets: foundBuckets,
          index, CU_50_profilePic, PC_50_clubAvatar, CA_50_profilePic});
        }
        });
      } else if(foundPost.topic != '' && req.user){
        var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
        {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
        if(foundPost.subpostBuckets != ''){
          var len = index = foundPost.subpostBuckets.length;
          Discussion.findOne({_id: foundPost.subpostBuckets[len-1]})
          .populate({path: 'subPosts.subPostAuthor.id', select: 'fullName profilePic profilePicId'})
          .exec(function(err, foundBucket){
          if(err || !foundBucket){
            console.log('(posts-16)foundBucket err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          } else{
            var sPA_50_profilePic = [];
            for(var j=0;j<foundBucket.subPosts.length;j++){
              sPA_50_profilePic[j] = cloudinary.url(foundBucket.subPosts[j].subPostAuthor.id.profilePicId,
              {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
            }
            // Push conversationId to clubUsers
            // If conversationId == null then find
            Club.findById(req.params.club_id).select({conversationId: 1})
            .exec(function(err, foundClub){
            if(err || !foundClub){
              console.log('(posts-17)foundClub err:- '+JSON.stringify(err, null, 2));
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            } else{
              var subVotes = subVoteCheck(req.user._id,foundBucket);
              var conversationId = '', convClubId = '', quote = false;
              if(foundClub.conversationId){
                var conversationId = foundClub.conversationId;
              } else{var convClubId = foundClub._id;}
              res.render("posts/show", {hasVote, hasModVote, post: foundPost, subVotes, rank, bucket: foundBucket,
              conversationId, convClubId, index, clubId: foundClub._id, CU_50_profilePic, PC_50_clubAvatar,
              sPA_50_profilePic, quote});
            }
            });
          }
          });
        } else{
          Club.findById(req.params.club_id).select({conversationId: 1})
          .exec(function(err, foundClub){
          if(err || !foundClub){
            console.log('(posts-18)foundClub err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          } else{
            var conversationId = '', convClubId = '', quote = false;
            if(foundClub.conversationId){
              var conversationId = foundClub.conversationId;
            } else{var convClubId = foundClub._id;}
            res.render("posts/show", {hasVote, hasModVote, post: foundPost, rank, conversationId, convClubId,
            clubId: foundClub._id, CU_50_profilePic, PC_50_clubAvatar, quote});
          }
          });
        }
      } else{
        if(req.user){
          var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
          {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
        }
        var index = null;
        res.render("posts/show", {hasVote, hasModVote, post: foundPost, rank, index, PC_50_clubAvatar,
        CU_50_profilePic});
      }
    }
    });
  },

  postsQuote(req, res, next){
    if(req.query.quote){
      Post.findById(req.params.post_id).populate({path: 'postClub', select: 'name avatar avatarId clubUsers'})
      .exec(function (err, foundPost){
      if(err || !foundPost){
        console.log('(posts-19)foundPost err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        var PC_50_clubAvatar = cloudinary.url(foundPost.postClub.avatarId,
        {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
        var hasVote = voteCheck(req.user,foundPost);
        var hasModVote = modVoteCheck(req.user,foundPost);
        if(req.user){
          for(var i=0;i<req.user.userClubs.length;i++){
            if(req.user.userClubs[i].id.equals(req.params.club_id)){
              var rank = req.user.userClubs[i].rank;
              break;
            }
          }
        }
        if(foundPost.topic != '' && req.user){
          var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
          {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
          if(foundPost.subpostBuckets != ''){
            var len = index = foundPost.subpostBuckets.length;
            Discussion.findOne({_id: foundPost.subpostBuckets[len-1]})
            .populate({path: 'subPosts.subPostAuthor.id', select: 'fullName profilePic profilePicId'})
            .exec(function(err, foundBucket){
            if(err || !foundBucket){
              console.log('(posts-20)foundBucket err:- '+JSON.stringify(err, null, 2));
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            } else{
              var sPA_50_profilePic = [];
              for(var j=0;j<foundBucket.subPosts.length;j++){
                sPA_50_profilePic[j] = cloudinary.url(foundBucket.subPosts[j].subPostAuthor.id.profilePicId,
                {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
              }
              var subVotes = subVoteCheck(req.user._id,foundBucket);
              Discussion.findOne({_id: req.params.bucket_id}, function(err, foundQuoteBucket){
              if(err || !foundQuoteBucket){
                console.log('(posts-21)foundQuoteBucket err:- '+JSON.stringify(err, null, 2));
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              } else{
                var quoteText, quoteNum, quote; quote = true;
                for(i=0;i<foundQuoteBucket.subPosts.length;i++){
                  if(foundQuoteBucket.subPosts[i]._id.equals(req.query.quote)){
                    quoteText = foundQuoteBucket.subPosts[i].text;
                    quoteNum = (i+1)+(20)*(foundQuoteBucket.bucket-1);
                    break;
                  }
                }
                res.render("posts/show", {hasVote, hasModVote, post: foundPost, subVotes, rank, bucket: foundBucket,
                index, clubId: req.params.club_id, CU_50_profilePic, PC_50_clubAvatar, sPA_50_profilePic,
                quoteText, quoteNum, quote});
              }
              });
            }
            });
          }
        }
      }
      });
    }
  },

  postsUpdate(req, res, next){
    Post.findById(req.params.post_id, function (err, foundPost){
    if(err || !foundPost){
      console.log(req.user._id+' => (posts-22)foundPost err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      if(foundPost.description.localeCompare(req.body.description) != 0){
        var editobj = {};
        editobj['desc'] = foundPost.description;
        foundPost.descEdit.push(editobj);
        foundPost.description = req.body.description;
      };
      foundPost.privacy = req.body.privacy;
      var hasVote = voteCheck(req.user,foundPost);
      var hasModVote = modVoteCheck(req.user,foundPost);
      var upComments = commentCheck(req.user,foundPost);
      var subVotes = subVoteCheck(req.user,foundPost);
      foundPost.save();
      for(var i=0;i<req.user.userClubs.length;i++){
        if(req.user.userClubs[i].id.equals(req.params.club_id)){
          var rank = req.user.userClubs[i].rank;
          break;
        }
      }
      res.redirect('/clubs/'+req.params.club_id+'/posts/'+req.params.post_id);
    }
    });
  },

  postsDelete(req, res, next){
    // console.log('HAHAHAHAH'+JSON.stringify(req.params.post_id, null, 2));
    Post.findById(req.params.post_id, async function(err, foundPost){
    if(err || !foundPost){
      console.log(req.user._id+' => (posts-23)foundPost err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      if(foundPost.image && foundPost.imageId){
        try{
          await cloudinary.v2.uploader.destroy(foundPost.imageId);
          foundPost.remove();
          //deletes all comments associated with the post
          Comment.deleteMany({postId: foundPost._id}, function(err){
            if(err){
              console.log(req.user._id+' => (posts-24)foundPost err:- '+JSON.stringify(err, null, 2));
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          });
          Discussion.deleteMany({postId: foundPost._id}, function(err){
            if(err){
              console.log(req.user._id+' => (posts-25)foundPost err:- '+JSON.stringify(err, null, 2));
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          });
          req.flash('success', 'Post deleted successfully!');
          res.redirect('back');
        }catch(err){
          console.log('(posts-26)foundPost catch err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }
      } else{
        foundPost.remove();
        //deletes all comments associated with the post
        Comment.deleteMany({postId: foundPost._id}, function(err){
          if(err){
            console.log(req.user._id+' => (posts-27)foundPost err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }
        });
        Discussion.deleteMany({postId: foundPost._id}, function(err){
          if(err){
            console.log(req.user._id+' => (posts-28)foundPost err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }
        });
        req.flash('success', 'Post deleted successfully!');
        res.redirect('back');
      }
    }
    });
  },

  postsVote(req, res, next){
    Post.findById(req.params.post_id, function(err, foundPost){
    if(err || !foundPost){
      console.log(req.user._id+' => (posts-29)foundPost err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      if(req.body.visibility){
        foundPost.moderation = parseInt(req.body.visibility);
        foundPost.save();
        res.json(foundPost);
      }
      if(req.body.exclusive){
        foundPost.moderation = parseInt(req.body.exclusive);
        foundPost.save();
        res.json(foundPost);
      }
      if(req.body.published){
        foundPost.moderation = parseInt(req.body.published);
        foundPost.save();
        res.json(foundPost);
      }
      var i, j, k; var clickIdFound = false, secondIdFound = false, thirdIdFound = false;
      var likeIds = foundPost.likeUserIds; var len1 = foundPost.likeCount;
      var dislikeIds = foundPost.dislikeUserIds; var len2 = foundPost.dislikeCount;
      var heartIds = foundPost.heartUserIds; var len3 = foundPost.heartCount;
      // Like button
      if(req.body.like == 'like'){
        for(i=len1-1;i>=0;i--){
          if(likeIds[i].equals(req.user._id)){
            likeIds.splice(i,1);
            foundPost.likeCount -= 1;
            clickIdFound = true;
            break;
          }
        }
        if(clickIdFound == false){
          for(j=len2-1;j>=0;j--){
            if(dislikeIds[j].equals(req.user._id)){
              dislikeIds.splice(j,1);
              foundPost.dislikeCount -= 1;
              secondIdFound = true;
              break;
            }
          }
        }
        if(clickIdFound == false && secondIdFound == false){
          for(k=len3-1;k>=0;k--){
            if(heartIds[k].equals(req.user._id)){
              heartIds.splice(k,1);
              foundPost.heartCount -= 1;
              thirdIdFound = true;
              break;
            }
          }
          if(thirdIdFound == true){
            User.updateOne({_id: req.user._id},{$pull: {postHearts: foundPost._id}}, function(err, foundUser){
              if(err || !foundUser){
                console.log(req.user._id+' => (posts-30)foundUser err:- '+JSON.stringify(err, null, 2));
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }
            });
          }
        }
        if(clickIdFound == false){
          likeIds.push(req.user._id);
          foundPost.likeCount += 1;
        }
        foundPost.save();
        res.json(foundPost);
      }
      // Dislike button
      else if(req.body.dislike == 'dislike'){
        for(j=len2-1;j>=0;j--){
          if(dislikeIds[j].equals(req.user._id)){
            dislikeIds.splice(j,1);
            foundPost.dislikeCount -=1;
            clickIdFound = true;
            break;                   
          }
        }
        if(clickIdFound == false){
          for(i=len1-1;i>=0;i--){
            if(likeIds[i].equals(req.user._id)){
              likeIds.splice(i,1);
              foundPost.likeCount -= 1;
              secondIdFound = true;
              break;
            }
          }
        }
        if(clickIdFound == false && secondIdFound == false){
          for(k=len3-1;k>=0;k--){
            if(heartIds[k].equals(req.user._id)){
              heartIds.splice(k,1);
              foundPost.heartCount -= 1;
              thirdIdFound = true;
              break;
            }
          }
          if(thirdIdFound == true){
            User.updateOne({_id: req.user._id},{$pull: {postHearts: foundPost._id}}, function(err, foundUser){
              if(err || !foundUser){
                console.log(req.user._id+' => (posts-31)foundUser err:- '+JSON.stringify(err, null, 2));
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }
            });
          }
        }
        if(clickIdFound == false){
          dislikeIds.push(req.user._id);
          foundPost.dislikeCount +=1;
        }
        foundPost.save();
        res.json(foundPost);
      }
      // Heart button
      else if(req.body.heart == 'heart'){
        for(k=len3-1;k>=0;k--){
          if(heartIds[k].equals(req.user._id)){
            heartIds.splice(k,1);
            foundPost.heartCount -=1;
            clickIdFound = true;
            break;                   
          }
        }
        if(clickIdFound == true){
          User.updateOne({_id: req.user._id},{$pull: {postHearts: foundPost._id}}, function(err, foundUser){
            if(err || !foundUser){
              console.log(req.user._id+' => (posts-32)foundUser err:- '+JSON.stringify(err, null, 2));
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          });
        }
        if(clickIdFound == false){
          for(i=len1-1;i>=0;i--){
            if(likeIds[i].equals(req.user._id)){
              likeIds.splice(i,1);
              foundPost.likeCount -= 1;
              secondIdFound = true;
              break;
            }
          }
        }
        if(clickIdFound == false && secondIdFound == false){
          for(j=len2-1;j>=0;j--){
            if(dislikeIds[j].equals(req.user._id)){
              dislikeIds.splice(j,1);
              foundPost.dislikeCount -= 1;
              thirdIdFound = true;
              break;
            }
          }
        }
        if(clickIdFound == false){
          heartIds.push(req.user._id);
          foundPost.heartCount +=1;
          User.updateOne({_id: req.user._id},{$push: {postHearts: foundPost._id}}, function(err, foundUser){
            if(err || !foundUser){
              console.log(req.user._id+' => (posts-33)foundUser err:- '+JSON.stringify(err, null, 2));
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          });
        }
        foundPost.save();
        res.json(foundPost);
      }
    }
    });
  },

  postsModVote(req, res, next){
    Post.findById(req.params.post_id, function(err, foundPost){
    if(err || !foundPost){
      console.log(req.user._id+' => (posts-34)foundPost err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var i, j; var clickIdFound = false, secondIdFound = false;
      var upVoteIds = foundPost.upVoteUserIds; var len1 = foundPost.upVoteCount;
      var downVoteIds = foundPost.downVoteUserIds; var len2 = foundPost.downVoteCount;
      // upVote button
      if(req.body.upVote == 'up'){
        for(i=len1-1;i>=0;i--){
          if(upVoteIds[i].equals(req.user._id)){
            upVoteIds.splice(i,1);
            foundPost.upVoteCount -= 1;
            clickIdFound = true;
            break;
          }
        }
        if(clickIdFound == false){
          for(j=len2-1;j>=0;j--){
            if(downVoteIds[j].equals(req.user._id)){
              downVoteIds.splice(j,1);
              foundPost.downVoteCount -= 1;
              secondIdFound = true;
              break;
            }
          }
        }
        if(clickIdFound == false){
          upVoteIds.push(req.user._id);
          foundPost.upVoteCount += 1;
        }
        foundPost.save();
        res.json(foundPost);
      // downVote button
      } else if(req.body.downVote == 'down'){
        for(j=len2-1;j>=0;j--){
          if(downVoteIds[j].equals(req.user._id)){
            downVoteIds.splice(j,1);
            foundPost.downVoteCount -= 1;
            clickIdFound = true;
            break;
          }
        }
        if(clickIdFound == false){
          for(i=len1-1;i>=0;i--){
            if(upVoteIds[i].equals(req.user._id)){
              upVoteIds.splice(i,1);
              foundPost.upVoteCount -= 1;
              secondIdFound = true;
              break;
            }
          }
        }
        if(clickIdFound == false){
          downVoteIds.push(req.user._id);
          foundPost.downVoteCount += 1;
        }
        foundPost.save();
        res.json(foundPost);
      }
    }
    });
  }
}

//*************FUNCTIONS**************

function voteCheck(user,post){
  var i=0; var j=0; var k=0; var hasVote = 0;
  if(user){
    var likeIds = post.likeUserIds; var len1 = post.likeCount;
    var dislikeIds = post.dislikeUserIds; var len2 = post.dislikeCount;
    var heartIds = post.heartUserIds; var len3 = post.heartCount;
    for(i;i<len1;i++){
      if(likeIds[i].equals(user._id)){
        hasVote = 1;
        break;
      }
    }
    for(j;j<len2;j++){
      if(dislikeIds[j].equals(user._id)){
        hasVote = -1;
        break;
      }
    }
    for(k;k<len3;k++){
      if(heartIds[k].equals(user._id)){
        hasVote = 3;
        break;
      }
    }
    return hasVote;
  };
};

function modVoteCheck(user,post){
  var i=0; var j=0; var hasModVote = 0;
  if(user){
    var upVoteIds = post.upVoteUserIds; var len1 = post.upVoteCount;
    var downVoteIds = post.downVoteUserIds; var len2 = post.downVoteCount;
    for(i;i<len1;i++){
      if(upVoteIds[i].equals(user._id)){
        hasModVote = 1;
        break;
      }
    }
    for(j;j<len2;j++){
      if(downVoteIds[j].equals(user._id)){
        hasModVote = -1;
        break;
      }
    }
    return hasModVote;
  };
};

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

function sortComments(posts){
  var topCommentPosts = posts.map(function(post){
    if(post.commentBuckets != '' && post.commentBuckets.comments != ''){
      var trueCommentBuckets = post.commentBuckets;
      var sortCommentBucket = trueCommentBuckets[0].comments.sort(function(a, b){
        return (a.upvotesCount) - (b.upvotesCount);
      });
      post.commentBuckets.comments = sortCommentBucket;
      var sortPost = post;
    } else{
      var sortPost = post;
    }
    return sortPost;
  });
  return topCommentPosts;
};

function postPrivacy(foundPosts, foundUser){
  var posts = [];
  var postsLen = foundPosts.length;
  var friendsLen = foundUser.friends.length;
  var clubLen = foundUser.userClubs.length;
  for(i=0;i<postsLen;i++){
    var privacy = foundPosts[i].privacy;
    //Public
    if(privacy == 0){
      posts.push(foundPosts[i]);
    }
    //Friends
    if(privacy == 1){
      var pushed = false;
      if(foundPosts[i].postAuthor.id.equals(foundUser._id) && pushed == false){
        pushed = true;
        posts.push(foundPosts[i]);
      }
      if(friendsLen && pushed == false){
        for(j=0;j<friendsLen;j++){
          if(foundPosts[i].postAuthor.id.equals(foundUser.friends[j])){
            pushed = true;
            posts.push(foundPosts[i]);
            break;
          }
        }
      }
      if(clubLen && pushed == false){
        for(j=0;j<clubLen;j++){
          if(foundPosts[i].postClub._id.equals(foundUser.userClubs[j].id)){
            pushed = true;
            posts.push(foundPosts[i]);
            break;
          }
        }
      }
    }
    //Club(members)
    if(privacy == 2){
      if(foundPosts[i].postAuthor.id.equals(foundUser._id)){
        posts.push(foundPosts[i]);
      } else{
        for(j=0;j<clubLen;j++){
          if(foundPosts[i].postClub._id.equals(foundUser.userClubs[j].id)){
            posts.push(foundPosts[i]);
            break;
          }
        }
      }
    }
    //Club(friends)
    if(privacy == 3){
      if(foundPosts[i].postAuthor.id.equals(foundUser._id)){
        posts.push(foundPosts[i]);
      } else if(friendsLen && clubLen){
        outerLoop:
        for(j=0;j<clubLen;j++){
          for(k=0;k<friendsLen;k++){
            if((foundPosts[i].postClub._id.equals(foundUser.userClubs[j].id) && 
                foundPosts[i].postAuthor.id.equals(foundUser.friends[k])) || 
              (foundPosts[i].postClub._id.equals(foundUser.userClubs[j].id) && 
               0 <= foundUser.userClubs[j].rank && foundUser.userClubs[j].rank <= 1)){
              posts.push(foundPosts[i]);
              break outerLoop;
            }
          }
        }
      }
    }
    //Private
    if(privacy == 4){
      if(foundPosts[i].postAuthor.id.equals(foundUser._id)){
        posts.push(foundPosts[i]);
      }
    }
  }
  return posts;
};

function postModeration(foundPosts, foundUser){
  var posts = [];
  var postsLen = foundPosts.length;
  var clubLen = foundUser.userClubs.length;
  for(i=0;i<postsLen;i++){
    var moderation = foundPosts[i].moderation;
    //Exclusive
    if(moderation == 1){
      if(foundPosts[i].postAuthor.id.equals(foundUser._id)){
        posts.push(foundPosts[i]);
      } else if(clubLen){
        for(j=0;j<clubLen;j++){
          if(foundPosts[i].postClub._id.equals(foundUser.userClubs[j].id)){
            posts.push(foundPosts[i]);
          }
        }
      }
    }
    //Published
    if(moderation == 0){
      posts.push(foundPosts[i]);
    }
    //Hidden
    if(moderation == -1){
      if(foundPosts[i].postAuthor.id.equals(foundUser._id)){
        posts.push(foundPosts[i]);
      } else if(clubLen){
        for(j=0;j<clubLen;j++){
          if((foundPosts[i].postClub._id.equals(foundUser.userClubs[j].id) && 
          0 <= foundUser.userClubs[j].rank && foundUser.userClubs[j].rank <= 1)){
            posts.push(foundPosts[i]);
          }
        }
      }
    }
  }
  return posts;
};