const express   = require('express'),
  router        = express.Router(),
  middleware    = require('../middleware'),
  {audioroomsLobby , newAudioroom} = require('../controllers/audio_rooms');


// Get create story page
router.get('/lobby', middleware.isLoggedIn, audioroomsLobby);
router.post('/newAudioroom' , middleware.isLoggedIn , newAudioroom);

module.exports = router;