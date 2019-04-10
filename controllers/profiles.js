var express = require('express'); 
var router  = express.Router();
var passport = require('passport');
var User = require('../models/user');
var Club = require('../models/club');
var Post = require('../models/post');
var Token = require('../models/token');
var async = require('async');
var nodemailer = require('nodemailer');
var crypto = require('crypto');
var middleware = require('../middleware');
var multer = require('multer');
var mongoose = require('mongoose');
var moment = require('moment');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)){
    return cb(new Error('Only image files are allowed!'), false);
  }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_ID, 
  api_secret: process.env.API_SECRET,
});

//===============================
//PROFILES
//===============================

//root route
router.get('/', function(req, res){
  if(req.user){
    res.redirect('/users/'+req.user._id);
  } else{
    res.render('landing');
  }
});

//SHOW USER PROFILE
router.get('/users/:id', function(req, res){
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
        Post.find({'postAuthor.id': req.params.id})
        .populate({path: 'postClub', select: 'name avatar avatarId'})
        .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
        .sort({createdAt: -1}).limit(2)
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
          // requests
          var rankClubs = []; var clubInvites = [];
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
            var limitedClubs = clubs.slice(0,9);
            for(var k=0;k<limitedClubs.length;k++){
              Clubs_50_clubAvatar[k] = cloudinary.url(limitedClubs[k].id.avatarId,
              {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
            }
          } else{
            var clubs = [], Clubs_50_clubAvatar = [];
          }
          for(var i=0;i<cUuClength;i++){
            //rankClubs
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
              var obja = {};
              obja['_id'] = currentUser.userClubs[i].id;
              obja['name'] = currentUser.userClubs[i].clubName;
              rankClubs.push(obja);
            }
            //clubInvites
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
          return res.render('users/show', {haveRequest: haveRequest, sentRequest: sentRequest, isFriend: isFriend,
          hasVote: hasVote, hasModVote: hasModVote, user: foundUser, posts: modPosts, clubs: limitedClubs, match: match,
          rankClubs: rankClubs, clubInvites: clubInvites, conversationId: conversationId, recipientId: recipientId,
          foundPostIds: foundPostIds, PC_50_clubAvatar: PC_50_clubAvatar, Clubs_50_clubAvatar: Clubs_50_clubAvatar,
          foundFriends: foundFriends, clubCount: clubCount});
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
        .sort({createdAt: -1}).limit(2)
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
          var rankClubs = []; var clubInvites = [];
          var fUcIlength = foundUser.clubInvites.length;
          var fUuClength = foundUser.userClubs.length;
          var cUuClength = currentUser.userClubs.length;
          var sentRequest = contains(foundUser.friendRequests,currentUser._id);
          var haveRequest = contains(currentUser.friendRequests,foundUser._id);
          var isFriend = contains(currentUser.friends,foundUser._id);
          var clubCount = foundUser.userClubs.length;
          for(var i=0;i<cUuClength;i++){
            //rankClubs
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
              rankClubs.push(currentUser.userClubs[i].id);
            }
            //clubInvites
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
          return res.render("users/show", {haveRequest: haveRequest, sentRequest: sentRequest, isFriend: isFriend,
          hasVote: hasVote, hasModVote: hasModVote, user: foundUser, posts: modPosts, clubs: limitedClubs, match: match,
          rankClubs: rankClubs, clubInvites: clubInvites, conversationId: conversationId, recipientId: recipientId,
          foundPostIds: foundPostIds, PC_50_clubAvatar: PC_50_clubAvatar, Clubs_50_clubAvatar: Clubs_50_clubAvatar,
          foundFriends: foundFriends, clubCount: clubCount});
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
        .sort({createdAt: -1}).limit(2)
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
          var rankClubs = []; var clubInvites = []; var hasVote = [];
          return res.render("users/show", {haveRequest: haveRequest, sentRequest: sentRequest, 
          isFriend: isFriend, hasVote: hasVote, hasModVote: hasModVote, user: foundUser, posts: userPosts,
          match: match, rankClubs: rankClubs, clubInvites: clubInvites, foundPostIds: foundPostIds,
          PC_50_clubAvatar: PC_50_clubAvatar, foundFriends: foundFriends, clubCount: clubCount});
        }
        });
      }
      });
    }
    });
  }
});

