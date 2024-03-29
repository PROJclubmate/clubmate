const express      = require('express'),
  router           = express.Router(),
  User             = require('../models/user'),
  Club             = require('../models/club'),
  Conversation     = require('../models/conversation'),
  ClubConversation = require('../models/club_conversation'),
  Message          = require('../models/message'),
  clConfig         = require('../config/cloudinary'),
  s3Config         = require('../config/s3'),
	logger           = require('../logger'),
  mongoose         = require('mongoose');

	if(process.env.ENVIRONMENT === 'dev'){
		var cdn_prefix = 'https://res.cloudinary.com/dubirhea4/';
	} else if (process.env.ENVIRONMENT === 'prod'){
		var cdn_prefix = 'https://d367cfssgkev4p.cloudfront.net/';
	}
	

module.exports = function(io){

	// ================================ USER-CHAT ROUTES ====================================
	router.get('/chat/:conversationId', function(req, res){
		if(req.user){
		  Conversation.findOne({_id: req.params.conversationId})
		  .populate({path: 'messageBuckets', options: {sort: {_id: -1}, limit: 2}})
		  .exec(function(err, foundConversation){ 
		  if(err || !foundConversation){
				logger.error(req.user._id+' : (conversations-1)foundConversation err => '+err);
		    return res.sendStatus(500);
		  } else{
	      if(contains(foundConversation.participants,req.user._id)){
	      	var foundMessageIds = foundConversation.messageBuckets.map(function(messages){
		        return messages._id;
		      });
	        var currentUser = req.user._id;
	        res.send({messages: foundConversation, currentUser, foundMessageIds});
	      } else{logger.warn(req.user._id+' : (conversations-2)Not a participant: ('+req.user._id+') '+req.user.fullName);}
		  }
		  });
		}
	});

	router.get('/prev-chatMsgs/:conversationId', function(req, res){
		if(req.user){
			if(req.query.ids.split(',') != ''){
	      var seenIds = req.query.ids.split(',');
	    } else{
	      var seenIds = [];
	    }
		  Conversation.findOne({_id: req.params.conversationId})
		  .exec(function(err, foundConversation){
		  if(err || !foundConversation){
				logger.error(req.user._id+' : (conversations-3)foundConversation err => '+err);
		    return res.sendStatus(500);
		  } else{
	    	var bucket = foundConversation.messageBuckets;
	    	for(var i=bucket.length-1;i>=0;i--){
	    		for(var j=seenIds.length-1;j>=0;j--){
		    		if(seenIds[j] == bucket[i]){
		    			bucket.splice(i,1);
		    			break;
		    		}
		    	}
	    	};
	  		if(contains(foundConversation.participants,req.user._id)){
	  			Message.findById(bucket[bucket.length-1], function(err, foundMessage){
		        var currentUser = req.user._id;
		        if(foundMessage){
		        	var foundMessageId = [foundMessage._id];
		        } else{var foundMessageId = null;}
		        res.send({messageBucket: foundMessage, currentUser, foundMessageId});
		      });
	      } else{logger.warn(req.user._id+' : (conversations-4)Not a participant: ('+req.user._id+') '+req.user.fullName);}
		  }
		  });
		}
	});

	router.post('/chat/:conversationId', function(req, res){
		if(req.user){
		  if(!req.body.composedMessage || req.body.composedMessage == ''){
		  	return res.sendStatus(400);
		  }
		  Conversation.findOne({_id: req.params.conversationId, isBlocked: false}, function(err, foundConversation){
		  if(err){
				logger.error(req.user._id+' : (conversations-5)foundConversation err => '+err);
		    return res.sendStatus(500);
		  } else{
		    if(foundConversation){
		      if(contains(foundConversation.participants,req.user._id)){
		      	foundConversation.lastMessage = req.body.composedMessage;
		        Message.findOneAndUpdate({conversationId: foundConversation._id, bucket: foundConversation.bucketNum},
		        {$inc: {count: 1},
		          $push: {messages: {authorId: req.user._id, text: req.body.composedMessage}
		          }
		        }, {fields: {count:1} , upsert: true, new: true}, function(err, newMessageBucket){
		        if(err || !newMessageBucket){
							logger.error(req.user._id+' : (conversations-6)newMessageBucket err => '+err);
		          return res.sendStatus(500);
		        } else{
		        	for(var i=0;i<foundConversation.seenMsgCursors.length;i++){
					    	if(foundConversation.seenMsgCursors[i].id.equals(req.user._id)){
					    		foundConversation.seenMsgCursors[i].cursor = foundConversation.messageCount+1;
					    		foundConversation.seenMsgCursors[i].lastSeen = Date.now();
					    		break;
					    	}
					    }
		          if(newMessageBucket.count == 1){
		            foundConversation.messageBuckets.push(newMessageBucket._id);
		            foundConversation.messageCount += 1;
		            foundConversation.lastMsgOn = Date.now();
		            foundConversation.lastMsgBy = req.user._id;
		            foundConversation.save();
		          } else if(newMessageBucket.count >= 50){
		            foundConversation.bucketNum += 1;
		            foundConversation.messageCount += 1;
		            foundConversation.lastMsgOn = Date.now();
		            foundConversation.lastMsgBy = req.user._id;
		            foundConversation.save();
		          } else{
		          	foundConversation.messageCount += 1;
		          	foundConversation.lastMsgOn = Date.now();
		          	foundConversation.lastMsgBy = req.user._id;
		            foundConversation.save();
		          }
		          if(err){
								logger.error(req.user._id+' : (conversations-7) err => '+err);
		            return res.sendStatus(500);
		          }
		          var reciever;
		          io.to(req.params.conversationId).emit('message', req.body);
		          for(var j=0;j<foundConversation.participants.length;j++){
		          	if(!foundConversation.participants[j].equals(req.user._id)){
		          		reciever = foundConversation.participants[j];
		          		break;
		          	}
			        }
			        // Close pending xhr request
			        return res.sendStatus(200);
		        }
		        });
		      } else{logger.warn(req.user._id+' : (conversations-9)Not a participant: ('+req.user._id+') '+req.user.fullName);}
		    }
		  }
		  })
		}
	});

	router.post('/seen_msg/:conversationId', function(req, res, next){
		if(req.user){
			Conversation.findOne({_id: req.params.conversationId}, function(err, foundConversation){
		  if(err || !foundConversation){
				logger.error(req.user._id+' : (conversations-10)foundConversation err => '+err);
		    return res.sendStatus(500);
		  } else{
		  	for(var i=0;i<foundConversation.seenMsgCursors.length;i++){
		    	if(foundConversation.seenMsgCursors[i].id.equals(req.user._id)){
		    		foundConversation.seenMsgCursors[i].cursor = foundConversation.messageCount;
		    		foundConversation.seenMsgCursors[i].lastSeen = Date.now();
		    		break;
		    	}
		    }
		    foundConversation.save();
				var reciever;
		    for(var j=0;j<foundConversation.participants.length;j++){
		    	if(!foundConversation.participants[j].equals(req.user._id)){
		    		reciever = foundConversation.participants[j];
		    		break;
		    	}
		    }
		    return res.sendStatus(200);
			}
			});
		}
	});

	router.post('/block/:conversationId', function(req, res, next){
		if(req.user && req.body.true == ''){
			Conversation.findOne({_id: req.params.conversationId, isBlocked: false})
		  .exec(function(err, foundConversation){
		  if(err || !foundConversation){
				logger.error(req.user._id+' : (conversations-12)foundConversation err => '+err);
		    return res.sendStatus(500);
		  } else{
	    	foundConversation.isBlocked = true;
    		foundConversation.blockedBy = req.user._id;
	      foundConversation.save();
	    	return res.sendStatus(200);
			}
			});
		} else if(req.user && req.body.false == ''){
			Conversation.findOne({_id: req.params.conversationId, isBlocked: true})
		  .exec(function(err, foundConversation){
		  if(err || !foundConversation){
				logger.error(req.user._id+' : (conversations-13)foundConversation err => '+err);
		    return res.sendStatus(500);
		  } else{
	    	foundConversation.isBlocked = false;
    		foundConversation.blockedBy = undefined;
	      foundConversation.save();
	    	return res.sendStatus(200);
			}
			});
		}
	});

	router.post('/new/chat', function(req, res, next){
		if(req.user){
		  if(!req.body.recipientId || req.body.recipientId == ''){
		  	return res.sendStatus(400);
		  }
		  if(!req.body.composedMessage || req.body.composedMessage == ''){
		  	return res.sendStatus(400);
		  }
	    const conversation = new Conversation({
	      participants: [req.user._id, mongoose.Types.ObjectId(req.body.recipientId)]
	    });
	    var obja={}; var newMessage=[];
	    obja['authorId'] = req.user._id;
	    obja['text'] = req.body.composedMessage;
	    newMessage.push(obja);
	    const message = new Message({
	      conversationId: conversation._id,
	      messages: newMessage
	    });
	    message.save();
	    var objb = {};
	    for(var i=0;i<conversation.participants.length;i++){
	    	objb['id'] = conversation.participants[i];
	    	conversation.seenMsgCursors.push(objb);
	    }
	    conversation.messageBuckets.push(message._id);
	    conversation.lastMessage = req.body.composedMessage;
	    conversation.save();
	    var foundUserObj={}, currentUserObj={}, foundUserUserChats=[], currentUserUserChats=[];
	    // foundUser userChats push
	    foundUserObj['userId'] = req.user._id;
	    foundUserObj['conversationId'] = conversation._id;
	    foundUserUserChats.push(foundUserObj);
	    // currentUser userChats push
	    currentUserObj['userId'] = mongoose.Types.ObjectId(req.body.recipientId);
	    currentUserObj['conversationId'] = conversation._id;
	    currentUserUserChats.push(currentUserObj);
	    User.updateOne({_id: req.user._id},{$push: {userChats: currentUserUserChats}}, function(err){
	      if(err){
					logger.error(req.user._id+' : (conversations-14)currentUser err => '+err);
	        return res.sendStatus(500);
	      }
	    });
	    User.updateOne({_id: req.body.recipientId}, {$push: {userChats: foundUserUserChats}}, function(err){
	      if(err){
					logger.error(req.user._id+' : (conversations-15)foundUser err => '+err);
	        return res.sendStatus(500);
	      }
		    return res.sendStatus(200);
	    });
	  }
	});

	// ================================ CLUB-CHAT ROUTES =====================================
	router.get('/club-chat/:conversationId', function(req, res){
		if(req.user){
			ClubConversation.findOne({_id: req.params.conversationId, isActive: true})
		  .populate({path: 'messageBuckets', populate: {path: 'messages.authorId', select: 'profilePic profilePicId'}, options: {sort: {_id: -1}, limit: 2}})
		  .exec(function(err, foundClubConversation){
		  if(err){
				logger.error(req.user._id+' : (conversations-16)foundClubConversation err => '+err);
		    return res.sendStatus(500);
		  } else if(foundClubConversation){
	      if(contains2(req.user.userClubs,foundClubConversation.clubId) &&
				((foundClubConversation.isRoom === true && foundClubConversation.allParticipantIds.includes(req.user._id)) ||
				(foundClubConversation.isRoom === false))){
					var MA_50_profilePic = [], numBuckets = foundClubConversation.messageBuckets.length;
					for(var i=0;i<numBuckets;i++){
						MA_50_profilePic[i] = [];
						for(var j=0;j<foundClubConversation.messageBuckets[i].messages.length;j++){
							if(process.env.ENVIRONMENT === 'dev'){
								MA_50_profilePic[i][j] = clConfig.cloudinary.url(foundClubConversation.messageBuckets[i].messages[j].authorId.profilePicId, clConfig.thumb_100_obj);
							} else if (process.env.ENVIRONMENT === 'prod'){
								MA_50_profilePic[i][j] = s3Config.thumb_100_prefix+foundClubConversation.messageBuckets[i].messages[j].authorId.profilePicId;
							}
						}
					}
	      	var foundMessageIds = foundClubConversation.messageBuckets.map(function(messages){
		        return messages._id;
		      });
	        var currentUser = req.user._id;
	        var firstName = req.user.firstName;
	        res.send({messages: foundClubConversation, MA_50_profilePic, currentUser, firstName, foundMessageIds});
	      } else{
					if(foundClubConversation.isRoom === true && !foundClubConversation.allParticipantIds.includes(req.user._id)){
						logger.warn(req.user._id+' : (conversations-17A)Not a room participant: ('+req.user._id+') '+req.user.fullName);
					} else{
						logger.warn(req.user._id+' : (conversations-17B)Not a club member: ('+req.user._id+') '+req.user.fullName);
					}
				}
		  }
		  });
		}
	});

	router.get('/prev-clubChatMsgs/:conversationId', function(req, res){
		if(req.user){
			if(req.query.ids.split(',') != ''){
	      var seenIds = req.query.ids.split(',');
	    } else{
	      var seenIds = [];
	    }
		  ClubConversation.findOne({_id: req.params.conversationId, isActive: true})
		  .exec(function(err, foundClubConversation){
		  if(err){
				logger.error(req.user._id+' : (conversations-18)foundClubConversation err => '+err);
		    return res.sendStatus(500);
		  } else if(foundClubConversation){
	    	var bucket = foundClubConversation.messageBuckets;
	    	for(var i=bucket.length-1;i>=0;i--){
	    		for(var j=seenIds.length-1;j>=0;j--){
		    		if(seenIds[j] == bucket[i]){
		    			bucket.splice(i,1);
		    			break;
		    		}
		    	}
	    	};
	  		if(contains2(req.user.userClubs,foundClubConversation.clubId)){
					Message.findById(bucket[bucket.length-1])
					.populate('messages.authorId', '_id profilePic profilePicId').exec(function(err, foundMessage){
						var MA_50_profilePic = [];
						for(var i=0;i<foundMessage.messages.length;i++){
							if(process.env.ENVIRONMENT === 'dev'){
								MA_50_profilePic[i] = clConfig.cloudinary.url(foundMessage.messages.authorId.profilePicId, clConfig.thumb_100_obj);
							} else if (process.env.ENVIRONMENT === 'prod'){
								MA_50_profilePic[i] = s3Config.thumb_100_prefix+foundMessage.messages.authorId.profilePicId;
							}
						}
		        var currentUser = req.user._id;
		        var firstName = req.user.firstName;
		        if(foundMessage){
		        	var foundMessageId = [foundMessage._id];
						} else{var foundMessageId = null;}
		        res.send({messageBucket: foundMessage, MA_50_profilePic, currentUser, foundMessageId, firstName});
		      });
	      } else{logger.warn(req.user._id+' : (conversations-19)Not a club member: ('+req.user._id+') '+req.user.fullName);}
		  }
		  });
		}
	});

	router.post('/club-chat/:conversationId', function(req, res){
		if(req.user){
		  if(!req.body.composedMessage || req.body.composedMessage == ''){
		  	return res.sendStatus(400);
		  }
		  ClubConversation.findOne({_id: req.params.conversationId, isActive: true})
		  .exec(function(err, foundClubConversation){
		  if(err){
				logger.error(req.user._id+' : (conversations-20)foundClubConversation err => '+err);
		    return res.sendStatus(500);
		  } else if(foundClubConversation){
	      if(contains2(req.user.userClubs,foundClubConversation.clubId)){
	      	foundClubConversation.lastMessage = req.body.composedMessage;
	        Message.findOneAndUpdate({conversationId: foundClubConversation._id, bucket: foundClubConversation.bucketNum},
	        {$inc: {count: 1},
	          $push: {messages: {authorId: req.user._id, authorName: req.user.fullName, 
	            text: req.body.composedMessage}
	          }
	        }, {fields: {count:1} , upsert: true, new: true}, function(err, newMessageBucket){
	        if(err || !newMessageBucket){
						logger.error(req.user._id+' : (conversations-21)newMessageBucket err => '+err);
	          return res.sendStatus(500);
	        } else{
	        	for(var i=0;i<foundClubConversation.seenMsgCursors.length;i++){
				    	if(foundClubConversation.seenMsgCursors[i].id.equals(req.user._id)){
				    		foundClubConversation.seenMsgCursors[i].cursor = foundClubConversation.messageCount+1;
				    		foundClubConversation.seenMsgCursors[i].lastSeen = Date.now();
				    		break;
				    	}
				    }
	          if(newMessageBucket.count == 1){
	            foundClubConversation.messageBuckets.push(newMessageBucket._id);
	            foundClubConversation.messageCount += 1;
	            foundClubConversation.lastMsgOn = Date.now();
	            foundClubConversation.lastMsgBy = req.user._id;
	            foundClubConversation.save();
	          } else if(newMessageBucket.count >= 50){
	            foundClubConversation.bucketNum += 1;
	            foundClubConversation.messageCount += 1;
	            foundClubConversation.lastMsgOn = Date.now();
	            foundClubConversation.lastMsgBy = req.user._id;
	            foundClubConversation.save();
	          } else{
	          	foundClubConversation.messageCount += 1;
	          	foundClubConversation.lastMsgOn = Date.now();
	          	foundClubConversation.lastMsgBy = req.user._id;
	            foundClubConversation.save();
	          }
	          if(err){
							logger.error(req.user._id+' : (conversations-22) err => '+err);
	            return res.sendStatus(500);
	          }
	          io.to(req.params.conversationId).emit('clubMessage', req.body); 
	          return res.sendStatus(200);
	        }
	        });
	      } else{logger.warn(req.user._id+' : (conversations-23)Not a participant: ('+req.user._id+') '+req.user.fullName);}
		  }
		  })
		}
	});

	router.post('/seen_clubmsg/:conversationId', function(req, res, next){
		if(req.user){
			ClubConversation.findOne({_id: req.params.conversationId}, function(err, foundClubConversation){
		  if(err || !foundClubConversation){
				logger.error(req.user._id+' : (conversations-24)foundClubConversation err => '+err);
		    return res.sendStatus(500);
		  } else{
		  	for(var i=0;i<foundClubConversation.seenMsgCursors.length;i++){
		    	if(foundClubConversation.seenMsgCursors[i].id.equals(req.user._id)){
		    		foundClubConversation.seenMsgCursors[i].cursor = foundClubConversation.messageCount;
		    		foundClubConversation.seenMsgCursors[i].lastSeen = Date.now();
		    		break;
		    	}
		    }
		    foundClubConversation.save();
		    return res.sendStatus(200);
			}
			});
		}
	});

	router.post('/new/club-chat', function(req, res, next){
		if(req.user){
		  if(!req.body.clubId || req.body.clubId == ''){
		  	return res.sendStatus(400);
		  }
		  if(!req.body.composedMessage || req.body.composedMessage == ''){
		  	return res.sendStatus(400);
		  }
	    const clubConversation = new ClubConversation({
	      clubId: mongoose.Types.ObjectId(req.body.clubId)
	    });
	    var obja={}; var newMessage=[];
	    obja['authorId'] = req.user._id;
	    obja['authorName'] = req.user.fullName;
	    obja['text'] = req.body.composedMessage;
	    newMessage.push(obja);
	    const message = new Message({
	      conversationId: clubConversation._id,
	      messages: newMessage
	    });
	    message.save();
	    Club.findOneAndUpdate({_id: req.body.clubId, isActive: true}, 
	    {$set: {conversationId: clubConversation._id}}, function(err, foundClub){
	      if(err){
					logger.error(req.user._id+' : (conversations-25)foundClub err => '+err);
	        return res.sendStatus(500);
	      }
	      var clubMembersArr = foundClub.clubUsers.map(function(clubUser){
          return clubUser.id;
        });
        var objb = {};
        for(var i=0;i<clubMembersArr.length;i++){
		    	objb['id'] = clubMembersArr[i];
		    	clubConversation.seenMsgCursors.push(objb);
		    }
		    clubConversation.messageBuckets.push(message._id);
		    clubConversation.lastMessage = req.body.composedMessage;
		    clubConversation.save();
		    User.updateMany({_id: {$in: clubMembersArr}, userClubs: {$elemMatch: {id: foundClub._id}}}, 
		    {$set: {'userClubs.$.conversationId': clubConversation._id}}, function(err){
		      if(err){
						logger.error(req.user._id+' : (conversations-26)updateUsers err => '+err);
		        return res.sendStatus(500);
		      }
		    });
	    });
	    return res.sendStatus(200);
	  }
	});

	return router;
}

//////////////////////////////////////////////////////////////////////
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