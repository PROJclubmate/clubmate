const express   = require('express'),
  router        = express.Router(),
  middleware    = require('../middleware'),
  {audioroomsLobby , postNewAudioroom, joinAudioRoom, getNewAudioRoom,
  getClubAudioRooms, deleteAudioRoom, setUserJamKey } = require('../controllers/audio_rooms');


// Get create story page
router.get('/lobby', middleware.isLoggedIn, audioroomsLobby);

// Post request to make the new audio room
router.post('/clubs/:club_id/audio/create' , middleware.isLoggedIn , postNewAudioroom);

// REST API to get the audio rooms of a specific room
router.get('/clubs/:club_id/audio/rooms', middleware.isLoggedIn, getClubAudioRooms);

// Page to join an already created audio room
router.get('/audio/join/:room_id', middleware.isLoggedIn, joinAudioRoom);

// Post request to delete the audio room in the club
router.post('/audio/delete/:room_id', middleware.isLoggedIn, deleteAudioRoom);

// It sets the public key for the current logged in user
router.post('/audio/setkey', middleware.isLoggedIn, setUserJamKey);


module.exports = router;