router.get('/users-moreClubs/:user_id', function(req, res){
  User.findById(req.params.user_id)
  .populate({path: 'userClubs.id', select: 'name avatar avatarId'})
  .exec(function(err, foundUser){
  if(err || !foundUser){
    console.log('(profiles-10)foundUser err:- '+JSON.stringify(err, null, 2));
    req.flash('error', 'Something went wrong :(');
    return res.redirect('back');
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
        res.json({clubs: limitedClubs, clubCount: clubCount, Clubs_50_clubAvatar: Clubs_50_clubAvatar,
        newEndpoints: newEndpoints, userId: foundUser._id, rank: rank, currentUserId: currentUserId, match: match});
      }
    }
  }
  });
});

router.get('/users-morePosts/:id', function(req, res){
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
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
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
      return res.json({hasVote: hasVote, hasModVote: hasModVote, posts: modPosts, match: match,
      currentUser: currentUser, foundPostIds: foundPostIds, PC_50_clubAvatar: PC_50_clubAvatar,
      CU_50_profilePic: CU_50_profilePic});
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
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
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
      return res.json({hasVote: hasVote, hasModVote: hasModVote, posts: userPosts, match: match,
      currentUser: currentUser, foundPostIds: foundPostIds, PC_50_clubAvatar: PC_50_clubAvatar,
      CU_50_profilePic: CU_50_profilePic});
    }
    });
  }
});

router.get('/heart-morePosts/:id', function(req, res){
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
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
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
      return res.json({hasVote: hasVote, hasModVote: hasModVote, posts: modPosts, match: match,
      currentUser: currentUser, foundHPostIds: foundHPostIds, CU_50_profilePicH: CU_50_profilePicH,
      PC_50_clubAvatarH: PC_50_clubAvatarH});
    }
    });
  } else{
    res.redirect('back');
  }
});

//UPDATE USER PROFILE
router.put('/users/:id', middleware.checkAccountOwnership, upload.single('profilePic'), function(req, res){
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
          {folder: 'profilePics/', use_filename: true, width: 512, height: 512, crop: 'limit'});
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
      for(i=foundUser.userClubs.length-1;i>=0;i--){
        if(foundUser.userClubs[i].clubUpdates.length != 0){
          for(j=foundUser.userClubs[i].clubUpdates.length-1;j>=0;j--){
            if(foundUser.userClubs[i].clubUpdates[j]._id.equals(req.body.delUpdate)){
              foundUser.userClubs[i].clubUpdates.splice(j,1);
            }
          }
        }
      };
    }
    if(req.body.note){
      foundUser.note = req.body.note;
    }

    if(req.body.userKeys){
      if(req.body.userKeys.birthdate){
        foundUser.userKeys.birthdate = req.body.userKeys.birthdate;
        foundUser.userKeys.sex = req.body.userKeys.sex;
      } else{
        foundUser.userKeys.school = req.body.userKeys.school;
        foundUser.userKeys.college = req.body.userKeys.college;
        foundUser.userKeys.worksAt = req.body.userKeys.worksAt;
        foundUser.userKeys.residence = req.body.userKeys.residence;
      }
    }
    editinfo(0,req.body.interests,foundUser.interests);
    editinfo(1,req.body.music,foundUser.favourites.music);
    editinfo(2,req.body.movies,foundUser.favourites.movies);
    editinfo(3,req.body.tvshows,foundUser.favourites.tvshows);
    editinfo(4,req.body.places,foundUser.favourites.places);
    editinfo(5,req.body.books,foundUser.favourites.books);

    function editinfo(count,newData,oldData){
      if(newData){
        oldData=[];
        if(Array.isArray(newData)){
          var oldData = newData.filter(Boolean);
        } else{
          var oldData = [newData].filter(Boolean);;
        }
        var len = oldData.length; var i=0; for(i;i<len;i++){
          var inputstring = oldData[i].replace(/[^a-zA-Z'()&0-9 .-]/g, "");
          oldData.splice(i,1,inputstring);
        }
        if(count==0){foundUser.interests=oldData;}
        else if(count==1){foundUser.favourites.music=oldData;}
        else if(count==2){foundUser.favourites.movies=oldData;}
        else if(count==3){foundUser.favourites.tvshows=oldData;}
        else if(count==4){foundUser.favourites.places=oldData;}
        else if(count==5){foundUser.favourites.books=oldData;}
      }
    };
    foundUser.save();
    req.flash('success', 'Successfully updated');
    res.redirect('/users/' + req.params.id);
  }
  });
});

