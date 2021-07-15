const express    = require('express'),
  helmet         = require('helmet'),
  app            = express(),
  bodyParser     = require('body-parser'),
  csrf           = require('csurf'),
  http           = require('http').Server(app),
  io             = require('socket.io')(http),
  cookieSession  = require('cookie-session'),
  mongoose       = require('mongoose'),
  flash          = require('connect-flash'),
  passport       = require('passport'),
  LocalStrategy  = require('passport-local'),
  methodOverride = require('method-override'),
  dotenv         = require('dotenv').config(),
  User           = require('./models/user'),
  clConfig       = require('./config/cloudinary'),
  s3Config       = require('./config/s3'),
  logger         = require('./logger'),
  port           = 8080;

if(process.env.ENVIRONMENT === 'dev'){
  var url = 'mongodb://localhost/ghost_dev';
} else if (process.env.ENVIRONMENT === 'prod'){
  var url = 'mongodb://localhost/ghost_prod';
}


//Requiring routes
const indexRoutes    = require('./routes/index'),
  chatRoutes         = require('./routes/chats'),
  profileRoutes      = require('./routes/profiles'),
  postRoutes         = require('./routes/posts'),
  commentRoutes      = require('./routes/comments'),
  discussionRoutes   = require('./routes/discussions'),
  conversationRoutes = require('./routes/conversations')(io);


// Connect to database
mongoose.connect(url, {useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false,
useUnifiedTopology: true}, function(err, client){
  if(err){
    return logger.error('(app-1) => '+err);
  }
  logger.info('MongoDB connected...');

  // Connect to Socket.io
  io.on('connection', function(socket){
    // logger.info('socket: '+ socket.id +' connected');

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
    logger.info('socket is listening');
  });
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  logger.info('clubmate server has started on port '+port+'!!');
});

app.use(helmet());
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(methodOverride('_method'));
app.use(flash());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(
  cookieSession({
    name: 'ghostSessionId',
    maxAge: 14*24*60*60*1000,
    keys: [process.env.SESSION_SECRET_ONE, process.env.SESSION_SECRET_TWO, process.env.SESSION_SECRET_THREE],
    cookie:{
      secure: true,
      httpOnly: true
    }
  })
);
app.use(csrf());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.locals.moment = require('moment');
app.use(async function(req, res, next){
  res.locals.csrfToken = req.csrfToken();
  res.locals.currentUser = req.user;
  if(req.user){
    try{
      if(process.env.ENVIRONMENT === 'dev'){
        res.locals.CU_50_profilePic = clConfig.cloudinary.url(req.user.profilePicId, clConfig.thumb_100_obj);
      } else if (process.env.ENVIRONMENT === 'prod'){
        res.locals.CU_50_profilePic = s3Config.thumb_100_prefix+req.user.profilePicId;
      }
      //REQUESTS
      let foundUser = await User.findById(req.user._id)
      .populate({path: 'clubInvites',select: 'name avatar avatarId banner'})
      .populate({path: 'friendRequests',select: 'fullName profilePic profilePicId userKeys note'})
      .exec();
      res.locals.userClubs = foundUser.userClubs.sort(function(a, b){
        if(a.clubName < b.clubName) { return -1; }
        if(a.clubName > b.clubName) { return 1; }
        return 0;
      });
      res.locals.clubUpdates = foundUser.clubUpdates;
      res.locals.clubInviteRequests = foundUser.clubInvites.reverse();
      res.locals.friendRequests = foundUser.friendRequests.reverse();

      var fUCI_50_clubAvatar = []; var fUFR_50_profilePic = [];
      for(var i=0;i<foundUser.clubInvites.length;i++){
        if(process.env.ENVIRONMENT === 'dev'){
          fUCI_50_clubAvatar[i] = clConfig.cloudinary.url(foundUser.clubInvites[i].avatarId, clConfig.thumb_100_obj);
        } else if (process.env.ENVIRONMENT === 'prod'){
          fUCI_50_clubAvatar[i] = s3Config.thumb_100_prefix+foundUser.clubInvites[i].avatarId;
        }
      }
      for(var j=0;j<foundUser.friendRequests.length;j++){
        if(process.env.ENVIRONMENT === 'dev'){
          fUFR_50_profilePic[j] = clConfig.cloudinary.url(foundUser.friendRequests[j].profilePicId, clConfig.thumb_100_obj);
        } else if (process.env.ENVIRONMENT === 'prod'){
          fUFR_50_profilePic[j] = s3Config.thumb_100_prefix+foundUser.friendRequests[j].profilePicId;
        }
      }
      res.locals.CI_50_clubAvatar = fUCI_50_clubAvatar;
      res.locals.FR_50_profilePic = fUFR_50_profilePic;
    } catch(err){
      logger.error(req.user._id+' : (app-2) => '+err);
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
app.use('/', chatRoutes);
app.use('/', profileRoutes);
app.use('/', postRoutes);
app.use('/', commentRoutes);
app.use('/', discussionRoutes);
app.use('/', conversationRoutes);