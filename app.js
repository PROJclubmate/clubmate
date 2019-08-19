const express      = require('express'),
  app              = express(),
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
      res.locals.clubUpdates = foundUser.clubUpdates;
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
app.use('/', conversationRoutes);


io.on('connection', function(socket){
  // console.log('socket: '+ socket.id +' connected');

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
});


http.listen(port, function(){
  console.log('socket is listening');
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log("GhosTwn server has started on port "+port+"!!");
});

// Connect to database
mongoose.connect(url, {useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false}, function(err, client){
  if(err){
    return console.log('(app-17)'+JSON.stringify(err, null, 2));
  }
  console.log('MongoDB connected...');
});