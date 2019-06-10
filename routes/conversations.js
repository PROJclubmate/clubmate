const express     = require('express'),
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
	  Conversation.findOne({_id: req.params.conversationId })
	  .populate({path: 'messageBuckets', options: {sort: {_id: -1}, limit: 2}})
	  .exec(function(err, foundMessages){
	  if(err || !foundMessages){
	    console.log(req.user._id+' => (app-2)foundMessages err:- '+JSON.stringify(err, null, 2));
	    req.flash('error', 'Something went wrong :(');
	    return res.redirect('back');
	  } else{
	    if(req.user){
	      if(contains(foundMessages.participants,req.user._id)){
	        var currentUser = req.user._id;
	        res.send({messages: foundMessages, currentUser: currentUser});
	      } else{console.log('(app-3)Not a participant: ('+req.user._id+') '+req.user.fullName);}
	    }
	  }
	  });
	});

	router.post('/chat/:conversationId', function(req, res){
	  if(!req.body.composedMessage || req.body.composedMessage == ''){
	    return msgStatus('Pl. enter a message');
	  }
	  Conversation.findOne({_id: req.params.conversationId })
	  .exec(function(err, foundConversation){
	  if(err || !foundConversation){
	    console.log(req.user._id+' => (app-4)foundConversation err:- '+JSON.stringify(err, null, 2));
	    req.flash('error', 'Something went wrong :(');
	    return res.redirect('back');
	  } else{
	    if(req.user){
	      if(contains(foundConversation.participants,req.user._id)){
	        Message.findOneAndUpdate({conversationId: foundConversation._id, bucket: foundConversation.bucketNum},
	        {$inc: {count: 1},
	          $push: {messages: {authorId: req.user._id, text: req.body.composedMessage}
	          }
	        }, {fields: {count:1} , upsert: true, new: true}, function(err, newMessageBucket){
	        if(err || !newMessageBucket){
	          console.log(req.user._id+' => (app-5)newMessageBucket err:- '+JSON.stringify(err, null, 2));
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
	            console.log(req.user._id+' => (app-6) err:- '+JSON.stringify(err, null, 2));
	            req.flash('error', 'Something went wrong :(');
	            return res.redirect('back');
	          }
	          io.emit('message', req.body);
	          // res.sendStatus(200);
	          return msgStatus({
	            message: 'Message sent',
	            clear: true
	          });
	        }
	        });
	      } else{console.log('(app-7)Not a participant: ('+req.user._id+') '+req.user.fullName);}
	    }
	  }
	  })
	});

	router.post('/new/chat', function(req, res, next){
	  if(!req.body.recipientId || req.body.recipientId == ''){
	    return msgStatus('Invalid recipient');
	  }
	  if(!req.body.composedMessage || req.body.composedMessage == ''){
	    return msgStatus('Pl. enter a message');
	  }
	  if(req.user){
	    const conversation = new Conversation({
	      participants: [req.user._id, mongoose.Types.ObjectId(req.body.recipientId)]
	    });
	    var obj={}; var newMessage=[];
	    obj['authorId'] = req.user._id;
	    obj['authorName'] = req.user.fullName;
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
	    foundUserUserChats.push(foundUserObj);
	    // currentUser userChats push
	    currentUserObj['userId'] = mongoose.Types.ObjectId(req.body.recipientId);
	    currentUserObj['conversationId'] = conversation._id;
	    currentUserUserChats.push(currentUserObj);
	    User.updateOne({_id: req.body.recipientId},{$push: {userChats: foundUserUserChats}}, function(err, foundUser){
	      if(err || !foundUser){
	        console.log(req.user._id+' => (app-8)foundUser err:- '+JSON.stringify(err, null, 2));
	        req.flash('error', 'Something went wrong :(');
	        return res.redirect('back');
	      }
	    });
	    User.updateOne({_id: req.user._id},{$push: {userChats: currentUserUserChats}}, function(err, currentUser){
	      if(err || !currentUser){
	        console.log(req.user._id+' => (app-9)currentUser err:- '+JSON.stringify(err, null, 2));
	        req.flash('error', 'Something went wrong :(');
	        return res.redirect('back');
	      }
	    });
	    msgStatus('Conversation started!');
	    return io.emit('userRefresh', req.body.recipientId);
	  }
	});

	// ================================ CLUB-CHAT ROUTES =====================================
	router.get('/club-chat/:conversationId', function(req, res){
	  ClubConversation.findOne({_id: req.params.conversationId })
	  .populate({path: 'messageBuckets', options: {sort: {_id: -1}, limit: 2}})
	  .exec(function(err, foundMessages){
	  if(err || !foundMessages){
	    console.log(req.user._id+' => (app-10)foundMessages err:- '+JSON.stringify(err, null, 2));
	    req.flash('error', 'Something went wrong :(');
	    return res.redirect('back');
	  } else{
	    if(req.user){
	      if(contains2(req.user.userClubs,foundMessages.clubId)){
	        var currentUser = req.user._id;
	        var firstName = req.user.firstName;
	        res.send({messages: foundMessages, currentUser: currentUser, firstName: firstName});
	      } else{console.log('(app-11)Not a club member: ('+req.user._id+') '+req.user.fullName);}
	    }
	  }
	  });
	});

	router.post('/club-chat/:conversationId', function(req, res){
	  if(!req.body.composedMessage || req.body.composedMessage == ''){
	    return clubMsgStatus('Pl. enter a message');
	  }
	  ClubConversation.findOne({_id: req.params.conversationId })
	  .exec(function(err, foundConversation){
	  if(err || !foundConversation){
	    console.log(req.user._id+' => (app-12)foundConversation err:- '+JSON.stringify(err, null, 2));
	    req.flash('error', 'Something went wrong :(');
	    return res.redirect('back');
	  } else{
	    if(req.user){
	      if(contains2(req.user.userClubs,foundConversation.clubId)){
	        Message.findOneAndUpdate({conversationId: foundConversation._id, bucket: foundConversation.bucketNum},
	        {$inc: {count: 1},
	          $push: {messages: {authorId: req.user._id, authorName: req.user.fullName, 
	            text: req.body.composedMessage}
	          }
	        }, {fields: {count:1} , upsert: true, new: true}, function(err, newMessageBucket){
	        if(err || !newMessageBucket){
	          console.log(req.user._id+' => (app-13)newMessageBucket err:- '+JSON.stringify(err, null, 2));
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
	            console.log(req.user._id+' => (app-14) err:- '+JSON.stringify(err, null, 2));
	            req.flash('error', 'Something went wrong :(');
	            return res.redirect('back');
	          }
	          io.emit('clubMessage', req.body);
	          // res.sendStatus(200);
	          return clubMsgStatus({
	            message: 'Message sent',
	            clear: true
	          });
	        }
	        });
	      } else{console.log('(app-15)Not a participant: ('+req.user._id+') '+req.user.fullName);}
	    }
	  }
	  })
	});

	router.post('/new/club-chat', function(req, res, next){
	  if(!req.body.clubId || req.body.clubId == ''){
	    return clubMsgStatus('Invalid club');
	  }
	  if(!req.body.composedMessage || req.body.composedMessage == ''){
	    return clubMsgStatus('Pl. enter a message');
	  }
	  if(req.user){
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
	    clubConversation.save();
	    // Insert conversationId into clubUsers
	    Club.updateOne({_id: req.body.clubId},{$set: {conversationId: clubConversation._id}}, function(err, foundClub){
	      if(err || !foundClub){
	        console.log(req.user._id+' => (app-16)foundClub err:- '+JSON.stringify(err, null, 2));
	        req.flash('error', 'Something went wrong :(');
	        return res.redirect('back');
	      }
	    });
	    clubMsgStatus('Club Conversation started!');
	    return io.emit('clubRefresh', req.body.clubId);
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