const express      = require('express'),
  app              = express(),
  bodyParser       = require('body-parser'),
  http             = require('http').Server(app),
  io               = require('socket.io')(http),
  mongoose         = require('mongoose'),
  flash            = require('connect-flash'),
  passport         = require('passport'),
  LocalStrategy    = require('passport-local'),
  methodOverride   = require('method-override'),
  User             = require('./models/user'),
  Club             = require('./models/club'),
  Conversation     = require('./models/conversation'),
  ClubConversation = require('./models/club-conversation'),
  Message          = require('./models/message')
  port             = 8080,
  url              = 'mongodb://localhost/ghost_dev',
  dotenv           = require('dotenv').config();

const cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_ID, 
  api_secret: process.env.API_SECRET,
});

//Requiring routes
const indexRoutes  = require('./routes/index'),
  profileRoutes    = require('./routes/profiles'),
  postRoutes       = require('./routes/posts'),
  commentRoutes    = require('./routes/comments'),
  discussionRoutes = require('./routes/discussions');


app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(methodOverride('_method'));
app.use(flash());

app.locals.moment = require('moment');

//PASSPORT CONFIGURATION
app.use(require('express-session')({
  secret: 'Once again Rusty wins cutest dog!',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(async function(req, res, next){
  res.locals.currentUser = req.user;
  if(req.user){
    try{
      res.locals.CU_50_profilePic = cloudinary.url(req.user.profilePicId,
      {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
      //REQUESTS
      let foundUser = await User.findById(req.user._id)
      .populate({path: 'clubInvites',select: 'name avatar avatarId banner'})
      .populate({path: 'friendRequests',select: 'fullName profilePic profilePicId note'})
      .exec();
      // check security of theese local variables & check for no variable overwriting
      res.locals.userClubs = foundUser.userClubs;
      res.locals.clubInviteRequests = foundUser.clubInvites.reverse();
      res.locals.friendRequests = foundUser.friendRequests.reverse();

      var fUCI_50_clubAvatar = []; var fUFR_50_profilePic = [];
      for(var i=0;i<foundUser.clubInvites.length;i++){
        fUCI_50_clubAvatar[i] = cloudinary.url(foundUser.clubInvites[i].avatarId,
        {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
      }
      for(var j=0;j<foundUser.friendRequests.length;j++){
        fUFR_50_profilePic[j] = cloudinary.url(foundUser.friendRequests[j].profilePicId,
        {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
      }
      res.locals.CI_50_clubAvatar = fUCI_50_clubAvatar;
      res.locals.FR_50_profilePic = fUFR_50_profilePic;
    } catch(err){
      console.log(req.user._id+' => (app-1)request population err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    }
  }
  res.locals.error   = req.flash('error');
  res.locals.success = req.flash('success');
  next();
});

// Mount routes
app.use('/', indexRoutes);
app.use('/', profileRoutes);
app.use('/', postRoutes);
app.use('/', commentRoutes);
app.use('/', discussionRoutes);

// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   const err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });

// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

io.on('connection', function(socket){
  // console.log('socket: '+ socket.id +' connected');

  // update sender's status(yourself?)
  msgStatus = function(s){
    socket.emit('status', s);
  }
  socket.on('typing', function(data){
    socket.broadcast.emit('typing', data);
  })

  clubMsgStatus = function(s){
    socket.emit('clubStatus', s);
  }
  socket.on('clubTyping', function(data){
    socket.broadcast.emit('clubTyping', data);
  })
  
})

// USER-CHAT ROUTES
app.get('/chat/:conversationId', function(req, res){
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

app.post('/chat/:conversationId', function(req, res){
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

app.post('/new/chat', function(req, res, next){
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

// CLUB-CHAT ROUTES
app.get('/club-chat/:conversationId', function(req, res){
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

app.post('/club-chat/:conversationId', function(req, res){
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

app.post('/new/club-chat', function(req, res, next){
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


http.listen(port, function(){
  console.log('socket is listening');
})

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log("GhosTwn server has started on port "+port+"!!");
});

// Connect to database
mongoose.connect(url, {useNewUrlParser: true, useCreateIndex: true}, function(err, client){
  if(err){
    return console.log('(app-17)'+JSON.stringify(err, null, 2));
  }
  console.log('MongoDB connected...');
});

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
