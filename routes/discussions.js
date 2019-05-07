const express  = require('express'),
  router       = express.Router({mergeParams: true}),
  middleware   = require('../middleware'),
  {discussionsNew, discussionsPagination, discussionsVote} = require('../controllers/discussions');

//	================================	/posts/:post_id/discussions  ====================================

// Start a new discussion in club
router.post('/clubs/:club_id/posts/:post_id/discussions', middleware.isLoggedIn, discussionsNew);

// Navigate pages
router.get('/clubs/:club_id/posts/:post_id/m-sP', middleware.isLoggedIn, discussionsPagination);

// Vote subPosts(AJAX)
router.put('/subposts/:bucket_id/:subpost_id/vote', middleware.isLoggedIn, discussionsVote);

module.exports = router;