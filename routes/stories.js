const express = require('express'),
  router      = express.Router(),
  middleware  = require('../middleware');

const {
  storiesFormat,
  storiesTextEdit,
  storiesImageEdit,
  storiesSaveDraft,
  storiesOptions,
  storiesPublish,
  storiesUserGet,
  storiesClubGet,
  storiesDelete,
  storySeen,
  archivesClubGet,
  storiesClubAlbums
} = require('../controllers/stories');


// Get page to select the format of stories
router.get('/clubs/:club_id/story/create', middleware.isLoggedIn, storiesFormat);

// Get text editor page
router.get('/clubs/:club_id/story/create/text', middleware.isLoggedIn, storiesTextEdit);

// Get image editor page
router.get('/clubs/:club_id/story/create/image', middleware.isLoggedIn, storiesImageEdit);

// Save story image draft(AJAX)
router.post('/clubs/:club_id/story/create/draft', middleware.isLoggedIn, storiesSaveDraft);

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

router.get('/audiotest', function(req, res, next) {
  res.render('audio_test');
});

module.exports = router;