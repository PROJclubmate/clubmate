const express      = require('express'),
  app              = express(),
  bodyParser       = require('body-parser'),
  http             = require('http').Server(app),
  io               = require('socket.io')(http),
  session          = require('express-session'),
  mongoose         = require('mongoose'),
  MongoStore       = require('connect-mongo')(session),
  flash            = require('connect-flash'),
  passport         = require('passport'),
  LocalStrategy    = require('passport-local'),
  methodOverride   = require('method-override'),
  User             = require('./models/user'),
  Club             = require('./models/club'),
  Conversation     = require('./models/conversation'),
  ClubConversation = require('./models/club-conversation'),
  Message          = require('./models/message'),
  port             = 8080,
  url              = 'mongodb://localhost/ghost_prod',
  dotenv           = require('dotenv').config();

const cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_ID, 
  api_secret: process.env.API_SECRET,
});

//Requiring routes
const indexRoutes    = require('./routes/index'),
  profileRoutes      = require('./routes/profiles'),
  postRoutes         = require('./routes/posts'),
  commentRoutes      = require('./routes/comments'),
  discussionRoutes   = require('./routes/discussions'),
  conversationRoutes = require('./routes/conversations')(io);


app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(methodOverride('_method'));
app.use(flash());
app.use(bodyParser.json());

app.locals.moment = require('moment');

// Connect to database
mongoose.connect(url, {useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false,
useUnifiedTopology: true}, function(err, client){
  if(err){
    return console.log(Date.now()+' : '+'(app-17)'+JSON.stringify(err, null, 2));
  }
  console.log(Date.now()+' : '+'MongoDB connected...');

  // Connect to Socket.io
  io.on('connection', function(socket){
    // console.log(Date.now()+' : '+'socket: '+ socket.id +' connected');

    socket.on('joinRoom', room =>{
      socket.join(room);
      if(io.sockets.adapter.rooms[room] && io.sockets.adapter.rooms[room].length > 1){
        io.sockets.in(room).emit('someoneJoinedRoom');
      }
      socket.on('disconnect', function(){
        socket.broadcast.to(room).emit('someoneLeftRoom');
      })
      socket.on('typing', function(data){
        socket.broadcast.to(room).emit('typing', data);
      })
      socket.on('notTyping', function(data){
        io.sockets.in(room).emit('notTyping', data);
      })
      socket.on('newConvoReload', function(data){
        socket.broadcast.to(room).emit('newConvoReload', data);
      })
    })
    
    socket.on('joinClubRoom', clubRoom =>{
      socket.join(clubRoom);
      if(io.sockets.adapter.rooms[clubRoom] && io.sockets.adapter.rooms[clubRoom].length > 1){
        io.sockets.in(clubRoom).emit('someoneJoinedClubRoom');
        io.sockets.in(clubRoom).emit('updateClubRoomConnectionsNum', io.sockets.adapter.rooms[clubRoom].length);
      }
      socket.on('disconnect', function(){
        if(io.sockets.adapter.rooms[clubRoom] && io.sockets.adapter.rooms[clubRoom].length > 1){
          socket.broadcast.to(clubRoom).emit('updateClubRoomConnectionsNum', io.sockets.adapter.rooms[clubRoom].length);
        } else{
          socket.broadcast.to(clubRoom).emit('everyoneLeftClubRoom');
          socket.broadcast.to(clubRoom).emit('updateClubRoomConnectionsNum', '');
        }
      })
      socket.on('clubTyping', function(data){
        socket.broadcast.to(clubRoom).emit('clubTyping', data);
      })
      socket.on('notClubTyping', function(data){
        io.sockets.in(clubRoom).emit('notClubTyping', data);
      })
      socket.on('newClubConvoReload', function(data){
        socket.broadcast.to(clubRoom).emit('newClubConvoReload', data);
      })
    })
  });

  http.listen(port, function(){
    console.log(Date.now()+' : '+'socket is listening');
  });
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log(Date.now()+' : '+"clubmate server has started on port "+port+"!!");
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  resave: false,
  store: new MongoStore({mongooseConnection: db})
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
      {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
      //REQUESTS
      let foundUser = await User.findById(req.user._id)
      .populate({path: 'clubInvites',select: 'name avatar avatarId banner'})
      .populate({path: 'friendRequests',select: 'fullName profilePic profilePicId note'})
      .exec();
      res.locals.userClubs = foundUser.userClubs.reverse();
      res.locals.clubUpdates = foundUser.clubUpdates;
      res.locals.clubInviteRequests = foundUser.clubInvites.reverse();
      res.locals.friendRequests = foundUser.friendRequests.reverse();

      var fUCI_50_clubAvatar = []; var fUFR_50_profilePic = []; var fUUC_50_profilePic = []; var fUUCTemp;
      for(var i=0;i<foundUser.clubInvites.length;i++){
        fUCI_50_clubAvatar[i] = cloudinary.url(foundUser.clubInvites[i].avatarId,
        {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
      }
      for(var j=0;j<foundUser.friendRequests.length;j++){
        fUFR_50_profilePic[j] = cloudinary.url(foundUser.friendRequests[j].profilePicId,
        {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
      }
      res.locals.CI_50_clubAvatar = fUCI_50_clubAvatar;
      res.locals.FR_50_profilePic = fUFR_50_profilePic;
    } catch(err){
      console.log(Date.now()+' : '+req.user._id+' => (app-1)request population err:- '+JSON.stringify(err, null, 2));
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
app.use('/', conversationRoutes);