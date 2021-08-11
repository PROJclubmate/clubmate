const express   = require('express'),
  router        = express.Router(),
  middleware    = require('../middleware'),
  {storiesEdit, storiesDraft, storiesOptions} = require('../controllers/stories');


// Get create story page
router.get('/clubs/:club_id/story/create/edit', middleware.isLoggedIn, storiesEdit);

// Save story image draft(AJAX)
router.post('/clubs/:club_id/story/create/edit', middleware.isLoggedIn, storiesDraft);

// Set story options
router.get('/clubs/:club_id/story/create/options', middleware.isLoggedIn, storiesOptions);

module.exports = router;