//CREATE CLUB PROFILE
router.post('/users/:id/clubs', middleware.checkAccountOwnership, upload.single('avatar'), function(req, res){
  cloudinary.v2.uploader.upload(req.file.path, {folder: 'clubAvatars/', use_filename: true, width: 512, height: 512, crop: 'limit'},
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
});

//SHOW CLUB PROFILE
router.get('/clubs/:club_id', function(req, res){
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
      .sort({createdAt: -1}).limit(2)
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
        var userCount = users.length;
        var limitedUsers = users.slice(0,1);
        for(var k=0;k<limitedUsers.length;k++){
          Users_50_profilePic[k] = cloudinary.url(limitedUsers[k].id.profilePicId,
          {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
        }
        var currentUser = req.user;
        var rank = currentRank(users,req.user._id);
        if(0 <= rank && rank <= 4){
          var conversationId = '', convClubId = '';
          if(foundClub.conversationId){
            var conversationId = foundClub.conversationId;
          } else{var convClubId = foundClub._id;}
        } else{foundClub.updates = '';}
        res.render('clubs/show', {hasVote: hasVote, hasModVote: hasModVote, posts: modPosts, rank: rank, 
        currentUser: currentUser, users: limitedUsers, userCount: userCount, conversationId: conversationId, 
        convClubId: convClubId, foundPostIds: foundPostIds, PA_50_profilePic: PA_50_profilePic, club: foundClub,
        Users_50_profilePic: Users_50_profilePic});
      }
      });
    } else{
      Post.find({postClub: req.params.club_id, privacy: 0, moderation: 0})
      .populate({path: 'postAuthor.id', select: 'firstName fullName profilePic profilePicId'})
      .populate({path: 'commentBuckets', options: {sort: {bucket: -1}, limit: 1}})
      .sort({createdAt: -1}).limit(2)
      .exec(function(err, clubPosts){
      if(err || !clubPosts){
        console.log('(profiles-23)clubPosts err:- '+JSON.stringify(err, null, 2));
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
        var userCount = users.length;
        var limitedUsers = users.slice(0,1);
        for(var k=0;k<limitedUsers.length;k++){
          Users_50_profilePic[k] = cloudinary.url(limitedUsers[k].id.profilePicId,
          {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
        }
        var rank, currentUser = null;
        foundClub.updates = '';
        res.render('clubs/show', {hasVote: hasVote, hasModVote: hasModVote, posts: posts, currentUser: currentUser,
        rank: rank, users: limitedUsers, userCount: userCount, club: foundClub, foundPostIds: foundPostIds,
        PA_50_profilePic: PA_50_profilePic, Users_50_profilePic: Users_50_profilePic});
      }
      });
    }
  }
  });
});

router.get('/clubs-moreMembers/:club_id', function(req, res){
  Club.findById(req.params.club_id)
  .populate({path: 'clubUsers.id', select: 'firstName fullName profilePic profilePicId'})
  .exec(function(err, foundClub){
  if(err || !foundClub){
    console.log('(profiles-24)foundClub err:- '+JSON.stringify(err, null, 2));
    req.flash('error', 'Something went wrong :(');
    return res.redirect('back');
  } else{
    if(req.user){
      var rankUsers = foundClub.clubUsers;
      var junior = checkRank(rankUsers,req.user._id,4);
      var endpoints = req.query.endpoints.split(',');
      var start = Number(endpoints[0]), end = Number(endpoints[1]);
      var userCount = foundClub.clubUsers.length, Users_50_profilePic = []; 
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
        res.json({users: limitedUsers, userCount: userCount, Users_50_profilePic: Users_50_profilePic,
        newEndpoints: newEndpoints, clubId: foundClub._id, rank: rank});
      }
    }
  }
  });
});

