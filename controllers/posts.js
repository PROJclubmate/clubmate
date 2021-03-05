const mongoose         = require('mongoose'),
  Post                 = require('../models/post'),
  User                 = require('../models/user'),
  Club                 = require('../models/club'),
  Comment              = require('../models/comment'),
  Discussion           = require('../models/discussion'),
  {cloudinary}         = require('../public/js/cloudinary.js');

module.exports = {
  postsHome(req, res, next){
    if(req.user && req.user.userClubs.length != 0){
      res.render('posts/index', {friendsPostUrl: false});
      return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
    } else if(req.user && req.user.userClubs.length == 0){
      req.flash('success', 'Join clubs to start seeing their posts at HOME.');
      return res.redirect('/discover');
    } else if(!req.user){
      req.flash('success', 'Please Login to go HOME :)');
      return res.redirect('/discover');
    }
  },

  postsHomeMorePosts(req, res, next){
    if(req.user){
      const dbQueries = [];
      var userClubIds = req.user.userClubs.map(function(club){
        return club.id;
      });
      dbQueries.push({postClub: {$in: userClubIds}});
      if(req.user.postsViewToggle == 2){
        dbQueries.push({topic: {$ne: ''}});
      }
      if(req.query.ids.split(',') != ''){
        var seenIds = req.query.ids.split(',');
      } else{
        var seenIds = [];
      }
      dbQueries.push({_id: {$nin: seenIds}});
      Post.find({$and: dbQueries})
      .populate({path: 'postClub', select: 'name avatar avatarId'})
      .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
      .sort({createdAt: -1}).limit(10)
      .exec(function(err, homePosts){
      if(err || !homePosts){
        console.log(Date.now()+' : '+req.user._id+' => (posts-1)homePosts err:- '+JSON.stringify(err, null, 2));
        return res.sendStatus(500);
      } else{
        var arrLength = homePosts.length;
        var friendsPostUrl = false; var currentUser2 = req.user;
        var foundPostIds = homePosts.map(function(post){
          return post._id;
        });
        var posts = postsPrivacyFilter(homePosts, req.user);
        var modPosts = postsModerationFilter(posts, req.user);
        sortComments(modPosts);
        var hasVote = [], hasModVote = [], PC_50_clubAvatar = [], seenPostIds = [];
        for(var k=0;k<modPosts.length;k++){
          PC_50_clubAvatar[k] = cloudinary.url(modPosts[k].postClub.avatarId,
          {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
          hasVote[k] = voteCheck(req.user,modPosts[k]);
          hasModVote[k] = modVoteCheck(req.user,modPosts[k]);
          seenPostIds.push(modPosts[k]._id);
        }
        Post.updateMany({_id: {$in: seenPostIds}}, {$inc: {viewsCount: 1}},
        function(err, updatePosts){
          if(err || !updatePosts){
            console.log(Date.now()+' => (posts-2)updatePosts err:- '+JSON.stringify(err, null, 2));
            return res.sendStatus(500);
          }
        });
        var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
        {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
        res.json({hasVote, hasModVote, posts: modPosts, friendsPostUrl, currentUser: currentUser2,
        foundPostIds, CU_50_profilePic, PC_50_clubAvatar, arrLength, csrfToken: res.locals.csrfToken});
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      }
      });
    } else{
      return res.redirect('/discover');
    }
  },

  postsFriends_posts(req, res, next){
    if(req.user && req.user.friendsCount != 0){
      res.render('posts/index', {friendsPostUrl: true});
      return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
    } else if(req.user && req.user.friendsCount == 0){
      req.flash('success', 'Add friends to start seeing their posts.');
      return res.redirect('/discover');
    } else if(!req.user){
      req.flash('success', 'Please Login to see your FRIENDS\' posts :)');
      return res.redirect('/discover');
    }
  },

  postsFriends_postsMorePosts(req, res, next){
    if(req.user){
      const dbQueries = [];
      dbQueries.push({'postAuthor.id': {$in: req.user.friends}});
      if(req.user.postsViewToggle == 2){
        dbQueries.push({topic: {$ne: ''}});
      }
      if(req.query.ids != ''){
        var seenIds = req.query.ids.split(',');
      } else{
        var seenIds = [];
      }
      dbQueries.push({_id: {$nin: seenIds}});
      Post.find({$and: dbQueries})
      .populate({path: 'postAuthor.id', select: 'fullName profilePic profilePicId userKeys'})
      .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
      .sort({createdAt: -1}).limit(10)
      .exec(function(err, friendsPosts){
      if(err || !friendsPosts){
        console.log(Date.now()+' : '+req.user._id+' => (posts-3)friendsPosts err:- '+JSON.stringify(err, null, 2));
        return res.sendStatus(500);
      } else{
        var arrLength = friendsPosts.length;
        var friendsPostUrl = true; var currentUser2 = req.user;
        var foundPostIds = friendsPosts.map(function(post){
          return post._id;
        });
        var posts = postsPrivacyFilter(friendsPosts, req.user);
        var modPosts = postsModerationFilter(posts, req.user);
        sortComments(modPosts);
        var hasVote = [], hasModVote = [], PA_50_profilePic = [], seenPostIds = [];
        for(var k=0;k<modPosts.length;k++){
          PA_50_profilePic[k] = cloudinary.url(modPosts[k].postAuthor.id.profilePicId,
          {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
          hasVote[k] = voteCheck(req.user,modPosts[k]);
          hasModVote[k] = modVoteCheck(req.user,modPosts[k]);
          seenPostIds.push(modPosts[k]._id);
        }
        Post.updateMany({_id: {$in: seenPostIds}}, {$inc: {viewsCount: 1}},
        function(err, updatePosts){
          if(err || !updatePosts){
            console.log(Date.now()+' => (posts-4)updatePosts err:- '+JSON.stringify(err, null, 2));
            return res.sendStatus(500);
          }
        });
        var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
        {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
        res.json({hasVote, hasModVote, posts: modPosts, friendsPostUrl, currentUser: currentUser2, 
        foundPostIds, CU_50_profilePic, PA_50_profilePic, arrLength, csrfToken: res.locals.csrfToken});
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      }
      });
    } else{
      return res.redirect('/discover');
    }
  },

  postsDiscoverSettings(req, res, next){
    if(req.user && req.user._id.equals(req.params.id)){
      if(req.body.discoverSwitch){
        User.updateOne({_id: req.params.id}, {$set: {discoverSwitch: req.body.discoverSwitch}}, 
        function(err, updateUser){
        if(err || !updateUser){
          console.log(Date.now()+' : '+req.user._id+' => (posts-5)updateUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }
        });
      }
      if(req.body.sortByKey){
        User.updateOne({_id: req.params.id}, {$set: {sortByKey: req.body.sortByKey}}, 
        function(err, updateUser){
        if(err || !updateUser){
          console.log(Date.now()+' : '+req.user._id+' => (posts-6)updateUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }
        });
      }
      return res.redirect('/discover');
    }
  },

  postsViewSettings(req, res, next){
    if(req.user && req.body.postsViewKey != 0){
      User.updateOne({_id: req.user._id}, {$set: {postsViewToggle: req.body.postsViewKey}}, 
      function(err, updateUser){
      if(err || !updateUser){
        console.log(Date.now()+' : '+req.user._id+' => (posts-7)updateUser err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      }
      });
      return res.redirect('back');
    }
  },

  postsDiscover(req, res, next){
    if(req.user){
      res.render('posts/discover', {currentUserId: req.user._id});
      return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
    } else{
      return res.render('posts/discover');
    }
  },

  postsDiscoverMorePosts(req, res, next){
    if(req.query.ids != ''){
      var seenIdsArr = req.query.ids.split(',');
    } else{
      var seenIdsArr = [];
    }
    var seenIds = [];
    for(var i=0;i<seenIdsArr.length;i++){
      seenIds.push(mongoose.Types.ObjectId(seenIdsArr[i]));
    }
    if(req.user){
      // Show (Colleges followed)
      if(req.user.discoverSwitch === 1){
        if(req.user.sortByKey === 1){
          Post.aggregate([
            {$match: {$and: [
              {postClub: {$in: req.user.followingClubIds}},
              {createdAt: {$gte: new Date(new Date() - (2*365*60*60*24*1000))}}, 
              {_id: {$nin: seenIds}}, 
              {moderation: 0}, {privacy: {$in: [0,1,2]}}, {topic: ''}
            ]}},
            { "$lookup": {
              "from": "clubs",
              "foreignField": "_id",
              "localField": "postClub",
              "as": "postClub"
            }},
            {
              "$unwind": "$postClub"
            },
            { "$lookup": {
              "from": "comments",
              "as": "commentBuckets",
              "let": { "id": "$_id" },
              "pipeline": [
                { "$match": { 
                  "$expr": { "$eq": [ "$$id", "$postId" ] }
                }},
                { "$sort": { "_id": -1 } },
                { "$limit": 1 }
              ]
            }},
            {$project: {
            "_id": 1,
            "description": 1,
            "hyperlink": 1,
            "descEdit": 1,
            "image": 1,
            "imageId": 1,
            "clubCollegeKey": 1,
            "viewsCount": 1,
            "privacy": 1,
            "moderation": 1,
            "isAdminModerationLock": 1,
            "likeCount": 1,
            "heartCount": 1,
            "likeUserIds": 1,
            "heartUserIds": 1,
            "commentsCount": 1,
            "bucketNum": 1,
            "commentBuckets": 1,
            "postClub._id": 1,
            "postClub.name": 1,
            "postClub.avatar": 1,
            "postClub.avatarId": 1,
            "postAuthor": 1,
            "topic": 1,
            "createdAt": 1,
            "__v": 1,
            // Based on (4000 views == 40 likes == 10 hearts == 5 comments & T = 4hr units)
            "ranking": {
              $divide: [
                { $add: [
                  { $multiply: ["$viewsCount", 0.00125] },
                  { $multiply: ["$likeCount", 0.125] },
                  { $multiply: ["$heartCount", 0.5] },
                  { $multiply: ["$commentsCount", 1] },
                  0.75
                ] },
                { $add: [
                  1,
                  { $pow: [
                    { $divide: [{ $subtract: [ new Date(), "$createdAt" ] },14400000]},
                    1.8
                  ] },
                ] }
              ] }
            }},
            {$sort: {"ranking": -1}},
            {$limit: 20}
          ])
          .exec(function(err, discoverPosts){
          if(err || !discoverPosts){
            console.log(Date.now()+' : '+req.user._id+' => (posts-8)discoverPosts err:- '+JSON.stringify(err, null, 2));
            return res.sendStatus(500);
          } else{
            var arrLength = discoverPosts.length;
            var friendsPostUrl = false; var currentUser2 = req.user;
            var foundPostIds = discoverPosts.map(function(post){
              return post._id;
            });
            sortComments(discoverPosts);
            var hasVote = [], hasModVote = [], PC_50_clubAvatar = [], seenPostIds = [];
            for(var k=0;k<discoverPosts.length;k++){
              PC_50_clubAvatar[k] = cloudinary.url(discoverPosts[k].postClub.avatarId,
              {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
              hasVote[k] = voteCheck(req.user,discoverPosts[k]);
              hasModVote[k] = modVoteCheck(req.user,discoverPosts[k]);
              seenPostIds.push(discoverPosts[k]._id);
            }
            Post.updateMany({_id: {$in: seenPostIds}}, {$inc: {viewsCount: 1}},
            function(err, updatePosts){
              if(err || !updatePosts){
                console.log(Date.now()+' => (posts-9)updatePosts err:- '+JSON.stringify(err, null, 2));
                return res.sendStatus(500);
              }
            });
            var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
            {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
            res.json({hasVote, hasModVote, posts: discoverPosts, friendsPostUrl, 
            currentUser: currentUser2, foundPostIds, CU_50_profilePic, PC_50_clubAvatar, arrLength, 
            csrfToken: res.locals.csrfToken});
            return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
          }
          });
        } else if(req.user.sortByKey === 2){
          Post.find({
            postClub: {$in: req.user.followingClubIds},
            createdAt: {$gte: new Date(new Date() - (2*365*60*60*24*1000))},
            _id: {$nin: seenIds}, 
            moderation: 0, privacy: {$in: [0,1,2]}, topic: ''})
          .populate({path: 'postClub', select: 'name avatar avatarId'})
          .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
          .sort({createdAt: -1}).limit(20)
          .exec(function(err, discoverPosts){
          if(err || !discoverPosts){
            console.log(Date.now()+' : '+req.user._id+' => (posts-10)discoverPosts err:- '+JSON.stringify(err, null, 2));
            return res.sendStatus(500);
          } else{
            var arrLength = discoverPosts.length;
            var friendsPostUrl = false; var currentUser2 = req.user;
            var foundPostIds = discoverPosts.map(function(post){
              return post._id;
            });
            sortComments(discoverPosts);
            var hasVote = [], hasModVote = [], PC_50_clubAvatar = [], seenPostIds = [];
            for(var k=0;k<discoverPosts.length;k++){
              PC_50_clubAvatar[k] = cloudinary.url(discoverPosts[k].postClub.avatarId,
              {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
              hasVote[k] = voteCheck(req.user,discoverPosts[k]);
              hasModVote[k] = modVoteCheck(req.user,discoverPosts[k]);
              seenPostIds.push(discoverPosts[k]._id);
            }
            Post.updateMany({_id: {$in: seenPostIds}}, {$inc: {viewsCount: 1}},
            function(err, updatePosts){
              if(err || !updatePosts){
                console.log(Date.now()+' => (posts-11)updatePosts err:- '+JSON.stringify(err, null, 2));
                return res.sendStatus(500);
              }
            });
            var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
            {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
            res.json({hasVote, hasModVote, posts: discoverPosts, friendsPostUrl, 
            currentUser: currentUser2, foundPostIds, CU_50_profilePic, PC_50_clubAvatar, arrLength, 
            csrfToken: res.locals.csrfToken});
            return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
          }
          });
        } else if(req.user.sortByKey === 3){
          Post.aggregate([
            {$match: {$and: [
              {postClub: {$in: req.user.followingClubIds}},
              {createdAt: {$gte: new Date(new Date() - (2*365*60*60*24*1000))}}, 
              {_id: {$nin: seenIds}}, 
              {moderation: 0}, {privacy: {$in: [0,1,2]}}, {topic: ''}
            ]}},
            { "$lookup": {
              "from": "clubs",
              "foreignField": "_id",
              "localField": "postClub",
              "as": "postClub"
            }},
            {
              "$unwind": "$postClub"
            },
            { "$lookup": {
              "from": "comments",
              "as": "commentBuckets",
              "let": { "id": "$_id" },
              "pipeline": [
                { "$match": { 
                  "$expr": { "$eq": [ "$$id", "$postId" ] }
                }},
                { "$sort": { "_id": -1 } },
                { "$limit": 1 }
              ]
            }},
            {$project: {
            "_id": 1,
            "description": 1,
            "hyperlink": 1,
            "descEdit": 1,
            "image": 1,
            "imageId": 1,
            "clubCollegeKey": 1,
            "viewsCount": 1,
            "privacy": 1,
            "moderation": 1,
            "isAdminModerationLock": 1,
            "likeCount": 1,
            "heartCount": 1,
            "likeUserIds": 1,
            "heartUserIds": 1,
            "commentsCount": 1,
            "bucketNum": 1,
            "commentBuckets": 1,
            "postClub._id": 1,
            "postClub.name": 1,
            "postClub.avatar": 1,
            "postClub.avatarId": 1,
            "postAuthor": 1,
            "topic": 1,
            "createdAt": 1,
            "__v": 1,
            // Based on (4000 views == 40 likes == 10 hearts == 5 comments & T = 4hr units)
            "ranking": {
              $add: [
                { $multiply: ["$viewsCount", 0.00125] },
                { $multiply: ["$likeCount", 0.125] },
                { $multiply: ["$heartCount", 0.5] },
                { $multiply: ["$commentsCount", 1] },
                0.75
              ]
            }}},
            {$sort: {"ranking": -1}},
            {$limit: 20}
          ])
          .exec(function(err, discoverPosts){
          if(err || !discoverPosts){
            console.log(Date.now()+' : '+req.user._id+' => (posts-12)discoverPosts err:- '+JSON.stringify(err, null, 2));
            return res.sendStatus(500);
          } else{
            var arrLength = discoverPosts.length;
            var friendsPostUrl = false; var currentUser2 = req.user;
            var foundPostIds = discoverPosts.map(function(post){
              return post._id;
            });
            sortComments(discoverPosts);
            var hasVote = [], hasModVote = [], PC_50_clubAvatar = [], seenPostIds = [];
            for(var k=0;k<discoverPosts.length;k++){
              PC_50_clubAvatar[k] = cloudinary.url(discoverPosts[k].postClub.avatarId,
              {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
              hasVote[k] = voteCheck(req.user,discoverPosts[k]);
              hasModVote[k] = modVoteCheck(req.user,discoverPosts[k]);
              seenPostIds.push(discoverPosts[k]._id);
            }
            Post.updateMany({_id: {$in: seenPostIds}}, {$inc: {viewsCount: 1}},
            function(err, updatePosts){
              if(err || !updatePosts){
                console.log(Date.now()+' => (posts-13)updatePosts err:- '+JSON.stringify(err, null, 2));
                return res.sendStatus(500);
              }
            });
            var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
            {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
            res.json({hasVote, hasModVote, posts: discoverPosts, friendsPostUrl, 
            currentUser: currentUser2, foundPostIds, CU_50_profilePic, PC_50_clubAvatar, arrLength, 
            csrfToken: res.locals.csrfToken});
            return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
          }
          });
        }
      // Show (Explore)
      } else if(req.user.discoverSwitch === 2){
        if(req.user.sortByKey === 1){
          Post.aggregate([
            {$match: {$and: [
              {createdAt: {$gte: new Date(new Date() - (2*365*60*60*24*1000))}}, 
              {_id: {$nin: seenIds}}, 
              {moderation: 0}, {privacy: 0}, {topic: ''}
            ]}},
            { "$lookup": {
              "from": "clubs",
              "foreignField": "_id",
              "localField": "postClub",
              "as": "postClub"
            }},
            {
              "$unwind": "$postClub"
            },
            { "$lookup": {
              "from": "comments",
              "as": "commentBuckets",
              "let": { "id": "$_id" },
              "pipeline": [
                { "$match": { 
                  "$expr": { "$eq": [ "$$id", "$postId" ] }
                }},
                { "$sort": { "_id": -1 } },
                { "$limit": 1 }
              ]
            }},
            {$project: {
            "_id": 1,
            "description": 1,
            "hyperlink": 1,
            "descEdit": 1,
            "image": 1,
            "imageId": 1,
            "clubCollegeKey": 1,
            "viewsCount": 1,
            "privacy": 1,
            "moderation": 1,
            "isAdminModerationLock": 1,
            "likeCount": 1,
            "heartCount": 1,
            "likeUserIds": 1,
            "heartUserIds": 1,
            "commentsCount": 1,
            "bucketNum": 1,
            "commentBuckets": 1,
            "postClub._id": 1,
            "postClub.name": 1,
            "postClub.avatar": 1,
            "postClub.avatarId": 1,
            "postAuthor": 1,
            "topic": 1,
            "createdAt": 1,
            "__v": 1,
            "ranking": {
              $divide: [
                { $add: [
                  { $multiply: ["$viewsCount", 0.00125] },
                  { $multiply: ["$likeCount", 0.125] },
                  { $multiply: ["$heartCount", 0.5] },
                  { $multiply: ["$commentsCount", 1] },
                  0.75
                ] },
                { $add: [
                  1,
                  { $pow: [
                    { $divide: [{ $subtract: [ new Date(), "$createdAt" ] },14400000]},
                    1.8
                  ] },
                ] }
              ] }
            }},
            {$sort: {"ranking": -1}},
            {$limit: 20}
          ])
          .exec(function(err, discoverPosts){
          if(err || !discoverPosts){
            console.log(Date.now()+' : '+req.user._id+' => (posts-14)discoverPosts err:- '+JSON.stringify(err, null, 2));
            return res.sendStatus(500);
          } else{
            var arrLength = discoverPosts.length;
            var friendsPostUrl = false; var currentUser2 = req.user;
            var foundPostIds = discoverPosts.map(function(post){
              return post._id;
            });
            sortComments(discoverPosts);
            var hasVote = [], hasModVote = [], PC_50_clubAvatar = [], seenPostIds = [];
            for(var k=0;k<discoverPosts.length;k++){
              PC_50_clubAvatar[k] = cloudinary.url(discoverPosts[k].postClub.avatarId,
              {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
              hasVote[k] = voteCheck(req.user,discoverPosts[k]);
              hasModVote[k] = modVoteCheck(req.user,discoverPosts[k]);
              seenPostIds.push(discoverPosts[k]._id);
            }
            Post.updateMany({_id: {$in: seenPostIds}}, {$inc: {viewsCount: 1}},
            function(err, updatePosts){
              if(err || !updatePosts){
                console.log(Date.now()+' => (posts-15)updatePosts err:- '+JSON.stringify(err, null, 2));
                return res.sendStatus(500);
              }
            });
            var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
            {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
            res.json({hasVote, hasModVote, posts: discoverPosts, friendsPostUrl, 
            currentUser: currentUser2, foundPostIds, CU_50_profilePic, PC_50_clubAvatar, arrLength, 
            csrfToken: res.locals.csrfToken});
            return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
          }
          });
        } else if(req.user.sortByKey === 2){
          Post.find({
            createdAt: {$gte: new Date(new Date() - (2*365*60*60*24*1000))}, 
            _id: {$nin: seenIds}, 
            moderation: 0, privacy: 0, topic: ''})
          .populate({path: 'postClub', select: 'name avatar avatarId'})
          .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
          .sort({createdAt: -1}).limit(20)
          .exec(function(err, discoverPosts){
          if(err || !discoverPosts){
            console.log(Date.now()+' : '+req.user._id+' => (posts-16)discoverPosts err:- '+JSON.stringify(err, null, 2));
            return res.sendStatus(500);
          } else{
            var arrLength = discoverPosts.length;
            var friendsPostUrl = false; var currentUser2 = req.user;
            var foundPostIds = discoverPosts.map(function(post){
              return post._id;
            });
            sortComments(discoverPosts);
            var hasVote = [], hasModVote = [], PC_50_clubAvatar = [], seenPostIds = [];
            for(var k=0;k<discoverPosts.length;k++){
              PC_50_clubAvatar[k] = cloudinary.url(discoverPosts[k].postClub.avatarId,
              {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
              hasVote[k] = voteCheck(req.user,discoverPosts[k]);
              hasModVote[k] = modVoteCheck(req.user,discoverPosts[k]);
              seenPostIds.push(discoverPosts[k]._id);
            }
            Post.updateMany({_id: {$in: seenPostIds}}, {$inc: {viewsCount: 1}},
            function(err, updatePosts){
              if(err || !updatePosts){
                console.log(Date.now()+' => (posts-17)updatePosts err:- '+JSON.stringify(err, null, 2));
                return res.sendStatus(500);
              }
            });
            var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
            {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
            res.json({hasVote, hasModVote, posts: discoverPosts, friendsPostUrl, 
            currentUser: currentUser2, foundPostIds, CU_50_profilePic, PC_50_clubAvatar, arrLength, 
            csrfToken: res.locals.csrfToken});
            return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
          }
          });
        } else if(req.user.sortByKey === 3){
          Post.aggregate([
            {$match: {$and: [
              {createdAt: {$gte: new Date(new Date() - (2*365*60*60*24*1000))}}, 
              {_id: {$nin: seenIds}}, 
              {moderation: 0}, {privacy: 0}, {topic: ''}
            ]}},
            { "$lookup": {
              "from": "clubs",
              "foreignField": "_id",
              "localField": "postClub",
              "as": "postClub"
            }},
            {
              "$unwind": "$postClub"
            },
            { "$lookup": {
              "from": "comments",
              "as": "commentBuckets",
              "let": { "id": "$_id" },
              "pipeline": [
                { "$match": { 
                  "$expr": { "$eq": [ "$$id", "$postId" ] }
                }},
                { "$sort": { "_id": -1 } },
                { "$limit": 1 }
              ]
            }},
            {$project: {
            "_id": 1,
            "description": 1,
            "hyperlink": 1,
            "descEdit": 1,
            "image": 1,
            "imageId": 1,
            "clubCollegeKey": 1,
            "viewsCount": 1,
            "privacy": 1,
            "moderation": 1,
            "isAdminModerationLock": 1,
            "likeCount": 1,
            "heartCount": 1,
            "likeUserIds": 1,
            "heartUserIds": 1,
            "commentsCount": 1,
            "bucketNum": 1,
            "commentBuckets": 1,
            "postClub._id": 1,
            "postClub.name": 1,
            "postClub.avatar": 1,
            "postClub.avatarId": 1,
            "postAuthor": 1,
            "topic": 1,
            "createdAt": 1,
            "__v": 1,
            "ranking": {
              $add: [
                { $multiply: ["$viewsCount", 0.00125] },
                { $multiply: ["$likeCount", 0.125] },
                { $multiply: ["$heartCount", 0.5] },
                { $multiply: ["$commentsCount", 1] },
                0.75
              ]
            }}},
            {$sort: {"ranking": -1}},
            {$limit: 20}
          ])
          .exec(function(err, discoverPosts){
          if(err || !discoverPosts){
            console.log(Date.now()+' : '+req.user._id+' => (posts-18)discoverPosts err:- '+JSON.stringify(err, null, 2));
            return res.sendStatus(500);
          } else{
            var arrLength = discoverPosts.length;
            var friendsPostUrl = false; var currentUser2 = req.user;
            var foundPostIds = discoverPosts.map(function(post){
              return post._id;
            });
            sortComments(discoverPosts);
            var hasVote = [], hasModVote = [], PC_50_clubAvatar = [], seenPostIds = [];
            for(var k=0;k<discoverPosts.length;k++){
              PC_50_clubAvatar[k] = cloudinary.url(discoverPosts[k].postClub.avatarId,
              {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
              hasVote[k] = voteCheck(req.user,discoverPosts[k]);
              hasModVote[k] = modVoteCheck(req.user,discoverPosts[k]);
              seenPostIds.push(discoverPosts[k]._id);
            }
            Post.updateMany({_id: {$in: seenPostIds}}, {$inc: {viewsCount: 1}},
            function(err, updatePosts){
              if(err || !updatePosts){
                console.log(Date.now()+' => (posts-19)updatePosts err:- '+JSON.stringify(err, null, 2));
                return res.sendStatus(500);
              }
            });
            var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
            {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
            res.json({hasVote, hasModVote, posts: discoverPosts, friendsPostUrl, 
            currentUser: currentUser2, foundPostIds, CU_50_profilePic, PC_50_clubAvatar, arrLength, 
            csrfToken: res.locals.csrfToken});
            return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
          }
          });
        }
      }
    // LOGGED OUT
    } else{
      Post.aggregate([
        {$match: {$and: [
          {createdAt: {$gte: new Date(new Date() - (2*365*60*60*24*1000))}}, 
          {_id: {$nin: seenIds}}, 
          {moderation: 0}, {privacy: 0}, {topic: ''}
        ]}},
        { "$lookup": {
          "from": "clubs",
          "foreignField": "_id",
          "localField": "postClub",
          "as": "postClub"
        }},
        {
          "$unwind": "$postClub"
        },
        { "$lookup": {
          "from": "comments",
          "as": "commentBuckets",
          "let": { "id": "$_id" },
          "pipeline": [
            { "$match": { 
              "$expr": { "$eq": [ "$$id", "$postId" ] }
            }},
            { "$sort": { "_id": -1 } },
            { "$limit": 1 }
          ]
        }},
        {$project: {
        "_id": 1,
        "description": 1,
        "hyperlink": 1,
        "descEdit": 1,
        "image": 1,
        "imageId": 1,
        "clubCollegeKey": 1,
        "viewsCount": 1,
        "privacy": 1,
        "moderation": 1,
        "isAdminModerationLock": 1,
        "likeCount": 1,
        "heartCount": 1,
        "likeUserIds": 1,
        "heartUserIds": 1,
        "commentsCount": 1,
        "bucketNum": 1,
        "commentBuckets": 1,
        "postClub._id": 1,
        "postClub.name": 1,
        "postClub.avatar": 1,
        "postClub.avatarId": 1,
        "postAuthor": 1,
        "topic": 1,
        "createdAt": 1,
        "__v": 1,
        "ranking": {
          $divide: [
            { $add: [
              { $multiply: ["$viewsCount", 0.00125] },
              { $multiply: ["$likeCount", 0.125] },
              { $multiply: ["$heartCount", 0.5] },
              { $multiply: ["$commentsCount", 1] },
              0.75
            ] },
            { $add: [
              1,
              { $pow: [
                { $divide: [{ $subtract: [ new Date(), "$createdAt" ] },14400000]},
                1.8
              ] },
            ] }
          ] }
        }},
        {$sort: {"ranking": -1}},
        {$limit: 20}
      ])
      .exec(function(err, discoverPosts){
      if(err || !discoverPosts){
        console.log(Date.now()+' : '+req.user._id+' => (posts-20)discoverPosts err:- '+JSON.stringify(err, null, 2));
        return res.sendStatus(500);
      } else{
        var arrLength = discoverPosts.length;
        var friendsPostUrl = false;
        var foundPostIds = discoverPosts.map(function(post){
          return post._id;
        });
        sortComments(discoverPosts);
        var hasVote = [], hasModVote = [], PC_50_clubAvatar = [], seenPostIds = [];
        for(var k=0;k<discoverPosts.length;k++){
          PC_50_clubAvatar[k] = cloudinary.url(discoverPosts[k].postClub.avatarId,
          {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
          hasVote[k] = voteCheck(req.user,discoverPosts[k]);
          hasModVote[k] = modVoteCheck(req.user,discoverPosts[k]);
          seenPostIds.push(discoverPosts[k]._id);
        }
        Post.updateMany({_id: {$in: seenPostIds}}, {$inc: {viewsCount: 1}},
        function(err, updatePosts){
          if(err || !updatePosts){
            console.log(Date.now()+' => (posts-21)updatePosts err:- '+JSON.stringify(err, null, 2));
            return res.sendStatus(500);
          }
        });
        return res.json({hasVote, hasModVote, posts: discoverPosts, friendsPostUrl, foundPostIds, 
        PC_50_clubAvatar, arrLength, csrfToken: res.locals.csrfToken});
      }
      });
    }
  },

  postsCreate(req, res, next){
    var rank = currentRank2(req.params.club_id,req.user.userClubs);
    // Only rank 0-3 can create a simple post
    if(((req.body.topic != '') && (0<=rank && rank<=4)) || ((req.body.topic == '') && (0<=rank && rank<=3))){
      if(req.file){
        if(req.body.privacy && (((req.body.topic != '') && (3<=req.body.privacy && req.body.privacy<=5)) || 
        ((req.body.topic == '') && (0<=req.body.privacy && req.body.privacy<=5)))){
          cloudinary.v2.uploader.upload(req.file.path,
          {folder: 'postImages/', use_filename: true, width: 1080, height: 1080, quality: 'auto:eco', 
          effect: 'sharpen:25', format: 'webp', crop: 'limit'},
          function(err, result){
          if(err){
            console.log(Date.now()+' : '+req.user._id+' => (posts-22)imageUpload err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          } else{
            req.body.image = result.secure_url;
            req.body.imageId = result.public_id;
            req.body.moderation = 1;
            Club.findById(req.params.club_id).select({clubKeys: 1}).exec(function(err, foundClub){
            if(err || !foundClub){
              console.log(Date.now()+' : '+req.user._id+' => (posts-23)foundClub err:- '+JSON.stringify(err, null, 2));
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            } else{
              Post.create(req.body, function(err, newPost){
              if(err || !newPost){
                console.log(Date.now()+' : '+req.user._id+' => (posts-24)newPost err:- '+JSON.stringify(err, null, 2));
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              } else{
                newPost.clubCollegeKey = foundClub.clubKeys.college;
                newPost.postClub = req.params.club_id;
                newPost.postAuthor.id = req.user._id;
                newPost.postAuthor.authorName = req.user.fullName;
                newPost.save(function(err, newPost){
                if(err || !newPost){
                  console.log(Date.now()+' : '+req.user._id+' => (posts-25)newPost err:- '+JSON.stringify(err, null, 2));
                  req.flash('error', 'Something went wrong :(');
                  return res.redirect('back');
                } else{
                  req.flash('success', 'Post created.');
                  return res.redirect('/clubs/'+req.params.club_id);
                }
                });
              }
              });
            }
            });
          }
          });
        } else{
          req.flash('error', 'Please enter a valid post privacy setting');
          return res.redirect('back');
        }
      } else{
        if(req.body.privacy && (((req.body.topic != '') && (3<=req.body.privacy && req.body.privacy<=5)) || 
        ((req.body.topic == '') && (0<=req.body.privacy && req.body.privacy<=5)))){
          req.body.moderation = 1;
          Club.findById(req.params.club_id).select({clubKeys: 1}).exec(function(err, foundClub){
          if(err || !foundClub){
            console.log(Date.now()+' : '+req.user._id+' => (posts-26)foundClub err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          } else{
            Post.create(req.body, function(err, newPost){
            if(err || !newPost){
              console.log(Date.now()+' : '+req.user._id+' => (posts-27)newPost err:- '+JSON.stringify(err, null, 2));
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            } else{
              newPost.clubCollegeKey = foundClub.clubKeys.college;
              newPost.postClub = req.params.club_id;
              newPost.postAuthor.id = req.user._id;
              newPost.postAuthor.authorName = req.user.fullName;
              newPost.save(function(err, newPost){
              if(err || !newPost){
                console.log(Date.now()+' : '+req.user._id+' => (posts-28)newPost err:- '+JSON.stringify(err, null, 2));
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              } else{
                req.flash('success', 'Post created.');
                return res.redirect('/clubs/'+req.params.club_id);
              }
              });
            }
            });
          }
          });
        } else{
          req.flash('error', 'Please enter a valid post privacy setting');
          return res.redirect('back');
        }
      }
    } else{
      req.flash('error', 'Not allowed.');
      return res.redirect('back');
    }
  },

  postsShow(req, res, next){
    if(req.user){
      Post.findByIdAndUpdate(req.params.post_id, {$inc: {viewsCount: 5}})
      .populate({path: 'postClub', select: 'name avatar avatarId clubUsers'}).exec(function (err, foundPost){
      if(err || !foundPost){
        console.log(Date.now()+' : '+'(posts-29)foundPost err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        var unfilteredPost = [];
        unfilteredPost.push(foundPost);
        var post = postsPrivacyFilter(unfilteredPost, req.user);
        var modPost = postsModerationFilter(post, req.user);
        if(modPost.length){
          var modPost = modPost[0];
          var PC_50_clubAvatar = cloudinary.url(modPost.postClub.avatarId,
          {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
          var hasVote = voteCheck(req.user,modPost);
          var hasModVote = modVoteCheck(req.user,modPost);
          if(req.user){
            for(var i=0;i<req.user.userClubs.length;i++){
              if(req.user.userClubs[i].id.equals(req.params.club_id)){
                var rank = req.user.userClubs[i].rank;
                break;
              }
            }
          }
          if(modPost.topic == '' && modPost.commentBuckets != ''){
            var lastTwoBuckets = [], len = modPost.commentBuckets.length;
            lastTwoBuckets.push(modPost.commentBuckets[len-1]);
            lastTwoBuckets.push(modPost.commentBuckets[len-2]);
            Comment.find({_id: {$in: lastTwoBuckets}})
            .populate({path: 'comments.commentAuthor.id', select: 'fullName profilePic profilePicId userKeys'})
            .exec(function(err, foundBuckets){
            if(err || !foundBuckets){
              console.log(Date.now()+' : '+'(posts-30)foundBuckets err:- '+JSON.stringify(err, null, 2));
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            } else{
              var CA_50_profilePic = [], numBuckets = foundBuckets.length;
              for(var i=0;i<numBuckets;i++){
                CA_50_profilePic[i] = [];
                for(var j=0;j<foundBuckets[i].comments.length;j++){
                  CA_50_profilePic[i][j] = cloudinary.url(foundBuckets[i].comments[j].commentAuthor.id.profilePicId,
                  {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
                }
                foundBuckets[i].comments.sort(function(a, b){
                  return a.upvotesCount - b.upvotesCount;
                });
              }
              var index = len-3;
              if(req.user){
                var upComments = commentCheck(req.user._id,foundBuckets);
                var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
                {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
              } else{
                var upComments = [];
                var CU_50_profilePic = null;
              }
              res.render("posts/show", {hasVote, hasModVote, post: modPost, upComments, rank, buckets: foundBuckets,
              index, CU_50_profilePic, PC_50_clubAvatar, CA_50_profilePic});
              return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
            }
            });
          } else if(modPost.topic != '' && req.user){
            var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
            {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
            if(modPost.subpostBuckets != ''){
              var len = index = modPost.subpostBuckets.length;
              Discussion.findOne({_id: modPost.subpostBuckets[len-1]})
              .populate({path: 'subPosts.subPostAuthor.id', select: 'fullName profilePic profilePicId userKeys'})
              .exec(function(err, foundBucket){
              if(err || !foundBucket){
                console.log(Date.now()+' : '+'(posts-31)foundBucket err:- '+JSON.stringify(err, null, 2));
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              } else{
                var sPA_50_profilePic = [];
                for(var j=0;j<foundBucket.subPosts.length;j++){
                  sPA_50_profilePic[j] = cloudinary.url(foundBucket.subPosts[j].subPostAuthor.id.profilePicId,
                  {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
                }
                // Push conversationId to clubUsers
                // If conversationId == null then find clubid
                Club.findById(req.params.club_id).select({conversationId: 1})
                .exec(function(err, foundClub){
                if(err || !foundClub){
                  console.log(Date.now()+' : '+'(posts-32)foundClub err:- '+JSON.stringify(err, null, 2));
                  req.flash('error', 'Something went wrong :(');
                  return res.redirect('back');
                } else{
                  var subVotes = subVoteCheck(req.user._id,foundBucket);
                  var conversationId = '', convClubId = '', quote = false;
                  if(foundClub.conversationId){
                    var conversationId = foundClub.conversationId;
                  } else{var convClubId = foundClub._id;}
                  res.render("posts/show", {hasVote, hasModVote, post: modPost, subVotes, rank, bucket: foundBucket,
                  conversationId, convClubId, index, clubId: foundClub._id, CU_50_profilePic, PC_50_clubAvatar,
                  sPA_50_profilePic, quote});
                  return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
                }
                });
              }
              });
            } else{
              Club.findById(req.params.club_id).select({conversationId: 1})
              .exec(function(err, foundClub){
              if(err || !foundClub){
                console.log(Date.now()+' : '+'(posts-33)foundClub err:- '+JSON.stringify(err, null, 2));
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              } else{
                var conversationId = '', convClubId = '', quote = false;
                if(foundClub.conversationId){
                  var conversationId = foundClub.conversationId;
                } else{var convClubId = foundClub._id;}
                res.render("posts/show", {hasVote, hasModVote, post: modPost, rank, conversationId, convClubId,
                clubId: foundClub._id, CU_50_profilePic, PC_50_clubAvatar, quote});
                return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
              }
              });
            }
          } else{
            var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
            {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
            var index = null;
            res.render("posts/show", {hasVote, hasModVote, post: modPost, rank, index, PC_50_clubAvatar,
            CU_50_profilePic});
            return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
          }
        }
      }
      });
    } else{
      Post.findOne({_id: req.params.post_id, moderation: 0, privacy: 0})
      .populate({path: 'postClub', select: 'name avatar avatarId clubUsers'}).exec(function (err, foundPost){
      if(err || !foundPost){
        console.log(Date.now()+' : '+'(posts-34)foundPost err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        var PC_50_clubAvatar = cloudinary.url(foundPost.postClub.avatarId,
        {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
        var hasVote = null;
        var hasModVote = null;
        var rank = null;
        if(foundPost.topic == '' && foundPost.commentBuckets != ''){
          var lastTwoBuckets = [], len = foundPost.commentBuckets.length;
          lastTwoBuckets.push(foundPost.commentBuckets[len-1]);
          lastTwoBuckets.push(foundPost.commentBuckets[len-2]);
          Comment.find({_id: {$in: lastTwoBuckets}})
          .populate({path: 'comments.commentAuthor.id', select: 'fullName profilePic profilePicId userKeys'})
          .exec(function(err, foundBuckets){
          if(err || !foundBuckets){
            console.log(Date.now()+' : '+'(posts-35)foundBuckets err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          } else{
            var CA_50_profilePic = [], numBuckets = foundBuckets.length;
            for(var i=0;i<numBuckets;i++){
              CA_50_profilePic[i] = [];
              for(var j=0;j<foundBuckets[i].comments.length;j++){
                CA_50_profilePic[i][j] = cloudinary.url(foundBuckets[i].comments[j].commentAuthor.id.profilePicId,
                {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
              }
            }
            var index = len-3;
            var upComments = [];
            var CU_50_profilePic = null;
            return res.render("posts/show", {hasVote, hasModVote, post: foundPost, upComments, rank, buckets: foundBuckets,
            index, CU_50_profilePic, PC_50_clubAvatar, CA_50_profilePic});
          }
          });
        } else{
          var CU_50_profilePic = null;
          var index = null;
          var rank = null;
          return res.render("posts/show", {hasVote, hasModVote, post: foundPost, rank, index, PC_50_clubAvatar,
          CU_50_profilePic});
        }
      }
      });
    }
  },

  subPostQuote(req, res, next){
    if(req.query.quote){
      Post.findById(req.params.post_id).populate({path: 'postClub', select: 'name avatar avatarId clubUsers'})
      .exec(function (err, foundPost){
      if(err || !foundPost){
        console.log(Date.now()+' : '+'(posts-36)foundPost err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        var PC_50_clubAvatar = cloudinary.url(foundPost.postClub.avatarId,
        {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
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
          {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
          if(foundPost.subpostBuckets != ''){
            var len = index = foundPost.subpostBuckets.length;
            Discussion.findOne({_id: foundPost.subpostBuckets[len-1]})
            .populate({path: 'subPosts.subPostAuthor.id', select: 'fullName profilePic profilePicId'})
            .exec(function(err, foundBucket){
            if(err || !foundBucket){
              console.log(Date.now()+' : '+'(posts-37)foundBucket err:- '+JSON.stringify(err, null, 2));
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            } else{
              var sPA_50_profilePic = [];
              for(var j=0;j<foundBucket.subPosts.length;j++){
                sPA_50_profilePic[j] = cloudinary.url(foundBucket.subPosts[j].subPostAuthor.id.profilePicId,
                {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
              }
              var subVotes = subVoteCheck(req.user._id,foundBucket);
              Discussion.findOne({_id: req.params.bucket_id}, function(err, foundQuoteBucket){
              if(err || !foundQuoteBucket){
                console.log(Date.now()+' : '+'(posts-38)foundQuoteBucket err:- '+JSON.stringify(err, null, 2));
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
                return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
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
      console.log(Date.now()+' : '+req.user._id+' => (posts-39)foundPost err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      if(foundPost.postAuthor.id.equals(req.user._id)){
        if(foundPost.description.localeCompare(req.body.description) != 0){
          var editobj = {};
          editobj['desc'] = foundPost.description;
          foundPost.descEdit.push(editobj);
          foundPost.description = req.body.description;
        };
        foundPost.hyperlink = encodeURI(req.body.hyperlink);
        foundPost.privacy = req.body.privacy;
        foundPost.save();
        return res.redirect('/clubs/'+req.params.club_id+'/posts/'+req.params.post_id);
      } else{
        res.redirect('back');
      }
    }
    });
  },

  postsDelete(req, res, next){
    Post.findById(req.params.post_id, async function(err, foundPost){
    if(err || !foundPost){
      console.log(Date.now()+' : '+req.user._id+' => (posts-40)foundPost err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      if(foundPost.postAuthor.id.equals(req.user._id)){
        if(foundPost.image && foundPost.imageId){
          try{
            await cloudinary.v2.uploader.destroy(foundPost.imageId);
            foundPost.remove();
            //deletes all comments associated with the post
            Comment.deleteMany({postId: foundPost._id}, function(err){
              if(err){
                console.log(Date.now()+' : '+req.user._id+' => (posts-41)foundComment err:- '+JSON.stringify(err, null, 2));
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }
            });
            Discussion.deleteMany({postId: foundPost._id}, function(err){
              if(err){
                console.log(Date.now()+' : '+req.user._id+' => (posts-42)foundDiscussion err:- '+JSON.stringify(err, null, 2));
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }
            });
            req.flash('success', 'Post deleted successfully!');
            res.redirect('back');
          }catch(err){
            console.log(Date.now()+' : '+'(posts-43)foundPost catch err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }
        } else{
          foundPost.remove();
          //deletes all comments associated with the post
          Comment.deleteMany({postId: foundPost._id}, function(err){
            if(err){
              console.log(Date.now()+' : '+req.user._id+' => (posts-44)foundComment err:- '+JSON.stringify(err, null, 2));
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          });
          Discussion.deleteMany({postId: foundPost._id}, function(err){
            if(err){
              console.log(Date.now()+' : '+req.user._id+' => (posts-45)foundDiscussion err:- '+JSON.stringify(err, null, 2));
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          });
          req.flash('success', 'Post deleted successfully!');
          res.redirect('back');
        }
      } else{
        res.redirect('back');
      }
    }
    });
  },

  postsVote(req, res, next){
    if(req.body.visibility || req.body.exclusive || req.body.published){
      Post.findById(req.params.post_id).populate({path: 'postClub', select: 'clubUsers'})
      .exec(function(err, foundPost){
      if(err || !foundPost){
        console.log(Date.now()+' : '+req.user._id+' => (posts-46)foundPost err:- '+JSON.stringify(err, null, 2));
        return res.sendStatus(500);
      } else{
        var isModerator = checkRank2(foundPost.postClub.clubUsers,req.user._id,2);
        if(isModerator){
          if(req.body.exclusive){
            foundPost.moderation = parseInt(req.body.exclusive);
            foundPost.save();
            res.json({foundPost, isPresident: false, csrfToken: res.locals.csrfToken});
          }
          if(req.body.published){
            foundPost.moderation = parseInt(req.body.published);
            foundPost.save();
            res.json({foundPost, isPresident: false, csrfToken: res.locals.csrfToken});
          }
        }
        var isAdmin = checkRank2(foundPost.postClub.clubUsers,req.user._id,1);
        if(isAdmin){
          var isPresident = checkRank2(foundPost.postClub.clubUsers,req.user._id,0);
          if(req.body.visibility){
            foundPost.moderation = parseInt(req.body.visibility);
            foundPost.save();
            res.json({foundPost, isPresident, csrfToken: res.locals.csrfToken});
          }
        }
      }
      });
      return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
    } else{
      Post.findById(req.params.post_id, function(err, foundPost){
      if(err || !foundPost){
        console.log(Date.now()+' : '+req.user._id+' => (posts-47)foundPost err:- '+JSON.stringify(err, null, 2));
        return res.sendStatus(500);
      } else{
        var i, k; var clickIdFound = false, otherIdFound = false;
        var likeIds = foundPost.likeUserIds; var len1 = foundPost.likeCount;
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
            for(k=len3-1;k>=0;k--){
              if(heartIds[k].equals(req.user._id)){
                heartIds.splice(k,1);
                foundPost.heartCount -= 1;
                otherIdFound = true;
                break;
              }
            }
            if(otherIdFound == true){
              User.updateOne({_id: req.user._id},{$pull: {postHearts: foundPost._id}}, function(err, updateUser){
                if(err || !updateUser){
                  console.log(Date.now()+' : '+req.user._id+' => (posts-48)updateUser err:- '+JSON.stringify(err, null, 2));
                  return res.sendStatus(500);
                }
              });
            }
          }
          if(clickIdFound == false){
            likeIds.push(req.user._id);
            foundPost.likeCount += 1;
          }
          foundPost.save();
          res.json({foundPost, csrfToken: res.locals.csrfToken});
          return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
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
            User.updateOne({_id: req.user._id},{$pull: {postHearts: foundPost._id}}, function(err, updateUser){
              if(err || !updateUser){
                console.log(Date.now()+' : '+req.user._id+' => (posts-49)updateUser err:- '+JSON.stringify(err, null, 2));
                return res.sendStatus(500);
              }
            });
          }
          if(clickIdFound == false){
            for(i=len1-1;i>=0;i--){
              if(likeIds[i].equals(req.user._id)){
                likeIds.splice(i,1);
                foundPost.likeCount -= 1;
                break;
              }
            }
          }
          if(clickIdFound == false){
            heartIds.push(req.user._id);
            foundPost.heartCount +=1;
            User.updateOne({_id: req.user._id},{$push: {postHearts: foundPost._id}}, function(err, updateUser){
              if(err || !updateUser){
                console.log(Date.now()+' : '+req.user._id+' => (posts-50)updateUser err:- '+JSON.stringify(err, null, 2));
                return res.sendStatus(500);
              }
            });
          }
          foundPost.save();
          res.json({foundPost, csrfToken: res.locals.csrfToken});
          return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
        }
      }
      });
    }
  },

  postsModVote(req, res, next){
    Post.findById(req.params.post_id, function(err, foundPost){
    if(err || !foundPost){
      console.log(Date.now()+' : '+req.user._id+' => (posts-51)foundPost err:- '+JSON.stringify(err, null, 2));
      return res.sendStatus(500);
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
        res.json({foundPost, csrfToken: res.locals.csrfToken});
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
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
        res.json({foundPost, csrfToken: res.locals.csrfToken});
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      }
    }
    });
  }
}

//*************FUNCTIONS**************
function checkRank2(clubUsers,userId,rank){
  var ok = false;
  clubUsers.forEach(function(user){
    if(user.id.equals(userId) && (user.userRank == 0 || user.userRank == rank)){
      ok = true;
    }
  });
  return ok;
};

function currentRank2(clubId,userClubs){
  var rank;
  userClubs.forEach(function(club){
    if(club.id.equals(clubId)){
      rank = club.rank;
    }
  });
  return rank;
};

function voteCheck(user,post){
  var hasVote = 0;
  if(user){
    if(hasVote == 0){
      for(var i=post.likeCount-1;i>=0;i--){
        if(post.likeUserIds[i].equals(user._id)){
          hasVote = 1;
          break;
        }
      }
    }
    if(hasVote == 0){
      for(var k=post.heartCount-1;k>=0;k--){
        if(post.heartUserIds[k].equals(user._id)){
          hasVote = 3;
          break;
        }
      }
    }
    return hasVote;
  };
};

function modVoteCheck(user,post){
  var hasModVote = 0;
  if(user){
    if(hasModVote == 0){
      for(var i=post.upVoteCount-1;i>=0;i--){
        if(post.upVoteUserIds[i].equals(user._id)){
          hasModVote = 1;
          break;
        }
      }
    }
    if(hasModVote == 0){
      for(var j=post.downVoteCount-1;j>=0;j--){
        if(post.downVoteUserIds[j].equals(user._id)){
          hasModVote = -1;
          break;
        }
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

function postsPrivacyFilter(foundPosts, currentUser){
  var posts = [];
  var postsLen = foundPosts.length;
  var friendsLen = currentUser.friends.length;
  var clubLen = currentUser.userClubs.length;
  for(i=0;i<postsLen;i++){
    var privacy = foundPosts[i].privacy;
    //Public
    if(privacy == 0){
      posts.push(foundPosts[i]);
    }
    //College
    if(privacy == 1){
      if(foundPosts[i].clubCollegeKey == currentUser.userKeys.college){
        posts.push(foundPosts[i]);
      }
    }
    //Friends
    if(privacy == 2){
      var pushed = false;
      if(foundPosts[i].postAuthor.id.equals(currentUser._id) && pushed == false){
        pushed = true;
        posts.push(foundPosts[i]);
      }
      if(friendsLen && pushed == false){
        for(j=0;j<friendsLen;j++){
          if(foundPosts[i].postAuthor.id.equals(currentUser.friends[j])){
            pushed = true;
            posts.push(foundPosts[i]);
            break;
          }
        }
      }
      if(clubLen && pushed == false){
        for(j=0;j<clubLen;j++){
          if(foundPosts[i].postClub._id.equals(currentUser.userClubs[j].id)){
            pushed = true;
            posts.push(foundPosts[i]);
            break;
          }
        }
      }
    }
    //Club(members)
    if(privacy == 3){
      if(foundPosts[i].postAuthor.id.equals(currentUser._id)){
        posts.push(foundPosts[i]);
      } else{
        for(j=0;j<clubLen;j++){
          if(foundPosts[i].postClub._id.equals(currentUser.userClubs[j].id)){
            posts.push(foundPosts[i]);
            break;
          }
        }
      }
    }
    //Club(friends)
    if(privacy == 4){
      if(foundPosts[i].postAuthor.id.equals(currentUser._id)){
        posts.push(foundPosts[i]);
      } else if(friendsLen && clubLen){
        outerLoop:
        for(j=0;j<clubLen;j++){
          for(k=0;k<friendsLen;k++){
            if((foundPosts[i].postClub._id.equals(currentUser.userClubs[j].id) && 
                foundPosts[i].postAuthor.id.equals(currentUser.friends[k])) || 
              (foundPosts[i].postClub._id.equals(currentUser.userClubs[j].id) && 
               0 <= currentUser.userClubs[j].rank && currentUser.userClubs[j].rank <= 1)){
              posts.push(foundPosts[i]);
              break outerLoop;
            }
          }
        }
      }
    }
    //Private
    if(privacy == 5){
      if(foundPosts[i].postAuthor.id.equals(currentUser._id)){
        posts.push(foundPosts[i]);
      }
    }
  }
  return posts;
};

function postsModerationFilter(foundPosts, currentUser){
  var posts = [];
  var postsLen = foundPosts.length;
  var clubLen = currentUser.userClubs.length;
  for(i=0;i<postsLen;i++){
    var moderation = foundPosts[i].moderation;
    //Exclusive
    if(moderation == 1){
      if(foundPosts[i].postAuthor.id.equals(currentUser._id)){
        posts.push(foundPosts[i]);
      } else if(clubLen){
        for(j=0;j<clubLen;j++){
          if(foundPosts[i].postClub._id.equals(currentUser.userClubs[j].id)){
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
      if(foundPosts[i].postAuthor.id.equals(currentUser._id)){
        posts.push(foundPosts[i]);
      } else if(clubLen){
        for(j=0;j<clubLen;j++){
          if((foundPosts[i].postClub._id.equals(currentUser.userClubs[j].id) && 
          0 <= currentUser.userClubs[j].rank && currentUser.userClubs[j].rank <= 1)){
            posts.push(foundPosts[i]);
          }
        }
      }
    }
  }
  return posts;
};