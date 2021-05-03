const User         = require('../models/user'),
  Conversation     = require('../models/conversation'),
  ClubConversation = require('../models/club-conversation'),
  {environment}    = require('../config/env_switch'),
  clConfig         = require('../config/cloudinary'),
  s3Config         = require('../config/s3');

if(environment === 'dev'){
  var cdn_prefix = 'https://res.cloudinary.com/dubirhea4/';
} else if (environment === 'prod'){
  var cdn_prefix = 'https://d367cfssgkev4p.cloudfront.net/';
}


module.exports = {
  chatsList(req, res, next){
    if(req.user){
      var clubConversationId = req.user.userClubs.map(function(userClub){
        return userClub.conversationId;
      });
      var userConversationId = req.user.userChats.map(function(userChat){
        return userChat.conversationId;
      });
      clubConversationId = clubConversationId.filter(function (el){
        return el != null;
      });
      userConversationId = userConversationId.filter(function (el){
        return el != null;
      });
      var notificationCount = 0;
      ClubConversation.find({_id: {$in: clubConversationId}, isActive: true})
      .populate({path: 'clubId', select: 'name avatar avatarId'}).exec(function(err, foundClubConversations){
      if(err){
        console.log(req.user._id+' => (chats-1)foundClubConversations err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
      } else{
        var chatList = [];
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
          if(environment === 'dev'){
            obja['image'] = clConfig.cloudinary.url(foundClubConversations[i].clubId.avatarId, clConfig.thumb_100_obj);
          } else if (environment === 'prod'){
            obja['image'] = s3Config.thumb_100_prefix+foundClubConversations[i].clubId.avatarId;
          }
          obja['lastMessage'] = foundClubConversations[i].lastMessage;
          obja['lastMsgOn'] = foundClubConversations[i].lastMsgOn;
          obja['lastMsgBy'] = foundClubConversations[i].lastMsgBy;
          obja['messageCount'] = foundClubConversations[i].messageCount;
          obja['bucketNum'] = foundClubConversations[i].bucketNum;
          obja['messageBuckets'] = foundClubConversations[i].messageBuckets.pop();
          chatList.push(obja);
        }
        Conversation.find({_id: {$in: userConversationId}})
        .populate({path: 'participants', select: 'fullName profilePic profilePicId userKeys'})
        .exec(function(err, foundUserConversations){
        if(err){
          console.log(req.user._id+' => (chats-2)foundUserConversations err:- '+JSON.stringify(err, null, 2));
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
                if(environment === 'dev'){
                  objb['image'] = clConfig.cloudinary.url(foundUserConversations[i].participants[k].profilePicId, clConfig.thumb_100_obj);
                } else if (environment === 'prod'){
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
          var chatType = null;
          res.render('chats/index', {chatList, chatType, convClubId: null, recipientId: null, convClubId2: null, 
          recipientId2: null, notificationCount, cdn_prefix});
          return User.updateOne({_id: req.user._id}, 
          {$set: {unreadChatsCount: notificationCount}, $currentDate: {lastActive: true}}, function(err, updateUser){
          if(err || !updateUser){
            console.log(Date.now()+' : '+req.user._id+' => (chats-3)updateUser err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
          }
          });
        }
        });
      }
      });
    }
  },

  chatsListRooms(req, res, next){
    if(req.user){
      var clubConversationId = req.user.userClubs.map(function(userClub){
        return userClub.conversationId;
      });
      var userConversationId = req.user.userChats.map(function(userChat){
        return userChat.conversationId;
      });
      clubConversationId = clubConversationId.filter(function (el){
        return el != null;
      });
      userConversationId = userConversationId.filter(function (el){
        return el != null;
      });
      var notificationCount = 0;
      ClubConversation.find({_id: {$in: clubConversationId}, isActive: true})
      .populate({path: 'clubId', select: 'name avatar avatarId'}).exec(function(err, foundClubConversations){
      if(err){
        console.log(req.user._id+' => (chats-4)foundClubConversations err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
      } else{
        var chatList = [];
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
          if(environment === 'dev'){
            obja['image'] = clConfig.cloudinary.url(foundClubConversations[i].clubId.avatarId, clConfig.thumb_100_obj);
          } else if (environment === 'prod'){
            obja['image'] = s3Config.thumb_100_prefix+foundClubConversations[i].clubId.avatarId;
          }
          obja['lastMessage'] = foundClubConversations[i].lastMessage;
          obja['lastMsgOn'] = foundClubConversations[i].lastMsgOn;
          obja['lastMsgBy'] = foundClubConversations[i].lastMsgBy;
          obja['messageCount'] = foundClubConversations[i].messageCount;
          obja['bucketNum'] = foundClubConversations[i].bucketNum;
          obja['messageBuckets'] = foundClubConversations[i].messageBuckets.pop();
          chatList.push(obja);
        }
        Conversation.find({_id: {$in: userConversationId}})
        .populate({path: 'participants', select: 'fullName profilePic profilePicId userKeys'})
        .exec(function(err, foundUserConversations){
        if(err){
          console.log(req.user._id+' => (chats-5)foundUserConversations err:- '+JSON.stringify(err, null, 2));
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
                if(environment === 'dev'){
                  objb['image'] = clConfig.cloudinary.url(foundUserConversations[i].participants[k].profilePicId, clConfig.thumb_100_obj);
                } else if (environment === 'prod'){
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
          var chatType = null;
          res.render('chats/index_rooms', {chatList, chatType, convClubId: null, recipientId: null, convClubId2: null, 
          recipientId2: null, notificationCount, cdn_prefix});
          return User.updateOne({_id: req.user._id}, 
          {$set: {unreadChatsCount: notificationCount}, $currentDate: {lastActive: true}}, function(err, updateUser){
          if(err || !updateUser){
            console.log(Date.now()+' : '+req.user._id+' => (chats-6)updateUser err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
          }
          });
        }
        });
      }
      });
    }
  },

  chatsOpen(req, res, next){
    if(req.user){
      var clubConversationId = req.user.userClubs.map(function(userClub){
        return userClub.conversationId;
      });
      var userConversationId = req.user.userChats.map(function(userChat){
        return userChat.conversationId;
      });
      clubConversationId = clubConversationId.filter(function (el){
        return el != null;
      });
      userConversationId = userConversationId.filter(function (el){
        return el != null;
      });
      var notificationCount = 0;
      ClubConversation.find({_id: {$in: clubConversationId}, isActive: true})
      .populate({path: 'clubId', select: 'name avatar avatarId'}).exec(function(err, foundClubConversations){
      if(err){
        console.log(req.user._id+' => (chats-7)foundClubConversations err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
      } else{
        var chatList = [];
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
          if(environment === 'dev'){
            obja['image'] = clConfig.cloudinary.url(foundClubConversations[i].clubId.avatarId, clConfig.thumb_100_obj);
          } else if (environment === 'prod'){
            obja['image'] = s3Config.thumb_100_prefix+foundClubConversations[i].clubId.avatarId;
          }
          obja['lastMessage'] = foundClubConversations[i].lastMessage;
          obja['lastMsgOn'] = foundClubConversations[i].lastMsgOn;
          obja['lastMsgBy'] = foundClubConversations[i].lastMsgBy;
          obja['messageCount'] = foundClubConversations[i].messageCount;
          obja['bucketNum'] = foundClubConversations[i].bucketNum;
          obja['messageBuckets'] = foundClubConversations[i].messageBuckets.pop();
          chatList.push(obja);
        }
        Conversation.find({_id: {$in: userConversationId}})
        .populate({path: 'participants', select: 'fullName profilePic profilePicId userKeys'})
        .exec(function(err, foundUserConversations){
        if(err){
          console.log(req.user._id+' => (chats-8)foundUserConversations err:- '+JSON.stringify(err, null, 2));
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
                objb['id'] = foundUserConversations[i].participants[k]._id;
                objb['name'] = foundUserConversations[i].participants[k].fullName;
                objb['userKeys'] = foundUserConversations[i].participants[k].userKeys;
                if(environment === 'dev'){
                  objb['image'] = clConfig.cloudinary.url(foundUserConversations[i].participants[k].profilePicId, clConfig.thumb_100_obj);
                } else if (environment === 'prod'){
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
          var chatType, chatHeadName = null;
          if(req.query && req.query.user){
            chatType = 'user';
            chatHeadName = req.query.user;
            Conversation.findOne({_id: req.query.convId}, function(err, foundConversation){ 
            if(err || !foundConversation){
              console.log(req.user._id+' => (chats-9)foundConversation err:- '+JSON.stringify(err, null, 2));
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            } else{
              if(foundConversation.isBlocked){
                var isBlocked = true;
                if(foundConversation.blockedBy.equals(req.user._id)){
                  var isBlockedByFoundUser = false;
                } else{
                  var isBlockedByFoundUser = true;
                }
              } else{
                var isBlocked = false;
                var isBlockedByFoundUser = false;
              }
              var currentUserId = req.user._id;
              var conversationId = foundConversation._id;
              for(var l=0;l<foundConversation.participants.length;l++){
                if(!foundConversation.participants[l].equals(req.user._id)){
                  var recipientId2 = foundConversation.participants[l];
                  break;
                }
              }
              User.findById(recipientId2).select({lastActive: 1}).exec(function(err, foundRecepient){
              if(err || !foundRecepient){
                console.log(Date.now()+' : '+req.user._id+' => (chats-10)foundRecepient err:- '+JSON.stringify(err, null, 2));
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              } else{
                var wasActiveMinuteago = foundRecepient.lastActive >= (new Date() - 120*1000);
                var wasActiveToday = foundRecepient.lastActive >= (new Date() - 24*3600*1000);
                res.render('chats/index', {chatList, chatType, currentUserId, 
                recipientId: '', convClubId: null, conversationId, isBlocked, isBlockedByFoundUser, 
                recepient: foundRecepient, recipientId2, convClubId2: null, notificationCount, wasActiveMinuteago,
                wasActiveToday, chatHeadName, cdn_prefix});
                return User.updateOne({_id: req.user._id}, 
                {$set: {unreadChatsCount: notificationCount}, $currentDate: {lastActive: true}}, function(err, updateUser){
                if(err || !updateUser){
                  console.log(Date.now()+' : '+req.user._id+' => (chats-11)updateUser err:- '+JSON.stringify(err, null, 2));
                  req.flash('error', 'Something went wrong :(');
                }
                });
              }
              });
            }
            });
          } else if(req.query && req.query.club){
            chatType = 'club';
            chatHeadName = req.query.club;
            ClubConversation.findOne({_id: req.query.convId, isActive: true}, function(err, foundClubConversation){
            if(err || !foundClubConversation){
              console.log(req.user._id+' => (chats-12)foundClubConversation err:- '+JSON.stringify(err, null, 2));
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            } else{
              if(contains2(req.user.userClubs, foundClubConversation.clubId)){
                var currentUserId = req.user._id;
                var conversationId = foundClubConversation._id;
                var convClubId2 = req.query.profileId;
                res.render('chats/index', {chatList, chatType, currentUserId, conversationId, 
                convClubId: '', recipientId: null, convClubId2, recipientId2: null, notificationCount, chatHeadName, 
                cdn_prefix});
                User.updateOne({_id: req.user._id}, 
                {$set: {unreadChatsCount: notificationCount}, $currentDate: {lastActive: true}}, function(err, updateUser){
                if(err || !updateUser){
                  console.log(Date.now()+' : '+req.user._id+' => (chats-13)updateUser err:- '+JSON.stringify(err, null, 2));
                  req.flash('error', 'Something went wrong :(');
                }
                });
              }
            }
            });
          }
        }
        });
      }
      });
    }
  }
};

//*******************FUNCTIONS***********************
function contains2(array, obj){
  var len = array.length;
  if(len!=0){
    for(var i=0;i<len;i++){
      if(array[i].id.equals(obj)){
        return true;
        break;
      }
    }
    return false;
  } else if(len == 0){return false};
}