router.get('/clubs-morePosts/:club_id', function(req, res){
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
      console.log(req.user._id+' => (profiles-25)clubPosts err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
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
      res.json({hasVote: hasVote, hasModVote: hasModVote, posts: modPosts, rank: rank, currentUser: currentUser,
      foundPostIds: foundPostIds, PA_50_profilePic: PA_50_profilePic, CU_50_profilePic: CU_50_profilePic});
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
      console.log('(profiles-26)clubPosts err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
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
      res.json({hasVote: hasVote, hasModVote: hasModVote, posts: posts, rank: rank, currentUser: currentUser,
      foundPostIds: foundPostIds, PA_50_profilePic: PA_50_profilePic, CU_50_profilePic: CU_50_profilePic});
    }
    });
  }
});

// UPDATE CLUB ROUTE
router.put('/clubs/:club_id', middleware.isLoggedIn, upload.single('avatar'), function(req, res){
  Club.findById(req.params.club_id, async function(err, foundClub){
  if(err || !foundClub){
    console.log(req.user._id+' => (profiles-27)foundClub err:- '+JSON.stringify(err, null, 2));
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
      var update = {'news': news, 'eventDate': date};
      foundClub.updates.push(update);
      User.updateMany({userClubs: {$elemMatch: {id: foundClub._id}}},
      {$push: {'userClubs.$.clubUpdates': update}}, function(err, foundUser){
        if(err || !foundUser){
          console.log(req.user._id+' => (profiles-28)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }
      });
      foundClub.save();
      req.flash('success', 'Successfully updated');
      res.redirect('/clubs/' + req.params.club_id);
    } else if(admin == true){
      // is avatar uploaded?
      if(req.file){
        try{
          await cloudinary.v2.uploader.destroy(foundClub.avatarId);
          var result = await cloudinary.v2.uploader.upload(req.file.path,
            {folder: 'clubAvatars/', use_filename: true, width: 512, height: 512, crop: 'limit'});
          //replace original information with new information
          foundClub.avatarId = result.public_id;
          foundClub.avatar = result.secure_url;
        }catch(err){
          console.log(req.user._id+' => (profiles-29)avatarUpload err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }
      }
      if(req.body.delUpdate){
        var delUpdateId = mongoose.Types.ObjectId(req.body.delUpdate);
        for(i=0;i<foundClub.updates.length;i++){
          if(foundClub.updates[i]._id.equals(req.body.delUpdate)){
            // var timeDiff = (Date.now() - foundClub.updates[i].pushedAt);
            // // Notify update deletion which was created in last 24 hrs
            // if(timeDiff < 3600000*24){
            //   console.log('UPDATE POSTED TODAY');
            //   var update = {'news': 'This update has been deleted.', 'eventDate': ''};
            //   User.updateMany({userClubs: {$elemMatch: {id: foundClub._id}}},
            //   {
            //     $set: {'userClubs.$.clubUpdates.$[inner]': update}
            //   },
            //   {
            //     'arrayFilters': [{'inner._id': delUpdateId}] 
            //   }, function(err, foundUser){
            //     if(err || !foundUser){
            //       console.log(req.user._id+' => (profiles-30)foundUser err:- '+JSON.stringify(err, null, 2));
            //       req.flash('error', 'Something went wrong :(');
            //       return res.redirect('back');
            //     } else{
            //       console.log('FOUND USER'+JSON.stringify(foundUser, null, 2));
            //     }
            //   });
            // }
            foundClub.updates.splice(i,1);
          }
        }
      }
      if(req.body.clubKeys){
        foundClub.clubKeys = req.body.clubKeys;
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
            console.log(req.user._id+' => (profiles-31)foundUser err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }
        });
      }
      if(req.body.banner){
        foundClub.banner = req.body.banner;
      }
      editinfo(req.body.categories,foundClub.categories);
      function editinfo(newData,oldData){
        if(newData){
          oldData=[];
          var oldData = newData.filter(Boolean);
          var len = oldData.length; var i=0; for(i;i<len;i++){
            var inputstring = oldData[i].replace(/[^a-zA-Z'()&0-9 .-]/g, "");
            oldData.splice(i,1,inputstring);
          }
          foundClub.categories = oldData;
        }
      };
      foundClub.save();
      req.flash('success', 'Successfully updated');
      res.redirect('/clubs/' + req.params.club_id);
    } else{
      console.log(req.user._id+' => (profiles-32)rankCheck fail :Update Club');
      req.flash('error', "You don't have enough admin privileges :(");
      return res.redirect('back');
    }
  }
  });
});

// DESTROY CLUB ROUTE
router.delete('/clubs/:club_id', function(req, res){
  // Club.findById(req.params.club_id, async function(err, foundClub){
  // if(err || !foundClub){
  //   console.log(req.user._id+' => (profiles-33)foundClub err:- '+JSON.stringify(err, null, 2));
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
});

// USER featured photos
router.get('/users/:id/featured_photos', function(req, res){
  User.findById(req.params.id, function(err, foundUser){
  if(err || !foundUser){
    console.log('(profiles-33)foundUser err:- '+JSON.stringify(err, null, 2));
    req.flash('error', 'Something went wrong :(');
    return res.redirect('back');
  } else{
    featuredPhotos = foundUser.featuredPhotos;
    firstName = foundUser.firstName;
    userId = foundUser._id;
    res.render('users/featured_photos', {featuredPhotos: featuredPhotos, firstName: firstName, userId: userId});
  }
  });
});

router.put('/users/:id/featured_photos', middleware.checkAccountOwnership, upload.single('image'), function(req, res){
  User.findById(req.params.id, async function(err, foundUser){
  if(err || !foundUser){
    console.log('(profiles-34)foundUser err:- '+JSON.stringify(err, null, 2));
    req.flash('error', 'Something went wrong :(');
    return res.redirect('back');
  } else{
    if(req.body.button == 'submit' && req.file && foundUser.featuredPhotos.length < 3){
      var result = await cloudinary.v2.uploader.upload(req.file.path, {folder: 'featuredPhotos/',
      use_filename: true, width: 768, height: 768, crop: 'limit'});
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
            use_filename: true, width: 768, height: 768, crop: 'limit'});
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
});

// CLUB featured photos
router.get('/clubs/:id/featured_photos', function(req, res){
  Club.findById(req.params.id, function(err, foundClub){
  if(err || !foundClub){
    console.log('(profiles-35)foundClub err:- '+JSON.stringify(err, null, 2));
    req.flash('error', 'Something went wrong :(');
    return res.redirect('back');
  } else{
    featuredPhotos = foundClub.featuredPhotos;
    clubName = foundClub.name;
    clubId = foundClub._id;
    res.render('clubs/featured_photos', {featuredPhotos: featuredPhotos, clubName: clubName, clubId: clubId});
  }
  });
});

router.put('/clubs/:id/featured_photos', middleware.checkClubAdminship, upload.single('image'), function(req, res){
  Club.findById(req.params.id, async function(err, foundClub){
  if(err || !foundClub){
    console.log('(profiles-36)foundClub err:- '+JSON.stringify(err, null, 2));
    req.flash('error', 'Something went wrong :(');
    return res.redirect('back');
  } else{
    if(req.body.button == 'submit' && req.file && foundClub.featuredPhotos.length < 5){
      var result = await cloudinary.v2.uploader.upload(req.file.path, {folder: 'featuredClubPhotos/',
      use_filename: true, width: 768, height: 768, crop: 'limit'});
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
            use_filename: true, width: 768, height: 768, crop: 'limit'});
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
});

//============================================
//AUTH ROUTES
//============================================

// show register form
router.get('/register', function(req, res){
   res.render('register', {page: 'register'}); 
});

//handle sign up logic
router.post('/register', function(req, res){
  var newUser = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    fullName: req.body.firstName+' '+req.body.lastName,
    email: req.body.email,
    userKeys: req.body.userKeys,
    profilePic: null,
    profilePicId: null
  });
  User.register(newUser, req.body.password, function(err, user){
  if(err || !user){
    console.log('(profiles-37)user err:- '+JSON.stringify(err, null, 2));
    if(err.code == 11000 || err.name == 'UserExistsError'){
      req.flash('error', 'A user with the given email is already registered');
    } else{
      req.flash('error', 'Something went wrong :(');
    }
    return res.redirect('back');
  } else{
    // req.login(user, function(err){
    //   req.flash('success', 'Welcome to ghostwn ' + user.firstName);
    //   return res.redirect('/discover');
    // });

    // Create a verification token for this user
    var token = new Token({userId: user._id, token: crypto.randomBytes(20).toString('hex')});

    // Save the verification token
    token.save(function(err){
      if(err){return console.log('(profiles-38)user err:- '+JSON.stringify(err, null, 2));}

      // Send the email
      var smtpTransport = nodemailer.createTransport({
        service: 'Godaddy', 
        auth: {
          user: 'admins@ghostwn.com',
          pass: process.env.ADMINS_EMAIL_PW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'admins@ghostwn.com',
        subject: 'Account Verification Token',
        text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttps:\/\/' + req.headers.host + 
        '\/confirmation\/' + token.token + '.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err){
        done(err, 'done');
      });
    });
    req.flash('success', 'Welcome to ghostwn '+user.firstName+'. An email has been sent to your account for verification.');
    return res.redirect('/discover');
  }
  });
});

router.get('/confirmation/:token', function(req, res){
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
        if(err){return console.log('(profiles-39)user err:- '+JSON.stringify(err, null, 2));}
        // res.status(200).send("The account has been verified. Please log in.");
        console.log(user._id+' <= VERIFIED '+user.fullName);
        req.flash('success', 'Thank you for verification, you may now log in :)');
        return res.redirect('/discover');
      });
    });
  });
});

router.get('/resend_verification', function(req, res){
  res.render('re_verify');
});

router.post('/resend_verification', function(req, res, next){
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
      if(err){return console.log('(profiles-40)user err:- '+JSON.stringify(err, null, 2));}

      // Send the email
      var smtpTransport = nodemailer.createTransport({
        service: 'Godaddy', 
        auth: {
          user: 'admins@ghostwn.com',
          pass: process.env.ADMINS_EMAIL_PW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'admins@ghostwn.com',
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
});

//show login form
router.get('/login', function(req, res){
  res.render('login', {page: 'login'}); 
});

//handling login logic
router.post('/login', passport.authenticate('local',
  { successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: true
  }
), function(req, res){});

//logout route
router.get('/logout', function(req, res){
  req.logout();
  req.flash('success', 'Logged out');
  res.redirect('/discover');
});

// forgot password
router.get('/forgot', function(req, res){
  res.render('forgot');
});

router.post('/forgot', function(req, res, next){
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
        console.log('(profiles-41)forgot err:- '+JSON.stringify(err, null, 2));
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
          user: 'admins@ghostwn.com',
          pass: process.env.ADMINS_EMAIL_PW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'admins@ghostwn.com',
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
});

router.get('/reset/:token', function(req, res){
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
  if (err || !user){
    console.log('(profiles-42)token invalid err:- '+JSON.stringify(err, null, 2));
    req.flash('error', 'Password reset token is invalid or has expired.');
    return res.redirect('/forgot');
  } else{
    res.render('reset', {token: req.params.token});
  }
  });
});

router.post('/reset/:token', function(req, res){
  async.waterfall([
    function(done){
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
      if(err || !user){
        console.log('(profiles-43)token invalid err:- '+JSON.stringify(err, null, 2));
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
          console.log('(profiles-44)pass dont match err:- '+JSON.stringify(err, null, 2));
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
          user: 'admins@ghostwn.com',
          pass: process.env.ADMINS_EMAIL_PW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'admins@ghostwn.com',
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
});

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

module.exports = router;
