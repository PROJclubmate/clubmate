const User         = require('../models/user'),
  Club             = require('../models/club'),
  Conversation     = require('../models/conversation'),
  ClubConversation = require('../models/club-conversation'),
  Message          = require('../models/message'),
  mongoose         = require('mongoose'),
  clConfig         = require('../config/cloudinary'),
  s3Config         = require('../config/s3'),
  logger           = require('../logger');

if(process.env.ENVIRONMENT === 'dev'){
  var cdn_prefix = 'https://res.cloudinary.com/dubirhea4/';
} else if (process.env.ENVIRONMENT === 'prod'){
  var cdn_prefix = 'https://d367cfssgkev4p.cloudfront.net/';
}


module.exports = {
  chatsList(req, res, next){
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
        res.render('chats/index', {chatList, chatType, convClubId: null, recipientId: null, convClubId2: null, 
        recipientId2: null, notificationCount, lastOpenedChatListClub, cdn_prefix});
        return User.updateOne({_id: req.user._id}, 
        {$set: {unreadChatsCount: notificationCount}, $currentDate: {lastActive: true}}, function(err, updateUser){
        if(err || !updateUser){
          logger.error(req.user._id+' : (chats-3)updateUser err => '+err);
          req.flash('error', 'Something went wrong :(');
        }
        });
      }
      });
    }
    });
  },

  chatsOpen(req, res, next){
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
      logger.error(req.user._id+' : (chats-4)foundClubConversations err => '+err);
      req.flash('error', 'Something went wrong :(');
    } else{
      var lastOpenedChatListClub ; var chatList = [];
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
        logger.error(req.user._id+' : (chats-5)foundUserConversations err => '+err);
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
        var chatType, chatHeadName = null;
        if(req.query && req.query.user){
          chatType = 'user';
          chatHeadName = req.query.user;
          Conversation.findOne({_id: req.query.convId}, function(err, foundConversation){ 
          if(err || !foundConversation){
            logger.error(req.user._id+' : (chats-6)foundConversation err => '+err);
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
              logger.error(req.user._id+' : (chats-7)foundRecepient err => '+err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            } else{
              var wasActiveMinuteago = foundRecepient.lastActive >= (new Date() - 120*1000);
              var wasActiveToday = foundRecepient.lastActive >= (new Date() - 24*3600*1000);
              res.render('chats/index', {chatList, chatType, currentUserId, 
              recipientId: '', convClubId: null, conversationId, isBlocked, isBlockedByFoundUser, 
              recepient: foundRecepient, recipientId2, convClubId2: null, notificationCount, wasActiveMinuteago,
              wasActiveToday, chatHeadName, lastOpenedChatListClub, cdn_prefix});
              return User.updateOne({_id: req.user._id}, 
              {$set: {unreadChatsCount: notificationCount}, $currentDate: {lastActive: true}}, function(err, updateUser){
              if(err || !updateUser){
                logger.error(req.user._id+' : (chats-8)updateUser err => '+err);
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
            logger.error(req.user._id+' : (chats-9)foundClubConversation err => '+err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          } else{
            if(contains2(req.user.userClubs, foundClubConversation.clubId)){
              var currentUserId = req.user._id;
              var conversationId = foundClubConversation._id;
              var convClubId2 = req.query.profileId;
              res.render('chats/index', {chatList, chatType, currentUserId, conversationId, 
              convClubId: '', recipientId: null, convClubId2, recipientId2: null, notificationCount, chatHeadName, 
              lastOpenedChatListClub, cdn_prefix});
              return User.updateOne({_id: req.user._id}, 
              {$set: {unreadChatsCount: notificationCount}, $currentDate: {lastActive: true}}, function(err, updateUser){
              if(err || !updateUser){
                logger.error(req.user._id+' : (chats-10)updateUser err => '+err);
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
  },

  chatsListClubRooms(req, res, next){
    var userClubIds = req.user.userClubs.map(function(userClub){
      return userClub.id;
    });
    if(userClubIds.includes(req.params.club_id)){
      Club.find({_id: {$in: userClubIds}, conversationId: {$exists: true}, isActive: true})
      .populate({path: 'chatRooms.conversationId', select: 'allParticipantIds participantCount'})
      .select({_id: 1, name: 1, avatar: 1, avatarId: 1, conversationId: 1, chatRooms: 1, chatRoomsCount: 1})
      .exec(function(err, foundClubs){
      if(err || !foundClubs){
        logger.error(req.user._id+' : (chats-11)foundClubs err => '+err);
        req.flash('error', 'Something went wrong :(');
      } else{
        var openedClub = {};
        openedClub['id'] = null;
        var Clubs_50_clubAvatar = [];
        for(var i=0;i<foundClubs.length;i++){
          if(foundClubs[i]._id == req.params.club_id){
            openedClub['id'] = foundClubs[i]._id;
            openedClub['name'] = foundClubs[i].name;
            openedClub['chatRoomsCount'] = foundClubs[i].chatRoomsCount;
            openedClub['chatRooms'] = foundClubs[i].chatRooms;
            openedClub['conversationId'] = foundClubs[i].conversationId;
            for(var j=0;j<openedClub.chatRooms.length;j++){
              if(openedClub.chatRooms[j].conversationId.allParticipantIds.includes(req.user._id)){
                openedClub.chatRooms[j].isParticipant = true;
              } else{
                openedClub.chatRooms[j].isParticipant = false;
              }
            }
          }
          if(process.env.ENVIRONMENT === 'dev'){
            Clubs_50_clubAvatar[i] = clConfig.cloudinary.url(foundClubs[i].avatarId, clConfig.thumb_100_obj);
          } else if (process.env.ENVIRONMENT === 'prod'){
            Clubs_50_clubAvatar[i] = s3Config.thumb_100_prefix+foundClubs[i].avatarId;
          }
        }
        if(openedClub.id == null){
          openedClub['id'] = foundClubs[0]._id;
          openedClub['name'] = foundClubs[0].name;
          openedClub['chatRoomsCount'] = foundClubs[0].chatRoomsCount;
          openedClub['chatRooms'] = foundClubs[0].chatRooms;
          openedClub['conversationId'] = foundClubs[0].conversationId;
        }
        openedClub.chatRooms.sort(function(a, b){
          return b.conversationId.participantCount - a.conversationId.participantCount;
        });
        openedClub.chatRooms.sort(function(a, b){
          return b.isParticipant - a.isParticipant;
        });
        res.render('chats/index_rooms', {clubs: foundClubs, Clubs_50_clubAvatar, openedClub, conversationId: null,
        convClubId: null, currentUserId: req.user._id, currentUser: req.user, openedRoomConvId: null, chatHeadName: null,
        cdn_prefix});
        return User.updateOne({_id: req.user._id}, 
        {$set: {lastOpenedChatListClub: req.params.club_id}, $currentDate: {lastActive: true}}).exec();
      }
      });
    } else{
      logger.warn(req.user._id+' : memberCheck fail :Cannot see club chat rooms');
      req.flash('error', 'You are not a member of this club');
      res.redirect('back');
      return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
    }
  },

  chatsListClubRoomOpen(req, res, next){
    var userClubIds = req.user.userClubs.map(function(userClub){
      return userClub.id;
    });
    if(userClubIds.includes(req.params.club_id)){
      Club.find({_id: {$in: userClubIds}, conversationId: {$exists: true}, isActive: true})
      .populate({path: 'chatRooms.conversationId', select: 'allParticipantIds participantCount'})
      .select({_id: 1, name: 1, avatar: 1, avatarId: 1, conversationId: 1, chatRooms: 1, chatRoomsCount: 1})
      .exec(function(err, foundClubs){
      if(err || !foundClubs){
        logger.error(req.user._id+' : (chats-12)foundClubs err => '+err);
        req.flash('error', 'Something went wrong :(');
      } else{
        var openedClub = {};
        openedClub['id'] = req.params.club_id;
        openedClub['name'] = req.query.club;
        var Clubs_50_clubAvatar = [];
        for(var i=0;i<foundClubs.length;i++){
          if(foundClubs[i]._id == req.params.club_id && foundClubs[i].name == req.query.club){
            openedClub['conversationId'] = foundClubs[i].conversationId;
            openedClub['chatRoomsCount'] = foundClubs[i].chatRoomsCount;
            openedClub['chatRooms'] = foundClubs[i].chatRooms;
          }
          if(process.env.ENVIRONMENT === 'dev'){
            Clubs_50_clubAvatar[i] = clConfig.cloudinary.url(foundClubs[i].avatarId, clConfig.thumb_100_obj);
          } else if (process.env.ENVIRONMENT === 'prod'){
            Clubs_50_clubAvatar[i] = s3Config.thumb_100_prefix+foundClubs[i].avatarId;
          }
        }
        if(req.query.conversationId == ''){
          var convClubId = req.params.club_id;
          var conversationId = null;
        } else{
          var conversationId = openedClub.conversationId;
          var convClubId = req.params.club_id;
        }
        var chatHeadName = req.query.roomName;
        var openedRoomConvId = req.query.convId;
        res.render('chats/index_rooms', {clubs: foundClubs, Clubs_50_clubAvatar, openedClub, conversationId, 
        convClubId, currentUserId: req.user._id, currentUser: req.user, chatHeadName, openedRoomConvId,
        cdn_prefix});
        return User.updateOne({_id: req.user._id}, 
        {$set: {lastOpenedChatListClub: req.params.club_id}, $currentDate: {lastActive: true}}).exec();
      }
      });
    } else{
      logger.warn(req.user._id+' : memberCheck fail :Cannot open club chats');
      req.flash('error', 'You are not a member of this club');
      res.redirect('back');
      return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
    }
  },

  chatsCreateNewRoom(req, res, next){
    Club.findOne({_id: req.params.club_id, isActive: true})
    .select({_id: 1, name: 1, avatar: 1, avatarId: 1, clubUsers: 1, chatRooms: 1, chatRoomsCount: 1})
    .exec(function(err, foundClub){
    if(err || !foundClub){
      logger.error(req.user._id+' : (chats-13)foundClub err => '+err);
      req.flash('error', 'Something went wrong :(');
    } else{
      admin = checkRank(foundClub.clubUsers,req.user._id,1);
      if(admin){
        const clubConversation = new ClubConversation({
          clubId: mongoose.Types.ObjectId(req.params.club_id),
          isRoom: true,
          roomName: req.body.roomname,
          participantCount: 1,
          allParticipantIds: [req.user._id]
        });
        var obja={}; var newMessage=[];
        obja['authorId'] = req.user._id;
        obja['authorName'] = req.user.fullName;
        obja['text'] = 'Welcome to new Room: '+req.body.roomname;
        newMessage.push(obja);
        const message = new Message({
          conversationId: clubConversation._id,
          messages: newMessage
        });
        message.save();
        var objb = {};
        objb['name'] = req.body.roomname;
        objb['conversationId'] = clubConversation._id;
        foundClub.chatRooms.push(objb);
        foundClub.chatRoomsCount += 1;
        clubConversation.messageBuckets.push(message._id);
		    clubConversation.lastMessage = 'Welcome to new Room: '+req.body.roomname;
		    clubConversation.save();
        foundClub.save();
        res.redirect('/clubs/'+req.params.club_id+'/rooms/'+clubConversation._id);
      }
    }
    });
  },

  chatsRoom(req, res, next){
    Club.findOne({_id: req.params.club_id, isActive: true})
    .select({_id: 1, name: 1, avatar: 1, avatarId: 1, clubUsers: 1, chatRooms: 1, chatRoomsCount: 1})
    .populate({path: 'clubUsers.id', select: 'firstName fullName profilePic profilePicId userKeys'})
    .exec(function(err, foundClub){
    if(err || !foundClub){
      logger.error(req.user._id+' : (chats-14)foundClub err => '+err);
      req.flash('error', 'Something went wrong :(');
    } else{
      var room = {}; var clubName = foundClub.name;
      for(var i=0;i<foundClub.chatRooms.length;i++){
        if(foundClub.chatRooms[i].conversationId.equals(req.params.room_id)){
          room['_id'] = foundClub.chatRooms[i].conversationId;
          room['name'] = foundClub.chatRooms[i].name;
          room['avatar'] = foundClub.chatRooms[i].avatar;
          room['avatarId'] = foundClub.chatRooms[i].avatarId;
          room['conversationId'] = foundClub.chatRooms[i].conversationId;
        }
      }
      ClubConversation.findOne({_id: room.conversationId, isActive: true})
      .populate({path: 'clubId', select: 'name avatar avatarId'}).exec(function(err, foundClubConversation){
      if(err){
        logger.error(req.user._id+' : (chats-15)foundClubConversation err => '+err);
        req.flash('error', 'Something went wrong :(');
      } else{
        var roomParticipantsList = JSON.stringify(foundClubConversation.allParticipantIds);
        isAdmin = checkRank(foundClub.clubUsers,req.user._id,1);
        if(isAdmin){
          var clubMembersList = foundClub.clubUsers.map(function(clubUser){
            if(process.env.ENVIRONMENT === 'dev'){
              clubUser.id.profilePic = clConfig.cloudinary.url(clubUser.id.profilePicId, clConfig.thumb_100_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              clubUser.id.profilePic = s3Config.thumb_100_prefix+clubUser.id.profilePicId;
            }
            return clubUser.id;
          });
          clubMembersList.sort((a, b) => a.fullName.localeCompare(b.fullName));
          clubMembersList = JSON.stringify(clubMembersList);
          res.render('clubs/room', {room, clubName, clubId: foundClub._id, isAdmin,
          clubConversation: foundClubConversation, clubMembersList, roomParticipantsList, cdn_prefix});
          return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
        }
      }
      });
    }
    });
  },

  chatsRoomEdit(req, res, next){
    Club.findOne({_id: req.params.club_id, isActive: true})
    .select({_id: 1, name: 1, avatar: 1, avatarId: 1, clubUsers: 1, chatRooms: 1, chatRoomsCount: 1})
    .exec(async function(err, foundClub){
    if(err || !foundClub){
      logger.error(req.user._id+' : (chats-16)foundClub err => '+err);
      req.flash('error', 'Something went wrong :(');
    } else{
      isAdmin = checkRank(foundClub.clubUsers,req.user._id,1);
      if(isAdmin){
        var roomConversationId;
        for(var i=0;i<foundClub.chatRooms.length;i++){
          if(foundClub.chatRooms[i].conversationId.equals(req.params.room_id)){
            roomConversationId = foundClub.chatRooms[i].conversationId;
            if(req.file){
              try{
                if(process.env.ENVIRONMENT === 'dev'){
                  if(foundClub.chatRooms[i].avatarId != null){
                    clConfig.cloudinary.v2.uploader.destroy(foundClub.chatRooms[i].avatarId);
                  }
                  var result = await clConfig.cloudinary.v2.uploader.upload(req.file.path, clConfig.roomAvatars_400_obj);
                  foundClub.chatRooms[i].avatar = result.secure_url;
                  foundClub.chatRooms[i].avatarId = result.public_id;
                } else if (process.env.ENVIRONMENT === 'prod'){
                  if(foundClub.chatRooms[i].avatarId != null){
                    s3Config.deleteFile(foundClub.chatRooms[i].avatarId);
                  }
                  var result = await s3Config.uploadFile(req.file, 'roomAvatars/', 400);
                  s3Config.removeTmpUpload(req.file.path);
                  foundClub.chatRooms[i].avatar = result.Location;
                  foundClub.chatRooms[i].avatarId = result.Key;
                }
                foundClub.save();
                res.redirect('/clubs/'+req.params.club_id+'/rooms/'+req.params.room_id);
              } catch(err){
                logger.error(req.user._id+' : (chats-17)roomAvatarUpload err => '+err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }
            }
          }
        }
        var clubMembersList = foundClub.clubUsers.map(function(clubUser){
          return clubUser.id;
        });
        if(req.body.addParticipants){
          var newParticipants = req.body.addParticipants.split(',');
          var isFounded = newParticipants.some(r => clubMembersList.indexOf(r) !== -1);
          if(isFounded === true){
            ClubConversation.updateOne({_id: roomConversationId, isActive: true}, 
            {$addToSet: {allParticipantIds: newParticipants}, $inc: {participantCount: newParticipants.length}}, 
            function(err, updateClubConversation){
            if(err || !updateClubConversation){
              logger.error(req.user._id+' : (chats-18)updateClubConversation err => '+err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            } else{
              return res.redirect('/clubs/'+req.params.club_id+'/rooms/'+req.params.room_id);
            }
            });
          }
        } else if(req.body.removeParticipants){
          var oldParticipants = req.body.removeParticipants.split(',');
          var isFounded = oldParticipants.some(r => clubMembersList.indexOf(r) !== -1);
          if(isFounded === true){
            ClubConversation.updateOne({_id: roomConversationId, isActive: true}, 
            {$pull: {allParticipantIds: {$in: oldParticipants}}, $inc: {participantCount: -oldParticipants.length}}, 
            function(err, updateClubConversation){
            if(err || !updateClubConversation){
              logger.error(req.user._id+' : (chats-19)updateClubConversation err => '+err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            } else{
              return res.redirect('/clubs/'+req.params.club_id+'/rooms/'+req.params.room_id);
            }
            });
          }
        } else if(req.body.deleteRoom){
          for(var i=0;i<foundClub.chatRooms.length;i++){
            if(foundClub.chatRooms[i].conversationId.equals(req.params.room_id)){
              if(process.env.ENVIRONMENT === 'dev'){
                if(foundClub.chatRooms[i].avatarId != null){
                  clConfig.cloudinary.v2.uploader.destroy(foundClub.chatRooms[i].avatarId);
                }
                foundClub.chatRooms[i].avatar = null;
                foundClub.chatRooms[i].avatarId = null;
              } else if (process.env.ENVIRONMENT === 'prod'){
                if(foundClub.chatRooms[i].avatarId != null){
                  s3Config.deleteFile(foundClub.chatRooms[i].avatarId);
                }
                foundClub.chatRooms[i].avatar = null;
                foundClub.chatRooms[i].avatarId = null;
              }
            }
          }
          foundClub.save();
          Club.updateOne({_id: req.params.club_id, chatRooms: {$elemMatch: {conversationId: roomConversationId}}},
          {$pull: {chatRooms: {conversationId: roomConversationId}}, $inc: {chatRoomsCount: -1}}, function(err, updatedClub){
          if(err || !updatedClub){
            logger.error(req.user._id+' : (chats-20)updatedClub err => '+err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          } else{
            ClubConversation.deleteOne({_id: roomConversationId, isActive: true, isRoom: true}, function(err){
            if(err){
              logger.error(req.user._id+' : (chats-21)deletedClubConversation err => '+err);
              return req.flash('error', 'Something went wrong :(');
            } else{
              Message.deleteMany({conversationId: roomConversationId}, function(err){
              if(err){
                logger.error(req.user._id+' : (chats-22)deletedClubMessages err => '+err);
                return req.flash('error', 'Something went wrong :(');
              } else{
                return res.redirect('/clubs/'+req.params.club_id);
              }
              });
            }
            });
          }
          });
        }
      }
    }
    });
  }
};

//*******************FUNCTIONS***********************
function checkRank(clubUsers,userId,rank){
  var ok = false;
  clubUsers.forEach(function(user){
    if(user.id.equals(userId) && user.userRank <= rank){
      ok = true;
    }
  });
  return ok;
};

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