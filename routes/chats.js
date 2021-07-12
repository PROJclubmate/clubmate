const express   = require('express'),
  router        = express.Router(),
  middleware    = require('../middleware'),
  {environment} = require('../config/env_switch.js'),
  {chatsList, chatsOpen, chatsListClubRooms, chatsListClubRoomOpen, chatsCreateNewRoom, chatsRoom,
  chatsRoomEdit} = require('../controllers/chats');

if(environment === 'dev'){
  var {upload} = require('../config/cloudinary.js');
} else if (environment === 'prod'){
  var {upload} = require('../config/s3.js');
}

// Chat list
router.get('/chats/feed', middleware.isLoggedIn, chatsList);

// Chat list, open a conversation
router.get('/chats/feed/open', middleware.isLoggedIn, chatsOpen);

// Chat - list of rooms in club
router.get('/chats/club_rooms/:club_id', middleware.isLoggedIn, chatsListClubRooms);

// Chat - list of rooms in club, open a conversation
router.get('/chats/club_rooms/:club_id/open', middleware.isLoggedIn, chatsListClubRoomOpen);

// Create new room in club
router.post('/clubs/:club_id/rooms/create', middleware.isLoggedIn, chatsCreateNewRoom);

// Room page
router.get('/clubs/:club_id/rooms/:room_id', middleware.isLoggedIn, chatsRoom);

// Edit partiipants
router.put('/clubs/:club_id/rooms/:room_id/edit', middleware.isLoggedIn, upload.single('inputroomAvatar'), chatsRoomEdit);

module.exports = router;