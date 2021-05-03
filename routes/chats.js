const express  = require('express'),
  router       = express.Router(),
  middleware   = require('../middleware'),
  {chatsList, chatsListRooms, chatsOpen} = require('../controllers/chats');


// Chat list
router.get('/chats', middleware.isLoggedIn, chatsList);

// Chat list - rooms in clubs
router.get('/chats/rooms', middleware.isLoggedIn, chatsListRooms);

// Chat list open a conversation
router.get('/chats/open', middleware.isLoggedIn, chatsOpen);

module.exports = router;