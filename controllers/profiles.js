const passport     = require('passport'),
  User             = require('../models/user'),
  Club             = require('../models/club'),
  Post             = require('../models/post'),
  CollegePage      = require('../models/college-page'),
  Conversation     = require('../models/conversation'),
  ClubConversation = require('../models/club-conversation'),
  Token            = require('../models/token'),
  clConfig         = require('../config/cloudinary'),
  s3Config         = require('../config/s3'),
  logger           = require('../logger'),
  async            = require('async'),
  nodemailer       = require('nodemailer'),
  crypto           = require('crypto'),
  mongoose         = require('mongoose'),
  moment           = require('moment'),
  mbxGeocoding     = require('@mapbox/mapbox-sdk/services/geocoding'),
  geocodingClient  = mbxGeocoding({ accessToken: process.env.MAPBOX_TOKEN });

if(process.env.ENVIRONMENT === 'dev'){
  var cdn_prefix = 'https://res.cloudinary.com/dubirhea4/';
} else if (process.env.ENVIRONMENT === 'prod'){
  var cdn_prefix = 'https://d367cfssgkev4p.cloudfront.net/';
}


module.exports = {
  profilesUserProfile(req, res, next){
    if(req.user && !req.user._id.equals(req.params.id)){
      User.findById(req.params.id).populate({path: 'userClubs.id', select: 'name avatar avatarId'})
      .populate({path: 'clubInvites', select: 'name clubUsers'})
      .exec(function(err, foundUser){
      if(err || !foundUser){
        logger.error(req.user._id+' : (profiles-1)foundUser err => '+err);
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        var currentUserFriends = req.user.friends;
        var friends = foundUser.friends.reverse();
        User.aggregate([
          {$match: {$and: [
            {_id: {$in: friends}}, 
            {_id: {$in: currentUserFriends}}
          ]}},
          {$addFields: {"__order": {$indexOfArray: [friends, "$_id" ]}}},
          {$sort: {"__order": 1}},
          {$project :{fullName: 1, profilePic: 1, profilePicId: 1}},
          {$limit: 4}
          ])
        .exec(function(err, foundFriends){
        if(err || !foundUser){
          logger.error(req.user._id+' : (profiles-2)foundUser err => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          var currentUser = req.user;
          // Is conversation initiated/NOT..?
          var hasConversation = false, isBlocked = false, isBlockedByFoundUser = false, match = false;
          var conversationId = '', recipientId = '';
          if(foundUser.userChats.length != 0){
            for(var i=0;i<foundUser.userChats.length;i++){
              if(foundUser.userChats[i].userId.equals(req.user._id)){
                var hasConversation = true;
                var conversationId = foundUser.userChats[i].conversationId;
                break;
              }
            }
          } else{hasConversation = false};
          // requests(Friends/Club Invites)
          var adminClubs = []; var clubInvites = []; var mutualClubs = [];
          var fUcIlength = foundUser.clubInvites.length;
          var fUuClength = foundUser.userClubs.length;
          var cUuClength = currentUser.userClubs.length;
          var sentRequest = contains(foundUser.friendRequests,currentUser._id);
          var haveRequest = contains(currentUser.friendRequests,foundUser._id);
          var isFriend = contains(currentUser.friends,foundUser._id);
          var clubCount = foundUser.userClubs.length;
          if(isFriend){
            var clubs = foundUser.userClubs.sort(function(a, b) {
              return parseFloat(a.rank) - parseFloat(b.rank);
            });
            var Clubs_50_clubAvatar = [];
            // If friend, then show 10 server rendered clubs under Clubs Tab
            var limitedClubs = clubs.slice(0,9);
            for(var k=0;k<limitedClubs.length;k++){
              if(process.env.ENVIRONMENT === 'dev'){
                Clubs_50_clubAvatar[k] = clConfig.cloudinary.url(limitedClubs[k].id.avatarId, clConfig.thumb_100_obj);
              } else if (process.env.ENVIRONMENT === 'prod'){
                Clubs_50_clubAvatar[k] = s3Config.thumb_100_prefix+limitedClubs[k].id.avatarId;
              }
            }
          } else{
            var clubs = [], Clubs_50_clubAvatar = [];
          }
          // cU userClubs loop
          for(var i=0;i<cUuClength;i++){
            var rank = currentUser.userClubs[i].rank; var inClub = false; var isInvited = false;
            if(fUuClength != 0){
              // fU userClubs loop
              for(var j=0;j<fUuClength;j++){
                if(foundUser.userClubs[j].id._id.equals(currentUser.userClubs[i].id._id)){
                  // MUTUAL CLUBS
                  inClub = true;
                  var objc = {};
                  objc['_id'] = currentUser.userClubs[i].id;
                  objc['name'] = currentUser.userClubs[i].clubName;
                  mutualClubs.push(objc);
                }
              }
            } else if(fUuClength == 0){inClub = false};
            for(var j=0;j<fUcIlength;j++){
              if(foundUser.clubInvites[j]._id.equals(currentUser.userClubs[i].id._id)){
                isInvited = true;
                break;
              }
            }
            // adminClubs ~ Clubs in which currUser has Admin priv. to INVITE foundUser
            if(0 <= rank && rank <= 1 && isInvited == false && inClub == false){
              var obja = {};
              obja['_id'] = currentUser.userClubs[i].id;
              obja['name'] = currentUser.userClubs[i].clubName;
              adminClubs.push(obja);
            }
            // clubInvites ~ Clubs which foundUser has been invited to 'CANCEL INV'
            if(fUcIlength != 0){
              for(var j=0;j<fUcIlength;j++){
                var fUcIcUlength = foundUser.clubInvites[j].clubUsers.length;
                for(var k=0;k<fUcIcUlength;k++){
                  if(foundUser.clubInvites[j]._id.equals(currentUser.userClubs[i].id._id) && 
                  foundUser.clubInvites[j].clubUsers[k].id.equals(currentUser._id) && 
                  foundUser.clubInvites[j].clubUsers[k].userRank <= 1){
                    var objb = {};
                    objb['_id'] = currentUser.userClubs[i].id;
                    objb['name'] = currentUser.userClubs[i].clubName;
                    clubInvites.push(objb);
                  }
                }
              }
            }
          }
          var Friends_100_profilePic = [];
          for(var l=0;l<foundFriends.length;l++){
            if(process.env.ENVIRONMENT === 'dev'){
              Friends_100_profilePic[l] = clConfig.cloudinary.url(foundFriends[l].profilePicId, clConfig.thumb_200_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              Friends_100_profilePic[l] = s3Config.thumb_200_prefix+foundFriends[l].profilePicId;
            }
          }
          var wasActiveMinuteago = foundUser.lastActive >= (new Date() - 120*1000);
          var wasActiveToday = foundUser.lastActive >= (new Date() - 24*3600*1000);
          if(hasConversation == true){
            Conversation.findOne({_id: conversationId}, function(err, foundConversation){
            if(err || !foundConversation){
              logger.error(req.user._id+' : (profiles-3)foundConversation err => '+err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            } else{
              if(foundConversation.isBlocked){
                var isBlocked = true;
                if(foundConversation.blockedBy.equals(foundUser._id)){
                  var isBlockedByFoundUser = true;
                } else{
                  var isBlockedByFoundUser = false;
                }
              } else{
                var isBlocked = false;
                var isBlockedByFoundUser = false;
              }
              res.render('users/show', {haveRequest, sentRequest, isFriend, user: foundUser,
              clubs: limitedClubs, match, adminClubs, clubInvites, mutualClubs, conversationId, recipientId,
              foundFriends, Clubs_50_clubAvatar, clubCount, isBlocked, isBlockedByFoundUser, Friends_100_profilePic, 
              wasActiveMinuteago, wasActiveToday, cdn_prefix});
              return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
            }
            });
          } else{
            var recipientId = foundUser._id;
            res.render('users/show', {haveRequest, sentRequest, isFriend, user: foundUser,
            clubs: limitedClubs, match, adminClubs, clubInvites, mutualClubs, conversationId, recipientId,
            foundFriends, Clubs_50_clubAvatar, clubCount, isBlocked, isBlockedByFoundUser, Friends_100_profilePic, 
            wasActiveMinuteago, wasActiveToday, cdn_prefix});
            return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
          }
        }
        });
      }
      });
    } else if(req.user && req.user._id.equals(req.params.id)){
      User.findById(req.params.id).populate({path: 'userClubs.id', select: 'name avatar avatarId'})
      .populate({path: 'clubInvites', select: 'name clubUsers'})
      .exec(function(err, foundUser){
      if(err || !foundUser){
        logger.error(req.user._id+' : (profiles-4)foundUser err => '+err);
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        var friends = foundUser.friends.reverse();
        // Show friends made in order of latest(4)
        User.aggregate([
          {$match: {_id: {$in: friends}}},
          {$addFields: {"__order": {$indexOfArray: [friends, "$_id" ]}}},
          {$sort: {"__order": 1}},
          {$project :{fullName: 1, profilePic: 1, profilePicId: 1}},
          {$limit: 4}
          ])
        .exec(function(err, foundFriends){
        if(err || !foundUser){
          logger.error(req.user._id+' : (profiles-5)foundUser err => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          var currentUser = req.user;
          var hasConversation = false, isBlocked = false, isBlockedByFoundUser = false, match = true;
          var conversationId = '', recipientId = '';
          var clubs = foundUser.userClubs.sort(function(a, b) {
            return parseFloat(a.rank) - parseFloat(b.rank);
          });
          var Clubs_50_clubAvatar = [];
          var limitedClubs = clubs.slice(0,9);
          for(var k=0;k<limitedClubs.length;k++){
            if(process.env.ENVIRONMENT === 'dev'){
              Clubs_50_clubAvatar[k] = clConfig.cloudinary.url(limitedClubs[k].id.avatarId, clConfig.thumb_100_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              Clubs_50_clubAvatar[k] = s3Config.thumb_100_prefix+limitedClubs[k].id.avatarId;
            }
          }
          // requests
          var adminClubs = []; var clubInvites = []; var mutualClubs = [];
          var fUcIlength = foundUser.clubInvites.length;
          var fUuClength = foundUser.userClubs.length;
          var cUuClength = currentUser.userClubs.length;
          var sentRequest = contains(foundUser.friendRequests,currentUser._id);
          var haveRequest = contains(currentUser.friendRequests,foundUser._id);
          var isFriend = contains(currentUser.friends,foundUser._id);
          var clubCount = foundUser.userClubs.length;
          for(var i=0;i<cUuClength;i++){
            // adminClubs
            var rank = currentUser.userClubs[i].rank; var inClub = false; var isInvited = false;
            if(fUuClength != 0){
              for(var j=0;j<fUuClength;j++){
                if(foundUser.userClubs[j].id._id.equals(currentUser.userClubs[i].id._id)){
                  inClub = true;
                  break;
                }
              }
            } else if(fUuClength == 0){inClub = false};
            for(var j=0;j<fUcIlength;j++){
              if(foundUser.clubInvites[j]._id.equals(currentUser.userClubs[i].id._id)){
                isInvited = true;
                break;
              }
            }
            if(0 <= rank && rank <= 1 && isInvited == false && inClub == false){
              adminClubs.push(currentUser.userClubs[i].id);
            }
            // clubInvites
            if(fUcIlength != 0){
              for(var j=0;j<fUcIlength;j++){
                var fUcIcUlength = foundUser.clubInvites[j].clubUsers.length;
                for(var k=0;k<fUcIcUlength;k++){
                  if(foundUser.clubInvites[j]._id.equals(currentUser.userClubs[i].id._id) && 
                  foundUser.clubInvites[j].clubUsers[k].id.equals(currentUser._id) && 
                  foundUser.clubInvites[j].clubUsers[k].userRank <= 1){
                    clubInvites.push(currentUser.userClubs[i].id);
                  }
                }
              }
            }
          }
          var Friends_100_profilePic = [];
          for(var l=0;l<foundFriends.length;l++){
            if(process.env.ENVIRONMENT === 'dev'){
              Friends_100_profilePic[l] = clConfig.cloudinary.url(foundFriends[l].profilePicId, clConfig.thumb_200_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              Friends_100_profilePic[l] = s3Config.thumb_200_prefix+foundFriends[l].profilePicId;
            }
          }
          res.render('users/show', {haveRequest, sentRequest, isFriend, user: foundUser,
          clubs: limitedClubs, match, adminClubs, clubInvites, mutualClubs, conversationId, recipientId,
          foundFriends, Clubs_50_clubAvatar, clubCount, isBlocked, isBlockedByFoundUser, Friends_100_profilePic,
          cdn_prefix});
          return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
        }
        });
      }
      });
    } else if(!req.user){
      User.findById(req.params.id, function(err, foundUser){
      if(err || !foundUser){
        logger.error('(profiles-6)foundUser err => '+err);
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        var friends = foundUser.friends.reverse();
        User.aggregate([
          {$match: {_id: {$in: friends}}},
          {$addFields: {"__order": {$indexOfArray: [friends, "$_id" ]}}},
          {$sort: {"__order": 1}},
          {$project :{fullName: 1, profilePic: 1, profilePicId: 1}},
          {$limit: 4}
          ])
        .exec(function(err, foundFriends){
        if(err || !foundUser){
          logger.error('(profiles-7)foundUser err => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          var match = false;
          var clubCount = foundUser.userClubs.length;
          var sentRequest = haveRequest = isFriend = false;
          var adminClubs = []; var clubInvites = []; var mutualClubs = [];
          var Friends_100_profilePic = [];
          for(var l=0;l<foundFriends.length;l++){
            if(process.env.ENVIRONMENT === 'dev'){
              Friends_100_profilePic[l] = clConfig.cloudinary.url(foundFriends[l].profilePicId, clConfig.thumb_200_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              Friends_100_profilePic[l] = s3Config.thumb_200_prefix+foundFriends[l].profilePicId;
            }
          }
          return res.render("users/show", {haveRequest, sentRequest, isFriend, user: foundUser, match, adminClubs,
          clubInvites, mutualClubs, foundFriends, clubCount, Friends_100_profilePic, cdn_prefix});
        }
        });
      }
      });
    }
  },

  profilesUserMoreClubs(req, res, next){
    User.findById(req.params.user_id)
    .populate({path: 'userClubs.id', select: 'name avatar avatarId'})
    .exec(function(err, foundUser){
    if(err || !foundUser){
      logger.error(req.user._id+' : (profiles-8)foundUser err => '+err);
      return res.sendStatus(500);
    } else{
      if(req.user){
        var currentUser = req.user, currentUserId = currentUser._id;
        var cUuClength = currentUser.userClubs.length;
        for(var i=0;i<cUuClength;i++){
          var rank = currentUser.userClubs[i].rank;
        }
        var match = currentUser._id.equals(req.params.user_id);
        var isFriend = contains(currentUser.friends,foundUser._id);
        var endpoints = req.query.endpoints.split(',');
        var start = Number(endpoints[0]), end = Number(endpoints[1]);
        var clubCount = foundUser.userClubs.length, Clubs_50_clubAvatar = []; 
        if(isFriend || match){
          var clubs = foundUser.userClubs.sort(function(a, b) {
            return parseFloat(a.rank) - parseFloat(b.rank);
          });
          var limitedClubs = clubs.slice(start,end);
          for(var k=0;k<limitedClubs.length;k++){
            if(process.env.ENVIRONMENT === 'dev'){
              Clubs_50_clubAvatar[k] = clConfig.cloudinary.url(limitedClubs[k].id.avatarId, clConfig.thumb_100_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              Clubs_50_clubAvatar[k] = s3Config.thumb_100_prefix+limitedClubs[k].id.avatarId;
            }
          }
          var newStart = (start+10).toString(), newEnd = (end+10).toString();
          var newEndpoints = newStart+','+newEnd;
          res.json({clubs: limitedClubs, clubCount, Clubs_50_clubAvatar, newEndpoints, 
          userId: foundUser._id, rank, currentUserId, match, csrfToken: res.locals.csrfToken, cdn_prefix});
          return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
        }
      }
    }
    });
  },

  profilesUserMorePosts(req, res, next){
    if(req.user){
      if(process.env.ENVIRONMENT === 'dev'){
        var CU_50_profilePic = clConfig.cloudinary.url(req.user.profilePicId, clConfig.thumb_100_obj);
      } else if (process.env.ENVIRONMENT === 'prod'){
        var CU_50_profilePic = s3Config.thumb_100_prefix+req.user.profilePicId;
      }
      if(req.query.ids != ''){
        var seenIds = req.query.ids.split(',');
      } else{
        var seenIds = [];
      }
      Post.find({'postAuthor.id': req.params.id, _id: {$nin: seenIds}})
      .populate({path: 'postClub', select: 'name avatar avatarId'})
      .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
      .sort({createdAt: -1}).limit(10)
      .exec(function(err, foundUserPosts){
      if(err || !foundUserPosts){
        logger.error(req.user._id+' : (profiles-9)foundUserPosts err => '+err);
        return res.sendStatus(500);
      } else{
        var arrLength = foundUserPosts.length;
        var currentUser = req.user; var match = false;
        var foundPostIds = foundUserPosts.map(function(post){
          return post._id;
        });
        var userPosts = foundUserPosts;
        var posts = postsPrivacyFilter(userPosts, req.user);
        var modPosts = postsModerationFilter(posts, req.user);
        sortComments(modPosts);
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
        // Your own profile (posts) don't count as view
        if(!req.user._id.equals(req.params.id)){
          Post.updateMany({_id: {$in: seenPostIds}}, {$inc: {viewsCount: 1}},
          function(err, updatePosts){
            if(err || !updatePosts){
              logger.error(req.user._id+' : (profiles-10)updatePosts err => '+err);
              return res.sendStatus(500);
            }
          });
        };
        res.json({hasVote, hasModVote, posts: modPosts, match, currentUser, foundPostIds, 
        PC_50_clubAvatar, CU_50_profilePic, arrLength, csrfToken: res.locals.csrfToken, cdn_prefix});
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      }
      });
    } else{
      var CU_50_profilePic = null;
      if(req.query.ids != ''){
        var seenIds = req.query.ids.split(',');
      } else{
        var seenIds = [];
      }
      Post.find({'postAuthor.id': req.params.id, moderation: 0, privacy: 0, topic: '', _id: {$nin: seenIds}})
      .populate({path: 'postClub', select: 'name avatar avatarId'})
      .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
      .sort({createdAt: -1}).limit(10)
      .exec(function(err, foundUserPosts){
      if(err || !foundUserPosts){
        logger.error('(profiles-11)foundUserPosts err => '+err);
        return res.sendStatus(500);
      } else{
        var arrLength = foundUserPosts.length;
        var currentUser = req.user; var match = false;
        var foundPostIds = foundUserPosts.map(function(post){
          return post._id;
        });
        var userPosts = foundUserPosts;
        sortComments(userPosts);
        var hasVote = [], hasModVote = [], PC_50_clubAvatar = [], seenPostIds = [];
        for(var k=0;k<userPosts.length;k++){
          if(process.env.ENVIRONMENT === 'dev'){
            PC_50_clubAvatar[k] = clConfig.cloudinary.url(userPosts[k].postClub.avatarId, clConfig.thumb_100_obj);
          } else if (process.env.ENVIRONMENT === 'prod'){
            PC_50_clubAvatar[k] = s3Config.thumb_100_prefix+userPosts[k].postClub.avatarId;
          }
          hasVote[k] = voteCheck(req.user,userPosts[k]);
          hasModVote[k] = modVoteCheck(req.user,userPosts[k]);
          seenPostIds.push(userPosts[k]._id);
        }
        Post.updateMany({_id: {$in: seenPostIds}}, {$inc: {viewsCount: 1}},
        function(err, updatePosts){
          if(err || !updatePosts){
            logger.error('(profiles-12)updatePosts err => '+err);
            return res.sendStatus(500);
          }
        });
        return res.json({hasVote, hasModVote, posts: userPosts, match, currentUser, foundPostIds, 
        PC_50_clubAvatar, CU_50_profilePic, arrLength, csrfToken: res.locals.csrfToken, cdn_prefix});
      }
      });
    }
  },

  profilesUserMoreHeartPosts(req, res, next){
    if(req.user && req.user._id.equals(req.params.id)){
      if(process.env.ENVIRONMENT === 'dev'){
        var CU_50_profilePicH = clConfig.cloudinary.url(req.user.profilePicId, clConfig.thumb_100_obj);
      } else if (process.env.ENVIRONMENT === 'prod'){
        var CU_50_profilePicH = s3Config.thumb_100_prefix+req.user.profilePicId;
      }
      if(req.query.heartIds != ''){
        var seenIds = req.query.heartIds.split(',');
      } else{
        var seenIds = [];
      }
      var seenIdsArr = seenIds.map(s => mongoose.Types.ObjectId(s));
      var postHeartsArr = req.user.postHearts.reverse();
      Post.aggregate([
          {$match: {$and: [
            {_id: {$in: postHeartsArr}}, 
            {_id: {$nin: seenIdsArr}}
          ]}},
          {$addFields: {"__order": {$indexOfArray: [postHeartsArr, "$_id" ]}}},
          {$sort: {"__order": 1}},
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
          {
          "$project": {
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
              "likeCount": 1,
              "dislikeCount": 1,
              "heartCount": 1,
              "likeUserIds": 1,
              "dislikeUserIds": 1,
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
              "subpostsCount": 1,
              "subpostbucketNum": 1,
              "subpostBuckets": 1,
              "upVoteCount": 1,
              "downVoteCount": 1,
              "upVoteUserIds": 1,
              "downVoteUserIds": 1,
              "createdAt": 1,
              "__v": 1,
            }
          },
          {$limit: 10}
        ])
      .exec(function(err, foundHeartPosts){
      if(err || !foundHeartPosts){
        logger.error(req.user._id+' : (profiles-13)foundHeartPosts err => '+err);
        return res.sendStatus(500);
      } else{
        var arrLength = foundHeartPosts.length;
        var currentUser = req.user; var match = false;
        var foundHPostIds = foundHeartPosts.map(function(post){
          return post._id;
        });
        var userPosts = foundHeartPosts;
        var posts = postsPrivacyFilter(userPosts, req.user);
        var modPosts = postsModerationFilter(posts, req.user);
        sortComments(modPosts);
        var hasVote = [], hasModVote = [], PC_50_clubAvatarH = [], seenPostIds = [];
        for(var k=0;k<modPosts.length;k++){
          if(process.env.ENVIRONMENT === 'dev'){
            PC_50_clubAvatarH[k] = clConfig.cloudinary.url(modPosts[k].postClub.avatarId, clConfig.thumb_100_obj);
          } else if (process.env.ENVIRONMENT === 'prod'){
            PC_50_clubAvatarH[k] = s3Config.thumb_100_prefix+modPosts[k].postClub.avatarId;
          }
          hasVote[k] = voteCheck(req.user,modPosts[k]);
          hasModVote[k] = modVoteCheck(req.user,modPosts[k]);
          seenPostIds.push(modPosts[k]._id);
        }
        Post.updateMany({_id: {$in: seenPostIds}}, {$inc: {viewsCount: 1}},
        function(err, updatePosts){
          if(err || !updatePosts){
            logger.error(req.user._id+' : (profiles-14)updatePosts err => '+err);
            return res.sendStatus(500);
          }
        });
        res.json({hasVote, hasModVote, posts: modPosts, match, currentUser, foundHPostIds, 
        CU_50_profilePicH, PC_50_clubAvatarH, arrLength, csrfToken: res.locals.csrfToken, cdn_prefix});
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      }
      });
    } else{
      res.redirect('back');
    }
  },

  profilesUpdateUserProfile(req, res, next){
    if(req.user && req.user._id.equals(req.params.id)){
      var newCollegePageExists;
      User.findById(req.params.id, async function(err, foundUser){
      if(err || !foundUser){
        logger.error(req.user._id+' : (profiles-15)foundUser err => '+err);
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        if(req.body.deleteProfilePic == 'true'){
          if(process.env.ENVIRONMENT === 'dev'){
            if(foundUser.profilePicId != null){
              clConfig.cloudinary.v2.uploader.destroy(foundUser.profilePicId);
            }
            foundUser.profilePic = null;
            foundUser.profilePicId = null;
          } else if (process.env.ENVIRONMENT === 'prod'){
            if(foundUser.profilePicId != null){
              s3Config.deleteFile(foundUser.profilePicId);
            }
            foundUser.profilePic = null;
            foundUser.profilePicId = null;
          }
        }
        if(req.file){
          try{
            if(process.env.ENVIRONMENT === 'dev'){
              if(foundUser.profilePicId != null){
                clConfig.cloudinary.v2.uploader.destroy(foundUser.profilePicId);
              }
              var result = await clConfig.cloudinary.v2.uploader.upload(req.file.path, clConfig.profilePics_1080_obj);
              foundUser.profilePic = result.secure_url;
              foundUser.profilePicId = result.public_id;
            } else if (process.env.ENVIRONMENT === 'prod'){
              if(foundUser.profilePicId != null){
                s3Config.deleteFile(foundUser.profilePicId);
              }
              var result = await s3Config.uploadFile(req.file, 'profilePics/', 1080);
              s3Config.removeTmpUpload(req.file.path);
              foundUser.profilePic = result.Location;
              foundUser.profilePicId = result.Key;
            }
          } catch(err){
            logger.error(req.user._id+' : (profiles-16)profilePicUpload err => '+err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }
        }
        // if(req.body.delUpdate){
        //   if(foundUser.clubUpdates.length != 0){
        //     for(i=foundUser.clubUpdates.length-1;i>=0;i--){
        //       if(foundUser.clubUpdates[i]._id.equals(req.body.delUpdate)){
        //         foundUser.clubUpdates.splice(i,1);
        //       }
        //     }
        //   };
        // }
        if(req.body.note && foundUser.note != req.body.note){
          foundUser.note = req.body.note;
        }
        if(req.body.firstName || req.body.lastName){
          var newFirstName = req.body.firstName.trim()[0].toUpperCase() + req.body.firstName.trim().substring(1).toLowerCase();
          var newLastName = req.body.lastName.trim()[0].toUpperCase() + req.body.lastName.trim().substring(1).toLowerCase();
          if(newFirstName != '' && ((newFirstName != foundUser.firstName) || (newLastName != foundUser.lastName))){
            foundUser.firstName = newFirstName;
            foundUser.lastName = newLastName;
            foundUser.fullName = newFirstName+' '+newLastName;
          }
        }
        if(req.body.userKeys){
          if(req.body.userKeys.sex){
            if(req.body.userKeys.sex != foundUser.userKeys.sex){
              foundUser.userKeys.sex = req.body.userKeys.sex;
            }
          } else if(req.body.userKeys.house || req.body.userKeys.school || req.body.userKeys.hometown || req.body.userKeys.birthdate){
            if(req.body.userKeys.house != foundUser.userKeys.house){
              foundUser.userKeys.house = req.body.userKeys.house;
            }
            if(req.body.userKeys.school != foundUser.userKeys.school){
              foundUser.userKeys.school = req.body.userKeys.school.replace(/[^a-zA-Z'()0-9 ]/g, '').trim();
            }
            if(foundUser.userKeys.hometown != req.body.userKeys.hometown){
              if(req.body.userKeys.hometown != ''){
                let response = await geocodingClient
                .forwardGeocode({
                  query: req.body.userKeys.hometown,
                  limit: 1
                })
                .send();
                foundUser.userKeys.hometown = req.body.userKeys.hometown.replace(/[^a-zA-Z',0-9 .]/g, '');
                foundUser.geometry = response.body.features[0].geometry;
              } else{
                foundUser.userKeys.hometown = '';
                foundUser.geometry = undefined;
              }
            }
            var newDate = moment(req.body.userKeys.birthdate, 'MM-DD-YYYY').toDate();
            if(newDate.toString() != foundUser.userKeys.birthdate.toString()){
              foundUser.userKeys.birthdate = newDate;
            }
          } else if(req.body.userKeys.college || req.body.userKeys.batch || req.body.userKeys.branch){
            // COLLEGE PAGE
            if(foundUser.userKeys.college != req.body.userKeys.college.replace(/[^a-zA-Z'()0-9 -]/g, '').trim()){
              var oldCollegeName = foundUser.userKeys.college;
              var newCollegeName = req.body.userKeys.college.replace(/[^a-zA-Z'()0-9 -]/g, '').trim();
              var foundOldCollegePage = await CollegePage.findOne({name: oldCollegeName});
              if(foundOldCollegePage && foundOldCollegePage.allUserIds.length){
                for(var i=foundOldCollegePage.allUserIds.length-1;i>=0;i--){
                  if(foundOldCollegePage.allUserIds[i].equals(foundUser._id)){
                    foundOldCollegePage.allUserIds.splice(i,1);
                    break;
                  }
                }
                foundOldCollegePage.userCount -= 1;
                foundOldCollegePage.save();
              }
              var foundNewCollegePage = await CollegePage.findOne({name: newCollegeName});
              if(foundNewCollegePage){
                foundNewCollegePage.allUserIds.push(foundUser._id);
                foundNewCollegePage.userCount += 1;
                foundNewCollegePage.save();
                foundUser.userKeys.college = newCollegeName;
              } else{
                if(newCollegeName != ''){
                  req.flash('error', 'Page for '+newCollegeName+' does not exist yet');
                  newCollegePageExists = 'no';
                }
                foundUser.userKeys.college = '';
              }
            }
            if(req.body.userKeys.batch != foundUser.userKeys.batch){
              foundUser.userKeys.batch = req.body.userKeys.batch;
            }
            if(req.body.userKeys.branch != foundUser.userKeys.branch){
              foundUser.userKeys.branch = req.body.userKeys.branch;
            }
          }
        }
        if(req.body.aboutme){
          foundUser.bio.aboutme = req.body.aboutmetext.replace(/[^a-zA-Z'()&0-9?\n .-]/g, '');
        }
        if(req.body.followon){
          foundUser.bio.instagram = encodeURI(req.body.instagram);
          foundUser.bio.facebook = encodeURI(req.body.facebook);
          foundUser.bio.linkedin = encodeURI(req.body.linkedin);
          foundUser.bio.twitter = encodeURI(req.body.twitter);
          foundUser.bio.discord = encodeURI(req.body.discord);
          foundUser.bio.github = encodeURI(req.body.github);
          foundUser.bio.spotify = encodeURI(req.body.spotify);
          foundUser.bio.youtube = encodeURI(req.body.youtube);
          foundUser.bio.custom1 = encodeURI(req.body.custom1);
          foundUser.bio.custom2 = encodeURI(req.body.custom2);
         }
        editinfo(0,req.body.interests,foundUser.interests);
        editinfo(1,req.body.music,foundUser.recommends.music);
        editinfo(2,req.body.movies,foundUser.recommends.movies);
        editinfo(3,req.body.tvshows,foundUser.recommends.tvshows);
        editinfo(4,req.body.places,foundUser.recommends.places);
        editinfo(5,req.body.books,foundUser.recommends.books);

        function editinfo(count,newData,oldData){
          if(newData){
            oldData=[];
            if(Array.isArray(newData)){
              var oldData = newData.filter(Boolean);
            } else{
              var oldData = [newData].filter(Boolean);;
            }
            var len = oldData.length; for(var i=len-1;i>=0;i--){
              var inputstring = oldData[i].replace(/[^a-zA-Z'()&0-9 .-]/g, '');
              oldData.splice(i,1,inputstring);
            }
            if(count==0){foundUser.interests=oldData;}
            else if(count==1){foundUser.recommends.music=oldData;}
            else if(count==2){foundUser.recommends.movies=oldData;}
            else if(count==3){foundUser.recommends.tvshows=oldData;}
            else if(count==4){foundUser.recommends.places=oldData;}
            else if(count==5){foundUser.recommends.books=oldData;}
          }
        };
        foundUser.save();
        if(newCollegePageExists == 'no'){} else{
          req.flash('success', 'Successfully updated');
        }
        return res.redirect('/users/' + req.params.id);
      }
      });
    }
  },

  profilesNewClub(req, res, next){
    User.findById(req.params.id).populate('userClubs.id').exec(async function(err, foundUser){
    if(err || !foundUser){
      logger.error(req.user._id+' : (profiles-17)foundUser err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      if(req.user && req.user._id.equals(req.params.id)){
        try{
          if(process.env.ENVIRONMENT === 'dev'){
            var result = await clConfig.cloudinary.v2.uploader.upload(req.file.path, clConfig.clubAvatars_1080_obj);
            req.body.avatar = result.secure_url;
            req.body.avatarId = result.public_id;
          } else if (process.env.ENVIRONMENT === 'prod'){
            var result = await s3Config.uploadFile(req.file, 'clubAvatars/', 1080);
            s3Config.removeTmpUpload(req.file.path);
            req.body.avatar = result.Location;
            req.body.avatarId = result.Key;
          }
        } catch(err){
          logger.error(req.user._id+' : (profiles-18)avatarUpload err => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }
        Club.create(req.body, function(err, newClub){
        if (err || !newClub){
          logger.error(req.user._id+' : (profiles-19)newClub err => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          newClub.info.rules = `1). PLAY AN ACTIVE ROLE
2). RESPECT THE OTHER MEMBERS OF THE CLUB
3). NO VULGAR PICS TO BE UPLOADED
4). NO USE OF ABUSIVE LANGUAGE
5). ENJOY!`;
          newClub.info.description = newClub.name;
          //pushing user details into clubs
          var obja = {};
          obja['id'] = foundUser._id;
          obja['userRank'] = 0;
          newClub.clubUsers.push(obja);
          newClub.save(function(err, newClub){
          if (err || !newClub){
            logger.error(req.user._id+' : (profiles-20)newClub err => '+err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          } else{
            newClub.populate('clubUsers.id', function(err, populatedClub){
            if (err || !populatedClub){
              logger.error(req.user._id+' : (profiles-21)populatedClub err => '+err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            } else{
              clubUsers = populatedClub.clubUsers;
              //pushing club details into users
              var objb = {};
              objb['id'] = newClub._id;
              objb['rank'] = 0;
              objb['clubName'] = newClub.name;
              foundUser.userClubs.push(objb);
              foundUser.save();
              req.flash('success', 'Successfully updated');
              return res.redirect('/clubs/' + newClub._id);
            }
            });
          }
          });
        }
        });
      } else{
        res.redirect('back');
      }
    }
    });
  },

  profilesClubProfile(req, res, next){
    Club.findOne({_id: req.params.club_id, isActive: true})
    .populate({path: 'clubUsers.id', select: 'firstName fullName profilePic profilePicId userKeys'})
    .exec(function(err, foundClub){
    if(err){
      logger.error('(profiles-22)foundClub err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else if(!foundClub){
      req.flash('success', 'This club has been deleted.');
      return res.redirect('back');
    } else{
      if(req.user){
        var isFollowingClub = false;
        for(var k=0;k<req.user.followingClubCount;k++){
          if(req.user.followingClubIds[k].equals(foundClub._id)){
            isFollowingClub = true;
            break;
          }
        }
        var users = foundClub.clubUsers.sort(function(a, b){
          return parseFloat(a.userRank) - parseFloat(b.userRank);
        });
        var Users_50_profilePic = [], Posts_50_Image = [];
        var limitedUsers = users.slice(0,1);
        for(var k=0;k<limitedUsers.length;k++){
          if(process.env.ENVIRONMENT === 'dev'){
            Users_50_profilePic[k] = clConfig.cloudinary.url(limitedUsers[k].id.profilePicId, clConfig.thumb_100_obj);
          } else if (process.env.ENVIRONMENT === 'prod'){
            Users_50_profilePic[k] = s3Config.thumb_100_prefix+limitedUsers[k].id.profilePicId;
          }
        }
        var rank = currentRank(users,req.user._id);
        if(0 <= rank && rank <= 4){
          var conversationId = '', convClubId = '';
          if(foundClub.conversationId){
            var conversationId = foundClub.conversationId;
          } else{var convClubId = foundClub._id;}
        } else{
          // foundClub.updates = '';
        }
        // Check memberRequest
        var memberRequestsLength = foundClub.memberRequests.length; var sentMemberReq = false;
        for(m=memberRequestsLength-1;m>=0;m--){
          if(foundClub.memberRequests[m].userId.equals(req.user._id)){
            sentMemberReq = true;
          }
        }
        if(0 <= rank && rank <= 4){
          // for HOT TOPIC posts made in past week
          Post.find({postClub: req.params.club_id, topic: {$ne: ''}, createdAt: {$gt:new Date(Date.now() - 7*24*60*60 * 1000)}})
          .select({topic: 1, image: 1, imageId: 1, subpostsCount: 1, upVoteCount: 1, downVoteCount: 1, moderation: 1,
          postAuthor: 1, postClub: 1}).sort({upVoteCount: -1}).limit(10).exec(function(err, topTopicPosts){
          if(err || !topTopicPosts){
          logger.error(req.user._id+' : (profiles-23)topTopicPosts err => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
          } else{
            var modTopTopicPosts = postsModerationFilter(topTopicPosts, req.user);
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
            var clubUserIds = users.map(function(user){
              return user.id._id;
            });
            User.countDocuments({_id: {$in: clubUserIds}, 
            lastActive: {$gt:new Date(Date.now() - 120*1000)}}, function(err, onlineClubMembersCount){
              res.render('clubs/show', {rank, currentUser: req.user, users: limitedUsers, conversationId, convClubId,
              club: foundClub, Users_50_profilePic, Posts_50_Image, topTopicPosts: modTopTopicPosts, sentMemberReq, 
              memberRequestsLength, isFollowingClub, onlineClubMembersCount, clubId: foundClub._id, clubPage: true, 
              cdn_prefix});
              return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
            });
          }
          });
        } else{
          res.render('clubs/show', {rank, currentUser: req.user, users: limitedUsers, conversationId, convClubId,
          club: foundClub, Users_50_profilePic, Posts_50_Image: [], topTopicPosts: [], sentMemberReq, 
          memberRequestsLength, isFollowingClub, cdn_prefix});
          return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
        }
      } else{
        var PA_50_profilePic = [], Users_50_profilePic = [];
        var users = foundClub.clubUsers.sort(function(a, b) {
          return parseFloat(a.userRank) - parseFloat(b.userRank);
        });
        var limitedUsers = users.slice(0,1);
        for(var k=0;k<limitedUsers.length;k++){
          if(process.env.ENVIRONMENT === 'dev'){
            Users_50_profilePic[k] = clConfig.cloudinary.url(limitedUsers[k].id.profilePicId, clConfig.thumb_100_obj);
          } else if (process.env.ENVIRONMENT === 'prod'){
            Users_50_profilePic[k] = s3Config.thumb_100_prefix+limitedUsers[k].id.profilePicId;
          }
        }
        var rank, currentUser = null; var topTopicPosts = []; var sentMemberReq = false;
        // foundClub.updates = '';
        return res.render('clubs/show', {currentUser, rank, users: limitedUsers, club: foundClub, topTopicPosts,
        PA_50_profilePic, Users_50_profilePic, sentMemberReq, memberRequestsLength: null, cdn_prefix});
      }
    }
    });
  },

  profilesCluballTimeTopPosts(req, res, next){
    if(req.user){
      var rank = currentRank2(req.params.club_id,req.user.userClubs);
      if(0<=rank && rank<=4){
        var Posts_50_Image = [];
        Post.find({postClub: req.params.club_id, topic: {$ne: ''}})
        .select({topic: 1, image: 1, imageId: 1, subpostsCount: 1, upVoteCount: 1, downVoteCount: 1, moderation: 1,
        postAuthor: 1, postClub: 1}).sort({upVoteCount: -1}).limit(10).exec(function(err, topTopicPosts){
        if(err || !topTopicPosts){
        logger.error(req.user._id+' : (profiles-24)topTopicPosts err => '+err);
        return res.sendStatus(500);
        } else{
          var modTopTopicPosts = postsModerationFilter(topTopicPosts, req.user);
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
          res.json({Posts_50_Image, topTopicPosts: modTopTopicPosts, clubId: req.params.club_id, 
          csrfToken: res.locals.csrfToken, cdn_prefix});
          return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
        }
        });
      }
    }
  },

  profilesClubMoreMembers(req, res, next){
    Club.findById(req.params.club_id)
    .populate({path: 'clubUsers.id', select: 'firstName fullName profilePic profilePicId userKeys'})
    .exec(function(err, foundClub){
    if(err || !foundClub){
      logger.error(req.user._id+' : (profiles-25)foundClub err => '+err);
      return res.sendStatus(500);
    } else{
      if(req.user){
        var rankUsers = foundClub.clubUsers;
        var junior = checkRank(rankUsers,req.user._id,4);
        var endpoints = req.query.endpoints.split(',');
        var start = Number(endpoints[0]), end = Number(endpoints[1]);
        var Users_50_profilePic = []; 
        if(junior){
          var users = foundClub.clubUsers.sort(function(a, b) {
            return parseFloat(a.userRank) - parseFloat(b.userRank);
          });
          var limitedUsers = users.slice(start,end);
          var rank = currentRank(users,req.user._id);
          for(var k=0;k<limitedUsers.length;k++){
            if(process.env.ENVIRONMENT === 'dev'){
              Users_50_profilePic[k] = clConfig.cloudinary.url(limitedUsers[k].id.profilePicId, clConfig.thumb_100_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              Users_50_profilePic[k] = s3Config.thumb_100_prefix+limitedUsers[k].id.profilePicId;
            }
          }
          var newStart = (start+10).toString(), newEnd = (end+10).toString();
          var newEndpoints = newStart+','+newEnd;
          res.json({users: limitedUsers, Users_50_profilePic, newEndpoints, clubId: foundClub._id, 
          rank, csrfToken: res.locals.csrfToken, cdn_prefix});
          return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
        }
      }
    }
    });
  },

  profilesClubSearchMembers(req, res, next){
    Club.findById(req.params.club_id)
    .populate({path: 'clubUsers.id', select: 'firstName fullName profilePic profilePicId userKeys'})
    .exec(function(err, foundClub){
    if(err || !foundClub){
      logger.error(req.user._id+' : (profiles-26)foundClub err => '+err);
      return res.sendStatus(500);
    } else{
      if(req.user){
        var rankUsers = foundClub.clubUsers;
        var junior = checkRank(rankUsers,req.user._id,4);
        if(junior == true){
          if(req.query.name && req.query.name != ''){
            var matchingUsers = []; var Users_50_profilePic = [];
            var rank = currentRank(foundClub.clubUsers,req.user._id);
            var query = req.query.name.replace(/[^a-zA-Z ]/g, '');
            var regexQuery = new RegExp(escapeRegExp(query), 'gi');
            for(var i=0;i<foundClub.clubUsers.length;i++){
              var match = foundClub.clubUsers[i].id.fullName.match(regexQuery);
              if(match){
                matchingUsers.push(foundClub.clubUsers[i]); 
              }
            }
            for(var j=0;j<matchingUsers.length;j++){
                if(process.env.ENVIRONMENT === 'dev'){
                  Users_50_profilePic[j] = clConfig.cloudinary.url(matchingUsers[j].id.profilePicId, clConfig.thumb_100_obj);
                } else if (process.env.ENVIRONMENT === 'prod'){
                  Users_50_profilePic[j] = s3Config.thumb_100_prefix+matchingUsers[j].id.profilePicId;
                }
              }
            res.json({users: matchingUsers, Users_50_profilePic, clubId: foundClub._id, rank, 
            csrfToken: res.locals.csrfToken, cdn_prefix});
            return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
          } else{
            return res.sendStatus(400);
          }
        } else{
          return res.sendStatus(204);
        }
      }
    }
    });
  },

  profilesClubMoreMemberRequests(req, res, next){
    Club.findById(req.params.id)
    .populate({path: 'memberRequests.userId', select: 'fullName profilePic profilePicId userKeys'})
    .exec(function(err, foundClub){
    if(err || !foundClub){
      logger.error(req.user._id+' : (profiles-27)foundClub err => '+err);
      return res.sendStatus(500);
    } else{
      var admin = checkRank(foundClub.clubUsers,req.user._id,1);
      if(admin){
        var endpoints = req.query.endpoints.split(',');
        var start = Number(endpoints[0]), end = Number(endpoints[1]);
        var MemberRequests_50_profilePic = [];
        var limitedUsers = foundClub.memberRequests.slice(start,end);
        for(var k=0;k<limitedUsers.length;k++){
          if(process.env.ENVIRONMENT === 'dev'){
            MemberRequests_50_profilePic[k] = clConfig.cloudinary.url(limitedUsers[k].userId.profilePicId, clConfig.thumb_100_obj);
          } else if (process.env.ENVIRONMENT === 'prod'){
            MemberRequests_50_profilePic[k] = s3Config.thumb_100_prefix+limitedUsers[k].userId.profilePicId;
          }
        }
        var newStart = (start+10).toString(), newEnd = (end+10).toString();
        var newEndpoints = newStart+','+newEnd;
        res.json({users: limitedUsers, MemberRequests_50_profilePic, newEndpoints, club: foundClub, 
        csrfToken: res.locals.csrfToken, cdn_prefix});
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      } else{
        res.redirect('back');
      }
    }
    });
  },

  profilesClubMorePosts(req, res, next){
    if(req.user){
      if(process.env.ENVIRONMENT === 'dev'){
        var CU_50_profilePic = clConfig.cloudinary.url(req.user.profilePicId, clConfig.thumb_100_obj);
      } else if (process.env.ENVIRONMENT === 'prod'){
        var CU_50_profilePic = s3Config.thumb_100_prefix+req.user.profilePicId;
      }
      if(req.query.ids != ''){
        var seenIds = req.query.ids.split(',');
      } else{
        var seenIds = [];
      }
      Post.find({postClub: req.params.club_id, _id: {$nin: seenIds}})
      .populate({path: 'postAuthor.id', select: 'fullName profilePic profilePicId userKeys'})
      .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
      .sort({createdAt: -1}).limit(10)
      .exec(function(err, clubPosts){
      if(err || !clubPosts){
        logger.error(req.user._id+' : (profiles-28)clubPosts err => '+err);
        return res.sendStatus(500);
      } else{
        var arrLength = clubPosts.length;
        var foundPostIds = clubPosts.map(function(post){
          return post._id;
        });
        var posts = postsPrivacyFilter(clubPosts, req.user);
        var modPosts = postsModerationFilter(posts, req.user);
        sortComments(modPosts);
        var hasVote = [], hasModVote = [], PA_50_profilePic = [], seenPostIds = [];
        for(var k=0;k<modPosts.length;k++){
          if(process.env.ENVIRONMENT === 'dev'){
            PA_50_profilePic[k] = clConfig.cloudinary.url(modPosts[k].postAuthor.id.profilePicId, clConfig.thumb_100_obj);
          } else if (process.env.ENVIRONMENT === 'prod'){
            PA_50_profilePic[k] = s3Config.thumb_100_prefix+modPosts[k].postAuthor.id.profilePicId;
          }
          hasVote[k] = voteCheck(req.user,modPosts[k]);
          hasModVote[k] = modVoteCheck(req.user,modPosts[k]);
          seenPostIds.push(modPosts[k]._id);
        }
        Post.updateMany({_id: {$in: seenPostIds}}, {$inc: {viewsCount: 1}},
        function(err, updatePosts){
          if(err || !updatePosts){
            logger.error(req.user._id+' : (profiles-29)updatePosts err => '+err);
            return res.sendStatus(500);
          }
        });
        var currentUser = req.user;
        var rank = currentRank2(req.params.club_id,req.user.userClubs);
        res.json({hasVote, hasModVote, posts: modPosts, rank, currentUser, foundPostIds, 
        PA_50_profilePic, CU_50_profilePic, arrLength, csrfToken: res.locals.csrfToken, cdn_prefix});
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      }
      });
    } else{
      var CU_50_profilePic = null;
      if(req.query.ids != ''){
        var seenIds = req.query.ids.split(',');
      } else{
        var seenIds = [];
      }
      Post.find({postClub: req.params.club_id, moderation: 0, privacy: 0, topic: '', _id: {$nin: seenIds}})
      .populate({path: 'postAuthor.id', select: 'fullName profilePic profilePicId userKeys'})
      .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
      .sort({createdAt: -1}).limit(10)
      .exec(function(err, clubPosts){
      if(err || !clubPosts){
        logger.error('(profiles-30)clubPosts err => '+err);
        return res.sendStatus(500);
      } else{
        var arrLength = clubPosts.length;
        var foundPostIds = clubPosts.map(function(post){
          return post._id;
        });
        var posts = clubPosts;
        sortComments(posts);
        var hasVote = [], hasModVote = [], PA_50_profilePic = [], seenPostIds = [];
        for(k=0;k<posts.length;k++){
          if(process.env.ENVIRONMENT === 'dev'){
            PA_50_profilePic[k] = clConfig.cloudinary.url(posts[k].postAuthor.id.profilePicId, clConfig.thumb_100_obj);
          } else if (process.env.ENVIRONMENT === 'prod'){
            PA_50_profilePic[k] = s3Config.thumb_100_prefix+posts[k].postAuthor.id.profilePicId;
          }
          hasVote[k] = voteCheck(req.user,posts[k]);
          hasModVote[k] = modVoteCheck(req.user,posts[k]);
          seenPostIds.push(posts[k]._id);
        }
        Post.updateMany({_id: {$in: seenPostIds}}, {$inc: {viewsCount: 1}},
        function(err, updatePosts){
          if(err || !updatePosts){
            logger.error('(profiles-31)updatePosts err => '+err);
            return res.sendStatus(500);
          }
        });
        var rank, currentUser = null;
        return res.json({hasVote, hasModVote, posts, rank, currentUser, foundPostIds, PA_50_profilePic,
        CU_50_profilePic, arrLength, csrfToken: res.locals.csrfToken, cdn_prefix});
      }
      });
    }
  },

  profilesUpdateClubProfile(req, res, next){
    Club.findById(req.params.club_id, async function(err, foundClub){
    if(err || !foundClub){
      logger.error(req.user._id+' : (profiles-32)foundClub err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var newCollegePageExists;
      var rankUsers = foundClub.clubUsers;
      var admin = checkRank(rankUsers,req.user._id,1); 
      var moder = checkRank(rankUsers,req.user._id,2);
      if(req.body.newsUpdate && moder == true){
        // var clubUserIdsArr = foundClub.clubUsers.map(function(clubUser){
        //   return clubUser.id;
        // });
        // if(req.body.newsDate && req.body.newsDate != ''){
        //   var strDate = req.body.newsDate;
        //   var date = moment(strDate, 'MM-DD-YYYY').toDate();
        // } else{var eventDate = null;}
        // var news = req.body.newsUpdate;
        // var clubId = foundClub._id;
        // var clubName = foundClub.name;
        // var pusherName = req.user.fullName;
        // var clubUpdate = {'news': news, 'eventDate': date, 'pusherName': pusherName};
        // foundClub.updates.push(clubUpdate);
        // // foundClub is locked for modification untill fn updatedClub is finished.?
        // foundClub.save(function(err, updatedClub){
        //   var len = updatedClub.updates.length;
        //   var userUpdate = {'news': news, 'eventDate': date, 'pusherName': pusherName, 'clubId': clubId,
        //   'clubName': clubName, updateId: updatedClub.updates[len-1]._id};
        //   User.updateMany({_id: {$in: clubUserIdsArr}, userClubs: {$elemMatch: {id: updatedClub._id}}},
        //   {$push: {clubUpdates: userUpdate}}, function(err, updateUsers){
        //     if(err || !updateUsers){
        //       logger.error(req.user._id+' : (profiles-33)updateUsers err => '+err);
        //       req.flash('error', 'Something went wrong :(');
        //       return res.redirect('back');
        //     }
        //   });
        //   req.flash('success', 'Successfully updated');
        //   return res.redirect('/clubs/' + req.params.club_id);
        // });
      } else if(admin == true){
        if(req.file){
          try{
            if(process.env.ENVIRONMENT === 'dev'){
              clConfig.cloudinary.v2.uploader.destroy(foundClub.avatarId);
              var result = await clConfig.cloudinary.v2.uploader.upload(req.file.path, clConfig.clubAvatars_1080_obj);
              foundClub.avatar = result.secure_url;
              foundClub.avatarId = result.public_id;
            } else if (process.env.ENVIRONMENT === 'prod'){
              s3Config.deleteFile(foundClub.avatarId);
              var result = await s3Config.uploadFile(req.file, 'clubAvatars/', 1080);
              s3Config.removeTmpUpload(req.file.path);
              foundClub.avatar = result.Location;
              foundClub.avatarId = result.Key;
            }
          }catch(err){
            logger.error(req.user._id+' : (profiles-34)avatarUpload err => '+err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }
        }
        // if(req.body.delUpdate){
        //   var clubUserIdsArr = foundClub.clubUsers.map(function(clubUser){
        //     return clubUser.id;
        //   });
        //   var delUpdateId = mongoose.Types.ObjectId(req.body.delUpdate);
        //   for(i=foundClub.updates.length-1;i>=0;i--){
        //     if(foundClub.updates[i]._id.equals(delUpdateId)){
        //       var timeDiff = (Date.now() - foundClub.updates[i].pushedAt);
        //       // Notify update deletion which was created in last 24 hrs
        //       if(timeDiff < 3600000*24){
        //         var update = {'news': 'This update has been deleted', 'eventDate': '', 'clubName': foundClub.name,
        //         'clubId': foundClub._id, 'deleterName': req.user.fullName};
        //         User.updateMany({_id: {$in: clubUserIdsArr}, clubUpdates: {$elemMatch: {updateId: foundClub.updates[i]._id}}},
        //         {$set: {'clubUpdates.$': update}}, function(err, updateUsers){
        //           if(err || !updateUsers){
        //             logger.error(req.user._id+' : (profiles-35)updateUsers err => '+err);
        //             req.flash('error', 'Something went wrong :(');
        //             return res.redirect('back');
        //           }
        //         });
        //       }
        //       foundClub.updates.splice(i,1);
        //       break;
        //     }
        //   }
        // }
        if(req.body.clubKeys){
          var oldCollegeName = foundClub.clubKeys.college;
          var oldCategory = foundClub.clubKeys.category;
          var newCollegeName = req.body.clubKeys.college.replace(/[^a-zA-Z'()0-9 -]/g, '').trim();
          var newCategory = req.body.clubKeys.category.replace(/[^a-zA-Z'()0-9 ]/g, '').trim();
          // COLLEGE PAGE
          if(oldCollegeName != newCollegeName || oldCategory != newCategory){
            if(oldCollegeName != newCollegeName){
              // 1) IF a collegePage of OLD College name exists => SPLICE clubId from old category of old college & dec. count
              var foundOldCollegePage = await CollegePage.findOne({name: oldCollegeName});
              if(foundOldCollegePage && foundOldCollegePage.allClubs.length){
                for(var i=foundOldCollegePage.allClubs.length-1;i>=0;i--){
                  if(foundOldCollegePage.allClubs[i].category == oldCategory){
                    foundOldCollegePage.allClubs[i].categoryCount -= 1;
                    for(var j=foundOldCollegePage.allClubs[i].categoryClubIds.length-1;j>=0;j--){
                      if(foundOldCollegePage.allClubs[i].categoryClubIds[j].equals(foundClub._id)){
                        foundOldCollegePage.allClubs[i].categoryClubIds.splice(j,1);
                      }
                    }
                    break;
                  }
                }
                foundOldCollegePage.clubCount -= 1;
                foundOldCollegePage.save();
              }
            }
            // 2) IF a collegePage of NEW College name "exists" => PUSH clubId into category(upsert) & inc. count
            var foundNewCollegePage = await CollegePage.findOne({name: newCollegeName});
            if(foundNewCollegePage){
              var foundNewCategory = false;
              if(foundNewCollegePage.allClubs.length){
                for(var i=foundNewCollegePage.allClubs.length-1;i>=0;i--){
                  // => collegePage different
                  if(oldCollegeName != newCollegeName && foundNewCollegePage.allClubs[i].category == newCategory){
                    foundNewCollegePage.allClubs[i].categoryCount += 1;
                    foundNewCollegePage.allClubs[i].categoryClubIds.push(foundClub._id);
                    foundNewCategory = true;
                    foundNewCollegePage.clubCount += 1;
                  }
                  // => collegePage same
                  // Remove club from old category
                  if(oldCollegeName == newCollegeName && oldCategory != newCategory && foundNewCollegePage.allClubs[i].category == oldCategory){
                    foundNewCollegePage.allClubs[i].categoryCount -= 1;
                    for(var j=foundNewCollegePage.allClubs[i].categoryClubIds.length-1;j>=0;j--){
                      if(foundNewCollegePage.allClubs[i].categoryClubIds[j].equals(foundClub._id)){
                        foundNewCollegePage.allClubs[i].categoryClubIds.splice(j,1);
                        foundNewCollegePage.clubCount -= 1;
                      }
                    }
                  }
                  // Add club to new category
                  if(oldCollegeName == newCollegeName && oldCategory != newCategory && foundNewCollegePage.allClubs[i].category == newCategory){
                    foundNewCollegePage.allClubs[i].categoryCount += 1;
                    foundNewCollegePage.allClubs[i].categoryClubIds.push(foundClub._id);
                    foundNewCategory = true;
                    foundNewCollegePage.clubCount += 1;
                  }
                }
              }
              if(foundNewCategory == false){
                var obj = {};
                obj['category'] = newCategory;
                obj['categoryCount'] = 1;
                obj['categoryClubIds'] = [foundClub._id];
                foundNewCollegePage.allClubs.push(obj);
                foundNewCollegePage.clubCount += 1;
              }
              foundNewCollegePage.save();
              foundClub.clubKeys.college = newCollegeName;
            } else{
              if(newCollegeName != ''){
                req.flash('error', 'Page for '+newCollegeName+' does not exist yet');
                newCollegePageExists = 'no';
              }
              foundClub.clubKeys.college = '';
            }
            foundClub.clubKeys.category = newCategory;
          }
        }
        if(req.body.info){
          if(req.body.info.description){
            foundClub.info.description = req.body.info.description;
          }
          if(req.body.info.rules){
            foundClub.info.rules = req.body.info.rules;
          }
        }
        if(req.body.name && foundClub.name != req.body.name){
          var clubUserIdsArr = foundClub.clubUsers.map(function(clubUser){
            return clubUser.id;
          });
          foundClub.name = req.body.name;
          User.updateMany({_id: {$in: clubUserIdsArr}, userClubs: {$elemMatch: {id: foundClub._id}}},
          {$set: {'userClubs.$.clubName': req.body.name}}, function(err, updateUsers){
            if(err || !updateUsers){
              logger.error(req.user._id+' : (profiles-36)updateUsers err => '+err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          });
        }
        if(foundClub.banner != req.body.banner){
          foundClub.banner = req.body.banner;
        }
        foundClub.save();
        if(newCollegePageExists == 'no'){} else{
          req.flash('success', 'Successfully updated');
        }
        return res.redirect('/clubs/' + req.params.club_id);
      } else{
        logger.warn(req.user._id+' : (profiles-37)rankCheck fail :Update Club');
        req.flash('error', "You don't have enough admin privileges :(");
        return res.redirect('back');
      }
    }
    });
  },

  profilesDeleteClubProfile(req, res, next){
    Club.findById(req.params.club_id, async function(err, foundClub){
    if(err || !foundClub){
      logger.error(req.user._id+' : (profiles-38)foundClub err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var president = foundClub.clubUsers;
      var ok = checkRank(president,req.user._id,0);
      if(ok == true){
        for(var i=foundClub.featuredPhotos.length-1;i>=0;i--){
          if(process.env.ENVIRONMENT === 'dev'){
            clConfig.cloudinary.v2.uploader.destroy(foundClub.featuredPhotos[i].imageId);
          } else if (process.env.ENVIRONMENT === 'prod'){
            s3Config.deleteFile(foundClub.featuredPhotos[i].imageId);
          }
          foundClub.featuredPhotos.splice(i,1);
        }
        var collegeName = foundClub.clubKeys.college;
        var clubCategory = foundClub.clubKeys.category;
        if(collegeName && collegeName != ''){
          CollegePage.findOne({name: collegeName}, function (err, foundCollegePage){
            if(foundCollegePage && foundCollegePage.allClubs.length){
              for(var i=foundCollegePage.allClubs.length-1;i>=0;i--){
                if(foundCollegePage.allClubs[i].category == clubCategory){
                  foundCollegePage.allClubs[i].categoryCount -= 1;
                  for(var j=foundCollegePage.allClubs[i].categoryClubIds.length-1;j>=0;j--){
                    if(foundCollegePage.allClubs[i].categoryClubIds[j].equals(foundClub._id)){
                      foundCollegePage.allClubs[i].categoryClubIds.splice(j,1);
                    }
                  }
                  break;
                }
              }
              foundCollegePage.clubCount -= 1;
              foundCollegePage.save();
            }
          });
        }
        User.updateOne({_id: req.user._id, userClubs: {$elemMatch: {id: req.params.club_id}}},
        {$pull: {userClubs: {id: req.params.club_id}}}, function(err, updatedUser){
        if(err || !updatedUser){
          logger.error(req.user._id+' : (profiles-39)updatedUser err => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }
        });
        if(foundClub.conversationId){
          ClubConversation.updateMany({_id: foundClub.conversationId}, {$set: {isActive: false}}, 
          function(err, updatedClubConversation){
          if(err || !updatedClubConversation){
            logger.error(req.user._id+' : (profiles-40)updatedClubConversation err => '+err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }
          });
        }
        foundClub.isActive = false;
        foundClub.deActivatedOn = Date.now();
        foundClub.save();
        req.flash('success', 'Club deleted successfully!');
        return res.redirect('/users/'+req.user._id);
      } else{
        logger.warn(req.user._id+' : rankCheck fail :Destroy Club');
        req.flash('error', "Only presidents can delete their club!");
        return res.redirect('back');
      }
    }
    });
  },

  profilesGetClubsFeaturedPhotos(req, res, next){
    Club.findById(req.params.id, function(err, foundClub){
    if(err || !foundClub){
      logger.error(req.user._id+' : (profiles-41)foundClub err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var moder = checkRank(foundClub.clubUsers,req.user._id,2);
      if(moder){
        featuredPhotos = foundClub.featuredPhotos;
        clubName = foundClub.name;
        clubId = foundClub._id;
        res.render('clubs/featured_photos', {featuredPhotos, clubName, clubId, cdn_prefix});
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      } else{
        res.redirect('back');
      }
    }
    });
  },

  profilesUpdateClubsFeaturedPhotos(req, res, next){
    Club.findById(req.params.id, async function(err, foundClub){
    if(err || !foundClub){
      logger.error(req.user._id+' : (profiles-42)foundClub err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var moder = checkRank(foundClub.clubUsers,req.user._id,2);
      if(moder){
        if(req.body.button == 'submit' && req.file && foundClub.featuredPhotos.length < 5){
          var obj = {};
          if(process.env.ENVIRONMENT === 'dev'){
            var result = await clConfig.cloudinary.v2.uploader.upload(req.file.path, clConfig.featuredClubPhotos_1080_obj);
            obj['image'] = result.secure_url;
            obj['imageId'] = result.public_id;
          } else if (process.env.ENVIRONMENT === 'prod'){
            var result = await s3Config.uploadFile(req.file, 'featuredClubPhotos/', 1080);
            s3Config.removeTmpUpload(req.file.path);
            obj['image'] = result.Location;
            obj['imageId'] = result.Key;
          }
          obj['heading'] = req.body.heading;
          obj['description'] = req.body.description;
          foundClub.featuredPhotos.push(obj);
          foundClub.save();
          req.flash('success', 'Successfully submitted');
          return res.redirect('/clubs/'+req.params.id+'/featured_photos');
        }
        if(req.body.delete && foundClub.featuredPhotos.length > 0){
          for(var i=foundClub.featuredPhotos.length-1;i>=0;i--){
            if(foundClub.featuredPhotos[i]._id.equals(req.body.delete)){
              if(process.env.ENVIRONMENT === 'dev'){
                clConfig.cloudinary.v2.uploader.destroy(foundClub.featuredPhotos[i].imageId);
              } else if (process.env.ENVIRONMENT === 'prod'){
                s3Config.deleteFile(foundClub.featuredPhotos[i].imageId);
              }
              foundClub.featuredPhotos.splice(i,1);
              foundClub.save();
              break;
            }
          }
          req.flash('success', 'Successfully deleted');
          return res.redirect('/clubs/'+req.params.id+'/featured_photos');
        }
        if(req.body.update && foundClub.featuredPhotos.length > 0){
          for(var i=foundClub.featuredPhotos.length-1;i>=0;i--){
            if(foundClub.featuredPhotos[i]._id.equals(req.body.update)){
              if(req.file){
                if(process.env.ENVIRONMENT === 'dev'){
                  clConfig.cloudinary.v2.uploader.destroy(foundClub.featuredPhotos[i].imageId);
                  var result = await clConfig.cloudinary.v2.uploader.upload(req.file.path, clConfig.featuredClubPhotos_1080_obj);
                  foundClub.featuredPhotos[i].image = result.secure_url;
                  foundClub.featuredPhotos[i].imageId = result.public_id;
                } else if (process.env.ENVIRONMENT === 'prod'){
                  s3Config.deleteFile(foundClub.featuredPhotos[i].imageId);
                  var result = await s3Config.uploadFile(req.file, 'featuredClubPhotos/', 1080);
                  s3Config.removeTmpUpload(req.file.path);
                  foundClub.featuredPhotos[i].image = result.Location;
                  foundClub.featuredPhotos[i].imageId = result.Key;
                }
                foundClub.featuredPhotos[i].heading = req.body.heading;
                foundClub.featuredPhotos[i].description = req.body.description;
                foundClub.save();
              } else{
                foundClub.featuredPhotos[i].heading = req.body.heading;
                foundClub.featuredPhotos[i].description = req.body.description;
                foundClub.save();
              }
            }
          }
          req.flash('success', 'Successfully updated');
          return res.redirect('/clubs/'+req.params.id+'/featured_photos');
        }
      } else{
        return res.redirect('back');
      }
    }
    });
  },

  profilesRegisterUserPage(req, res, next){
    res.render('register', {page: 'register'});
  },

  profilesSignUp(req, res, next){
    if(req.body.firstName.trim() != ''){
      var newFirstName = req.body.firstName.trim()[0].toUpperCase() + req.body.firstName.trim().substring(1).toLowerCase();
      var newLastName = req.body.lastName.trim()[0].toUpperCase() + req.body.lastName.trim().substring(1).toLowerCase();
      var newFullName = newFirstName+' '+newLastName;
      var newUser = new User({
        firstName: newFirstName,
        lastName: newLastName,
        fullName: newFullName,
        email: req.body.email,
        userKeys: req.body.userKeys,
        profilePic: null,
        profilePicId: null
      });
      var pass = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!$%@#£€*+/.()?& -]{6,18}$/;
      if(req.body.password.match(pass)){
        User.register(newUser, req.body.password, function(err, user){
        if(err || !user){
          if(err.code == 11000 || err.name == 'UserExistsError'){
            req.flash('error', 'A user with the given email is already registered, Please verify or Login to continue..');
          } else{
            logger.error('(profiles-43)user err => '+err);
            req.flash('error', 'Something went wrong :(');
          }
          return res.redirect('back');
        } else{
          // Create a verification token for this user
          var token = new Token({userId: user._id, token: crypto.randomBytes(20).toString('hex')});

          // Save the verification token
          token.save(function(err){
            if(err){return logger.error('(profiles-44)user err => '+err);}

            // Send the email
            var smtpTransport = nodemailer.createTransport({
              service: 'Godaddy', 
              auth: {
                user: 'team@clubmate.co.in',
                pass: process.env.TEAM_EMAIL_PW
              }
            });
            var mailOptions = {
              to: user.email,
              from: '"clubmate"team@clubmate.co.in',
              subject: 'Account Verification Token',
              text: 'Welcome to clubmate '+newFirstName+'!  ,\n\n' + 
              'Please verify your account by clicking the link: \nhttps:\/\/' + req.headers.host + 
              '\/confirmation\/' + token.token + '\n\n' +
              'Thanks,\n' +
              'Team clubmate',
              dkim: {
                domainName: 'clubmate.co.in',
                keySelector: 'dkimkey1',
                privateKey: process.env.DKIM_PRIVATE_KEY.replace(/\\n/g, '\n')
              }
            };
            smtpTransport.sendMail(mailOptions, function(err){
              done(err, 'done');
            });
          });
          req.flash('success', 'Welcome to clubmate '+user.firstName+'!  ,  An email has been sent to "'+req.body.email+'" for verification.');
          if(process.env.WAITING_WALL == 'true'){
            return res.redirect('/waiting');
          } else{
            return res.redirect('/discover');
          }
        }
        });
      } else{
        req.flash('error', 'Password must contain (6-18) characters, at least one letter and one number');
        return res.redirect('back');
      }
    } else{
      req.flash('error', 'First Name cannot be blank');
      return res.redirect('back');
    }
  },

  profilesVerifyUser(req, res, next){
    // Find a matching token
    Token.findOne({token: req.params.token}, function (err, token){
      if(!token){
        req.flash('error', 'We were unable to find a valid token. Your token may have expired.');
        return res.redirect('back');
      }

      // If we found a token, find a matching user
      User.findOne({_id: token.userId}, function (err, user){
        if(!user){
          req.flash('error', 'We were unable to find a user with that email.');
          return res.redirect('back');
        }
        if(user.isVerified){
          req.flash('error', 'This account has already been verified. Please log in.');
          return res.redirect('/login');
        }

        // Verify and save the user
        user.isVerified = true;
        user.save(function(err){
          if(err){return logger.error('(profiles-45)user err => '+err);}
          res.status(200);
          logger.info(user._id+' <= VERIFIED '+user.fullName);
          req.logIn(user, function(err){
            if (err){
              return next(err);
            }
            req.flash('success', 'Thank you for verification, you are now logged in :)');
            if(process.env.WAITING_WALL == 'true'){
              return res.redirect('/waiting');
            } else{
              return res.redirect('/users/' + req.user._id);
            }
          });
        });
      });
    });
  },

  profilesReVerify(req, res, next){
    res.render('re_verify');
  },

  profilesVerificationToken(req, res, next){
    User.findOne({ email: req.body.email }, function (err, user) {
      if(!user){
        req.flash('error', 'We were unable to find a user with that email.');
        return res.redirect('back');
      }
      if(user.isVerified){
        req.flash('error', 'This account has already been verified. Please log in.');
        return res.redirect('/login');
      }
      // Create a verification token for this user
      var token = new Token({userId: user._id, token: crypto.randomBytes(20).toString('hex')});

      // Save the verification token
      token.save(function (err){
        if(err){return logger.error('(profiles-46)user err => '+err);}

        // Send the email
        var smtpTransport = nodemailer.createTransport({
          service: 'Godaddy', 
          auth: {
            user: 'team@clubmate.co.in',
            pass: process.env.TEAM_EMAIL_PW
          }
        });
        var mailOptions = {
          to: user.email,
          from: '"clubmate"team@clubmate.co.in',
          subject: 'Account Verification Token',
          text: 'Hello '+user.firstName+',\n\n' + 'Please verify your account by clicking the link: \nhttps:\/\/' + req.headers.host + 
          '\/confirmation\/' + token.token + '\n\n' +
            'Thanks,\n' +
            'Team clubmate',
          dkim: {
            domainName: 'clubmate.co.in',
            keySelector: 'dkimkey1',
            privateKey: process.env.DKIM_PRIVATE_KEY.replace(/\\n/g, '\n')
          }
        };
        smtpTransport.sendMail(mailOptions, function(err){
          done(err, 'done');
        });
      });
      req.flash('success', 'An email has been sent to your account for verification.');
      if(process.env.WAITING_WALL == 'true'){
        return res.redirect('/waiting');
      } else{
        return res.redirect('/discover');
      }
    });
  },

  profilesLoginPage(req, res, next){
    res.render('login', {page: 'login'}); 
  },

  profilesLoginUser(req, res, next){
    passport.authenticate('local', function(err, user, info){
      if(err){
        req.flash('error', err);
        return next(err);
      }
      if(!user){
        req.flash('error', info.message);
        return res.redirect('/login');
      }
      req.session.userId = user._id;
      req.logIn(user, function(err){
        if(err){return next(err);}
        if(process.env.WAITING_WALL == 'true'){
          return res.redirect('/waiting');
        } else{
          return res.redirect('/discover');
        }
      });
    })(req, res, next);
  },

  profilesLogout(req, res, next){
    if(req.user){
      User.updateOne({_id: req.user._id}, {lastLoggedOut: Date.now()}, 
      function(err, updatedUser){
        if(err || !updatedUser){
          logger.error(req.user._id+' : (profiles-47)updateUser err => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }
      });
      req.logout();
      delete req.session.userId;
      req.flash('success', 'Logged out');
      // res.redirect('/discover');
      return res.redirect('/');
    } else{
      // res.redirect('/discover');
      return res.redirect('/');
    }
  },

  profilesForgotPage(req, res, next){
    res.render('forgot');
  },

  profilesForgotPass(req, res, next){
    async.waterfall([
      function(done){
        crypto.randomBytes(20, function(err, buf){
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done){
        User.findOne({email: req.body.email}, function(err, user){
        if(err || !user){
          logger.error('(profiles-48)forgot err => '+err);
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        } else{
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
          user.save(function(err){
            done(err, token, user);
          });
        }
        });
      },
      function(token, user, done){
        var smtpTransport = nodemailer.createTransport({
          service: 'Godaddy', 
          auth: {
            user: 'team@clubmate.co.in',
            pass: process.env.TEAM_EMAIL_PW
          }
        });
        var mailOptions = {
          to: user.email,
          from: '"clubmate"team@clubmate.co.in',
          subject: 'Password reset request',
          text: 'Hello '+user.firstName+',\n\n' +
            'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'https://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n\n' +
            'Thanks,\n' +
            'Team clubmate',
          dkim: {
            domainName: 'clubmate.co.in',
            keySelector: 'dkimkey1',
            privateKey: process.env.DKIM_PRIVATE_KEY.replace(/\\n/g, '\n')
          }
        };
        smtpTransport.sendMail(mailOptions, function(err){
          logger.info('mail sent('+ user.email +' requested a password change)');
          req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
          done(err, 'done');
        });
      }
    ], function(err){
      res.redirect('/forgot');
    });
  },

  profilesForgotToken(req, res, next){
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
    if (err || !user){
      logger.info('(profiles-49)token invalid err => '+err);
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    } else{
      res.render('reset', {token: req.params.token});
    }
    });
  },

  profilesResetPass(req, res, next){
    var pass = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!$%@#£€*+/.()?& -]{6,18}$/;
    if(req.body.password.match(pass)){
      async.waterfall([
        function(done){
          User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
          if(err || !user){
            logger.error('(profiles-50)token invalid err => '+err);
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
          } else{
            if(req.body.password === req.body.confirm){
              user.setPassword(req.body.password, function(err){
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                user.save(function(err){
                  req.logIn(user, function(err){
                    done(err, user);
                  });
                });
              })
            } else{
              logger.info('(profiles-51)pass dont match err => '+err);
              req.flash("error", "Passwords do not match.");
              return res.redirect('back');
            }
          }
          });
        },
        function(user, done){
          var smtpTransport = nodemailer.createTransport({
            service: 'Godaddy', 
            auth: {
              user: 'team@clubmate.co.in',
              pass: process.env.TEAM_EMAIL_PW
            }
          });
          var mailOptions = {
            to: user.email,
            from: '"clubmate"team@clubmate.co.in',
            subject: 'Password reset request',
            text: 'Hello '+user.firstName+',\n\n' +
              'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n\n' +
            'Thanks,\n' +
            'Team clubmate',
            dkim: {
              domainName: 'clubmate.co.in',
              keySelector: 'dkimkey1',
              privateKey: process.env.DKIM_PRIVATE_KEY.replace(/\\n/g, '\n')
            }
          };
          smtpTransport.sendMail(mailOptions, function(err){
            logger.info('mail sent(Password for '+ user.fullName +' - '+ user.email +' has changed)');
            req.flash('success', 'Success! Your password has been changed.');
            done(err, 'done');
          });
        }
      ], function(err){
        if(process.env.WAITING_WALL == 'true'){
          return res.redirect('/waiting');
        } else{
          return res.redirect('/discover');
        }
      });
    } else{
      req.flash('error', 'Password must contain (6-18) characters, at least one letter and one number.');
      return res.redirect('back');
    }
  },

  profilesWaitingPage(req, res, next){
    User.countDocuments({}, function(err, count) {
      return res.render('waiting', {count});
    });
  }
  
  // profilesGoogleAuthCallback(req, res, next){
  //   return res.redirect('/discover');
  // }
};

//*******************FUNCTIONS***********************
function escapeRegExp(str){
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function checkRank(clubUsers,userId,rank){
  var ok = false;
  clubUsers.forEach(function(user){
    if(user.id.equals(userId) && user.userRank <= rank){
      ok = true;
    }
  });
  return ok;
};

function currentRank(clubUsers,userId){
  var rank;
  clubUsers.forEach(function(user){
    if(user.id._id.equals(userId)){
      rank = user.userRank;
    }
  });
  return rank;
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
    for(var i=post.likeCount-1;i>=0;i--){
      if(post.likeUserIds[i].equals(user._id)){
        hasVote = 1;
        break;
      }
    }
    for(var k=post.heartCount-1;k>=0;k--){
      if(post.heartUserIds[k].equals(user._id)){
        hasVote = 3;
        break;
      }
    }
    return hasVote;
  };
};

function modVoteCheck(user,post){
  var hasModVote = 0;
  if(user){
    for(var i=post.upVoteCount-1;i>=0;i--){
      if(post.upVoteUserIds[i].equals(user._id)){
        hasModVote = 1;
        break;
      }
    }
    for(var j=post.downVoteCount-1;j>=0;j--){
      if(post.downVoteUserIds[j].equals(user._id)){
        hasModVote = -1;
        break;
      }
    }
    return hasModVote;
  };
};

function contains(array, obj){
  var len = array.length;
  if(len!=0){
    for(var i=0;i<len;i++){
      if(array[i].equals(obj)){
        return true;
        break;
      }
    }
    return false;
  } else if(len == 0){return false};
}

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