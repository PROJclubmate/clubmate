const express   = require('express'),
  router        = express.Router(),
  middleware    = require('../middleware'),
  {audioroomsLobby , newAudioroom, joinAudioRoom} = require('../controllers/audio_rooms');


// Get create story page
router.get('/lobby', middleware.isLoggedIn, audioroomsLobby);
router.post('/clubs/:club_id/audio/newroom' , middleware.isLoggedIn , newAudioroom);

router.get('/audio/join/:room_id', joinAudioRoom);

module.exports = router;