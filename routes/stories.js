const express   = require('express'),
  router        = express.Router(),
  middleware    = require('../middleware'),
  {storiesEdit, storiesDraft, storiesOptions, storiesPublish, storiesUserGet, storiesClubGet} = require('../controllers/stories');


// Get create story page
router.get('/clubs/:club_id/story/create/edit', middleware.isLoggedIn, storiesEdit);

// Save story image draft(AJAX)
router.post('/clubs/:club_id/story/create/edit', middleware.isLoggedIn, storiesDraft);

// Set story options
router.get('/clubs/:club_id/story/create/options', middleware.isLoggedIn, storiesOptions);

// Publish the story to the database and show it to all users
router.post('/clubs/:club_id/story/create/options', middleware.isLoggedIn, storiesPublish);

// get the story data from API if the user wish to refresh
router.get('/stories/user/:user_id', middleware.isLoggedIn, storiesUserGet);

router.get('/clubs/:club_id/stories', storiesClubGet);

module.exports = router;