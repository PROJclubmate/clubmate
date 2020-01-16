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
      {width: 100, height: 100, quality: 90, effect: 'sharpen:35', secure: true, crop: 'fill', format: 'jpg'});
      //REQUESTS
      let foundUser = await User.findById(req.user._id)
      .populate({path: 'clubInvites',select: 'name avatar avatarId banner'})
      .populate({path: 'friendRequests',select: 'fullName profilePic profilePicId note'})
      // NON-PERFORMANT? , match: {'userChats.lastMessage': {$ne: ''}} 2level match does not work?
      .populate({path: 'userChats.userId', select: 'fullName profilePic profilePicId'})
      .exec();
      // check security of theese local variables & check for no variable overwriting
      res.locals.userClubs = foundUser.userClubs.reverse();
      res.locals.clubUpdates = foundUser.clubUpdates;
      res.locals.clubInviteRequests = foundUser.clubInvites.reverse();
      res.locals.friendRequests = foundUser.friendRequests.reverse();
      res.locals.userChats = [];

      var fUCI_50_clubAvatar = []; var fUFR_50_profilePic = []; var fUUC_50_profilePic = []; var fUUCTemp;
      for(var i=0;i<foundUser.clubInvites.length;i++){
        fUCI_50_clubAvatar[i] = cloudinary.url(foundUser.clubInvites[i].avatarId,
        {width: 100, height: 100, quality: 90, effect: 'sharpen:35', secure: true, crop: 'fill', format: 'jpg'});
      }
      for(var j=0;j<foundUser.friendRequests.length;j++){
        fUFR_50_profilePic[j] = cloudinary.url(foundUser.friendRequests[j].profilePicId,
        {width: 100, height: 100, quality: 90, effect: 'sharpen:35', secure: true, crop: 'fill', format: 'jpg'});
      }
      for(var k=0;k<foundUser.userChats.length;k++){
        if(foundUser.userChats[k].lastMessage && foundUser.userChats[k].lastMessage != ''){
          fUUCTemp = cloudinary.url(foundUser.userChats[k].userId.profilePicId,
          {width: 100, height: 100, quality: 90, effect: 'sharpen:35', secure: true, crop: 'fill', format: 'jpg'});
          fUUC_50_profilePic.push(fUUCTemp);
          res.locals.userChats.push(foundUser.userChats[k]);
        }
      }
      res.locals.CI_50_clubAvatar = fUCI_50_clubAvatar;
      res.locals.FR_50_profilePic = fUFR_50_profilePic;
      res.locals.UC_50_profilePic = fUUC_50_profilePic;
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
app.use('/', conversationRoutes);


const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log("clubmate server has started on port "+port+"!!");
});

// Connect to database
mongoose.connect(url, {useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false,
useUnifiedTopology: true}, function(err, client){
  if(err){
    return console.log('(app-17)'+JSON.stringify(err, null, 2));
  }
  console.log('MongoDB connected...');

  // Connect to Socket.io
  io.on('connection', function(socket){
    // console.log('socket: '+ socket.id +' connected');

    // Create function to send status
    sendStatus = function(s){
      socket.emit('status', s);
    }

    socket.on('joinRoom', room =>{
      socket.join(room);
      /* << BUG >> SOCKET EMITING RANDOMLY
      Current exec:- Client side validation
      Desired :- Server side acknowledgement that the msg is sent */
      // msgStatus = function(s){
      //   socket.emit('status', s);
      // }
      // Join a room and then broadcast
      socket.on('userOnline', function(data){
        socket.broadcast.to(room).emit('userOnline', data);
      })
      socket.on('userOffline', function(data){
        socket.broadcast.to(room).emit('userOffline', data);
      })
      socket.on('typing', function(data){
        socket.broadcast.to(room).emit('typing', data);
      })
    })
    
    socket.on('joinClubRoom', clubRoom =>{
      socket.join(clubRoom);
      // clubMsgStatus = function(s){
      //   socket.emit('clubStatus', s);
      // }
      socket.on('clubTyping', function(data){
        socket.broadcast.to(clubRoom).emit('clubTyping', data);
      })
    })
  });

  http.listen(port, function(){
    console.log('socket is listening');
  });
});