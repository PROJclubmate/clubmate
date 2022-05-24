const mongoose     = require('mongoose'),
  Post             = require('../models/post'),
  User             = require('../models/user'),
  Club             = require('../models/club'),
  Comment          = require('../models/comment'),
  Discussion       = require('../models/discussion'),
  Conversation     = require('../models/conversation'),
  ClubConversation = require('../models/club_conversation'),
  Message          = require('../models/message'),
  clConfig         = require('../config/cloudinary'),
  s3Config         = require('../config/s3'),
  logger           = require('../logger');

if(process.env.ENVIRONMENT === 'dev'){
  var cdn_prefix = 'https://res.cloudinary.com/dubirhea4/';
} else if (process.env.ENVIRONMENT === 'prod'){
  var cdn_prefix = 'https://d367cfssgkev4p.cloudfront.net/';
}
  


module.exports = {
  postsDiscoverSettings(req, res, next){
    if(req.user && req.user._id.equals(req.params.id)){
      if(req.body.discoverSwitch){
        User.updateOne({_id: req.params.id}, {$set: {discoverSwitch: req.body.discoverSwitch}}, 
        function(err){
        if(err){
          logger.error(req.user._id+' : (posts-1)updateUser err => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }
        });
      }
      if(req.body.sortByKey){
        User.updateOne({_id: req.params.id}, {$set: {sortByKey: req.body.sortByKey}}, 
        function(err){
        if(err){
          logger.error(req.user._id+' : (posts-2)updateUser err => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }
        });
      }
      return res.redirect('/discover');
    }
  },

  postsDiscover(req, res, next){
    if(req.user && req.user.discoverSwitch === 1){
      if(req.user.settings.showDiscoverChatlist === true){
        // Server render chats and notifications only, posts and stories will load on AJAX
        var clubConversationIds = req.user.userClubs.map(function(userClub){
          return userClub.conversationId;
        });
        var userConversationIds = req.user.userChats.map(function(userChat){
          return userChat.conversationId;
        });
        clubConversationIds = clubConversationIds.filter(function (el){
          return el != null;
        });
        userConversationIds = userConversationIds.filter(function (el){
          return el != null;
        });
        var notificationCount = 0;
        ClubConversation.find({_id: {$in: clubConversationIds}, isActive: true})
        .populate({path: 'clubId', select: 'name avatar avatarId'}).exec(function(err, foundClubConversations){
        if(err){
          logger.error(req.user._id+' : (chats-1)foundClubConversations err => '+err);
          req.flash('error', 'Something went wrong :(');
        } else{
          var lastOpenedChatListClub; var chatList = [];
          for(var i=0;i<foundClubConversations.length;i++){
            var obja = {};
            obja['type'] = 'club';
            obja['_id'] = foundClubConversations[i]._id;
            for(var j=0;j<foundClubConversations[i].seenMsgCursors.length;j++){
              if(foundClubConversations[i].seenMsgCursors[j].id.equals(req.user._id)){
                obja['seenMsgCursor'] = foundClubConversations[i].seenMsgCursors[j].cursor;
                if(foundClubConversations[i].messageCount > foundClubConversations[i].seenMsgCursors[j].cursor){
                  notificationCount++;
                }
                break;
              }
            }
            obja['id'] = foundClubConversations[i].clubId._id;
            obja['name'] = foundClubConversations[i].clubId.name;
            if(process.env.ENVIRONMENT === 'dev'){
              obja['image'] = clConfig.cloudinary.url(foundClubConversations[i].clubId.avatarId, clConfig.thumb_100_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              obja['image'] = s3Config.thumb_100_prefix+foundClubConversations[i].clubId.avatarId;
            }
            obja['lastMessage'] = foundClubConversations[i].lastMessage;
            obja['lastMsgOn'] = foundClubConversations[i].lastMsgOn;
            obja['lastMsgBy'] = foundClubConversations[i].lastMsgBy;
            obja['messageCount'] = foundClubConversations[i].messageCount;
            obja['bucketNum'] = foundClubConversations[i].bucketNum;
            obja['messageBuckets'] = foundClubConversations[i].messageBuckets.pop();
            chatList.push(obja);
            if(i==0){
              lastOpenedChatListClub = foundClubConversations[i].clubId._id;
            }
          }
          Conversation.find({_id: {$in: userConversationIds}})
          .populate({path: 'participants', select: 'fullName profilePic profilePicId userKeys'})
          .exec(function(err, foundUserConversations){
          if(err){
            logger.error(req.user._id+' : (chats-2)foundUserConversations err => '+err);
            req.flash('error', 'Something went wrong :(');
          } else{
            for(var i=0;i<foundUserConversations.length;i++){
              var objb = {};
              objb['type'] = 'user';
              objb['_id'] = foundUserConversations[i]._id;
              for(var j=0;j<foundUserConversations[i].seenMsgCursors.length;j++){
                if(foundUserConversations[i].seenMsgCursors[j].id.equals(req.user._id)){
                  objb['seenMsgCursor'] = foundUserConversations[i].seenMsgCursors[j].cursor;
                  if(foundUserConversations[i].messageCount > foundUserConversations[i].seenMsgCursors[j].cursor){
                    notificationCount++;
                  }
                }
              }
              for(var k=0;k<foundUserConversations[i].participants.length;k++){
                if(!foundUserConversations[i].participants[k]._id.equals(req.user._id)){
                  objb['id'] = foundUserConversations[i].participants[k].id;
                  objb['name'] = foundUserConversations[i].participants[k].fullName;
                  objb['userKeys'] = foundUserConversations[i].participants[k].userKeys;
                  if(process.env.ENVIRONMENT === 'dev'){
                    objb['image'] = clConfig.cloudinary.url(foundUserConversations[i].participants[k].profilePicId, clConfig.thumb_100_obj);
                  } else if (process.env.ENVIRONMENT === 'prod'){
                    objb['image'] = s3Config.thumb_100_prefix+foundUserConversations[i].participants[k].profilePicId;
                  }
                  break;
                }
              }
              objb['lastMessage'] = foundUserConversations[i].lastMessage;
              objb['lastMsgOn'] = foundUserConversations[i].lastMsgOn;
              objb['lastMsgBy'] = foundUserConversations[i].lastMsgBy;
              objb['messageCount'] = foundUserConversations[i].messageCount;
              objb['bucketNum'] = foundUserConversations[i].bucketNum;
              objb['messageBuckets'] = foundUserConversations[i].messageBuckets.pop();
              chatList.push(objb);
            }
            chatList.sort(function(a, b){
              return b.lastMsgOn - a.lastMsgOn;
            });
            if(req.user.lastOpenedChatListClub){
              lastOpenedChatListClub = req.user.lastOpenedChatListClub;
            }
            var chatType = null;
            res.render('posts/discover', {chatList, chatType, convClubId: null, recipientId: null, convClubId2: null, 
            recipientId2: null, notificationCount, lastOpenedChatListClub, currentUserId: req.user._id, cdn_prefix,
            showDiscoverChatlist: true, collegeName: req.user.userKeys.college});
            return User.updateOne({_id: req.user._id}, 
            {$set: {unreadChatsCount: notificationCount}, $currentDate: {lastActive: true}}, function(err){
            if(err){
              logger.error(req.user._id+' : (chats-3)updateUser err => '+err);
              req.flash('error', 'Something went wrong :(');
            }
            });
          }
          });
        }
        });
      } else{
        res.render('posts/discover', {currentUserId: req.user._id, cdn_prefix, collegeName: req.user.userKeys.college,
        showDiscoverChatlist: false});
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      }
    } else if(req.user && req.user.discoverSwitch === 2){
      res.render('posts/discover', {currentUserId: req.user._id, cdn_prefix, collegeName: req.user.userKeys.college,
      showDiscoverChatlist: false});
      return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
    } else{
      return res.render('posts/discover', {cdn_prefix});
    }
  },

  postsDiscoverMorePosts (req, res, next){
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
              {createdAt: {$gte: new Date(new Date() - (3*365*60*60*24*1000))}}, 
              {_id: {$nin: seenIds}}
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
            {$project: {
            "_id": 1,
            "type": 1,
            "description": 1,
            "hyperlink": 1,
            "descEdit": 1,
            "image": 1,
            "imageId": 1,
            "clubCollegeKey": 1,
            "viewsCount": 1,
            "privacy": 1,
            "moderation": 1,
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
            "upVoteCount": 1,
            "downVoteCount": 1,
            "upVoteUserIds": 1,
            "downVoteUserIds": 1,
            "subpostsCount": 1,
            "createdAt": 1,
            "__v": 1,
            // Based on (4000 views == 20 likes == 10 hearts == 1 comments & T = 4hr units)
            "ranking": {
              $divide: [
                { $add: [
                  { $multiply: ["$viewsCount", 0.00125] },
                  { $multiply: ["$likeCount", 0.25] },
                  { $multiply: ["$heartCount", 0.5] },
                  { $multiply: ["$commentsCount", 5] },
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
            logger.error(req.user._id+' : (posts-3)discoverPosts err => '+err);
            return res.sendStatus(500);
          } else{
            var posts = postsPrivacyFilter(discoverPosts, req.user);
            var modPosts = postsModerationFilter(posts, req.user);
            var arrLength = modPosts.length; var currentUser2 = req.user;
            var foundPostIds = modPosts.map(function(post){
              return post._id;
            });
            var hasVote = [], hasModVote = [], PC_50_clubAvatar = [], seenPostIds = [];
            for(var k=0;k<modPosts.length;k++){
              if(process.env.ENVIRONMENT === 'dev'){
                PC_50_clubAvatar[k] = clConfig.cloudinary.url(modPosts[k].postClub.avatarId, clConfig.thumb_100_obj);
              } else if (process.env.ENVIRONMENT === 'prod'){
                PC_50_clubAvatar[k] = s3Config.thumb_100_prefix+modPosts[k].postClub.avatarId;
              }
              hasVote[k] = voteCheck(req.user,modPosts[k]);
              hasModVote[k] = modVoteCheck(req.user,modPosts[k]);
              seenPostIds.push(modPosts[k]._id);
            }
            Post.updateMany({_id: {$in: seenPostIds}}, {$inc: {viewsCount: 1}},
            function(err){
              if(err){
                logger.error(req.user._id+' : (posts-4)updatePosts err => '+err);
                return res.sendStatus(500);
              }
            });
            if(process.env.ENVIRONMENT === 'dev'){
              var CU_50_profilePic = clConfig.cloudinary.url(req.user.profilePicId, clConfig.thumb_100_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              var CU_50_profilePic = s3Config.thumb_100_prefix+req.user.profilePicId;
            }
            res.json({hasVote, hasModVote, posts: modPosts, currentUser: currentUser2, 
            foundPostIds, CU_50_profilePic, PC_50_clubAvatar, arrLength, discoverSwitch: req.user.discoverSwitch, 
            csrfToken: res.locals.csrfToken, cdn_prefix});
            return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
          }
          });
        } else if(req.user.sortByKey === 2){
          Post.find({
            postClub: {$in: req.user.followingClubIds},
            createdAt: {$gte: new Date(new Date() - (3*365*60*60*24*1000))},
            _id: {$nin: seenIds}})
          .populate({path: 'postClub', select: 'name avatar avatarId'})
          .sort({createdAt: -1}).limit(20)
          .exec(function(err, discoverPosts){
          if(err || !discoverPosts){
            logger.error(req.user._id+' : (posts-5)discoverPosts err => '+err);
            return res.sendStatus(500);
          } else{
            var posts = postsPrivacyFilter(discoverPosts, req.user);
            var modPosts = postsModerationFilter(posts, req.user);
            var arrLength = modPosts.length; var currentUser2 = req.user;
            var foundPostIds = modPosts.map(function(post){
              return post._id;
            });
            var hasVote = [], hasModVote = [], PC_50_clubAvatar = [], seenPostIds = [];
            for(var k=0;k<modPosts.length;k++){
              if(process.env.ENVIRONMENT === 'dev'){
                PC_50_clubAvatar[k] = clConfig.cloudinary.url(modPosts[k].postClub.avatarId, clConfig.thumb_100_obj);
              } else if (process.env.ENVIRONMENT === 'prod'){
                PC_50_clubAvatar[k] = s3Config.thumb_100_prefix+modPosts[k].postClub.avatarId;
              }
              hasVote[k] = voteCheck(req.user,modPosts[k]);
              hasModVote[k] = modVoteCheck(req.user,modPosts[k]);
              seenPostIds.push(modPosts[k]._id);
            }
            Post.updateMany({_id: {$in: seenPostIds}}, {$inc: {viewsCount: 1}},
            function(err){
              if(err){
                logger.error(req.user._id+' : (posts-6)updatePosts err => '+err);
                return res.sendStatus(500);
              }
            });
            if(process.env.ENVIRONMENT === 'dev'){
              var CU_50_profilePic = clConfig.cloudinary.url(req.user.profilePicId, clConfig.thumb_100_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              var CU_50_profilePic = s3Config.thumb_100_prefix+req.user.profilePicId;
            }
            res.json({hasVote, hasModVote, posts: modPosts, currentUser: currentUser2, 
            foundPostIds, CU_50_profilePic, PC_50_clubAvatar, arrLength, discoverSwitch: req.user.discoverSwitch, 
            csrfToken: res.locals.csrfToken, cdn_prefix});
            return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
          }
          });
        } else if(req.user.sortByKey === 3){
          Post.aggregate([
            {$match: {$and: [
              {postClub: {$in: req.user.followingClubIds}},
              {createdAt: {$gte: new Date(new Date() - (3*365*60*60*24*1000))}}, 
              {_id: {$nin: seenIds}}
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
            {$project: {
            "_id": 1,
            "type": 1,
            "description": 1,
            "hyperlink": 1,
            "descEdit": 1,
            "image": 1,
            "imageId": 1,
            "clubCollegeKey": 1,
            "viewsCount": 1,
            "privacy": 1,
            "moderation": 1,
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
            "upVoteCount": 1,
            "downVoteCount": 1,
            "upVoteUserIds": 1,
            "downVoteUserIds": 1,
            "subpostsCount": 1,
            "createdAt": 1,
            "__v": 1,
            "ranking": {
              $add: [
                { $multiply: ["$viewsCount", 0.00125] },
                { $multiply: ["$likeCount", 0.25] },
                { $multiply: ["$heartCount", 0.5] },
                { $multiply: ["$commentsCount", 5] },
                0.75
              ]
            }}},
            {$sort: {"ranking": -1}},
            {$limit: 20}
          ])
          .exec(function(err, discoverPosts){
          if(err || !discoverPosts){
            logger.error(req.user._id+' : (posts-7)discoverPosts err => '+err);
            return res.sendStatus(500);
          } else{
            var posts = postsPrivacyFilter(discoverPosts, req.user);
            var modPosts = postsModerationFilter(posts, req.user);
            var arrLength = modPosts.length; var currentUser2 = req.user;
            var foundPostIds = modPosts.map(function(post){
              return post._id;
            });
            var hasVote = [], hasModVote = [], PC_50_clubAvatar = [], seenPostIds = [];
            for(var k=0;k<modPosts.length;k++){
              if(process.env.ENVIRONMENT === 'dev'){
                PC_50_clubAvatar[k] = clConfig.cloudinary.url(modPosts[k].postClub.avatarId, clConfig.thumb_100_obj);
              } else if (process.env.ENVIRONMENT === 'prod'){
                PC_50_clubAvatar[k] = s3Config.thumb_100_prefix+modPosts[k].postClub.avatarId;
              }
              hasVote[k] = voteCheck(req.user,modPosts[k]);
              hasModVote[k] = modVoteCheck(req.user,modPosts[k]);
              seenPostIds.push(modPosts[k]._id);
            }
            Post.updateMany({_id: {$in: seenPostIds}}, {$inc: {viewsCount: 1}},
            function(err){
              if(err){
                logger.error(req.user._id+' : (posts-8)updatePosts err => '+err);
                return res.sendStatus(500);
              }
            });
            if(process.env.ENVIRONMENT === 'dev'){
              var CU_50_profilePic = clConfig.cloudinary.url(req.user.profilePicId, clConfig.thumb_100_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              var CU_50_profilePic = s3Config.thumb_100_prefix+req.user.profilePicId;
            }
            res.json({hasVote, hasModVote, posts: modPosts, currentUser: currentUser2, 
            foundPostIds, CU_50_profilePic, PC_50_clubAvatar, arrLength, discoverSwitch: req.user.discoverSwitch, 
            csrfToken: res.locals.csrfToken, cdn_prefix});
            return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
          }
          });
        }
      // Show (Explore)
      } else if(req.user.discoverSwitch === 2){
        if(req.user.sortByKey === 1){
          Post.aggregate([
            {$match: {$and: [
              {createdAt: {$gte: new Date(new Date() - (3*365*60*60*24*1000))}}, 
              {_id: {$nin: seenIds}}, 
              {moderation: 0}, {privacy: 0}
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
            {$project: {
            "_id": 1,
            "type": 1,
            "description": 1,
            "hyperlink": 1,
            "descEdit": 1,
            "image": 1,
            "imageId": 1,
            "clubCollegeKey": 1,
            "viewsCount": 1,
            "privacy": 1,
            "moderation": 1,
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
                  { $multiply: ["$likeCount", 0.25] },
                  { $multiply: ["$heartCount", 0.5] },
                  { $multiply: ["$commentsCount", 5] },
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
            logger.error(req.user._id+' : (posts-9)discoverPosts err => '+err);
            return res.sendStatus(500);
          } else{
            var arrLength = discoverPosts.length; var currentUser2 = req.user;
            var foundPostIds = discoverPosts.map(function(post){
              return post._id;
            });
            var hasVote = [], hasModVote = [], PC_50_clubAvatar = [], seenPostIds = [];
            for(var k=0;k<discoverPosts.length;k++){
              if(process.env.ENVIRONMENT === 'dev'){
                PC_50_clubAvatar[k] = clConfig.cloudinary.url(discoverPosts[k].postClub.avatarId, clConfig.thumb_100_obj);
              } else if (process.env.ENVIRONMENT === 'prod'){
                PC_50_clubAvatar[k] = s3Config.thumb_100_prefix+discoverPosts[k].postClub.avatarId;
              }
              hasVote[k] = voteCheck(req.user,discoverPosts[k]);
              hasModVote[k] = modVoteCheck(req.user,discoverPosts[k]);
              seenPostIds.push(discoverPosts[k]._id);
            }
            Post.updateMany({_id: {$in: seenPostIds}}, {$inc: {viewsCount: 1}},
            function(err){
              if(err){
                logger.error(req.user._id+' : (posts-10)updatePosts err => '+err);
                return res.sendStatus(500);
              }
            });
            if(process.env.ENVIRONMENT === 'dev'){
              var CU_50_profilePic = clConfig.cloudinary.url(req.user.profilePicId, clConfig.thumb_100_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              var CU_50_profilePic = s3Config.thumb_100_prefix+req.user.profilePicId;
            }
            res.json({hasVote, hasModVote, posts: discoverPosts, currentUser: currentUser2, 
            foundPostIds, CU_50_profilePic, PC_50_clubAvatar, arrLength, discoverSwitch: req.user.discoverSwitch, 
            csrfToken: res.locals.csrfToken, cdn_prefix});
            return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
          }
          });
        } else if(req.user.sortByKey === 2){
          Post.find({
            createdAt: {$gte: new Date(new Date() - (3*365*60*60*24*1000))}, 
            _id: {$nin: seenIds}, 
            moderation: 0, privacy: 0})
          .populate({path: 'postClub', select: 'name avatar avatarId'})
          .sort({createdAt: -1}).limit(20)
          .exec(function(err, discoverPosts){
          if(err || !discoverPosts){
            logger.error(req.user._id+' : (posts-11)discoverPosts err => '+err);
            return res.sendStatus(500);
          } else{
            var arrLength = discoverPosts.length; var currentUser2 = req.user;
            var foundPostIds = discoverPosts.map(function(post){
              return post._id;
            });
            var hasVote = [], hasModVote = [], PC_50_clubAvatar = [], seenPostIds = [];
            for(var k=0;k<discoverPosts.length;k++){
              if(process.env.ENVIRONMENT === 'dev'){
                PC_50_clubAvatar[k] = clConfig.cloudinary.url(discoverPosts[k].postClub.avatarId, clConfig.thumb_100_obj);
              } else if (process.env.ENVIRONMENT === 'prod'){
                PC_50_clubAvatar[k] = s3Config.thumb_100_prefix+discoverPosts[k].postClub.avatarId;
              }
              hasVote[k] = voteCheck(req.user,discoverPosts[k]);
              hasModVote[k] = modVoteCheck(req.user,discoverPosts[k]);
              seenPostIds.push(discoverPosts[k]._id);
            }
            Post.updateMany({_id: {$in: seenPostIds}}, {$inc: {viewsCount: 1}},
            function(err){
              if(err){
                logger.error(req.user._id+' : (posts-12)updatePosts err => '+err);
                return res.sendStatus(500);
              }
            });
            if(process.env.ENVIRONMENT === 'dev'){
              var CU_50_profilePic = clConfig.cloudinary.url(req.user.profilePicId, clConfig.thumb_100_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              var CU_50_profilePic = s3Config.thumb_100_prefix+req.user.profilePicId;
            }
            res.json({hasVote, hasModVote, posts: discoverPosts, currentUser: currentUser2, 
            foundPostIds, CU_50_profilePic, PC_50_clubAvatar, arrLength, discoverSwitch: req.user.discoverSwitch, 
            csrfToken: res.locals.csrfToken, cdn_prefix});
            return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
          }
          });
        } else if(req.user.sortByKey === 3){
          Post.aggregate([
            {$match: {$and: [
              {createdAt: {$gte: new Date(new Date() - (3*365*60*60*24*1000))}}, 
              {_id: {$nin: seenIds}}, 
              {moderation: 0}, {privacy: 0}
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
            {$project: {
            "_id": 1,
            "type": 1,
            "description": 1,
            "hyperlink": 1,
            "descEdit": 1,
            "image": 1,
            "imageId": 1,
            "clubCollegeKey": 1,
            "viewsCount": 1,
            "privacy": 1,
            "moderation": 1,
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
                { $multiply: ["$likeCount", 0.25] },
                { $multiply: ["$heartCount", 0.5] },
                { $multiply: ["$commentsCount", 5] },
                0.75
              ]
            }}},
            {$sort: {"ranking": -1}},
            {$limit: 20}
          ])
          .exec(function(err, discoverPosts){
          if(err || !discoverPosts){
            logger.error(req.user._id+' : (posts-13)discoverPosts err => '+err);
            return res.sendStatus(500);
          } else{
            var arrLength = discoverPosts.length; var currentUser2 = req.user;
            var foundPostIds = discoverPosts.map(function(post){
              return post._id;
            });
            var hasVote = [], hasModVote = [], PC_50_clubAvatar = [], seenPostIds = [];
            for(var k=0;k<discoverPosts.length;k++){
              if(process.env.ENVIRONMENT === 'dev'){
                PC_50_clubAvatar[k] = clConfig.cloudinary.url(discoverPosts[k].postClub.avatarId, clConfig.thumb_100_obj);
              } else if (process.env.ENVIRONMENT === 'prod'){
                PC_50_clubAvatar[k] = s3Config.thumb_100_prefix+discoverPosts[k].postClub.avatarId;
              }
              hasVote[k] = voteCheck(req.user,discoverPosts[k]);
              hasModVote[k] = modVoteCheck(req.user,discoverPosts[k]);
              seenPostIds.push(discoverPosts[k]._id);
            }
            Post.updateMany({_id: {$in: seenPostIds}}, {$inc: {viewsCount: 1}},
            function(err){
              if(err){
                logger.error(req.user._id+' : (posts-14)updatePosts err => '+err);
                return res.sendStatus(500);
              }
            });
            if(process.env.ENVIRONMENT === 'dev'){
              var CU_50_profilePic = clConfig.cloudinary.url(req.user.profilePicId, clConfig.thumb_100_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              var CU_50_profilePic = s3Config.thumb_100_prefix+req.user.profilePicId;
            }
            res.json({hasVote, hasModVote, posts: discoverPosts, currentUser: currentUser2, 
            foundPostIds, CU_50_profilePic, PC_50_clubAvatar, arrLength, discoverSwitch: req.user.discoverSwitch, 
            csrfToken: res.locals.csrfToken, cdn_prefix});
            return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
          }
          });
        }
      }
    // LOGGED OUT
    } else{
      Post.aggregate([
        {$match: {$and: [
          {createdAt: {$gte: new Date(new Date() - (3*365*60*60*24*1000))}}, 
          {_id: {$nin: seenIds}}, 
          {moderation: 0}, {privacy: 0}
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
        {$project: {
        "_id": 1,
        "type": 1,
        "description": 1,
        "hyperlink": 1,
        "descEdit": 1,
        "image": 1,
        "imageId": 1,
        "clubCollegeKey": 1,
        "viewsCount": 1,
        "privacy": 1,
        "moderation": 1,
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
              { $multiply: ["$likeCount", 0.25] },
              { $multiply: ["$heartCount", 0.5] },
              { $multiply: ["$commentsCount", 5] },
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
        logger.error(req.user._id+' : (posts-15)discoverPosts err => '+err);
        return res.sendStatus(500);
      } else{
        var arrLength = discoverPosts.length;
        var foundPostIds = discoverPosts.map(function(post){
          return post._id;
        });
        var hasVote = [], hasModVote = [], PC_50_clubAvatar = [], seenPostIds = [];
        for(var k=0;k<discoverPosts.length;k++){
          if(process.env.ENVIRONMENT === 'dev'){
            PC_50_clubAvatar[k] = clConfig.cloudinary.url(discoverPosts[k].postClub.avatarId, clConfig.thumb_100_obj);
          } else if (process.env.ENVIRONMENT === 'prod'){
            PC_50_clubAvatar[k] = s3Config.thumb_100_prefix+discoverPosts[k].postClub.avatarId;
          }
          hasVote[k] = voteCheck(req.user,discoverPosts[k]);
          hasModVote[k] = modVoteCheck(req.user,discoverPosts[k]);
          seenPostIds.push(discoverPosts[k]._id);
        }
        Post.updateMany({_id: {$in: seenPostIds}}, {$inc: {viewsCount: 1}},
        function(err){
          if(err){
            logger.error(req.user._id+' : (posts-16)updatePosts err => '+err);
            return res.sendStatus(500);
          }
        });
        return res.json({hasVote, hasModVote, posts: discoverPosts, foundPostIds, 
        PC_50_clubAvatar, arrLength, discoverSwitch: 2, csrfToken: res.locals.csrfToken, cdn_prefix});
      }
      });
    }
  },

  postsCreate(req, res, next){
    var rank = currentRank2(req.params.club_id,req.user.userClubs);
    // Every club member can create a post (with & without topic)
    if(0<=rank && rank<=2){
      if(req.file){
        if(req.body.privacy && (((req.body.topic != '') && (1<=req.body.privacy && req.body.privacy<=5)) || 
        ((req.body.topic == '') && (0<=req.body.privacy && req.body.privacy<=5)))){
          (async () => {
            try{
              if(process.env.ENVIRONMENT === 'dev'){
                var result = await clConfig.cloudinary.v2.uploader.upload(req.file.path, clConfig.postImages_1080_obj);
                req.body.image = result.secure_url;
                req.body.imageId = result.public_id;
              } else if (process.env.ENVIRONMENT === 'prod'){
                var result = await s3Config.uploadFile(req.file, 'postImages/', 1080);
                s3Config.removeTmpUpload(req.file.path);
                req.body.image = result.Location;
                req.body.imageId = result.Key;
              }
            } catch(err){
              logger.error(req.user._id+' : (posts-17)imageUpload err => '+err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
            req.body.moderation = 1;
            Club.findById(req.params.club_id).select({clubKeys: 1}).exec(function(err, foundClub){
            if(err || !foundClub){
              logger.error(req.user._id+' : (posts-18)foundClub err => '+err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            } else{
              Post.create(req.body, function(err, newPost){
              if(err || !newPost){
                logger.error(req.user._id+' : (posts-19)newPost err => '+err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              } else{
                if(req.body.topic == ''){
                  newPost.type = 'simple';
                } else{
                  newPost.type = 'topic';
                }
                newPost.clubCollegeKey = foundClub.clubKeys.college;
                newPost.clubCategory = foundClub.clubKeys.category;
                newPost.postClub = foundClub._id;
                newPost.postAuthor.id = req.user._id;
                newPost.postAuthor.authorName = req.user.fullName;
                newPost.save(function(err, newPost){
                if(err || !newPost){
                  logger.error(req.user._id+' : (posts-20)newPost err => '+err);
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
          })();
        } else{
          req.flash('error', 'Please enter a valid post privacy setting');
          return res.redirect('back');
        }
      } else{
        if(req.body.privacy && (((req.body.topic != '') && (1<=req.body.privacy && req.body.privacy<=5)) || 
        ((req.body.topic == '') && (0<=req.body.privacy && req.body.privacy<=5)))){
          req.body.moderation = 1;
          Club.findById(req.params.club_id).select({clubKeys: 1}).exec(function(err, foundClub){
          if(err || !foundClub){
            logger.error(req.user._id+' : (posts-21)foundClub err => '+err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          } else{
            Post.create(req.body, function(err, newPost){
            if(err || !newPost){
              logger.error(req.user._id+' : (posts-22)newPost err => '+err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            } else{
              if(req.body.topic == ''){
                newPost.type = 'simple';
              } else{
                newPost.type = 'topic';
              }
              newPost.clubCollegeKey = foundClub.clubKeys.college;
              newPost.clubCategory = foundClub.clubKeys.category;
              newPost.postClub = foundClub._id;
              newPost.postAuthor.id = req.user._id;
              newPost.postAuthor.authorName = req.user.fullName;
              newPost.save(function(err, newPost){
              if(err || !newPost){
                logger.error(req.user._id+' : (posts-23)newPost err => '+err);
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

  postsView(req, res, next){
    if(req.user){
      Post.findByIdAndUpdate(req.params.post_id, {$inc: {viewsCount: 5}})
      .populate({path: 'postClub', select: 'name avatar avatarId clubUsers'}).exec(function (err, foundPost){
      if(err || !foundPost){
        logger.error(req.user._id+' : (posts-24)foundPost err => '+err);
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        // Post.find({postClub: mongoose.Types.ObjectId('5e1b005b24c9073d37df4b02')}, function(err, item){
        //   for(i = 0; i != item.length; i++){
        //     Post.find({_id: item[i]._id}, function(err, foundONEPost){
        //       if(!foundONEPost[0].clubCollegeKey || foundONEPost[0].clubCollegeKey == ''){
        //         foundONEPost[0].clubCollegeKey = req.user.userKeys.college;
        //         console.log(JSON.stringify(foundONEPost[0], null, 2))
        //         foundONEPost[0].save();
        //       }
        //     });
        //   }
        // });
        var unfilteredPost = [];
        unfilteredPost.push(foundPost);
        var post = postsPrivacyFilter(unfilteredPost, req.user);
        var modPost = postsModerationFilter(post, req.user);
        if(modPost.length){
          var modPost = modPost[0];
          if(process.env.ENVIRONMENT === 'dev'){
            var PC_50_clubAvatar = clConfig.cloudinary.url(modPost.postClub.avatarId, clConfig.thumb_100_obj);
          } else if (process.env.ENVIRONMENT === 'prod'){
            var PC_50_clubAvatar = s3Config.thumb_100_prefix+modPost.postClub.avatarId;
          }
          var hasVote = voteCheck(req.user,modPost);
          var hasModVote = modVoteCheck(req.user,modPost);
          for(var i=0;i<req.user.userClubs.length;i++){
            if(req.user.userClubs[i].id.equals(req.params.club_id)){
              var rank = req.user.userClubs[i].rank;
              break;
            }
          }
          Post.find({postClub: foundPost.postClub._id, type: 'topic', createdAt: {$gt:new Date(Date.now() - 7*24*60*60 * 1000)}})
          .select({type: 1, topic: 1, image: 1, imageId: 1, subpostsCount: 1, upVoteCount: 1, downVoteCount: 1, moderation: 1,
          postAuthor: 1, postClub: 1}).sort({upVoteCount: -1}).limit(10).exec(function(err, topTopicPosts){
          if(err || !topTopicPosts){
          logger.error(req.user._id+' : (posts-25)topTopicPosts err => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
          } else{
            var modTopTopicPosts = postsModerationFilter(topTopicPosts, req.user), Posts_50_Image = [];
            for(var l=0;l<modTopTopicPosts.length;l++){
              if(modTopTopicPosts[l].imageId && modTopTopicPosts[l].imageId != ''){
                if(process.env.ENVIRONMENT === 'dev'){
                  Posts_50_Image[l] = clConfig.cloudinary.url(modTopTopicPosts[l].imageId, clConfig.thumb_100_obj);
                } else if (process.env.ENVIRONMENT === 'prod'){
                  Posts_50_Image[l] = s3Config.thumb_100_prefix+modTopTopicPosts[l].imageId;
                }
              } else{
                Posts_50_Image[l] = null;
              }
            }
            if(modPost.type == 'simple'){
              var lastTwoBuckets = [], len = modPost.commentBuckets.length;
              lastTwoBuckets.push(modPost.commentBuckets[len-1]);
              lastTwoBuckets.push(modPost.commentBuckets[len-2]);
              Comment.find({_id: {$in: lastTwoBuckets}})
              .populate({path: 'comments.commentAuthor.id', select: 'fullName profilePic profilePicId userKeys'})
              .exec(function(err, foundBuckets){
              if(err || !foundBuckets){
                logger.error(req.user._id+' : (posts-26)foundBuckets err => '+err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              } else{
                var CA_50_profilePic = [], bucketsNum = foundBuckets.length;
                for(var i=0;i<bucketsNum;i++){
                  foundBuckets[i].comments.sort(function(a, b){
                    return a.likeCount - b.likeCount;
                  });
                }
                for(var i=0;i<bucketsNum;i++){
                  CA_50_profilePic[i] = [];
                  for(var j=0;j<foundBuckets[i].comments.length;j++){
                    if(process.env.ENVIRONMENT === 'dev'){
                      CA_50_profilePic[i][j] = clConfig.cloudinary.url(foundBuckets[i].comments[j].commentAuthor.id.profilePicId, clConfig.thumb_100_obj);
                    } else if (process.env.ENVIRONMENT === 'prod'){
                      CA_50_profilePic[i][j] = s3Config.thumb_100_prefix+foundBuckets[i].comments[j].commentAuthor.id.profilePicId;
                    }
                  }
                }
                var index = len-3;
                if(req.user){
                  var likedComments = commentCheck(req.user._id,foundBuckets);
                  if(process.env.ENVIRONMENT === 'dev'){
                    var CU_50_profilePic = clConfig.cloudinary.url(req.user.profilePicId, clConfig.thumb_100_obj);
                  } else if (process.env.ENVIRONMENT === 'prod'){
                    var CU_50_profilePic = s3Config.thumb_100_prefix+req.user.profilePicId;
                  }
                } else{
                  var likedComments = [];
                  var CU_50_profilePic = null;
                }
                res.render("posts/show", {hasVote, hasModVote, post: modPost, likedComments, rank, buckets: foundBuckets,
                index, CU_50_profilePic, PC_50_clubAvatar, CA_50_profilePic, Posts_50_Image, 
                clubId: foundPost.postClub._id, topTopicPosts: modTopTopicPosts, clubPage: false, cdn_prefix});
                return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
              }
              });
            } else if(modPost.type == 'topic'){
              if(process.env.ENVIRONMENT === 'dev'){
                var CU_50_profilePic = clConfig.cloudinary.url(req.user.profilePicId, clConfig.thumb_100_obj);
              } else if (process.env.ENVIRONMENT === 'prod'){
                var CU_50_profilePic = s3Config.thumb_100_prefix+req.user.profilePicId;
              }
              if(modPost.subpostBuckets != ''){
                var len = index = modPost.subpostBuckets.length;
                Discussion.findOne({_id: modPost.subpostBuckets[len-1]})
                .populate({path: 'subPosts.subPostAuthor.id', select: 'fullName profilePic profilePicId userKeys'})
                .exec(function(err, foundBucket){
                if(err || !foundBucket){
                  logger.error(req.user._id+' : (posts-27)foundBucket err => '+err);
                  req.flash('error', 'Something went wrong :(');
                  return res.redirect('back');
                } else{
                  var sPA_50_profilePic = [];
                  for(var j=0;j<foundBucket.subPosts.length;j++){
                    if(process.env.ENVIRONMENT === 'dev'){
                      sPA_50_profilePic[j] = clConfig.cloudinary.url(foundBucket.subPosts[j].subPostAuthor.id.profilePicId, clConfig.thumb_100_obj);
                    } else if (process.env.ENVIRONMENT === 'prod'){
                      sPA_50_profilePic[j] = s3Config.thumb_100_prefix+foundBucket.subPosts[j].subPostAuthor.id.profilePicId;
                    }
                  }
                  var subVotes = subVoteCheck(req.user._id,foundBucket);
                  var quote = false;
                  res.render("posts/show", {hasVote, hasModVote, post: modPost, subVotes, rank, bucket: foundBucket,
                  index, CU_50_profilePic, PC_50_clubAvatar, sPA_50_profilePic, quote, clubId: foundPost.postClub._id,
                  Posts_50_Image, topTopicPosts: modTopTopicPosts, clubPage: false, cdn_prefix});
                  return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
                }
                });
              } else{
                var quote = false;
                res.render("posts/show", {hasVote, hasModVote, post: modPost, rank, CU_50_profilePic, 
                PC_50_clubAvatar, quote, clubId: foundPost.postClub._id, Posts_50_Image,
                topTopicPosts: modTopTopicPosts, clubPage: false, cdn_prefix});
                return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
              }
            }
          }
          });
        }
      }
      });
    } else{
      Post.findOne({_id: req.params.post_id, moderation: 0, privacy: 0})
      .populate({path: 'postClub', select: 'name avatar avatarId clubUsers'}).exec(function (err, foundPost){
      if(err || !foundPost){
        logger.error('(posts-28)foundPost err => '+err);
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        if(process.env.ENVIRONMENT === 'dev'){
          var PC_50_clubAvatar = clConfig.cloudinary.url(foundPost.postClub.avatarId, clConfig.thumb_100_obj);
        } else if (process.env.ENVIRONMENT === 'prod'){
          var PC_50_clubAvatar = s3Config.thumb_100_prefix+foundPost.postClub.avatarId;
        }
        var hasVote = null;
        var hasModVote = null;
        var rank = null;
        if(foundPost.type == 'simple'){
          var lastTwoBuckets = [], len = foundPost.commentBuckets.length;
          lastTwoBuckets.push(foundPost.commentBuckets[len-1]);
          lastTwoBuckets.push(foundPost.commentBuckets[len-2]);
          Comment.find({_id: {$in: lastTwoBuckets}})
          .populate({path: 'comments.commentAuthor.id', select: 'fullName profilePic profilePicId userKeys'})
          .exec(function(err, foundBuckets){
          if(err || !foundBuckets){
            logger.error('(posts-29)foundBuckets err => '+err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          } else{
            var CA_50_profilePic = [], bucketsNum = foundBuckets.length;
            for(var i=0;i<bucketsNum;i++){
              foundBuckets[i].comments.sort(function(a, b){
                return a.likeCount - b.likeCount;
              });
            }
            for(var i=0;i<bucketsNum;i++){
              CA_50_profilePic[i] = [];
              for(var j=0;j<foundBuckets[i].comments.length;j++){
                if(process.env.ENVIRONMENT === 'dev'){
                  CA_50_profilePic[i][j] = clConfig.cloudinary.url(foundBuckets[i].comments[j].commentAuthor.id.profilePicId, clConfig.thumb_100_obj);
                } else if (process.env.ENVIRONMENT === 'prod'){
                  CA_50_profilePic[i][j] = s3Config.thumb_100_prefix+foundBuckets[i].comments[j].commentAuthor.id.profilePicId;
                }
              }
            }
            var index = len-3;
            var likedComments = [];
            var CU_50_profilePic = null;
            return res.render("posts/show", {hasVote, hasModVote, post: foundPost, likedComments, rank, buckets: foundBuckets,
            index, CU_50_profilePic, PC_50_clubAvatar, CA_50_profilePic, clubId: foundPost.postClub._id, cdn_prefix});
          }
          });
        } else if(foundPost.type == 'topic'){
          var CU_50_profilePic = null;
          var rank = null;
          if(foundPost.subpostBuckets != ''){
            var len = index = foundPost.subpostBuckets.length;
            Discussion.findOne({_id: foundPost.subpostBuckets[len-1]})
            .populate({path: 'subPosts.subPostAuthor.id', select: 'fullName profilePic profilePicId userKeys'})
            .exec(function(err, foundBucket){
            if(err || !foundBucket){
              logger.error(req.user._id+' : (posts-27)foundBucket err => '+err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            } else{
              var sPA_50_profilePic = [];
              for(var j=0;j<foundBucket.subPosts.length;j++){
                if(process.env.ENVIRONMENT === 'dev'){
                  sPA_50_profilePic[j] = clConfig.cloudinary.url(foundBucket.subPosts[j].subPostAuthor.id.profilePicId, clConfig.thumb_100_obj);
                } else if (process.env.ENVIRONMENT === 'prod'){
                  sPA_50_profilePic[j] = s3Config.thumb_100_prefix+foundBucket.subPosts[j].subPostAuthor.id.profilePicId;
                }
              }
              var subVotes = [];
              var quote = false;
              res.render("posts/show", {hasVote, hasModVote, post: foundPost, subVotes, rank, bucket: foundBucket,
              index, CU_50_profilePic, PC_50_clubAvatar, sPA_50_profilePic, quote, clubId: foundPost.postClub._id,
              Posts_50_Image: null, topTopicPosts: null, clubPage: false, cdn_prefix});
            }
            });
          } else{
            var quote = false;
            res.render("posts/show", {hasVote, hasModVote, post: foundPost, rank, CU_50_profilePic, 
            PC_50_clubAvatar, quote, clubId: foundPost.postClub._id, Posts_50_Image: null,
            topTopicPosts: null, clubPage: false, cdn_prefix});
          }
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
        logger.error(req.user._id+' : (posts-30)foundPost err => '+err);
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        if(process.env.ENVIRONMENT === 'dev'){
          var PC_50_clubAvatar = clConfig.cloudinary.url(foundPost.postClub.avatarId, clConfig.thumb_100_obj);
        } else if (process.env.ENVIRONMENT === 'prod'){
          var PC_50_clubAvatar = s3Config.thumb_100_prefix+foundPost.postClub.avatarId;
        }
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
        if(foundPost.type == 'topic' && req.user){
          if(process.env.ENVIRONMENT === 'dev'){
            var CU_50_profilePic = clConfig.cloudinary.url(req.user.profilePicId, clConfig.thumb_100_obj);
          } else if (process.env.ENVIRONMENT === 'prod'){
            var CU_50_profilePic = s3Config.thumb_100_prefix+req.user.profilePicId;
          }
          if(foundPost.subpostBuckets != ''){
            var len = index = foundPost.subpostBuckets.length;
            Discussion.findOne({_id: foundPost.subpostBuckets[len-1]})
            .populate({path: 'subPosts.subPostAuthor.id', select: 'fullName profilePic profilePicId userKeys'})
            .exec(function(err, foundBucket){
            if(err || !foundBucket){
              logger.error(req.user._id+' : (posts-31)foundBucket err => '+err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            } else{
              var sPA_50_profilePic = [];
              for(var j=0;j<foundBucket.subPosts.length;j++){
                if(process.env.ENVIRONMENT === 'dev'){
                  sPA_50_profilePic[j] = clConfig.cloudinary.url(foundBucket.subPosts[j].subPostAuthor.id.profilePicId, clConfig.thumb_100_obj);
                } else if (process.env.ENVIRONMENT === 'prod'){
                  sPA_50_profilePic[j] = s3Config.thumb_100_prefix+foundBucket.subPosts[j].subPostAuthor.id.profilePicId;
                }
              }
              var subVotes = subVoteCheck(req.user._id,foundBucket);
              Discussion.findOne({_id: req.params.bucket_id}, function(err, foundQuoteBucket){
              if(err || !foundQuoteBucket){
                logger.error(req.user._id+' : (posts-32)foundQuoteBucket err => '+err);
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
                topTopicPosts: '', clubPage: false, quoteText, quoteNum, quote, cdn_prefix});
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
      logger.error(req.user._id+' : (posts-33)foundPost err => '+err);
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
      logger.error(req.user._id+' : (posts-34)foundPost err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      if(foundPost.postAuthor.id.equals(req.user._id)){
        if(foundPost.image && foundPost.imageId){
          try{
            if(process.env.ENVIRONMENT === 'dev'){
              clConfig.cloudinary.v2.uploader.destroy(foundPost.imageId);
            } else if (process.env.ENVIRONMENT === 'prod'){
              s3Config.deleteFile(foundPost.imageId);
            }
            foundPost.remove();
            //deletes all comments associated with the post
            Comment.deleteMany({postId: foundPost._id}, function(err){
              if(err){
                logger.error(req.user._id+' : (posts-35)foundComment err => '+err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }
            });
            Discussion.deleteMany({postId: foundPost._id}, function(err){
              if(err){
                logger.error(req.user._id+' : (posts-36)foundDiscussion err => '+err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }
            });
            req.flash('success', 'Post deleted successfully!');
            res.redirect('back');
          }catch(err){
            logger.error(req.user._id+' : (posts-37)foundPost catch err => '+err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }
        } else{
          foundPost.remove();
          Comment.deleteMany({postId: foundPost._id}, function(err){
            if(err){
              logger.error(req.user._id+' : (posts-38)foundComment err => '+err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          });
          Discussion.deleteMany({postId: foundPost._id}, function(err){
            if(err){
              logger.error(req.user._id+' : (posts-39)foundDiscussion err => '+err);
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
        logger.error(req.user._id+' : (posts-40)foundPost err => '+err);
        return res.sendStatus(500);
      } else{
        var isAdmin = checkRank(foundPost.postClub.clubUsers,req.user._id,1);
        if(isAdmin){
          if(req.body.exclusive){
            foundPost.moderation = parseInt(req.body.exclusive);
            foundPost.save();
            res.json({foundPost, csrfToken: res.locals.csrfToken, cdn_prefix});
          }
          if(req.body.published){
            foundPost.moderation = parseInt(req.body.published);
            foundPost.save();
            res.json({foundPost, csrfToken: res.locals.csrfToken, cdn_prefix});
          }
          if(req.body.visibility){
            foundPost.moderation = parseInt(req.body.visibility);
            foundPost.save();
            res.json({foundPost, csrfToken: res.locals.csrfToken, cdn_prefix});
          }
        }
      }
      });
      return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
    } else{
      Post.findById(req.params.post_id, function(err, foundPost){
      if(err || !foundPost){
        logger.error(req.user._id+' : (posts-41)foundPost err => '+err);
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
              User.updateOne({_id: req.user._id},{$pull: {postHearts: foundPost._id}}, function(err){
                if(err){
                  logger.error(req.user._id+' : (posts-42)updateUser err => '+err);
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
          res.json({foundPost, csrfToken: res.locals.csrfToken, cdn_prefix});
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
            User.updateOne({_id: req.user._id},{$pull: {postHearts: foundPost._id}}, function(err){
              if(err){
                logger.error(req.user._id+' : (posts-43)updateUser err => '+err);
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
            User.updateOne({_id: req.user._id},{$push: {postHearts: foundPost._id}}, function(err){
              if(err){
                logger.error(req.user._id+' : (posts-44)updateUser err => '+err);
                return res.sendStatus(500);
              }
            });
          }
          foundPost.save();
          res.json({foundPost, csrfToken: res.locals.csrfToken, cdn_prefix});
          return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
        }
      }
      });
    }
  },

  postsModVote(req, res, next){
    Post.findById(req.params.post_id, function(err, foundPost){
    if(err || !foundPost){
      logger.error(req.user._id+' : (posts-45)foundPost err => '+err);
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
        res.json({foundPost, csrfToken: res.locals.csrfToken, cdn_prefix});
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
        res.json({foundPost, csrfToken: res.locals.csrfToken, cdn_prefix});
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      }
    }
    });
  }
}

//*************FUNCTIONS**************
function checkRank(clubUsers,userId,rank){
  var ok = false;
  clubUsers.forEach(function(user){
    if(user.id.equals(userId) && user.userRank <= rank){
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
        return (a.likeCount) - (b.likeCount);
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
    //Club Exclusive
    if(privacy == 2){
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
    //Private
    if(privacy == 3){
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