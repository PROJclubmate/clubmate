const express   = require('express'),
  router        = express.Router(),
  middleware    = require('../middleware'),
  {audioroomsLobby} = require('../controllers/audio_rooms');


// Get create story page
router.get('/lobby', middleware.isLoggedIn, audioroomsLobby);

module.exports = router;