const express  = require('express'),
  router       = express.Router(),
  middleware   = require('../middleware'),
  {chatsList, chatsOpen, chatsListClubRooms, chatsListClubRoomOpen} = require('../controllers/chats');


// Chat list
router.get('/chats/feed', middleware.isLoggedIn, chatsList);

// Chat list, open a conversation
router.get('/chats/feed/open', middleware.isLoggedIn, chatsOpen);

// Chat - list of rooms in club
router.get('/chats/club_rooms/:club_id', middleware.isLoggedIn, chatsListClubRooms);

// Chat - list of rooms in club, open a conversation
router.get('/chats/club_rooms/:club_id/open', middleware.isLoggedIn, chatsListClubRoomOpen);

module.exports = router;