const express   = require('express'),
  router        = express.Router(),
  middleware    = require('../middleware'),
  {audioroomsLobby , postNewAudioroom, joinAudioRoom, getNewAudioRoom,
  getClubAudioRooms } = require('../controllers/audio_rooms');


// Get create story page
router.get('/lobby', middleware.isLoggedIn, audioroomsLobby);

// Post request to make the new
router.post('/clubs/:club_id/audio/create' , middleware.isLoggedIn , postNewAudioroom);

// REST API to get the audio rooms of a specific room
router.get('/clubs/:club_id/audio/rooms', middleware.isLoggedIn, getClubAudioRooms);

// Page to join an already created audio room
router.get('/audio/join/:room_id', joinAudioRoom);

module.exports = router;