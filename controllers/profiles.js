const express          = require('express'),
  router               = express.Router(),
  passport             = require('passport'),
  User                 = require('../models/user'),
  Club                 = require('../models/club'),
  Post                 = require('../models/post'),
  OrgPage              = require('../models/organization-page'),
  Token                = require('../models/token'),
  async                = require('async'),
  nodemailer           = require('nodemailer'),
  crypto               = require('crypto'),
  mongoose             = require('mongoose'),
  moment               = require('moment'),
  {cloudinary, upload} = require('../public/js/cloudinary'),
  mbxGeocoding         = require('@mapbox/mapbox-sdk/services/geocoding'),
  geocodingClient      = mbxGeocoding({ accessToken: process.env.MAPBOX_TOKEN });


module.exports = {
  profilesUserProfile(req, res, next){
    if(req.user && !req.user._id.equals(req.params.id)){
      User.findById(req.params.id).populate({path: 'userClubs.id', select: 'name avatar avatarId'})
      .populate({path: 'clubInvites', select: 'name clubUsers'})
      .exec(function(err, foundUser){
      if(err || !foundUser){
        console.log(req.user._id+' => (profiles-1)foundUser err:- '+JSON.stringify(err, null, 2));
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
          console.log(req.user._id+' => (profiles-2)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          // Server rendered posts(2)
          Post.find({'postAuthor.id': req.params.id})
          .populate({path: 'postClub', select: 'name avatar avatarId'})
          .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
          .sort({createdAt: -1}).limit(5)
          .exec(function(err, foundUserPosts){
          if(err || !foundUserPosts){
            console.log(req.user._id+' => (profiles-3)foundUserPosts err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          } else{
            var currentUser = req.user;
            var foundPostIds = foundUserPosts.map(function(post){
              return post._id;
            });
            // Is conversation initiated/NOT../blocked?
            var isBlocked = false, hasConversation = false, conversationId = '', recipientId = '';
            if(foundUser.blockedUsers.length != 0){
              for(var i=0;i<foundUser.blockedUsers.length;i++){
                if(foundUser.blockedUsers[i].equals(req.user._id)){
                  var isBlocked = true;
                  break;
                }
              }
            }
            // Javascript is synchronus right?
            if(isBlocked == false){
              if(foundUser.userChats.length != 0){
                for(var i=0;i<foundUser.userChats.length;i++){
                  if(foundUser.userChats[i].userId.equals(req.user._id)){
                    var hasConversation = true;
                    var conversationId = foundUser.userChats[i].conversationId;
                    break;
                  }
                }
              } else{hasConversation = false};
            }
            if(hasConversation == false){
              var recipientId = foundUser._id;
            }
            // Match ~ if current user(cU) is logged in user(fU)
            var match = false;
            var userPosts = foundUserPosts;
            var posts = postPrivacy(userPosts, req.user);
            var modPosts = postModeration(posts,req.user);
            sortComments(modPosts);
            var hasVote = [], hasModVote = [], PC_50_clubAvatar = [], Clubs_50_clubAvatar = [];
            var k=0; var len = modPosts.length;
            for(k;k<len;k++){
              PC_50_clubAvatar[k] = cloudinary.url(modPosts[k].postClub.avatarId,
              {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
              hasVote[k] = voteCheck(req.user,modPosts[k]);
              hasModVote[k] = modVoteCheck(req.user,posts[k]);
            }
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
              // If friend, then show 10 server rendered clubs under Clubs Tab
              var limitedClubs = clubs.slice(0,9);
              for(var k=0;k<limitedClubs.length;k++){
                Clubs_50_clubAvatar[k] = cloudinary.url(limitedClubs[k].id.avatarId,
                {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
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
            return res.render('users/show', {haveRequest, sentRequest, isFriend, hasVote, hasModVote,
            user: foundUser, posts: modPosts, clubs: limitedClubs, match, adminClubs, clubInvites, mutualClubs,
            conversationId,recipientId, foundPostIds, PC_50_clubAvatar, Clubs_50_clubAvatar, foundFriends,
            clubCount});
          }
          });
        }
        });
      }
      });
    } else if(req.user && req.user._id.equals(req.params.id)){
      User.findById(req.params.id).populate({path: 'userClubs.id', select: 'name avatar avatarId'})
      .populate({path: 'clubInvites', select: 'name clubUsers'})
      .exec(function(err, foundUser){
      if(err || !foundUser){
        console.log(req.user._id+' => (profiles-4)foundUser err:- '+JSON.stringify(err, null, 2));
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
          console.log(req.user._id+' => (profiles-5)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          Post.find({'postAuthor.id': req.params.id})
          .populate({path: 'postClub', select: 'name avatar avatarId'})
          .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
          .sort({createdAt: -1}).limit(5)
          .exec(function(err, foundUserPosts){
          if(err || !foundUserPosts){
            console.log(req.user._id+' => (profiles-6)foundUserPosts err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          } else{
            var foundPostIds = foundUserPosts.map(function(post){
              return post._id;
            });
            var currentUser = req.user;
            var isBlocked = false, hasConversation = false, conversationId = '', recipientId = '';
            if(foundUser.blockedUsers.length != 0){
              for(var i=0;i<foundUser.blockedUsers.length;i++){
                if(foundUser.blockedUsers[i].equals(req.user._id)){
                  var isBlocked = true;
                  break;
                }
              }
            }
            if(isBlocked == false){
              if(foundUser.userChats.length != 0){
                for(var i=0;i<foundUser.userChats.length;i++){
                  if(foundUser.userChats[i].userId.equals(req.user._id)){
                    var hasConversation = true;
                    var conversationId = foundUser.userChats[i].conversationId;
                    break;
                  }
                }
              } else{hasConversation = false};
            }
            if(hasConversation == false){
              var recipientId = foundUser._id;
            }
            var match = true;
            var userPosts = foundUserPosts;
            var posts = postPrivacy(userPosts, req.user);
            var modPosts = postModeration(posts,req.user);
            sortComments(modPosts);
            var hasVote = [], hasModVote = [], PC_50_clubAvatar = [], Clubs_50_clubAvatar = [];
            var k=0; var len = modPosts.length;
            for(k;k<len;k++){
              PC_50_clubAvatar[k] = cloudinary.url(modPosts[k].postClub.avatarId,
              {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
              hasVote[k] = voteCheck(req.user,modPosts[k]);
              hasModVote[k] = modVoteCheck(req.user,posts[k]);
            }
            var clubs = foundUser.userClubs.sort(function(a, b) {
              return parseFloat(a.rank) - parseFloat(b.rank);
            });
            var limitedClubs = clubs.slice(0,9);
            for(var k=0;k<limitedClubs.length;k++){
              Clubs_50_clubAvatar[k] = cloudinary.url(limitedClubs[k].id.avatarId,
              {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
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
            return res.render("users/show", {haveRequest, sentRequest, isFriend, hasVote, hasModVote,
            user: foundUser, posts: modPosts, clubs: limitedClubs, match, adminClubs, clubInvites, mutualClubs,
            conversationId, recipientId, foundPostIds, PC_50_clubAvatar, Clubs_50_clubAvatar, foundFriends,
            clubCount});
          }
          });
        }
        });
      }
      });
    } else if(!req.user){
      User.findById(req.params.id, function(err, foundUser){
      if(err || !foundUser){
        console.log('(profiles-7)foundUser err:- '+JSON.stringify(err, null, 2));
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
          console.log(req.user._id+' => (profiles-8)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          Post.find({'postAuthor.id': req.params.id, privacy: 0, moderation: 0})
          .populate({path: 'postClub', select: 'name avatar avatarId'})
          .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
          .sort({createdAt: -1}).limit(5)
          .exec(function(err, foundUserPosts){
          if(err || !foundUserPosts){
            console.log('(profiles-9)foundUserPosts err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          } else{
            var foundPostIds = foundUserPosts.map(function(post){
              return post._id;
            });
            var match = false;
            var userPosts = foundUserPosts;
            sortComments(userPosts);
            var hasVote = [], hasModVote = [], PC_50_clubAvatar = [], Clubs_50_clubAvatar = [];
            var k=0; var len = userPosts.length;
            for(k;k<len;k++){
              PC_50_clubAvatar[k] = cloudinary.url(userPosts[k].postClub.avatarId,
              {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
              hasVote[k] = voteCheck(req.user,userPosts[k]);
              hasModVote[k] = modVoteCheck(req.user,userPosts[k]);
            }
            var clubCount = foundUser.userClubs.length;
            var sentRequest = haveRequest = isFriend = false;
            var adminClubs = []; var clubInvites = []; var mutualClubs = []; var hasVote = [];
            return res.render("users/show", {haveRequest, sentRequest, isFriend, hasVote, hasModVote,
            user: foundUser, posts: userPosts, match, adminClubs, clubInvites, mutualClubs, foundPostIds,
            PC_50_clubAvatar, foundFriends, clubCount});
          }
          });
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
      console.log('(profiles-10)foundUser err:- '+JSON.stringify(err, null, 2));
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
            Clubs_50_clubAvatar[k] = cloudinary.url(limitedClubs[k].id.avatarId,
            {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
          }
          var newStart = (start+10).toString(), newEnd = (end+10).toString();
          var newEndpoints = newStart+','+newEnd;
          res.json({clubs: limitedClubs, clubCount, Clubs_50_clubAvatar, newEndpoints, userId: foundUser._id,
          rank, currentUserId, match});
        }
      }
    }
    });
  },

  profilesUserMorePosts(req, res, next){
    if(req.user){
      var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
      {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
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
        console.log(req.user._id+' => (profiles-11)foundUserPosts err:- '+JSON.stringify(err, null, 2));
        return res.sendStatus(500);
      } else{
        var arrLength = foundUserPosts.length;
        var currentUser = req.user; var match = false;
        var foundPostIds = foundUserPosts.map(function(post){
          return post._id;
        });
        var userPosts = foundUserPosts;
        var posts = postPrivacy(userPosts, req.user);
        var modPosts = postModeration(posts,req.user);
        sortComments(modPosts);
        var hasVote = [], hasModVote = [], PC_50_clubAvatar = []; var k=0; var len = modPosts.length;
        for(k;k<len;k++){
          PC_50_clubAvatar[k] = cloudinary.url(modPosts[k].postClub.avatarId,
          {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
          hasVote[k] = voteCheck(req.user,modPosts[k]);
          hasModVote[k] = modVoteCheck(req.user,posts[k]);
        }
        return res.json({hasVote, hasModVote, posts: modPosts, match, currentUser, foundPostIds, PC_50_clubAvatar,
        CU_50_profilePic, arrLength});
      }
      });
    } else{
      var CU_50_profilePic = null;
      if(req.query.ids != ''){
        var seenIds = req.query.ids.split(',');
      } else{
        var seenIds = [];
      }
      Post.find({'postAuthor.id': req.params.id, privacy: 0, moderation: 0, _id: {$nin: seenIds}})
      .populate({path: 'postClub', select: 'name avatar avatarId'})
      .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
      .sort({createdAt: -1}).limit(10)
      .exec(function(err, foundUserPosts){
      if(err || !foundUserPosts){
        console.log('(profiles-12)foundUserPosts err:- '+JSON.stringify(err, null, 2));
        return res.sendStatus(500);
      } else{
        var arrLength = foundUserPosts.length;
        var currentUser = req.user; var match = false;
        var foundPostIds = foundUserPosts.map(function(post){
          return post._id;
        });
        var userPosts = foundUserPosts;
        sortComments(userPosts);
        var hasVote = [], hasModVote = [], PC_50_clubAvatar = []; var k=0; var len = userPosts.length;
        for(k;k<len;k++){
          PC_50_clubAvatar[k] = cloudinary.url(userPosts[k].postClub.avatarId,
          {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
          hasVote[k] = voteCheck(req.user,userPosts[k]);
          hasModVote[k] = modVoteCheck(req.user,userPosts[k]);
        }
        return res.json({hasVote, hasModVote, posts: userPosts, match, currentUser, foundPostIds, PC_50_clubAvatar,
        CU_50_profilePic, arrLength});
      }
      });
    }
  },

  profilesUserMoreHeartPosts(req, res, next){
    if(req.user){
      var CU_50_profilePicH = cloudinary.url(req.user.profilePicId,
      {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
      if(req.query.heartIds != ''){
        var seenIds = req.query.heartIds.split(',');
      } else{
        var seenIds = [];
      }
      Post.find({$and: [{_id: {$in: req.user.postHearts}},{_id: {$nin: seenIds}}]})
      .populate({path: 'postClub', select: 'name avatar avatarId'})
      .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
      .sort({createdAt: -1}).limit(10)
      .exec(function(err, foundHeartPosts){
      if(err || !foundHeartPosts){
        console.log(req.user._id+' => (profiles-13)foundHeartPosts err:- '+JSON.stringify(err, null, 2));
        return res.sendStatus(500);
      } else{
        var arrLength = foundHeartPosts.length;
        var currentUser = req.user; var match = false;
        var foundHPostIds = foundHeartPosts.map(function(post){
          return post._id;
        });
        var userPosts = foundHeartPosts;
        var posts = postPrivacy(userPosts, req.user);
        var modPosts = postModeration(posts,req.user);
        sortComments(modPosts);
        var hasVote = [], hasModVote = [], PC_50_clubAvatarH = []; var k=0; var len = modPosts.length;
        for(k;k<len;k++){
          PC_50_clubAvatarH[k] = cloudinary.url(modPosts[k].postClub.avatarId,
          {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
          hasVote[k] = voteCheck(req.user,modPosts[k]);
          hasModVote[k] = modVoteCheck(req.user,posts[k]);
        }
        return res.json({hasVote, hasModVote, posts: modPosts, match, currentUser, foundHPostIds, CU_50_profilePicH,
        PC_50_clubAvatarH, arrLength});
      }
      });
    } else{
      res.redirect('back');
    }
  },

  profilesUpdateUserProfile(req, res, next){
    User.findById(req.params.id, async function(err, foundUser){
    if(err || !foundUser){
      console.log(req.user._id+' => (profiles-14)foundUser err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      if(req.file){
        try{
          if(foundUser.profilePicId != null){
            await cloudinary.v2.uploader.destroy(foundUser.profilePicId);
          }
          var result = await cloudinary.v2.uploader.upload(req.file.path,
            {folder: 'profilePics/', use_filename: true, width: 1024, height: 768, crop: 'limit'});
          //replace original information with new information
          foundUser.profilePicId = result.public_id;
          foundUser.profilePic = result.secure_url;
        } catch(err){
          console.log(req.user._id+' => (profiles-15)profilePicUpload err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }
      }
      if(req.body.delUpdate){
        if(foundUser.clubUpdates.length != 0){
          for(i=foundUser.clubUpdates.length-1;i>=0;i--){
            if(foundUser.clubUpdates[i]._id.equals(req.body.delUpdate)){
              foundUser.clubUpdates.splice(i,1);
            }
          }
        };
      }
      if(req.body.note){
        foundUser.note = req.body.note;
      }
      if(req.body.userKeys){
        if(req.body.userKeys.birthdate && req.body.userKeys.sex){
          foundUser.userKeys.birthdate = req.body.userKeys.birthdate;
          foundUser.userKeys.sex = req.body.userKeys.sex;
        } else if(req.body.userKeys && !(req.body.userKeys.birthdate && req.body.userKeys.sex)){
          // COLLEGE PAGE(OrgPage)
          if(foundUser.userKeys.college != req.body.userKeys.college.replace(/[^a-zA-Z'()0-9 ]/g, '')){
            var oldCollegeName = foundUser.userKeys.college;
            var newCollegeName = req.body.userKeys.college.replace(/[^a-zA-Z'()0-9 -]/g, '');
            OrgPage.findOne({name: oldCollegeName}, function (err, foundOldOrgPage){
              if(foundOldOrgPage && foundOldOrgPage.allUsers.length){
                for(var i=foundOldOrgPage.allUsers.length-1;i>=0;i--){
                  if(foundOldOrgPage.allUsers[i].equals(foundUser._id)){
                    foundOldOrgPage.allUsers.splice(i,1);
                    break;
                  }
                }
                foundOldOrgPage.userCount -= 1;
                foundOldOrgPage.save();
              }
            });
            OrgPage.findOne({name: newCollegeName}, function (err, foundNewOrgPage){
              if(foundNewOrgPage){
                foundNewOrgPage.allUsers.push(foundUser._id);
                foundNewOrgPage.userCount += 1;
                foundNewOrgPage.save();
              } else{
                if(newCollegeName && newCollegeName != ''){
                  OrgPage.create({name: newCollegeName}, function (err, createdNewOrgPage){
                    createdNewOrgPage.allUsers.push(foundUser._id);
                    createdNewOrgPage.userCount += 1;
                    createdNewOrgPage.save();
                  });
                }
              }
            });
            foundUser.userKeys.college = newCollegeName;
          }
          foundUser.userKeys.concentration = req.body.userKeys.concentration.replace(/[^a-zA-Z'()0-9 ]/g, '');
          foundUser.userKeys.batch = req.body.userKeys.batch.replace(/[^0-9 ]/g, '');
          foundUser.userKeys.workplace = req.body.userKeys.workplace.replace(/[^a-zA-Z'()0-9 ]/g, '');
          foundUser.userKeys.school = req.body.userKeys.school.replace(/[^a-zA-Z'()0-9 ]/g, '');
          if(foundUser.userKeys.residence && foundUser.userKeys.residence != ''){
            let response = await geocodingClient
            .forwardGeocode({
              query: req.body.userKeys.residence,
              limit: 1
            })
            .send();
            foundUser.userKeys.residence = req.body.userKeys.residence.replace(/[^a-zA-Z',0-9 .]/g, '');
            foundUser.geometry = response.body.features[0].geometry;
          } else{
            foundUser.geometry = undefined;
          }
        }
      }
      editinfo(0,req.body.interests,foundUser.interests);
      editinfo(1,req.body.music,foundUser.favourites.music);
      editinfo(2,req.body.movies,foundUser.favourites.movies);
      editinfo(3,req.body.tvshows,foundUser.favourites.tvshows);
      editinfo(4,req.body.places,foundUser.favourites.places);
      editinfo(5,req.body.books,foundUser.favourites.books);
      editinfo(6,req.body.videogames,foundUser.favourites.videogames);

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
          else if(count==1){foundUser.favourites.music=oldData;}
          else if(count==2){foundUser.favourites.movies=oldData;}
          else if(count==3){foundUser.favourites.tvshows=oldData;}
          else if(count==4){foundUser.favourites.places=oldData;}
          else if(count==5){foundUser.favourites.books=oldData;}
          else if(count==6){foundUser.favourites.videogames=oldData;}
        }
      };
      foundUser.save();
      req.flash('success', 'Successfully updated');
      res.redirect('/users/' + req.params.id);
    }
    });
  },

  profilesNewClub(req, res, next){
    cloudinary.v2.uploader.upload(req.file.path, {folder: 'clubAvatars/', use_filename: true, width: 1024, height: 768, crop: 'limit'},
    function(err, result){
    if(err){
      console.log(req.user._id+' => (profiles-16)avatarUpload err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      req.body.avatar = result.secure_url;
      req.body.avatarId = result.public_id;
      User.findById(req.params.id).populate('userClubs.id').exec(function(err, foundUser){
      if(err || !foundUser){
        console.log(req.user._id+' => (profiles-17)foundUser err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        Club.create(req.body, function(err, newClub){
        if (err || !newClub){
          console.log(req.user._id+' => (profiles-18)newClub err:- '+JSON.stringify(err, null, 2));
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
            console.log(req.user._id+' => (profiles-19)newClub err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          } else{
            newClub.populate('clubUsers.id', function(err, populatedClub){
            if (err || !populatedClub){
              console.log(req.user._id+' => (profiles-20)populatedClub err:- '+JSON.stringify(err, null, 2));
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
              res.redirect('/clubs/' + newClub._id);
            }
            });
          }
          });
        }
        });
      }
      });
    }
    });
  },

  profilesClubProfile(req, res, next){
    Club.findById(req.params.club_id)
    .populate({path: 'clubUsers.id', select: 'firstName fullName profilePic profilePicId'})
    .exec(function(err, foundClub){
    if(err || !foundClub){
      console.log('(profiles-21)foundClub err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      if(req.user){
        Post.find({postClub: req.params.club_id})
        .populate({path: 'postAuthor.id', select: 'firstName fullName profilePic profilePicId'})
        .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
        .sort({createdAt: -1}).limit(5)
        .exec(function(err, clubPosts){
        if(err || !clubPosts){
          console.log(req.user._id+' => (profiles-22)clubPosts err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          var foundPostIds = clubPosts.map(function(post){
            return post._id;
          });
          var posts = postPrivacy(clubPosts, req.user);
          var modPosts = postModeration(posts,req.user);
          sortComments(modPosts);
          var hasVote = [], hasModVote = [], PA_50_profilePic = [], Users_50_profilePic = [];
          var k=0; var len = modPosts.length;
          for(k;k<len;k++){
            PA_50_profilePic[k] = cloudinary.url(modPosts[k].postAuthor.id.profilePicId,
            {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
            hasVote[k] = voteCheck(req.user,modPosts[k]);
            hasModVote[k] = modVoteCheck(req.user,posts[k]);
          }
          var users = foundClub.clubUsers.sort(function(a, b){
            return parseFloat(a.userRank) - parseFloat(b.userRank);
          });
          var limitedUsers = users.slice(0,1);
          for(var k=0;k<limitedUsers.length;k++){
            Users_50_profilePic[k] = cloudinary.url(limitedUsers[k].id.profilePicId,
            {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
          }
          var rank = currentRank(users,req.user._id);
          if(0 <= rank && rank <= 4){
            var conversationId = '', convClubId = '';
            if(foundClub.conversationId){
              var conversationId = foundClub.conversationId;
            } else{var convClubId = foundClub._id;}
          } else{foundClub.updates = '';}
          // Make it for posts made in past week
          Post.find({postClub: req.params.club_id, topic: {$ne: ''}})
          .select({topic: 1, upVoteCount: 1, downVoteCount: 1, moderation: 1, postAuthor: 1, postClub: 1})
          .sort({upVoteCount: -1}).limit(5).exec(function(err, topTopicPosts){
          if(err || !topTopicPosts){
          console.log(req.user._id+' => (profiles-23)topTopicPosts err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
          } else{
            var modTopTopicPosts = postModeration(topTopicPosts,req.user);
            res.render('clubs/show', {hasVote, hasModVote, posts: modPosts, rank, currentUser: req.user,
            users: limitedUsers, conversationId, convClubId, foundPostIds, PA_50_profilePic, club: foundClub,
            Users_50_profilePic, topTopicPosts: modTopTopicPosts});
          }
          });
        }
        });
      } else{
        Post.find({postClub: req.params.club_id, privacy: 0, moderation: 0})
        .populate({path: 'postAuthor.id', select: 'firstName fullName profilePic profilePicId'})
        .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
        .sort({createdAt: -1}).limit(5)
        .exec(function(err, clubPosts){
        if(err || !clubPosts){
          console.log('(profiles-24)clubPosts err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          var foundPostIds = clubPosts.map(function(post){
            return post._id;
          });
          var posts = clubPosts;
          sortComments(posts);
          var hasVote = [], hasModVote = [], PA_50_profilePic = [], Users_50_profilePic = [];
          var k=0; var len = posts.length;
          for(k;k<len;k++){
            PA_50_profilePic[k] = cloudinary.url(posts[k].postAuthor.id.profilePicId,
            {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
            hasVote[k] = voteCheck(req.user,posts[k]);
            hasModVote[k] = modVoteCheck(req.user,posts[k]);
          }
          var users = foundClub.clubUsers.sort(function(a, b) {
            return parseFloat(a.userRank) - parseFloat(b.userRank);
          });
          var limitedUsers = users.slice(0,1);
          for(var k=0;k<limitedUsers.length;k++){
            Users_50_profilePic[k] = cloudinary.url(limitedUsers[k].id.profilePicId,
            {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
          }
          var rank, currentUser = null; var topTopicPosts = [];
          foundClub.updates = '';
          res.render('clubs/show', {hasVote, hasModVote, posts, currentUser, rank, users: limitedUsers,
          club: foundClub, foundPostIds, topTopicPosts, PA_50_profilePic, Users_50_profilePic});
        }
        });
      }
    }
    });
  },

  profilesClubMoreMembers(req, res, next){
    Club.findById(req.params.club_id)
    .populate({path: 'clubUsers.id', select: 'firstName fullName profilePic profilePicId'})
    .exec(function(err, foundClub){
    if(err || !foundClub){
      console.log('(profiles-25)foundClub err:- '+JSON.stringify(err, null, 2));
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
            Users_50_profilePic[k] = cloudinary.url(limitedUsers[k].id.profilePicId,
            {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
          }
          var newStart = (start+10).toString(), newEnd = (end+10).toString();
          var newEndpoints = newStart+','+newEnd;
          res.json({users: limitedUsers, Users_50_profilePic, newEndpoints, clubId: foundClub._id, rank});
        }
      }
    }
    });
  },

  profilesClubSearchMembers(req, res, next){
    Club.findById(req.params.club_id)
    .populate({path: 'clubUsers.id', select: 'firstName fullName profilePic profilePicId'})
    .exec(function(err, foundClub){
    if(err || !foundClub){
      console.log('(profiles-26)foundClub err:- '+JSON.stringify(err, null, 2));
      return res.sendStatus(500);
    } else{
      if(req.user){
        if(req.query.name && req.query.name != ''){
          var matchingUsers = []; var Users_50_profilePic = [];
          var rank = currentRank(foundClub.clubUsers,req.user._id);
          var query = req.query.name.replace(/[^a-zA-Z ]/g, '');
          var regexQuery = new RegExp("\\b" + query + "\\b", 'gi');
          for(var i=0;i<foundClub.clubUsers.length;i++){
            // JS test() returns false for next iteration(matches only once??)
            // var match = regexQuery.test(foundClub.clubUsers[i].id.fullName);
            var match = foundClub.clubUsers[i].id.fullName.match(regexQuery);
            if(match){
              matchingUsers.push(foundClub.clubUsers[i]); 
            }
          }
          for(var j=0;j<matchingUsers.length;j++){
              Users_50_profilePic[j] = cloudinary.url(matchingUsers[j].id.profilePicId,
              {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
            }
          res.json({users: matchingUsers, Users_50_profilePic, clubId: foundClub._id, rank});
        } else{
          req.flash('error', 'Please enter a valid member name');
          return res.redirect('back');
        }
      }
    }
    });
  },

  profilesClubMorePosts(req, res, next){
    if(req.user){
      var CU_50_profilePic = cloudinary.url(req.user.profilePicId,
      {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
      if(req.query.ids != ''){
        var seenIds = req.query.ids.split(',');
      } else{
        var seenIds = [];
      }
      Post.find({postClub: req.params.club_id, _id: {$nin: seenIds}})
      .populate({path: 'postAuthor.id', select: 'fullName profilePic profilePicId'})
      .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
      .sort({createdAt: -1}).limit(10)
      .exec(function(err, clubPosts){
      if(err || !clubPosts){
        console.log(req.user._id+' => (profiles-27)clubPosts err:- '+JSON.stringify(err, null, 2));
        return res.sendStatus(500);
      } else{
        var arrLength = clubPosts.length;
        var foundPostIds = clubPosts.map(function(post){
          return post._id;
        });
        var posts = postPrivacy(clubPosts, req.user);
        var modPosts = postModeration(posts,req.user);
        sortComments(modPosts);
        var hasVote = [], hasModVote = [], PA_50_profilePic = []; var k=0; var len = modPosts.length;
        for(k;k<len;k++){
          PA_50_profilePic[k] = cloudinary.url(modPosts[k].postAuthor.id.profilePicId,
          {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
          hasVote[k] = voteCheck(req.user,modPosts[k]);
          hasModVote[k] = modVoteCheck(req.user,posts[k]);
        }
        var currentUser = req.user;
        var rank = currentRank2(req.params.club_id,req.user.userClubs);
        res.json({hasVote, hasModVote, posts: modPosts, rank, currentUser, foundPostIds, PA_50_profilePic,
        CU_50_profilePic, arrLength});
      }
      });
    } else{
      var CU_50_profilePic = null;
      if(req.query.ids != ''){
        var seenIds = req.query.ids.split(',');
      } else{
        var seenIds = [];
      }
      Post.find({postClub: req.params.club_id, privacy: 0, moderation: 0, _id: {$nin: seenIds}})
      .populate({path: 'postAuthor.id', select: 'fullName profilePic profilePicId'})
      .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
      .sort({createdAt: -1}).limit(10)
      .exec(function(err, clubPosts){
      if(err || !clubPosts){
        console.log('(profiles-28)clubPosts err:- '+JSON.stringify(err, null, 2));
        return res.sendStatus(500);
      } else{
        var arrLength = clubPosts.length;
        var foundPostIds = clubPosts.map(function(post){
          return post._id;
        });
        var posts = clubPosts;
        sortComments(posts);
        var hasVote = [], hasModVote = [], PA_50_profilePic = []; var k=0; var len = posts.length;
        for(k;k<len;k++){
          PA_50_profilePic[k] = cloudinary.url(posts[k].postAuthor.id.profilePicId,
          {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
          hasVote[k] = voteCheck(req.user,posts[k]);
          hasModVote[k] = modVoteCheck(req.user,posts[k]);
        }
        var rank, currentUser = null;
        res.json({hasVote, hasModVote, posts, rank, currentUser, foundPostIds, PA_50_profilePic,
        CU_50_profilePic, arrLength});
      }
      });
    }
  },

  profilesUpdateClubProfile(req, res, next){
    Club.findById(req.params.club_id, async function(err, foundClub){
    if(err || !foundClub){
      console.log(req.user._id+' => (profiles-29)foundClub err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var rankUsers = foundClub.clubUsers;
      var admin = checkRank(rankUsers,req.user._id,1); 
      var moder = checkRank(rankUsers,req.user._id,2);
      if(req.body.newsUpdate && moder == true){
        if(req.body.newsDate && req.body.newsDate != ''){
          var strDate = req.body.newsDate;
          var date = moment(strDate, 'MM-DD-YYYY').toDate();
        } else{var eventDate = null;}
        var news = req.body.newsUpdate;
        var clubId = foundClub._id;
        var clubName = foundClub.name;
        var pusherName = req.user.fullName;
        var clubUpdate = {'news': news, 'eventDate': date, 'pusherName': pusherName};
        foundClub.updates.push(clubUpdate);
        // foundClub is locked for modification untill fn updatedClub is finished.?
        foundClub.save(function(err, updatedClub){
          var len = updatedClub.updates.length;
          var userUpdate = {'news': news, 'eventDate': date, 'pusherName': pusherName, 'clubId': clubId,
          'clubName': clubName, updateId: updatedClub.updates[len-1]._id};
          User.updateMany({userClubs: {$elemMatch: {id: updatedClub._id}}},
          {$push: {clubUpdates: userUpdate}}, function(err, foundUser){
            if(err || !foundUser){
              console.log(req.user._id+' => (profiles-30)foundUser err:- '+JSON.stringify(err, null, 2));
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          });
          req.flash('success', 'Successfully updated');
          res.redirect('/clubs/' + req.params.club_id);
        });
      } else if(admin == true){
        // is avatar uploaded?
        if(req.file){
          try{
            await cloudinary.v2.uploader.destroy(foundClub.avatarId);
            var result = await cloudinary.v2.uploader.upload(req.file.path,
              {folder: 'clubAvatars/', use_filename: true, width: 1024, height: 768, crop: 'limit'});
            //replace original information with new information
            foundClub.avatarId = result.public_id;
            foundClub.avatar = result.secure_url;
          }catch(err){
            console.log(req.user._id+' => (profiles-31)avatarUpload err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }
        }
        if(req.body.delUpdate){
          var delUpdateId = mongoose.Types.ObjectId(req.body.delUpdate);
          for(i=foundClub.updates.length-1;i>=0;i--){
            if(foundClub.updates[i]._id.equals(delUpdateId)){
              var timeDiff = (Date.now() - foundClub.updates[i].pushedAt);
              // Notify update deletion which was created in last 24 hrs
              if(timeDiff < 3600000*24){
                var update = {'news': 'This update has been deleted', 'eventDate': '', 'clubName': foundClub.name,
                'clubId': foundClub._id, 'deleterName': req.user.fullName};
                User.updateMany({clubUpdates: {$elemMatch: {updateId: foundClub.updates[i]._id}}},
                {
                  $set: {'clubUpdates.$': update}
                }, function(err, foundUser){
                  if(err || !foundUser){
                    console.log(req.user._id+' => (profiles-32)foundUser err:- '+JSON.stringify(err, null, 2));
                    req.flash('error', 'Something went wrong :(');
                    return res.redirect('back');
                  }
                });
              }
              foundClub.updates.splice(i,1);
              break;
            }
          }
        }
        if(req.body.clubKeys && req.body.clubKeys.tags){
          editinfo(req.body.clubKeys.tags,foundClub.clubKeys.tags);
          function editinfo(newData,oldData){
            if(newData){
              oldData=[];
              var oldData = newData.filter(Boolean);
              var len = oldData.length; for(var i=len-1;i>=0;i--){
                var inputstring = oldData[i].replace(/[^a-zA-Z'()&0-9 .-]/g, '');
                oldData.splice(i,1,inputstring);
              }
              foundClub.clubKeys.tags = oldData;
            }
          }
        } else if(req.body.clubKeys && !req.body.clubKeys.tags){
          const oldOrgName = foundClub.clubKeys.organization;
          const oldCategory = foundClub.clubKeys.category;
          const newOrgName = req.body.clubKeys.organization.replace(/[^a-zA-Z'()0-9 -]/g, '');
          const newCategory = req.body.clubKeys.category.replace(/[^a-zA-Z'()0-9 ]/g, '');
          // COLLEGE PAGE(OrgPage)
          if(oldOrgName != newOrgName || oldCategory != newCategory){
            if(oldOrgName != newOrgName){
              // 1) IF an orgPage of OLD ORG name exists => SPLICE clubId from old category & dec. count
              OrgPage.findOne({name: oldOrgName}, function (err, foundOldOrgPage){
                if(foundOldOrgPage && foundOldOrgPage.allClubs.length){
                  for(var i=foundOldOrgPage.allClubs.length-1;i>=0;i--){
                    if(foundOldOrgPage.allClubs[i].category == oldCategory){
                      foundOldOrgPage.allClubs[i].categoryCount -= 1;
                      for(var j=foundOldOrgPage.allClubs[i].categoryClubIds.length-1;j>=0;j--){
                        if(foundOldOrgPage.allClubs[i].categoryClubIds[j].equals(foundClub._id)){
                          foundOldOrgPage.allClubs[i].categoryClubIds.splice(j,1);
                        }
                      }
                      break;
                    }
                  }
                  foundOldOrgPage.clubCount -= 1;
                  foundOldOrgPage.save();
                }
              });
            }
            // 2) IF an orgPage of NEW ORG name "exists" => PUSH clubId into category(upsert) & inc. count
            OrgPage.findOne({name: newOrgName}, function (err, foundNewOrgPage){
              if(foundNewOrgPage && foundNewOrgPage.allClubs.length){
                var foundNewCategory = false;
                for(var i=foundNewOrgPage.allClubs.length-1;i>=0;i--){
                  if(oldOrgName != newOrgName && foundNewOrgPage.allClubs[i].category == newCategory){
                    foundNewOrgPage.allClubs[i].categoryCount += 1;
                    foundNewOrgPage.allClubs[i].categoryClubIds.push(foundClub._id);
                    foundNewCategory = true;
                    foundNewOrgPage.clubCount += 1;
                  } 
                  if(oldOrgName == newOrgName && oldCategory != newCategory && foundNewOrgPage.allClubs[i].category == oldCategory){
                    foundNewOrgPage.allClubs[i].categoryCount -= 1;
                    for(var j=foundNewOrgPage.allClubs[i].categoryClubIds.length-1;j>=0;j--){
                      if(foundNewOrgPage.allClubs[i].categoryClubIds[j].equals(foundClub._id)){
                        foundNewOrgPage.allClubs[i].categoryClubIds.splice(j,1);
                        foundNewOrgPage.clubCount -= 1;
                      }
                    }
                  } 
                  if(oldOrgName == newOrgName && oldCategory != newCategory && foundNewOrgPage.allClubs[i].category == newCategory){
                    foundNewOrgPage.allClubs[i].categoryCount += 1;
                    foundNewOrgPage.allClubs[i].categoryClubIds.push(foundClub._id);
                    foundNewCategory = true;
                    foundNewOrgPage.clubCount += 1;
                  }
                }
                if(foundNewCategory == false){
                  var obj = {};
                  obj['category'] = newCategory;
                  obj['categoryCount'] = 1;
                  obj['categoryClubIds'] = [foundClub._id];
                  foundNewOrgPage.allClubs.push(obj);
                  foundNewOrgPage.clubCount += 1;
                }
                foundNewOrgPage.save();
              } else{
                // 3) If an orgPage of NEW ORG name "does not exist" => Create NEW ORG PAGE with new org name
                if(newOrgName && newOrgName != ''){
                  OrgPage.create({name: newOrgName}, function (err, createdNewOrgPage){
                    createdNewOrgPage.clubCount += 1;
                    var obj = {};
                    obj['category'] = newCategory;
                    obj['categoryCount'] = 1;
                    obj['categoryClubIds'] = [foundClub._id];
                    createdNewOrgPage.allClubs.push(obj);
                    createdNewOrgPage.save();
                  });
                }
              }
            });
            foundClub.clubKeys.organization = newOrgName;
            foundClub.clubKeys.category = newCategory;
          }

          foundClub.clubKeys.weblink = req.body.clubKeys.weblink.replace(/\&/g, ' ');
          if(foundClub.clubKeys.location && foundClub.clubKeys.location != ''){
            let response = await geocodingClient
            .forwardGeocode({
              query: req.body.clubKeys.location,
              limit: 1
            })
            .send();
            foundClub.clubKeys.location = req.body.clubKeys.location.replace(/[^a-zA-Z',0-9 .]/g, '');
            foundClub.geometry = response.body.features[0].geometry;
          } else{
            foundClub.geometry = undefined;
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
        if(req.body.name){
          foundClub.name = req.body.name;
          User.updateMany({userClubs: {$elemMatch: {id: foundClub._id}}},
          {$set: {'userClubs.$.clubName': req.body.name}}, function(err, foundUser){
            if(err || !foundUser){
              console.log(req.user._id+' => (profiles-33)foundUser err:- '+JSON.stringify(err, null, 2));
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          });
        }
        if(req.body.banner){
          foundClub.banner = req.body.banner;
        }
        foundClub.save();
        req.flash('success', 'Successfully updated');
        res.redirect('/clubs/' + req.params.club_id);
      } else{
        console.log(req.user._id+' => (profiles-34)rankCheck fail :Update Club');
        req.flash('error', "You don't have enough admin privileges :(");
        return res.redirect('back');
      }
    }
    });
  },

  profilesDeleteClubProfile(req, res, next){
    // Club.findById(req.params.club_id, async function(err, foundClub){
    // if(err || !foundClub){
    //   console.log(req.user._id+' => (profiles-35)foundClub err:- '+JSON.stringify(err, null, 2));
    //   req.flash('error', 'Something went wrong :(');
    //   return res.redirect('back');
    // } else{
    //   var founders = foundClub.clubUsers;
    //   var ok = checkRank(founders,req.user._id,0);
    //   if(ok == true){
    //     await cloudinary.v2.uploader.destroy(foundClub.avatarId);
    //     var clubDelete = req.params.club_id;
    //     User.updateMany({userClubs: {$elemMatch: {id: clubDelete}}}, {$pull: {userClubs: {id: clubDelete}}}, function(err, foundUser){});
    //     foundClub.remove();
    //     req.flash('success', 'Club deleted successfully!');
    //     res.redirect('/posts');
    //   } else{
    //     console.log('rankCheck fail :Destroy Club');
    //     req.flash('error', "Only founders can delete their clubs!");
    //     return res.redirect('back');
    //   }
    // }
    // });
  },

  profilesGetUsersFeaturedPhotos(req, res, next){
    User.findById(req.params.id, function(err, foundUser){
    if(err || !foundUser){
      console.log('(profiles-36)foundUser err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      featuredPhotos = foundUser.featuredPhotos;
      firstName = foundUser.firstName;
      userId = foundUser._id;
      res.render('users/featured_photos', {featuredPhotos, firstName, userId});
    }
    });
  },

  profilesUpdateUsersFeaturedPhotos(req, res, next){
    User.findById(req.params.id, async function(err, foundUser){
    if(err || !foundUser){
      console.log('(profiles-37)foundUser err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      if(req.body.button == 'submit' && req.file && foundUser.featuredPhotos.length < 3){
        var result = await cloudinary.v2.uploader.upload(req.file.path, {folder: 'featuredPhotos/',
        use_filename: true, width: 1024, height: 768, crop: 'limit'});
        var obj = {};
        obj['image'] = result.secure_url;
        obj['imageId'] = result.public_id;
        obj['heading'] = req.body.heading;
        obj['description'] = req.body.description;
        foundUser.featuredPhotos.push(obj);
        foundUser.save();
        req.flash('success', 'Successfully submitted');
        return res.redirect('/users/'+req.params.id+'/featured_photos');
      }
      if(req.body.delete && foundUser.featuredPhotos.length > 0){
        for(var i=foundUser.featuredPhotos.length-1;i>=0;i--){
          if(foundUser.featuredPhotos[i]._id.equals(req.body.delete)){
            await cloudinary.v2.uploader.destroy(foundUser.featuredPhotos[i].imageId);
            foundUser.featuredPhotos.splice(i,1);
            foundUser.save();
            break;
          }
        }
        req.flash('success', 'Successfully deleted');
        return res.redirect('/users/'+req.params.id+'/featured_photos');
      }
      if(req.body.update && foundUser.featuredPhotos.length > 0){
        for(var i=foundUser.featuredPhotos.length-1;i>=0;i--){
          if(foundUser.featuredPhotos[i]._id.equals(req.body.update)){
            if(req.file){
              await cloudinary.v2.uploader.destroy(foundUser.featuredPhotos[i].imageId);
              var result = await cloudinary.v2.uploader.upload(req.file.path, {folder: 'featuredPhotos/',
              use_filename: true, width: 1024, height: 768, crop: 'limit'});
              foundUser.featuredPhotos[i].image = result.secure_url;
              foundUser.featuredPhotos[i].imageId = result.public_id;
              foundUser.featuredPhotos[i].heading = req.body.heading;
              foundUser.featuredPhotos[i].description = req.body.description;
              foundUser.save();
            } else{
              foundUser.featuredPhotos[i].heading = req.body.heading;
              foundUser.featuredPhotos[i].description = req.body.description;
              foundUser.save();
            }
          }
        }
        req.flash('success', 'Successfully updated');
        return res.redirect('/users/'+req.params.id+'/featured_photos');
      }
    }
    });
  },

  profilesGetClubsFeaturedPhotos(req, res, next){
    Club.findById(req.params.id, function(err, foundClub){
    if(err || !foundClub){
      console.log('(profiles-38)foundClub err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      featuredPhotos = foundClub.featuredPhotos;
      clubName = foundClub.name;
      clubId = foundClub._id;
      res.render('clubs/featured_photos', {featuredPhotos, clubName, clubId});
    }
    });
  },

  profilesUpdateClubsFeaturedPhotos(req, res, next){
    Club.findById(req.params.id, async function(err, foundClub){
    if(err || !foundClub){
      console.log('(profiles-39)foundClub err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      if(req.body.button == 'submit' && req.file && foundClub.featuredPhotos.length < 5){
        var result = await cloudinary.v2.uploader.upload(req.file.path, {folder: 'featuredClubPhotos/',
        use_filename: true, width: 1024, height: 768, crop: 'limit'});
        var obj = {};
        obj['image'] = result.secure_url;
        obj['imageId'] = result.public_id;
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
            await cloudinary.v2.uploader.destroy(foundClub.featuredPhotos[i].imageId);
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
              await cloudinary.v2.uploader.destroy(foundClub.featuredPhotos[i].imageId);
              var result = await cloudinary.v2.uploader.upload(req.file.path, {folder: 'featuredClubPhotos/',
              use_filename: true, width: 1024, height: 768, crop: 'limit'});
              foundClub.featuredPhotos[i].image = result.secure_url;
              foundClub.featuredPhotos[i].imageId = result.public_id;
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
    }
    });
  },

  profilesRegisterUserPage(req, res, next){
    res.render('register', {page: 'register'});
  },

  profilesSignUp(req, res, next){
    var newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      fullName: req.body.firstName+' '+req.body.lastName,
      email: req.body.email,
      userKeys: req.body.userKeys,
      profilePic: null,
      profilePicId: null
    });
    var pass = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,10}$/;
    if(req.body.password.match(pass)){
      User.register(newUser, req.body.password, function(err, user){
      if(err || !user){
        console.log('(profiles-40)user err:- '+JSON.stringify(err, null, 2));
        if(err.code == 11000 || err.name == 'UserExistsError'){
          req.flash('error', 'A user with the given email is already registered');
        } else{
          req.flash('error', 'Something went wrong :(');
        }
        return res.redirect('back');
      } else{
        // Create a verification token for this user
        var token = new Token({userId: user._id, token: crypto.randomBytes(20).toString('hex')});

        // Save the verification token
        token.save(function(err){
          if(err){return console.log('(profiles-41)user err:- '+JSON.stringify(err, null, 2));}

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
            from: 'team@clubmate.co.in',
            subject: 'Account Verification Token',
            text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttps:\/\/' + req.headers.host + 
            '\/confirmation\/' + token.token + '.\n'
          };
          smtpTransport.sendMail(mailOptions, function(err){
            done(err, 'done');
          });
        });
        req.flash('success', 'Welcome to clubmate '+user.firstName+'. An email has been sent to your account for verification.');
        return res.redirect('/discover');
      }
      });
    } else{
      req.flash('error', 'Password must contain (6-10) characters, at least one letter and one number');
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
          req.flash('error', 'We were unable to find a user with that email');
          return res.redirect('back');
        }
        if(user.verified){
          req.flash('error', 'This account has already been verified. Please log in');
          return res.redirect('/login');
        }

        // Verify and save the user
        user.verified = true;
        user.save(function(err){
          if(err){return console.log('(profiles-42)user err:- '+JSON.stringify(err, null, 2));}
          // res.status(200).send("The account has been verified. Please log in.");
          console.log(user._id+' <= VERIFIED '+user.fullName);
          req.flash('success', 'Thank you for verification, you may now log in :)');
          return res.redirect('/discover');
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
        req.flash('error', 'We were unable to find a user with that email');
        return res.redirect('back');
      }
      if(user.verified){
        req.flash('error', 'This account has already been verified. Please log in');
        return res.redirect('/login');
      }
      // Create a verification token for this user
      var token = new Token({userId: user._id, token: crypto.randomBytes(20).toString('hex')});

      // Save the verification token
      token.save(function (err){
        if(err){return console.log('(profiles-43)user err:- '+JSON.stringify(err, null, 2));}

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
          from: 'team@clubmate.co.in',
          subject: 'Account Verification Token',
          text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttps:\/\/' + req.headers.host + 
          '\/confirmation\/' + token.token + '.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err){
          done(err, 'done');
        });
      });
      req.flash('success', 'An email has been sent to your account for verification.');
      return res.redirect('/discover');
    });
  },

  profilesLoginPage(req, res, next){
    res.render('login', {page: 'login'}); 
  },

  profilesLoginUser(req, res, next){
    passport.authenticate('local', {
      successRedirect: '/home',
      failureRedirect: '/login',
      failureFlash: true
    })(req, res, next);
  },

  profilesLogout(req, res, next){
    req.logout();
    req.flash('success', 'Logged out');
    res.redirect('/discover');
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
          console.log('(profiles-44)forgot err:- '+JSON.stringify(err, null, 2));
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
          from: 'team@clubmate.co.in',
          subject: 'Password reset request',
          text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'https://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err){
          console.log('mail sent('+ user.email +' requested a password change)');
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
      console.log('(profiles-45)token invalid err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    } else{
      res.render('reset', {token: req.params.token});
    }
    });
  },

  profilesResetPass(req, res, next){
    async.waterfall([
      function(done){
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
        if(err || !user){
          console.log('(profiles-46)token invalid err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        } else{
          if(req.body.password === req.body.confirm){
            user.setPassword(req.body.password, function(err) {
              user.resetPasswordToken = undefined;
              user.resetPasswordExpires = undefined;

              user.save(function(err) {
                req.logIn(user, function(err) {
                  done(err, user);
                });
              });
            })
          } else{
            console.log('(profiles-47)pass dont match err:- '+JSON.stringify(err, null, 2));
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
          from: 'team@clubmate.co.in',
          subject: 'Password reset request',
          text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err){
          console.log('mail sent(Password for '+ user.fullName +' - '+ user.email +' has changed)');
          req.flash('success', 'Success! Your password has been changed.');
          done(err, 'done');
        });
      }
    ], function(err) {
      res.redirect('/discover');
    });
  }
};

//*******************FUNCTIONS***********************

function checkRank(clubUsers,userId,rank){
  var ok;
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