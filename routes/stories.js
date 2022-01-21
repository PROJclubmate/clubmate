const express = require('express'),
  router = express.Router(),
  middleware = require('../middleware'),
  { storiesEdit, storiesDraft, storiesOptions, storiesPublish, storiesUserGet,
    storiesClubGet, storiesDelete, storySeen, archivesClubGet, storiesClubAlbums } = require('../controllers/stories');


// Get create story page
router.get('/clubs/:club_id/story/create/edit', middleware.isLoggedIn, storiesEdit);

// Save story image draft(AJAX)
router.post('/clubs/:club_id/story/create/edit', middleware.isLoggedIn, storiesDraft);

// Set story options
router.get('/clubs/:club_id/story/create/options', middleware.isLoggedIn, storiesOptions);

// Publish the story to the database and show it to all users
router.post('/clubs/:club_id/story/create/options', middleware.isLoggedIn, storiesPublish);

// To delete the club story
router.post('/clubs/:club_id/story/delete', middleware.isLoggedIn, storiesDelete);

// To mark the story as seen for the logged-in user
router.post('/stories/:story_id/seen', middleware.isLoggedIn, storySeen);

// get the story data from API if the user wish to refresh
router.get('/stories/user/:user_id', middleware.isLoggedIn, storiesUserGet);

// Get all currently available club stories
router.get('/clubs/:club_id/stories', storiesClubGet);

// Get all the club archives
router.get('/clubs/:club_id/archives', archivesClubGet);

// Get all the available album archives of the club
router.get('/clubs/:clubs_id/albums', storiesClubAlbums);


module.exports = router;