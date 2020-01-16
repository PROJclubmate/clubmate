const express      = require('express'),
  router           = express.Router(),
  User             = require('../models/user'),
  Club             = require('../models/club'),
  Conversation     = require('../models/conversation'),
  ClubConversation = require('../models/club-conversation'),
  Message          = require('../models/message'),
  mongoose         = require('mongoose');


module.exports = function(io){

	// ================================ USER-CHAT ROUTES ====================================
	router.get('/chat/:conversationId', function(req, res){
		if(req.user){
		  Conversation.findOne({_id: req.params.conversationId})
		  .populate({path: 'messageBuckets', options: {sort: {_id: -1}, limit: 2}})
		  .exec(function(err, foundConversation){ 
		  if(err || !foundConversation){
		    console.log(req.user._id+' => (conversations-1)foundConversation err:- '+JSON.stringify(err, null, 2));
		    req.flash('error', 'Something went wrong :(');
		    return res.redirect('back');
		  } else{
	      if(contains(foundConversation.participants,req.user._id)){
	      	var foundMessageIds = foundConversation.messageBuckets.map(function(messages){
		        return messages._id;
		      });
	        var currentUser = req.user._id;
	        res.send({messages: foundConversation, currentUser, foundMessageIds});
	      } else{console.log('(conversations-2)Not a participant: ('+req.user._id+') '+req.user.fullName);}
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
		    console.log(req.user._id+' => (conversations-3)foundConversation err:- '+JSON.stringify(err, null, 2));
		    req.flash('error', 'Something went wrong :(');
		    return res.redirect('back');
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
	  			Message.findById(bucket[bucket.length-1], function(err, foundMessages){
		        var currentUser = req.user._id;
		        if(foundMessages){
		        	var foundMessageId = [foundMessages._id];
		        } else{var foundMessageId = null;}
		        res.send({messageBucket: foundMessages, currentUser, foundMessageId});
		      });
	      } else{console.log('(conversations-4)Not a participant: ('+req.user._id+') '+req.user.fullName);}
		  }
		  });
		}
	});

	router.post('/chat/:conversationId', function(req, res){
		if(req.user){
		  if(!req.body.composedMessage || req.body.composedMessage == ''){
		  	return res.sendStatus(400);
		  }
		  Conversation.findOne({_id: req.params.conversationId, isBlocked: false})
		  .exec(function(err, foundConversation){
		  if(err){
		    console.log(req.user._id+' => (conversations-5)foundConversation err:- '+JSON.stringify(err, null, 2));
		    req.flash('error', 'Something went wrong :(');
		    return res.redirect('back');
		  } else{
		    if(foundConversation){
		      if(contains(foundConversation.participants,req.user._id)){
		        Message.findOneAndUpdate({conversationId: foundConversation._id, bucket: foundConversation.bucketNum},
		        {$inc: {count: 1},
		          $push: {messages: {authorId: req.user._id, text: req.body.composedMessage}
		          }
		        }, {fields: {count:1} , upsert: true, new: true}, function(err, newMessageBucket){
		        if(err || !newMessageBucket){
		          console.log(req.user._id+' => (conversations-6)newMessageBucket err:- '+JSON.stringify(err, null, 2));
		          req.flash('error', 'Something went wrong :(');
		          return res.redirect('back');
		        } else{
		          if(newMessageBucket.count == 1){
		            foundConversation.messageBuckets.push(newMessageBucket._id);
		            foundConversation.save();
		          } else if(newMessageBucket.count >= 50){
		            foundConversation.bucketNum += 1;
		            foundConversation.save();
		          } else{
		            foundConversation.save();
		          }
		          if(err){
		            console.log(req.user._id+' => (conversations-7) err:- '+JSON.stringify(err, null, 2));
		            req.flash('error', 'Something went wrong :(');
		            return res.redirect('back');
		            sendStatus(500);
		          }
		          var reciever;
		          io.to(req.params.conversationId).emit('message', req.body);
		          for(var j=0;j<foundConversation.participants.length;j++){
		          	if(!foundConversation.participants[j].equals(req.user._id)){
		          		reciever = foundConversation.participants[j];
		          		break;
		          	}
			        }
			        // Seems very expensive, 2 db operations for each msg(but then Nodejs is fast right? lel)
			        User.updateOne({_id: reciever, 'userChats.userId': req.user._id},
			        {$set: {'userChats.$.lastMessage': req.body.composedMessage}}, function(err, foundReceivingUser){
					      if(err || !foundReceivingUser){
					        console.log(req.user._id+' => (conversations-8)foundReceivingUser err:- '+JSON.stringify(err, null, 2));
					        req.flash('error', 'Something went wrong :(');
					        return res.redirect('back');
					      }
					      // Close pending xhr request
			        	return res.sendStatus(200);
					    });
		        }
		        });
		      } else{console.log('(conversations-9)Not a participant: ('+req.user._id+') '+req.user.fullName);}
		    }
		  }
		  })
		}
	});

	router.post('/read/:conversationId', function(req, res, next){
		if(req.user){
			Conversation.findOne({_id: req.params.conversationId})
		  .exec(function(err, foundConversation){
		  if(err || !foundConversation){
		    console.log(req.user._id+' => (conversations-10)foundConversation err:- '+JSON.stringify(err, null, 2));
		    req.flash('error', 'Something went wrong :(');
		    return res.redirect('back');
		  } else{
				var reciever;
		    for(var j=0;j<foundConversation.participants.length;j++){
		    	if(!foundConversation.participants[j].equals(req.user._id)){
		    		reciever = foundConversation.participants[j];
		    		break;
		    	}
		    }
				User.updateOne({_id: req.user._id, 'userChats.userId': reciever},
		    {$set: {'userChats.$.lastMessage': ''}}, function(err, foundCurrentUser){
		      if(err || !foundCurrentUser){
		        console.log(req.user._id+' => (conversations-11)foundCurrentUser err:- '+JSON.stringify(err, null, 2));
		        req.flash('error', 'Something went wrong :(');
		        return res.redirect('back');
		      }
		    	return res.sendStatus(200);
		    });
			}
			});
		}
	});

	router.post('/block/:conversationId', function(req, res, next){
		if(req.user && req.body.true == ''){
			Conversation.findOne({_id: req.params.conversationId, isBlocked: false})
		  .exec(function(err, foundConversation){
		  if(err || !foundConversation){
		    console.log(req.user._id+' => (conversations-12)foundConversation err:- '+JSON.stringify(err, null, 2));
		    req.flash('error', 'Something went wrong :(');
		    return res.redirect('back');
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
		    console.log(req.user._id+' => (conversations-13)foundConversation err:- '+JSON.stringify(err, null, 2));
		    req.flash('error', 'Something went wrong :(');
		    return res.redirect('back');
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
	    var obj={}; var newMessage=[];
	    obj['authorId'] = req.user._id;
	    obj['text'] = req.body.composedMessage;
	    newMessage.push(obj);
	    const message = new Message({
	      conversationId: conversation._id,
	      messages: newMessage
	    });
	    message.save();
	    conversation.messageBuckets.push(message._id);
	    conversation.save();
	    var foundUserObj={}, currentUserObj={}, foundUserUserChats=[], currentUserUserChats=[];
	    // foundUser userChats push
	    foundUserObj['userId'] = req.user._id;
	    foundUserObj['conversationId'] = conversation._id;
	    foundUserObj['lastMessage'] = req.body.composedMessage;
	    foundUserUserChats.push(foundUserObj);
	    // currentUser userChats push
	    currentUserObj['userId'] = mongoose.Types.ObjectId(req.body.recipientId);
	    currentUserObj['conversationId'] = conversation._id;
	    currentUserUserChats.push(currentUserObj);
	    User.updateOne({_id: req.user._id},{$push: {userChats: currentUserUserChats}}, function(err, currentUser){
	      if(err || !currentUser){
	        console.log(req.user._id+' => (conversations-14)currentUser err:- '+JSON.stringify(err, null, 2));
	        req.flash('error', 'Something went wrong :(');
	        return res.redirect('back');
	      }
	    });
	    User.updateOne({_id: req.body.recipientId}, {$push: {userChats: foundUserUserChats}}, function(err, foundUser){
	      if(err || !foundUser){
	        console.log(req.user._id+' => (conversations-15)foundUser err:- '+JSON.stringify(err, null, 2));
	        req.flash('error', 'Something went wrong :(');
	        return res.redirect('back');
	      }
		    res.sendStatus(200);
	    });
	  }
	});

	// ================================ CLUB-CHAT ROUTES =====================================
	router.get('/club-chat/:conversationId', function(req, res){
		if(req.user){
		  ClubConversation.findOne({_id: req.params.conversationId, isActive: true})
		  .populate({path: 'messageBuckets', options: {sort: {_id: -1}, limit: 2}})
		  .exec(function(err, foundClubConversation){
		  if(err){
		    console.log(req.user._id+' => (conversations-16)foundClubConversation err:- '+JSON.stringify(err, null, 2));
		    req.flash('error', 'Something went wrong :(');
		    return res.redirect('back');
		  } else if(foundClubConversation){
	      if(contains2(req.user.userClubs,foundClubConversation.clubId)){
	      	var foundMessageIds = foundClubConversation.messageBuckets.map(function(messages){
		        return messages._id;
		      });
	        var currentUser = req.user._id;
	        var firstName = req.user.firstName;
	        res.send({messages: foundClubConversation, currentUser, firstName, foundMessageIds});
	      } else{console.log('(conversations-17)Not a club member: ('+req.user._id+') '+req.user.fullName);}
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
		    console.log(req.user._id+' => (conversations-18)foundClubConversation err:- '+JSON.stringify(err, null, 2));
		    req.flash('error', 'Something went wrong :(');
		    return res.redirect('back');
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
	  			Message.findById(bucket[bucket.length-1], function(err, foundMessages){
		        var currentUser = req.user._id;
		        var firstName = req.user.firstName;
		        if(foundMessages){
		        	var foundMessageId = [foundMessages._id];
		        } else{var foundMessageId = null;}
		        res.send({messageBucket: foundMessages, currentUser, foundMessageId, firstName});
		      });
	      } else{console.log('(conversations-19)Not a club member: ('+req.user._id+') '+req.user.fullName);}
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
		    console.log(req.user._id+' => (conversations-20)foundClubConversation err:- '+JSON.stringify(err, null, 2));
		    req.flash('error', 'Something went wrong :(');
		    return res.redirect('back');
		  } else if(foundClubConversation){
	      if(contains2(req.user.userClubs,foundClubConversation.clubId)){
	      	foundClubConversation.latestMessage = req.body.composedMessage;
	        Message.findOneAndUpdate({conversationId: foundClubConversation._id, bucket: foundClubConversation.bucketNum},
	        {$inc: {count: 1},
	          $push: {messages: {authorId: req.user._id, authorName: req.user.fullName, 
	            text: req.body.composedMessage}
	          }
	        }, {fields: {count:1} , upsert: true, new: true}, function(err, newMessageBucket){
	        if(err || !newMessageBucket){
	          console.log(req.user._id+' => (conversations-21)newMessageBucket err:- '+JSON.stringify(err, null, 2));
	          req.flash('error', 'Something went wrong :(');
	          return res.redirect('back');
	        } else{
	          if(newMessageBucket.count == 1){
	            foundClubConversation.messageBuckets.push(newMessageBucket._id);
	            foundClubConversation.save();
	          } else if(newMessageBucket.count >= 50){
	            foundClubConversation.bucketNum += 1;
	            foundClubConversation.save();
	          } else{
	            foundClubConversation.save();
	          }
	          if(err){
	            console.log(req.user._id+' => (conversations-22) err:- '+JSON.stringify(err, null, 2));
	            req.flash('error', 'Something went wrong :(');
	            return res.redirect('back');
	            sendStatus(500);
	          }
	          io.to(req.params.conversationId).emit('clubMessage', req.body); 
	          return res.sendStatus(200);
	        }
	        });
	      } else{console.log('(conversations-23)Not a participant: ('+req.user._id+') '+req.user.fullName);}
		  }
		  })
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
	    var obj={}; var newMessage=[];
	    obj['authorId'] = req.user._id;
	    obj['authorName'] = req.user.fullName;
	    obj['text'] = req.body.composedMessage;
	    newMessage.push(obj);
	    const message = new Message({
	      conversationId: clubConversation._id,
	      messages: newMessage
	    });
	    message.save();
	    clubConversation.messageBuckets.push(message._id);
	    clubConversation.latestMessage = req.body.composedMessage;
	    clubConversation.save();
	    // Insert conversationId into clubUsers
	    Club.updateOne({_id: req.body.clubId, isActive: true},{$set: {conversationId: clubConversation._id}}, function(err, foundClub){
	      if(err){
	        console.log(req.user._id+' => (conversations-24)foundClub err:- '+JSON.stringify(err, null, 2));
	        req.flash('error', 'Something went wrong :(');
	        return res.redirect('back');
	      }
	    });
	    res.sendStatus(200);
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